<div align="center">

# 🚀 Universal Minecraft Modded Optimizer & Simulator
### *Dynamic JVM Arguments, RAM Allocation & Config Generator for Windows, Linux and macOS (Oracle GraalVM / Temurin)*

<p align="center">
  <img src="https://img.shields.io/badge/Minecraft-1.20.1%20to%201.21.4+-emerald?style=for-the-badge&logo=minecraft&logoColor=white" alt="Minecraft Versions">
  <img src="https://img.shields.io/badge/Java%2017%20%7C%2021%20%7C%2023%2B-GraalVM%20%7C%20Temurin%20%7C%20ZGC%20%7C%20G1-purple?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 17 / 21 / 23+ (GraalVM / Temurin)">
  <img src="https://img.shields.io/badge/License-MIT-blue?style=for-the-badge" alt="License">
  <img src="https://img.shields.io/badge/Languages-PT--BR%20%7C%20EN--US-orange?style=for-the-badge" alt="Bilingual">
</p>

<p align="center">
  <b>An interactive, real-time hardware simulator that tailors Minecraft modded performance parameters to your exact PC specs.</b>
</p>

[✨ Live Preview](https://anreren.github.io/minecraft-optimization-panel/) • [Report Bug / Request Feature](https://github.com/anreren/minecraft-optimization-panel/issues)

</div>

---

## 🧐 What is this project?

Running heavy modpacks (such as All The Mods, Create-focused packs, or custom RPGs with 300+ mods) often results in stuttering, garbage collection freezes, and VRAM bottlenecks. 

The **Universal Minecraft Modded Optimizer** solves this by acting as a dynamic rules engine. Instead of static, copy-paste JVM flags, it crosses **9 hardware and software variables** (CPU, GPU or iGPU, RAM, storage, loader, version...) in real-time to generate custom JVM arguments, memory layouts, and mod config files.

---

## 🧠 How the Logic Works (Under the Hood)

The core JavaScript engine turns your hardware choices into JVM flags, memory budgets and config files. Most values are **heuristics**, not benchmarks: treat them as a solid starting point and tune from there.

### 1. JVM Engine Auto-Selection (Temurin + ZGC vs. Temurin + G1)
Concurrent GC threads and the Graal JIT compiler both compete with the game for cores and memory, so the best engine depends on your machine:
* **6 threads or fewer, 12 GB of RAM or less, or Java 17:** switches to **OpenJDK / Temurin + G1GC** (HotSpot C2 JIT, no Graal flags, lower memory overhead). Java 17 only has non-generational ZGC, which performs poorly on modded Minecraft.
* **More than 6 threads, more than 12 GB, and Java 21+:** uses **OpenJDK / Adoptium Temurin + ZGC** (Generational ZGC on Java 21+).
* **Oracle GraalVM + G1GC** remains available manually if you specifically want the Graal JIT compiler (`-XX:+UseJVMCICompiler`); the contradictory *Oracle GraalVM + ZGC* option was removed because ZGC disables JVMCI on Java 21.
* The engine (vendor + GC) is independent from the **Java version** selector (17, 21 or 23+). The engine can always be overridden manually, and your choice is kept when you change other hardware.
* `-XX:UseAVX` is intentionally **not** set: the JVM detects the supported vector level on its own.

### 2. CPU Thread Allocation (`ConcGCThreads` & `ParallelGCThreads`)
For CPUs with **more than 16 threads** (e.g. Xeons, Ryzen 9, Core i9), each database entry provides capped values (roughly **25% of threads** for concurrent GC and **60%** for parallel GC) so the collector does not grab too many cores away from the main/render thread and integrated server. Up to 16 threads, HotSpot's automatic GC thread ergonomics are left enabled:
* **Chunk builder threads** (Sodium/Embeddium) and **C2ME threads** are always taken from the CPU entry. APUs and low-power chips get one thread less, since their iGPU shares memory bandwidth.
* **EntityCulling `tracingDistance`** follows the CPU (128 with 12+ threads, 96 with 8+, otherwise 64), because the visibility raytracing runs on the CPU.
* **Leaves quality and shader advice** follow a per-GPU performance tier (low / entry / mid / high / ultra), not VRAM size.
* **Single-thread tier (low / mid / high / top):** every CPU also carries a rough single-thread speed rating, because Minecraft is mostly bound by its main thread. Low-clock chips (older Xeons, Athlon, N100...) get a dedicated warning instead of benefiting from "more cores", and the tier feeds the recommended in-game settings below.

### 2b. Recommended In-Game Settings
Render distance, simulation distance, entity distance and a shader verdict are derived from the CPU single-thread tier, the GPU tier (iGPUs are capped), the modpack profile (heavy / extreme lower the values) and the RAM channels. They are starting points, not guarantees.

### 3. ZGC Spike Tolerance (`-XX:ZAllocationSpikeTolerance`) & Storage I/O
ZGC engines only:
* By default, ZGC keeps the JVM's **`2.0`** spike tolerance (flag omitted) on fast dual-channel RAM so it does not waste CPU on extra concurrent cycles.
* On slower or single-channel memory (**DDR3**, **DDR4 ≤ 2666 MHz**, or **single-channel**), it raises `-XX:ZAllocationSpikeTolerance=3.0` so ZGC triggers collection earlier before a spike fills the buffer.
* `dynamic_resources` in ModernFix is enabled on SSDs and turned off by default on mechanical HDDs. Dead legacy Forge flags like `-Dfml.readTimeout=180` are no longer emitted.

### 3b. Memory Channels
A *Dual-channel or more / Single-channel* selector estimates the theoretical bandwidth (`MT/s × 8 bytes × channels`). Single-channel raises the ZGC spike tolerance to `3.0`, highlights memory-latency impact in the FerriteCore tip, shows a warning (stronger when an iGPU shares that bandwidth) and lowers the recommended render distance for iGPUs.

### 4. RAM Budget, SoftMax Caching & G1GC Client Tuning
* The optimizer reserves a fixed heap (`-Xms` = `-Xmx` when included) and, on ZGC, sets `-XX:SoftMaxHeapSize` (with a **2 GB** cushion for ≥ 9 GB allocations, or **1 GB** below that). When G1GC is active, the RAM bar displays the full allocated heap without a SoftMax cushion.
* On G1GC, region size scales with heap (`4M` ≤ 5 GB, `8M` for 6–11 GB, `16M` ≥ 12 GB), `MaxGCPauseMillis` targets **50 ms** (**75 ms** on DDR3) for smooth client frametimes, and young-gen sizing adapts below/above 6 GB.
* `-XX:+ExplicitGCInvokesConcurrent` is used instead of `-XX:+DisableExplicitGC` so stray `System.gc()` calls run concurrently without blocking `DirectByteBuffer` native cleanup.
* Modpack profiles (light / medium / heavy / extreme) are capped so that at least **2.5 GB stay free** for the OS after the JVM native overhead (Metaspace + CodeCache: 240 MB for C2, 384–512 MB for Graal JIT) and, when using integrated graphics, up to **2 GB reserved for the iGPU**. A warning appears if you push the slider past that.
* On slow memory the tool does not change any flag: it recommends keeping FerriteCore and ModernFix installed and enabling XMP/DOCP in the BIOS.

### 4b. Notebooks (iGPU + dedicated GPU)
Mobile CPUs and laptop GPUs are flagged. With a dedicated GPU the tool warns that Windows often launches Java on the iGPU and shows how to force `javaw.exe` to *High performance*. On integrated graphics only it reminds you to use the charger and a high-performance power plan.

### 4c. Java Version, Operating System & Launcher
* **Java version (17 / 21 / 23+):** `-XX:+ZGenerational` is only emitted on **Java 21**. Java 17 only has the non-generational ZGC (and defaults to G1GC instead), and on Java 23+ the generational mode is the default and the flag is deprecated/obsolete, so it is omitted. Minecraft 1.20.6+ forces Java 21 or newer.
* **Operating system (Windows / Linux / macOS):**
  * *Windows:* `-XX:+UseLargePages` option (requires the "Lock pages in memory" policy via `secpol.msc`, not available on Windows Home), `javaw.exe` and Windows Graphics settings.
  * *Linux:* the same option becomes `-XX:+UseTransparentHugePages` (recommends kernel THP `[madvise]`, plus `shmem_enabled=advise` for ZGC on Java 24/25+), and Section 5 (GPU Driver & Shaders) lists launcher environment variables (Mesa: `mesa_glthread`, `vblank_mode`, `DRI_PRIME`; NVIDIA: `__GL_THREADED_OPTIMIZATIONS`, `__NV_PRIME_RENDER_OFFLOAD`).
  * *macOS (Apple Silicon, M1 to M4):* picking an Apple chip switches to macOS, locks the DDR/channel/GPU selectors (unified memory, real bandwidth shown) and recommends an ARM64 Java.
* **Launcher (Prism/MultiMC, CurseForge, Modrinth, ATLauncher, official, other):** launchers with their own memory control get a line **without** `-Xms/-Xmx` (avoiding duplicated `-Xmx`), distinguishing Prism/ATLauncher (separate Minimum and Maximum memory fields) from CurseForge/Modrinth (single Maximum/Allocated RAM slider). A step-by-step guide shows the current menu paths for each launcher.

### 5. Oracle GraalVM JIT Flags (`-XX:+UseJVMCICompiler`)
Used only by the **Oracle GraalVM + G1GC** engine. The panel keeps Oracle GraalVM's default `enterprise` compiler configuration (without downgrading to `community`) and uses the modern `-Djdk.graal.*` property prefix on Java 23+ (or `-Dgraal.*` on Java 17/21):
* Java 17 / 21: `-XX:+UseJVMCICompiler -XX:+EagerJVMCI -Dgraal.TuneInlinerExploration=1`
* Java 23+: `-XX:+UseJVMCICompiler -XX:+EagerJVMCI -Djdk.graal.TuneInlinerExploration=1`
* More exploratory inlining on heavy mod loops. The gain varies by modpack, and the JIT spends extra CPU and RAM while warming up.

---

## 🎛️ Interactive Features

* **Hardware Customizer:** Pick your CPU (AMD Ryzen / APUs / Athlon / FX, Intel Core / Core Ultra / Pentium, popular **Xeon** E3, E5 and Gold models, plus laptop H/U-series and mini-PC chips), GPU (NVIDIA GTX 10/16 and RTX 20/30/40/50, AMD RX 400 to RX 9000 and Vega, Intel Arc, plus popular notebook GPUs), RAM generation (DDR3 to DDR5, 1066 to 8000 MHz), memory channels and storage type. Every GPU model and VRAM variant is listed separately.
* **Apple Silicon:** M1, M2, M3 and M4 families (base and Pro) with their GPU, unified memory and macOS-specific advice.
* **Integrated Graphics Detection:** Choose *Integrated Graphics (iGPU)* in the GPU list and the iGPU is detected from the selected CPU (e.g. Ryzen 3 3200G → Radeon Vega 8, Core i5-12400 → UHD 730). CPUs without video output (F/KF models, FX, Xeon) trigger a warning, and shared-memory advice replaces the VRAM alerts.
* **Bilingual Support (PT-BR / EN-US):** Instant interface switching between Portuguese and English.
* **Dynamic Mod Catalog (Section 3):** Adapts mod recommendations based on your chosen Mod Loader (**Forge**, **NeoForge**, or **Fabric**) and Minecraft version (**1.20.1** to **1.21.4+**), including *Sodium/Embeddium*, *ModernFix*, *FerriteCore*, *Lithium/Radium*, *ImmediatelyFast*, *EntityCulling*, *BadOptimizations*, *C2ME/Noisium*, *ScalableLux/Starlight*, *Alternate Current*, *Clumps*, *ServerCore*, *FastSuite*, *Particle Core*, *ThreadTweak*, *AllTheLeaks/MemoryLeakFix*, *Krypton* and *Dynamic FPS*.
* **Config Generator & `/config` Auto-Adjuster (Section 4):** Auto-generates hardware-tailored configuration files for *ModernFix*, *Embeddium/Sodium*, *FerriteCore*, *ImmediatelyFast*, *EntityCulling*, *BadOptimizations*, *Radium/Lithium*, *C2ME* (Fabric), and *Forge/NeoForge* (`fml.toml`, plus `forge-client.toml` on Forge). You can also **load your Minecraft `/config` folder** directly in the browser: the scanner locates each mod's config file (directly in `/config` or inside subfolders), validates existing options against your selected version and loader, shows a per-key diff, and writes adjustments in-place (File System Access API) or offers adjusted file downloads while preserving comments and untouched settings.
* **GPU Driver & Shaders Guide (Section 5):** Standalone OS- and vendor-aware driver settings (NVIDIA, AMD Adrenalin, Intel Arc, Linux Mesa/NVIDIA env vars, Apple Silicon macOS) plus Shader distance guidance.
* **Saved & Shareable Configuration:** Your whole setup (hardware, Java, OS, launcher, RAM profile, language) is saved in `localStorage` and mirrored in the page URL hash. The **Share** button copies a link that reopens the exact same configuration, and the reset button restores the defaults. Only values that exist in the dropdowns are accepted, so a tampered link falls back to the defaults.
* **Accessibility:** skip link, visible keyboard focus, labelled controls, ARIA tabs (arrow keys), `aria-pressed` toggles, a live region for notifications and `role="alert"` for the RAM warning, decorative icons hidden from screen readers and support for *reduced motion*.
* **Remembered RAM Profile:** If a low-RAM machine temporarily forces the *light* profile (8 GB or less), your previous profile is restored when you go back to more RAM.

---

## ⚠️ Notes & Limitations

* The generated mod configs follow verified upstream schemas (**Sodium 0.5/0.6**, **Embeddium 0.3**, **EntityCulling v9**, **BadOptimizations v6**, **ImmediatelyFast**, **FerriteCore**, **ModernFix**, **C2ME 0.2/0.3+**, and **Forge/NeoForge**). Most mods ignore unknown keys silently, though BadOptimizations enforces all 18 keys; if a future mod update renames a key, trust the file generated by that version.
* Thread counts, GC values and tiers are heuristics. Minecraft is mostly bound by single-thread speed, so a many-thread, low-clock CPU (such as an older Xeon) gains chunk-builder threads but will not match a modern desktop CPU.
* Java 21 or newer is required from Minecraft 1.20.5. Some 1.20.1 packs with older mods still need Java 17, which is why Java 17 can be selected for them.
* The generated JVM flags are validated on a real JVM by the test suite (see *Testing*). The CI runs them on Java 17, 21 and 25, but the Graal-specific flags are only exercised by the experimental GraalVM job.
* Menu names in the launcher guide may differ between launcher versions.
* The accessibility *structure* (names, roles, keyboard, live regions) and 375 px horizontal overflow are tested in CI. Colour contrast is audited by hand against the live Tailwind render.

---

## 📁 Project Structure

```
├── index.html        # Page markup and styles (no inline logic)
├── js/               # Classic scripts, loaded in this order by index.html
│   ├── i18n.js           # PT-BR / EN-US translations
│   ├── config-data.js    # DDR frequencies, storage profiles, launchers, tier scores
│   ├── state.js          # Application state
│   ├── hardware.js       # Active GPU, memory budget, notebook detection, recommendations
│   ├── handlers.js       # Selector event handlers (hardware, Java, OS, launcher, RAM)
│   ├── persistence.js    # localStorage and shareable links
│   ├── generator.js      # RAM bar, JVM arguments, flag explanations, launcher guide
│   ├── diagnostics.js    # Diagnostic cards
│   ├── mods.js           # Mod catalog
│   ├── configs.js        # Generated mod config files (Section 4 tabs) and GPU Driver & Shaders (Section 5)
│   ├── config-scanner.js # /config folder recursive loader, option validator & safe auto-adjuster
│   └── ui.js             # Language switch, clipboard, toast and start-up
├── data/
│   ├── cpus.js       # CPU database (threads, GC values, single-thread tier, iGPU link)
│   └── gpus.js       # GPU database (dedicated, notebook, integrated and Apple GPUs)
├── tests/
│   ├── check-data.js     # database consistency (dropdowns, iGPU links, schema, duplicates)
│   ├── check-browser.js  # translations, mod config schemas, /config scanner, JVM logic, persistence, a11y, 375 px layout
│   └── validate-jvm.py   # runs the generated JVM arguments on the installed JVM
├── .github/workflows/ci.yml  # runs the tests on Java 17, 21, 25 and Oracle GraalVM 21/25
├── package.json
├── CHANGELOG.md
└── README.md
```

### Testing
```bash
npm install     # installs puppeteer
npm test        # data checks + browser checks + JVM flag validation (needs Java and Python 3)
```
`check-browser.js` opens the page headless and checks that every translation key exists in both languages, that every generated config file (Sections 4 & 5) passes per-mod schema validation (exact keys, types, TOML sections, and loader/version variants) across a matrix of hardware, Minecraft versions, loaders, and operating systems, that the Section 4 `/config` folder scanner & auto-adjuster locates files directly in `/config` and in subfolders while preserving untouched user options, that the JVM flag and responsive/a11y rules hold (for example `-XX:+ZGenerational` only on Java 21, no overflow at 375 px), and that saving and restoring a configuration is lossless. It also guards bugs fixed before, such as the RAM slider limit. `validate-jvm.py` then runs the generated arguments on the installed JVM and fails on any warning. Set `CHROME_PATH` to use a specific Chrome binary.

### Adding hardware
1. Add an entry to `data/cpus.js` or `data/gpus.js` (the field list is documented at the top of each file).
2. Add the matching `<option value="your_key">` to `#select-cpu` or `#select-gpu` in `index.html`.
3. For a CPU with integrated graphics, set its `igpu` field to the key of an iGPU entry in `gpus.js` (iGPUs are not listed in the dropdown).

The data files are plain scripts (no modules or build step), so the site works on GitHub Pages and when opening `index.html` locally.

---

## 🛠️ Tech Stack

* **Frontend:** Pure HTML5, Tailwind CSS (via CDN), and FontAwesome.
* **Logic:** Vanilla JavaScript (ES6+), real-time reactive recalculations, split into classic scripts under `js/` (no bundler).
* **Data:** Hardware databases kept in separate plain-script files under `data/`.
* **Deployment:** Hosted statically via **GitHub Pages**.

---

## 📜 License

Distributed under the [MIT License](LICENSE). Feel free to fork, adapt, and use this tool to optimize your modded Minecraft experience!
