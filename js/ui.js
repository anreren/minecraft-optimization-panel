// Language switch, clipboard, toast and page start-up.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// ============================================================================
// TROCA DE IDIOMA (PT-BR <-> EN-US)
// ============================================================================
function setLanguage(lang) {
    state.lang = lang;
    document.documentElement.lang = lang === 'pt' ? 'pt-BR' : 'en-US';

    const btnPt = document.getElementById('lang-btn-pt');
    const btnEn = document.getElementById('lang-btn-en');
    const activeCls = "px-2.5 py-1 rounded-md text-xs font-semibold bg-zinc-100 text-zinc-950 transition";
    const idleCls = "px-2.5 py-1 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-100 transition";
    if (lang === 'pt') {
        btnPt.className = activeCls;
        btnEn.className = idleCls;
    } else {
        btnEn.className = activeCls;
        btnPt.className = idleCls;
    }

    btnPt.setAttribute('aria-pressed', String(lang === 'pt'));
    btnEn.setAttribute('aria-pressed', String(lang === 'en'));

    const t = i18n[lang];
    document.getElementById('i18n-skip').textContent = t.skipLink;
    document.getElementById('ram-slider').setAttribute('aria-label', t.ramSliderLabel);
    document.getElementById('cfg-tablist').setAttribute('aria-label', t.cfgTablistLabel);
    document.getElementById('reset-btn').setAttribute('aria-label', t.resetTitle);
    document.getElementById('grp-gpu-igpu').label = t.igpuGroup;
    document.getElementById('i18n-footer-github').textContent = t.footerGithub;
    document.getElementById('i18n-app-title').textContent = t.appTitle;
    document.getElementById('i18n-sec1-title').textContent = t.sec1Title;
    document.getElementById('i18n-sec1-sub').textContent = t.sec1Sub;
    document.getElementById('i18n-live-telemetry').textContent = t.liveTelemetry;
    document.getElementById('i18n-lbl-cpu').textContent = t.lblCpu;
    document.getElementById('i18n-lbl-gpu').textContent = t.lblGpu;
    document.getElementById('i18n-lbl-ram').textContent = t.lblRam;
    document.getElementById('i18n-lbl-storage').textContent = t.lblStorage;
    document.getElementById('i18n-lbl-mcver').textContent = t.lblMcVer;
    document.getElementById('i18n-lbl-loader').textContent = t.lblLoader;
    document.getElementById('i18n-lbl-jvm').textContent = t.lblJvm;
    document.getElementById('i18n-lbl-java').textContent = t.lblJava;
    document.getElementById('i18n-lbl-os').textContent = t.lblOs;
    document.getElementById('i18n-lbl-launcher').textContent = t.lblLauncher;
    document.getElementById('i18n-share').textContent = t.shareBtn;
    document.getElementById('share-btn').title = t.shareTitle;
    document.getElementById('reset-btn').title = t.resetTitle;

    document.getElementById('i18n-sec2-title').textContent = t.sec2Title;
    document.getElementById('i18n-sec2-sub').innerHTML = t.sec2Sub;
    document.getElementById('i18n-graal-pill').textContent = t.graalPill;

    document.getElementById('i18n-prof-light-badge').textContent = t.profLightBadge;
    document.getElementById('i18n-prof-light-title').textContent = t.profLightTitle;
    document.getElementById('i18n-prof-light-desc').textContent = t.profLightDesc;

    document.getElementById('i18n-prof-med-badge').textContent = t.profMedBadge;
    document.getElementById('i18n-prof-med-title').textContent = t.profMedTitle;
    document.getElementById('i18n-prof-med-desc').textContent = t.profMedDesc;

    document.getElementById('i18n-prof-heavy-badge').textContent = t.profHeavyBadge;
    document.getElementById('i18n-prof-heavy-title').textContent = t.profHeavyTitle;
    document.getElementById('i18n-prof-heavy-desc').textContent = t.profHeavyDesc;

    document.getElementById('i18n-prof-ext-badge').textContent = t.profExtBadge;
    document.getElementById('i18n-prof-ext-title').textContent = t.profExtTitle;
    document.getElementById('i18n-prof-ext-desc').textContent = t.profExtDesc;

    document.getElementById('i18n-ram-slider-lbl').textContent = t.ramSliderLbl;
    document.getElementById('i18n-chk-xmx').innerHTML = t.chkXmx;
    document.getElementById('i18n-chk-lp').innerHTML = t.chkLp;
    document.getElementById('i18n-leg-soft-lbl').textContent = t.legSoftLbl;
    document.getElementById('i18n-leg-buf-lbl').textContent = t.legBufLbl;
    document.getElementById('i18n-leg-graal-lbl').textContent = t.legGraalLbl;
    document.getElementById('i18n-leg-free-lbl').textContent = t.legFreeLbl;
    document.getElementById('i18n-btn-copy-jvm').textContent = t.btnCopyJvm;
    document.getElementById('i18n-exp-flags-title').textContent = t.expFlagsTitle;
    document.getElementById('i18n-graal-guide-title').textContent = t.graalGuideTitle;

    document.getElementById('i18n-sec3-title').textContent = t.sec3Title;
    document.getElementById('i18n-sec3-sub').innerHTML = t.sec3Sub;
    document.getElementById('mcat-all').textContent = t.mcatAll;
    document.getElementById('mcat-fps').textContent = t.mcatFps;
    document.getElementById('mcat-ram').textContent = t.mcatRam;
    document.getElementById('mcat-tps').textContent = t.mcatTps;
    document.getElementById('mcat-avoid').textContent = t.mcatAvoid;

    document.getElementById('i18n-sec4-title').innerHTML = t.sec4Title;
    document.getElementById('i18n-sec4-sub').innerHTML = t.sec4Sub;
    document.getElementById('i18n-btn-copy-cfg').textContent = t.btnCopyCfg;
    document.getElementById('i18n-scan-title').textContent = t.scanTitle;
    document.getElementById('i18n-scan-sub').innerHTML = t.scanSub;
    document.getElementById('i18n-btn-load-config-dir').textContent = t.btnLoadConfigDir;
    document.getElementById('i18n-btn-apply-all-cfg').textContent = t.btnApplyAllCfg;
    document.getElementById('i18n-btn-clear-scan').textContent = t.btnClearScan;

    document.getElementById('i18n-sec5-title').textContent = t.sec5Title;
    document.getElementById('i18n-sec5-sub').textContent = t.sec5Sub;
    document.getElementById('i18n-btn-copy-driver').textContent = t.btnCopyDriver;

    // Traduzir options com atributos data-pt e data-en
    document.querySelectorAll('option[data-pt]').forEach(opt => {
        opt.textContent = opt.getAttribute(`data-${lang}`);
    });

    populateFrequencyDropdown(state.ddrType, state.ramFreq);
    recalculateAll();
}

