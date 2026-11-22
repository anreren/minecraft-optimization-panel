// Generated configuration files (Section 4 tabs) and GPU Driver & Shaders (Section 5).
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// ============================================================================
// GERADOR DE CONFIGURAÇÕES RECOMENDADAS PARA OS 8 MODS (SEÇÃO 4) + DRIVER (SEÇÃO 5)
// ============================================================================
function selectConfigTab(tabKey) {
    const activeTab = document.getElementById(`ctab-${tabKey}`);
    if (!activeTab) return;
    state.activeConfigTab = tabKey;
    document.querySelectorAll('.ctab-btn').forEach(btn => {
        btn.className = "ctab-btn px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-100 hover:bg-zinc-900 transition flex items-center gap-1.5";
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');
    });
    activeTab.className = "ctab-btn px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 text-zinc-950 transition flex items-center gap-1.5";
    activeTab.setAttribute('aria-selected', 'true');
    activeTab.setAttribute('tabindex', '0');
    document.getElementById('cfg-tabpanel').setAttribute('aria-labelledby', `ctab-${tabKey}`);
    renderActiveConfigTab();
}

function renderActiveConfigTab() {
    const lang = state.lang;
    const cpu = cpuDatabase[state.cpuKey];
    const gpu = getActiveGpu();
    const storage = storageDatabase[state.storageKey];
    const storageName = storage.name[lang];
    const tab = state.activeConfigTab;

    const extraToggles = document.getElementById('modernfix-extra-toggles');
    extraToggles.className = tab === 'modernfix' ? 'flex flex-wrap items-center gap-3' : 'hidden';

    let filePath = "";
    let hwTag = "";
    let desc = "";
    let code = "";
    let tips = "";

    if (tab === 'modernfix') {
        const dynRes = document.getElementById('chk-mf-dynres').checked;
        const remSpawn = document.getElementById('chk-mf-spawn').checked;
        filePath = "config/modernfix-mixins.properties";
        hwTag = lang === 'pt'
            ? `Otimizado para ${storageName}`
            : `Optimized for ${storageName}`;
        desc = lang === 'pt'
            ? "Cole estas linhas no final do arquivo modernfix-mixins.properties (logo abaixo de # User overrides go here). Apenas as opções estáveis e recomendadas são sobrescritas; o restante segue os padrões seguros do mod."
            : "Paste these lines at the bottom of modernfix-mixins.properties (right below # User overrides go here). Only stable, recommended overrides are set; everything else keeps the mod's safe defaults.";
        code = `# User overrides go here (${lang === 'pt' ? 'Gerado para' : 'Generated for'} ${cpu.name} + ${gpu.name})
mixin.perf.dynamic_resources=${dynRes}
mixin.perf.faster_item_rendering=true
mixin.perf.compact_bit_storage=true${remSpawn ? '\nmixin.perf.remove_spawn_chunks=true' : ''}`;
        tips = lang === 'pt'
            ? `<strong>Por que apenas essas opções?</strong> <code>dynamic_resources=${dynRes}</code> reduz bastante o uso de RAM carregando modelos sob demanda do seu <strong>${storageName}</strong>, enquanto <code>faster_item_rendering=true</code> e <code>compact_bit_storage=true</code> são estáveis em modpacks modernos. Evitamos ativar opções experimentais ou removidas do ModernFix (como <code>dynamic_entity_renderers</code>, <code>clear_mixin_classinfo</code> ou <code>packet_leak</code>) que podem causar crashes ou perda de compatibilidade.`
            : `<strong>Why only these options?</strong> <code>dynamic_resources=${dynRes}</code> lowers RAM usage by loading models on demand from your <strong>${storageName}</strong>, while <code>faster_item_rendering=true</code> and <code>compact_bit_storage=true</code> are safe for modern modpacks. We avoid experimental or version-specific flags (like <code>dynamic_entity_renderers</code>, <code>clear_mixin_classinfo</code>, or <code>packet_leak</code>) that can break mod compatibility.`;
    }
    else if (tab === 'embeddium') {
        const isSodium = state.loader === 'fabric' || (state.loader === 'neoforge' && state.mcVersion.startsWith('1.21'));
        filePath = isSodium ? "config/sodium-options.json" : "config/embeddium-options.json";
        hwTag = `${cpu.chunkThreads} Chunk Threads • ${gpu.vendorLabel || gpu.vendor.toUpperCase()} Driver`;
        desc = lang === 'pt'
            ? `Ajustes ideais de renderização para a combinação ${cpu.name} + ${gpu.name}.`
            : `Optimal rendering settings for your ${cpu.name} + ${gpu.name} combination.`;
        code = `{
  "quality": {
    "leaves_quality": "${(gpu.tier === 'low' || gpu.tier === 'entry') ? 'FAST' : 'DEFAULT'}",
    "enable_vignette": false
  },
  "performance": {
    "chunk_builder_threads": ${cpu.chunkThreads},
    "always_defer_chunk_updates_v2": true,
    "animate_only_visible_textures": true,
    "use_entity_culling": true,
    "use_fog_occlusion": true,
    "use_block_face_culling": true,
    "use_no_error_g_l_context": ${gpu.noErrorCtx}
  },
  "advanced": {
    "enable_memory_tracing": false,
    "use_advanced_staging_buffers": true,
    "cpu_render_ahead_limit": 3
  }
}`;
        tips = lang === 'pt'
            ? `<strong>Ajuste de Hardware:</strong> Definimos <code>chunk_builder_threads: ${cpu.chunkThreads}</code> com base nas <strong>${cpu.threads} threads</strong> da sua CPU e <code>always_defer_chunk_updates_v2: true</code> para impedir que o carregamento de chunks atrase os frames enviados para a <strong>${gpu.name}</strong>. Além disso, trave a <strong>Distância de Simulação em 6 a 8 chunks</strong> no menu de Vídeo!`
            : `<strong>Hardware Tuning:</strong> We set <code>chunk_builder_threads: ${cpu.chunkThreads}</code> based on your CPU's <strong>${cpu.threads} threads</strong> and <code>always_defer_chunk_updates_v2: true</code> so chunk building never delays frames sent to your <strong>${gpu.name}</strong>. Also lock <strong>Simulation Distance to 6–8 chunks</strong> in Video Settings!`;
        tips += lang === 'pt'
            ? `<br><br><em>Nota:</em> os nomes das chaves seguem o Sodium 0.5/0.6 e o Embeddium 0.3 (<code>always_defer_chunk_updates_v2</code>, <code>use_no_error_g_l_context</code>). Se o arquivo gerado pelo seu mod tiver nomes diferentes, use os dele: opções desconhecidas são ignoradas sem aviso.`
            : `<br><br><em>Note:</em> key names follow Sodium 0.5/0.6 and Embeddium 0.3 (<code>always_defer_chunk_updates_v2</code>, <code>use_no_error_g_l_context</code>). If the file generated by your mod uses different names, use those: unknown options are silently ignored.`;
    }
    else if (tab === 'ferrite') {
        const isFabric = state.loader === 'fabric';
        const isLowBandwidth = state.ddrType === 'DDR3' || (state.ddrType === 'DDR4' && state.ramFreq <= 3000) || state.sysRamGB <= 16 || state.memChannels === 1;
        const hasDataComp = state.mcVersion === '1.20.6' || state.mcVersion.startsWith('1.21');
        filePath = isFabric ? "config/ferritecore.mixin.properties" : "config/ferritecore-mixin.toml";
        hwTag = lang === 'pt'
            ? `Perfil universal • ${isFabric ? 'Fabric' : state.loader === 'neoforge' ? 'NeoForge' : 'Forge'} • ${state.ddrType} ${state.ramFreq}MHz (${state.sysRamGB}GB)`
            : `Universal profile • ${isFabric ? 'Fabric' : state.loader === 'neoforge' ? 'NeoForge' : 'Forge'} • ${state.ddrType} ${state.ramFreq}MHz (${state.sysRamGB}GB)`;
        desc = lang === 'pt'
            ? `Configuração completa do FerriteCore (${isFabric ? 'arquivo .properties no Fabric' : 'arquivo .toml no Forge/NeoForge'}) para reduzir o consumo de RAM de estados de blocos e modelos.`
            : `Complete FerriteCore configuration (${isFabric ? '.properties file on Fabric' : '.toml file on Forge/NeoForge'}) to reduce blockstate and model memory footprint.`;
        const dcLine = hasDataComp ? `\n${isFabric ? 'dataComponentPatch=true' : 'dataComponentPatch = true'}` : '';
        code = isFabric
            ? `# FerriteCore Fabric Config (${state.ddrType} ${state.ramFreq}MHz)
# ${lang === 'pt' ? 'No Fabric, o arquivo oficial usa extensão .properties (Java Properties também aceita =)' : 'On Fabric, the official config file uses .properties format'}
replaceNeighborLookup=true
replacePropertyMap=true
cacheMultipartPredicates=true
multipartDeduplication=true
modelSides=true
bakedQuadDeduplication=true
modelResourceLocations=true
populateNeighborTable=false
compactFastMap=true
blockstateCacheDeduplication=true
useSmallThreadingDetector=false${dcLine}`
            : `# FerriteCore Universal Config (${state.ddrType} ${state.ramFreq}MHz)
# ${lang === 'pt' ? 'Compacta estados de blocos em mapa rápido (essencial para DDR3/DDR4 e modpacks grandes)' : 'Compacts blockstates into a fast map (essential for DDR3/DDR4 and large modpacks)'}
compactFastMap = true
# ${lang === 'pt' ? `Mantenha false em CPUs multi-thread (${cpu.threads} threads) para evitar crash concorrente em chunks` : `Keep false on multi-threaded CPUs (${cpu.threads} threads) to avoid concurrent chunk crashes`}
useSmallThreadingDetector = false
cacheMultipartPredicates = true
multipartDeduplication = true
blockstateCacheDeduplication = true
modelResourceLocations = true
modelSides = true
replaceNeighborLookup = true
populateNeighborTable = false
replacePropertyMap = true
bakedQuadDeduplication = true${dcLine}`;
        tips = lang === 'pt'
            ? `<strong>Impacto na sua RAM (${state.ddrType} ${state.ramFreq}MHz):</strong> Ativar <code>compactFastMap = true</code> reduz o tamanho das tabelas de BlockState, fazendo com que os dados caibam melhor nos <strong>${cpu.l3} de Cache L3</strong> da sua ${cpu.name}${isLowBandwidth ? ' e compensando a latência da memória' : ''}.`
            : `<strong>Impact on your RAM (${state.ddrType} ${state.ramFreq}MHz):</strong> Enabling <code>compactFastMap = true</code> shrinks BlockState lookup tables so more data fits inside your ${cpu.name}'s <strong>${cpu.l3} L3 Cache</strong>${isLowBandwidth ? ', compensating for memory latency' : ''}.`;
    }
    else if (tab === 'immediatelyfast') {
        filePath = "config/immediatelyfast.json";
        hwTag = lang === 'pt' ? `Perfil universal • Batching de HUD e inventário` : `Universal profile • HUD & inventory batching`;
        desc = lang === 'pt'
            ? "Acelera drasticamente a renderização de textos, barras de vida/mana/ki de mods RPG, minimapas e entidades."
            : "Drastically accelerates rendering of text, custom RPG health/mana/ki bars, minimaps, and entities.";
        code = `{
  "font_atlas_resizing": true,
  "map_atlas_generation": true,
  "hud_batching": true,
  "fast_text_lookup": true,
  "fast_buffer_upload": true,
  "dont_add_info_into_debug_hud": false,
  "experimental_screen_batching": false,
  "experimental_sign_text_buffering": false
}`;
        tips = lang === 'pt'
            ? `<strong>Por que manter as opções experimentais desligadas?</strong> Mantemos o batching de HUD e Fontes ligado (acelerando interfaces cheias), mas deixamos <em>experimental_screen_batching</em> e <em>experimental_sign_text_buffering</em> em <code>false</code> (padrão do mod) para evitar glitches visuais em barras RPG, minimapas e placas.`
            : `<strong>Why leave experimental options off?</strong> We keep HUD and Font batching enabled (speeding up crowded GUIs), while keeping <em>experimental_screen_batching</em> and <em>experimental_sign_text_buffering</em> set to <code>false</code> (upstream default) to prevent visual glitches on RPG bars, minimaps, and signs.`;
    }
    else if (tab === 'entityculling') {
        const sleepDelay = cpu.threads >= 12 ? 10 : (cpu.threads >= 8 ? 15 : 25);
        const traceDist = cpu.threads >= 12 ? 128 : (cpu.threads >= 8 ? 96 : 64);
        filePath = "config/entityculling.json";
        hwTag = lang === 'pt' ? `Raytracing Assíncrono (${cpu.threads} Threads)` : `Async Raytracing (${cpu.threads} Threads)`;
        desc = lang === 'pt'
            ? "Configuração do EntityCulling (esquema v9) para ocultar entidades e blocos-entidade (baús/máquinas) atrás de paredes e cavernas."
            : "EntityCulling configuration (schema v9) to skip rendering entities and block-entities (chests/machines) hidden behind walls and caves.";
        code = `{
  "configVersion": 9,
  "safeMode": true,
  "renderNametagsThroughWalls": true,
  "blockEntityWhitelist": [
    "betterend:eternal_pedestal",
    "botania:falling_star",
    "botania:flame_ring",
    "botania:magic_missile",
    "create:hose_pulley",
    "create:rope_pulley",
    "minecraft:beacon"
  ],
  "entityWhitelist": [
    "botania:mana_burst",
    "drg_flares:drg_flares",
    "quark:soul_bead"
  ],
  "tracingDistance": ${traceDist},
  "debugMode": false,
  "sleepDelay": ${sleepDelay},
  "hitboxLimit": 50,
  "captureRate": 5,
  "tickCulling": true,
  "tickCullingWhitelist": [
    "create:carriage_contraption",
    "create:contraption",
    "create:gantry_contraption",
    "create:stationary_contraption",
    "minecraft:acacia_boat",
    "minecraft:acacia_chest_boat",
    "minecraft:bamboo_chest_raft",
    "minecraft:bamboo_raft",
    "minecraft:birch_boat",
    "minecraft:birch_chest_boat",
    "minecraft:block_display",
    "minecraft:boat",
    "minecraft:cherry_boat",
    "minecraft:cherry_chest_boat",
    "minecraft:dark_oak_boat",
    "minecraft:dark_oak_chest_boat",
    "minecraft:firework_rocket",
    "minecraft:item_display",
    "minecraft:jungle_boat",
    "minecraft:jungle_chest_boat",
    "minecraft:mangrove_boat",
    "minecraft:mangrove_chest_boat",
    "minecraft:oak_boat",
    "minecraft:oak_chest_boat",
    "minecraft:pale_oak_boat",
    "minecraft:pale_oak_chest_boat",
    "minecraft:spruce_boat",
    "minecraft:spruce_chest_boat",
    "minecraft:text_display"
  ],
  "disableF3": false,
  "skipEntityCulling": false,
  "skipBlockEntityCulling": false,
  "blockEntityFrustumCulling": true,
  "forceDisplayCulling": false,
  "solidLeaves": false
}`;
        tips = lang === 'pt'
            ? `<strong>Calculado para sua CPU:</strong> O <code>sleepDelay: ${sleepDelay}</code> define a velocidade com que a thread secundária da sua <strong>${cpu.name}</strong> calcula a visibilidade dos objetos. Mantemos <code>safeMode: true</code>, <code>blockEntityFrustumCulling: true</code> e a <code>tickCullingWhitelist</code> padrão (barcos, displays e contraptions do Create) para evitar que objetos desapareçam antes da hora.`
            : `<strong>Tailored to your CPU:</strong> <code>sleepDelay: ${sleepDelay}</code> sets how frequently your <strong>${cpu.name}</strong>'s background thread updates visibility rays. We keep <code>safeMode: true</code>, <code>blockEntityFrustumCulling: true</code>, and the standard <code>tickCullingWhitelist</code> (vanilla boats, displays, and Create contraptions) to avoid premature culling glitches.`;
        tips += lang === 'pt'
            ? ` Já o <code>tracingDistance: ${traceDist}</code> também vem da CPU (${cpu.threads} threads): é a distância do raytracing de visibilidade, que roda na CPU, então CPUs menores usam alcance menor.`
            : ` The <code>tracingDistance: ${traceDist}</code> also comes from the CPU (${cpu.threads} threads): it is the visibility raytracing range, which runs on the CPU, so smaller CPUs use a shorter range.`;
    }
    else if (tab === 'badopt') {
        filePath = "config/badoptimizations.txt";
        hwTag = "SkyColor, Lightmap & BlockEntities Cache";
        desc = lang === 'pt'
            ? "O BadOptimizations evita que o Minecraft recalcule variáveis estáticas dezenas de vezes por segundo. Este arquivo segue todas as 18 chaves obrigatórias do esquema v6."
            : "BadOptimizations prevents Minecraft from recalculating static variables dozens of times per second. Includes all 18 mandatory keys required by schema v6.";
        code = `# BadOptimizations Universal Config (config_version 6)
log_config: true
enable_lightmap_caching: true
lightmap_time_change_needed_for_update: 80
enable_sky_color_caching: true
skycolor_time_change_needed_for_update: 3
enable_debug_renderer_disable_if_not_needed: true
enable_particle_manager_optimization: true
enable_toast_optimizations: true
enable_sky_angle_caching_in_worldrenderer: true
enable_entity_renderer_caching: true
enable_block_entity_renderer_caching: true
enable_entity_flag_caching: true
enable_remove_redundant_fov_calculations: true
enable_remove_tutorial_if_not_demo: true
show_f3_text: true
ignore_mod_incompatibilities: false
ignore_mod_cache_hooks: false
config_version: 6`;
        tips = lang === 'pt'
            ? `<strong>Atenção ao arquivo completo:</strong> O BadOptimizations exige todas as <strong>18 chaves obrigatórias</strong> presentes em <code>badoptimizations.txt</code> (faltar uma chave impede o mod de carregar). Em modpacks com muitos biomas (Biomes O' Plenty, Regions Unexplored), o cache de céu e lightmap economiza vários ciclos de CPU.`
            : `<strong>Full-file requirement:</strong> BadOptimizations requires all <strong>18 mandatory keys</strong> inside <code>badoptimizations.txt</code> (missing any key causes a startup error). In biome-heavy modpacks, sky color and lightmap caching saves noticeable CPU time.`;
    }
    else if (tab === 'radium') {
        const isLithium = state.loader === 'fabric' || (state.loader === 'neoforge' && state.mcVersion.startsWith('1.21'));
        const modName = isLithium ? 'Lithium' : 'Radium Reforged / Canary';
        filePath = isLithium ? "config/lithium.properties" : "config/radium.properties (or canary.properties)";
        hwTag = lang === 'pt' ? `Perfil universal (padrões seguros ativos)` : `Universal profile (safe defaults active)`;
        desc = lang === 'pt'
            ? `No ${modName}, todas as otimizações estáveis de TPS já vêm ativas por padrão e módulos conflitantes com outros mods são desativados automaticamente.`
            : `In ${modName}, all stable TPS optimizations are already enabled by default, and conflicting mixins are disabled automatically when incompatible mods are installed.`;
        code = `# Universal ${modName} Config
# ${lang === 'pt' ? 'Todas as otimizações seguras já vêm ATIVAS por padrão no mod.' : 'All safe optimizations are already ENABLED by default in the mod.'}
# ${lang === 'pt' ? 'NÃO force mixin.*=true em massa: isso anula a proteção automática contra mods incompatíveis.' : 'Do NOT blanket-force mixin.*=true: doing so overrides automatic mod-incompatibility disables.'}
#
# ${lang === 'pt' ? 'Descomente (remova o #) apenas se precisar desativar um módulo por conflito específico:' : 'Uncomment (remove #) only to disable a specific subsystem if troubleshooting a mod conflict:'}
# mixin.block.hopper=false
# mixin.ai.pathing=false
# mixin.world.chunk_access=false`;
        tips = lang === 'pt'
            ? `<strong>Salva-vidas de TPS sem quebrar modpacks:</strong> Seguindo a documentação oficial do ${modName}, deixar o arquivo sem sobrescritas <code>=true</code> garante o ganho completo de TPS em IA de mobs, funis e chunks enquanto preserva os <em>desativadores automáticos de compatibilidade</em> com mods pesados (Create, Alex's Mobs, etc.).`
            : `<strong>Safe TPS lifesaver:</strong> Per ${modName}'s official mixin config guide, keeping this file free of blanket <code>=true</code> overrides delivers full TPS gains across mob AI, hoppers, and chunks while preserving automatic compatibility disables for other mods.`;
    }
    else if (tab === 'loader') {
        if (state.loader === 'fabric') {
            const is121 = state.mcVersion.startsWith('1.21');
            filePath = "config/c2me.toml (Concurrent Chunk Management Engine)";
            hwTag = lang === 'pt' ? `Geração Paralela Fabric (${cpu.cores} Núcleos • MC ${state.mcVersion})` : `Fabric Parallel WorldGen (${cpu.cores} Cores • MC ${state.mcVersion})`;
            desc = lang === 'pt'
                ? `No Fabric (${state.mcVersion}), o C2ME paraleliza a geração e leitura de chunks usando o esquema ${is121 ? '0.3+ (chunkSystem)' : '0.2 (threadedWorldGen/ioSystem)'}.`
                : `On Fabric (${state.mcVersion}), C2ME parallelizes chunk generation and I/O using the ${is121 ? '0.3+ (chunkSystem)' : '0.2 (threadedWorldGen/ioSystem)'} schema.`;
            code = is121
                ? `version = 3
globalExecutorParallelism = ${cpu.chunkThreads}

[ioSystem]
  gcFreeChunkSerializer = false

[chunkSystem]
  asyncSerialization = true
  recoverFromErrors = true
  allowPOIUnloading = true

[vanillaWorldGenOptimizations]
  optimizeAquifer = true
  useEndBiomeCache = true
  optimizeStructureWeightSampler = true
  useDensityFunctionCompiler = true`
                : `version = 3
globalExecutorParallelism = ${cpu.chunkThreads}

[ioSystem]
  async = true
  chunkStreamVersion = 2
  gcFreeChunkSerializer = false

[threadedWorldGen]
  enabled = true
  allowThreadedFeatures = true
  reduceLockRadius = true

[vanillaWorldGenOptimizations]
  optimizeAquifer = true
  useEndBiomeCache = true`;
            tips = is121
                ? (lang === 'pt'
                    ? `<strong>C2ME 0.3+ (MC 1.21+):</strong> Usamos <code>globalExecutorParallelism = ${cpu.chunkThreads}</code> e o novo bloco <code>[chunkSystem]</code> (<code>asyncSerialization = true</code>, <code>allowPOIUnloading = true</code>), além de <code>useDensityFunctionCompiler = true</code> compilado pelo JIT. Mantemos <code>gcFreeChunkSerializer = false</code> para preservar compatibilidade com Architectury.`
                    : `<strong>C2ME 0.3+ (MC 1.21+):</strong> Uses <code>globalExecutorParallelism = ${cpu.chunkThreads}</code>, the new <code>[chunkSystem]</code> section (<code>asyncSerialization = true</code>, <code>allowPOIUnloading = true</code>), and JIT-compiled <code>useDensityFunctionCompiler = true</code>. We keep <code>gcFreeChunkSerializer = false</code> to avoid Architectury incompatibilities.`)
                : (lang === 'pt'
                    ? `<strong>C2ME 0.2 (MC 1.20.x):</strong> Definimos <code>globalExecutorParallelism = ${cpu.chunkThreads}</code>, <code>chunkStreamVersion = 2</code> (Deflate) e <code>[threadedWorldGen]</code>. Mantemos <code>gcFreeChunkSerializer = false</code> para evitar conflitos com mods baseados em Architectury.`
                    : `<strong>C2ME 0.2 (MC 1.20.x):</strong> Configures <code>globalExecutorParallelism = ${cpu.chunkThreads}</code>, integer <code>chunkStreamVersion = 2</code> (Deflate), and <code>[threadedWorldGen]</code>. We keep <code>gcFreeChunkSerializer = false</code> to preserve Architectury mod compatibility.`);
        } else {
            filePath = "config/forge-client.toml  &  config/fml.toml";
            hwTag = lang === 'pt'
                ? `Boot Rápido (${cpu.fmlThreads} Threads) + Carregamento Off-Thread`
                : `Fast Boot (${cpu.fmlThreads} Threads) + Off-Thread Setup`;
            desc = lang === 'pt'
                ? "Ajustes nos arquivos nativos do Forge / NeoForge para acelerar a abertura do modpack e a preparação de terreno."
                : "Native Forge / NeoForge config tweaks to speed up modpack loading and terrain setup.";
            code = `# --- ${lang === 'pt' ? 'No arquivo' : 'In file'}: config/forge-client.toml ---
[client]
alwaysSetupTerrainOffThread = true
experimentalForgeLightPipelineEnabled = false

# --- ${lang === 'pt' ? 'No arquivo' : 'In file'}: config/fml.toml ---
earlyWindowControl = true
maxThreads = ${cpu.fmlThreads}
versionCheck = false
defaultConfigPath = "defaultconfigs"`;
            if (state.loader === 'neoforge') {
                filePath = "config/fml.toml";
                code = `# --- ${lang === 'pt' ? 'No arquivo' : 'In file'}: config/fml.toml ---
earlyWindowControl = true
maxThreads = ${cpu.fmlThreads}
versionCheck = false
defaultConfigPath = "defaultconfigs"`;
            }
            tips = lang === 'pt'
                ? `<strong>Ajuste Exato para ${cpu.name}:</strong> Definimos <code>maxThreads = ${cpu.fmlThreads}</code> (deixando threads livres para o sistema operacional) para que o Forge compile os mods na velocidade máxima do seu <strong>${storageName}</strong>, e <code>versionCheck = false</code> para impedir que centenas de mods congelem o menu inicial buscando atualizações online.`
                : `<strong>Exact Match for ${cpu.name}:</strong> We set <code>maxThreads = ${cpu.fmlThreads}</code> (leaving threads free for the OS) so Forge compiles mods at the full speed of your <strong>${storageName}</strong>, and <code>versionCheck = false</code> to stop hundreds of mods from stalling startup with HTTP update checks.`;
            if (state.loader === 'neoforge') {
                tips += lang === 'pt'
                    ? `<br><br><em>NeoForge:</em> o arquivo do cliente se chama <code>neoforge-client.toml</code> e as opções de terreno/iluminação do <code>forge-client.toml</code> não se aplicam; o Sodium/Embeddium já cuida disso. Por isso aplicamos só o <code>fml.toml</code>.`
                    : `<br><br><em>NeoForge:</em> the client file is called <code>neoforge-client.toml</code> and the terrain/lighting options from <code>forge-client.toml</code> do not apply; Sodium/Embeddium already handles that. That is why only <code>fml.toml</code> is applied.`;
            }
        }
    }

    document.getElementById('cfg-file-path').textContent = filePath;
    document.getElementById('cfg-hw-tag').textContent = hwTag;
    document.getElementById('cfg-file-desc').textContent = desc;
    document.getElementById('cfg-code-output').textContent = code;
    document.getElementById('cfg-tips-box').innerHTML = tips;

    if (typeof refreshConfigScanReport === 'function') refreshConfigScanReport();
}

