// Mod catalog by loader and Minecraft version.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// ============================================================================
// CATÁLOGO DINÂMICO DE MODS (ADAPTA NOMES E IDIOMA PARA FORGE, NEOFORGE E FABRIC)
// ============================================================================
function getModsForCurrentSetup() {
    const lang = state.lang;
    const isFabric = state.loader === 'fabric';
    const isNeo = state.loader === 'neoforge';
    const isForge = state.loader === 'forge';
    const is121 = state.mcVersion.startsWith('1.21');
    const is1201 = state.mcVersion === '1.20.1';
    const pt = lang === 'pt';

    const rendererName = (isFabric || (isNeo && is121)) ? "Sodium + Iris Shaders" : "Embeddium + Oculus";
    const lithiumName = (isFabric || (isNeo && is121)) ? "Lithium" : (pt ? "Radium Reforged (ou Canary)" : "Radium Reforged (or Canary)");
    const cullingName = (isFabric || (isNeo && is121))
        ? "EntityCulling + MoreCulling"
        : (pt ? "EntityCulling (+ MoreCulling Reforged)" : "EntityCulling (+ MoreCulling Reforged)");
    const lightModName = is121
        ? (isForge ? null : "ScalableLux")
        : (is1201 ? "Starlight" : null);
    const netModName = isFabric ? "Krypton" : "Krypton Reforged / PacketFixer";
    const leakModName = isFabric
        ? (is1201 ? "MemoryLeakFix + GPUTape" : "MemoryLeakFix")
        : (is1201 ? "AllTheLeaks + GPUTape" : "AllTheLeaks");

    const mods = [
        {
            name: rendererName,
            cat: "fps",
            badge: pt ? "Essencial GPU" : "Core GPU",
            tone: "accent",
            desc: pt
                ? `Substitui o motor OpenGL do Minecraft (${state.loader.toUpperCase()} ${state.mcVersion}). Eleva o FPS na sua ${getActiveGpu().name} e alivia a thread principal.`
                : `Replaces Minecraft's OpenGL renderer (${state.loader.toUpperCase()} ${state.mcVersion}). Raises FPS on your ${getActiveGpu().name} and offloads the main thread.`
        },
        {
            name: "ModernFix",
            cat: "ram",
            badge: "RAM & Boot",
            tone: "neutral",
            desc: pt
                ? "Indispensável em todas as versões (1.20.1–1.21.4). Reduz o uso de RAM com Dynamic Resources e encurta o tempo de boot."
                : "Essential across all versions (1.20.1–1.21.4). Lowers RAM usage via Dynamic Resources and cuts launch times."
        },
        {
            name: "FerriteCore",
            cat: "ram",
            badge: pt ? "Compactação RAM" : "RAM Compression",
            tone: "neutral",
            desc: pt
                ? `Compacta estados de blocos e modelos na memória, ajudando especialmente em ${state.ddrType} ${state.ramFreq} MHz.`
                : `Compacts blockstates and baked models in memory, especially helpful on ${state.ddrType} ${state.ramFreq} MHz.`
        },
        {
            name: lithiumName,
            cat: "tps",
            badge: pt ? "Física & TPS" : "Physics & TPS",
            tone: "neutral",
            desc: pt
                ? `Otimiza IA de mobs, física, colisões e funis sem alterar a mecânica vanilla na sua ${cpuDatabase[state.cpuKey].name}.`
                : `Optimizes mob AI, physics, collisions, and hoppers without changing vanilla mechanics on your ${cpuDatabase[state.cpuKey].name}.`
        },
        {
            name: "ImmediatelyFast",
            cat: "fps",
            badge: pt ? "HUD & Inventário" : "HUD & Inventory",
            tone: "accent",
            desc: pt
                ? "Acelera a renderização de modo imediato (entidades, mapas, textos, barras de RPG e telas do JEI/EMI)."
                : "Accelerates immediate-mode rendering (entities, maps, text, RPG HUD bars, and crowded JEI/EMI screens)."
        },
        {
            name: cullingName,
            cat: "fps",
            badge: pt ? "Oclusão 3D" : "3D Occlusion",
            tone: "accent",
            desc: pt
                ? "Descarta em threads secundárias mobs, baús, folhas e faces de blocos ocultos atrás de paredes."
                : "Skips rendering occluded mobs, block entities, leaves, and hidden faces using background CPU threads."
        },
        {
            name: "BadOptimizations",
            cat: "fps",
            badge: "Micro-Caches",
            tone: "accent",
            desc: pt
                ? "Coloca em cache cálculos repetitivos por frame (cor do céu, lightmap, renderizadores de entidades e toasts)."
                : "Caches redundant per-frame calculations (sky color, lightmap, entity renderer lookups, and toasts)."
        },
        {
            name: isFabric || (isNeo && is121) ? "C2ME + Noisium" : "Noisium + Chunky",
            cat: "tps",
            badge: pt ? "Geração de Chunks" : "Chunk Gen",
            tone: "neutral",
            desc: pt
                ? "Paraleliza e otimiza a geração matemática de terreno, biomas e estruturas usando múltiplos núcleos."
                : "Parallelizes and speeds up terrain, biome, and structure generation across multiple CPU cores."
        }
    ];

    if (lightModName) {
        mods.push({
            name: lightModName,
            cat: "tps",
            badge: pt ? "Motor de Luz" : "Lighting Engine",
            tone: "neutral",
            desc: is121
                ? (pt
                    ? "Sucessor mantido do Starlight (por ishland) para 1.21+: reduz drasticamente o custo de atualizações de luz e geração de chunks."
                    : "Actively maintained Starlight continuation (by ishland) for 1.21+: cuts lighting update and worldgen overhead.")
                : (pt
                    ? "Reescreve o motor de iluminação da 1.20.1, eliminando quedas de TPS em atualizações de luz e carregamento de chunks."
                    : "Rewrites the 1.20.1 lighting engine, eliminating TPS drops during light updates and chunk loading.")
        });
    }

    mods.push(
        {
            name: "Alternate Current",
            cat: "tps",
            badge: "Redstone",
            tone: "neutral",
            desc: pt
                ? "Implementação rápida e determinística do pó de redstone, cortando picos de MSPT em circuitos e fazendas automáticas."
                : "Fast, non-locational redstone dust implementation that eliminates MSPT spikes in contraptions and farms."
        },
        {
            name: "Clumps",
            cat: "tps",
            badge: pt ? "Entidades / XP" : "Entities / XP",
            tone: "neutral",
            desc: pt
                ? "Agrupa orbes de experiência próximos em uma única entidade, evitando quedas de FPS/TPS em mob farms."
                : "Merges nearby XP orbs into a single entity, preventing FPS/TPS drops around mob and XP farms."
        }
    );

    if (isFabric || isNeo) {
        mods.push({
            name: "ServerCore",
            cat: "tps",
            badge: pt ? "TPS Dinâmico" : "Dynamic TPS",
            tone: "neutral",
            desc: pt
                ? "Ajusta dinamicamente alcance de ticks, ativação de entidades e limites de mobs para segurar 20 TPS no servidor integrado."
                : "Dynamically tunes tick distance, entity activation, and mob caps to hold 20 TPS on integrated or dedicated servers."
        });
    }

    if (!isFabric) {
        mods.push({
            name: "FastSuite",
            cat: "ram",
            badge: pt ? "Receitas JSON" : "JSON Recipes",
            tone: "neutral",
            desc: pt
                ? "Indexa receitas de crafting em modpacks grandes (Forge/NeoForge), evitando travadas em bancadas e auto-crafters."
                : "Indexes crafting recipes in large Forge/NeoForge modpacks, preventing lag spikes on benches and auto-crafters."
        });
    }

    if (isFabric) {
        mods.push(
            {
                name: "Particle Core",
                cat: "fps",
                badge: pt ? "Partículas" : "Particles",
                tone: "accent",
                desc: pt
                    ? "Otimiza o culling, agrupamento e renderização de partículas (totalmente compatível com Sodium)."
                    : "Optimizes particle culling, batching, and rendering (fully compatible with Sodium)."
            },
            {
                name: "ThreadTweak",
                cat: "ram",
                badge: pt ? "Threads CPU" : "CPU Threads",
                tone: "neutral",
                desc: pt
                    ? "Sucessor moderno do Smooth Boot: ajusta prioridades das threads de boot e workers para reduzir engasgos."
                    : "Modern Smooth Boot successor: tunes bootstrap and worker thread priorities to smooth out stutters."
            }
        );
    }

    mods.push(
        {
            name: leakModName,
            cat: "ram",
            badge: "Anti-Leak",
            tone: "neutral",
            desc: pt
                ? "Corrige vazamentos de memória RAM e VRAM do jogo e de mods após longas sessões ou trocas de dimensão."
                : "Fixes RAM and VRAM leaks from Minecraft and mods during long sessions or frequent dimension hopping."
        },
        {
            name: netModName,
            cat: "tps",
            badge: pt ? "Rede & Pacotes" : "Network",
            tone: "neutral",
            desc: pt
                ? "Otimiza a pilha de rede Netty (inclusive no servidor integrado Singleplayer), reduzindo CPU e overhead de pacotes."
                : "Optimizes the Netty networking stack (including Singleplayer's integrated server), cutting CPU and packet overhead."
        },
        {
            name: "Dynamic FPS",
            cat: "fps",
            badge: pt ? "Segundo Plano" : "Background",
            tone: "accent",
            desc: pt
                ? "Reduz automaticamente o FPS e o consumo da GPU quando a janela do jogo está minimizada ou em segundo plano."
                : "Automatically throttles FPS and GPU load when the game window is minimized or unfocused."
        },
        {
            name: pt ? "OptiFine / gpumemleakfix (Antigo)" : "OptiFine / gpumemleakfix (Legacy)",
            cat: "avoid",
            badge: pt ? "Não Usar" : "Avoid",
            tone: "danger",
            desc: pt
                ? "Quebram mods modernos na 1.20.1+ e pioram o frametime. Use Sodium/Embeddium + AllTheLeaks/GPUTape."
                : "Breaks modern 1.20.1+ mods and hurts frametimes. Use Sodium/Embeddium + AllTheLeaks/GPUTape instead."
        },
        {
            name: pt ? "Motores Duplicados (Conflito)" : "Duplicate Engines (Conflict)",
            cat: "avoid",
            badge: pt ? "Conflito" : "Conflict",
            tone: "danger",
            desc: pt
                ? "Nunca misture dois mods com a mesma função (ex.: Sodium + Embeddium, Radium + Canary, ou Starlight + ScalableLux)."
                : "Never combine two mods doing the same job (e.g. Sodium + Embeddium, Radium + Canary, or Starlight + ScalableLux)."
        }
    );

    return mods;
}

