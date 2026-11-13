// Application state (single source of truth for the selected setup).
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

// Estado Atual da Aplicação
let state = {
    lang: 'pt',
    cpuKey: 'r5_5500',
    gpuKey: 'rtx_3050_6_desk',
    ddrType: 'DDR4',
    ramFreq: 2666,
    sysRamGB: 32,
    storageKey: 'nvme',
    memChannels: 2,
    mcVersion: '1.20.1',
    loader: 'forge',
    jvmEngine: 'graal_zgc',
    jvmEngineManual: false,
    javaVersion: '21',
    os: 'windows',
    launcher: 'prism',
    modpackProfile: 'heavy',
    preferredProfile: 'heavy',
    restoring: false,
    allocRamGB: 12,
    softMaxGB: 10,
    metaMB: 512,
    codeCacheMB: 512,
    activeModCat: 'all',
    activeConfigTab: 'modernfix'
};
