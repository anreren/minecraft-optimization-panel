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
    document.getElementById('cpu-meta-desc').textContent = `${cpu.arch} • ${i18n[lang].stLabel}: ${i18n[lang].stNames[cpu.st]} • L3 ${cpu.l3} • ConcGC: ${cpu.concGC} / ParGC: ${cpu.parGC}`;

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
    document.getElementById('storage-badge-io').textContent = `SpikeTol: ${storage.spikeTol}`;
    document.getElementById('storage-meta-desc').textContent = storage.ioDesc[lang];

    // 2. Calcula SoftMaxHeapSize, Metaspace e CodeCache do GraalVM
    const allocGB = state.allocRamGB;
    const allocMB = allocGB * 1024;
    const bufferGB = allocGB >= 9 ? 2 : 1;
    state.softMaxGB = Math.max(3, allocGB - bufferGB);
    state.metaMB = allocGB <= 7 ? 384 : (allocGB >= 13 ? 768 : 512);
    state.codeCacheMB = allocGB <= 7 ? 384 : 512;

    // Atualiza mostradores de RAM e barra visual
    document.getElementById('ram-alloc-gb').textContent = `${allocGB} GB`;
    document.getElementById('ram-alloc-mb').textContent = `(${allocMB} MiB)`;

    const graalOverheadGB = +((state.metaMB + state.codeCacheMB) / 1024).toFixed(1);
    const igpuRes = igpuReserveGB(gpu);
    const freeSysGB = +(state.sysRamGB - allocGB - graalOverheadGB - igpuRes).toFixed(1);

    const warnBanner = document.getElementById('ram-warning-banner');
    if (freeSysGB < 2.5) {
        warnBanner.classList.remove('hidden');
        document.getElementById('ram-warning-text').textContent = lang === 'pt'
            ? `Cuidado: Restam apenas ${Math.max(0, freeSysGB)} GB para o Sistema Operacional e para o compilador JIT do GraalVM! Reduza a alocação para no máximo ${maxSafeAllocGB()} GB para evitar que o jogo feche sozinho.`
            : `Warning: Only ${Math.max(0, freeSysGB)} GB left for the Operating System and GraalVM JIT compiler! Reduce allocation to at most ${maxSafeAllocGB()} GB to prevent crashes.`;
    } else {
        warnBanner.classList.add('hidden');
    }

    document.getElementById('ram-bar-title').textContent = lang === 'pt'
        ? `Divisão dos seus ${state.sysRamGB} GB ${state.ddrType} ${state.ramFreq} MHz:`
        : `Breakdown of your ${state.sysRamGB} GB ${state.ddrType} ${state.ramFreq} MHz:`;
    document.getElementById('ram-bar-free-label').textContent = lang === 'pt'
        ? `${Math.max(0, freeSysGB)} GB livres para Sistema, Driver ${gpu.vendorLabel || gpu.vendor.toUpperCase()} e Cache Disco${igpuRes ? ` (já descontando ${igpuRes} GB da iGPU)` : ''}`
        : `${Math.max(0, freeSysGB)} GB free for OS, ${gpu.vendorLabel || gpu.vendor.toUpperCase()} Driver & Disk Cache${igpuRes ? ` (already minus ${igpuRes} GB for the iGPU)` : ''}`;

    const pctSoft = Math.min(100, (state.softMaxGB / state.sysRamGB) * 100);
    const pctBuf = Math.min(100 - pctSoft, (bufferGB / state.sysRamGB) * 100);
    const pctGraal = Math.min(100 - pctSoft - pctBuf, (graalOverheadGB / state.sysRamGB) * 100);
    const pctFree = Math.max(0, 100 - pctSoft - pctBuf - pctGraal - (igpuRes / state.sysRamGB) * 100);

    document.getElementById('bar-seg-soft').style.width = `${pctSoft}%`;
    document.getElementById('bar-seg-buf').style.width = `${pctBuf}%`;
    document.getElementById('bar-seg-graal').style.width = `${pctGraal}%`;
    document.getElementById('bar-seg-free').style.width = `${pctFree}%`;

    document.getElementById('leg-soft').textContent = `${state.softMaxGB} GB`;
    document.getElementById('leg-buf').textContent = `${bufferGB} GB`;
    document.getElementById('leg-graal').textContent = `${graalOverheadGB} GB`;
    document.getElementById('leg-free').textContent = `${Math.max(0, freeSysGB)} GB`;

    // 3. Gera os Argumentos JVM Focados em GraalVM
    generateJVMArguments(cpu, gpu, storage, allocMB);

    // 4. Renderiza Diagnósticos de Hardware (CPU + RAM Latency + Storage/GPU)
    renderHardwareDiagnostics(cpu, gpu, storage);

    // 5. Renderiza Catálogo de Mods para o Loader e Versão escolhidos
    renderDynamicMods();

    // 6. Renderiza a Config Ativa da Seção 4
    renderActiveConfigTab();

    // 7. Salva a configuração (localStorage + hash da URL) para recarregar ou compartilhar
    persistConfig();
}

