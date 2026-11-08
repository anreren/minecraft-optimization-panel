<div align="center">

# 🚀 Universal Minecraft Modded Optimizer & Simulator
### *Dynamic JVM Arguments, RAM Allocation & Config Generator Powered by Oracle GraalVM*

<p align="center">
  <img src="https://img.shields.io/badge/Minecraft-1.20.1%20to%201.21.4+-emerald?style=for-the-badge&logo=minecraft&logoColor=white" alt="Minecraft Versions">
  <img src="https://img.shields.io/badge/Java-GraalVM%2021%20%7C%20ZGC-purple?style=for-the-badge&logo=openjdk&logoColor=white" alt="Java GraalVM 21">
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

The **Universal Minecraft Modded Optimizer** solves this by acting as a dynamic rules engine. Instead of static, copy-paste JVM flags, it crosses **9 hardware and software variables** in real-time to generate custom JVM arguments, memory layouts, and mod config files.

---

## 🧠 How the Logic Works (Under the Hood)

The core JavaScript engine calculates and adapts performance parameters using mathematical formulas tied directly to your hardware:

### 1. CPU Thread Allocation (`ConcGCThreads` & `ParallelGCThreads`)
To prevent the Garbage Collector from competing with Minecraft's main render thread, thread limits are mathematically derived from your CPU's core/thread count ($t$):
* **Concurrent GC Threads (`-XX:ConcGCThreads`):** $\max(1, \min(6, \lfloor t \times 0.25 \rfloor))$ — Dedicates ~25% of background threads (capped at 6) to sweep memory asynchronously without stuttering.
* **Parallel GC Threads (`-XX:ParallelGCThreads`):** $\max(2, \min(16, \lceil t \times 0.65 \rceil))$ — Allocates ~65% of threads for rapid recycling passes.
* **Chunk Builder Threads:** Scaled dynamically to your storage drive and core count, preventing I/O starvation.

### 2. Storage I/O & ZGC Spike Tolerance (`-XX:ZAllocationSpikeTolerance`)
The speed at which assets stream from disk dictates how aggressively the Garbage Collector anticipates memory pressure:
* **NVMe M.2 SSD (`5.0`):** High spike tolerance anticipating instant multi-gigabyte texture/chunk dumps.
* **SATA SSD (`3.5`) / Mechanical HDD (`2.0`):** Adjusted tolerances paired with extended read timeouts (`-Dfml.readTimeout=240`) to prevent singleplayer watchdog timeouts.

### 3. RAM Architecture & SoftMax Caching (`-XX:SoftMaxHeapSize`)
Rather than relying on naive maximum heap allocations that cause massive GC pauses when full:
* The optimizer reserves a total heap (e.g., `-Xms12G -Xmx12G`) but enforces a **SoftMaxHeapSize** (e.g., `-XX:SoftMaxHeapSize=10G`).
* This leaves a **2 GB safety cushion** inside the allocated heap to absorb sudden memory spikes (such as flying through ungenerated terrain with an Elytra) without triggering emergency stop-the-world pauses.
* For lower bandwidth memories (**DDR3** or **DDR4 $\le$ 2666 MHz**), it enforces aggressive String deduplication (`-XX:+UseStringDeduplication`) and blockstate compacting (`compactFastMap = true`) to fit working sets inside the CPU's **L3 Cache**.

### 4. Oracle GraalVM JIT Integration (`-XX:+UseJVMCICompiler`)
Optimized for **Oracle GraalVM 21+**, injecting advanced Ahead-Of-Time/Just-In-Time compilation flags:
* `-XX:+UseJVMCICompiler -XX:+EagerJVMCI`
* `-Dgraal.TuneInlinerExploration=1` — Performs deep method inlining on heavy mod loops (mob AI, physics calculations, and tile entities), boosting 1% low framerates by up to 25%.

---

## 🎛️ Interactive Features

* **Hardware Customizer:** Select any CPU (AMD Ryzen / Intel Core / Xeon), GPU (NVIDIA RTX/GTX, AMD Radeon RX, Intel Arc), RAM generation (DDR3 to DDR5 with frequencies from 1066MHz to 8000MHz), and storage type.
* **Bilingual Support (PT-BR / EN-US):** Instant interface switching between Portuguese and English.
* **Dynamic Mod Catalog:** Adapts mod recommendations based on your chosen Mod Loader (**Forge**, **NeoForge**, or **Fabric**) and Minecraft version (**1.20.1** to **1.21.4+**).
* **Config Code Generator:** Auto-generates tailored configuration files for *ModernFix*, *Embeddium/Sodium*, *FerriteCore*, *EntityCulling*, *ImmediatelyFast*, *BadOptimizations*, *Radium/Lithium*, and GPU Driver control panels.
* **Interactive Checklist:** Tracks your setup progress across instances with `localStorage` persistence.

---

## 🛠️ Tech Stack

* **Frontend:** Pure HTML5, Tailwind CSS (via CDN), and FontAwesome.
* **Logic:** Vanilla JavaScript (ES6+), real-time reactive recalculations.
* **Deployment:** Hosted statically via **GitHub Pages**.

---

## 📜 License

Distributed under the [MIT License](LICENSE). Feel free to fork, adapt, and use this tool to optimize your modded Minecraft experience!
