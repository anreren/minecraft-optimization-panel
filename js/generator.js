// Central calculation: RAM bar, JVM arguments, flag explanations and the launcher guide.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// ============================================================================
// MOTOR DE CÁLCULO CENTRAL (JVM ARGS, GRAALVM, BARRA DE RAM, DIAGNÓSTICOS)
// ============================================================================
function recalculateAll() {
    applyOsUi();
    syncRamSliderBounds();
    const lang = state.lang;
    const cpu = cpuDatabase[state.cpuKey];
    const gpu = getActiveGpu();
    const storage = storageDatabase[state.storageKey];
    const storageName = storage.name[lang];

    // 1. Atualiza badges superiores e sumário
    const loaderNames = { forge: 'Forge', neoforge: 'NeoForge', fabric: 'Fabric' };
    document.getElementById('header-loader-badge').textContent = `${loaderNames[state.loader]} ${state.mcVersion}`;
    document.getElementById('header-hw-summary').textContent = `${cpu.name} (${cpu.cores}C/${cpu.threads}T) • ${gpu.name} • ${state.sysRamGB}GB ${state.ddrType} ${state.ramFreq}MHz${state.memChannels === 1 ? ' (1ch)' : ''} • ${storageName}`;

    document.getElementById('cpu-badge-threads').textContent = `${cpu.cores}C / ${cpu.threads}T`;
    const gcThreadTxt = cpu.threads > 16 ? `ConcGC: ${cpu.concGC} / ParGC: ${cpu.parGC}` : 'GC Threads: Auto';
    document.getElementById('cpu-meta-desc').textContent = `${cpu.arch} • ${i18n[lang].stLabel}: ${i18n[lang].stNames[cpu.st]} • L3 ${cpu.l3} • ${gcThreadTxt}`;

    const tI = i18n[lang];
    const igpuOpt = document.getElementById('opt-gpu-igpu');
    const cpuIgpu = cpu.igpu ? gpuDatabase[cpu.igpu] : null;
    igpuOpt.textContent = `${tI.igpuOption.split(' — ')[0]} → ${cpuIgpu ? cpuIgpu.short : 'N/A'}`;
    if (gpu.igpu && !gpu.none) {
        document.getElementById('gpu-badge-vram').textContent = `${gpu.vram}GB Shared`;
        document.getElementById('gpu-meta-desc').textContent = `${state.gpuKey === 'igpu_auto' ? tI.igpuDetectedTag + ': ' : ''}${gpu.name} • ${gpu.arch} • ${tI.igpuMeta}`;
    } else if (gpu.none) {
        document.getElementById('gpu-badge-vram').textContent = 'N/A';
        document.getElementById('gpu-meta-desc').textContent = tI.igpuNoneMeta;
    } else {
        document.getElementById('gpu-badge-vram').textContent = `${gpu.vram}GB VRAM`;
        document.getElementById('gpu-meta-desc').textContent = `${gpu.arch} • NoErrorCtx: ${gpu.noErrorCtx ? 'ON' : 'Safe OFF'}`;
    }

    document.getElementById('ram-badge-bw').textContent = `${state.ddrType} ${state.ramFreq} • ${state.memChannels === 1 ? 'Single' : 'Dual'}`;
    document.getElementById('storage-badge-io').textContent = `DynRes: ${storage.dynResRecommended ? 'ON' : 'OFF'}`;
    document.getElementById('storage-meta-desc').textContent = storage.ioDesc[lang];

    // 2. Calcula SoftMaxHeapSize, Metaspace e CodeCache da JVM
    const allocGB = state.allocRamGB;
    const allocMB = allocGB * 1024;
    const bufferGB = allocGB >= 9 ? 2 : 1;
    const isZgc = state.jvmEngine.endsWith('_zgc');
    state.softMaxGB = Math.max(3, allocGB - bufferGB);
    state.metaMB = allocGB <= 7 ? 384 : (allocGB >= 13 ? 768 : 512);
    state.codeCacheMB = state.jvmEngine === 'graal_g1' ? (allocGB <= 7 ? 384 : 512) : 240;

    // Atualiza mostradores de RAM e barra visual
    document.getElementById('ram-alloc-gb').textContent = `${allocGB} GB`;
    document.getElementById('ram-alloc-mb').textContent = `(${allocMB} MiB)`;

    const jvmOverheadGB = overheadGB(allocGB, state.jvmEngine);
    const igpuRes = igpuReserveGB(gpu);
    const freeSysGB = +(state.sysRamGB - allocGB - jvmOverheadGB - igpuRes).toFixed(1);

    const warnBanner = document.getElementById('ram-warning-banner');
    if (freeSysGB < 2.5) {
        warnBanner.classList.remove('hidden');
        document.getElementById('ram-warning-text').textContent = lang === 'pt'
            ? `Cuidado: Restam apenas ${Math.max(0, freeSysGB)} GB para o Sistema Operacional e o overhead nativo da JVM (Metaspace / CodeCache)! Reduza a alocação para no máximo ${maxSafeAllocGB()} GB para evitar que o jogo feche sozinho.`
            : `Warning: Only ${Math.max(0, freeSysGB)} GB left for the Operating System and JVM native overhead (Metaspace / CodeCache)! Reduce allocation to at most ${maxSafeAllocGB()} GB to prevent crashes.`;
    } else {
        warnBanner.classList.add('hidden');
    }

    document.getElementById('ram-bar-title').textContent = lang === 'pt'
        ? `Divisão dos seus ${state.sysRamGB} GB ${state.ddrType} ${state.ramFreq} MHz:`
        : `Breakdown of your ${state.sysRamGB} GB ${state.ddrType} ${state.ramFreq} MHz:`;
    document.getElementById('ram-bar-free-label').textContent = lang === 'pt'
        ? `${Math.max(0, freeSysGB)} GB livres para Sistema, Driver ${gpu.vendorLabel || gpu.vendor.toUpperCase()} e Cache Disco${igpuRes ? ` (já descontando ${igpuRes} GB da iGPU)` : ''}`
        : `${Math.max(0, freeSysGB)} GB free for OS, ${gpu.vendorLabel || gpu.vendor.toUpperCase()} Driver & Disk Cache${igpuRes ? ` (already minus ${igpuRes} GB for the iGPU)` : ''}`;

    const pctSoft = Math.min(100, ((isZgc ? state.softMaxGB : allocGB) / state.sysRamGB) * 100);
    const pctBuf = isZgc ? Math.min(100 - pctSoft, (bufferGB / state.sysRamGB) * 100) : 0;
    const pctGraal = Math.min(100 - pctSoft - pctBuf, (jvmOverheadGB / state.sysRamGB) * 100);
    const pctFree = Math.max(0, 100 - pctSoft - pctBuf - pctGraal - (igpuRes / state.sysRamGB) * 100);

    document.getElementById('bar-seg-soft').style.width = `${pctSoft}%`;
    document.getElementById('bar-seg-buf').style.width = `${pctBuf}%`;
    document.getElementById('bar-seg-buf').classList.toggle('hidden', !isZgc);
    document.getElementById('bar-seg-graal').style.width = `${pctGraal}%`;
    document.getElementById('bar-seg-free').style.width = `${pctFree}%`;

    const bufWrap = document.getElementById('leg-buf-wrap');
    if (isZgc) {
        bufWrap.classList.remove('hidden');
        document.getElementById('i18n-leg-soft-lbl').textContent = tI.legSoftLbl;
        document.getElementById('leg-soft').textContent = `${state.softMaxGB} GB`;
        document.getElementById('leg-buf').textContent = `${bufferGB} GB`;
    } else {
        bufWrap.classList.add('hidden');
        document.getElementById('i18n-leg-soft-lbl').textContent = tI.legHeapLbl;
        document.getElementById('leg-soft').textContent = `${allocGB} GB`;
    }
    document.getElementById('leg-graal').textContent = `${jvmOverheadGB} GB`;
    document.getElementById('leg-free').textContent = `${Math.max(0, freeSysGB)} GB`;

    // 3. Gera os Argumentos JVM Focados em GraalVM
    generateJVMArguments(cpu, gpu, storage, allocMB);

    // 4. Renderiza Diagnósticos de Hardware (CPU + RAM Latency + Storage/GPU)
    renderHardwareDiagnostics(cpu, gpu, storage);

    // 5. Renderiza Catálogo de Mods para o Loader e Versão escolhidos
    renderDynamicMods();

    // 6. Renderiza a Config Ativa da Seção 4 e o Driver da Seção 5
    renderActiveConfigTab();
    renderDriverSection();

    // 7. Salva a configuração (localStorage + hash da URL) para recarregar ou compartilhar
    persistConfig();
}

