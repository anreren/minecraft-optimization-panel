// Section 4: /config folder loader, per-mod recursive matcher, option validator & safe auto-adjuster.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

const configScanState = {
    loaded: false,
    folderName: '',
    writable: false,
    fileMap: Object.create(null),     // normalized relative path -> string content
    handleMap: Object.create(null),   // normalized relative path -> FileSystemFileHandle (when available)
    lastReport: null
};

const SCAN_SKIP_DIRS = new Set([
    'backups', 'backup', 'cache', 'logs', 'crash-reports', 'mods', 'saves',
    'resourcepacks', 'shaderpacks', 'screenshots', 'schematics', 'journeymap',
    'xaero', '.git', 'node_modules'
]);

const SCAN_ALLOWED_EXT = /\.(json|toml|properties|txt|cfg)$/i;

function normalizeScanPaths(rawMap) {
    const entries = Object.entries(rawMap).map(([raw, val]) => [
        String(raw).replace(/\\/g, '/').replace(/^\.\//, '').replace(/^\/+/, ''),
        val
    ]);
    // If all files live inside a single top-level folder (typical for webkitdirectory), strip it
    const firstParts = new Set(entries.map(([p]) => (p.includes('/') ? p.split('/')[0] : '')));
    let stripped = entries;
    if (firstParts.size === 1) {
        const root = [...firstParts][0];
        if (root && entries.every(([p]) => p.startsWith(root + '/'))) {
            stripped = entries.map(([p, v]) => [p.slice(root.length + 1), v]);
        }
    }
    // If the user picked the Minecraft instance root containing a config/ folder, scope into config/
    const hasConfigSub = stripped.some(([p]) => p.toLowerCase().startsWith('config/'));
    if (hasConfigSub) {
        stripped = stripped
            .filter(([p]) => p.toLowerCase().startsWith('config/'))
            .map(([p, v]) => [p.slice(7), v]);
    }
    const out = Object.create(null);
    for (const [p, v] of stripped) {
        if (p) out[p] = v;
    }
    return out;
}

function escapeHtmlScan(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

function getModConfigSpecs() {
    const cpu = cpuDatabase[state.cpuKey];
    const gpu = getActiveGpu();
    const isSodium = state.loader === 'fabric' || (state.loader === 'neoforge' && state.mcVersion.startsWith('1.21'));
    const isFabric = state.loader === 'fabric';
    const isForge = state.loader === 'forge';
    const is121 = state.mcVersion.startsWith('1.21');
    const hasDataComp = state.mcVersion === '1.20.6' || is121;
    const dynResEl = document.getElementById('chk-mf-dynres');
    const spawnEl = document.getElementById('chk-mf-spawn');
    const dynRes = dynResEl ? dynResEl.checked : storageDatabase[state.storageKey].dynResRecommended;
    const remSpawn = spawnEl ? spawnEl.checked : true;
    const sleepDelay = cpu.threads >= 16 ? 8 : (cpu.threads >= 8 ? 10 : 15);
    const traceDist = cpu.threads >= 12 ? 128 : (cpu.threads >= 8 ? 96 : 64);

    const mfExpected = {
        'mixin.perf.dynamic_resources': String(dynRes),
        'mixin.perf.faster_item_rendering': 'true',
        'mixin.perf.compact_bit_storage': 'true'
    };
    if (remSpawn) mfExpected['mixin.perf.remove_spawn_chunks'] = 'true';

    const ferriteExpected = {
        compactFastMap: 'true',
        useSmallThreadingDetector: 'false',
        cacheMultipartPredicates: 'true',
        multipartDeduplication: 'true',
        blockstateCacheDeduplication: 'true',
        modelResourceLocations: 'true',
        modelSides: 'true',
        replaceNeighborLookup: 'true',
        populateNeighborTable: 'false',
        replacePropertyMap: 'true',
        bakedQuadDeduplication: 'true'
    };
    if (hasDataComp) ferriteExpected.dataComponentPatch = 'true';

    const specs = [
        {
            id: 'modernfix',
            tab: 'modernfix',
            name: 'ModernFix',
            format: 'properties',
            primaryPaths: ['modernfix-mixins.properties'],
            subfolderPaths: ['modernfix/modernfix-mixins.properties'],
            expected: mfExpected,
            banned: [
                'mixin.bugfix.packet_leak',
                'mixin.perf.dynamic_entity_renderers',
                'mixin.perf.clear_mixin_classinfo',
                'mixin.perf.deduplicate_location',
                'mixin.perf.deduplicate_climate_parameters',
                'mixin.feature.remove_chat_signing'
            ]
        },
        {
            id: 'embeddium',
            tab: 'embeddium',
            name: isSodium ? 'Sodium' : 'Embeddium',
            format: 'json',
            primaryPaths: [isSodium ? 'sodium-options.json' : 'embeddium-options.json'],
            subfolderPaths: [isSodium ? 'sodium/sodium-options.json' : 'embeddium/embeddium-options.json'],
            mismatchPaths: [isSodium ? 'embeddium-options.json' : 'sodium-options.json'],
            expected: {
                'quality.leaves_quality': (gpu.tier === 'low' || gpu.tier === 'entry') ? 'FAST' : 'DEFAULT',
                'quality.enable_vignette': false,
                'performance.chunk_builder_threads': cpu.chunkThreads,
                'performance.always_defer_chunk_updates_v2': true,
                'performance.animate_only_visible_textures': true,
                'performance.use_entity_culling': true,
                'performance.use_fog_occlusion': true,
                'performance.use_block_face_culling': true,
                'performance.use_no_error_g_l_context': Boolean(gpu.noErrorCtx),
                'advanced.enable_memory_tracing': false,
                'advanced.use_advanced_staging_buffers': true,
                'advanced.cpu_render_ahead_limit': 3
            },
            banned: []
        },
        {
            id: 'ferrite',
            tab: 'ferrite',
            name: 'FerriteCore',
            format: isFabric ? 'properties' : 'toml',
            primaryPaths: [isFabric ? 'ferritecore.mixin.properties' : 'ferritecore-mixin.toml'],
            subfolderPaths: [isFabric ? 'ferritecore/ferritecore.mixin.properties' : 'ferritecore/ferritecore-mixin.toml'],
            mismatchPaths: [isFabric ? 'ferritecore-mixin.toml' : 'ferritecore.mixin.properties', 'ferritecore.toml'],
            expected: isFabric ? ferriteExpected : { '': ferriteExpected },
            banned: hasDataComp ? [] : ['dataComponentPatch']
        },
        {
            id: 'immediatelyfast',
            tab: 'immediatelyfast',
            name: 'ImmediatelyFast',
            format: 'json',
            primaryPaths: ['immediatelyfast.json'],
            subfolderPaths: ['immediatelyfast/immediatelyfast.json'],
            expected: {
                font_atlas_resizing: true,
                map_atlas_generation: true,
                hud_batching: true,
                fast_text_lookup: true,
                fast_buffer_upload: true,
                dont_add_info_into_debug_hud: false,
                experimental_screen_batching: false,
                experimental_sign_text_buffering: false
            },
            banned: ['dont_add_prod_info_to_crash_reports']
        },
        {
            id: 'entityculling',
            tab: 'entityculling',
            name: 'EntityCulling',
            format: 'json',
            primaryPaths: ['entityculling.json'],
            subfolderPaths: ['entityculling/entityculling.json'],
            expected: {
                configVersion: 9,
                safeMode: true,
                renderNametagsThroughWalls: true,
                tracingDistance: traceDist,
                debugMode: false,
                sleepDelay: sleepDelay,
                hitboxLimit: 50,
                captureRate: 5,
                tickCulling: true,
                disableF3: false,
                skipEntityCulling: false,
                skipBlockEntityCulling: false,
                blockEntityFrustumCulling: true,
                forceDisplayCulling: false,
                solidLeaves: false
            },
            ensureArrays: {
                blockEntityWhitelist: ['minecraft:beacon', 'create:rope_pulley', 'create:hose_pulley', 'botania:flame_ring'],
                tickCullingWhitelist: ['minecraft:boat', 'minecraft:block_display', 'minecraft:item_display', 'minecraft:text_display', 'create:contraption']
            },
            banned: ['skipHiddenEntityRendering', 'skipHiddenBlockEntityRendering', 'skipMarkerArmorStands', 'entityTickWhitelist']
        },
        {
            id: 'badopt',
            tab: 'badopt',
            name: 'BadOptimizations',
            format: 'colon',
            primaryPaths: ['badoptimizations.txt'],
            subfolderPaths: ['badoptimizations/badoptimizations.txt'],
            expected: {
                log_config: 'true',
                enable_lightmap_caching: 'true',
                lightmap_time_change_needed_for_update: '80',
                enable_sky_color_caching: 'true',
                skycolor_time_change_needed_for_update: '3',
                enable_debug_renderer_disable_if_not_needed: 'true',
                enable_particle_manager_optimization: 'true',
                enable_toast_optimizations: 'true',
                enable_sky_angle_caching_in_worldrenderer: 'true',
                enable_entity_renderer_caching: 'true',
                enable_block_entity_renderer_caching: 'true',
                enable_entity_flag_caching: 'true',
                enable_remove_redundant_fov_calculations: 'true',
                enable_remove_tutorial_if_not_demo: 'true',
                show_f3_text: 'true',
                ignore_mod_incompatibilities: 'false',
                ignore_mod_cache_hooks: 'false',
                config_version: '6'
            },
            banned: ['sky_color_time_change_needed_for_update']
        },
        {
            id: 'radium',
            tab: 'radium',
            name: isSodium ? 'Lithium' : 'Radium / Canary',
            format: 'properties_audit',
            primaryPaths: isSodium ? ['lithium.properties'] : ['radium.properties', 'canary.properties'],
            subfolderPaths: isSodium
                ? ['lithium/lithium.properties', 'lithium-fabric-mixin.properties']
                : ['radium/radium.properties', 'canary/canary.properties'],
            mismatchPaths: isSodium ? ['radium.properties', 'canary.properties'] : ['lithium.properties'],
            removedIn121: ['mixin.ai.nearby_entity_tracking', 'mixin.chunk.block_counting', 'mixin.entity.fast_hand_swing']
        }
    ];

    if (isFabric) {
        specs.push({
            id: 'loader_c2me',
            tab: 'loader',
            name: `C2ME (${is121 ? 'MC 1.21+' : 'MC 1.20.x'})`,
            format: 'toml',
            primaryPaths: ['c2me.toml'],
            subfolderPaths: ['c2me/c2me.toml'],
            expected: is121
                ? {
                    '': { version: '3', globalExecutorParallelism: String(cpu.chunkThreads) },
                    ioSystem: { gcFreeChunkSerializer: 'false' },
                    chunkSystem: { asyncSerialization: 'true', recoverFromErrors: 'true', allowPOIUnloading: 'true' },
                    vanillaWorldGenOptimizations: {
                        optimizeAquifer: 'true',
                        useEndBiomeCache: 'true',
                        optimizeStructureWeightSampler: 'true',
                        useDensityFunctionCompiler: 'true'
                    }
                }
                : {
                    '': { version: '3', globalExecutorParallelism: String(cpu.chunkThreads) },
                    ioSystem: { async: 'true', chunkStreamVersion: '2', gcFreeChunkSerializer: 'false' },
                    threadedWorldGen: { enabled: 'true', allowThreadedFeatures: 'true', reduceLockRadius: 'true' },
                    vanillaWorldGenOptimizations: { optimizeAquifer: 'true', useEndBiomeCache: 'true' }
                },
            banned: is121
                ? ['maxConcurrentTasks', 'ioSystem.async', 'ioSystem.chunkStreamVersion', 'threadedWorldGen.enabled', 'threadedWorldGen.allowThreadedFeatures', 'threadedWorldGen.reduceLockRadius']
                : ['maxConcurrentTasks', 'vanillaWorldGenOptimizations.useDensityFunctionCompiler', 'vanillaWorldGenOptimizations.optimizeStructureWeightSampler', 'chunkSystem.asyncSerialization', 'chunkSystem.allowPOIUnloading']
        });
    } else {
        if (isForge) {
            specs.push({
                id: 'loader_forge_client',
                tab: 'loader',
                name: 'Forge Client (forge-client.toml)',
                format: 'toml',
                primaryPaths: ['forge-client.toml'],
                subfolderPaths: ['forge/forge-client.toml'],
                expected: {
                    client: {
                        alwaysSetupTerrainOffThread: 'true',
                        experimentalForgeLightPipelineEnabled: 'false'
                    }
                },
                banned: ['forgeLightPipelineEnabled', 'client.forgeLightPipelineEnabled']
            });
        }
        specs.push({
            id: 'loader_fml',
            tab: 'loader',
            name: isForge ? 'Forge FML (fml.toml)' : 'NeoForge FML (fml.toml)',
            format: 'toml',
            primaryPaths: ['fml.toml'],
            subfolderPaths: ['fml/fml.toml'],
            expected: {
                '': {
                    earlyWindowControl: 'true',
                    maxThreads: String(cpu.fmlThreads),
                    versionCheck: 'false',
                    defaultConfigPath: '"defaultconfigs"'
                }
            },
            banned: []
        });
    }

    // Optional subfolder mod: ServerCore lives in config/servercore/config.toml on Fabric/NeoForge
    if (isFabric || state.loader === 'neoforge') {
        specs.push({
            id: 'servercore',
            tab: 'radium',
            name: 'ServerCore',
            optional: true,
            format: 'toml',
            primaryPaths: ['servercore/config.toml'],
            subfolderPaths: ['servercore/servercore.toml'],
            expected: {
                dynamic: { enabled: 'true' }
            },
            banned: []
        });
    }

    return specs;
}

function locateModFile(spec, filePaths) {
    const lowerMap = new Map(filePaths.map(p => [p.toLowerCase(), p]));

    // 1. Direct primary match in /config
    for (const p of spec.primaryPaths) {
        if (lowerMap.has(p.toLowerCase())) {
            const actual = lowerMap.get(p.toLowerCase());
            return { path: actual, location: actual.includes('/') ? 'subfolder' : 'direct', mismatch: false };
        }
    }
    // 2. Known subfolder match
    for (const p of (spec.subfolderPaths || [])) {
        if (lowerMap.has(p.toLowerCase())) {
            return { path: lowerMap.get(p.toLowerCase()), location: 'subfolder', mismatch: false };
        }
    }
    // 3. Any nested subfolder whose basename matches a primary filename
    const primaryNames = new Set(spec.primaryPaths.map(p => p.split('/').pop().toLowerCase()));
    const nested = filePaths
        .filter(p => p.includes('/') && !p.toLowerCase().startsWith('defaultconfigs/'))
        .find(p => primaryNames.has(p.split('/').pop().toLowerCase()));
    if (nested) {
        return { path: nested, location: 'subfolder', mismatch: false };
    }
    // 4. Cross-loader / cross-version mismatch filename (direct or nested)
    if (spec.mismatchPaths && spec.mismatchPaths.length) {
        for (const mp of spec.mismatchPaths) {
            if (lowerMap.has(mp.toLowerCase())) {
                const actual = lowerMap.get(mp.toLowerCase());
                return { path: actual, location: actual.includes('/') ? 'subfolder' : 'direct', mismatch: true };
            }
        }
        const mmNames = new Set(spec.mismatchPaths.map(p => p.split('/').pop().toLowerCase()));
        const mmNested = filePaths
            .filter(p => p.includes('/') && !p.toLowerCase().startsWith('defaultconfigs/'))
            .find(p => mmNames.has(p.split('/').pop().toLowerCase()));
        if (mmNested) {
            return { path: mmNested, location: 'subfolder', mismatch: true };
        }
    }
    return null;
}

function getNestedValue(obj, dotPath) {
    return dotPath.split('.').reduce((acc, k) => (acc && typeof acc === 'object' && k in acc ? acc[k] : undefined), obj);
}

function setNestedValue(obj, dotPath, val) {
    const parts = dotPath.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object' || Array.isArray(cur[parts[i]])) {
            cur[parts[i]] = {};
        }
        cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = val;
}

function deleteNestedValue(obj, dotPath) {
    const parts = dotPath.split('.');
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
        if (!cur || typeof cur !== 'object') return false;
        cur = cur[parts[i]];
    }
    if (cur && typeof cur === 'object' && parts[parts.length - 1] in cur) {
        delete cur[parts[parts.length - 1]];
        return true;
    }
    return false;
}

