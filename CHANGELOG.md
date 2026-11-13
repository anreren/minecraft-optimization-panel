# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added
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
