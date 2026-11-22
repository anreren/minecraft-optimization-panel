// Static data: DDR frequencies, storage profiles, launchers and tier scores.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

const ddrFrequencies = {
    DDR3: [1066, 1333, 1600, 1866, 2133, 2400],
    DDR4: [2133, 2400, 2666, 2933, 3000, 3200, 3600, 4000, 4400],
    DDR5: [4800, 5200, 5600, 6000, 6400, 6800, 7200, 7600, 8000]
};

const storageDatabase = {
    nvme: {
        name: { pt: "SSD NVMe M.2 PCIe", en: "NVMe M.2 PCIe SSD" },
        dynResRecommended: true,
        ioDesc: { pt: "I/O Ultra Rápido • Dynamic Resources: Ideal", en: "Ultra-Fast I/O • Dynamic Resources: Ideal" }
    },
    sata: {
        name: { pt: "SSD SATA III", en: "SATA III SSD" },
        dynResRecommended: true,
        ioDesc: { pt: "I/O Sólido (~550MB/s) • Dynamic Resources: Ativo", en: "Solid I/O (~550MB/s) • Dynamic Resources: Active" }
    },
    hdd: {
        name: { pt: "HD Mecânico (HDD)", en: "Mechanical Hard Drive (HDD)" },
        dynResRecommended: false,
        ioDesc: { pt: "Alta Latência de Busca • Pré-carregar Texturas na RAM", en: "High Seek Latency • Preload Textures in RAM" }
    }
};

// ---- Versão do Java, sistema operacional e launcher ----
const LAUNCHERS = {
    prism: { separateMemory: true, hasMinRam: true },
    curseforge: { separateMemory: true, hasMinRam: false },
    modrinth: { separateMemory: true, hasMinRam: false },
    atlauncher: { separateMemory: true, hasMinRam: true },
    vanilla: { separateMemory: false, hasMinRam: false },
    other: { separateMemory: null, hasMinRam: null }
};

const ST_TIER_SCORE = { low: 0, mid: 1, high: 2, top: 3 };

const GPU_TIER_SCORE = { low: 0, entry: 1, mid: 2, high: 3, ultra: 4 };
