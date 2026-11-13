// Hardware diagnostics cards (RAM, GPU, disk, CPU, notebook, recommended settings).
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

function renderHardwareDiagnostics(cpu, gpu, storage) {
    const lang = state.lang;
    const storageName = storage.name[lang];
    const container = document.getElementById('hardware-diagnostics');

    // Diagnóstico de RAM
    let ramStatusTitle = "";
    let ramStatusDesc = "";
    let ramColor = "border-blue-500/30 bg-blue-950/20 text-blue-300";

    if (state.ddrType === 'DDR3') {
        ramStatusTitle = lang === 'pt'
            ? `Modo de Alta Compactação (${state.ddrType} ${state.ramFreq}MHz)`
            : `High Compression Mode (${state.ddrType} ${state.ramFreq}MHz)`;
        ramStatusDesc = lang === 'pt'
            ? `Em DDR3, a largura de banda com a CPU é limitada. Mantenha FerriteCore e ModernFix instalados (reduzem o volume de dados na RAM) e ative o XMP na BIOS, se disponível.`
            : `On DDR3, memory bandwidth to the CPU is constrained. Keep FerriteCore and ModernFix installed (they reduce the amount of data held in RAM) and enable XMP in the BIOS if available.`;
        ramColor = "border-amber-500/40 bg-amber-950/20 text-amber-300";
    } else if (state.ddrType === 'DDR4' && state.ramFreq <= 2666) {
        ramStatusTitle = lang === 'pt'
            ? `Otimização de Latência (${state.ddrType} ${state.ramFreq}MHz)`
            : `Latency Optimization (${state.ddrType} ${state.ramFreq}MHz)`;
        ramStatusDesc = lang === 'pt'
            ? `Frequências até 2666MHz limitam levemente o Infinity Fabric / Ring Bus. O GC ajustado do painel (SoftMaxHeapSize=${state.softMaxGB}G no ZGC, ou G1 com pausas curtas) evita varreduras longas na RAM e mantém o FPS estável.`
            : `Speeds up to 2666MHz slightly bottleneck Infinity Fabric / Ring Bus. The panel's tuned GC (SoftMaxHeapSize=${state.softMaxGB}G on ZGC, or G1 with short pauses) avoids long RAM sweeps and keeps frametimes smooth.`;
        ramColor = "border-emerald-500/30 bg-emerald-950/20 text-emerald-300";
    } else {
        ramStatusTitle = lang === 'pt'
            ? `Banda de Memória Rápida (${state.ddrType} ${state.ramFreq}MHz)`
            : `Fast Memory Bandwidth (${state.ddrType} ${state.ramFreq}MHz)`;
        ramStatusDesc = lang === 'pt'
            ? `Sua memória tem excelente taxa de transferência! O GC ajustado (ZGC ou G1) limpará objetos temporários de chunks com pausas curtas.`
            : `Your RAM offers high throughput! The tuned GC (ZGC or G1) will sweep temporary chunk objects with short pauses.`;
        ramColor = "border-cyan-500/30 bg-cyan-950/20 text-cyan-300";
    }

    // Canais de memória / largura de banda teórica
    const bwNow = memBandwidthGBs();
    if (cpu.apple) {
        ramStatusTitle = lang === 'pt' ? `Memória unificada (~${bwNow} GB/s)` : `Unified memory (~${bwNow} GB/s)`;
        ramStatusDesc = lang === 'pt'
            ? `O chip Apple usa uma única memória unificada compartilhada entre CPU e GPU, com banda muito alta. Não há DDR nem dual-channel para configurar: deixe memória livre para o macOS e para a GPU ao alocar o heap.`
            : `The Apple chip uses a single unified memory shared by CPU and GPU, with very high bandwidth. There is no DDR or dual-channel to configure: leave memory free for macOS and the GPU when sizing the heap.`;
        ramColor = "border-cyan-500/30 bg-cyan-950/20 text-cyan-300";
    } else if (state.memChannels === 1) {
        ramStatusDesc += lang === 'pt'
            ? ` Single-channel: banda teórica de ~${bwNow} GB/s (em dual-channel seriam ~${memBandwidthGBs(2)} GB/s). ${gpu.igpu ? 'Com iGPU o impacto é grande, pois ela divide essa banda com a CPU. ' : ''}Instale um segundo pente idêntico.`
            : ` Single-channel: theoretical bandwidth of ~${bwNow} GB/s (dual-channel would give ~${memBandwidthGBs(2)} GB/s). ${gpu.igpu ? 'With an iGPU the impact is large, since it shares that bandwidth with the CPU. ' : ''}Install a second matching stick.`;
        ramColor = "border-amber-500/40 bg-amber-950/20 text-amber-300";
    } else {
        ramStatusDesc += lang === 'pt' ? ` Banda teórica: ~${bwNow} GB/s.` : ` Theoretical bandwidth: ~${bwNow} GB/s.`;
    }

    // Diagnóstico de GPU / VRAM
    let gpuTitle = "";
    let gpuDesc = "";
    if (gpu.none) {
        gpuTitle = lang === 'pt' ? `CPU sem vídeo integrado (${cpu.name})` : `CPU without integrated graphics (${cpu.name})`;
        gpuDesc = lang === 'pt'
            ? `A ${cpu.name} não possui iGPU. Escolha uma placa de vídeo dedicada na lista ou selecione uma CPU com gráficos integrados (ex.: Ryzen 5 5600G, Core i5-12400).`
            : `The ${cpu.name} has no iGPU. Pick a dedicated graphics card from the list or choose a CPU with integrated graphics (e.g. Ryzen 5 5600G, Core i5-12400).`;
    } else if (gpu.unified) {
        gpuTitle = lang === 'pt' ? `Memória unificada: ${gpu.name}` : `Unified memory: ${gpu.name}`;
        gpuDesc = lang === 'pt'
            ? `Na ${gpu.name} a GPU usa a mesma memória da CPU, sem VRAM separada nem necessidade de dual-channel. Use um Java ARM64 (aarch64), mantenha o Mac na tomada e fora do Modo de baixo consumo e reserve memória para o macOS.`
            : `On the ${gpu.name} the GPU shares the CPU's memory, with no separate VRAM and no need for dual-channel. Use an ARM64 (aarch64) Java, keep the Mac plugged in and out of Low Power Mode, and reserve memory for macOS.`;
    } else if (gpu.igpu) {
        gpuTitle = lang === 'pt' ? `Gráficos Integrados: ${gpu.name}` : `Integrated Graphics: ${gpu.name}`;
        gpuDesc = lang === 'pt'
            ? `A ${gpu.name} usa a RAM do sistema como VRAM (até ${gpu.vram}GB compartilhados). Use memória em dual-channel (2 pentes iguais) em ${state.ddrType}-${state.ramFreq}, distância de renderização 6–8, Shaders desativados e mantenha dynamic_resources=true no ModernFix para o jogo não disputar RAM com o vídeo.`
            : `The ${gpu.name} uses system RAM as VRAM (up to ${gpu.vram}GB shared). Run memory in dual-channel (2 matching sticks) at ${state.ddrType}-${state.ramFreq}, keep render distance at 6–8, disable Shaders and keep dynamic_resources=true in ModernFix so the game doesn't fight the iGPU for RAM.`;
    } else if (gpu.vram <= 4) {
        gpuTitle = lang === 'pt' ? `Alerta de VRAM (${gpu.vram}GB - ${gpu.name})` : `VRAM Alert (${gpu.vram}GB - ${gpu.name})`;
        gpuDesc = lang === 'pt'
            ? `Em placas de ${gpu.vram}GB (como a ${gpu.name}), texturas de 200+ mods enchem a VRAM rapidamente. Prefira resource packs de 16x–32x, GPUTape/AllTheLeaks e folhas no Fast (o dynamic_resources do ModernFix alivia a RAM, não a VRAM).`
            : `On ${gpu.vram}GB GPUs (like ${gpu.name}), 200+ mod textures can quickly fill VRAM. Prefer 16x–32x resource packs, GPUTape/AllTheLeaks and Leaves set to Fast (ModernFix's dynamic_resources relieves RAM, not VRAM).`;
    } else if (gpu.vram === 6) {
        gpuTitle = lang === 'pt' ? `Otimização de VRAM 6GB (${gpu.name})` : `6GB VRAM Optimization (${gpu.name})`;
        gpuDesc = lang === 'pt'
            ? `Nos 6GB de VRAM da ${gpu.name}, use texturas de até 32x, GPUTape/AllTheLeaks e EntityCulling para jogar com Shaders sem encher a VRAM (o dynamic_resources do ModernFix alivia a RAM, não a VRAM).`
            : `For the 6GB VRAM on ${gpu.name}, use textures up to 32x, GPUTape/AllTheLeaks and EntityCulling to run Shaders without filling VRAM (ModernFix's dynamic_resources relieves RAM, not VRAM).`;
    } else {
        gpuTitle = lang === 'pt' ? `Configuração Gráfica (${gpu.name})` : `Graphics Configuration (${gpu.name})`;
        gpuDesc = lang === 'pt'
            ? `Seus ${gpu.vram}GB de VRAM comportam modpacks grandes e Shaders com folga. O Embeddium/Sodium foi ajustado com ${cpu.chunkThreads} threads de construção de chunks.`
            : `Your ${gpu.vram}GB VRAM handles large modpacks and Shaders effortlessly. Embeddium/Sodium is configured with ${cpu.chunkThreads} chunk builder threads.`;
    }

    // Diagnóstico de Disco
    let diskTitle = state.storageKey === 'hdd'
        ? (lang === 'pt' ? `Atenção: HD Mecânico Selecionado!` : `Warning: Mechanical HDD Selected!`)
        : (lang === 'pt' ? `Streaming Rápido (${storageName})` : `Fast Asset Streaming (${storageName})`);
    let diskDesc = state.storageKey === 'hdd'
        ? (lang === 'pt'
            ? `Em HDs mecânicos, carregar modelos 3D sob demanda causa travadas ao girar a câmera. Desativamos dynamic_resources no ModernFix para pré-carregar tudo na RAM durante o boot.`
            : `On mechanical HDDs, loading 3D models on-demand causes stutters when turning the camera. We disabled dynamic_resources in ModernFix so models preload into RAM at boot.`)
        : (lang === 'pt'
            ? `Com ${storageName}, o ModernFix pode ler modelos 3D direto do disco em micro-segundos, cortando pela metade o tempo de abertura do jogo e economizando gigabytes de RAM.`
            : `With ${storageName}, ModernFix streams 3D models directly from disk in microseconds, cutting game launch times in half and saving gigabytes of RAM.`);

    // Diagnóstico da CPU (velocidade de thread única)
    const stName = i18n[lang].stNames[cpu.st];
    const isXeon = cpu.name.includes('Xeon');
    let cpuTitle, cpuDesc, cpuColor;
    if (cpu.st === 'low') {
        cpuColor = 'border-amber-500/40 bg-amber-950/20 text-amber-300';
        if (isXeon) {
            cpuTitle = lang === 'pt' ? `Clock baixo: gargalo na thread principal (${cpu.name})` : `Low clock: main-thread bottleneck (${cpu.name})`;
            cpuDesc = lang === 'pt'
                ? `Xeons de servidor/workstation têm clock baixo (2,x–3,x GHz). As ${cpu.threads} threads ajudam nos chunk builders e no servidor integrado, mas o FPS fica limitado pela thread principal. Priorize ModernFix, FerriteCore e Lithium/Radium e mantenha a simulation distance baixa.`
                : `Server/workstation Xeons have low clocks (2.x–3.x GHz). The ${cpu.threads} threads help chunk builders and the integrated server, but FPS is capped by the main thread. Prioritize ModernFix, FerriteCore and Lithium/Radium and keep simulation distance low.`;
        } else {
            cpuTitle = lang === 'pt' ? `Thread principal fraca (${cpu.name})` : `Weak main thread (${cpu.name})`;
            cpuDesc = lang === 'pt'
                ? `O Minecraft depende da velocidade de uma única thread (principal + servidor integrado), então mais núcleos pouco ajudam. Mantenha a simulation distance em 4–5, evite packs muito pesados e prefira ModernFix, FerriteCore e Lithium/Radium.`
                : `Minecraft depends on single-thread speed (main + integrated server), so extra cores help little. Keep simulation distance at 4–5, avoid very heavy packs and prefer ModernFix, FerriteCore and Lithium/Radium.`;
        }
    } else if (cpu.st === 'mid') {
        cpuColor = 'border-blue-500/30 bg-blue-950/20 text-blue-300';
        cpuTitle = lang === 'pt' ? `Thread principal moderada (${cpu.name})` : `Moderate main thread (${cpu.name})`;
        cpuDesc = lang === 'pt'
            ? `Velocidade de thread única moderada: dá conta de modpacks médios. Em packs pesados, reduza a simulation distance (5–8) e use Radium/Lithium.`
            : `Moderate single-thread speed: fine for medium modpacks. On heavy packs, lower simulation distance (5–8) and use Radium/Lithium.`;
    } else {
        cpuColor = cpu.st === 'top' ? 'border-cyan-500/30 bg-cyan-950/20 text-cyan-300' : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300';
        cpuTitle = lang === 'pt' ? `Thread principal forte (${cpu.name})` : `Strong main thread (${cpu.name})`;
        cpuDesc = lang === 'pt'
            ? `Boa velocidade de thread única: aguenta packs pesados e distâncias maiores, e as ${cpu.threads} threads são bem aproveitadas pelos chunk builders e pelo servidor integrado.`
            : `Strong single-thread speed: handles heavy packs and longer distances, and the ${cpu.threads} threads are well used by chunk builders and the integrated server.`;
    }
    const nb = isNotebook(cpu, gpu);
    const hybrid = isHybridNotebook(cpu, gpu);
    let nbCard = '';
    if (nb) {
        const nbTitle = hybrid
            ? (lang === 'pt' ? 'Notebook com GPU dedicada + iGPU' : 'Notebook with dedicated GPU + iGPU')
            : (lang === 'pt' ? 'Notebook com gráficos integrados' : 'Notebook with integrated graphics');
        const nbDesc = (hybrid && state.os === 'linux')
            ? (lang === 'pt'
                ? `No Linux o Java costuma usar a GPU integrada. Nas variáveis de ambiente do launcher, use <code>DRI_PRIME=1</code> (AMD/Intel/Mesa) ou <code>__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia</code> (NVIDIA) para usar a GPU dedicada. Mantenha o notebook na tomada.`
                : `On Linux, Java often uses the integrated GPU. In the launcher's environment variables, use <code>DRI_PRIME=1</code> (AMD/Intel/Mesa) or <code>__NV_PRIME_RENDER_OFFLOAD=1 __GLX_VENDOR_LIBRARY_NAME=nvidia</code> (NVIDIA) to use the dedicated GPU. Keep the laptop plugged in.`)
            : hybrid
            ? (lang === 'pt'
                ? `O Windows costuma abrir o Java na iGPU. Em Configurações > Sistema > Vídeo > Elementos gráficos, adicione o <code>javaw.exe</code> e marque "Alto desempenho"; sem isso o jogo pode rodar na iGPU com metade do FPS. Use o notebook na tomada, com perfil de energia de alto desempenho (e o modo GPU dedicada/MUX, se existir).`
                : `Windows often launches Java on the iGPU. Under Settings > System > Display > Graphics, add <code>javaw.exe</code> and set "High performance"; otherwise the game may run on the iGPU at half the FPS. Keep the laptop plugged in with a high-performance power plan (and use dGPU/MUX mode if available).`)
            : (lang === 'pt'
                ? `Na bateria o clock cai muito: use o notebook na tomada, com perfil de energia de alto desempenho, e mantenha as saídas de ar livres para evitar thermal throttling. Memória em dual-channel faz grande diferença na iGPU.`
                : `On battery the clocks drop a lot: keep the laptop plugged in with a high-performance power plan and keep the vents clear to avoid thermal throttling. Dual-channel memory makes a big difference on the iGPU.`);
        nbCard = `
        <div class="md:col-span-2 p-3.5 rounded-xl border border-amber-500/40 bg-amber-950/20 text-amber-300">
            <div class="text-xs font-bold flex items-center gap-1.5"><i aria-hidden="true" class="fa-solid fa-laptop"></i> ${nbTitle}</div>
            <p class="text-[11px] text-gray-300 mt-1 leading-relaxed">${nbDesc}</p>
        </div>`;
    }
    const rv = recommendedVideoSettings(cpu, gpu);
    const shaderTxt = { off: lang === 'pt' ? 'Evite' : 'Avoid', light: lang === 'pt' ? 'Leves' : 'Light', ok: 'OK' }[rv.shaders];
    const tile = (label, value) => `<div class="rounded-lg bg-gray-900/70 border border-gray-800 p-2 text-center"><div class="text-[10px] uppercase tracking-wider text-gray-400">${label}</div><div class="text-sm font-bold text-white font-mono">${value}</div></div>`;
    const settingsCard = `
        <div class="md:col-span-3 p-3.5 rounded-xl border border-gray-700/60 bg-gray-950/60 text-gray-200">
            <div class="text-xs font-bold flex items-center gap-1.5"><i aria-hidden="true" class="fa-solid fa-sliders"></i> ${lang === 'pt' ? 'Configurações recomendadas no jogo' : 'Recommended in-game settings'}</div>
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-2">
                ${tile('Render Distance', `${rv.render} chunks`)}
                ${tile('Simulation Distance', `${rv.sim} chunks`)}
                ${tile('Entity Distance', `${rv.entity}%`)}
                ${tile('Shaders', shaderTxt)}
            </div>
            <p class="text-[11px] text-gray-400 mt-2 leading-relaxed">${lang === 'pt'
                ? `Calculado a partir da thread única da CPU (${stName}), do tier da GPU, do perfil de modpack e dos canais de RAM. São pontos de partida: ajuste conforme o FPS e o MSPT do seu pack.`
                : `Based on CPU single-thread speed (${stName}), GPU tier, modpack profile and RAM channels. They are starting points: adjust according to your pack's FPS and MSPT.`}</p>
        </div>`;

    container.innerHTML = `
        <div class="p-3.5 rounded-xl border ${ramColor}">
            <div class="text-xs font-bold flex items-center gap-1.5"><i aria-hidden="true" class="fa-solid fa-memory"></i> ${ramStatusTitle}</div>
            <p class="text-[11px] text-gray-300 mt-1 leading-relaxed">${ramStatusDesc}</p>
        </div>
        <div class="p-3.5 rounded-xl border border-purple-500/30 bg-purple-950/20 text-purple-300">
            <div class="text-xs font-bold flex items-center gap-1.5"><i aria-hidden="true" class="fa-solid fa-display"></i> ${gpuTitle}</div>
            <p class="text-[11px] text-gray-300 mt-1 leading-relaxed">${gpuDesc}</p>
        </div>
        <div class="p-3.5 rounded-xl border ${state.storageKey === 'hdd' ? 'border-red-500/40 bg-red-950/20 text-red-300' : 'border-emerald-500/30 bg-emerald-950/20 text-emerald-300'}">
            <div class="text-xs font-bold flex items-center gap-1.5"><i aria-hidden="true" class="fa-solid fa-hard-drive"></i> ${diskTitle}</div>
            <p class="text-[11px] text-gray-300 mt-1 leading-relaxed">${diskDesc}</p>
        </div>
        <div class="${nb ? 'md:col-span-1' : 'md:col-span-3'} p-3.5 rounded-xl border ${cpuColor}">
            <div class="text-xs font-bold flex items-center gap-1.5"><i aria-hidden="true" class="fa-solid fa-microchip"></i> ${cpuTitle}</div>
            <p class="text-[11px] text-gray-300 mt-1 leading-relaxed">${cpuDesc}</p>
        </div>${nbCard}${settingsCard}
    `;
}
