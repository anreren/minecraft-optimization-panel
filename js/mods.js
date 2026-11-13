// Mod catalog by loader and Minecraft version.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// ============================================================================
// CATÁLOGO DINÂMICO DE MODS (ADAPTA NOMES E IDIOMA PARA FORGE, NEOFORGE E FABRIC)
// ============================================================================
function getModsForCurrentSetup() {
    const lang = state.lang;
    const isFabric = state.loader === 'fabric';
    const isNeo = state.loader === 'neoforge';
    const is121 = state.mcVersion.startsWith('1.21');

    const rendererName = (isFabric || (isNeo && is121)) ? "Sodium + Iris Shaders" : "Embeddium + Oculus";
    const lithiumName = (isFabric || (isNeo && is121)) ? "Lithium" : (lang === 'pt' ? "Radium Reforged (ou Canary)" : "Radium Reforged (or Canary)");
    const netModName = isFabric ? "Krypton" : "Krypton Reforged / PacketFixer";

    return [
        {
            name: rendererName,
            cat: "fps",
            badge: lang === 'pt' ? "Essencial GPU" : "Core GPU",
            color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            desc: lang === 'pt'
                ? `Substitui o motor OpenGL do Minecraft (${state.loader.toUpperCase()} ${state.mcVersion}). Costuma aumentar bastante o FPS na sua ${getActiveGpu().name} (o ganho varia por modpack) e alivia a CPU.`
                : `Replaces Minecraft's OpenGL rendering engine (${state.loader.toUpperCase()} ${state.mcVersion}). Usually boosts FPS a lot on your ${getActiveGpu().name} (gains vary by modpack) and offloads the CPU.`
        },
        {
            name: "ModernFix",
            cat: "ram",
            badge: "RAM & Boot",
            color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
            desc: lang === 'pt'
                ? "Indispensável em qualquer versão (1.20.1 a 1.21.4). Reduz o uso de RAM com Dynamic Resources e acelera o carregamento."
                : "Mandatory across all versions (1.20.1 to 1.21.4). Reduces RAM usage via Dynamic Resources and speeds up modpack boot times."
        },
        {
            name: "FerriteCore",
            cat: "ram",
            badge: lang === 'pt' ? "Compactação RAM" : "RAM Compression",
            color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
            desc: lang === 'pt'
                ? `Reduz bastante o consumo de memória dos estados de blocos, ajudando principalmente em RAM ${state.ddrType} ${state.ramFreq}MHz.`
                : `Greatly reduces blockstate memory usage, which helps most on ${state.ddrType} ${state.ramFreq}MHz RAM.`
        },
        {
            name: lithiumName,
            cat: "tps",
            badge: lang === 'pt' ? "Física & TPS" : "Physics & TPS",
            color: "bg-orange-500/20 text-orange-300 border-orange-500/40",
            desc: lang === 'pt'
                ? `Otimiza IA de mobs, física de blocos, colisões e funis sem alterar o comportamento vanilla na sua ${cpuDatabase[state.cpuKey].name}.`
                : `Optimizes mob AI, block physics, collisions, and hoppers without breaking vanilla mechanics on your ${cpuDatabase[state.cpuKey].name}.`
        },
        {
            name: "ImmediatelyFast",
            cat: "fps",
            badge: lang === 'pt' ? "HUD & Inventário" : "HUD & Inventory",
            color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            desc: lang === 'pt'
                ? "Otimiza renderização de modo imediato (entidades, mapas, textos, barras de RPG e telas do JEI/EMI cheias de itens)."
                : "Optimizes immediate-mode rendering (entities, maps, text, RPG HUD bars, and JEI/EMI screens packed with items)."
        },
        {
            name: "EntityCulling + MoreCulling",
            cat: "fps",
            badge: lang === 'pt' ? "Oclusão 3D" : "3D Occlusion",
            color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            desc: lang === 'pt'
                ? "Usa threads secundárias da CPU para descartar mobs, baús, folhas e faces de blocos invisíveis atrás de paredes."
                : "Uses background CPU threads to skip rendering mobs, chests, leaves, and hidden block faces behind walls."
        },
        {
            name: "BadOptimizations",
            cat: "fps",
            badge: "Micro-Caches",
            color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            desc: lang === 'pt'
                ? "Elimina cálculos repetitivos a cada frame (cor do céu, lightmap, caching de renderizadores de entidades e toasts)."
                : "Eliminates redundant per-frame calculations (sky color, lightmap, entity renderer caching, and toasts)."
        },
        {
            name: isFabric || isNeo ? "C2ME + Noisium" : "Noisium + Chunky",
            cat: "tps",
            badge: lang === 'pt' ? "Geração de Chunks" : "Chunk Generation",
            color: "bg-orange-500/20 text-orange-300 border-orange-500/40",
            desc: lang === 'pt'
                ? "Acelera a geração matemática de novos biomas e estruturas usando múltiplos núcleos da CPU de forma paralela."
                : "Accelerates mathematical biome and structure generation across multiple CPU cores in parallel."
        },
        {
            name: state.mcVersion === '1.20.1' ? "GPUTape ( + AllTheLeaks )" : "AllTheLeaks (Memory Leak Fix)",
            cat: "ram",
            badge: "Anti-Leak",
            color: "bg-blue-500/20 text-blue-300 border-blue-500/40",
            desc: lang === 'pt'
                ? "Impede que a VRAM da placa de vídeo e a RAM encham após horas trocando de dimensões ou explorando."
                : "Prevents GPU VRAM and system RAM leaks after hours of dimension hopping or world exploration."
        },
        {
            name: netModName,
            cat: "tps",
            badge: lang === 'pt' ? "Rede & Pacotes" : "Network & Packets",
            color: "bg-orange-500/20 text-orange-300 border-orange-500/40",
            desc: lang === 'pt'
                ? "Otimiza a pilha de rede Netty (inclusive no servidor integrado Singleplayer) reduzindo o uso de CPU e pacotes grandes."
                : "Optimizes the Netty networking stack (including Singleplayer's integrated server), reducing CPU overhead and packet errors."
        },
        {
            name: "Dynamic FPS",
            cat: "fps",
            badge: lang === 'pt' ? "Economia GPU" : "GPU Saver",
            color: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
            desc: lang === 'pt'
                ? "Reduz automaticamente o uso da placa de vídeo quando o jogo está minimizado ou em segundo plano (Alt+Tab)."
                : "Automatically throttles GPU usage when the game window is minimized or unfocused (Alt+Tab)."
        },
        {
            name: lang === 'pt' ? "OptiFine / gpumemleakfix (Antigo)" : "OptiFine / gpumemleakfix (Legacy)",
            cat: "avoid",
            badge: lang === 'pt' ? "Não Usar!" : "Do Not Use!",
            color: "bg-red-500/20 text-red-300 border-red-500/40",
            desc: lang === 'pt'
                ? "Quebram mods modernos na 1.20.1+ e causam stutters severos. Sempre prefira a dupla Sodium/Embeddium + GPUTape."
                : "Breaks modern 1.20.1+ mods and causes severe stutters. Always use Sodium/Embeddium + GPUTape instead."
        }
    ];
}

