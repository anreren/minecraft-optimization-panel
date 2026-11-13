// Saved configuration (localStorage) and shareable links (URL hash).
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// ---- Persistência (localStorage) e link compartilhável (hash da URL) ----
const PERSIST_KEY = 'mcopt:config:v1';

const CONFIG_SELECTS = [
    ['c', 'select-cpu'], ['g', 'select-gpu'], ['r', 'select-sys-ram'], ['f', 'select-ram-freq'],
    ['ch', 'select-mem-channels'], ['s', 'select-storage'], ['v', 'select-mc-version'], ['m', 'select-loader'],
    ['e', 'select-jvm-engine'], ['j', 'select-java-version'], ['o', 'select-os'], ['l', 'select-launcher']
];

const CONFIG_CHECKS = [['x', 'chk-include-xmx'], ['lp', 'chk-large-pages'], ['dr', 'chk-mf-dynres'], ['sp', 'chk-mf-spawn']];

function collectConfigParams() {
    const p = new URLSearchParams();
    CONFIG_SELECTS.forEach(([k, id]) => p.set(k, document.getElementById(id).value));
    CONFIG_CHECKS.forEach(([k, id]) => p.set(k, document.getElementById(id).checked ? '1' : '0'));
    p.set('a', String(state.allocRamGB));
    p.set('p', state.modpackProfile || '');
    p.set('pp', state.preferredProfile || '');
    p.set('em', state.jvmEngineManual ? '1' : '0');
    p.set('lg', state.lang);
    return p;
}

function persistConfig() {
    if (state.restoring) return;
    const qs = collectConfigParams().toString();
    try { localStorage.setItem(PERSIST_KEY, qs); } catch (e) { /* storage indisponível */ }
    try { history.replaceState(null, '', '#' + qs); } catch (e) { /* alguns contextos bloqueiam */ }
}

// Só aceita valores que existem nos seletores: um link adulterado não consegue injetar nada
function applyConfigParams(p) {
    const setSel = (id, v) => {
        const el = document.getElementById(id);
        if (v === null || v === undefined || ![...el.options].some(o => o.value === v)) return false;
        el.value = v; return true;
    };
    state.restoring = true;
    try {
        const lg = p.get('lg');
        if (lg === 'pt' || lg === 'en') setLanguage(lg);

        setSel('select-cpu', p.get('c'));
        setSel('select-gpu', p.get('g'));
        setSel('select-sys-ram', p.get('r'));
        state.sysRamGB = parseInt(document.getElementById('select-sys-ram').value, 10);
        const f = p.get('f');
        if (f && f.includes('_')) {
            const [t, hz] = f.split('_');
            if (ddrFrequencies[t]) {
                setSel('select-ddr-type', t);
                state.ddrType = t;
                populateFrequencyDropdown(t, parseInt(hz, 10));
                setSel('select-ram-freq', f);
            }
        }
        setSel('select-mem-channels', p.get('ch'));
        setSel('select-storage', p.get('s'));
        setSel('select-mc-version', p.get('v'));
        setSel('select-loader', p.get('m'));
        state.mcVersion = document.getElementById('select-mc-version').value;
        state.loader = document.getElementById('select-loader').value;
        setSel('select-java-version', p.get('j'));
        state.javaVersion = document.getElementById('select-java-version').value;
        setSel('select-os', p.get('o'));
        state.os = document.getElementById('select-os').value;
        setSel('select-launcher', p.get('l'));
        state.launcher = document.getElementById('select-launcher').value;
        setSel('select-jvm-engine', p.get('e'));
        state.jvmEngineManual = p.get('em') === '1';
        CONFIG_CHECKS.forEach(([k, id]) => { if (p.has(k)) document.getElementById(id).checked = p.get(k) === '1'; });

        onHardwareChange(); // lê CPU/GPU/RAM/disco, sincroniza chips Apple e a engine

        const profiles = ['light', 'medium', 'heavy', 'extreme'];
        state.preferredProfile = profiles.includes(p.get('pp')) ? p.get('pp') : 'heavy';
        const prof = p.get('p');
        if (profiles.includes(prof)) {
            selectModpackProfile(prof, true);
        } else {
            const a = parseInt(p.get('a'), 10);
            const max = Math.max(6, state.sysRamGB - 2);
            if (Number.isFinite(a)) onRamSliderInput(Math.min(Math.max(a, 4), max));
        }
    } finally {
        state.restoring = false;
    }
    recalculateAll();
}

function loadSavedConfig() {
    let qs = '';
    const hash = (location.hash || '').slice(1);
    if (hash.includes('c=')) qs = hash;
    else { try { qs = localStorage.getItem(PERSIST_KEY) || ''; } catch (e) { qs = ''; } }
    if (qs) applyConfigParams(new URLSearchParams(qs));
    else recalculateAll();
}

function shareConfig() {
    persistConfig();
    const url = location.href.split('#')[0] + '#' + collectConfigParams().toString();
    const done = () => showToast(i18n[state.lang].toastLinkCopied);
    const fallback = () => {
        const ta = document.createElement('textarea');
        ta.value = url; document.body.appendChild(ta); ta.select();
        try { document.execCommand('copy'); } catch (e) { /* sem clipboard */ }
        document.body.removeChild(ta); done();
    };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(done, fallback);
    else fallback();
}

function resetConfig() {
    try { localStorage.removeItem(PERSIST_KEY); } catch (e) { /* ignora */ }
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ignora */ }
    location.reload();
}
