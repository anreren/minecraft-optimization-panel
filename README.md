<div align="center">

# 🚀 Universal Minecraft Modded Optimizer & Simulator
### *Dynamic JVM Arguments, RAM Allocation & Config Generator for Java 21 (Oracle GraalVM / Temurin)*

<p align="center">
  <img src="https://img.shields.io/badge/Minecraft-1.20.1%20to%201.21.4+-emerald?style=for-the-badge&logo=minecraft&logoColor=white" alt="Minecraft Versions">
  <img src="https://img.shields.io/badge/Java%2021-GraalVM%20%7C%20Temurin%20%7C%20ZGC%20%7C%20G1-purple?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java 21 (GraalVM / Temurin)">
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

### 1. JVM Engine Auto-Selection (GraalVM + ZGC vs. Temurin + G1)
Concurrent GC threads and the Graal JIT compiler both compete with the game for cores and memory, so the best engine depends on your machine:
* **6 threads or fewer, or 12 GB of RAM or less:** switches to **OpenJDK / Temurin 21 + G1GC** (HotSpot C2 JIT, no Graal flags, lower memory overhead).
* **More than 6 threads and more than 12 GB:** uses **Oracle GraalVM 21 + Generational ZGC**.
* The engine can always be overridden manually, and your choice is kept when you change other hardware.
* `-XX:UseAVX` is intentionally **not** set: the JVM detects the supported vector level on its own.

### 2. CPU Thread Allocation (`ConcGCThreads` & `ParallelGCThreads`)
Each CPU in the database carries its own values, roughly **25% of its threads** for concurrent GC and **60%** for parallel GC, leaving cores free for the main/render thread and the integrated server:
* **Chunk builder threads** (Sodium/Embeddium) and **C2ME threads** are also taken from the CPU entry. APUs and low-power chips get one thread less, since their iGPU shares memory bandwidth.
* **EntityCulling `tracingDistance`** follows the CPU (128 with 12+ threads, 96 with 8+, otherwise 64), because the visibility raytracing runs on the CPU.
* **Leaves quality and shader advice** follow a per-GPU performance tier (low / entry / mid / high / ultra), not VRAM size.

### 3. Storage I/O & ZGC Spike Tolerance (`-XX:ZAllocationSpikeTolerance`)
ZGC engines only. A higher value makes the collector start a cycle earlier ahead of an allocation spike:
* **NVMe M.2 SSD (`5.0`)**, **SATA SSD (`3.5`)**, **Mechanical HDD (`2.0`, the JVM default)**.
* `+0.5` (capped at `5.0`) on slow memory (**DDR3** or **DDR4 ≤ 2666 MHz**), where a cycle takes longer to finish.
* This is a heuristic: if the GC uses too much CPU, go back to `2.0`.
* `-Dfml.readTimeout=180` is added to every profile to avoid singleplayer watchdog timeouts. `dynamic_resources` is turned off by default on HDDs.

### 4. RAM Budget & SoftMax Caching (`-XX:SoftMaxHeapSize`)
* The optimizer reserves a fixed heap (e.g. `-Xms12G -Xmx12G`) and, on ZGC, sets a **SoftMaxHeapSize** (e.g. `10G`) so the collector tries to stay below it and keeps the rest as headroom for allocation spikes. The cushion is **2 GB** for allocations of 9 GB or more, otherwise **1 GB**.
* Modpack profiles (light / medium / heavy / extreme) are capped so that at least **2.5 GB stay free** for the OS after the JVM overhead (Metaspace + code cache) and, when using integrated graphics, up to **2 GB reserved for the iGPU**. A warning appears if you push the slider past that.
* On slow memory the tool does not change any flag: it recommends keeping FerriteCore and ModernFix installed and enabling XMP/DOCP in the BIOS.

### 5. Oracle GraalVM JIT Flags (`-XX:+UseJVMCICompiler`)
Used only by the GraalVM engines:
* `-XX:+UseJVMCICompiler -XX:+EagerJVMCI -Dgraal.TuneInlinerExploration=1 -Dgraal.CompilerConfiguration=community`
* More exploratory inlining on heavy mod loops. The gain varies by modpack, and the JIT spends extra CPU and RAM while warming up, which is why weaker machines are moved to Temurin + G1.

---

## 🎛️ Interactive Features

* **Hardware Customizer:** Pick your CPU (AMD Ryzen / APUs / Athlon / FX, Intel Core / Core Ultra / Pentium, popular **Xeon** E3, E5 and Gold models, plus laptop and mini-PC chips), GPU (NVIDIA GTX 10/16 and RTX 20/30/40/50, AMD RX 400 to RX 9000 and Vega, Intel Arc), RAM generation (DDR3 to DDR5, 1066 to 8000 MHz) and storage type. Every GPU model and VRAM variant is listed separately.
* **Integrated Graphics Detection:** Choose *Integrated Graphics (iGPU)* in the GPU list and the iGPU is detected from the selected CPU (e.g. Ryzen 3 3200G → Radeon Vega 8, Core i5-12400 → UHD 730). CPUs without video output (F/KF models, FX, Xeon) trigger a warning, and shared-memory advice replaces the VRAM alerts.
* **Bilingual Support (PT-BR / EN-US):** Instant interface switching between Portuguese and English.
* **Dynamic Mod Catalog:** Adapts mod recommendations based on your chosen Mod Loader (**Forge**, **NeoForge**, or **Fabric**) and Minecraft version (**1.20.1** to **1.21.4+**).
* **Config Code Generator:** Auto-generates configuration files for *ModernFix*, *Embeddium/Sodium*, *FerriteCore*, *EntityCulling*, *ImmediatelyFast*, *BadOptimizations*, *Radium/Lithium*, *C2ME* (Fabric), *Forge/NeoForge* (`fml.toml`, plus `forge-client.toml` on Forge) and GPU driver control panels. Only some files depend on your hardware (Embeddium/Sodium, EntityCulling, ModernFix, loader tab); the others are universal profiles.
* **Interactive Checklist:** Tracks your setup progress across instances with `localStorage` persistence.

---

## ⚠️ Notes & Limitations

* The generated option names follow **Sodium 0.5/0.6** and **Embeddium 0.3**. Mods ignore unknown keys silently, so if the config file created by your own mod version uses different names, trust its names.
* Thread counts, GC values and tiers are heuristics. Minecraft is mostly bound by single-thread speed, so a many-thread, low-clock CPU (such as an older Xeon) gains chunk-builder threads but will not match a modern desktop CPU.
* Java 21 is required from Minecraft 1.20.5. Some 1.20.1 packs with older mods still need Java 17, which is why a GraalVM 17 option exists.

---

## 🛠️ Tech Stack

* **Frontend:** Pure HTML5, Tailwind CSS (via CDN), and FontAwesome.
* **Logic:** Vanilla JavaScript (ES6+), real-time reactive recalculations.
* **Deployment:** Hosted statically via **GitHub Pages**.

---

## 📜 License

Distributed under the [MIT License](LICENSE). Feel free to fork, adapt, and use this tool to optimize your modded Minecraft experience!