function setModCategoryFilter(cat) {
    state.activeModCat = cat;
    document.querySelectorAll('.mcat-btn').forEach(b => {
        b.className = "mcat-btn px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 transition";
        b.setAttribute('aria-pressed', 'false');
    });
    const active = document.getElementById(`mcat-${cat}`);
    active.className = "mcat-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 text-white transition";
    active.setAttribute('aria-pressed', 'true');
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

    const badgeClasses = {
        accent: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
        neutral: "bg-zinc-800/80 text-zinc-300 border-zinc-700/60",
        danger: "bg-red-500/10 text-red-400 border-red-500/25"
    };

    mods.forEach(m => {
        const div = document.createElement('div');
        div.className = `rounded-xl p-4 border transition ${
            m.tone === 'danger'
                ? 'bg-red-950/10 border-red-500/20 hover:border-red-500/35'
                : 'bg-zinc-950/60 border-zinc-800/80 hover:border-zinc-700'
        }`;
        div.innerHTML = `
            <div class="flex items-start justify-between gap-2">
                <h3 class="text-sm font-semibold text-zinc-100">${m.name}</h3>
                <span class="text-[11px] font-medium px-2 py-0.5 rounded-md border whitespace-nowrap ${badgeClasses[m.tone] || badgeClasses.neutral}">${m.badge}</span>
            </div>
            <p class="text-xs text-zinc-400 mt-2 leading-relaxed">${m.desc}</p>
        `;
        grid.appendChild(div);
    });
}
