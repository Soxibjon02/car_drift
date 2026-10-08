# DRIFTVERSE — Premium Automotive Experience

DRIFTVERSE is a high-end, editorial automotive platform inspired by the design aesthetics of **Porsche, BMW M, Top Gear, and Carwow**. Built with high-performance responsive web technologies, real-time scroll sequence animation, and dynamic telemetry analysis.

---

## ⚡ Key Features

* **Scroll-Synchronized Cinematic Sequence:** 90-frame high-resolution drift motion rendered in real time onto an optimized HTML5 Canvas with Hi-DPI scaling.
* **Translucent Frosted Glass Architecture:** Semi-transparent cards with real-time blur and depth (`backdrop-filter`) allowing background motion to shine through with extreme sharpness.
* **Dual Theme Engine (Dark & Showroom Daytime):** Seamless one-click transition between stealth matte carbon dark mode and ultra-clean editorial white daytime mode.
* **Dynamic Automotive Telemetry:**
  * Real-time tachometer preloader with progressive acceleration sound.
  * Head-to-Head 2-car Dyno telemetry comparison with live torque, power, 0-100 km/h, and top speed metrics.
  * Interactive engine sound synthesizer & exhaust rev simulator.
* **Interactive Vehicle Vault:** Multi-category filtering (Hypercars, JDM, Supercars, Track-Day, Drift Specials), specification modals, and custom sound audio playback.

---

## 🚀 Quick Start

Run locally with any static web server:

```bash
# Using Node.js serve
npx serve . -l 3000
```

Open `http://localhost:3000` in your browser.

---

## 🛠️ Tech Stack

* **Structure:** Pure Vanilla Semantic HTML5
* **Styling:** Modular Vanilla CSS (Design Tokens, Glassmorphism, Theme-Aware Variables)
* **Logic:** Vanilla Modular ES6 JavaScript
* **Audio:** Web Audio API Sound Synthesizer + Custom Audio Stems