function generateJVMArguments(cpu, gpu, storage, allocMB) {
    const lang = state.lang;
    const includeXmx = document.getElementById('chk-include-xmx').checked;
    const useLargePages = document.getElementById('chk-large-pages').checked;
    const javaVer = state.javaVersion;
    const isGraalEngine = state.jvmEngine.startsWith('graal');
    const useGraalJit = state.jvmEngine === 'graal_g1';
    const isZgcEngine = state.jvmEngine.endsWith('_zgc');
    const xmxPart = includeXmx ? `-Xms${allocMB}M -Xmx${allocMB}M ` : "";
    const expPart = isZgcEngine ? "" : "-XX:+UnlockExperimentalVMOptions ";
    // Páginas grandes: LargePages no Windows, Transparent Huge Pages no Linux, indisponível no macOS
    const lpPart = !useLargePages ? "" : (state.os === 'linux' ? `-XX:+UseTransparentHugePages ` : (state.os === 'windows' ? `-XX:+UseLargePages ` : ""));
    // Só limita threads do GC manualmente acima de 16 threads; até 16 threads a ergonomia automática do HotSpot já escolhe bem
    const gcThreadsPart = cpu.threads > 16 ? `-XX:ConcGCThreads=${cpu.concGC} -XX:ParallelGCThreads=${cpu.parGC} ` : "";

    // Tolerância de spike do ZGC: mantém o padrão 2.0 em RAM rápida e sobe para 3.0 apenas em DDR3 / DDR4<=2666 / single-channel
    const slowRam = state.ddrType === 'DDR3' || (state.ddrType === 'DDR4' && state.ramFreq <= 2666) || state.memChannels === 1;
    const spikePart = slowRam ? '-XX:ZAllocationSpikeTolerance=3.0 ' : '';

    // G1GC voltado a cliente (frametime estável) e tamanho de região proporcional ao heap
    const regionSize = state.allocRamGB >= 12 ? '16M' : (state.allocRamGB >= 6 ? '8M' : '4M');
    const maxPause = state.ddrType === 'DDR3' ? 75 : 50;
    const g1SizingPart = state.allocRamGB <= 6
        ? '-XX:G1NewSizePercent=20 -XX:G1MaxNewSizePercent=35 -XX:G1ReservePercent=15 -XX:InitiatingHeapOccupancyPercent=20'
        : '-XX:G1NewSizePercent=25 -XX:G1MaxNewSizePercent=40 -XX:G1ReservePercent=15 -XX:InitiatingHeapOccupancyPercent=20 -XX:SurvivorRatio=32 -XX:MaxTenuringThreshold=1';

    // Flags do Compilador JIT do Oracle GraalVM: prefixo mudou para -Djdk.graal.* nas versões recentes; sem CompilerConfiguration=community para manter o tier enterprise
    const graalPrefix = javaVer === '23' ? '-Djdk.graal' : '-Dgraal';
    const graalJITFlags = `-XX:+UseJVMCICompiler -XX:+EagerJVMCI ${graalPrefix}.TuneInlinerExploration=1 -XX:ReservedCodeCacheSize=${state.codeCacheMB}M`;

    // ZGC: -XX:+ZGenerational só existe (e só é necessária) no Java 21; no 17 o ZGC não é geracional e no 23+ já é o padrão
    const zgcFlag = javaVer === '21' ? '-XX:+UseZGC -XX:+ZGenerational' : '-XX:+UseZGC';

    const gcArgs = isZgcEngine
        ? `${zgcFlag} ${gcThreadsPart}${spikePart}-XX:SoftMaxHeapSize=${state.softMaxGB}G -XX:MetaspaceSize=${state.metaMB}M ${lpPart}-XX:+AlwaysPreTouch -XX:+ExplicitGCInvokesConcurrent`
        : `-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=${maxPause} ${gcThreadsPart}${g1SizingPart} -XX:G1HeapRegionSize=${regionSize} -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:MetaspaceSize=${state.metaMB}M ${lpPart}-XX:+AlwaysPreTouch -XX:+ExplicitGCInvokesConcurrent -XX:+UseStringDeduplication`;
    const finalArgs = `${xmxPart}${expPart}${useGraalJit ? graalJITFlags + ' ' : ''}${gcArgs}`.replace(/\s+/g, ' ').trim();

    const javaLabel = javaVer === '23' ? '23+' : javaVer;
    const gcLabel = isZgcEngine ? (javaVer === '21' ? 'Generational ZGC' : 'ZGC') : 'G1GC Tuned';
    const engineLabel = `${isGraalEngine ? 'Oracle GraalVM' : 'OpenJDK / Temurin'} ${javaLabel} (${gcLabel}${useGraalJit ? ' + Graal JIT' : ''})`;

    // Selos que descrevem a engine realmente gerada (o JIT do Graal só vale com G1)
    document.getElementById('header-engine-badge').textContent = engineLabel;
    document.getElementById('i18n-graal-pill').textContent = useGraalJit ? i18n[lang].graalPillOn : i18n[lang].graalPill;
    document.getElementById('jvm-args-box').textContent = finalArgs;
    const hasMin = LAUNCHERS[state.launcher].hasMinRam;
    const memPrompt = hasMin === true
        ? (lang === 'pt' ? `No Launcher: memória mínima = máxima = ${allocMB} MiB (${state.allocRamGB} GB)` : `In Launcher: minimum = maximum memory = ${allocMB} MiB (${state.allocRamGB} GB)`)
        : hasMin === false
        ? (lang === 'pt' ? `No Launcher: memória máxima = ${allocMB} MiB (${state.allocRamGB} GB)` : `In Launcher: maximum memory = ${allocMB} MiB (${state.allocRamGB} GB)`)
        : (lang === 'pt' ? `No Launcher: defina ${allocMB} MiB (${state.allocRamGB} GB)` : `In Launcher: set ${allocMB} MiB (${state.allocRamGB} GB)`);
    document.getElementById('jvm-command-subtitle').innerHTML = lang === 'pt'
        ? `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>${includeXmx ? `Linha completa: já inclui -Xms/-Xmx (${allocMB} MiB)` : memPrompt} • ${engineLabel}`
        : `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>${includeXmx ? `Full line: already includes -Xms/-Xmx (${allocMB} MiB)` : memPrompt} • ${engineLabel}`;

    // Explicação dinâmica das flags (depende da engine escolhida)
    const expList = document.getElementById('dynamic-flags-explanation');
    const isGraal = useGraalJit;
    const isZgc = isZgcEngine;
    const pt = lang === 'pt';
    const items = [];
    if (isGraal) {
        items.push(pt
            ? `<li><strong class="text-purple-300 font-mono">-XX:+UseJVMCICompiler ${graalPrefix}.TuneInlinerExploration=1</strong>: usa o compilador JIT do <strong>Oracle GraalVM</strong> (mantendo a configuração padrão <code>enterprise</code>) com inlining mais exploratório. O ganho varia conforme o modpack e o JIT gasta CPU e RAM extras no aquecimento.</li>`
            : `<li><strong class="text-purple-300 font-mono">-XX:+UseJVMCICompiler ${graalPrefix}.TuneInlinerExploration=1</strong>: uses the <strong>Oracle GraalVM</strong> JIT compiler (keeping the default <code>enterprise</code> configuration) with more exploratory inlining. Gains vary by modpack and the JIT spends extra CPU and RAM while warming up.</li>`);
    } else {
        items.push(pt
            ? `<li><strong class="text-purple-300 font-mono">JIT padrão (C2)</strong>: sem flags do Graal. O compilador C2 do HotSpot aquece mais rápido e gasta menos CPU/RAM que o JIT do Graal, a escolha segura para ${cpu.threads} threads e ${state.sysRamGB} GB de RAM.</li>`
            : `<li><strong class="text-purple-300 font-mono">Default JIT (C2)</strong>: no Graal flags. HotSpot's C2 compiler warms up faster and uses less CPU/RAM than Graal's JIT, the safe choice for ${cpu.threads} threads and ${state.sysRamGB} GB of RAM.</li>`);
    }
    if (cpu.threads > 16) {
        items.push(pt
            ? `<li><strong class="text-emerald-300 font-mono">-XX:ConcGCThreads=${cpu.concGC} -XX:ParallelGCThreads=${cpu.parGC}</strong>: calculado para os seus <strong>${cpu.cores} núcleos / ${cpu.threads} threads</strong>, evitando que o coletor aloque threads demais e dispute núcleos com o jogo e o servidor integrado.</li>`
            : `<li><strong class="text-emerald-300 font-mono">-XX:ConcGCThreads=${cpu.concGC} -XX:ParallelGCThreads=${cpu.parGC}</strong>: capped for your <strong>${cpu.cores} cores / ${cpu.threads} threads</strong>, preventing the GC from grabbing too many threads away from the game and integrated server.</li>`);
    } else {
        items.push(pt
            ? `<li><strong class="text-emerald-300 font-mono">Threads do GC (Auto)</strong>: para <strong>${cpu.threads} threads</strong>, o ajuste automático do HotSpot já dimensiona bem as threads concorrentes e paralelas sem travamento manual.</li>`
            : `<li><strong class="text-emerald-300 font-mono">GC Threads (Auto)</strong>: for <strong>${cpu.threads} threads</strong>, HotSpot's automatic GC thread sizing already picks sensible concurrent/parallel counts without manual overrides.</li>`);
    }
    if (isZgc) {
        items.push(pt
            ? `<li><strong class="text-blue-300 font-mono">-XX:SoftMaxHeapSize=${state.softMaxGB}G</strong>: pede ao ZGC que tente manter o heap em ${state.softMaxGB} GB, usando os ${state.allocRamGB - state.softMaxGB} GB restantes como folga contra picos de alocação (evita travadas por falta de memória livre).</li>`
            : `<li><strong class="text-blue-300 font-mono">-XX:SoftMaxHeapSize=${state.softMaxGB}G</strong>: asks ZGC to try to keep the heap at ${state.softMaxGB} GB, using the remaining ${state.allocRamGB - state.softMaxGB} GB as headroom for allocation spikes (avoids stalls from running out of free memory).</li>`);
        if (slowRam) {
            items.push(pt
                ? `<li><strong class="text-amber-300 font-mono">-XX:ZAllocationSpikeTolerance=3.0</strong>: como sua RAM é ${state.memChannels === 1 ? 'single-channel' : `${state.ddrType} ${state.ramFreq} MHz`}, o ciclo do ZGC demora mais para concluir; elevar de 2.0 para 3.0 antecipa a coleta antes de um pico encher o buffer.</li>`
                : `<li><strong class="text-amber-300 font-mono">-XX:ZAllocationSpikeTolerance=3.0</strong>: because your RAM is ${state.memChannels === 1 ? 'single-channel' : `${state.ddrType} ${state.ramFreq} MHz`}, ZGC cycles take longer to finish; raising it from 2.0 to 3.0 triggers collection earlier ahead of spikes.</li>`);
        } else {
            items.push(pt
                ? `<li><strong class="text-amber-300 font-mono">ZAllocationSpikeTolerance (padrão 2.0)</strong>: com RAM rápida em dual-channel, o padrão 2.0 do ZGC evita ciclos extras desnecessários e economiza CPU.</li>`
                : `<li><strong class="text-amber-300 font-mono">ZAllocationSpikeTolerance (default 2.0)</strong>: with fast dual-channel RAM, ZGC's default 2.0 avoids extra GC cycles and saves CPU.</li>`);
        }
    } else {
        items.push(pt
            ? `<li><strong class="text-blue-300 font-mono">-XX:+UseG1GC -XX:MaxGCPauseMillis=${maxPause} -XX:G1HeapRegionSize=${regionSize}</strong>: perfil G1 voltado a cliente (meta de ${maxPause} ms, regiões de ${regionSize} escaladas para ${state.allocRamGB} GB de heap e nova geração de ${state.allocRamGB <= 6 ? '20–35%' : '25–40%'}). Consome menos memória extra que o ZGC.</li>`
            : `<li><strong class="text-blue-300 font-mono">-XX:+UseG1GC -XX:MaxGCPauseMillis=${maxPause} -XX:G1HeapRegionSize=${regionSize}</strong>: client-oriented G1 profile (${maxPause} ms target, ${regionSize} regions scaled to ${state.allocRamGB} GB heap, ${state.allocRamGB <= 6 ? '20–35%' : '25–40%'} young gen). Needs less extra memory than ZGC.</li>`);
    }
    if (isZgc) {
        const zgcNote = javaVer === '21'
            ? (pt ? `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC -XX:+ZGenerational</strong>: ZGC geracional (Java 21): coleta os objetos novos com mais frequência e menos custo, ideal para o lixo temporário de chunks.</li>`
                  : `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC -XX:+ZGenerational</strong>: generational ZGC (Java 21): collects young objects more often and at lower cost, ideal for temporary chunk garbage.</li>`)
            : javaVer === '17'
            ? (pt ? `<li class="text-amber-200"><strong class="text-amber-300 font-mono">-XX:+UseZGC (Java 17 — não recomendado)</strong>: no Java 17 o ZGC não é geracional e costuma ter desempenho bem inferior ao G1GC no Minecraft com mods. Prefira <em>Temurin (G1GC Tuned)</em> ou atualize para Java 21+.</li>`
                  : `<li class="text-amber-200"><strong class="text-amber-300 font-mono">-XX:+UseZGC (Java 17 — not recommended)</strong>: Java 17 only has non-generational ZGC, which generally performs worse than G1GC on modded Minecraft. Prefer <em>Temurin (G1GC Tuned)</em> or upgrade to Java 21+.</li>`)
            : (pt ? `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC</strong>: no Java 23+ o ZGC já é geracional por padrão e a flag <code>-XX:+ZGenerational</code> ficou obsoleta (a JVM avisa), por isso foi omitida.</li>`
                  : `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC</strong>: on Java 23+ ZGC is generational by default and <code>-XX:+ZGenerational</code> is obsolete (the JVM warns), so it was omitted.</li>`);
        items.push(zgcNote);
    }
    items.push(pt
        ? `<li><strong class="text-cyan-300 font-mono">-XX:+ExplicitGCInvokesConcurrent</strong>: transforma eventuais chamadas <code>System.gc()</code> de mods em coleta concorrente (sem travar o jogo), preservando a limpeza de buffers nativos (<code>DirectByteBuffer</code>) que o <code>DisableExplicitGC</code> bloquearia.</li>`
        : `<li><strong class="text-cyan-300 font-mono">-XX:+ExplicitGCInvokesConcurrent</strong>: runs any mod <code>System.gc()</code> calls concurrently instead of freezing the game, while preserving native buffer (<code>DirectByteBuffer</code>) cleanup that <code>DisableExplicitGC</code> would block.</li>`);
    if (javaVer === '23' && state.mcVersion === '1.20.1') {
        items.push(pt ? `<li>Nem todo mod da 1.20.1 funciona em um Java muito novo. Se o jogo não abrir, volte para o Java 21 (ou 17).</li>`
                      : `<li>Not every 1.20.1 mod works on a very new Java. If the game does not start, go back to Java 21 (or 17).</li>`);
    }
    if (useLargePages && state.os === 'windows') {
        items.push(pt ? `<li><strong class="text-amber-300 font-mono">-XX:+UseLargePages</strong>: exige a política "Bloquear páginas na memória" (<code>secpol.msc</code> → Políticas Locais → Atribuição de direitos de usuário — ausente no Windows Home), reinício e, em muitos casos, privilégio elevado; sem isso a JVM ignora a flag com um aviso.</li>`
                      : `<li><strong class="text-amber-300 font-mono">-XX:+UseLargePages</strong>: requires the "Lock pages in memory" policy (<code>secpol.msc</code> → Local Policies → User Rights Assignment — unavailable on Windows Home), a reboot, and often an elevated token; without it the JVM ignores the flag with a warning.</li>`);
    }
    if (useLargePages && state.os === 'linux') {
        items.push(pt ? `<li><strong class="text-amber-300 font-mono">-XX:+UseTransparentHugePages</strong>: confira com <code>cat /sys/kernel/mm/transparent_hugepage/enabled</code>; o ideal é <code>[madvise]</code> (evite <code>[always]</code> com defrag agressivo, que pode causar micro-travadas). No ZGC em Java 24/25+, <code>/sys/kernel/mm/transparent_hugepage/shmem_enabled</code> também precisa estar em <code>advise</code>; caso esteja em <code>[never]</code>, a JVM desativa a opção e avisa.</li>`
                      : `<li><strong class="text-amber-300 font-mono">-XX:+UseTransparentHugePages</strong>: check with <code>cat /sys/kernel/mm/transparent_hugepage/enabled</code>; <code>[madvise]</code> is ideal (avoid <code>[always]</code> with aggressive defrag, which can cause stutters). For ZGC on Java 24/25+, <code>/sys/kernel/mm/transparent_hugepage/shmem_enabled</code> must also be set to <code>advise</code>; if set to <code>[never]</code>, the JVM disables the option and warns.</li>`);
    }
    expList.innerHTML = items.join('');
    renderLauncherGuide();
}

