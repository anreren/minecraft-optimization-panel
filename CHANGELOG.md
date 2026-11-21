# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
- Split mismatched CPU entries into accurate models in `data/cpus.js`: Ryzen 9 5950X (16C/32T), Ryzen 5 4500 (8MB L3), Core i5-13400F / 14400F (10C/16T), and Core i7-14700K (20C/28T).
- Automated CI matrix coverage for Oracle GraalVM 21 and 25 (`graalvm` job), plus mobile 375 px overflow and extended JVM flag assertions in `tests/check-browser.js`.
- Per-mod upstream schema validation in `tests/check-browser.js` covering all 9 config tabs across MC versions, loaders (`forge`, `neoforge`, `fabric`), OSes, and hardware profiles (exact keys, value types, TOML sections, and version-gated fields).
- `JAVA_BIN` override support in `tests/validate-jvm.py` to test multiple local JDK installations cleanly.
- Legacy URL hash fallback mapping `#e=graal_zgc` to `temurin_zgc` in `js/persistence.js`.

### Changed
- **GitHub Actions CI:** moved `.github/ci.yml` to `.github/workflows/ci.yml` so workflows actually execute on pushes and PRs, upgraded `actions/setup-java` to `v5`, and enabled `/sys/kernel/mm/transparent_hugepage/shmem_enabled=advise` on Linux runners so Java 25 ZGC + THP checks run cleanly.
- **Default JVM engine:** changed default and auto-recommended engine for capable systems from `graal_zgc` to `temurin_zgc`, and auto-selected `temurin_g1` when Java 17 is chosen.
- **JVM flags cleanup & client tuning:**
  - Removed `-XX:+UseStringDeduplication` from ZGC profiles (caused a startup warning on Java 17 and young-gen weak-handle retention on Java 21–24) while keeping it on G1GC.
  - Replaced `-XX:+DisableExplicitGC` with `-XX:+ExplicitGCInvokesConcurrent` to prevent STW `System.gc()` stalls without breaking `DirectByteBuffer` cleanup.
  - Scaled `G1HeapRegionSize` dynamically by heap size (`4M` ≤ 5 GB, `8M` for 6–11 GB, `16M` ≥ 12 GB), lowered client `MaxGCPauseMillis` target to `50` ms (`75` ms on DDR3), and adjusted young-gen sizing for heaps ≤ 6 GB.
  - Applied `ConcGCThreads`/`ParallelGCThreads` overrides only on CPUs above 16 threads (relying on HotSpot ergonomics up to 16 threads).
  - Decoupled `ZAllocationSpikeTolerance` from storage drive type: kept JVM default `2.0` on fast dual-channel RAM and raised to `3.0` only for DDR3, DDR4 ≤ 2666 MHz, or single-channel RAM.
  - Updated Graal JIT flags (`graal_g1`) to emit `-Djdk.graal.TuneInlinerExploration=1` on Java 23+ (keeping `-Dgraal.` on 17/21) and dropped `-Dgraal.CompilerConfiguration=community` so Oracle GraalVM retains its `enterprise` tier.