// ============================================================================
// SEÇÃO 5: DRIVER GPU & SHADERS (PROMOVIDA DA ANTIGA ABA 9)
// ============================================================================
function renderDriverSection() {
    const lang = state.lang;
    const cpu = cpuDatabase[state.cpuKey];
    const gpu = getActiveGpu();
    const optFile = (state.loader === 'fabric' || (state.loader === 'neoforge' && state.mcVersion.startsWith('1.21')))
        ? 'sodium-options.json'
        : 'embeddium-options.json';

    let filePath = lang === 'pt' ? `Painel de Controle do Driver (${gpu.name})` : `GPU Driver Control Panel (${gpu.name})`;
    let hwTag = `${gpu.vendorLabel || gpu.vendor.toUpperCase()} • Oculus / Iris Shaders`;
    let desc = lang === 'pt'
        ? "Configurações no sistema operacional e driver de vídeo para o executável javaw.exe do seu Java."
        : "OS and GPU driver settings for your Java javaw.exe executable.";
    let code = "";

    if (gpu.none) {
        filePath = lang === 'pt' ? 'Painel de Controle do Driver (sem GPU definida)' : 'GPU Driver Control Panel (no GPU selected)';
        hwTag = lang === 'pt' ? 'Aguardando uma GPU' : 'Waiting for a GPU';
        desc = lang === 'pt'
            ? 'A CPU selecionada não tem vídeo integrado, então não há driver de vídeo para configurar.'
            : 'The selected CPU has no integrated graphics, so there is no video driver to configure.';
        code = lang === 'pt'
            ? 'Selecione uma placa de vídeo dedicada na lista de GPU ou uma CPU com gráficos integrados (ex.: Ryzen 5 5600G, Core i5-12400) para ver as configurações do driver.'
            : 'Pick a dedicated graphics card from the GPU list or a CPU with integrated graphics (e.g. Ryzen 5 5600G, Core i5-12400) to see the driver settings.';
    } else if (gpu.vendor === 'nvidia') {
        code = lang === 'pt'
            ? `=== PAINEL DE CONTROLE DA NVIDIA (Para ${gpu.name}) ===
1. Abra o Painel da NVIDIA -> Gerenciar as configurações em 3D -> Aba "Configurações do Programa".
2. Clique em "Adicionar" e selecione o javaw.exe da pasta do seu Java.
3. Aplique exatamente estes valores:
   • Otimização segmentada (Threaded Optimization): LIGADO (Essencial para OpenGL!)
   • Modo de gerenciamento de energia: Preferência por desempenho máximo
   • Modo de Baixa Latência (Low Latency Mode): Ligado
   • Filtragem da textura - Qualidade: Alto desempenho
   • Sincronização Vertical (V-Sync): Usar a configuração do aplicativo 3D (Desligue no jogo)
   • Método de apresentação Vulkan/OpenGL: Preferir camadas na cadeia de troca DXGI (Ativa Auto-HDR/G-Sync em janela)`
            : `=== NVIDIA CONTROL PANEL (For ${gpu.name}) ===
1. Open NVIDIA Control Panel -> Manage 3D Settings -> "Program Settings" tab.
2. Click "Add" and select javaw.exe from your Java folder.
3. Apply these exact settings:
   • Threaded Optimization: ON (Crucial for OpenGL multi-threading!)
   • Power Management Mode: Prefer Maximum Performance
   • Low Latency Mode: On
   • Texture Filtering - Quality: High Performance
   • Vertical Sync (V-Sync): Use the 3D application setting (Turn OFF in-game)
   • Vulkan/OpenGL present method: Prefer layered on DXGI Swapchain (Enables G-Sync/FreeSync in windowed mode)`;
    } else if (gpu.vendor === 'amd') {
        code = lang === 'pt'
            ? `=== AMD SOFTWARE: ADRENALIN EDITION (Para ${gpu.name}) ===
1. Abra o AMD Adrenalin -> Jogos -> Adicione manualmente o javaw.exe do seu Java.
2. Em versões recentes do driver Windows 11 (22.7.1+), o driver possui otimização nativa OpenGL.
3. Aplique estes ajustes no perfil do Java:
   • Radeon Anti-Lag: Ativado
   • Aguardar atualização vertical: Sempre desligado
   • Otimização de formato de superfície: Ativado (Economiza VRAM nos ${gpu.vram}GB)
   • Qualidade de filtragem de textura: Desempenho
   • Se usar Shaders (Oculus/Iris): Desative o "Radeon Boost" para evitar mudança brusca de resolução.`
            : `=== AMD SOFTWARE: ADRENALIN EDITION (For ${gpu.name}) ===
1. Open AMD Adrenalin -> Gaming -> Manually add javaw.exe from your Java folder.
2. Modern AMD drivers (22.7.1+) feature a rebuilt hardware-accelerated OpenGL pipeline.
3. Apply these profile settings for Java:
   • Radeon Anti-Lag: Enabled
   • Wait for Vertical Refresh: Always Off
   • Surface Format Optimization: Enabled (Saves VRAM on your ${gpu.vram}GB card)
   • Texture Filtering Quality: Performance
   • When using Shaders (Oculus/Iris): Disable "Radeon Boost" to avoid dynamic resolution artifacts.`;
    } else {
        code = lang === 'pt'
            ? `=== INTEL ARC CONTROL / GRÁFICOS INTEL (Para ${gpu.name}) ===
1. Nas configurações gráficas do Windows (Sistema -> Tela -> Elementos Gráficos):
   • Adicione o javaw.exe do seu Java e marque "Alto Desempenho (${gpu.name})".
2. Em placas Intel Arc dedicadas:
   • Certifique-se de que o Resizable BAR (ReBAR) esteja ATIVO na BIOS da placa-mãe.
   • No ${optFile}, mantivemos "use_no_error_g_l_context": false para máxima estabilidade no driver OpenGL da Intel.`
            : `=== INTEL ARC CONTROL / INTEL GRAPHICS (For ${gpu.name}) ===
1. In Windows Graphics Settings (System -> Display -> Graphics):
   • Add your Java's javaw.exe and select "High Performance (${gpu.name})".
2. On dedicated Intel Arc GPUs:
   • Ensure Resizable BAR (ReBAR) is ENABLED in your motherboard BIOS.
   • In ${optFile}, we kept "use_no_error_g_l_context": false for maximum stability with Intel's OpenGL driver.`;
    }

    if (state.os === 'linux' && !gpu.none) {
        const nv = gpu.vendor === 'nvidia';
        const hyb = isHybridNotebook(cpu, gpu);
        filePath = lang === 'pt' ? 'Variáveis de ambiente do launcher (Linux)' : 'Launcher environment variables (Linux)';
        hwTag = nv ? 'NVIDIA proprietary driver • Linux' : `${gpu.vendorLabel || gpu.vendor.toUpperCase()} Mesa • Linux`;
        desc = lang === 'pt'
            ? 'Variáveis de ambiente para o campo de variáveis do launcher (ou como prefixo do comando de inicialização).'
            : "Environment variables for the launcher's variables field (or as a prefix of the launch command).";
        const envLines = nv
            ? ['__GL_THREADED_OPTIMIZATIONS=1', '__GL_SYNC_TO_VBLANK=0'].concat(hyb ? ['__NV_PRIME_RENDER_OFFLOAD=1', '__GLX_VENDOR_LIBRARY_NAME=nvidia'] : [])
            : ['mesa_glthread=true', 'vblank_mode=0'].concat(hyb ? ['DRI_PRIME=1'] : []);
        code = (lang === 'pt'
            ? `# Variáveis de ambiente (${nv ? 'driver proprietário NVIDIA' : 'Mesa: AMD / Intel'})\n`
            : `# Environment variables (${nv ? 'NVIDIA proprietary driver' : 'Mesa: AMD / Intel'})\n`) + envLines.join('\n');
    } else if (state.os === 'macos' && !gpu.none) {
        filePath = lang === 'pt' ? 'Ajustes do macOS e Java ARM64' : 'macOS settings and ARM64 Java';
        hwTag = 'Apple Silicon • macOS';
        desc = lang === 'pt' ? 'O macOS gerencia o driver da GPU: não há painel para ajustar. Estes são os pontos que importam.' : 'macOS manages the GPU driver: there is no panel to tune. These are the points that matter.';
        code = lang === 'pt'
            ? `=== macOS (${gpu.name}) ===
1. Use um Java ARM64 (aarch64): Temurin ou Oracle GraalVM para macOS aarch64.
   Java x64 roda via Rosetta e perde bastante desempenho.
2. Ajustes do Sistema -> Bateria: desative o "Modo de baixo consumo" e jogue na tomada.
3. No ${optFile} mantivemos "use_no_error_g_l_context": false
   para máxima estabilidade com o driver OpenGL da Apple.`
            : `=== macOS (${gpu.name}) ===
1. Use an ARM64 (aarch64) Java: Temurin or Oracle GraalVM for macOS aarch64.
   x64 Java runs through Rosetta and loses a lot of performance.
2. System Settings -> Battery: turn off "Low Power Mode" and play plugged in.
3. In ${optFile} we kept "use_no_error_g_l_context": false
   for maximum stability with Apple's OpenGL driver.`;
    }

    let shaderAdvPt, shaderAdvEn;
    if ((gpu.igpu && !gpu.unified) || gpu.tier === 'low' || gpu.tier === 'entry') {
        shaderAdvPt = 'esta GPU é de nível básico: evite Shaders. Se quiser testar, use o perfil Low e <strong>Shadow Distance de 4 a 6 chunks</strong>.';
        shaderAdvEn = 'this is an entry-level GPU: avoid Shaders. If you want to try, use the Low profile and a <strong>Shadow Distance of 4 to 6 chunks</strong>.';
    } else if (gpu.tier === 'mid') {
        shaderAdvPt = 'prefira Shaders leves (ex.: Complementary Reimagined em Low/Medium) e reduza a <em>Shadow Distance</em> para <strong>6 a 8 chunks</strong>.';
        shaderAdvEn = 'prefer light Shaders (e.g. Complementary Reimagined on Low/Medium) and lower the <em>Shadow Distance</em> to <strong>6 to 8 chunks</strong>.';
    } else {
        shaderAdvPt = 'reduza a <em>Shadow Distance</em> para <strong>8 a 10 chunks</strong> (mesmo com visão de 16 chunks): alivia bastante a GPU com pouca perda visual.';
        shaderAdvEn = 'lower the <em>Shadow Distance</em> to <strong>8 to 10 chunks</strong> (even with a 16-chunk render distance): it relieves the GPU a lot with little visual loss.';
    }

    let tips = gpu.none ? '' : (lang === 'pt'
        ? `<strong>Dica para Shaders (Oculus / Iris) na ${gpu.name}:</strong> ${shaderAdvPt}`
        : `<strong>Shader tip (Oculus / Iris) on ${gpu.name}:</strong> ${shaderAdvEn}`);
    if (isHybridNotebook(cpu, gpu) && state.os === 'windows') {
        tips += lang === 'pt'
            ? `<br><br><strong>Notebook:</strong> em Configurações > Sistema > Vídeo > Elementos gráficos, adicione o <code>javaw.exe</code> como "Alto desempenho" para forçar a GPU dedicada.`
            : `<br><br><strong>Laptop:</strong> under Settings > System > Display > Graphics, add <code>javaw.exe</code> as "High performance" to force the dedicated GPU.`;
    }
    if (state.os === 'linux') {
        tips += lang === 'pt'
            ? `<br><br><strong>Linux:</strong> coloque estas variáveis no campo de variáveis de ambiente do launcher (no Modrinth App fica em <em>Java e memória</em>; em outros, prefixe o comando de inicialização). Para as <em>Transparent Huge Pages</em>, marque a opção ao lado da linha de argumentos.`
            : `<br><br><strong>Linux:</strong> put these variables in the launcher's environment variables field (in the Modrinth App it is under <em>Java and memory</em>; in others, prefix the launch command). For <em>Transparent Huge Pages</em>, tick the option next to the arguments line.`;
    }

    document.getElementById('driver-file-path').textContent = filePath;
    document.getElementById('driver-hw-tag').textContent = hwTag;
    document.getElementById('driver-file-desc').textContent = desc;
    document.getElementById('driver-code-output').textContent = code;
    const tipsEl = document.getElementById('driver-tips-box');
    tipsEl.innerHTML = tips;
    tipsEl.classList.toggle('hidden', !tips);
}
