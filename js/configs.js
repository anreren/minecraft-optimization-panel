// Generated configuration files (tabs of Section 4).
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// ============================================================================
// GERADOR DE CONFIGURAÇÕES RECOMENDADAS PARA TODOS OS 9 MODS / DRIVERS
// ============================================================================
function selectConfigTab(tabKey) {
    state.activeConfigTab = tabKey;
    document.querySelectorAll('.ctab-btn').forEach(btn => {
        btn.className = "ctab-btn px-3 py-2 rounded-lg text-xs font-semibold text-gray-400 hover:text-white transition flex items-center gap-1.5";
        btn.setAttribute('aria-selected', 'false');
        btn.setAttribute('tabindex', '-1');
    });
    document.getElementById(`ctab-${tabKey}`).className = "ctab-btn px-3 py-2 rounded-lg text-xs font-bold bg-blue-600 text-white transition flex items-center gap-1.5";
    const activeTab = document.getElementById(`ctab-${tabKey}`);
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
            ? "Cole estas linhas no final do arquivo modernfix-mixins.properties (logo abaixo de # User overrides go here)."
            : "Paste these lines at the bottom of modernfix-mixins.properties (right below # User overrides go here).";
        code = `# User overrides go here (${lang === 'pt' ? 'Gerado para' : 'Generated for'} ${cpu.name} + ${gpu.name})
mixin.perf.dynamic_resources=${dynRes}
mixin.perf.faster_item_rendering=true
mixin.perf.dynamic_entity_renderers=true
mixin.perf.clear_mixin_classinfo=true
mixin.perf.deduplicate_location=true
mixin.perf.deduplicate_climate_parameters=true
mixin.perf.compact_bit_storage=true
mixin.bugfix.packet_leak=true
mixin.feature.remove_chat_signing=true${remSpawn ? '\nmixin.perf.remove_spawn_chunks=true' : ''}`;
        tips = lang === 'pt'
            ? `<strong>Por que usar estas opções:</strong> <code>dynamic_resources=${dynRes}</code> economiza gigabytes de RAM lendo modelos sob demanda do seu <strong>${storageName}</strong>. Já <code>faster_item_rendering=true</code> evita quedas de FPS ao abrir inventários com JEI/EMI lotados.`
            : `<strong>Why use these options:</strong> <code>dynamic_resources=${dynRes}</code> saves gigabytes of RAM by streaming models on-demand from your <strong>${storageName}</strong>. Meanwhile, <code>faster_item_rendering=true</code> prevents FPS drops when opening inventories with JEI/EMI.`;
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
        const isLowBandwidth = state.ddrType === 'DDR3' || (state.ddrType === 'DDR4' && state.ramFreq <= 3000) || state.sysRamGB <= 16 || state.memChannels === 1;
        filePath = "config/ferritecore-mixin.toml";
        hwTag = lang === 'pt'
            ? `Perfil universal • sua RAM: ${state.ddrType} ${state.ramFreq}MHz (${state.sysRamGB}GB)`
            : `Universal profile • your RAM: ${state.ddrType} ${state.ramFreq}MHz (${state.sysRamGB}GB)`;
        desc = lang === 'pt'
            ? "Configuração completa do FerriteCore para reduzir drasticamente o peso dos estados de blocos na memória."
            : "Complete FerriteCore configuration to drastically reduce blockstate memory footprint.";
        code = `# FerriteCore Universal Config (${state.ddrType} ${state.ramFreq}MHz)
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
bakedQuadDeduplication = true`;
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
  "dont_add_prod_info_to_crash_reports": false,
  "experimental_screen_batching": false,
  "experimental_sign_text_buffering": true
}`;
        tips = lang === 'pt'
            ? `<strong>Por que <code>experimental_screen_batching: false</code>?</strong> Mantemos o batching de HUD e Fontes ligado (acelerando interfaces cheias), mas deixamos o <em>experimental_screen_batching</em> desligado para evitar bugs visuais em barras customizadas de mods de RPG, magias e minimapas.`
            : `<strong>Why <code>experimental_screen_batching: false</code>?</strong> We keep HUD and Font batching enabled (speeding up crowded GUIs), but leave <em>experimental_screen_batching</em> off to prevent visual glitches with custom RPG bars, spell HUDs, and minimaps.`;
    }
    else if (tab === 'entityculling') {
        const sleepDelay = cpu.threads >= 12 ? 10 : (cpu.threads >= 8 ? 15 : 25);
        const traceDist = cpu.threads >= 12 ? 128 : (cpu.threads >= 8 ? 96 : 64);
        filePath = "config/entityculling.json";
        hwTag = lang === 'pt' ? `Raytracing Assíncrono (${cpu.threads} Threads)` : `Async Raytracing (${cpu.threads} Threads)`;
        desc = lang === 'pt'
            ? "Configuração do EntityCulling para ocultar entidades e blocos-entidade (baús/máquinas) atrás de paredes e cavernas."
            : "EntityCulling configuration to skip rendering entities and block-entities (chests/machines) hidden behind walls and caves.";
        code = `{
  "configVersion": 6,
  "renderNametagsThroughWalls": true,
  "blockEntityWhitelist": [
    "minecraft:beacon",
    "create:rope_pulley",
    "create:hose_pulley",
    "botania:flame_ring"
  ],
  "tracingDistance": ${traceDist},
  "debugMode": false,
  "sleepDelay": ${sleepDelay},
  "hitboxLimit": 50,
  "skipMarkerArmorStands": true,
  "tickCulling": true,
  "tickCullingWhitelist": [
    "minecraft:villager",
    "minecraft:ender_dragon",
    "create:contraption"
  ],
  "disableF3": false,
  "skipHiddenEntityRendering": true,
  "skipHiddenBlockEntityRendering": true
}`;
        tips = lang === 'pt'
            ? `<strong>Calculado para sua CPU:</strong> O <code>sleepDelay: ${sleepDelay}</code> define a velocidade com que a thread secundária da sua <strong>${cpu.name}</strong> calcula a visibilidade dos objetos. Além disso, <code>tickCulling: true</code> congela animações de mobs que você não está vendo, economizando CPU e GPU ao mesmo tempo!`
            : `<strong>Tailored to your CPU:</strong> <code>sleepDelay: ${sleepDelay}</code> sets how frequently your <strong>${cpu.name}</strong>'s background thread updates visibility rays. Furthermore, <code>tickCulling: true</code> skips animation ticks for occluded mobs, saving both CPU and GPU!`;
        tips += lang === 'pt'
            ? ` Já o <code>tracingDistance: ${traceDist}</code> também vem da CPU (${cpu.threads} threads): é a distância do raytracing de visibilidade, que roda na CPU, então CPUs menores usam alcance menor.`
            : ` The <code>tracingDistance: ${traceDist}</code> also comes from the CPU (${cpu.threads} threads): it is the visibility raytracing range, which runs on the CPU, so smaller CPUs use a shorter range.`;
    }
    else if (tab === 'badopt') {
        filePath = "config/badoptimizations.txt (or .json)";
        hwTag = "SkyColor, Lightmap & BlockEntities Cache";
        desc = lang === 'pt'
            ? "O BadOptimizations evita que o Minecraft recalcule variáveis estáticas dezenas de vezes por segundo."
            : "BadOptimizations prevents Minecraft from recalculating static variables dozens of times per second.";
        code = `# BadOptimizations Universal Config
enable_toast_optimizations = true
enable_sky_color_caching = true
enable_lightmap_caching = true
enable_particle_manager_optimization = true
enable_entity_renderer_caching = true
enable_block_entity_renderer_caching = true
enable_debug_renderer_disable_if_not_needed = true
enable_remove_redundant_fov_calculations = true
sky_color_time_change_needed_for_update = 3
ignore_mod_incompatibilities = false`;
        tips = lang === 'pt'
            ? `<strong>Ganho Direto:</strong> Em modpacks com dezenas de biomas novos (Biomes O' Plenty, Regions Unexplored, Oh The Biomes We've Gone), o cálculo de transição de cor do céu e iluminação consome muitos ciclos de CPU. Este arquivo coloca tudo em cache.`
            : `<strong>Direct Gain:</strong> In modpacks with dozens of custom biomes (Biomes O' Plenty, Regions Unexplored, Oh The Biomes We've Gone), sky color blending and lightmap updates consume significant CPU cycles. This config caches them.`;
    }
    else if (tab === 'radium') {
        const isLithium = state.loader === 'fabric' || (state.loader === 'neoforge' && state.mcVersion.startsWith('1.21'));
        filePath = isLithium ? "config/lithium.properties" : "config/radium.properties (or canary.properties)";
        hwTag = lang === 'pt' ? `Perfil universal (servidor integrado)` : `Universal profile (integrated server)`;
        desc = lang === 'pt'
            ? "Otimizações de TPS (Ticks por Segundo) para IA de mobs, funis, colisões e carregamento de chunks."
            : "TPS (Ticks Per Second) optimizations for mob AI, hoppers, collisions, and chunk loading.";
        code = `# Universal ${isLithium ? 'Lithium' : 'Radium Reforged / Canary'} Config
mixin.ai.nearby_entity_tracking=true
mixin.ai.pathing=true
mixin.ai.poi=true
mixin.ai.raid=true
mixin.ai.sensor=true
mixin.ai.task=true
mixin.block.hopper=true
mixin.block.moving_block_shapes=true
mixin.block.redstone_wire=true
mixin.chunk.block_counting=true
mixin.chunk.entity_class_groups=true
mixin.chunk.palette=true
mixin.chunk.serialization=true
mixin.collections.attributes=true
mixin.collections.entity_by_type=true
mixin.entity.collisions.movement=true
mixin.entity.fast_elytra_check=true
mixin.entity.fast_hand_swing=true
mixin.entity.fast_powder_snow_check=true
mixin.entity.inactive_navigations=true
mixin.gen.cached_generator_settings=true
mixin.math.fast_util=true
mixin.math.sine_lut=true
mixin.shapes.blockstate_cache=true
mixin.shapes.optimized_matching=true
mixin.world.block_entity_ticking=true
mixin.world.chunk_access=true
mixin.world.explosions=true
mixin.world.tick_scheduler=true`;
        tips = lang === 'pt'
            ? `<strong>Salva-vidas de TPS:</strong> Estas regras podem reduzir o tempo de tick (mspt) no servidor integrado quando há muitos mobs (Alex's Mobs, Ice and Fire, chefes) ou máquinas automáticas rodando perto da sua base.`
            : `<strong>TPS Lifesaver:</strong> These rules can reduce integrated server tick time (MSPT) when surrounded by modded mobs (Alex's Mobs, Ice and Fire, bosses) or automated machinery.`;
    }
    else if (tab === 'loader') {
        if (state.loader === 'fabric') {
            filePath = "config/c2me.toml (Concurrent Chunk Management Engine)";
            hwTag = lang === 'pt' ? `Geração Paralela Fabric (${cpu.cores} Núcleos)` : `Fabric Parallel WorldGen (${cpu.cores} Cores)`;
            desc = lang === 'pt'
                ? "No Fabric, o C2ME paraleliza a geração e leitura de chunks usando múltiplos núcleos."
                : "On Fabric, C2ME parallelizes chunk generation and I/O across multiple CPU cores.";
            code = `version = 3
maxConcurrentTasks = ${cpu.chunkThreads}

[ioSystem]
  async = true
  chunkStreamVersion = "DEFLATE"
  gcFreeChunkSerializer = true

[threadedWorldGen]
  enabled = true
  allowThreadedFeatures = true
  reduceLockRadius = true

[vanillaWorldGenOptimizations]
  optimizeAquifer = true
  useDensityFunctionCompiler = true`;
            tips = lang === 'pt'
                ? `<strong>C2ME + JIT:</strong> A opção <code>useDensityFunctionCompiler = true</code> compila as funções matemáticas de geração de cavernas e montanhas em bytecode Java puro, que o JIT (Graal ou C2) consegue otimizar bem.`
                : `<strong>C2ME + JIT:</strong> Setting <code>useDensityFunctionCompiler = true</code> compiles mathematical cave and mountain generation functions into Java bytecode, which the JIT (Graal or C2) can optimize well.`;
        } else {
            filePath = "config/forge-client.toml  &  config/fml.toml";
            hwTag = lang === 'pt'
                ? `Boot Rápido (${cpu.fmlThreads} Threads) + Iluminação Paralela`
                : `Fast Boot (${cpu.fmlThreads} Threads) + Parallel Lighting`;
            desc = lang === 'pt'
                ? "Ajustes nos arquivos nativos do Forge / NeoForge para acelerar a abertura do modpack e eliminar travadas de iluminação."
                : "Native Forge / NeoForge config tweaks to speed up modpack loading and eliminate lighting stutters.";
            code = `# --- ${lang === 'pt' ? 'No arquivo' : 'In file'}: config/forge-client.toml ---
alwaysSetupTerrainOffThread = true
forgeLightPipelineEnabled = true

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
                ? `<strong>Ajuste Exato para ${cpu.name}:</strong> Definimos <code>maxThreads = ${cpu.fmlThreads}</code> (deixando 2 threads livres para o sistema operacional) para que o Forge compile os mods na velocidade máxima do seu <strong>${storageName}</strong>, e <code>versionCheck = false</code> para impedir que centenas de mods congelem o menu inicial buscando atualizações online.`
                : `<strong>Exact Match for ${cpu.name}:</strong> We set <code>maxThreads = ${cpu.fmlThreads}</code> (leaving 2 threads free for the OS) so Forge compiles mods at the full speed of your <strong>${storageName}</strong>, and <code>versionCheck = false</code> to stop hundreds of mods from stalling startup with HTTP update checks.`;
            if (state.loader === 'neoforge') {
                tips += lang === 'pt'
                    ? `<br><br><em>NeoForge:</em> o arquivo do cliente se chama <code>neoforge-client.toml</code> e as opções de terreno/iluminação do <code>forge-client.toml</code> não se aplicam; o Sodium/Embeddium já cuida disso. Por isso aplicamos só o <code>fml.toml</code>.`
                    : `<br><br><em>NeoForge:</em> the client file is called <code>neoforge-client.toml</code> and the terrain/lighting options from <code>forge-client.toml</code> do not apply; Sodium/Embeddium already handles that. That is why only <code>fml.toml</code> is applied.`;
            }
        }
    }
    else if (tab === 'driver') {
        filePath = lang === 'pt' ? `Painel de Controle do Driver (${gpu.name})` : `GPU Driver Control Panel (${gpu.name})`;
        hwTag = `${gpu.vendorLabel || gpu.vendor.toUpperCase()} Profile + Oculus/Iris Shaders`;
        desc = lang === 'pt'
            ? "Configurações no sistema operacional e driver de vídeo para o executável javaw.exe do seu Java."
            : "OS and GPU driver settings for your Java javaw.exe executable.";

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
   • No embeddium-options.json, mantivemos "use_no_error_g_l_context": false para máxima estabilidade no driver OpenGL da Intel.`
                : `=== INTEL ARC CONTROL / INTEL GRAPHICS (For ${gpu.name}) ===
1. In Windows Graphics Settings (System -> Display -> Graphics):
   • Add your Java's javaw.exe and select "High Performance (${gpu.name})".
2. On dedicated Intel Arc GPUs:
   • Ensure Resizable BAR (ReBAR) is ENABLED in your motherboard BIOS.
   • In embeddium-options.json, we kept "use_no_error_g_l_context": false for maximum stability with Intel's OpenGL driver.`;
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
3. No embeddium-options.json mantivemos "use_no_error_g_l_context": false
   para máxima estabilidade com o driver OpenGL da Apple.`
                : `=== macOS (${gpu.name}) ===
1. Use an ARM64 (aarch64) Java: Temurin or Oracle GraalVM for macOS aarch64.
   x64 Java runs through Rosetta and loses a lot of performance.
2. System Settings -> Battery: turn off "Low Power Mode" and play plugged in.
3. In embeddium-options.json we kept "use_no_error_g_l_context": false
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
        tips = gpu.none ? '' : (lang === 'pt'
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
    }

    document.getElementById('cfg-file-path').textContent = filePath;
    document.getElementById('cfg-hw-tag').textContent = hwTag;
    document.getElementById('cfg-file-desc').textContent = desc;
    document.getElementById('cfg-code-output').textContent = code;
    document.getElementById('cfg-tips-box').innerHTML = tips;
}
