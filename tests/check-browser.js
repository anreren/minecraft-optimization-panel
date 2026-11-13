// Browser checks (puppeteer): page errors, translations, generated config files,
// JVM argument logic, persistence, and regressions of bugs fixed before.
// Run: node tests/check-browser.js        (CHROME_PATH can point to a Chrome binary)
const fs = require('fs');
const os = require('os');
const path = require('path');
const puppeteer = require('puppeteer');

const URL = 'file://' + path.join(__dirname, '..', 'index.html');
const ARGS_FILE = path.join(os.tmpdir(), 'mcopt-args.json');
const errors = [];
const fail = (msg) => errors.push(msg);
const check = (cond, msg) => { if (!cond) fail(msg); };

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function keysDeep(obj, prefix = '') {
  return Object.entries(obj).flatMap(([k, v]) =>
    v && typeof v === 'object' ? keysDeep(v, prefix + k + '.') : [prefix + k]);
}

// Minimal format checks for the generated config files
function validateConfig(tab, filePath, code) {
  const out = [];
  const text = code.trim();
  if (!text) return ['empty output'];
  if (text.startsWith('{')) {
    try { JSON.parse(text); } catch (e) { out.push('invalid JSON: ' + e.message); }
  } else if (/\.toml/.test(filePath) && tab !== 'driver') {
    text.split('\n').forEach((line, i) => {
      const l = line.trim();
      if (!l || l.startsWith('#')) return;
      if (/^\[[\w.\-"]+\]$/.test(l)) return;
      if (/^[\w.\-"]+\s*=\s*\S.*$/.test(l)) return;
      out.push(`TOML-like syntax error on line ${i + 1}: ${l.slice(0, 60)}`);
    });
  } else if (/\.properties/.test(filePath)) {
    text.split('\n').forEach((line, i) => {
      const l = line.trim();
      if (!l || l.startsWith('#')) return;
      if (!/^[\w.\-]+\s*=\s*\S*$/.test(l)) out.push(`properties syntax error on line ${i + 1}: ${l.slice(0, 60)}`);
    });
  }
  return out;
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: process.env.CHROME_PATH || undefined,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  const pageErrors = [];
  const open = async (url = URL) => {
    const page = await browser.newPage();
    page.on('pageerror', (e) => { if (!/tailwind/i.test(e.message)) pageErrors.push(e.message); });
    await page.goto(url, { waitUntil: 'domcontentloaded' });
    await sleep(800);
    return page;
  };
  const page = await open();
  const sel = (id, v) => page.select('#' + id, v);
  const ev = (fn, ...a) => page.evaluate(fn, ...a);

  // ---- 1. Translations -------------------------------------------------------
  const i18nKeys = await ev(() => ({ pt: Object.keys(i18n.pt), en: Object.keys(i18n.en) }));
  const ptDeep = await ev(() => JSON.stringify(i18n.pt, (k, v) => (typeof v === 'function' ? 'fn' : v)));
  const enDeep = await ev(() => JSON.stringify(i18n.en, (k, v) => (typeof v === 'function' ? 'fn' : v)));
  const pt = keysDeep(JSON.parse(ptDeep)), en = keysDeep(JSON.parse(enDeep));
  pt.filter((k) => !en.includes(k)).forEach((k) => fail(`i18n: key "${k}" missing in EN`));
  en.filter((k) => !pt.includes(k)).forEach((k) => fail(`i18n: key "${k}" missing in PT`));
  const badOptions = await ev(() => [...document.querySelectorAll('option')].filter((o) => o.hasAttribute('data-pt') !== o.hasAttribute('data-en')).map((o) => o.value));
  badOptions.forEach((v) => fail(`option "${v}" has only one of data-pt / data-en`));

  // Static HTML text must not drift from i18n: the page applies the language when it opens
  const drift = await ev(() => {
    const camel = (id) => id.replace(/^i18n-/, '').replace(/-([a-z0-9])/g, (m, c) => c.toUpperCase());
    return [...document.querySelectorAll('[id^="i18n-"]')]
      .map((el) => [el.id, el.textContent.trim(), i18n[state.lang][camel(el.id)]])
      .filter(([id, text, val]) => typeof val === 'string' && !/[<>]/.test(val) && text && text !== val.trim() && !/(graal-pill|chk-lp|skip)$/.test(id))
      .slice(0, 5).map(([id, text, val]) => `${id}: "${text.slice(0, 40)}" != "${val.slice(0, 40)}"`);
  });
  drift.forEach((d) => fail('i18n drift on load: ' + d));

  // ---- 2. Regressions of fixed bugs ------------------------------------------
  const sliderMax = await ev(() => document.getElementById('ram-slider').max);
  check(sliderMax === '30', `RAM slider max at load should be 30 for 32 GB, got ${sliderMax}`);
  await sel('select-sys-ram', '8');
  const low = await ev(() => ({ alloc: state.allocRamGB, warn: !document.getElementById('ram-warning-banner').classList.contains('hidden') }));
  check(!low.warn, '8 GB: the default profile should not trigger the RAM warning');
  await sel('select-sys-ram', '32');
  check((await ev(() => state.allocRamGB)) === 12, 'going 32 -> 8 -> 32 GB should restore the heavy profile (12 GB)');

  // ---- 3. Generated config files over a hardware / loader / OS matrix ---------
  const hardware = [
    ['r5_5500', 'rtx_3050_6_desk'], ['i5_12400f', 'igpu_auto'], ['xeon_2699v4', 'rx_580'],
    ['r7_6800h', 'rtx_4060_lap'], ['r5_5600g', 'igpu_auto'], ['m2', 'igpu_auto'],
  ];
  const loaders = await ev(() => [...document.getElementById('select-loader').options].map((o) => o.value));
  const tabs = ['modernfix', 'embeddium', 'ferrite', 'entityculling', 'immediatelyfast', 'badopt', 'radium', 'loader', 'driver'];
  let configChecks = 0;
  for (const [cpu, gpu] of hardware) {
    for (const os_ of ['windows', 'linux']) {
      if (cpu === 'm2' && os_ !== 'windows') continue; // Apple chips force macOS
      await sel('select-os', os_);
      await sel('select-cpu', cpu);
      await sel('select-gpu', gpu);
      for (const loader of loaders) {
        await sel('select-loader', loader);
        for (const tab of tabs) {
          const res = await ev((t) => { selectConfigTab(t); return { p: document.getElementById('cfg-file-path').textContent, c: document.getElementById('cfg-code-output').textContent }; }, tab);
          configChecks++;
          validateConfig(tab, res.p, res.c).forEach((m) => fail(`config "${tab}" (${cpu}/${gpu}/${loader}/${os_}): ${m}`));
        }
      }
    }
  }
  await sel('select-os', 'windows'); await sel('select-cpu', 'r5_5500'); await sel('select-gpu', 'rtx_3050_6_desk'); await sel('select-loader', 'forge');

  // ---- 4. JVM argument logic over engine / Java / OS --------------------------
  const matrix = [];
  for (const os_ of ['windows', 'linux']) {
    for (const eng of ['graal_zgc', 'graal_g1', 'temurin_zgc', 'temurin_g1']) {
      for (const jv of ['17', '21', '23']) {
        for (const lp of [false, true]) {
          if (lp && os_ === 'windows') continue;
          await sel('select-os', os_);
          await sel('select-java-version', jv);
          await ev((e, l) => {
            state.jvmEngineManual = true;
            document.getElementById('select-jvm-engine').value = e;
            const c = document.getElementById('chk-large-pages');
            if (c.checked !== l) c.click();
            onHardwareChange();
          }, eng, lp);
          const args = await ev(() => document.getElementById('jvm-args-box').textContent);
          matrix.push({ os: os_, eng, jv, lp, args });
          const zgc = eng.endsWith('_zgc'), graal = eng.startsWith('graal');
          const tag = `${os_}/${eng}/java${jv}/lp=${lp}`;
          check(args.includes('ZGenerational') === (zgc && jv === '21'), `${tag}: ZGenerational only with ZGC on Java 21`);
          check(args.includes('-Dgraal.') === (eng === 'graal_g1' && jv !== '23'), `${tag}: -Dgraal.* only on Graal + G1 below Java 23`);
          check(args.includes('UseJVMCICompiler') === (eng === 'graal_g1'), `${tag}: JVMCI flags only on Graal + G1 (ZGC disables JVMCI)`);
          check(args.includes('UseTransparentHugePages') === (os_ === 'linux' && lp), `${tag}: THP only on Linux when enabled`);
          check(!args.includes('UseAVX'), `${tag}: UseAVX must not be emitted`);
          check(zgc ? args.includes('-XX:+UseZGC') : args.includes('-XX:+UseG1GC'), `${tag}: GC flag does not match the engine`);
        }
      }
    }
  }
  fs.writeFileSync(ARGS_FILE, JSON.stringify(matrix));
  await sel('select-os', 'windows'); await sel('select-java-version', '21');
  await ev(() => { state.jvmEngineManual = false; document.getElementById('select-jvm-engine').value = 'graal_zgc'; if (document.getElementById('chk-large-pages').checked) document.getElementById('chk-large-pages').click(); onHardwareChange(); });

  // ---- 5. Launcher / -Xmx handling ------------------------------------------
  for (const [launcher, expectXmx] of [['prism', false], ['curseforge', false], ['modrinth', false], ['atlauncher', false], ['vanilla', true]]) {
    await sel('select-launcher', launcher);
    const has = (await ev(() => document.getElementById('jvm-args-box').textContent)).includes('-Xmx');
    check(has === expectXmx, `launcher ${launcher}: -Xms/-Xmx in the line should be ${expectXmx}`);
  }
  await sel('select-launcher', 'prism');

  // ---- 6. Persistence round trip ---------------------------------------------
  await sel('select-cpu', 'xeon_2680v4'); await sel('select-gpu', 'rx_580'); await sel('select-mem-channels', '1');
  await sel('select-os', 'linux'); await sel('select-launcher', 'vanilla'); await sel('select-java-version', '23');
  const snap = (p) => p.evaluate(() => JSON.stringify({ cpu: state.cpuKey, gpu: state.gpuKey, ram: state.sysRamGB, ch: state.memChannels, java: state.javaVersion, os: state.os, l: state.launcher, alloc: state.allocRamGB, eng: state.jvmEngine, args: document.getElementById('jvm-args-box').textContent }));
  const before = await snap(page);
  const hash = await ev(() => location.hash);
  const viaLink = await open(URL + hash);
  check((await snap(viaLink)) === before, 'persistence: restoring from the share link changed the configuration');
  const viaStorage = await open(URL);
  check((await snap(viaStorage)) === before, 'persistence: restoring from localStorage changed the configuration');
  const tampered = await open(URL + '#c=%3Cscript%3E&g=nope&r=999&f=DDR9_1&a=abc&p=hack&lg=xx');
  check(await tampered.evaluate(() => state.cpuKey === 'r5_5500' && state.sysRamGB === 32), 'persistence: a tampered link must fall back to defaults');

  // ---- 7. Apple Silicon / macOS ------------------------------------------------
  const apple = await open(URL + '#');
  await apple.evaluate(() => { localStorage.removeItem('mcopt:config:v1'); });
  await apple.select('#select-cpu', 'm3');
  const mac = await apple.evaluate(() => ({ os: state.os, gpu: state.gpuKey, lock: document.getElementById('select-gpu').disabled, lp: document.getElementById('chk-large-pages').disabled }));
  check(mac.os === 'macos' && mac.gpu === 'igpu_auto' && mac.lock && mac.lp, 'Apple chip should force macOS, the iGPU and lock the GPU / large pages controls');
  await apple.select('#select-os', 'windows');
  check(await apple.evaluate(() => !cpuDatabase[state.cpuKey].apple), 'switching an Apple setup to Windows should restore a non-Apple CPU');
  await apple.evaluate(() => localStorage.removeItem('mcopt:config:v1'));
  await page.evaluate(() => localStorage.removeItem('mcopt:config:v1'));

  // ---- 7b. Engine badges follow the generated engine ----------------------------
  const badges = await ev(() => {
    const out = {};
    for (const [eng, jv] of [['graal_g1', '21'], ['graal_zgc', '21'], ['temurin_g1', '17']]) {
      state.jvmEngineManual = true;
      document.getElementById('select-jvm-engine').value = eng;
      document.getElementById('select-java-version').value = jv;
      state.javaVersion = jv;
      onHardwareChange();
      out[eng] = { pill: document.getElementById('i18n-graal-pill').textContent, badge: document.getElementById('header-engine-badge').textContent };
    }
    return out;
  });
  check(/Graal JIT ativo/.test(badges.graal_g1.pill), 'badge: Graal + G1 should say the Graal JIT is active');
  check(!/Graal/.test(badges.graal_zgc.pill) && !/Graal/.test(badges.temurin_g1.pill), 'badge: engines without the Graal JIT must not claim it');
  check(/Temurin 17/.test(badges.temurin_g1.badge.replace('OpenJDK / Temurin 17', 'Temurin 17')), 'badge: header should show the selected Java version');
  await ev(() => { state.jvmEngineManual = false; document.getElementById('select-java-version').value = '21'; state.javaVersion = '21'; });

  // ---- 8. Accessibility (structure only: does not depend on the CSS) -----------
  const a11yPage = await open();
  const a11y = await a11yPage.evaluate(() => {
    const nameOf = (el) => {
      const al = el.getAttribute('aria-label'); if (al) return al;
      const lb = el.getAttribute('aria-labelledby');
      if (lb) { const x = lb.split(/\s+/).map((i) => (document.getElementById(i) || {}).textContent || '').join(' ').trim(); if (x) return x; }
      if (el.labels && el.labels.length) { const x = [...el.labels].map((l) => l.textContent).join(' ').trim(); if (x) return x; }
      const wl = el.closest('label'); if (wl && wl.textContent.trim()) return wl.textContent.trim();
      return (el.innerText || '').trim() || el.getAttribute('title') || '';
    };
    const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const inter = [...document.querySelectorAll('a[href],button,input,select,textarea,summary,[role=button],[role=tab],[onclick]')].filter(shown);
    const okTags = ['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY', 'LABEL'];
    const res = {
      noName: inter.filter((e) => !nameOf(e)).map((e) => e.outerHTML.slice(0, 80)),
      fakeButtons: [...document.querySelectorAll('[onclick]')].filter((e) => !okTags.includes(e.tagName) && !e.getAttribute('role') && e.tabIndex < 0).map((e) => e.outerHTML.slice(0, 80)),
      skip: !!document.querySelector('#skip-link[href="#main-content"]') && !!document.getElementById('main-content'),
      toast: document.getElementById('toast').getAttribute('aria-live'),
      alert: document.getElementById('ram-warning-banner').getAttribute('role'),
      tabs: document.querySelectorAll('.ctab-btn[role=tab]').length,
      tabsSelected: document.querySelectorAll('.ctab-btn[aria-selected=true]').length,
      iconsNotHidden: [...document.querySelectorAll('i[class*="fa-"]')].filter((i) => i.getAttribute('aria-hidden') !== 'true').length,
      sliderLabel: !!document.getElementById('ram-slider').getAttribute('aria-label'),
    };
    selectConfigTab('embeddium');
    res.tabAfter = document.getElementById('ctab-embeddium').getAttribute('aria-selected') + '/' + document.getElementById('cfg-tabpanel').getAttribute('aria-labelledby');
    document.getElementById('cfg-tablist').dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    res.tabArrow = document.querySelector('.ctab-btn[aria-selected=true]').id;
    selectModpackProfile('medium');
    res.profilesPressed = document.querySelectorAll('.profile-card[aria-pressed=true]').length + '/' + document.getElementById('profile-medium').getAttribute('aria-pressed');
    setLanguage('en');
    res.langEn = document.documentElement.lang + '/' + document.getElementById('lang-btn-en').getAttribute('aria-pressed') + '/' + document.getElementById('lang-btn-pt').getAttribute('aria-pressed');
    res.skipText = document.getElementById('i18n-skip').textContent;
    return res;
  });
  a11y.noName.forEach((h) => fail(`a11y: control without accessible name: ${h}`));
  a11y.fakeButtons.forEach((h) => fail(`a11y: clickable element that is not a button: ${h}`));
  check(a11y.skip, 'a11y: skip link and #main-content must exist');
  check(a11y.toast === 'polite', 'a11y: the toast must be an aria-live region');
  check(a11y.alert === 'alert', 'a11y: the RAM warning must have role="alert"');
  check(a11y.tabs === 9 && a11y.tabsSelected === 1, `a11y: config tabs need role=tab and exactly one selected (got ${a11y.tabs}/${a11y.tabsSelected})`);
  check(a11y.tabAfter === 'true/ctab-embeddium', `a11y: selecting a tab must update aria-selected and the panel label (got ${a11y.tabAfter})`);
  check(a11y.tabArrow === 'ctab-ferrite', `a11y: ArrowRight should move to the next tab (got ${a11y.tabArrow})`);
  check(a11y.profilesPressed === '1/true', `a11y: exactly one RAM profile should be aria-pressed (got ${a11y.profilesPressed})`);
  check(a11y.langEn === 'en-US/true/false', `a11y: language switch must update <html lang> and aria-pressed (got ${a11y.langEn})`);
  check(a11y.skipText === 'Skip to content', 'a11y: the skip link must be translated');
  check(a11y.iconsNotHidden === 0, `a11y: ${a11y.iconsNotHidden} decorative icon(s) without aria-hidden`);
  check(a11y.sliderLabel, 'a11y: the RAM slider needs an aria-label');

  check(pageErrors.length === 0, 'page errors: ' + pageErrors.join(' | '));
  await browser.close();

  if (errors.length) {
    console.error(`check-browser: ${errors.length} problem(s)`);
    errors.slice(0, 40).forEach((e) => console.error(' - ' + e));
    process.exit(1);
  }
  console.log(`check-browser: OK (${configChecks} config files, ${matrix.length} JVM argument sets, ${pt.length} translated keys)`);
})().catch((e) => { console.error(e); process.exit(1); });
