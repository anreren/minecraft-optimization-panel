// ============================================================================
// GPU DATABASE (dedicated, notebook and integrated GPUs)
// Loaded before the main script (see index.html).
// To add a GPU: add an entry here and a matching <option> in #select-gpu.
// Integrated GPUs are not listed in the dropdown: they are reached through the
// "igpu" field of a CPU entry in cpus.js.
//
// Fields
//   name        Display name
//   vendor      "nvidia" | "amd" | "intel"
//   vram        VRAM in GB (shared memory for iGPUs)
//   arch        Architecture / chip label
//   noErrorCtx  Whether use_no_error_g_l_context is safe to enable
//   tier        Performance tier: "low" | "entry" | "mid" | "high" | "ultra"
//   laptop      true for notebook GPUs (optional)
//   igpu/short  true + short label for integrated GPUs (optional)
// ============================================================================

const gpuDatabase = {
    // --- NVIDIA GeForce RTX 50 Series (Blackwell) ---
    rtx_5050: { name: "NVIDIA RTX 5050 8GB", vendor: "nvidia", vram: 8, arch: "Blackwell (GB207)", noErrorCtx: true, tier: "high" },
    rtx_5060: { name: "NVIDIA RTX 5060 8GB", vendor: "nvidia", vram: 8, arch: "Blackwell (GB206)", noErrorCtx: true, tier: "high" },
    rtx_5060ti_8: { name: "NVIDIA RTX 5060 Ti 8GB", vendor: "nvidia", vram: 8, arch: "Blackwell (GB206)", noErrorCtx: true, tier: "high" },
    rtx_5060ti_16: { name: "NVIDIA RTX 5060 Ti 16GB", vendor: "nvidia", vram: 16, arch: "Blackwell (GB206)", noErrorCtx: true, tier: "ultra" },
    rtx_5070: { name: "NVIDIA RTX 5070 12GB", vendor: "nvidia", vram: 12, arch: "Blackwell (GB205)", noErrorCtx: true, tier: "ultra" },
    rtx_5070ti: { name: "NVIDIA RTX 5070 Ti 16GB", vendor: "nvidia", vram: 16, arch: "Blackwell (GB203)", noErrorCtx: true, tier: "ultra" },
    rtx_5080: { name: "NVIDIA RTX 5080 16GB", vendor: "nvidia", vram: 16, arch: "Blackwell (GB203)", noErrorCtx: true, tier: "ultra" },
    rtx_5090: { name: "NVIDIA RTX 5090 32GB", vendor: "nvidia", vram: 32, arch: "Blackwell (GB202)", noErrorCtx: true, tier: "ultra" },

    // --- NVIDIA GeForce RTX 40 Series (Ada Lovelace) ---
    rtx_4060: { name: "NVIDIA RTX 4060 8GB", vendor: "nvidia", vram: 8, arch: "Ada Lovelace (AD107)", noErrorCtx: true, tier: "high" },
    rtx_4060ti_8: { name: "NVIDIA RTX 4060 Ti 8GB", vendor: "nvidia", vram: 8, arch: "Ada Lovelace (AD106)", noErrorCtx: true, tier: "ultra" },
    rtx_4060ti_16: { name: "NVIDIA RTX 4060 Ti 16GB", vendor: "nvidia", vram: 16, arch: "Ada Lovelace (AD106)", noErrorCtx: true, tier: "ultra" },
    rtx_4070: { name: "NVIDIA RTX 4070 12GB", vendor: "nvidia", vram: 12, arch: "Ada Lovelace (AD104)", noErrorCtx: true, tier: "ultra" },
    rtx_4070s: { name: "NVIDIA RTX 4070 Super 12GB", vendor: "nvidia", vram: 12, arch: "Ada Lovelace (AD104)", noErrorCtx: true, tier: "ultra" },
    rtx_4070ti: { name: "NVIDIA RTX 4070 Ti 12GB", vendor: "nvidia", vram: 12, arch: "Ada Lovelace (AD104)", noErrorCtx: true, tier: "ultra" },
    rtx_4070tis: { name: "NVIDIA RTX 4070 Ti Super 16GB", vendor: "nvidia", vram: 16, arch: "Ada Lovelace (AD103)", noErrorCtx: true, tier: "ultra" },
    rtx_4080: { name: "NVIDIA RTX 4080 16GB", vendor: "nvidia", vram: 16, arch: "Ada Lovelace (AD103)", noErrorCtx: true, tier: "ultra" },
    rtx_4080s: { name: "NVIDIA RTX 4080 Super 16GB", vendor: "nvidia", vram: 16, arch: "Ada Lovelace (AD103)", noErrorCtx: true, tier: "ultra" },
    rtx_4090: { name: "NVIDIA RTX 4090 24GB", vendor: "nvidia", vram: 24, arch: "Ada Lovelace (AD102)", noErrorCtx: true, tier: "ultra" },

    // --- NVIDIA GeForce RTX 30 Series (Ampere) ---
    rtx_3050_4_lap: { name: "NVIDIA RTX 3050 (4GB Laptop)", vendor: "nvidia", vram: 4, arch: "Ampere Mobile (GA107)", noErrorCtx: true, tier: "entry", laptop: true },
    rtx_3050_6_desk: { name: "NVIDIA RTX 3050 6GB (Desktop)", vendor: "nvidia", vram: 6, arch: "Ampere (GA107)", noErrorCtx: true, tier: "mid" },
    rtx_3050_8: { name: "NVIDIA RTX 3050 8GB (Desktop)", vendor: "nvidia", vram: 8, arch: "Ampere (GA106)", noErrorCtx: true, tier: "mid" },
    rtx_3060_8: { name: "NVIDIA RTX 3060 8GB", vendor: "nvidia", vram: 8, arch: "Ampere", noErrorCtx: true, tier: "high" },
    rtx_3060_12: { name: "NVIDIA RTX 3060 12GB", vendor: "nvidia", vram: 12, arch: "Ampere (GA106)", noErrorCtx: true, tier: "high" },
    rtx_3060ti: { name: "NVIDIA RTX 3060 Ti 8GB", vendor: "nvidia", vram: 8, arch: "Ampere (GA104)", noErrorCtx: true, tier: "high" },
    rtx_3070: { name: "NVIDIA RTX 3070 8GB", vendor: "nvidia", vram: 8, arch: "Ampere (GA104)", noErrorCtx: true, tier: "ultra" },
    rtx_3070ti: { name: "NVIDIA RTX 3070 Ti 8GB", vendor: "nvidia", vram: 8, arch: "Ampere (GA104)", noErrorCtx: true, tier: "ultra" },
    rtx_3080_10: { name: "NVIDIA RTX 3080 10GB", vendor: "nvidia", vram: 10, arch: "Ampere (GA102)", noErrorCtx: true, tier: "ultra" },
    rtx_3080_12: { name: "NVIDIA RTX 3080 12GB", vendor: "nvidia", vram: 12, arch: "Ampere (GA102)", noErrorCtx: true, tier: "ultra" },
    rtx_3080ti: { name: "NVIDIA RTX 3080 Ti 12GB", vendor: "nvidia", vram: 12, arch: "Ampere (GA102)", noErrorCtx: true, tier: "ultra" },
    rtx_3090: { name: "NVIDIA RTX 3090 24GB", vendor: "nvidia", vram: 24, arch: "Ampere (GA102)", noErrorCtx: true, tier: "ultra" },
    rtx_3090ti: { name: "NVIDIA RTX 3090 Ti 24GB", vendor: "nvidia", vram: 24, arch: "Ampere (GA102)", noErrorCtx: true, tier: "ultra" },

    // --- NVIDIA GeForce RTX 20 Series (Turing) ---
    rtx_2060: { name: "NVIDIA RTX 2060 6GB", vendor: "nvidia", vram: 6, arch: "Turing (TU106)", noErrorCtx: true, tier: "mid" },
    rtx_2060_12: { name: "NVIDIA RTX 2060 12GB", vendor: "nvidia", vram: 12, arch: "Turing (TU106)", noErrorCtx: true, tier: "mid" },
    rtx_2060s: { name: "NVIDIA RTX 2060 Super 8GB", vendor: "nvidia", vram: 8, arch: "Turing (TU106)", noErrorCtx: true, tier: "high" },
    rtx_2070: { name: "NVIDIA RTX 2070 8GB", vendor: "nvidia", vram: 8, arch: "Turing (TU106)", noErrorCtx: true, tier: "high" },
    rtx_2070s: { name: "NVIDIA RTX 2070 Super 8GB", vendor: "nvidia", vram: 8, arch: "Turing (TU104)", noErrorCtx: true, tier: "high" },
    rtx_2080: { name: "NVIDIA RTX 2080 8GB", vendor: "nvidia", vram: 8, arch: "Turing (TU104)", noErrorCtx: true, tier: "high" },
    rtx_2080s: { name: "NVIDIA RTX 2080 Super 8GB", vendor: "nvidia", vram: 8, arch: "Turing (TU104)", noErrorCtx: true, tier: "ultra" },
    rtx_2080ti: { name: "NVIDIA RTX 2080 Ti 11GB", vendor: "nvidia", vram: 11, arch: "Turing (TU102)", noErrorCtx: true, tier: "ultra" },

    // --- NVIDIA GeForce GTX 16 Series (Turing) ---
    gtx_1650: { name: "NVIDIA GTX 1650 4GB", vendor: "nvidia", vram: 4, arch: "Turing (TU117)", noErrorCtx: true, tier: "entry" },
    gtx_1650s: { name: "NVIDIA GTX 1650 Super 4GB", vendor: "nvidia", vram: 4, arch: "Turing (TU116)", noErrorCtx: true, tier: "entry" },
    gtx_1660: { name: "NVIDIA GTX 1660 6GB", vendor: "nvidia", vram: 6, arch: "Turing (TU116)", noErrorCtx: true, tier: "mid" },
    gtx_1660s: { name: "NVIDIA GTX 1660 Super 6GB", vendor: "nvidia", vram: 6, arch: "Turing (TU116)", noErrorCtx: true, tier: "mid" },
    gtx_1660ti: { name: "NVIDIA GTX 1660 Ti 6GB", vendor: "nvidia", vram: 6, arch: "Turing (TU116)", noErrorCtx: true, tier: "mid" },

    // --- NVIDIA GeForce GTX 10 Series (Pascal) ---
    gt_1030: { name: "NVIDIA GT 1030 2GB", vendor: "nvidia", vram: 2, arch: "Pascal (GP108)", noErrorCtx: true, tier: "low" },
    gtx_1050_2: { name: "NVIDIA GTX 1050 2GB", vendor: "nvidia", vram: 2, arch: "Pascal (GP107)", noErrorCtx: true, tier: "low" },
    gtx_1050ti: { name: "NVIDIA GTX 1050 Ti 4GB", vendor: "nvidia", vram: 4, arch: "Pascal (GP107)", noErrorCtx: true, tier: "entry" },
    gtx_1060_3: { name: "NVIDIA GTX 1060 3GB", vendor: "nvidia", vram: 3, arch: "Pascal (GP106)", noErrorCtx: true, tier: "entry" },
    gtx_1060: { name: "NVIDIA GTX 1060 6GB", vendor: "nvidia", vram: 6, arch: "Pascal (GP106)", noErrorCtx: true, tier: "mid" },
    gtx_1070: { name: "NVIDIA GTX 1070 8GB", vendor: "nvidia", vram: 8, arch: "Pascal (GP104)", noErrorCtx: true, tier: "mid" },
    gtx_1070ti: { name: "NVIDIA GTX 1070 Ti 8GB", vendor: "nvidia", vram: 8, arch: "Pascal (GP104)", noErrorCtx: true, tier: "high" },
    gtx_1080: { name: "NVIDIA GTX 1080 8GB", vendor: "nvidia", vram: 8, arch: "Pascal (GP104)", noErrorCtx: true, tier: "high" },
    gtx_1080ti: { name: "NVIDIA GTX 1080 Ti 11GB", vendor: "nvidia", vram: 11, arch: "Pascal (GP102)", noErrorCtx: true, tier: "high" },

    // --- AMD Radeon RX 9000 Series (RDNA 4) ---
    rx_9060xt_8: { name: "AMD Radeon RX 9060 XT 8GB", vendor: "amd", vram: 8, arch: "RDNA 4 (Navi 44)", noErrorCtx: true, tier: "high" },
    rx_9060xt_16: { name: "AMD Radeon RX 9060 XT 16GB", vendor: "amd", vram: 16, arch: "RDNA 4 (Navi 44)", noErrorCtx: true, tier: "ultra" },
    rx_9070: { name: "AMD Radeon RX 9070 16GB", vendor: "amd", vram: 16, arch: "RDNA 4 (Navi 48)", noErrorCtx: true, tier: "ultra" },
    rx_9070xt: { name: "AMD Radeon RX 9070 XT 16GB", vendor: "amd", vram: 16, arch: "RDNA 4 (Navi 48)", noErrorCtx: true, tier: "ultra" },

    // --- AMD Radeon RX 7000 Series (RDNA 3) ---
    rx_7600: { name: "AMD Radeon RX 7600 8GB", vendor: "amd", vram: 8, arch: "RDNA 3 (Navi 33)", noErrorCtx: true, tier: "high" },
    rx_7600xt: { name: "AMD Radeon RX 7600 XT 16GB", vendor: "amd", vram: 16, arch: "RDNA 3 (Navi 33)", noErrorCtx: true, tier: "high" },
    rx_7700xt: { name: "AMD Radeon RX 7700 XT 12GB", vendor: "amd", vram: 12, arch: "RDNA 3 (Navi 32)", noErrorCtx: true, tier: "ultra" },
    rx_7800xt: { name: "AMD Radeon RX 7800 XT 16GB", vendor: "amd", vram: 16, arch: "RDNA 3 (Navi 32)", noErrorCtx: true, tier: "ultra" },
    rx_7900gre: { name: "AMD Radeon RX 7900 GRE 16GB", vendor: "amd", vram: 16, arch: "RDNA 3 (Navi 31)", noErrorCtx: true, tier: "ultra" },
    rx_7900xt: { name: "AMD Radeon RX 7900 XT 20GB", vendor: "amd", vram: 20, arch: "RDNA 3 (Navi 31)", noErrorCtx: true, tier: "ultra" },
    rx_7900xtx: { name: "AMD Radeon RX 7900 XTX 24GB", vendor: "amd", vram: 24, arch: "RDNA 3 (Navi 31)", noErrorCtx: true, tier: "ultra" },

    // --- AMD Radeon RX 6000 Series (RDNA 2) ---
    rx_6400: { name: "AMD Radeon RX 6400 4GB", vendor: "amd", vram: 4, arch: "RDNA 2 (Navi 24)", noErrorCtx: true, tier: "low" },
    rx_6500xt: { name: "AMD Radeon RX 6500 XT 4GB", vendor: "amd", vram: 4, arch: "RDNA 2 (Navi 24)", noErrorCtx: true, tier: "entry" },
    rx_6600: { name: "AMD Radeon RX 6600 8GB", vendor: "amd", vram: 8, arch: "RDNA 2 (Navi 23)", noErrorCtx: true, tier: "mid" },
    rx_6600xt: { name: "AMD Radeon RX 6600 XT 8GB", vendor: "amd", vram: 8, arch: "RDNA 2 (Navi 23)", noErrorCtx: true, tier: "high" },
    rx_6650xt: { name: "AMD Radeon RX 6650 XT 8GB", vendor: "amd", vram: 8, arch: "RDNA 2 (Navi 23)", noErrorCtx: true, tier: "high" },
    rx_6700: { name: "AMD Radeon RX 6700 10GB", vendor: "amd", vram: 10, arch: "RDNA 2 (Navi 22)", noErrorCtx: true, tier: "high" },
    rx_6700xt: { name: "AMD Radeon RX 6700 XT 12GB", vendor: "amd", vram: 12, arch: "RDNA 2 (Navi 22)", noErrorCtx: true, tier: "ultra" },
    rx_6750xt: { name: "AMD Radeon RX 6750 XT 12GB", vendor: "amd", vram: 12, arch: "RDNA 2 (Navi 22)", noErrorCtx: true, tier: "ultra" },
    rx_6800: { name: "AMD Radeon RX 6800 16GB", vendor: "amd", vram: 16, arch: "RDNA 2 (Navi 21)", noErrorCtx: true, tier: "ultra" },
    rx_6800xt: { name: "AMD Radeon RX 6800 XT 16GB", vendor: "amd", vram: 16, arch: "RDNA 2 (Navi 21)", noErrorCtx: true, tier: "ultra" },
    rx_6900xt: { name: "AMD Radeon RX 6900 XT 16GB", vendor: "amd", vram: 16, arch: "RDNA 2 (Navi 21)", noErrorCtx: true, tier: "ultra" },
    rx_6950xt: { name: "AMD Radeon RX 6950 XT 16GB", vendor: "amd", vram: 16, arch: "RDNA 2 (Navi 21)", noErrorCtx: true, tier: "ultra" },

    // --- AMD Radeon RX 5000 Series (RDNA 1) ---
    rx_5500xt_4: { name: "AMD Radeon RX 5500 XT 4GB", vendor: "amd", vram: 4, arch: "RDNA 1 (Navi 14)", noErrorCtx: true, tier: "entry" },
    rx_5500xt_8: { name: "AMD Radeon RX 5500 XT 8GB", vendor: "amd", vram: 8, arch: "RDNA 1 (Navi 14)", noErrorCtx: true, tier: "entry" },
    rx_5600xt: { name: "AMD Radeon RX 5600 XT 6GB", vendor: "amd", vram: 6, arch: "RDNA 1 (Navi 10)", noErrorCtx: true, tier: "mid" },
    rx_5700: { name: "AMD Radeon RX 5700 8GB", vendor: "amd", vram: 8, arch: "RDNA 1 (Navi 10)", noErrorCtx: true, tier: "high" },
    rx_5700xt: { name: "AMD Radeon RX 5700 XT 8GB", vendor: "amd", vram: 8, arch: "RDNA 1 (Navi 10)", noErrorCtx: true, tier: "high" },

    // --- AMD Radeon RX Vega / Radeon VII (GCN 5) ---
    vega_56: { name: "AMD Radeon RX Vega 56 8GB", vendor: "amd", vram: 8, arch: "Vega 10 (GCN 5)", noErrorCtx: false, tier: "high" },
    vega_64: { name: "AMD Radeon RX Vega 64 8GB", vendor: "amd", vram: 8, arch: "Vega 10 (GCN 5)", noErrorCtx: false, tier: "high" },
    radeon_vii: { name: "AMD Radeon VII 16GB", vendor: "amd", vram: 16, arch: "Vega 20 (GCN 5)", noErrorCtx: false, tier: "ultra" },

    // --- AMD Radeon RX 500 / 400 Series (Polaris) ---
    rx_550: { name: "AMD Radeon RX 550 4GB", vendor: "amd", vram: 4, arch: "Polaris 12", noErrorCtx: false, tier: "low" },
    rx_460_4: { name: "AMD Radeon RX 460 4GB", vendor: "amd", vram: 4, arch: "Polaris 11", noErrorCtx: false, tier: "low" },
    rx_560: { name: "AMD Radeon RX 560 4GB", vendor: "amd", vram: 4, arch: "Polaris 21", noErrorCtx: false, tier: "low" },
    rx_470_4: { name: "AMD Radeon RX 470 4GB", vendor: "amd", vram: 4, arch: "Polaris 10", noErrorCtx: false, tier: "entry" },
    rx_470_8: { name: "AMD Radeon RX 470 8GB", vendor: "amd", vram: 8, arch: "Polaris 10", noErrorCtx: false, tier: "entry" },
    rx_480_4: { name: "AMD Radeon RX 480 4GB", vendor: "amd", vram: 4, arch: "Polaris 10", noErrorCtx: false, tier: "mid" },
    rx_480_8: { name: "AMD Radeon RX 480 8GB", vendor: "amd", vram: 8, arch: "Polaris 10", noErrorCtx: false, tier: "mid" },
    rx_570_4: { name: "AMD Radeon RX 570 4GB", vendor: "amd", vram: 4, arch: "Polaris 20", noErrorCtx: false, tier: "entry" },
    rx_570_8: { name: "AMD Radeon RX 570 8GB", vendor: "amd", vram: 8, arch: "Polaris 20", noErrorCtx: false, tier: "entry" },
    rx_580_4: { name: "AMD Radeon RX 580 4GB", vendor: "amd", vram: 4, arch: "Polaris 20", noErrorCtx: false, tier: "mid" },
    rx_580: { name: "AMD Radeon RX 580 8GB", vendor: "amd", vram: 8, arch: "Polaris 20", noErrorCtx: false, tier: "mid" },
    rx_580_2048: { name: "AMD Radeon RX 580 2048SP 8GB", vendor: "amd", vram: 8, arch: "Polaris 20", noErrorCtx: false, tier: "mid" },
    rx_590: { name: "AMD Radeon RX 590 8GB", vendor: "amd", vram: 8, arch: "Polaris 30", noErrorCtx: false, tier: "mid" },

    // --- Notebook GPUs (NVIDIA / AMD) ---
    gtx_1650_lap: { name: "NVIDIA GTX 1650 Laptop 4GB", vendor: "nvidia", vram: 4, arch: "Turing (TU117)", noErrorCtx: true, tier: "entry", laptop: true },
    gtx_1660ti_lap: { name: "NVIDIA GTX 1660 Ti Laptop 6GB", vendor: "nvidia", vram: 6, arch: "Turing (TU116)", noErrorCtx: true, tier: "mid", laptop: true },
    rtx_2060_lap: { name: "NVIDIA RTX 2060 Laptop 6GB", vendor: "nvidia", vram: 6, arch: "Turing (TU106)", noErrorCtx: true, tier: "mid", laptop: true },
    rtx_3060_lap: { name: "NVIDIA RTX 3060 Laptop 6GB", vendor: "nvidia", vram: 6, arch: "Ampere (GA106)", noErrorCtx: true, tier: "high", laptop: true },
    rtx_3070_lap: { name: "NVIDIA RTX 3070 Laptop 8GB", vendor: "nvidia", vram: 8, arch: "Ampere (GA104)", noErrorCtx: true, tier: "high", laptop: true },
    rtx_4050_lap: { name: "NVIDIA RTX 4050 Laptop 6GB", vendor: "nvidia", vram: 6, arch: "Ada Lovelace (AD107)", noErrorCtx: true, tier: "high", laptop: true },
    rtx_4060_lap: { name: "NVIDIA RTX 4060 Laptop 8GB", vendor: "nvidia", vram: 8, arch: "Ada Lovelace (AD107)", noErrorCtx: true, tier: "high", laptop: true },
    rtx_4070_lap: { name: "NVIDIA RTX 4070 Laptop 8GB", vendor: "nvidia", vram: 8, arch: "Ada Lovelace (AD106)", noErrorCtx: true, tier: "ultra", laptop: true },
    rtx_4080_lap: { name: "NVIDIA RTX 4080 Laptop 12GB", vendor: "nvidia", vram: 12, arch: "Ada Lovelace (AD104)", noErrorCtx: true, tier: "ultra", laptop: true },
    rtx_5060_lap: { name: "NVIDIA RTX 5060 Laptop 8GB", vendor: "nvidia", vram: 8, arch: "Blackwell (GB206)", noErrorCtx: true, tier: "high", laptop: true },
    rx_6600m: { name: "AMD Radeon RX 6600M 8GB", vendor: "amd", vram: 8, arch: "RDNA 2 (Navi 23)", noErrorCtx: true, tier: "high", laptop: true },
    rx_7600s: { name: "AMD Radeon RX 7600S 8GB", vendor: "amd", vram: 8, arch: "RDNA 3 (Navi 33)", noErrorCtx: true, tier: "high", laptop: true },

    // --- Intel Arc (Alchemist / Battlemage) ---
    arc_a380: { name: "Intel Arc A380 6GB", vendor: "intel", vram: 6, arch: "Xe-HPG (Alchemist)", noErrorCtx: false, tier: "entry" },
    arc_a580: { name: "Intel Arc A580 8GB", vendor: "intel", vram: 8, arch: "Xe-HPG (Alchemist)", noErrorCtx: false, tier: "mid" },
    arc_a750: { name: "Intel Arc A750 8GB", vendor: "intel", vram: 8, arch: "Xe-HPG (Alchemist)", noErrorCtx: false, tier: "mid" },
    arc_a770: { name: "Intel Arc A770 16GB", vendor: "intel", vram: 16, arch: "Xe-HPG (Alchemist)", noErrorCtx: false, tier: "high" },
    arc_b570: { name: "Intel Arc B570 10GB", vendor: "intel", vram: 10, arch: "Xe2-HPG (Battlemage)", noErrorCtx: false, tier: "high" },
    arc_b580: { name: "Intel Arc B580 12GB", vendor: "intel", vram: 12, arch: "Xe2-HPG (Battlemage)", noErrorCtx: false, tier: "high" },

    // --- Integrated GPUs (reached through the CPU "igpu" field) ---
    igpu_660m: { name: "AMD Radeon 660M (iGPU)", vendor: "amd", vram: 2, arch: "RDNA 2 • 6 CUs", noErrorCtx: false, tier: "low", igpu: true, short: "660M" },
    igpu_uhd48: { name: "Intel UHD Graphics 48 EU (iGPU)", vendor: "intel", vram: 2, arch: "Intel Xe-LP • 48 EU", noErrorCtx: false, tier: "low", igpu: true, short: "UHD 48EU" },
    igpu_vega3: { name: "AMD Radeon Vega 3 (iGPU)", vendor: "amd", vram: 1, arch: "Vega (GCN 5) • 3 CUs", noErrorCtx: false, tier: "low", igpu: true, short: "Vega 3" },
    igpu_vega7: { name: "AMD Radeon Vega 7 (iGPU)", vendor: "amd", vram: 2, arch: "Vega (GCN 5) • 7 CUs", noErrorCtx: false, tier: "low", igpu: true, short: "Vega 7" },
    igpu_vega8: { name: "AMD Radeon Vega 8 (iGPU)", vendor: "amd", vram: 2, arch: "Vega (GCN 5) • 8 CUs", noErrorCtx: false, tier: "low", igpu: true, short: "Vega 8" },
    igpu_vega11: { name: "AMD Radeon Vega 11 (iGPU)", vendor: "amd", vram: 2, arch: "Vega (GCN 5) • 11 CUs", noErrorCtx: false, tier: "low", igpu: true, short: "Vega 11" },
    igpu_rdna2_2cu: { name: "AMD Radeon Graphics 2 CU (iGPU)", vendor: "amd", vram: 1, arch: "RDNA 2 • 2 CUs", noErrorCtx: false, tier: "low", igpu: true, short: "Radeon 2CU" },
    igpu_740m: { name: "AMD Radeon 740M (iGPU)", vendor: "amd", vram: 2, arch: "RDNA 3 • 4 CUs", noErrorCtx: false, tier: "low", igpu: true, short: "740M" },
    igpu_760m: { name: "AMD Radeon 760M (iGPU)", vendor: "amd", vram: 4, arch: "RDNA 3 • 8 CUs", noErrorCtx: false, tier: "entry", igpu: true, short: "760M" },
    igpu_780m: { name: "AMD Radeon 780M (iGPU)", vendor: "amd", vram: 4, arch: "RDNA 3 • 12 CUs", noErrorCtx: false, tier: "entry", igpu: true, short: "780M" },
    igpu_680m: { name: "AMD Radeon 680M (iGPU)", vendor: "amd", vram: 4, arch: "RDNA 2 • 12 CUs", noErrorCtx: false, tier: "entry", igpu: true, short: "680M" },
    igpu_hd3000: { name: "Intel HD Graphics 3000 (iGPU)", vendor: "intel", vram: 1, arch: "Intel Gen6 (Sandy Bridge)", noErrorCtx: false, tier: "low", igpu: true, short: "HD 3000" },
    igpu_hd4000: { name: "Intel HD Graphics 4000 (iGPU)", vendor: "intel", vram: 1, arch: "Intel Gen7 (Ivy Bridge)", noErrorCtx: false, tier: "low", igpu: true, short: "HD 4000" },
    igpu_hd4600: { name: "Intel HD Graphics 4600 (iGPU)", vendor: "intel", vram: 1, arch: "Intel Gen7.5 (Haswell)", noErrorCtx: false, tier: "low", igpu: true, short: "HD 4600" },
    igpu_uhd610: { name: "Intel UHD Graphics 610 (iGPU)", vendor: "intel", vram: 1, arch: "Intel Gen9.5", noErrorCtx: false, tier: "low", igpu: true, short: "UHD 610" },
    igpu_uhd620: { name: "Intel UHD Graphics 620 (iGPU)", vendor: "intel", vram: 2, arch: "Intel Gen9.5", noErrorCtx: false, tier: "low", igpu: true, short: "UHD 620" },
    igpu_uhd630: { name: "Intel UHD Graphics 630 (iGPU)", vendor: "intel", vram: 2, arch: "Intel Gen9.5", noErrorCtx: false, tier: "low", igpu: true, short: "UHD 630" },
    igpu_uhd730: { name: "Intel UHD Graphics 730 (iGPU)", vendor: "intel", vram: 2, arch: "Intel Xe-LP • 24 EU", noErrorCtx: false, tier: "low", igpu: true, short: "UHD 730" },
    igpu_uhd770: { name: "Intel UHD Graphics 770 (iGPU)", vendor: "intel", vram: 2, arch: "Intel Xe-LP • 32 EU", noErrorCtx: false, tier: "low", igpu: true, short: "UHD 770" },
    igpu_uhd_n: { name: "Intel UHD Graphics Alder Lake-N (iGPU)", vendor: "intel", vram: 2, arch: "Intel Xe-LP • 24-32 EU", noErrorCtx: false, tier: "low", igpu: true, short: "UHD N-Series" },
    igpu_irisxe: { name: "Intel Iris Xe Graphics (iGPU)", vendor: "intel", vram: 4, arch: "Intel Xe-LP • 80-96 EU", noErrorCtx: false, tier: "entry", igpu: true, short: "Iris Xe" },
    igpu_arc4xe: { name: "Intel Graphics Arc 4 Xe-cores (iGPU)", vendor: "intel", vram: 4, arch: "Intel Xe-LPG • Arrow Lake", noErrorCtx: false, tier: "low", igpu: true, short: "Arc 4 Xe" }
};
