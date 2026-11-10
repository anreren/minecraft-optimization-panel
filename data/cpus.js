// ============================================================================
// CPU DATABASE
// Loaded before the main script (see index.html).
// To add a CPU: add an entry here and a matching <option> in #select-cpu.
//
// Fields
//   name          Display name
//   cores/threads Physical cores / logical threads
//   arch          Microarchitecture label
//   avx           Highest AVX level (1, 2 or 3 = AVX-512). Informational only:
//                 the JVM detects it by itself, so no flag is generated.
//   l3            L3 cache size label
//   concGC/parGC  -XX:ConcGCThreads / -XX:ParallelGCThreads
//   chunkThreads  Sodium/Embeddium chunk builder threads
//   fmlThreads    Forge/NeoForge fml.toml maxThreads
//   igpu          Key of the integrated GPU in gpus.js (null = no iGPU)
//   st            Single-thread tier: "low" | "mid" | "high" | "top"
//   mobile        true for laptop / low-power chips (optional)
// ============================================================================

const cpuDatabase = {
    // --- AMD Ryzen 5000 / 4000 / 3000 (AM4) ---
    r5_5500: { name: "AMD Ryzen 5 5500", cores: 6, threads: 12, arch: "Zen 3", avx: 2, l3: "16MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: null, st: "high" },
    r5_5600: { name: "AMD Ryzen 5 5600 / 5600X", cores: 6, threads: 12, arch: "Zen 3", avx: 2, l3: "32MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: null, st: "high" },
    r7_5700x: { name: "AMD Ryzen 7 5700X / 5800X", cores: 8, threads: 16, arch: "Zen 3", avx: 2, l3: "32MB", concGC: 4, parGC: 10, chunkThreads: 6, fmlThreads: 14, igpu: null, st: "high" },
    r7_5700x3d: { name: "AMD Ryzen 7 5700X3D / 5800X3D", cores: 8, threads: 16, arch: "Zen 3 V-Cache", avx: 2, l3: "96MB", concGC: 4, parGC: 10, chunkThreads: 6, fmlThreads: 14, igpu: null, st: "high" },
    r9_5900x: { name: "AMD Ryzen 9 5900X / 5950X", cores: 12, threads: 24, arch: "Zen 3", avx: 2, l3: "64MB", concGC: 6, parGC: 14, chunkThreads: 8, fmlThreads: 20, igpu: null, st: "high" },
    r5_3600: { name: "AMD Ryzen 5 3600 / 4500", cores: 6, threads: 12, arch: "Zen 2", avx: 2, l3: "32MB/8MB", concGC: 3, parGC: 8, chunkThreads: 3, fmlThreads: 10, igpu: null, st: "mid" },

    // --- AMD Ryzen 7000 / 9000 (AM5 - AVX-512) ---
    r5_7500f: { name: "AMD Ryzen 5 7500F", cores: 6, threads: 12, arch: "Zen 4", avx: 3, l3: "32MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: null, st: "top" },
    r5_7600: { name: "AMD Ryzen 5 7600 / 7600X / 9600X", cores: 6, threads: 12, arch: "Zen 4/5", avx: 3, l3: "32MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: "igpu_rdna2_2cu", st: "top" },
    r7_7800x3d: { name: "AMD Ryzen 7 7800X3D / 9800X3D", cores: 8, threads: 16, arch: "Zen 4/5 V-Cache", avx: 3, l3: "96MB", concGC: 4, parGC: 10, chunkThreads: 6, fmlThreads: 14, igpu: "igpu_rdna2_2cu", st: "top" },
    r9_7950x: { name: "AMD Ryzen 9 7950X / 9950X", cores: 16, threads: 32, arch: "Zen 4/5", avx: 3, l3: "64MB", concGC: 6, parGC: 16, chunkThreads: 8, fmlThreads: 24, igpu: "igpu_rdna2_2cu", st: "top" },

    // --- AMD APU / Athlon - Vídeo Integrado (AM4 / AM5) ---
    athlon_3000g: { name: "AMD Athlon 3000G / 200GE / 300GE", cores: 2, threads: 4, arch: "Zen / Zen+", avx: 2, l3: "4MB", concGC: 1, parGC: 3, chunkThreads: 1, fmlThreads: 3, igpu: "igpu_vega3", st: "low" },
    r3_3200g: { name: "AMD Ryzen 3 3200G / 2200G", cores: 4, threads: 4, arch: "Zen+", avx: 2, l3: "4MB", concGC: 1, parGC: 3, chunkThreads: 2, fmlThreads: 3, igpu: "igpu_vega8", st: "mid" },
    r5_3400g: { name: "AMD Ryzen 5 3400G / 2400G", cores: 4, threads: 8, arch: "Zen / Zen+", avx: 2, l3: "4MB", concGC: 2, parGC: 6, chunkThreads: 2, fmlThreads: 6, igpu: "igpu_vega11", st: "mid" },
    r5_5600g: { name: "AMD Ryzen 5 5600G / 4600G", cores: 6, threads: 12, arch: "Zen 3/2 APU", avx: 2, l3: "16MB", concGC: 3, parGC: 8, chunkThreads: 3, fmlThreads: 10, igpu: "igpu_vega7", st: "high" },
    r5_5600gt: { name: "AMD Ryzen 5 5600GT / 5500GT", cores: 6, threads: 12, arch: "Zen 3 APU", avx: 2, l3: "16MB", concGC: 3, parGC: 8, chunkThreads: 3, fmlThreads: 10, igpu: "igpu_vega7", st: "high" },
    r7_5700g: { name: "AMD Ryzen 7 5700G / 4700G", cores: 8, threads: 16, arch: "Zen 3/2 APU", avx: 2, l3: "16MB", concGC: 4, parGC: 10, chunkThreads: 5, fmlThreads: 14, igpu: "igpu_vega8", st: "high" },
    r5_8500g: { name: "AMD Ryzen 5 8500G", cores: 6, threads: 12, arch: "Zen 4 / 4c APU", avx: 3, l3: "16MB", concGC: 3, parGC: 8, chunkThreads: 3, fmlThreads: 10, igpu: "igpu_740m", st: "high" },
    r5_8600g: { name: "AMD Ryzen 5 8600G", cores: 6, threads: 12, arch: "Zen 4 APU", avx: 3, l3: "16MB", concGC: 3, parGC: 8, chunkThreads: 3, fmlThreads: 10, igpu: "igpu_760m", st: "top" },
    r7_8700g: { name: "AMD Ryzen 7 8700G", cores: 8, threads: 16, arch: "Zen 4 APU", avx: 3, l3: "16MB", concGC: 4, parGC: 10, chunkThreads: 5, fmlThreads: 14, igpu: "igpu_780m", st: "top" },

    // --- AMD Ryzen Mobile (Notebooks - Vídeo Integrado) ---
    r5_5500u: { name: "AMD Ryzen 5 5500U / 5600U", cores: 6, threads: 12, arch: "Zen 2/3 Mobile", avx: 2, l3: "8MB/16MB", concGC: 3, parGC: 8, chunkThreads: 3, fmlThreads: 10, igpu: "igpu_vega7", st: "mid", mobile: true },
    r7_5700u: { name: "AMD Ryzen 7 5700U / 5800U", cores: 8, threads: 16, arch: "Zen 2/3 Mobile", avx: 2, l3: "8MB/16MB", concGC: 4, parGC: 10, chunkThreads: 5, fmlThreads: 14, igpu: "igpu_vega8", st: "mid", mobile: true },
    r7_6800h: { name: "AMD Ryzen 7 6800H / 7735HS", cores: 8, threads: 16, arch: "Zen 3+ Mobile", avx: 2, l3: "16MB", concGC: 4, parGC: 10, chunkThreads: 5, fmlThreads: 14, igpu: "igpu_680m", st: "high", mobile: true },
    r7_7840hs: { name: "AMD Ryzen 7 7840HS / 8845HS", cores: 8, threads: 16, arch: "Zen 4 Mobile", avx: 3, l3: "16MB", concGC: 4, parGC: 10, chunkThreads: 5, fmlThreads: 14, igpu: "igpu_780m", st: "high", mobile: true },
    r5_5600h: { name: "AMD Ryzen 5 5600H / 5600HS", cores: 6, threads: 12, arch: "Zen 3 Mobile", avx: 2, l3: "16MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: "igpu_vega7", st: "high", mobile: true },
    r5_7535hs: { name: "AMD Ryzen 5 6600H / 7535HS", cores: 6, threads: 12, arch: "Zen 3+ Mobile", avx: 2, l3: "16MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: "igpu_660m", st: "mid", mobile: true },

    // --- Intel Core Ultra 200S (LGA1851) ---
    ultra_5_245k: { name: "Intel Core Ultra 5 245K", cores: 14, threads: 14, arch: "Arrow Lake", avx: 2, l3: "24MB", concGC: 3, parGC: 8, chunkThreads: 3, fmlThreads: 12, igpu: "igpu_arc4xe", st: "top" },
    ultra_7_265k: { name: "Intel Core Ultra 7 265K", cores: 20, threads: 20, arch: "Arrow Lake", avx: 2, l3: "30MB", concGC: 4, parGC: 12, chunkThreads: 5, fmlThreads: 16, igpu: "igpu_arc4xe", st: "top" },
    ultra_9_285k: { name: "Intel Core Ultra 9 285K", cores: 24, threads: 24, arch: "Arrow Lake", avx: 2, l3: "36MB", concGC: 5, parGC: 14, chunkThreads: 7, fmlThreads: 20, igpu: "igpu_arc4xe", st: "top" },

    // --- Intel Core 12th - 14th Gen (LGA1700) ---
    i3_12100f: { name: "Intel Core i3-12100F / 13100F / 14100F", cores: 4, threads: 8, arch: "Alder/Raptor Lake", avx: 2, l3: "12MB", concGC: 2, parGC: 6, chunkThreads: 3, fmlThreads: 6, igpu: null, st: "high" },
    i3_12100: { name: "Intel Core i3-12100 / 13100 / 14100", cores: 4, threads: 8, arch: "Alder/Raptor Lake", avx: 2, l3: "12MB", concGC: 2, parGC: 6, chunkThreads: 3, fmlThreads: 6, igpu: "igpu_uhd730", st: "high" },
    i5_12400f: { name: "Intel Core i5-12400F / 13400F", cores: 6, threads: 12, arch: "Alder/Raptor Lake", avx: 2, l3: "18MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: null, st: "high" },
    i5_12400: { name: "Intel Core i5-12400", cores: 6, threads: 12, arch: "Alder Lake", avx: 2, l3: "18MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: "igpu_uhd730", st: "high" },
    i5_13400: { name: "Intel Core i5-13400 / 14400", cores: 10, threads: 16, arch: "Raptor Lake Hybrid", avx: 2, l3: "20MB", concGC: 4, parGC: 10, chunkThreads: 6, fmlThreads: 14, igpu: "igpu_uhd730", st: "high" },
    i5_13600k: { name: "Intel Core i5-13600K / 14600K", cores: 14, threads: 20, arch: "Raptor Lake Hybrid", avx: 2, l3: "24MB", concGC: 4, parGC: 12, chunkThreads: 6, fmlThreads: 16, igpu: "igpu_uhd770", st: "top" },
    i7_13700k: { name: "Intel Core i7-13700K / 14700K", cores: 16, threads: 24, arch: "Raptor Lake Hybrid", avx: 2, l3: "30MB", concGC: 5, parGC: 14, chunkThreads: 6, fmlThreads: 18, igpu: "igpu_uhd770", st: "top" },
    i9_14900k: { name: "Intel Core i9-13900K / 14900K", cores: 24, threads: 32, arch: "Raptor Lake Hybrid", avx: 2, l3: "36MB", concGC: 6, parGC: 16, chunkThreads: 8, fmlThreads: 24, igpu: "igpu_uhd770", st: "top" },

    // --- Intel Core 8th - 11th Gen & Pentium (LGA1151 / LGA1200) ---
    pentium_g6400: { name: "Intel Pentium Gold G6400 / G5400", cores: 2, threads: 4, arch: "Comet/Coffee Lake", avx: 2, l3: "4MB", concGC: 1, parGC: 3, chunkThreads: 2, fmlThreads: 3, igpu: "igpu_uhd610", st: "mid" },
    i3_8100: { name: "Intel Core i3-8100 / i3-9100", cores: 4, threads: 4, arch: "Coffee Lake", avx: 2, l3: "6MB", concGC: 1, parGC: 3, chunkThreads: 2, fmlThreads: 3, igpu: "igpu_uhd630", st: "mid" },
    i3_10100: { name: "Intel Core i3-10100", cores: 4, threads: 8, arch: "Comet Lake", avx: 2, l3: "6MB", concGC: 2, parGC: 6, chunkThreads: 3, fmlThreads: 6, igpu: "igpu_uhd630", st: "mid" },
    i5_8400: { name: "Intel Core i5-8400 / i5-9400 / i5-9500", cores: 6, threads: 6, arch: "Coffee Lake", avx: 2, l3: "9MB", concGC: 2, parGC: 4, chunkThreads: 2, fmlThreads: 5, igpu: "igpu_uhd630", st: "mid" },
    i5_9400f: { name: "Intel Core i5-9400F", cores: 6, threads: 6, arch: "Coffee Lake", avx: 2, l3: "9MB", concGC: 2, parGC: 4, chunkThreads: 2, fmlThreads: 5, igpu: null, st: "mid" },
    i5_10400: { name: "Intel Core i5-10400 / 10600", cores: 6, threads: 12, arch: "Comet Lake", avx: 2, l3: "12MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: "igpu_uhd630", st: "mid" },
    i5_10400f: { name: "Intel Core i5-10400F / 11400F", cores: 6, threads: 12, arch: "Comet/Rocket Lake", avx: 2, l3: "12MB", concGC: 3, parGC: 8, chunkThreads: 3, fmlThreads: 10, igpu: null, st: "mid" },
    i5_11400: { name: "Intel Core i5-11400 / 11600", cores: 6, threads: 12, arch: "Rocket Lake", avx: 3, l3: "12MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: "igpu_uhd730", st: "high" },

    // --- Intel Core Legacy 2nd - 4th Gen (DDR3) ---
    i7_2600: { name: "Intel Core i7-2600 / 2600K", cores: 4, threads: 8, arch: "Sandy Bridge", avx: 1, l3: "8MB", concGC: 2, parGC: 6, chunkThreads: 3, fmlThreads: 6, igpu: "igpu_hd3000", st: "low" },
    i5_2500: { name: "Intel Core i5-2500 / 2500K", cores: 4, threads: 4, arch: "Sandy Bridge", avx: 1, l3: "6MB", concGC: 1, parGC: 3, chunkThreads: 2, fmlThreads: 3, igpu: "igpu_hd3000", st: "low" },
    i7_3770: { name: "Intel Core i7-3770 / 3770K", cores: 4, threads: 8, arch: "Ivy Bridge", avx: 1, l3: "8MB", concGC: 2, parGC: 6, chunkThreads: 3, fmlThreads: 6, igpu: "igpu_hd4000", st: "low" },
    i5_4460: { name: "Intel Core i5-4460 / 4570 / 4590", cores: 4, threads: 4, arch: "Haswell", avx: 2, l3: "6MB", concGC: 1, parGC: 3, chunkThreads: 2, fmlThreads: 3, igpu: "igpu_hd4600", st: "low" },
    i7_4790k: { name: "Intel Core i7-4790K / 4770K / 4790", cores: 4, threads: 8, arch: "Haswell", avx: 2, l3: "8MB", concGC: 2, parGC: 6, chunkThreads: 2, fmlThreads: 6, igpu: "igpu_hd4600", st: "mid" },

    // --- Intel Notebook / Mini PC (Vídeo Integrado) ---
    i5_8250u: { name: "Intel Core i5-8250U / i7-8550U", cores: 4, threads: 8, arch: "Kaby Lake R Mobile", avx: 2, l3: "6MB/8MB", concGC: 2, parGC: 6, chunkThreads: 2, fmlThreads: 6, igpu: "igpu_uhd620", st: "low", mobile: true },
    i5_1135g7: { name: "Intel Core i5-1135G7 / i7-1165G7", cores: 4, threads: 8, arch: "Tiger Lake Mobile", avx: 3, l3: "8MB/12MB", concGC: 2, parGC: 6, chunkThreads: 2, fmlThreads: 6, igpu: "igpu_irisxe", st: "mid", mobile: true },
    i5_1240p: { name: "Intel Core i5-1240P / i7-1260P", cores: 12, threads: 16, arch: "Alder Lake-P Mobile", avx: 2, l3: "12MB/18MB", concGC: 4, parGC: 10, chunkThreads: 5, fmlThreads: 14, igpu: "igpu_irisxe", st: "mid", mobile: true },
    i5_12450h: { name: "Intel Core i5-12450H / i5-13420H", cores: 8, threads: 12, arch: "Alder/Raptor Lake-H", avx: 2, l3: "12MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: "igpu_uhd48", st: "high", mobile: true },
    i7_12700h: { name: "Intel Core i7-12700H / i7-13700H", cores: 14, threads: 20, arch: "Alder/Raptor Lake-H", avx: 2, l3: "24MB", concGC: 4, parGC: 12, chunkThreads: 6, fmlThreads: 16, igpu: "igpu_irisxe", st: "high", mobile: true },
    n100: { name: "Intel N100 / N95 / N97", cores: 4, threads: 4, arch: "Alder Lake-N", avx: 2, l3: "6MB", concGC: 1, parGC: 3, chunkThreads: 1, fmlThreads: 3, igpu: "igpu_uhd_n", st: "low" },
    n305: { name: "Intel Core i3-N305 / N300", cores: 8, threads: 8, arch: "Alder Lake-N", avx: 2, l3: "6MB", concGC: 2, parGC: 6, chunkThreads: 1, fmlThreads: 6, igpu: "igpu_uhd_n", st: "low" },

    // --- Intel Xeon (X99 / X79 / LGA1150 / Scalable) ---
    xeon_e3_1230v2: { name: "Intel Xeon E3-1230 v2 / E3-1240 v2", cores: 4, threads: 8, arch: "Ivy Bridge (LGA1155)", avx: 1, l3: "8MB", concGC: 2, parGC: 6, chunkThreads: 3, fmlThreads: 6, igpu: null, st: "low" },
    xeon_e3_1230v3: { name: "Intel Xeon E3-1230 v3 / E3-1231 v3 / E3-1270 v3", cores: 4, threads: 8, arch: "Haswell (LGA1150)", avx: 2, l3: "8MB", concGC: 2, parGC: 6, chunkThreads: 3, fmlThreads: 6, igpu: null, st: "low" },
    xeon_e3_1270v5: { name: "Intel Xeon E3-1270 v5 / E3-1230 v6", cores: 4, threads: 8, arch: "Skylake/Kaby Lake (LGA1151)", avx: 2, l3: "8MB", concGC: 2, parGC: 6, chunkThreads: 3, fmlThreads: 6, igpu: null, st: "mid" },
    xeon_2650v2: { name: "Intel Xeon E5-2650 v2 / E5-2670 (X79)", cores: 8, threads: 16, arch: "Ivy/Sandy Bridge-EP (LGA2011)", avx: 1, l3: "20MB", concGC: 4, parGC: 10, chunkThreads: 6, fmlThreads: 14, igpu: null, st: "low" },
    xeon_2620v3: { name: "Intel Xeon E5-2620 v3", cores: 6, threads: 12, arch: "Haswell-EP (X99)", avx: 2, l3: "15MB", concGC: 3, parGC: 8, chunkThreads: 4, fmlThreads: 10, igpu: null, st: "low" },
    xeon_2630v4: { name: "Intel Xeon E5-2630 v4 / E5-2640 v4 / E5-2666 v3", cores: 10, threads: 20, arch: "Broadwell/Haswell-EP (X99)", avx: 2, l3: "25MB", concGC: 4, parGC: 12, chunkThreads: 6, fmlThreads: 16, igpu: null, st: "low" },
    xeon_2670v3: { name: "Intel Xeon E5-2650 v4 / E5-2670 v3 / E5-2680 v3", cores: 12, threads: 24, arch: "Broadwell/Haswell-EP (X99)", avx: 2, l3: "30MB", concGC: 5, parGC: 14, chunkThreads: 8, fmlThreads: 20, igpu: null, st: "low" },
    xeon_2680v4: { name: "Intel Xeon E5-2680 v4 / E5-2690 v4 / E5-2697 v3", cores: 14, threads: 28, arch: "Broadwell/Haswell-EP (X99)", avx: 2, l3: "35MB", concGC: 6, parGC: 14, chunkThreads: 8, fmlThreads: 22, igpu: null, st: "low" },
    xeon_2696v3: { name: "Intel Xeon E5-2696 v3 / E5-2697 v4 / E5-2699 v3", cores: 18, threads: 36, arch: "Broadwell/Haswell-EP (X99)", avx: 2, l3: "45MB", concGC: 7, parGC: 16, chunkThreads: 8, fmlThreads: 24, igpu: null, st: "low" },
    xeon_2699v4: { name: "Intel Xeon E5-2699 v4 / E5-2696 v4", cores: 22, threads: 44, arch: "Broadwell-EP (X99)", avx: 2, l3: "55MB", concGC: 8, parGC: 18, chunkThreads: 8, fmlThreads: 24, igpu: null, st: "low" },
    xeon_gold_6130: { name: "Intel Xeon Gold 6130 / Silver 4216", cores: 16, threads: 32, arch: "Skylake/Cascade Lake-SP", avx: 3, l3: "22MB", concGC: 6, parGC: 16, chunkThreads: 8, fmlThreads: 24, igpu: null, st: "low" },

    // --- AMD FX (AM3+ - DDR3) ---
    fx_8350: { name: "AMD FX-8350 / FX-6300", cores: 8, threads: 8, arch: "Piledriver", avx: 1, l3: "8MB", concGC: 2, parGC: 6, chunkThreads: 2, fmlThreads: 6, igpu: null, st: "low" }
};