- **RAM bar & native overhead:** accounted for actual HotSpot C2 code cache (240 MB) vs Graal JIT code cache (384–512 MB), and hid the ZGC SoftMax buffer legend/segment when G1GC is active.
- **Launcher guide:** updated menu navigation and memory instructions to distinguish dual Min/Max memory launchers (Prism, ATLauncher) from single Max-RAM slider launchers (CurseForge, Modrinth).
- **Hardware specs:** separated Apple M1–M4 Pro entries from M* Max labels and fixed FX-8350/8320 naming.
- **Mod configuration schemas (`js/configs.js`):**
  - **BadOptimizations (`config/badoptimizations.txt`):** switched to `key: value` format with all 18 mandatory keys (including `config_version: 6`) and fixed `skycolor_time_change_needed_for_update` spelling to prevent launch failures.
  - **C2ME (`config/c2me.toml`):** replaced nonexistent `maxConcurrentTasks` with `globalExecutorParallelism`, disabled experimental `gcFreeChunkSerializer` (`false`) for Architectury compatibility, emitted integer `chunkStreamVersion = 2` on MC 1.20.x, and switched to `[chunkSystem]` + `useDensityFunctionCompiler` on MC 1.21+.
  - **EntityCulling (`config/entityculling.json`):** updated to schema `configVersion: 9` (`safeMode`, `entityWhitelist`, `captureRate`, `skipEntityCulling`, `skipBlockEntityCulling`, `blockEntityFrustumCulling`, `forceDisplayCulling`, `solidLeaves`, and full default `tickCullingWhitelist`) while removing removed/nonexistent keys.
  - **ImmediatelyFast (`config/immediatelyfast.json`):** replaced hallucinated `dont_add_prod_info_to_crash_reports` with `dont_add_info_into_debug_hud` and left `experimental_sign_text_buffering: false`.
  - **ModernFix (`config/modernfix-mixins.properties`):** restricted generated overrides to safe options (`dynamic_resources`, `faster_item_rendering`, `compact_bit_storage`, and optional `remove_spawn_chunks`).
  - **FerriteCore:** emitted `config/ferritecore.mixin.properties` on Fabric vs `config/ferritecore-mixin.toml` on Forge/NeoForge, adding `dataComponentPatch` on MC 1.20.6+.
  - **Lithium / Radium:** switched to commented troubleshooting guidance so modpack automatic incompatibility disables are never bypassed by blanket `=true` overrides.
  - **Forge & Driver tabs:** added the `[client]` header and `experimentalForgeLightPipelineEnabled = false` in `config/forge-client.toml`, and synchronized `sodium-options.json` vs `embeddium-options.json` references in GPU/OS notes.

### Fixed
- `onRamSliderInput()` now clears `aria-pressed` on all modpack profile cards when the user drags the slider away from a preset.
- Dynamic Graal flag explanation no longer contradicts Java 23+ arguments.
- Updated Linux `-XX:+UseTransparentHugePages` guidance in `js/generator.js` to include `/sys/kernel/mm/transparent_hugepage/shmem_enabled=advise` for ZGC on Java 24/25+.
- `tests/validate-jvm.py` now checks Linux THP/`shmem_enabled` support before running THP combinations and skips OpenJDK-only ZGC profiles on GraalVM <23 (where `EnableJVMCI` is enabled by default).

### Removed
- Contradictory `graal_zgc` engine option (ZGC disables JVMCI on Java 21).
- Dead `-Dfml.readTimeout=180` property, unneeded `-XX:+UnlockDiagnosticVMOptions` (and `-XX:+UnlockExperimentalVMOptions` on ZGC), `-XX:+PerfDisableSharedMem`, and `-XX:MaxMetaspaceSize=2048M`.

### Previously Added (Prior Unreleased Work)
- **Hardware databases**
  - All NVIDIA GPUs (GTX 10/16, RTX 20/30/40/50), AMD GPUs (RX 400 to RX 9000, Vega, Radeon VII) and Intel Arc cards are listed separately, one entry per model and VRAM variant.
  - Popular Xeon models (E3, E5 on X79/X99 and Gold 6130).
  - Many CPUs with integrated graphics: AMD APUs, Intel non-F models, Core Ultra 200S, Pentium, N100/N305.
  - Laptop CPUs (Ryzen 5 5600H/6600H, Core i5-12450H, i7-12700H and others) and 12 notebook GPUs.
  - Apple Silicon (M1 to M4, base and Pro/Max) with unified memory.
  - CPU and GPU data moved to `data/cpus.js` and `data/gpus.js`.
