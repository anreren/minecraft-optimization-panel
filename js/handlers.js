// Event handlers for the hardware, Java, OS, launcher, RAM and version selectors.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// Minecraft 1.20.5+ (1.20.6, 1.21.x) exige Java 21 ou superior
function enforceJavaForMc() {
    const needs21 = state.mcVersion === '1.20.6' || state.mcVersion.startsWith('1.21');
    if (needs21 && state.javaVersion === '17') {
        state.javaVersion = '21';
        document.getElementById('select-java-version').value = '21';
        showToast(i18n[state.lang].toastJava21Req);
    }
}

function onJavaChange() {
    state.javaVersion = document.getElementById('select-java-version').value;
    enforceJavaForMc();
    recalculateAll();
}

function setSelectValue(id, v) { document.getElementById(id).value = v; }

function onOsChange() {
    state.os = document.getElementById('select-os').value;
    const t = i18n[state.lang];
    const cpuSel = cpuDatabase[document.getElementById('select-cpu').value];
    if (state.os === 'macos' && !cpuSel.apple) {
        setSelectValue('select-cpu', 'm2');
        showToast(t.toastMacCpu);
    } else if (state.os !== 'macos' && cpuSel.apple) {
        setSelectValue('select-cpu', 'r5_5500');
        setSelectValue('select-gpu', 'rtx_3050_6_desk');
        showToast(t.toastNonMacCpu);
    }
    onHardwareChange();
}

function onLauncherChange() {
    state.launcher = document.getElementById('select-launcher').value;
    const sep = LAUNCHERS[state.launcher].separateMemory;
    // Launchers com campo de memória próprio: não incluir -Xms/-Xmx (evita duplicar)
    if (sep !== null) document.getElementById('chk-include-xmx').checked = !sep;
    recalculateAll();
}

// Rótulo/estado da opção de páginas grandes conforme o sistema operacional
function applyOsUi() {
    const lp = document.getElementById('chk-large-pages');
    const span = document.getElementById('i18n-chk-lp');
    const pt = state.lang === 'pt';
    if (state.os === 'linux') {
        lp.disabled = false;
        span.innerHTML = pt ? 'Usar <code class="text-purple-400 font-mono">Transparent Huge Pages</code>' : 'Use <code class="text-purple-400 font-mono">Transparent Huge Pages</code>';
    } else if (state.os === 'macos') {
        lp.checked = false;
        lp.disabled = true;
        span.innerHTML = pt ? 'LargePages <span class="text-gray-400">(indisponível no macOS)</span>' : 'LargePages <span class="text-gray-400">(unavailable on macOS)</span>';
    } else {
        lp.disabled = false;
        span.innerHTML = i18n[state.lang].chkLp;
    }
    lp.classList.toggle('opacity-50', lp.disabled);
    lp.parentElement.classList.toggle('cursor-not-allowed', lp.disabled);
}

function onEngineChange() {
    state.jvmEngineManual = true;
    onHardwareChange();
}

// ============================================================================
// INICIALIZAÇÃO E CONTROLES DE MUDANÇA DE HARDWARE
// ============================================================================
function populateFrequencyDropdown(ddrType, defaultFreq) {
    const freqSelect = document.getElementById('select-ram-freq');
    freqSelect.innerHTML = '';
    const t = i18n[state.lang];

    // Grupo principal da geração selecionada
    const mainGroup = document.createElement('optgroup');
    mainGroup.label = `${t.freqStdGroup} (${ddrType})`;
    ddrFrequencies[ddrType].forEach(freq => {
        const opt = document.createElement('option');
        opt.value = `${ddrType}_${freq}`;
        opt.textContent = `${ddrType} - ${freq} MHz (MT/s)`;
        if (freq === defaultFreq) opt.selected = true;
        mainGroup.appendChild(opt);
    });
    freqSelect.appendChild(mainGroup);

    // Também inclui as outras gerações em optgroups abaixo para troca direta se o usuário quiser ver todas
    Object.keys(ddrFrequencies).forEach(otherType => {
        if (otherType !== ddrType) {
            const grp = document.createElement('optgroup');
            grp.label = `${t.freqOtherGroup} (${otherType})`;
            ddrFrequencies[otherType].forEach(freq => {
                const opt = document.createElement('option');
                opt.value = `${otherType}_${freq}`;
                opt.textContent = `${otherType} - ${freq} MHz`;
                grp.appendChild(opt);
            });
            freqSelect.appendChild(grp);
        }
    });
}

function onDDRTypeChange() {
    const newType = document.getElementById('select-ddr-type').value;
    state.ddrType = newType;
    const defaultFreqForType = newType === 'DDR3' ? 1600 : (newType === 'DDR4' ? 2666 : 6000);
    state.ramFreq = defaultFreqForType;
    populateFrequencyDropdown(newType, defaultFreqForType);
    onHardwareChange();
}

// Máximo do slider = RAM do sistema - 2 GB (o aviso de memória livre cuida do resto)
function syncRamSliderBounds() {
    const slider = document.getElementById('ram-slider');
    slider.max = Math.max(6, state.sysRamGB - 2);
    slider.setAttribute('aria-valuetext', `${state.allocRamGB} GB`);
}

