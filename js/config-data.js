// Static data: DDR frequencies, storage profiles, launchers, tier scores and the setup checklist.
// Classic script: loaded by index.html in order, shares the global scope with the other js/ files.

const ddrFrequencies = {
    DDR3: [1066, 1333, 1600, 1866, 2133, 2400],
    DDR4: [2133, 2400, 2666, 2933, 3000, 3200, 3600, 4000, 4400],
    DDR5: [4800, 5200, 5600, 6000, 6400, 6800, 7200, 7600, 8000]
};

const storageDatabase = {
    nvme: {
        name: { pt: "SSD NVMe M.2 PCIe", en: "NVMe M.2 PCIe SSD" },
        spikeTol: "5.0",
        dynResRecommended: true,
        ioDesc: { pt: "I/O Ultra Rápido • Dynamic Resources: Ideal", en: "Ultra-Fast I/O • Dynamic Resources: Ideal" }
    },
    sata: {
        name: { pt: "SSD SATA III", en: "SATA III SSD" },
        spikeTol: "3.5",
        dynResRecommended: true,
        ioDesc: { pt: "I/O Sólido (~550MB/s) • Dynamic Resources: Ativo", en: "Solid I/O (~550MB/s) • Dynamic Resources: Active" }
    },
    hdd: {
        name: { pt: "HD Mecânico (HDD)", en: "Mechanical Hard Drive (HDD)" },
        spikeTol: "2.0",
        dynResRecommended: false,
        ioDesc: { pt: "Alta Latência de Busca • Pré-carregar Texturas na RAM", en: "High Seek Latency • Preload Textures in RAM" }
    }
};

// ---- Versão do Java, sistema operacional e launcher ----
const LAUNCHERS = {
    prism: { separateMemory: true },
    curseforge: { separateMemory: true },
    modrinth: { separateMemory: true },
    atlauncher: { separateMemory: true },
    vanilla: { separateMemory: false },
    other: { separateMemory: null }
};

const ST_TIER_SCORE = { low: 0, mid: 1, high: 2, top: 3 };

const GPU_TIER_SCORE = { low: 0, entry: 1, mid: 2, high: 3, ultra: 4 };

// ============================================================================
// UTILITÁRIOS (COPIAR, TOAST E CHECKLIST BILÍNGUE)
// ============================================================================
const checklistItems = [
    {
        id: "gchk-1",
        pt: "Baixar o Java da engine escolhida (Oracle GraalVM ou Temurin, na versão selecionada) e apontar o Launcher para o executável dele (javaw.exe no Windows, bin/java no Linux/macOS)",
        en: "Download the Java of the chosen engine (Oracle GraalVM or Temurin, in the selected version) and point your Launcher to its executable (javaw.exe on Windows, bin/java on Linux/macOS)"
    },
    {
        id: "gchk-2",
        pt: "Marcar 'Ignorar verificação de compatibilidade do Java' (no Prism Launcher)",
        en: "Enable 'Skip Java compatibility checks' (in Prism Launcher)"
    },
    {
        id: "gchk-3",
        pt: "Definir a memória RAM Mínima e Máxima iguais no Launcher conforme calculado acima (ou usar a linha com -Xms/-Xmx se o Launcher não tiver campo de memória)",
        en: "Set Minimum and Maximum RAM to the exact same value in Launcher as calculated above (or use the line with -Xms/-Xmx if the Launcher has no memory field)"
    },
    {
        id: "gchk-4",
        pt: "Copiar e colar a linha de Argumentos JVM gerada (conforme a engine escolhida)",
        en: "Copy and paste the generated JVM Arguments (for the chosen engine)"
    },
    {
        id: "gchk-5",
        pt: "Conferir se os mods chave do Loader escolhido (Embeddium/Sodium, ModernFix, FerriteCore, Radium/Lithium) estão instalados",
        en: "Verify that core optimization mods for your Loader (Embeddium/Sodium, ModernFix, FerriteCore, Radium/Lithium) are installed"
    },
    {
        id: "gchk-6",
        pt: "Aplicar as configurações geradas na Seção 4 nos arquivos da pasta /config",
        en: "Apply the generated configurations from Section 4 into your /config folder files"
    },
    {
        id: "gchk-7",
        pt: "Ajustar a Distância de Renderização e de Simulação conforme as recomendações do painel de diagnóstico",
        en: "Set Render and Simulation Distance according to the recommendations in the diagnostics panel"
    },
    {
        id: "gchk-8",
        pt: "Aplicar a otimização do Driver da placa de vídeo (aba 9 da Seção 4) para o Java",
        en: "Apply the GPU Driver optimization profile (Tab 9 of Section 4) for Java"
    }
];