function analyzeJsonFile(spec, content) {
    let obj;
    try {
        obj = JSON.parse(content);
    } catch (e) {
        return { parseError: e.message, diffs: [], warnings: [], newContent: content };
    }
    const clone = JSON.parse(JSON.stringify(obj));
    const diffs = [];
    const warnings = [];

    for (const [dotKey, want] of Object.entries(spec.expected || {})) {
        const cur = getNestedValue(obj, dotKey);
        if (cur === undefined) {
            diffs.push({ key: dotKey, current: null, expected: String(want), kind: 'missing' });
            setNestedValue(clone, dotKey, want);
        } else if (cur !== want) {
            diffs.push({ key: dotKey, current: String(cur), expected: String(want), kind: 'change' });
            setNestedValue(clone, dotKey, want);
        }
    }

    if (spec.ensureArrays) {
        for (const [arrKey, mustHave] of Object.entries(spec.ensureArrays)) {
            const curArr = Array.isArray(obj[arrKey]) ? obj[arrKey] : [];
            const missingItems = mustHave.filter(x => !curArr.includes(x));
            if (missingItems.length > 0) {
                diffs.push({
                    key: arrKey,
                    current: `${curArr.length} items`,
                    expected: `+ ${missingItems.join(', ')}`,
                    kind: 'change'
                });
                clone[arrKey] = [...new Set([...curArr, ...missingItems])].sort();
            }
        }
    }

    for (const bannedKey of (spec.banned || [])) {
        if (getNestedValue(obj, bannedKey) !== undefined) {
            diffs.push({ key: bannedKey, current: String(getNestedValue(obj, bannedKey)), expected: '(remove)', kind: 'banned' });
            deleteNestedValue(clone, bannedKey);
        }
    }

    const newContent = diffs.length ? JSON.stringify(clone, null, 2) + '\n' : content;
    return { parseError: null, diffs, warnings, newContent };
}

