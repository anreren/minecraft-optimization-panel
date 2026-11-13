// Hardware helpers: active GPU, memory bandwidth and budget, notebook detection, recommended settings, engine choice.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// Resolve a GPU ativa: se "Gráficos Integrados" estiver selecionado, detecta a iGPU pela CPU
function getActiveGpu() {
    if (state.gpuKey !== 'igpu_auto') return gpuDatabase[state.gpuKey];
    const t = i18n[state.lang];
    const cpu = cpuDatabase[state.cpuKey];
    if (cpu && cpu.igpu && gpuDatabase[cpu.igpu]) {
        return Object.assign({}, gpuDatabase[cpu.igpu], { detected: true });
    }
    return { name: t.igpuNoneName, vendor: 'none', vendorLabel: t.igpuVendorNone, vram: 1, arch: 'N/A', noErrorCtx: false, tier: 'low', igpu: true, none: true };
}

// ---- Largura de banda, notebook híbrido e recomendações no jogo ----
// Banda teórica da RAM em GB/s: MT/s x 8 bytes x canais
function memBandwidthGBs(channels) {
    const cpuNow = cpuDatabase[state.cpuKey];
    if (cpuNow && cpuNow.apple && !channels) return cpuNow.bw;
    return +(state.ramFreq * 8 * (channels || state.memChannels) / 1000).toFixed(1);
}

function isNotebook(cpu, gpu) { return !!(cpu.mobile || gpu.laptop); }

function isHybridNotebook(cpu, gpu) { return isNotebook(cpu, gpu) && !gpu.igpu && !gpu.none; }

// Distâncias recomendadas: CPU (thread única) limita render/simulação, GPU limita render e shaders
function recommendedVideoSettings(cpu, gpu) {
    const cs = ST_TIER_SCORE[cpu.st];
    const gs = gpu.none ? 0 : GPU_TIER_SCORE[gpu.tier];
    const penalty = state.modpackProfile === 'extreme' ? 2 : (state.modpackProfile === 'heavy' ? 1 : 0);
    const cpuRD = [8, 10, 14, 18][cs];
    let gpuRD = [6, 10, 12, 16, 20][gs];
    if (gpu.igpu && !gpu.unified) {
        gpuRD = Math.min(gpuRD, 8);
        if (state.memChannels === 1) gpuRD = Math.min(gpuRD, 6);
    }
    const render = Math.max(6, Math.min(cpuRD, gpuRD) - penalty);
    let sim = [4, 5, 8, 10][cs] - penalty;
    if (cpu.threads <= 4) sim = Math.min(sim, 6);
    sim = Math.max(4, Math.min(sim, render));
    const entity = cs === 0 ? 50 : ((cs === 1 || gs <= 1) ? 75 : 100);
    const shaders = ((gpu.igpu && !gpu.unified) || gs <= 1) ? 'off' : (gs === 2 ? 'light' : 'ok');
    return { render, sim, entity, shaders };
}

// RAM: overhead de Metaspace + code cache e reserva da iGPU (memória compartilhada)
function overheadGB(allocGB) {
    const meta = allocGB <= 7 ? 384 : (allocGB >= 13 ? 768 : 512);
    const code = allocGB <= 7 ? 384 : 512;
    return +((meta + code) / 1024).toFixed(1);
}

function igpuReserveGB(gpu) {
    return (gpu && gpu.igpu && !gpu.none) ? Math.min(gpu.vram, 2) : 0;
}

// Maior alocação que ainda deixa >= 2,5 GB livres para o SO
function maxSafeAllocGB() {
    const reserve = igpuReserveGB(getActiveGpu());
    for (let a = state.sysRamGB; a >= 4; a--) {
        if (state.sysRamGB - a - overheadGB(a) - reserve >= 2.5) return a;
    }
    return 4;
}

// Engine JVM recomendada: CPUs com poucas threads ou pouca RAM sofrem com ZGC + JIT do Graal
// (GC concorrente e compilador disputam núcleos e memória com o jogo) -> HotSpot C2 + G1.
function recommendedEngine() {
    const cpu = cpuDatabase[state.cpuKey];
    return (cpu.threads <= 6 || state.sysRamGB <= 12) ? 'temurin_g1' : 'graal_zgc';
}

function applyAutoEngine(announce) {
    if (state.jvmEngineManual) return;
    const rec = recommendedEngine();
    if (state.jvmEngine === rec) return;
    state.jvmEngine = rec;
    document.getElementById('select-jvm-engine').value = rec;
    if (announce) {
        const t = i18n[state.lang];
        showToast(rec === 'temurin_g1' ? t.toastEngineLow : t.toastEngineHigh);
    }
}