function generateJVMArguments(cpu, gpu, storage, allocMB) {
    const lang = state.lang;
    const storageName = storage.name[lang];
    const includeXmx = document.getElementById('chk-include-xmx').checked;
    const useLargePages = document.getElementById('chk-large-pages').checked;
    const javaVer = state.javaVersion;
    const isGraalEngine = state.jvmEngine.startsWith('graal');
    // Com ZGC a JVM desativa o JVMCI (aviso "EnableJVMCI to false as selected GC does not support JVMCI"): o JIT do Graal só vale com G1
    const useGraalJit = state.jvmEngine === 'graal_g1';
    const isZgcEngine = state.jvmEngine.endsWith('_zgc');
    const xmxPart = includeXmx ? `-Xms${allocMB}M -Xmx${allocMB}M ` : "";
    // Páginas grandes: LargePages no Windows, Transparent Huge Pages no Linux, indisponível no macOS
    const lpPart = !useLargePages ? "" : (state.os === 'linux' ? `-XX:+UseTransparentHugePages ` : (state.os === 'windows' ? `-XX:+UseLargePages ` : ""));

    // Ajuste de tolerância de spike para memórias DDR3/DDR4 lentas + NVMe
    let spikeTol = parseFloat(storage.spikeTol);
    if (state.ddrType === 'DDR3' || (state.ddrType === 'DDR4' && state.ramFreq <= 2666) || state.memChannels === 1) {
        spikeTol = Math.min(5.0, +(spikeTol + 0.5).toFixed(1));
    }

    const maxPause = state.ddrType === 'DDR5' ? 90 : (state.ddrType === 'DDR3' ? 150 : 120);

    // Flags do Compilador JIT do Oracle GraalVM (no Java 23+ o prefixo das opções -Dgraal.* mudou: só as -XX são emitidas)
    const graalJITFlags = javaVer === '23'
        ? `-XX:+UseJVMCICompiler -XX:+EagerJVMCI -XX:ReservedCodeCacheSize=${state.codeCacheMB}M`
        : `-XX:+UseJVMCICompiler -XX:+EagerJVMCI -Dgraal.TuneInlinerExploration=1 -Dgraal.CompilerConfiguration=community -XX:ReservedCodeCacheSize=${state.codeCacheMB}M`;

    // ZGC: -XX:+ZGenerational só existe (e só é necessária) no Java 21; no 17 o ZGC não é geracional e no 23+ já é o padrão
    const zgcFlag = javaVer === '21' ? '-XX:+UseZGC -XX:+ZGenerational' : '-XX:+UseZGC';

    const gcArgs = isZgcEngine
        ? `${zgcFlag} -XX:ConcGCThreads=${cpu.concGC} -XX:ParallelGCThreads=${cpu.parGC} -XX:ZAllocationSpikeTolerance=${spikeTol} -XX:SoftMaxHeapSize=${state.softMaxGB}G -XX:MetaspaceSize=${state.metaMB}M -XX:MaxMetaspaceSize=2048M ${lpPart}-XX:+AlwaysPreTouch -XX:+DisableExplicitGC -XX:+PerfDisableSharedMem -XX:+UseStringDeduplication -Dfml.readTimeout=180`
        : `-XX:+UseG1GC -XX:+ParallelRefProcEnabled -XX:MaxGCPauseMillis=${maxPause} -XX:ConcGCThreads=${cpu.concGC} -XX:ParallelGCThreads=${cpu.parGC} -XX:G1NewSizePercent=30 -XX:G1MaxNewSizePercent=40 -XX:G1HeapRegionSize=16M -XX:G1ReservePercent=20 -XX:G1HeapWastePercent=5 -XX:G1MixedGCCountTarget=4 -XX:InitiatingHeapOccupancyPercent=15 -XX:G1MixedGCLiveThresholdPercent=90 -XX:G1RSetUpdatingPauseTimePercent=5 -XX:SurvivorRatio=32 -XX:MaxTenuringThreshold=1 -XX:MetaspaceSize=${state.metaMB}M ${lpPart}-XX:+AlwaysPreTouch -XX:+DisableExplicitGC -XX:+PerfDisableSharedMem -XX:+UseStringDeduplication -Dfml.readTimeout=180`;
    const finalArgs = `${xmxPart}-XX:+UnlockExperimentalVMOptions -XX:+UnlockDiagnosticVMOptions ${useGraalJit ? graalJITFlags + ' ' : ''}${gcArgs}`;

    const javaLabel = javaVer === '23' ? '23+' : javaVer;
    const gcLabel = isZgcEngine ? (javaVer === '21' ? 'Generational ZGC' : 'ZGC') : 'G1GC Tuned';
    const engineLabel = `${isGraalEngine ? 'Oracle GraalVM' : 'OpenJDK / Temurin'} ${javaLabel} (${gcLabel}${useGraalJit ? ' + Graal JIT' : ''})`;

    // Selos que descrevem a engine realmente gerada (o JIT do Graal só vale com G1)
    document.getElementById('header-engine-badge').textContent = engineLabel;
    document.getElementById('i18n-graal-pill').textContent = useGraalJit ? i18n[lang].graalPillOn : i18n[lang].graalPill;
    document.getElementById('jvm-args-box').textContent = finalArgs;
    document.getElementById('jvm-command-subtitle').innerHTML = lang === 'pt'
        ? `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>${includeXmx ? `Linha completa: já inclui -Xms/-Xmx (${allocMB} MiB)` : `No Launcher: memória mínima = máxima = ${allocMB} MiB (${state.allocRamGB} GB)`} • ${engineLabel}`
        : `<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>${includeXmx ? `Full line: already includes -Xms/-Xmx (${allocMB} MiB)` : `In Launcher: minimum = maximum memory = ${allocMB} MiB (${state.allocRamGB} GB)`} • ${engineLabel}`;

    // Explicação dinâmica das flags (depende da engine escolhida)
    const expList = document.getElementById('dynamic-flags-explanation');
    const isGraal = state.jvmEngine === 'graal_g1';
    const isZgc = state.jvmEngine.includes('zgc');
    const pt = lang === 'pt';
    const items = [];
    if (isGraal) {
        items.push(pt
            ? `<li><strong class="text-purple-300 font-mono">-XX:+UseJVMCICompiler -Dgraal.TuneInlinerExploration=1</strong>: usa o compilador JIT do <strong>Oracle GraalVM</strong> com inlining mais exploratório. O ganho varia conforme o modpack e o JIT gasta CPU e RAM extras no aquecimento (por isso, com poucas threads ou pouca RAM, a engine passa para Temurin + G1).</li>`
            : `<li><strong class="text-purple-300 font-mono">-XX:+UseJVMCICompiler -Dgraal.TuneInlinerExploration=1</strong>: uses the <strong>Oracle GraalVM</strong> JIT compiler with more exploratory inlining. Gains vary by modpack and the JIT spends extra CPU and RAM while warming up (so with few threads or little RAM the engine switches to Temurin + G1).</li>`);
    } else {
        items.push(pt
            ? `<li><strong class="text-purple-300 font-mono">JIT padrão (C2)</strong>: sem flags do Graal. O compilador C2 do HotSpot aquece mais rápido e gasta menos CPU/RAM que o JIT do Graal, a escolha segura para ${cpu.threads} threads e ${state.sysRamGB} GB de RAM.</li>`
            : `<li><strong class="text-purple-300 font-mono">Default JIT (C2)</strong>: no Graal flags. HotSpot's C2 compiler warms up faster and uses less CPU/RAM than Graal's JIT, the safe choice for ${cpu.threads} threads and ${state.sysRamGB} GB of RAM.</li>`);
    }
    items.push(pt
        ? `<li><strong class="text-emerald-300 font-mono">-XX:ConcGCThreads=${cpu.concGC} -XX:ParallelGCThreads=${cpu.parGC}</strong>: calculado a partir dos seus <strong>${cpu.cores} núcleos / ${cpu.threads} threads</strong>, reservando parte deles para o coletor de lixo sem ocupar todos os núcleos que o jogo e o servidor integrado usam.</li>`
        : `<li><strong class="text-emerald-300 font-mono">-XX:ConcGCThreads=${cpu.concGC} -XX:ParallelGCThreads=${cpu.parGC}</strong>: derived from your <strong>${cpu.cores} cores / ${cpu.threads} threads</strong>, reserving some of them for the garbage collector without taking every core the game and the integrated server use.</li>`);
    if (isZgc) {
        items.push(pt
            ? `<li><strong class="text-blue-300 font-mono">-XX:SoftMaxHeapSize=${state.softMaxGB}G</strong>: pede ao ZGC que tente manter o heap em ${state.softMaxGB} GB, usando os ${state.allocRamGB - state.softMaxGB} GB restantes como folga contra picos de alocação (evita travadas por falta de memória livre).</li>`
            : `<li><strong class="text-blue-300 font-mono">-XX:SoftMaxHeapSize=${state.softMaxGB}G</strong>: asks ZGC to try to keep the heap at ${state.softMaxGB} GB, using the remaining ${state.allocRamGB - state.softMaxGB} GB as headroom for allocation spikes (avoids stalls from running out of free memory).</li>`);
        items.push(pt
            ? `<li><strong class="text-amber-300 font-mono">-XX:ZAllocationSpikeTolerance=${spikeTol}</strong>: quanto maior, mais cedo o ZGC inicia um ciclo antes de um pico de alocação. O valor considera o seu <strong>${storageName}</strong> (e +0,5 para RAM mais lenta). É uma heurística: se o GC consumir CPU demais, volte ao padrão 2.0.</li>`
            : `<li><strong class="text-amber-300 font-mono">-XX:ZAllocationSpikeTolerance=${spikeTol}</strong>: the higher it is, the earlier ZGC starts a cycle ahead of an allocation spike. The value takes your <strong>${storageName}</strong> into account (and +0.5 for slower RAM). It is a heuristic: if the GC uses too much CPU, go back to the default 2.0.</li>`);
    } else {
        items.push(pt
            ? `<li><strong class="text-blue-300 font-mono">-XX:+UseG1GC -XX:MaxGCPauseMillis=${maxPause}</strong>: perfil G1 voltado a pausas curtas (meta de ${maxPause} ms, mais folgada em ${state.ddrType}), com nova geração de 30–40% do heap e coleta mista antecipada. Consome menos memória extra que o ZGC.</li>`
            : `<li><strong class="text-blue-300 font-mono">-XX:+UseG1GC -XX:MaxGCPauseMillis=${maxPause}</strong>: G1 profile aimed at short pauses (${maxPause} ms target, looser on ${state.ddrType}), with a 30–40% young generation and early mixed collections. Needs less extra memory than ZGC.</li>`);
    }
    if (isZgc) {
        const zgcNote = javaVer === '21'
            ? (pt ? `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC -XX:+ZGenerational</strong>: ZGC geracional (Java 21): coleta os objetos novos com mais frequência e menos custo, ideal para o lixo temporário de chunks.</li>`
                  : `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC -XX:+ZGenerational</strong>: generational ZGC (Java 21): collects young objects more often and at lower cost, ideal for temporary chunk garbage.</li>`)
            : javaVer === '17'
            ? (pt ? `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC</strong>: no Java 17 só existe o ZGC não geracional; o geracional exige Java 21 ou superior.</li>`
                  : `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC</strong>: Java 17 only has the non-generational ZGC; the generational one needs Java 21 or newer.</li>`)
            : (pt ? `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC</strong>: no Java 23+ o ZGC já é geracional por padrão e a flag <code>-XX:+ZGenerational</code> ficou obsoleta (a JVM avisa), por isso foi omitida.</li>`
                  : `<li><strong class="text-blue-300 font-mono">-XX:+UseZGC</strong>: on Java 23+ ZGC is generational by default and <code>-XX:+ZGenerational</code> is obsolete (the JVM warns), so it was omitted.</li>`);
        items.push(zgcNote);
    }
    if (isGraal && javaVer === '23') {
        items.push(pt ? `<li>As opções <code>-Dgraal.*</code> foram omitidas: o prefixo delas mudou nas versões novas do GraalVM e usar o errado pode gerar erro. Se quiser, adicione-as manualmente com o prefixo da sua versão.</li>`
                      : `<li>The <code>-Dgraal.*</code> options were omitted: their prefix changed in newer GraalVM versions and using the wrong one may cause errors. Add them manually with your version's prefix if you want.</li>`);
    }
    if (javaVer === '23' && state.mcVersion === '1.20.1') {
        items.push(pt ? `<li>Nem todo mod da 1.20.1 funciona em um Java muito novo. Se o jogo não abrir, volte para o Java 21 (ou 17).</li>`
                      : `<li>Not every 1.20.1 mod works on a very new Java. If the game does not start, go back to Java 21 (or 17).</li>`);
    }
    if (useLargePages && state.os === 'windows') {
        items.push(pt ? `<li><strong class="text-amber-300 font-mono">-XX:+UseLargePages</strong>: exige a política "Bloquear páginas na memória" (secpol.msc → Políticas Locais → Atribuição de direitos de usuário) e reinício; sem isso a JVM ignora a flag com um aviso.</li>`
                      : `<li><strong class="text-amber-300 font-mono">-XX:+UseLargePages</strong>: requires the "Lock pages in memory" policy (secpol.msc → Local Policies → User Rights Assignment) and a reboot; without it the JVM ignores the flag with a warning.</li>`);
    }
    if (useLargePages && state.os === 'linux') {
        items.push(pt ? `<li><strong class="text-amber-300 font-mono">-XX:+UseTransparentHugePages</strong>: confira com <code>cat /sys/kernel/mm/transparent_hugepage/enabled</code>; deve mostrar [madvise] ou [always]. Se estiver em [never], a JVM desativa a opção e avisa.</li>`
                      : `<li><strong class="text-amber-300 font-mono">-XX:+UseTransparentHugePages</strong>: check with <code>cat /sys/kernel/mm/transparent_hugepage/enabled</code>; it should show [madvise] or [always]. If it is [never], the JVM disables the option and warns.</li>`);
    }
    if (state.jvmEngine === 'graal_zgc') {
        items.push(pt ? `<li><strong class="text-purple-300 font-mono">Graal + ZGC</strong>: com ZGC a JVM desativa o JIT do Graal (JVMCI), então a linha não leva as flags dele e o compilador C2 padrão é usado. Para usar o JIT do Graal, escolha <em>Oracle GraalVM (G1GC Tuned + JIT Graal)</em>. (Verificado em OpenJDK 21; não pude testar no Oracle GraalVM.)</li>`
                      : `<li><strong class="text-purple-300 font-mono">Graal + ZGC</strong>: with ZGC the JVM disables the Graal JIT (JVMCI), so the line has no Graal flags and the default C2 compiler is used. To use the Graal JIT, choose <em>Oracle GraalVM (G1GC Tuned + Graal JIT)</em>. (Verified on OpenJDK 21; I could not test it on Oracle GraalVM.)</li>`);
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
    const steps = [];

    const dl = isGraal ? `Oracle GraalVM for JDK ${jv}` : `Eclipse Temurin ${jv}`;
    const site = isGraal ? 'graalvm.org/downloads' : 'adoptium.net';
    const pkg = state.os === 'windows' ? 'ZIP' : (state.os === 'macos' ? (pt ? 'pacote aarch64 (ARM64), não x64' : 'aarch64 (ARM64) package, not x64') : 'tar.gz');
    steps.push(pt
        ? `Baixe o <strong>${dl}</strong> em ${code(site)} (${pkg}) e extraia/instale no seu SSD.`
        : `Download <strong>${dl}</strong> from ${code(site)} (${pkg}) and extract/install it on your SSD.`);

    const where = {
        prism: pt ? `No <strong>Prism Launcher / MultiMC</strong>: clique com o botão direito na instância → <em>Editar</em> → <em>Configurações</em> → <em>Java</em>.` : `In <strong>Prism Launcher / MultiMC</strong>: right-click the instance → <em>Edit</em> → <em>Settings</em> → <em>Java</em>.`,
        curseforge: pt ? `No <strong>CurseForge App</strong>: <em>Configurações</em> (engrenagem) → <em>Minecraft</em> → seção de Java.` : `In the <strong>CurseForge App</strong>: <em>Settings</em> (gear) → <em>Minecraft</em> → Java section.`,
        modrinth: pt ? `No <strong>Modrinth App</strong>: abra a instância → <em>Configurações</em> → <em>Java e memória</em>.` : `In the <strong>Modrinth App</strong>: open the instance → <em>Settings</em> → <em>Java and memory</em>.`,
        atlauncher: pt ? `No <strong>ATLauncher</strong>: <em>Configurações</em> → aba <em>Java/Minecraft</em>.` : `In <strong>ATLauncher</strong>: <em>Settings</em> → <em>Java/Minecraft</em> tab.`,
        vanilla: pt ? `No <strong>Launcher oficial</strong>: <em>Instalações</em> → <em>Editar</em> a instalação → <em>Mais opções</em>.` : `In the <strong>Official Launcher</strong>: <em>Installations</em> → <em>Edit</em> the installation → <em>More options</em>.`,
        other: pt ? `No <strong>seu launcher</strong>, abra as configurações de Java da instância.` : `In <strong>your launcher</strong>, open the instance's Java settings.`
    }[L];
    steps.push(`${where} ` + (pt ? `Aponte o Java para ${code(javaBin)} da pasta que você extraiu.` : `Point Java to ${code(javaBin)} inside the folder you extracted.`));

    // Memória: evita duplicar -Xms/-Xmx entre a linha e o campo do launcher
    if (sep === null) {
        steps.push(includeXmx
            ? (pt ? `A linha já inclui ${code('-Xms/-Xmx')} (${mib} MiB). Se o seu launcher tiver um campo de memória próprio, deixe-o no padrão ou desmarque "Incluir -Xms / -Xmx" para não duplicar.` : `The line already includes ${code('-Xms/-Xmx')} (${mib} MiB). If your launcher has its own memory field, leave it at default or untick "Include -Xms / -Xmx" to avoid duplicates.`)
            : (pt ? `Se o launcher tem campo de memória, defina <strong>Mínima = Máxima = ${mib} MiB</strong>. Se ele só tem a caixa de argumentos, marque "Incluir -Xms / -Xmx".` : `If the launcher has a memory field, set <strong>Minimum = Maximum = ${mib} MiB</strong>. If it only has an arguments box, tick "Include -Xms / -Xmx".`));
    } else if (includeXmx && sep) {
        steps.push(pt ? `⚠ A linha inclui ${code('-Xms/-Xmx')}, mas este launcher tem campo próprio de memória: deixe a memória do launcher no padrão ou desmarque "Incluir -Xms / -Xmx", senão ela fica duplicada.` : `⚠ The line includes ${code('-Xms/-Xmx')}, but this launcher has its own memory field: leave the launcher memory at default or untick "Include -Xms / -Xmx", otherwise it is duplicated.`);
    } else if (includeXmx) {
        steps.push(pt ? `A linha já inclui ${code('-Xms/-Xmx')} (${mib} MiB): não é preciso definir a memória em outro lugar.` : `The line already includes ${code('-Xms/-Xmx')} (${mib} MiB): no need to set memory anywhere else.`);
    } else if (sep) {
        steps.push(pt ? `Defina a memória <strong>Mínima e Máxima = ${mib} MiB</strong> no campo de memória do launcher. A linha de argumentos não leva ${code('-Xms/-Xmx')}, então nada se duplica.` : `Set <strong>Minimum and Maximum memory = ${mib} MiB</strong> in the launcher's memory field. The arguments line has no ${code('-Xms/-Xmx')}, so nothing is duplicated.`);
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
        steps.push(pt ? `No Linux, as variáveis de ambiente do driver (Mesa/NVIDIA) e o Transparent Huge Pages estão na aba <strong>Driver</strong> da Seção 4.` : `On Linux, the driver environment variables (Mesa/NVIDIA) and Transparent Huge Pages are in the <strong>Driver</strong> tab of Section 4.`);
    }
    if (state.jvmEngine === 'graal_g1') {
        steps.push(pt ? `O JIT Graal pode melhorar o desempenho em bases pesadas, mas o ganho varia conforme o modpack.` : `The Graal JIT can improve performance on heavy packs, but the gain varies by modpack.`);
    }
    steps.push(pt ? `<span class="text-gray-400">Os nomes dos menus podem variar conforme a versão do launcher.</span>` : `<span class="text-gray-400">Menu names may vary with your launcher version.</span>`);
    document.getElementById('i18n-graal-guide-steps').innerHTML = steps.map(x => `<li>${x}</li>`).join('');
}