function analyzeKVLines(spec, content, sep) {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const re = sep === ':' ? /^(\s*)([\w.\-]+)(\s*[:=]\s*)([^#\n]*)(.*)$/ : /^(\s*)([\w.\-]+)(\s*=\s*)([^#\n]*)(.*)$/;
    const found = Object.create(null);
    const diffs = [];
    const warnings = [];
    const outLines = [];
    const expectedMap = spec.expected || {};
    const bannedSet = new Set(spec.banned || []);
    const handledKeys = new Set();

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            outLines.push(line);
            continue;
        }
        const m = line.match(re);
        if (!m) {
            outLines.push(line);
            continue;
        }
        const [, indent, key, mid, rawVal, trail] = m;
        const val = rawVal.trim();
        found[key] = val;

        if (bannedSet.has(key)) {
            if (sep === ':' || val === 'true' || spec.id === 'ferrite') {
                diffs.push({ key, current: val, expected: '(remove / comment)', kind: 'banned' });
                outLines.push(`# [optimizer: removed incompatible/obsolete option] ${line}`);
                continue;
            }
        }
        if (key in expectedMap) {
            handledKeys.add(key);
            const want = String(expectedMap[key]);
            if (val !== want) {
                diffs.push({ key, current: val, expected: want, kind: 'change' });
                const glue = sep === ':' ? ': ' : (mid.includes(' ') ? ' = ' : '=');
                outLines.push(`${indent}${key}${glue}${want}${trail}`);
                continue;
            }
        }
        outLines.push(line);
    }

    const missingLines = [];
    for (const [key, want] of Object.entries(expectedMap)) {
        if (!handledKeys.has(key)) {
            diffs.push({ key, current: null, expected: String(want), kind: 'missing' });
            missingLines.push(sep === ':' ? `${key}: ${want}` : `${key}=${want}`);
        }
    }
    if (missingLines.length) {
        while (outLines.length && outLines[outLines.length - 1].trim() === '') outLines.pop();
        outLines.push(...missingLines);
    }

    const newContent = diffs.length ? outLines.join('\n') + '\n' : content;
    return { parseError: null, diffs, warnings, newContent };
}