function setModCategoryFilter(cat) {
    state.activeModCat = cat;
    document.querySelectorAll('.mcat-btn').forEach(b => { b.classList.remove('bg-gray-800', 'text-white'); b.setAttribute('aria-pressed', 'false'); });
    document.getElementById(`mcat-${cat}`).classList.add('bg-gray-800', 'text-white');
    document.getElementById(`mcat-${cat}`).setAttribute('aria-pressed', 'true');
    renderDynamicMods();
}

function renderDynamicMods() {
    const loaderNames = { forge: 'Forge', neoforge: 'NeoForge', fabric: 'Fabric' };
    document.getElementById('mods-section-badge').textContent = `${loaderNames[state.loader]} ${state.mcVersion}`;

    const isFabricOrNeo121 = state.loader === 'fabric' || (state.loader === 'neoforge' && state.mcVersion.startsWith('1.21'));
    document.getElementById('tab-label-renderer').textContent = isFabricOrNeo121 ? "2. Sodium" : "2. Embeddium";
    document.getElementById('tab-label-lithium').textContent = isFabricOrNeo121 ? "7. Lithium" : "7. Radium / Canary";

    const mods = getModsForCurrentSetup().filter(m => state.activeModCat === 'all' || m.cat === state.activeModCat);
    const grid = document.getElementById('dynamic-mods-grid');
    grid.innerHTML = '';

    mods.forEach(m => {
        const div = document.createElement('div');
        div.className = "bg-gray-950/75 border border-gray-800 rounded-xl p-4 flex flex-col justify-between hover:border-gray-700 transition";
        div.innerHTML = `
            <div>
                <div class="flex items-start justify-between gap-2">
                    <h3 class="text-sm font-bold text-white">${m.name}</h3>
                    <span class="text-[11px] font-semibold px-2 py-0.5 rounded border whitespace-nowrap ${m.color}">${m.badge}</span>
                </div>
                <p class="text-xs text-gray-300 mt-2 leading-relaxed">${m.desc}</p>
            </div>
        `;
        grid.appendChild(div);
    });
}