// Guia dinâmico "Como aplicar no seu Launcher" (depende de launcher, SO, engine e Java)
function renderLauncherGuide() {
    const pt = state.lang === 'pt';
    const isGraal = state.jvmEngine.startsWith('graal');
    const jv = state.javaVersion === '23' ? (pt ? '23 ou superior (ex.: 25 LTS)' : '23 or newer (e.g. 25 LTS)') : state.javaVersion;
    const includeXmx = document.getElementById('chk-include-xmx').checked;
    const mib = state.allocRamGB * 1024;
    const javaBin = state.os === 'windows' ? 'bin\\javaw.exe' : (state.os === 'macos' ? 'Contents/Home/bin/java' : 'bin/java');
    const code = (txt) => `<code class="text-emerald-300 font-mono">${txt}</code>`;
    const L = state.launcher;
    const sep = LAUNCHERS[L].separateMemory;
    const hasMin = LAUNCHERS[L].hasMinRam;
    const steps = [];

    const dl = isGraal ? `Oracle GraalVM for JDK ${jv}` : `Eclipse Temurin ${jv}`;
    const site = isGraal ? 'graalvm.org/downloads' : 'adoptium.net';
    const pkg = state.os === 'windows' ? 'ZIP' : (state.os === 'macos' ? (pt ? 'pacote aarch64 (ARM64), não x64' : 'aarch64 (ARM64) package, not x64') : 'tar.gz');
    steps.push(pt
        ? `Baixe o <strong>${dl}</strong> em ${code(site)} (${pkg}) e extraia/instale no seu SSD.`
        : `Download <strong>${dl}</strong> from ${code(site)} (${pkg}) and extract/install it on your SSD.`);

    const where = {
        prism: pt ? `No <strong>Prism Launcher / MultiMC</strong>: clique com o botão direito na instância → <em>Editar</em> → <em>Configurações</em> → <em>Java</em>.` : `In <strong>Prism Launcher / MultiMC</strong>: right-click the instance → <em>Edit</em> → <em>Settings</em> → <em>Java</em>.`,
        curseforge: pt ? `No <strong>CurseForge App</strong>: <em>Configurações</em> (engrenagem) → <em>Específico do jogo</em> (<em>Game Specific</em>) → <em>Minecraft</em> → <em>Configurações Java</em>.` : `In the <strong>CurseForge App</strong>: <em>Settings</em> (gear) → <em>Game Specific</em> → <em>Minecraft</em> → <em>Java Settings</em>.`,
        modrinth: pt ? `No <strong>Modrinth App</strong>: abra a instância → <em>Configurações</em> → <em>Java e memória</em> (marque <em>Substituir configurações globais de memória</em> se estiver bloqueado).` : `In the <strong>Modrinth App</strong>: open the instance → <em>Settings</em> → <em>Java and memory</em> (enable <em>Override global memory settings</em> if locked).`,
        atlauncher: pt ? `No <strong>ATLauncher</strong>: <em>Configurações</em> → aba <em>Java/Minecraft</em>.` : `In <strong>ATLauncher</strong>: <em>Settings</em> → <em>Java/Minecraft</em> tab.`,
        vanilla: pt ? `No <strong>Launcher oficial</strong>: <em>Instalações</em> → <em>Editar</em> a instalação → <em>Mais opções</em>.` : `In the <strong>Official Launcher</strong>: <em>Installations</em> → <em>Edit</em> the installation → <em>More options</em>.`,
        other: pt ? `No <strong>seu launcher</strong>, abra as configurações de Java da instância.` : `In <strong>your launcher</strong>, open the instance's Java settings.`
    }[L];
    steps.push(`${where} ` + (pt ? `Aponte o Java para ${code(javaBin)} da pasta que você extraiu.` : `Point Java to ${code(javaBin)} inside the folder you extracted.`));

    // Memória: evita duplicar -Xms/-Xmx e distingue launchers com Mín+Máx daqueles só com slider de Máxima
    if (sep === null) {
        steps.push(includeXmx
            ? (pt ? `A linha já inclui ${code('-Xms/-Xmx')} (${mib} MiB). Se o seu launcher tiver um campo de memória próprio, deixe-o no padrão ou desmarque "Incluir -Xms / -Xmx" para não duplicar.` : `The line already includes ${code('-Xms/-Xmx')} (${mib} MiB). If your launcher has its own memory field, leave it at default or untick "Include -Xms / -Xmx" to avoid duplicates.`)
            : (pt ? `Se o launcher tem campo de memória, defina <strong>${mib} MiB</strong> nele (Mínima = Máxima se houver ambos). Se ele só tem a caixa de argumentos, marque "Incluir -Xms / -Xmx".` : `If the launcher has a memory field, set <strong>${mib} MiB</strong> there (Minimum = Maximum if both exist). If it only has an arguments box, tick "Include -Xms / -Xmx".`));
    } else if (includeXmx && sep) {
        steps.push(pt ? `⚠ A linha inclui ${code('-Xms/-Xmx')}, mas este launcher tem controle próprio de memória (que envia ${code('-Xmx')}): deixe a memória do launcher no padrão ou desmarque "Incluir -Xms / -Xmx", senão ${code('-Xmx')} fica duplicado.` : `⚠ The line includes ${code('-Xms/-Xmx')}, but this launcher has its own memory control (which passes ${code('-Xmx')}): leave the launcher memory at default or untick "Include -Xms / -Xmx", otherwise ${code('-Xmx')} is duplicated.`);
    } else if (includeXmx) {
        steps.push(pt ? `A linha já inclui ${code('-Xms/-Xmx')} (${mib} MiB): não é preciso definir a memória em outro lugar.` : `The line already includes ${code('-Xms/-Xmx')} (${mib} MiB): no need to set memory anywhere else.`);
    } else if (sep && hasMin) {
        steps.push(pt ? `${L === 'prism' ? 'Marque <em>Memória</em> e defina' : 'Defina'} a memória <strong>Mínima e Máxima = ${mib} MiB</strong> no campo de memória do launcher. A linha de argumentos não leva ${code('-Xms/-Xmx')}, então nada se duplica.` : `${L === 'prism' ? 'Tick <em>Memory</em> and set' : 'Set'} <strong>Minimum and Maximum memory = ${mib} MiB</strong> in the launcher's memory field. The arguments line has no ${code('-Xms/-Xmx')}, so nothing is duplicated.`);
    } else if (sep) {
        steps.push(pt ? `Defina o controle de <strong>Memória alocada / máxima = ${mib} MiB</strong> no launcher (este launcher não tem campo de memória mínima separado). Se quiser pré-alocar tudo no boot com <code>AlwaysPreTouch</code>, pode adicionar ${code(`-Xms${mib}M`)} nos argumentos, opcionalmente.` : `Set the launcher's <strong>Allocated / Maximum memory</strong> slider to <strong>${mib} MiB</strong> (this launcher has no separate Minimum RAM field). If you want full upfront pre-allocation with <code>AlwaysPreTouch</code>, you can optionally add ${code(`-Xms${mib}M`)} to the arguments.`);
    } else {
        steps.push(pt ? `⚠ Este launcher não tem campo de memória separado: marque "Incluir -Xms / -Xmx" para a linha levar ${mib} MiB.` : `⚠ This launcher has no separate memory field: tick "Include -Xms / -Xmx" so the line carries ${mib} MiB.`);
    }

    const argField = {
        prism: pt ? 'Argumentos Java' : 'Java arguments',
        curseforge: pt ? 'Argumentos Java' : 'Java arguments',
        modrinth: pt ? 'Argumentos Java personalizados' : 'Custom Java arguments',
        atlauncher: pt ? 'Parâmetros Java' : 'Java Parameters',
        vanilla: pt ? 'Argumentos da JVM (apague o texto padrão, como -Xmx2G, antes de colar)' : 'JVM Arguments (delete the default text, such as -Xmx2G, before pasting)',
        other: pt ? 'argumentos da JVM' : 'JVM arguments'
    }[L];
    steps.push(pt ? `Cole a linha de argumentos gerada em <strong>${argField}</strong>.` : `Paste the generated arguments line into <strong>${argField}</strong>.`);

    if (L === 'prism' && state.mcVersion === '1.20.1' && state.javaVersion !== '17') {
        steps.push(pt ? `Marque <strong>"Ignorar verificação de compatibilidade do Java"</strong> (a 1.20.1 pede Java 17 por padrão, mas costuma rodar bem no Java 21).` : `Enable <strong>"Skip Java compatibility checks"</strong> (1.20.1 asks for Java 17 by default, but it usually runs fine on Java 21).`);
    }
    if (state.os === 'linux') {
        steps.push(pt ? `No Linux, as variáveis de ambiente do driver (Mesa/NVIDIA) e o Transparent Huge Pages estão na <strong>Seção 5 (Driver GPU & Shaders)</strong>.` : `On Linux, the driver environment variables (Mesa/NVIDIA) and Transparent Huge Pages are in <strong>Section 5 (GPU Driver & Shaders)</strong>.`);
    }
    if (state.jvmEngine === 'graal_g1') {
        steps.push(pt ? `O JIT Graal pode melhorar o desempenho em bases pesadas, mas o ganho varia conforme o modpack.` : `The Graal JIT can improve performance on heavy packs, but the gain varies by modpack.`);
    }
    steps.push(pt ? `<span class="text-gray-400">Os nomes dos menus podem variar conforme a versão do launcher.</span>` : `<span class="text-gray-400">Menu names may vary with your launcher version.</span>`);
    document.getElementById('i18n-graal-guide-steps').innerHTML = steps.map(x => `<li>${x}</li>`).join('');
}