function analyzePropertiesAudit(spec, content) {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const is121 = state.mcVersion.startsWith('1.21');
    const removedSet = new Set(is121 ? (spec.removedIn121 || []) : []);
    const diffs = [];
    const warnings = [];
    const outLines = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            outLines.push(line);
            continue;
        }
        const m = line.match(/^(\s*)([\w.\-]+)\s*=\s*(\S+)(.*)$/);
        if (!m) {
            outLines.push(line);
            continue;
        }
        const [, , key, val] = m;
        if (removedSet.has(key)) {
            diffs.push({ key, current: val, expected: '(comment: removed in 1.21)', kind: 'banned' });
            outLines.push(`# [optimizer: removed in Lithium 1.21+] ${line}`);
        } else if (key.startsWith('mixin.') && val === 'true') {
            diffs.push({ key, current: 'true', expected: '(comment: keep safe default)', kind: 'banned' });
            outLines.push(`# [optimizer: avoid forcing =true; preserves mod-compat disables] ${line}`);
        } else {
            outLines.push(line);
        }
    }

    const newContent = diffs.length ? outLines.join('\n') + '\n' : content;
    return { parseError: null, diffs, warnings, newContent };
}

function analyzeTomlFile(spec, content) {
    const lines = content.replace(/\r\n/g, '\n').split('\n');
    const expectedSections = spec.expected || {};
    const bannedSet = new Set(spec.banned || []);
    const diffs = [];
    const warnings = [];
    const seen = Object.create(null); // "sec.key" or "key" -> true
    const outLines = [];
    let curSec = '';

    const fullKeyOf = (sec, k) => (sec ? `${sec}.${k}` : k);

    // Track line indices of section headers to insert missing keys inside existing sections
    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            outLines.push(line);
            continue;
        }
        const secMatch = trimmed.match(/^\[([\w.\-"]+)\]\s*(?:#.*)?$/);
        if (secMatch) {
            curSec = secMatch[1].replace(/^"|"$/g, '');
            outLines.push(line);
            continue;
        }
        const kvMatch = line.match(/^(\s*)([\w.\-"]+)(\s*=\s*)([^#\n]*)(.*)$/);
        if (!kvMatch) {
            outLines.push(line);
            continue;
        }
        const [, indent, rawKey, eq, rawVal, trail] = kvMatch;
        const key = rawKey.replace(/^"|"$/g, '');
        const val = rawVal.trim();
        const fk = fullKeyOf(curSec, key);

        if (bannedSet.has(fk) || bannedSet.has(key)) {
            diffs.push({ key: fk, current: val, expected: '(comment: obsolete/wrong version)', kind: 'banned' });
            outLines.push(`# [optimizer: obsolete or incompatible with MC ${state.mcVersion}] ${line}`);
            continue;
        }

        const secExp = expectedSections[curSec];
        if (secExp && key in secExp) {
            seen[fk] = true;
            const want = String(secExp[key]);
            if (val !== want) {
                diffs.push({ key: fk, current: val, expected: want, kind: 'change' });
                outLines.push(`${indent}${rawKey}${eq}${want}${trail}`);
                continue;
            }
        }
        outLines.push(line);
    }

    // Insert missing expected keys into their matching section (or append section)
    const missingBySec = Object.create(null);
    for (const [sec, kvMap] of Object.entries(expectedSections)) {
        for (const [key, want] of Object.entries(kvMap)) {
            const fk = fullKeyOf(sec, key);
            if (!seen[fk]) {
                diffs.push({ key: fk, current: null, expected: String(want), kind: 'missing' });
                if (!missingBySec[sec]) missingBySec[sec] = [];
                missingBySec[sec].push({ key, want: String(want) });
            }
        }
    }

    let finalLines = [...outLines];
    for (const [sec, items] of Object.entries(missingBySec)) {
        if (sec === '') {
            // Insert root keys before the first [section] header
            const firstSecIdx = finalLines.findIndex(l => /^\[[\w.\-"]+\]/.test(l.trim()));
            const insertLines = items.map(it => `${it.key} = ${it.want}`);
            if (firstSecIdx === -1) {
                while (finalLines.length && finalLines[finalLines.length - 1].trim() === '') finalLines.pop();
                finalLines.push(...insertLines);
            } else {
                finalLines.splice(firstSecIdx, 0, ...insertLines, '');
            }
        } else {
            const secIdx = finalLines.findIndex(l => l.trim().replace(/^\[|"|\]$/g, '') === sec && l.trim().startsWith('['));
            const insertLines = items.map(it => `  ${it.key} = ${it.want}`);
            if (secIdx !== -1) {
                let endIdx = secIdx + 1;
                while (endIdx < finalLines.length && !/^\[[\w.\-"]+\]/.test(finalLines[endIdx].trim())) endIdx++;
                while (endIdx > secIdx + 1 && finalLines[endIdx - 1].trim() === '') endIdx--;
                finalLines.splice(endIdx, 0, ...insertLines);
            } else {
                while (finalLines.length && finalLines[finalLines.length - 1].trim() === '') finalLines.pop();
                finalLines.push('', `[${sec}]`, ...insertLines);
            }
        }
    }

    const newContent = diffs.length ? finalLines.join('\n') + '\n' : content;
    return { parseError: null, diffs, warnings, newContent };
}

function analyzeConfigMap(rawFileMap) {
    const fileMap = normalizeScanPaths(rawFileMap);
    const filePaths = Object.keys(fileMap).sort();
    const specs = getModConfigSpecs();
    const results = [];

    for (const spec of specs) {
        const match = locateModFile(spec, filePaths);
        if (!match) {
            if (spec.optional) continue;
            results.push({
                id: spec.id,
                tab: spec.tab,
                name: spec.name,
                found: false,
                path: spec.primaryPaths[0],
                location: null,
                mismatch: false,
                status: 'missing',
                parseError: null,
                diffs: [],
                warnings: [],
                newContent: null
            });
            continue;
        }

        const content = fileMap[match.path];
        let effectiveFormat = spec.format;
        // Adapt FerriteCore parser if mismatched extension (.toml vs .properties) is found
        if (spec.id === 'ferrite') {
            effectiveFormat = match.path.toLowerCase().endsWith('.properties') ? 'properties' : 'toml';
        }

        let specToRun = spec;
        if (spec.id === 'ferrite') {
            const flat = spec.format === 'properties' ? spec.expected : spec.expected[''];
            specToRun = { ...spec, expected: effectiveFormat === 'properties' ? flat : { '': flat } };
        }

        let res;
        if (effectiveFormat === 'json') res = analyzeJsonFile(specToRun, content);
        else if (effectiveFormat === 'properties') res = analyzeKVLines(specToRun, content, '=');
        else if (effectiveFormat === 'colon') res = analyzeKVLines(specToRun, content, ':');
        else if (effectiveFormat === 'properties_audit') res = analyzePropertiesAudit(specToRun, content);
        else res = analyzeTomlFile(specToRun, content);

        const warnings = [...res.warnings];
        if (match.mismatch) {
            warnings.push(state.lang === 'pt'
                ? `Arquivo encontrado (${match.path}) pertence a outro loader/versão; esperado ${spec.primaryPaths[0]} para ${state.loader.toUpperCase()} ${state.mcVersion}.`
                : `Found file (${match.path}) belongs to a different loader/version; expected ${spec.primaryPaths[0]} for ${state.loader.toUpperCase()} ${state.mcVersion}.`);
        }

        let status = 'ok';
        if (res.parseError) status = 'error';
        else if (res.diffs.length > 0) status = 'needs_fix';
        else if (warnings.length > 0) status = 'warning';

        results.push({
            id: spec.id,
            tab: spec.tab,
            name: spec.name,
            found: true,
            path: match.path,
            location: match.location,
            mismatch: match.mismatch,
            status,
            parseError: res.parseError,
            diffs: res.diffs,
            warnings,
            newContent: res.newContent
        });
    }

    const summary = {
        totalFilesScanned: filePaths.length,
        foundCount: results.filter(r => r.found).length,
        okCount: results.filter(r => r.status === 'ok').length,
        fixCount: results.filter(r => r.status === 'needs_fix').length,
        warnCount: results.filter(r => r.status === 'warning' || r.status === 'error').length,
        missingCount: results.filter(r => !r.found).length
    };
    return { results, summary, normalizedFiles: fileMap };
}

async function readDirectoryRecursive(dirHandle, prefix, depth, fileMap, handleMap) {
    if (depth > 3) return;
    for await (const [name, handle] of dirHandle.entries()) {
        if (handle.kind === 'directory') {
            if (SCAN_SKIP_DIRS.has(name.toLowerCase())) continue;
            await readDirectoryRecursive(handle, prefix ? `${prefix}/${name}` : name, depth + 1, fileMap, handleMap);
        } else if (handle.kind === 'file' && SCAN_ALLOWED_EXT.test(name)) {
            const rel = prefix ? `${prefix}/${name}` : name;
            try {
                const file = await handle.getFile();
                if (file.size <= 512 * 1024) {
                    fileMap[rel] = await file.text();
                    handleMap[rel] = handle;
                }
            } catch (_) {
                // ignore unreadable files
            }
        }
    }
}

async function loadConfigDirectory() {
    if (typeof window.showDirectoryPicker === 'function') {
        try {
            let dirHandle;
            let writable = true;
            try {
                dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            } catch (e) {
                if (e && e.name === 'AbortError') return;
                dirHandle = await window.showDirectoryPicker({ mode: 'read' });
                writable = false;
            }
            const rawFiles = Object.create(null);
            const rawHandles = Object.create(null);
            await readDirectoryRecursive(dirHandle, '', 0, rawFiles, rawHandles);
            const normFiles = normalizeScanPaths(rawFiles);
            const normHandles = normalizeScanPaths(rawHandles);
            configScanState.loaded = true;
            configScanState.folderName = dirHandle.name || 'config';
            configScanState.writable = writable;
            configScanState.fileMap = normFiles;
            configScanState.handleMap = normHandles;
            refreshConfigScanReport();
            showToast(i18n[state.lang].toastScanLoaded);
            return;
        } catch (e) {
            if (e && e.name === 'AbortError') return;
            // Fall through to input[webkitdirectory]
        }
    }
    const input = document.getElementById('config-dir-input');
    if (input) {
        input.value = '';
        input.click();
    }
}

async function onConfigDirInputChange(inputEl) {
    const files = [...(inputEl.files || [])];
    if (!files.length) return;
    const rawFiles = Object.create(null);
    let rootName = 'config';
    for (const f of files) {
        const rel = (f.webkitRelativePath || f.name).replace(/\\/g, '/');
        if (rel.includes('/')) rootName = rel.split('/')[0];
        const parts = rel.split('/').map(s => s.toLowerCase());
        if (parts.some(p => SCAN_SKIP_DIRS.has(p))) continue;
        if (!SCAN_ALLOWED_EXT.test(f.name) || f.size > 512 * 1024) continue;
        try {
            rawFiles[rel] = await f.text();
        } catch (_) {
            // ignore unreadable
        }
    }
    configScanState.loaded = true;
    configScanState.folderName = rootName;
    configScanState.writable = false;
    configScanState.fileMap = normalizeScanPaths(rawFiles);
    configScanState.handleMap = Object.create(null);
    refreshConfigScanReport();
    showToast(i18n[state.lang].toastScanLoaded);
}

function clearConfigScan() {
    configScanState.loaded = false;
    configScanState.folderName = '';
    configScanState.writable = false;
    configScanState.fileMap = Object.create(null);
    configScanState.handleMap = Object.create(null);
    configScanState.lastReport = null;
    const wrap = document.getElementById('config-scan-results');
    if (wrap) {
        wrap.innerHTML = '';
        wrap.classList.add('hidden');
    }
    const actions = document.getElementById('config-scan-actions');
    if (actions) actions.classList.add('hidden');
}

function downloadAdjustedFile(relPath, content) {
    const fileName = relPath.split('/').pop();
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast(i18n[state.lang].toastCfgDownloaded);
}

async function applyConfigAdjustment(specId) {
    if (!configScanState.lastReport) return;
    const item = configScanState.lastReport.results.find(r => r.id === specId);
    if (!item || !item.found || !item.diffs.length || item.parseError) return;

    const handle = configScanState.handleMap[item.path];
    if (configScanState.writable && handle && typeof handle.createWritable === 'function') {
        const writable = await handle.createWritable();
        await writable.write(item.newContent);
        await writable.close();
        configScanState.fileMap[item.path] = item.newContent;
        refreshConfigScanReport();
        showToast(i18n[state.lang].toastCfgApplied);
    } else {
        downloadAdjustedFile(item.path, item.newContent);
        configScanState.fileMap[item.path] = item.newContent;
        refreshConfigScanReport();
    }
}

async function applyAllConfigAdjustments() {
    if (!configScanState.lastReport) return;
    const pending = configScanState.lastReport.results.filter(r => r.found && r.diffs.length > 0 && !r.parseError);
    if (!pending.length) return;

    let wroteDirectly = false;
    for (const item of pending) {
        const handle = configScanState.handleMap[item.path];
        if (configScanState.writable && handle && typeof handle.createWritable === 'function') {
            const writable = await handle.createWritable();
            await writable.write(item.newContent);
            await writable.close();
            configScanState.fileMap[item.path] = item.newContent;
            wroteDirectly = true;
        } else {
            downloadAdjustedFile(item.path, item.newContent);
            configScanState.fileMap[item.path] = item.newContent;
        }
    }
    refreshConfigScanReport();
    showToast(wroteDirectly ? i18n[state.lang].toastCfgApplied : i18n[state.lang].toastCfgDownloaded);
}

function refreshConfigScanReport() {
    const wrap = document.getElementById('config-scan-results');
    const actions = document.getElementById('config-scan-actions');
    const applyAllBtn = document.getElementById('btn-apply-all-cfg');
    if (!wrap) return;
    if (!configScanState.loaded) {
        wrap.classList.add('hidden');
        if (actions) actions.classList.add('hidden');
        return;
    }

    const pt = state.lang === 'pt';
    const report = analyzeConfigMap(configScanState.fileMap);
    configScanState.lastReport = report;
    const s = report.summary;

    wrap.classList.remove('hidden');
    if (actions) actions.classList.remove('hidden');
    if (applyAllBtn) {
        applyAllBtn.disabled = s.fixCount === 0;
        applyAllBtn.classList.toggle('opacity-40', s.fixCount === 0);
        applyAllBtn.classList.toggle('cursor-not-allowed', s.fixCount === 0);
        const lbl = document.getElementById('i18n-btn-apply-all-cfg');
        if (lbl) {
            lbl.textContent = configScanState.writable
                ? (pt ? `Aplicar ${s.fixCount} ajuste(s)` : `Apply ${s.fixCount} adjustment(s)`)
                : (pt ? `Baixar ${s.fixCount} arquivo(s)` : `Download ${s.fixCount} file(s)`);
        }
    }

    const modeBadge = configScanState.writable
        ? (pt ? 'Gravação direta ativa' : 'Direct write enabled')
        : (pt ? 'Modo leitura (download)' : 'Read-only (download)');

    const rowsHtml = report.results.map(item => {
        let statusPill = '';
        if (!item.found) {
            statusPill = `<span class="text-[11px] px-2 py-0.5 rounded-md bg-zinc-900 text-zinc-500 border border-zinc-800">${pt ? 'Não encontrado' : 'Not found'}</span>`;
        } else if (item.status === 'ok') {
            statusPill = `<span class="text-[11px] px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">${pt ? 'Otimizado' : 'Optimal'}</span>`;
        } else if (item.status === 'needs_fix') {
            statusPill = `<span class="text-[11px] px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/25">${item.diffs.length} ${pt ? (item.diffs.length === 1 ? 'ajuste' : 'ajustes') : (item.diffs.length === 1 ? 'change' : 'changes')}</span>`;
        } else {
            statusPill = `<span class="text-[11px] px-2 py-0.5 rounded-md bg-red-500/10 text-red-300 border border-red-500/25">${pt ? 'Aviso / Erro' : 'Warning / Error'}</span>`;
        }

        const locTag = item.found
            ? `<span class="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">${item.location === 'subfolder' ? (pt ? 'subpasta' : 'subfolder') : '/config'}</span>`
            : '';

        const actionBtn = item.found && item.diffs.length > 0 && !item.parseError
            ? `<button onclick="applyConfigAdjustment('${item.id}')" class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition shrink-0">${configScanState.writable ? (pt ? 'Aplicar' : 'Apply') : (pt ? 'Baixar' : 'Download')}</button>`
            : `<button onclick="selectConfigTab('${item.tab}')" class="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition shrink-0">${pt ? 'Ver aba' : 'View tab'}</button>`;

        const diffsHtml = item.diffs.length
            ? `<ul class="mt-2.5 pt-2.5 border-t border-zinc-800/70 space-y-1 font-mono text-[11px] max-h-56 overflow-y-auto code-scroll pr-1">` +
              item.diffs.map(d => {
                  const curTxt = d.current === null ? `<span class="text-zinc-500">${pt ? 'ausente' : 'missing'}</span>` : `<span class="text-red-300/90">${escapeHtmlScan(d.current)}</span>`;
                  const expTxt = `<span class="text-emerald-400">${escapeHtmlScan(d.expected)}</span>`;
                  return `<li class="flex flex-wrap items-center gap-1.5 text-zinc-300"><span class="text-zinc-400">${escapeHtmlScan(d.key)}</span>: ${curTxt} <span class="text-zinc-600">→</span> ${expTxt}</li>`;
              }).join('') + `</ul>`
            : '';

        const warnHtml = (item.parseError ? [`JSON/Parse: ${item.parseError}`] : []).concat(item.warnings).map(w =>
            `<p class="mt-2 text-[11px] text-amber-300/90">${escapeHtmlScan(w)}</p>`
        ).join('');

        return `
            <div class="rounded-xl border ${item.found ? 'border-zinc-800 bg-zinc-950/70' : 'border-zinc-800/50 bg-zinc-950/30 opacity-75'} p-3.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                    <div class="min-w-0">
                        <div class="flex flex-wrap items-center gap-2">
                            <span class="text-xs font-semibold text-zinc-100">${escapeHtmlScan(item.name)}</span>
                            ${statusPill}
                            ${locTag}
                        </div>
                        <div class="text-[11px] font-mono text-zinc-500 mt-0.5 break-all">${escapeHtmlScan('config/' + item.path)}</div>
                    </div>
                    ${actionBtn}
                </div>
                ${warnHtml}
                ${diffsHtml}
            </div>
        `;
    }).join('');

    wrap.innerHTML = `
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-800/80 text-xs">
            <div class="flex flex-wrap items-center gap-2">
                <span class="font-mono text-zinc-200">${escapeHtmlScan(configScanState.folderName)}/</span>
                <span class="text-zinc-500">•</span>
                <span class="text-zinc-400">${s.foundCount} ${pt ? 'detectados' : 'found'}</span>
                <span class="text-zinc-600">•</span>
                <span class="text-amber-300">${s.fixCount} ${pt ? 'com ajustes' : 'to adjust'}</span>
                <span class="text-zinc-600">•</span>
                <span class="text-emerald-400">${s.okCount} OK</span>
                <span class="text-zinc-600">•</span>
                <span class="text-zinc-500">${s.missingCount} ${pt ? 'ausentes' : 'not found'}</span>
            </div>
            <span class="text-[11px] font-mono px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400">${modeBadge} • ${state.loader.toUpperCase()} ${state.mcVersion}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-3 items-start">
            ${rowsHtml}
        </div>
    `;
}