function copyText(elementId, typeKey) {
    const text = document.getElementById(elementId).textContent;
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const t = i18n[state.lang];
    const msg = typeKey === 'jvm' ? t.toastJvmCopied : (typeKey === 'driver' ? t.toastDriverCopied : t.toastCfgCopied);
    showToast(msg);
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    document.getElementById('toast-msg').textContent = msg;
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => {
        toast.classList.add('translate-y-20', 'opacity-0');
    }, 2600);
}

window.onload = function() {
    document.getElementById('cfg-tablist').addEventListener('keydown', (e) => {
        const keys = ['ArrowRight', 'ArrowLeft', 'Home', 'End'];
        if (!keys.includes(e.key)) return;
        const tabs = [...document.querySelectorAll('.ctab-btn')];
        let i = tabs.findIndex(b => b.getAttribute('aria-selected') === 'true');
        if (e.key === 'ArrowRight') i = (i + 1) % tabs.length;
        else if (e.key === 'ArrowLeft') i = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') i = 0;
        else i = tabs.length - 1;
        e.preventDefault();
        tabs[i].focus();
        selectConfigTab(tabs[i].id.replace('ctab-', ''));
    });
    state.restoring = true; // evita gravar o estado padrão por cima da configuração salva
    populateFrequencyDropdown('DDR4', 2666);
    applyAutoEngine(false);
    // Aplica o i18n em todo o texto estático já na abertura (o HTML só guarda um texto provisório)
    setLanguage(state.lang);
    state.restoring = false;
    loadSavedConfig();
};
