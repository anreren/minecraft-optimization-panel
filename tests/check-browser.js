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

// Per-mod schema and syntax checks for all generated config files
function checkKeys(actual, required, allowed, banned, label, out) {
  const act = new Set(actual), req = new Set(required), all = new Set([...required, ...(allowed || [])]);
  for (const k of req) if (!act.has(k)) out.push(`${label}: missing required key "${k}"`);
  for (const k of act) {
    if (banned && banned.includes(k)) out.push(`${label}: banned/obsolete key "${k}" present`);
    else if (!all.has(k)) out.push(`${label}: unexpected key "${k}"`);
  }
}

function parseKV(text, re, label, out) {
  const map = Object.create(null);
  text.split('\n').forEach((line, i) => {
    const l = line.trim();
    if (!l || l.startsWith('#')) return;
    const m = l.match(re);
    if (!m) return out.push(`${label}: syntax error on line ${i + 1}: ${l.slice(0, 60)}`);
    if (m[1] in map) out.push(`${label}: duplicate key "${m[1]}" on line ${i + 1}`);
    map[m[1]] = m[2].trim();
  });
  return map;
}

function parseToml(text, label, out) {
  const sections = { '': Object.create(null) };
  let cur = '';
  text.split('\n').forEach((line, i) => {
    const l = line.trim();
    if (!l || l.startsWith('#')) return;
    const sec = l.match(/^\[([\w.\-"]+)\]$/) || null;
    if (sec) {
      cur = sec[1];
      if (!sections[cur]) sections[cur] = Object.create(null);
      return;
    }
    const kv = l.match(/^([\w.\-"]+)\s*=\s*(\S.*)$/);
    if (!kv) return out.push(`${label}: TOML syntax error on line ${i + 1}: ${l.slice(0, 60)}`);
    if (kv[1] in sections[cur]) out.push(`${label}: duplicate TOML key "[${cur}].${kv[1]}"`);
    sections[cur][kv[1]] = kv[2].trim();
  });
  return sections;
}

const isBoolStr = (v) => v === 'true' || v === 'false';
const isPosIntStr = (v) => /^\d+$/.test(v) && Number(v) >= 1;
const isStrArray = (v) => Array.isArray(v) && v.length > 0 && v.every((x) => typeof x === 'string');

function validateJsonObj(tab, obj, spec, out) {
  checkKeys(Object.keys(obj), Object.keys(spec.fields), [], spec.banned || [], tab, out);
  for (const [k, checkFn] of Object.entries(spec.fields)) {
    if (k in obj && !checkFn(obj[k])) out.push(`${tab}: invalid value for "${k}": ${JSON.stringify(obj[k])}`);
  }
}

function validateConfig(tab, filePath, code, { loader, mcVersion }) {
  const out = [];
  const text = code.trim();
  if (!text) return ['empty output'];
  const expectSodium = loader === 'fabric' || (loader === 'neoforge' && mcVersion.startsWith('1.21'));

  if (tab === 'modernfix') {
    if (filePath !== 'config/modernfix-mixins.properties') out.push(`unexpected filePath "${filePath}"`);
    const kv = parseKV(text, /^([\w.\-]+)\s*=\s*(\S+)$/, tab, out);
    checkKeys(Object.keys(kv),
      ['mixin.perf.dynamic_resources', 'mixin.perf.faster_item_rendering', 'mixin.perf.compact_bit_storage'],
      ['mixin.perf.remove_spawn_chunks'],
      ['mixin.bugfix.packet_leak', 'mixin.perf.dynamic_entity_renderers', 'mixin.perf.clear_mixin_classinfo',
       'mixin.perf.deduplicate_location', 'mixin.perf.deduplicate_climate_parameters', 'mixin.feature.remove_chat_signing'],
      tab, out);
    Object.entries(kv).forEach(([k, v]) => { if (!isBoolStr(v)) out.push(`${tab}: "${k}" must be boolean, got ${v}`); });
    return out;
  }

  if (tab === 'embeddium') {
    const expPath = expectSodium ? 'config/sodium-options.json' : 'config/embeddium-options.json';
    if (filePath !== expPath) out.push(`expected "${expPath}", got "${filePath}"`);
    let obj; try { obj = JSON.parse(text); } catch (e) { return ['invalid JSON: ' + e.message]; }
    checkKeys(Object.keys(obj), ['quality', 'performance', 'advanced'], [], [], tab, out);
    if (obj.quality) validateJsonObj('embeddium.quality', obj.quality, { fields: {
      leaves_quality: (v) => ['FAST', 'DEFAULT', 'FANCY'].includes(v), enable_vignette: (v) => typeof v === 'boolean',
    } }, out);
    if (obj.performance) validateJsonObj('embeddium.performance', obj.performance, { fields: {
      chunk_builder_threads: (v) => Number.isInteger(v) && v >= 0,
      always_defer_chunk_updates_v2: (v) => typeof v === 'boolean',
      animate_only_visible_textures: (v) => typeof v === 'boolean',
      use_entity_culling: (v) => typeof v === 'boolean',
      use_fog_occlusion: (v) => typeof v === 'boolean',
      use_block_face_culling: (v) => typeof v === 'boolean',
      use_no_error_g_l_context: (v) => typeof v === 'boolean',
    } }, out);
    if (obj.advanced) validateJsonObj('embeddium.advanced', obj.advanced, { fields: {
      enable_memory_tracing: (v) => typeof v === 'boolean',
      use_advanced_staging_buffers: (v) => typeof v === 'boolean',
      cpu_render_ahead_limit: (v) => Number.isInteger(v) && v >= 0 && v <= 9,
    } }, out);
    return out;
  }

  if (tab === 'ferrite') {
    const isFabric = loader === 'fabric';
    const hasDataComp = mcVersion === '1.20.6' || mcVersion.startsWith('1.21');
    const expPath = isFabric ? 'config/ferritecore.mixin.properties' : 'config/ferritecore-mixin.toml';
    if (filePath !== expPath) out.push(`expected "${expPath}", got "${filePath}"`);
    let kv;
    if (isFabric) {
      kv = parseKV(text, /^([\w.\-]+)\s*=\s*(\S+)$/, tab, out);
    } else {
      const toml = parseToml(text, tab, out);
      if (Object.keys(toml).length > 1) out.push('ferrite TOML should not contain [section] headers');
      kv = toml[''];
    }
    const baseKeys = [
      'compactFastMap', 'useSmallThreadingDetector', 'cacheMultipartPredicates', 'multipartDeduplication',
      'blockstateCacheDeduplication', 'modelResourceLocations', 'modelSides', 'replaceNeighborLookup',
      'populateNeighborTable', 'replacePropertyMap', 'bakedQuadDeduplication',
    ];
    if (hasDataComp) baseKeys.push('dataComponentPatch');
    checkKeys(Object.keys(kv), baseKeys, [], hasDataComp ? [] : ['dataComponentPatch'], tab, out);
    Object.entries(kv).forEach(([k, v]) => { if (!isBoolStr(v)) out.push(`${tab}: "${k}" must be boolean, got ${v}`); });
    if (kv.useSmallThreadingDetector !== 'false') out.push('ferrite: useSmallThreadingDetector must be false');
    if (kv.populateNeighborTable !== 'false') out.push('ferrite: populateNeighborTable must be false');
    return out;
  }

  if (tab === 'immediatelyfast') {
    if (filePath !== 'config/immediatelyfast.json') out.push(`unexpected filePath "${filePath}"`);
    let obj; try { obj = JSON.parse(text); } catch (e) { return ['invalid JSON: ' + e.message]; }
    validateJsonObj(tab, obj, {
      banned: ['dont_add_prod_info_to_crash_reports'],
      fields: {
        font_atlas_resizing: (v) => typeof v === 'boolean',
        map_atlas_generation: (v) => typeof v === 'boolean',
        hud_batching: (v) => typeof v === 'boolean',
        fast_text_lookup: (v) => typeof v === 'boolean',
        fast_buffer_upload: (v) => typeof v === 'boolean',
        dont_add_info_into_debug_hud: (v) => v === false,
        experimental_screen_batching: (v) => v === false,
        experimental_sign_text_buffering: (v) => v === false,
      },
    }, out);
    return out;
  }

  if (tab === 'entityculling') {
    if (filePath !== 'config/entityculling.json') out.push(`unexpected filePath "${filePath}"`);
    let obj; try { obj = JSON.parse(text); } catch (e) { return ['invalid JSON: ' + e.message]; }
    validateJsonObj(tab, obj, {
      banned: ['skipHiddenEntityRendering', 'skipHiddenBlockEntityRendering', 'skipMarkerArmorStands', 'entityTickWhitelist'],
      fields: {
        configVersion: (v) => v === 9,
        safeMode: (v) => typeof v === 'boolean',
        renderNametagsThroughWalls: (v) => typeof v === 'boolean',
        blockEntityWhitelist: isStrArray,
        entityWhitelist: isStrArray,
        tracingDistance: (v) => Number.isInteger(v) && v >= 1,
        debugMode: (v) => typeof v === 'boolean',
        sleepDelay: (v) => Number.isInteger(v) && v >= 1,
        hitboxLimit: (v) => Number.isInteger(v) && v >= 1,
        captureRate: (v) => Number.isInteger(v) && v >= 1,
        tickCulling: (v) => typeof v === 'boolean',
        tickCullingWhitelist: (v) => isStrArray(v) && ['minecraft:boat', 'minecraft:block_display', 'create:contraption'].every((e) => v.includes(e)),
        disableF3: (v) => typeof v === 'boolean',
        skipEntityCulling: (v) => typeof v === 'boolean',
        skipBlockEntityCulling: (v) => typeof v === 'boolean',
        blockEntityFrustumCulling: (v) => typeof v === 'boolean',
        forceDisplayCulling: (v) => typeof v === 'boolean',
        solidLeaves: (v) => typeof v === 'boolean',
      },
    }, out);
    return out;
  }

  if (tab === 'badopt') {
    if (filePath !== 'config/badoptimizations.txt') out.push(`unexpected filePath "${filePath}"`);
    const kv = parseKV(text, /^([\w.\-]+)\s*:\s*(\S+)$/, tab, out);
    const boolKeys = [
      'ignore_mod_incompatibilities', 'ignore_mod_cache_hooks', 'log_config',
      'enable_lightmap_caching', 'enable_sky_color_caching', 'enable_debug_renderer_disable_if_not_needed',
      'enable_particle_manager_optimization', 'enable_toast_optimizations',
      'enable_sky_angle_caching_in_worldrenderer', 'enable_entity_renderer_caching',
      'enable_block_entity_renderer_caching', 'enable_entity_flag_caching',
      'enable_remove_redundant_fov_calculations', 'enable_remove_tutorial_if_not_demo', 'show_f3_text',
    ];
    const req = ['config_version', 'lightmap_time_change_needed_for_update', 'skycolor_time_change_needed_for_update', ...boolKeys];
    checkKeys(Object.keys(kv), req, [], ['sky_color_time_change_needed_for_update'], tab, out);
    if (kv.config_version !== '6') out.push(`badopt: expected config_version 6, got ${kv.config_version}`);
    if (!isPosIntStr(kv.lightmap_time_change_needed_for_update || '')) out.push('badopt: lightmap_time_change_needed_for_update must be positive int');
    if (!isPosIntStr(kv.skycolor_time_change_needed_for_update || '')) out.push('badopt: skycolor_time_change_needed_for_update must be positive int');
    boolKeys.forEach((k) => { if (k in kv && !isBoolStr(kv[k])) out.push(`badopt: "${k}" must be boolean, got ${kv[k]}`); });
    return out;
  }

  if (tab === 'radium') {
    if (expectSodium && filePath !== 'config/lithium.properties') out.push(`expected config/lithium.properties, got "${filePath}"`);
    if (!expectSodium && !filePath.startsWith('config/radium.properties')) out.push(`expected config/radium.properties*, got "${filePath}"`);
    const kv = parseKV(text, /^([\w.\-]+)\s*=\s*(\S*)$/, tab, out);
    if (Object.keys(kv).length > 0) out.push(`radium/lithium should not emit active overrides: ${Object.keys(kv).join(', ')}`);
    const commentLines = text.split('\n').map((l) => l.trim()).filter((l) => l.startsWith('#'));
    if (!commentLines.some((l) => l.includes('mixin.'))) out.push('radium/lithium should keep commented # mixin.* troubleshooting examples');
    return out;
  }

  if (tab === 'loader') {
    if (loader === 'fabric') {
      if (!filePath.startsWith('config/c2me.toml')) out.push(`expected config/c2me.toml*, got "${filePath}"`);
      const s = parseToml(text, 'c2me', out);
      checkKeys(Object.keys(s['']), ['version', 'globalExecutorParallelism'], [], ['maxConcurrentTasks'], 'c2me.root', out);
      if (s[''].version !== '3') out.push(`c2me: expected version = 3, got ${s[''].version}`);
      if (!isPosIntStr(s[''].globalExecutorParallelism || '')) out.push('c2me: globalExecutorParallelism must be positive int');
      const is121 = mcVersion.startsWith('1.21');
      if (is121) {
        checkKeys(Object.keys(s), ['', 'ioSystem', 'chunkSystem', 'vanillaWorldGenOptimizations'], [], ['threadedWorldGen'], 'c2me.sections', out);
        if (s.ioSystem) checkKeys(Object.keys(s.ioSystem), ['gcFreeChunkSerializer'], [], ['async', 'chunkStreamVersion'], 'c2me.ioSystem', out);
        if (s.chunkSystem) checkKeys(Object.keys(s.chunkSystem), ['asyncSerialization', 'recoverFromErrors', 'allowPOIUnloading'], [], [], 'c2me.chunkSystem', out);
        if (s.vanillaWorldGenOptimizations) checkKeys(Object.keys(s.vanillaWorldGenOptimizations), ['optimizeAquifer', 'useEndBiomeCache', 'optimizeStructureWeightSampler', 'useDensityFunctionCompiler'], [], [], 'c2me.wg', out);
      } else {
        checkKeys(Object.keys(s), ['', 'ioSystem', 'threadedWorldGen', 'vanillaWorldGenOptimizations'], [], ['chunkSystem'], 'c2me.sections', out);
        if (s.ioSystem) {
          checkKeys(Object.keys(s.ioSystem), ['async', 'chunkStreamVersion', 'gcFreeChunkSerializer'], [], [], 'c2me.ioSystem', out);
          if (!/^(?:-1|[123])$/.test(s.ioSystem.chunkStreamVersion || '')) out.push(`c2me: chunkStreamVersion must be int (-1..3), got ${s.ioSystem.chunkStreamVersion}`);
        }
        if (s.threadedWorldGen) checkKeys(Object.keys(s.threadedWorldGen), ['enabled', 'allowThreadedFeatures', 'reduceLockRadius'], [], [], 'c2me.twg', out);
        if (s.vanillaWorldGenOptimizations) checkKeys(Object.keys(s.vanillaWorldGenOptimizations), ['optimizeAquifer', 'useEndBiomeCache'], [], ['useDensityFunctionCompiler', 'optimizeStructureWeightSampler'], 'c2me.wg', out);
      }
      if (!s.ioSystem || s.ioSystem.gcFreeChunkSerializer !== 'false') out.push('c2me: gcFreeChunkSerializer must be false');
      return out;
    }

    const checkFml = (fmlText) => {
      const fml = parseToml(fmlText, 'fml', out);
      checkKeys(Object.keys(fml), [''], [], [], 'fml.sections', out);
      checkKeys(Object.keys(fml['']), ['earlyWindowControl', 'maxThreads', 'versionCheck', 'defaultConfigPath'], [], [], 'fml', out);
      if (fml[''].earlyWindowControl !== 'true' || fml[''].versionCheck !== 'false') out.push('fml: unexpected earlyWindowControl or versionCheck');
      if (!isPosIntStr(fml[''].maxThreads || '')) out.push('fml: maxThreads must be positive int');
      if (fml[''].defaultConfigPath !== '"defaultconfigs"') out.push('fml: defaultConfigPath must be "defaultconfigs"');
    };

    if (loader === 'forge') {
      if (filePath !== 'config/forge-client.toml  &  config/fml.toml') out.push(`unexpected forge loader filePath "${filePath}"`);
      const parts = text.split(/^#\s*---[^:\n]+:\s*config\/fml\.toml\s*---$/m);
      if (parts.length !== 2) return ['forge loader output must split cleanly into forge-client.toml and fml.toml'];
      const fc = parseToml(parts[0], 'forge-client', out);
      checkKeys(Object.keys(fc), ['', 'client'], [], [], 'forge-client.sections', out);
      if (Object.keys(fc['']).length > 0) out.push('forge-client: keys must sit under [client]');
      if (fc.client) {
        checkKeys(Object.keys(fc.client), ['alwaysSetupTerrainOffThread', 'experimentalForgeLightPipelineEnabled'], [], ['forgeLightPipelineEnabled'], 'forge-client', out);
        if (fc.client.alwaysSetupTerrainOffThread !== 'true' || fc.client.experimentalForgeLightPipelineEnabled !== 'false') {
          out.push('forge-client: unexpected [client] option values');
        }
      }
      checkFml(parts[1]);
    } else {
      if (filePath !== 'config/fml.toml') out.push(`unexpected neoforge loader filePath "${filePath}"`);
      checkFml(text);
    }
    return out;
  }

  if (tab === 'driver') {
    const expOpt = expectSodium ? 'sodium-options.json' : 'embeddium-options.json';
    const otherOpt = expectSodium ? 'embeddium-options.json' : 'sodium-options.json';
    if (text.includes(otherOpt)) out.push(`driver notes mention "${otherOpt}" instead of "${expOpt}"`);
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
      .filter(([id, text, val]) => typeof val === 'string' && !/[<>]/.test(val) && text && text !== val.trim() && !/(graal-pill|chk-lp|skip|leg-soft-lbl)$/.test(id))
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

  // ---- 3. Generated config files over a hardware / loader / MC / OS matrix ----
  const hardware = [
    ['r5_5500', 'rtx_3050_6_desk'], ['i5_12400f', 'igpu_auto'], ['xeon_2699v4', 'rx_580'],
    ['r7_6800h', 'rtx_4060_lap'], ['r5_5600g', 'igpu_auto'], ['m2', 'igpu_auto'],
  ];
  const loaders = await ev(() => [...document.getElementById('select-loader').options].map((o) => o.value));
  const mcVersions = await ev(() => [...document.getElementById('select-mc-version').options].map((o) => o.value));
  const tabs = ['modernfix', 'embeddium', 'ferrite', 'entityculling', 'immediatelyfast', 'badopt', 'radium', 'loader', 'driver'];
  let configChecks = 0;
  for (const [cpu, gpu] of hardware) {
    for (const os_ of ['windows', 'linux']) {
      if (cpu === 'm2' && os_ !== 'windows') continue; // Apple chips force macOS
      await sel('select-os', os_);
      await sel('select-cpu', cpu);
      await sel('select-gpu', gpu);
      for (const mcVer of mcVersions) {
        await sel('select-mc-version', mcVer);
        for (const loader of loaders) {
          await sel('select-loader', loader);
          for (const tab of tabs) {
            const res = await ev((t) => { selectConfigTab(t); return { p: document.getElementById('cfg-file-path').textContent, c: document.getElementById('cfg-code-output').textContent, l: state.loader, m: state.mcVersion }; }, tab);
            configChecks++;
            validateConfig(tab, res.p, res.c, { loader: res.l, mcVersion: res.m })
              .forEach((m) => fail(`config "${tab}" (${cpu}/${gpu}/${res.l}/${res.m}/${os_}): ${m}`));
          }
        }
      }
    }
  }
  // Exercise ModernFix toggle permutations (both defaults are checked=true) then restore
  const mfToggled = await ev(() => {
    selectConfigTab('modernfix');
    document.getElementById('chk-mf-dynres').click();
    document.getElementById('chk-mf-spawn').click();
    return { p: document.getElementById('cfg-file-path').textContent, c: document.getElementById('cfg-code-output').textContent, l: state.loader, m: state.mcVersion };
  });
  validateConfig('modernfix', mfToggled.p, mfToggled.c, { loader: mfToggled.l, mcVersion: mfToggled.m })
    .forEach((m) => fail(`config "modernfix" (unchecked toggles): ${m}`));
  check(mfToggled.c.includes('mixin.perf.dynamic_resources=false') && !mfToggled.c.includes('remove_spawn_chunks'),
    'ModernFix unchecked toggles must emit dynamic_resources=false and omit remove_spawn_chunks');
  const mfRestored = await ev(() => {
    document.getElementById('chk-mf-dynres').click();
    document.getElementById('chk-mf-spawn').click();
    return document.getElementById('cfg-code-output').textContent;
  });
  check(mfRestored.includes('mixin.perf.dynamic_resources=true') && mfRestored.includes('mixin.perf.remove_spawn_chunks=true'),
    'ModernFix restored toggles must emit dynamic_resources=true and remove_spawn_chunks=true');

  await sel('select-mc-version', '1.20.1');
  await sel('select-os', 'windows'); await sel('select-cpu', 'r5_5500'); await sel('select-gpu', 'rtx_3050_6_desk'); await sel('select-loader', 'forge');

  // ---- 4. JVM argument logic over engine / Java / OS --------------------------
  const matrix = [];
  for (const os_ of ['windows', 'linux']) {
    for (const eng of ['temurin_zgc', 'temurin_g1', 'graal_g1']) {
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
          const zgc = eng.endsWith('_zgc');
          const tag = `${os_}/${eng}/java${jv}/lp=${lp}`;
          check(args.includes('ZGenerational') === (zgc && jv === '21'), `${tag}: ZGenerational only with ZGC on Java 21`);
          check(!args.includes('UnlockDiagnosticVMOptions'), `${tag}: UnlockDiagnosticVMOptions must not be emitted`);
          check(args.includes('UnlockExperimentalVMOptions') === !zgc, `${tag}: UnlockExperimentalVMOptions only on non-ZGC profiles`);
          check(args.includes('UseStringDeduplication') === !zgc, `${tag}: UseStringDeduplication only on G1 (never on ZGC)`);
          check(!args.includes('fml.readTimeout') && !args.includes('DisableExplicitGC') && !args.includes('PerfDisableSharedMem') && !args.includes('CompilerConfiguration=community') && !args.includes('MaxMetaspaceSize') && !args.includes('UseAVX'), `${tag}: removed legacy/harmful flag was emitted`);
          check(args.includes('ExplicitGCInvokesConcurrent'), `${tag}: ExplicitGCInvokesConcurrent must be emitted`);
          check(args.includes('UseJVMCICompiler') === (eng === 'graal_g1'), `${tag}: JVMCI flags only on Graal + G1`);
          check(args.includes('-Dgraal.TuneInlinerExploration=1') === (eng === 'graal_g1' && jv !== '23'), `${tag}: -Dgraal.* only on Graal + G1 below Java 23`);
          check(args.includes('-Djdk.graal.TuneInlinerExploration=1') === (eng === 'graal_g1' && jv === '23'), `${tag}: -Djdk.graal.* only on Graal + G1 on Java 23+`);
          check(args.includes('SoftMaxHeapSize') === zgc, `${tag}: SoftMaxHeapSize only on ZGC`);
          check(!args.includes('ConcGCThreads') && !args.includes('ParallelGCThreads'), `${tag}: GC threads must stay automatic on 12T CPU`);
          check(args.includes('UseTransparentHugePages') === (os_ === 'linux' && lp), `${tag}: THP only on Linux when enabled`);
          check(zgc ? args.includes('-XX:+UseZGC') : args.includes('-XX:+UseG1GC'), `${tag}: GC flag does not match the engine`);
        }
      }
    }
  }

  // Targeted JVM & RAM bar checks: SpikeTol (fast vs slow RAM), G1HeapRegionSize scaling, >16T GC threads, and RAM bar buffer visibility
  await sel('select-os', 'windows');
  await sel('select-java-version', '21');
  const targeted = await ev(() => {
    const out = {};
    if (document.getElementById('chk-large-pages').checked) document.getElementById('chk-large-pages').click();
    state.jvmEngineManual = true;
    document.getElementById('select-jvm-engine').value = 'temurin_zgc';
    document.getElementById('select-ram-freq').value = 'DDR4_3200';
    onHardwareChange();
    out.zgcFastArgs = document.getElementById('jvm-args-box').textContent;
    out.zgcBufHidden = document.getElementById('leg-buf-wrap').classList.contains('hidden');

    document.getElementById('select-ram-freq').value = 'DDR4_2666';
    onHardwareChange();
    out.zgcSlowArgs = document.getElementById('jvm-args-box').textContent;

    document.getElementById('select-jvm-engine').value = 'temurin_g1';
    onHardwareChange();
    out.g1BufHidden = document.getElementById('leg-buf-wrap').classList.contains('hidden');
    onRamSliderInput(4); out.g1_4g = document.getElementById('jvm-args-box').textContent;
    onRamSliderInput(8); out.g1_8g = document.getElementById('jvm-args-box').textContent;
    onRamSliderInput(12); out.g1_12g = document.getElementById('jvm-args-box').textContent;

    document.getElementById('select-cpu').value = 'xeon_2680v4';
    onHardwareChange();
    out.xeonG1Args = document.getElementById('jvm-args-box').textContent;
    document.getElementById('select-jvm-engine').value = 'temurin_zgc';
    onHardwareChange();
    out.xeonZgcArgs = document.getElementById('jvm-args-box').textContent;
    return out;
  });
  check(!targeted.zgcFastArgs.includes('ZAllocationSpikeTolerance'), 'ZGC fast dual-channel RAM should keep default ZAllocationSpikeTolerance');
  check(targeted.zgcSlowArgs.includes('-XX:ZAllocationSpikeTolerance=3.0'), 'ZGC slow RAM (DDR4 2666) should emit -XX:ZAllocationSpikeTolerance=3.0');
  check(!targeted.zgcBufHidden && targeted.g1BufHidden, 'RAM bar buffer legend must be shown for ZGC and hidden for G1GC');
  check(targeted.g1_4g.includes('-XX:G1HeapRegionSize=4M'), 'G1GC 4 GB heap should use 4M regions');
  check(targeted.g1_8g.includes('-XX:G1HeapRegionSize=8M'), 'G1GC 8 GB heap should use 8M regions');
  check(targeted.g1_12g.includes('-XX:G1HeapRegionSize=16M'), 'G1GC 12 GB heap should use 16M regions');
  check(targeted.xeonG1Args.includes('-XX:ConcGCThreads=6 -XX:ParallelGCThreads=14'), '>16T CPU should emit explicit GC thread counts on G1');
  check(targeted.xeonZgcArgs.includes('-XX:ConcGCThreads=6 -XX:ParallelGCThreads=14'), '>16T CPU should emit explicit GC thread counts on ZGC');
  matrix.push({ os: 'windows', eng: 'temurin_zgc', jv: '21', lp: false, args: targeted.xeonZgcArgs });
  matrix.push({ os: 'windows', eng: 'temurin_g1', jv: '21', lp: false, args: targeted.xeonG1Args });

  fs.writeFileSync(ARGS_FILE, JSON.stringify(matrix));
  await sel('select-os', 'windows'); await sel('select-java-version', '21'); await sel('select-cpu', 'r5_5500');
  await ev(() => {
    state.jvmEngineManual = false;
    document.getElementById('select-jvm-engine').value = 'temurin_zgc';
    document.getElementById('select-ram-freq').value = 'DDR4_2666';
    if (document.getElementById('chk-large-pages').checked) document.getElementById('chk-large-pages').click();
    onHardwareChange();
    selectModpackProfile('heavy');
  });

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
  const legacy = await open(URL + '#c=r5_5500&e=graal_zgc&em=1');
  check(await legacy.evaluate(() => state.jvmEngine === 'temurin_zgc'), 'persistence: legacy graal_zgc hash should map to temurin_zgc');

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
    for (const [eng, jv] of [['graal_g1', '21'], ['temurin_zgc', '21'], ['temurin_g1', '17']]) {
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
  check(!/Graal/.test(badges.temurin_zgc.pill) && !/Graal/.test(badges.temurin_g1.pill), 'badge: engines without the Graal JIT must not claim it');
  check(/Temurin 21/.test(badges.temurin_zgc.badge) && !/Graal/.test(badges.temurin_zgc.badge), 'badge: temurin_zgc header should show Temurin 21 without Graal');
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
    onRamSliderInput(10);
    res.profilesAfterSlider = document.querySelectorAll('.profile-card[aria-pressed=true]').length;
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
  check(a11y.profilesAfterSlider === 0, `a11y: moving RAM slider should clear aria-pressed on all profile cards (got ${a11y.profilesAfterSlider})`);
  check(a11y.langEn === 'en-US/true/false', `a11y: language switch must update <html lang> and aria-pressed (got ${a11y.langEn})`);
  check(a11y.skipText === 'Skip to content', 'a11y: the skip link must be translated');
  check(a11y.iconsNotHidden === 0, `a11y: ${a11y.iconsNotHidden} decorative icon(s) without aria-hidden`);
  check(a11y.sliderLabel, 'a11y: the RAM slider needs an aria-label');

  // ---- 9. Mobile 375px layout (checks horizontal overflow when Tailwind CSS loaded) ----
  const mobilePage = await browser.newPage();
  mobilePage.on('pageerror', (e) => { if (!/tailwind/i.test(e.message)) pageErrors.push(e.message); });
  await mobilePage.setViewport({ width: 375, height: 812 });
  await mobilePage.goto(URL, { waitUntil: 'load' });
  await sleep(500);
  const mobile = await mobilePage.evaluate(() => ({
    tailwindLoaded: getComputedStyle(document.getElementById('ram-warning-banner')).display === 'none',
    scrollWidth: document.documentElement.scrollWidth,
  }));
  if (mobile.tailwindLoaded) {
    check(mobile.scrollWidth <= 376, `mobile 375px: horizontal overflow detected (scrollWidth=${mobile.scrollWidth})`);
  }

  check(pageErrors.length === 0, 'page errors: ' + pageErrors.join(' | '));
  await browser.close();

  if (errors.length) {
    console.error(`check-browser: ${errors.length} problem(s)`);
    errors.slice(0, 40).forEach((e) => console.error(' - ' + e));
    process.exit(1);
  }
  console.log(`check-browser: OK (${configChecks} config files, ${matrix.length} JVM argument sets, ${pt.length} translated keys)`);
})().catch((e) => { console.error(e); process.exit(1); });