function onSystemRamChange() {
    state.sysRamGB = parseInt(document.getElementById('select-sys-ram').value, 10);
    applyAutoEngine(true);
    syncRamSliderBounds();

    // Ajusta automaticamente a RAM alocada se ultrapassar o limite seguro do sistema
    if (state.sysRamGB <= 8) {
        selectModpackProfile('light', true);
    } else if (state.modpackProfile) {
        selectModpackProfile(state.preferredProfile || state.modpackProfile, true);
    } else if (state.sysRamGB <= 12 && state.allocRamGB > 8) {
        onRamSliderInput(8);
    } else if (state.sysRamGB <= 16 && state.allocRamGB > 10) {
        onRamSliderInput(10);
    } else if (state.allocRamGB > maxSafeAllocGB()) {
        onRamSliderInput(maxSafeAllocGB());
    } else {
        recalculateAll();
    }
}

function onVersionOrLoaderChange() {
    state.mcVersion = document.getElementById('select-mc-version').value;
    state.loader = document.getElementById('select-loader').value;

    enforceJavaForMc();
    recalculateAll();
}

function onHardwareChange() {
    state.cpuKey = document.getElementById('select-cpu').value;
    state.gpuKey = document.getElementById('select-gpu').value;

    // Verifica se o usuário selecionou uma frequência de outro grupo DDR diretamente no dropdown de frequência
    const rawFreqVal = document.getElementById('select-ram-freq').value;
    if (rawFreqVal && rawFreqVal.includes('_')) {
        const [pickedType, pickedFreq] = rawFreqVal.split('_');
        state.ramFreq = parseInt(pickedFreq, 10);
        if (pickedType !== state.ddrType) {
            state.ddrType = pickedType;
            document.getElementById('select-ddr-type').value = pickedType;
        }
    }

    state.storageKey = document.getElementById('select-storage').value;
    state.memChannels = parseInt(document.getElementById('select-mem-channels').value, 10) || 2;

    // Chips Apple: macOS + memória unificada (sem DDR/canais configuráveis) + GPU detectada
    const cpuNow = cpuDatabase[state.cpuKey];
    if (cpuNow.apple) {
        state.os = 'macos'; setSelectValue('select-os', 'macos');
        state.gpuKey = 'igpu_auto'; setSelectValue('select-gpu', 'igpu_auto');
        state.ddrType = cpuNow.memType; state.ramFreq = cpuNow.memFreq;
        setSelectValue('select-ddr-type', cpuNow.memType);
        populateFrequencyDropdown(cpuNow.memType, cpuNow.memFreq);
        state.memChannels = 2; setSelectValue('select-mem-channels', '2');
    } else if (state.os === 'macos') {
        state.os = 'windows'; setSelectValue('select-os', 'windows');
    }
    ['select-ddr-type', 'select-ram-freq', 'select-mem-channels', 'select-gpu'].forEach(id => {
        const el = document.getElementById(id);
        el.disabled = !!cpuNow.apple;
        el.classList.toggle('opacity-75', !!cpuNow.apple);
        el.classList.toggle('cursor-not-allowed', !!cpuNow.apple);
    });
    if (state.jvmEngineManual) {
        state.jvmEngine = document.getElementById('select-jvm-engine').value;
    } else {
        applyAutoEngine(true);
    }

    // Ajusta recomendação padrão do dynamic_resources caso mude para HDD
    const storage = storageDatabase[state.storageKey];
    document.getElementById('chk-mf-dynres').checked = storage.dynResRecommended;

    recalculateAll();
}

// auto = true quando o painel aplica o perfil sozinho (ex.: RAM de 8 GB força 'light'): não sobrescreve a preferência do usuário
function selectModpackProfile(profileKey, auto = false) {
    state.modpackProfile = profileKey;
    if (!auto) state.preferredProfile = profileKey;
    const sysRam = state.sysRamGB;

    let targetRam = 12;
    if (profileKey === 'light') targetRam = Math.min(6, sysRam - 2);
    if (profileKey === 'medium') targetRam = sysRam >= 16 ? 10 : Math.min(8, sysRam - 2);
    if (profileKey === 'heavy') targetRam = sysRam >= 24 ? 12 : (sysRam >= 16 ? 10 : Math.min(8, sysRam - 2));
    if (profileKey === 'extreme') targetRam = sysRam >= 32 ? 14 : (sysRam >= 24 ? 12 : Math.min(10, sysRam - 3));

    state.allocRamGB = Math.max(4, Math.min(targetRam, maxSafeAllocGB()));
    document.getElementById('ram-slider').value = state.allocRamGB;

    document.querySelectorAll('.profile-card').forEach(btn => {
        btn.className = "profile-card text-left p-4 rounded-xl border border-gray-800 bg-gray-950/60 hover:border-gray-700 transition flex flex-col justify-between";
    });
    document.querySelectorAll('.profile-card').forEach(btn => btn.setAttribute('aria-pressed', 'false'));
    const activeBtn = document.getElementById(`profile-${profileKey}`);
    if (activeBtn) {
        activeBtn.setAttribute('aria-pressed', 'true');
        activeBtn.className = "profile-card text-left p-4 rounded-xl border-2 border-emerald-500 bg-emerald-950/20 transition flex flex-col justify-between";
    }

    recalculateAll();
}

function onRamSliderInput(val) {
    state.allocRamGB = parseInt(val, 10);
    state.modpackProfile = null;
    document.getElementById('ram-slider').value = state.allocRamGB;
    document.querySelectorAll('.profile-card').forEach(btn => {
        btn.className = "profile-card text-left p-4 rounded-xl border border-gray-800 bg-gray-950/60 hover:border-gray-700 transition flex flex-col justify-between";
    });
    recalculateAll();
}