- **Integrated graphics:** an *Integrated Graphics (iGPU)* option detects the iGPU from the selected CPU, with a warning for CPUs without video output.
- **CPU single-thread tier** (low / mid / high / top), with a dedicated diagnostic for low-clock chips such as older Xeons.
- **Recommended in-game settings** (render, simulation and entity distance, shaders) derived from the CPU tier, GPU tier, modpack profile and RAM channels.
- **Memory channels** selector with theoretical bandwidth; single-channel raises the ZGC spike tolerance and the iGPU warning.
- **Notebook logic:** hybrid iGPU + dedicated GPU warning and how to force Java onto the dedicated GPU.
- **Java version selector** (17, 21, 23+), **operating system** selector (Windows, Linux, macOS) and **launcher** selector (Prism/MultiMC, CurseForge, Modrinth, ATLauncher, official, other).
- Linux support: Transparent Huge Pages option and launcher environment variables (Mesa, NVIDIA, PRIME).
- macOS support: Apple chips force macOS, lock the DDR/channel/GPU selectors and recommend an ARM64 Java.
- Dynamic launcher guide explaining where to paste the arguments and the memory values, and avoiding duplicated `-Xms/-Xmx`.
- **Saved configuration:** the full setup is stored in `localStorage` and in the URL hash, with **Share** and **Reset** buttons.
- Automatic JVM engine choice (Temurin + G1GC for CPUs with 6 threads or fewer, or 12 GB of RAM or less).
- Tests (`tests/`), a GitHub Actions workflow running them on Java 17, 21 and 25, and `package.json`.
- **Accessibility:** skip link, global visible focus ring, accessible name for the RAM slider, ARIA tabs with arrow-key navigation for the config files, `aria-pressed` on toggle buttons, `aria-live` toast, `role="alert"` RAM warning, `aria-hidden` on decorative icons, `prefers-reduced-motion` support. Structure checks added to the test suite.

### Changed
- The inline script was split into 11 classic scripts under `js/` (translations, state, handlers, generator, diagnostics, mods, configs, persistence, UI); `index.html` no longer contains logic.
- The page applies the selected language when it opens, so static HTML text can no longer drift from the translations (a test guards it).
- Header badge, Section 2 title/description and the status pill now describe the generated engine instead of always announcing the Graal JIT; AVX and "GraalVM compiler" wording removed from the intro text.
- Contrast: the active language button and the toast use `emerald-700`; small helper texts use `gray-400`. Disabled controls on macOS keep readable labels.
- The engine (vendor + GC) is now independent from the Java version.
- RAM profiles are capped so that at least 2.5 GB stay free after the JVM overhead and the iGPU reserve; the 8 GB *light* profile now gives 4 GB.
- A profile forced by low RAM no longer replaces the profile the user chose.
- EntityCulling `tracingDistance` follows the CPU instead of the VRAM; leaves quality follows a GPU performance tier.
- Config generators use the real Sodium/Embeddium keys (`always_defer_chunk_updates_v2`, `use_no_error_g_l_context`) and Lithium option names.
- Forge: `earlyWindowControl` moved to `fml.toml`; NeoForge only generates `fml.toml`.
- Texts that promised hardware-specific tuning for universal profiles now say "universal profile".

### Fixed
- A hardware tag overflowed the viewport by 18 px on 375 px screens.
- The RAM slider was limited to 24 GB on first load with 32 GB selected.
- A CPU without integrated graphics fell through to the Intel Arc driver text.
- Xeon E5-2680 v4 specs (14C/28T, previously 12C/24T).
- `-XX:+ZGenerational` is no longer emitted outside Java 21.
- The *Oracle GraalVM + ZGC* engine no longer emits Graal JIT flags: the JVM disables JVMCI with ZGC, so they had no effect and produced a warning.

### Removed
- `-XX:UseAVX` (the JVM detects the vector level by itself).
- Unsourced performance claims ("up to 45%", "up to 25% FPS", "doubles FPS").
- The "GraalVM 17" engine (replaced by the Java version selector).
