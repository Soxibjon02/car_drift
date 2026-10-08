/**
 * DRIFTVERSE - Cinematic Scroll Image Sequence Engine
 * Controls 282 high-fps automotive drift frames synced with scroll position
 * Inspired by Porsche / Apple product experience architecture
 */

export class ScrollSequenceEngine {
  constructor() {
    this.totalFrames = 282;
    this.images = new Array(this.totalFrames);
    this.loadedCount = 0;
    this.currentFrameIndex = 0;
    this.targetFrameIndex = 0;
    this.isInitialized = false;
    this.isRunning = false;
    this.rafId = null;

    // DOM references
    this.container = null;
    this.canvas = null;
    this.ctx = null;
    this.hudElement = null;
    this.hudFrameVal = null;
    this.hudAngleVal = null;
    this.hudProgressBar = null;

    // Concurrency limit for background image preloading
    this.preloadBatchSize = 8;
  }

  init() {
    if (this.isInitialized) return;

    this.createDomElements();
    this.handleResize();
    this.bindEvents();

    // 1. Preload the first critical frames immediately for instant visual
    this.preloadInitialFrames(24).then(() => {
      this.drawFrame(0);
      // 2. Lazily queue remaining frames without stalling the main thread
      this.startBackgroundPreload();
    });

    this.isInitialized = true;
    this.startRenderLoop();
  }

  createDomElements() {
    // Check if container already exists
    let container = document.getElementById("scroll-canvas-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "scroll-canvas-container";
      container.innerHTML = `
        <canvas id="scroll-sequence-canvas"></canvas>
        <div class="scroll-canvas-scrim"></div>
        <div class="scroll-telemetry-hud" id="scroll-telemetry-hud" title="Scroll-driven Drift Telemetry">
          <div class="telemetry-pulse-dot"></div>
          <div>DRIFT TELEMETRY</div>
          <div style="color:var(--text-primary);"><span id="hud-frame-val">001</span>/282</div>
          <div style="color:var(--accent);"><span id="hud-angle-val">0</span>° ANGLE</div>
          <div class="telemetry-scrub-bar">
            <div class="telemetry-scrub-progress" id="hud-scrub-progress"></div>
          </div>
        </div>
      `;
      // Insert right after body start so it sits as background
      document.body.insertBefore(container, document.body.firstChild);
    }

    this.container = container;
    this.canvas = document.getElementById("scroll-sequence-canvas");
    this.ctx = this.canvas.getContext("2d", { alpha: false });

    this.hudElement = document.getElementById("scroll-telemetry-hud");
    this.hudFrameVal = document.getElementById("hud-frame-val");
    this.hudAngleVal = document.getElementById("hud-angle-val");
    this.hudProgressBar = document.getElementById("hud-scrub-progress");
  }

  getFrameUrl(index) {
    const frameNum = String(index + 1).padStart(3, "0");
    return `animation images/ezgif-frame-${frameNum}.jpg`;
  }

  preloadImage(index) {
    if (this.images[index]) {
      return Promise.resolve(this.images[index]);
    }

    return new Promise((resolve) => {
      const img = new Image();
      img.src = this.getFrameUrl(index);
      img.onload = () => {
        this.images[index] = img;
        this.loadedCount++;
        resolve(img);
      };
      img.onerror = () => {
        // Fallback or retry
        resolve(null);
      };
    });
  }

  async preloadInitialFrames(count) {
    const promises = [];
    const limit = Math.min(count, this.totalFrames);
    for (let i = 0; i < limit; i++) {
      promises.push(this.preloadImage(i));
    }
    await Promise.all(promises);
  }

  startBackgroundPreload() {
    let nextIndex = 24;

    const loadNextBatch = () => {
      if (nextIndex >= this.totalFrames) return;

      const batchPromises = [];
      const end = Math.min(nextIndex + this.preloadBatchSize, this.totalFrames);
      for (let i = nextIndex; i < end; i++) {
        batchPromises.push(this.preloadImage(i));
      }
      nextIndex = end;

      Promise.all(batchPromises).then(() => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(loadNextBatch, { timeout: 100 });
        } else {
          setTimeout(loadNextBatch, 30);
        }
      });
    };

    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(loadNextBatch, { timeout: 100 });
    } else {
      setTimeout(loadNextBatch, 60);
    }
  }

  handleResize() {
    if (!this.canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const width = window.innerWidth;
    const height = window.innerHeight;

    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = `${width}px`;
    this.canvas.style.height = `${height}px`;

    if (this.ctx) {
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
      this.ctx.imageSmoothingQuality = "high";
    }

    // Redraw current frame
    this.drawFrame(Math.round(this.currentFrameIndex));
  }

  onScroll() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return;

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollFraction = Math.max(0, Math.min(1, scrollY / docHeight));

    // Map scroll percentage to frame index
    this.targetFrameIndex = scrollFraction * (this.totalFrames - 1);

    // Update HUD progress bar immediately
    if (this.hudProgressBar) {
      this.hudProgressBar.style.width = `${(scrollFraction * 100).toFixed(1)}%`;
    }
  }

  bindEvents() {
    window.addEventListener("resize", () => this.handleResize(), { passive: true });
    window.addEventListener("scroll", () => this.onScroll(), { passive: true });
  }

  findNearestLoadedFrame(idealIndex) {
    idealIndex = Math.max(0, Math.min(this.totalFrames - 1, Math.round(idealIndex)));
    if (this.images[idealIndex]) {
      return this.images[idealIndex];
    }

    // Search outwards for closest available frame
    for (let offset = 1; offset < this.totalFrames; offset++) {
      if (idealIndex - offset >= 0 && this.images[idealIndex - offset]) {
        return this.images[idealIndex - offset];
      }
      if (idealIndex + offset < this.totalFrames && this.images[idealIndex + offset]) {
        return this.images[idealIndex + offset];
      }
    }
    return null;
  }

  drawFrame(index) {
    if (!this.ctx || !this.canvas) return;

    const img = this.findNearestLoadedFrame(index);
    if (!img) return;

    const width = window.innerWidth;
    const height = window.innerHeight;

    // Aspect-ratio cover math
    const imgRatio = img.width / img.height;
    const canvasRatio = width / height;

    let drawWidth, drawHeight, offsetX, offsetY;

    if (canvasRatio > imgRatio) {
      drawWidth = width;
      drawHeight = width / imgRatio;
      offsetX = 0;
      offsetY = (height - drawHeight) / 2;
    } else {
      drawWidth = height * imgRatio;
      drawHeight = height;
      offsetX = (width - drawWidth) / 2;
      offsetY = 0;
    }

    this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);

    // Update HUD labels
    if (this.hudFrameVal) {
      this.hudFrameVal.textContent = String(Math.round(index) + 1).padStart(3, "0");
    }
    if (this.hudAngleVal) {
      // Calculate realistic drift angle derived from scrub position (e.g., 0 to 65 degrees)
      const angle = Math.round(Math.sin((index / this.totalFrames) * Math.PI) * 62);
      this.hudAngleVal.textContent = Math.abs(angle);
    }
  }

  startRenderLoop() {
    this.isRunning = true;

    const loop = () => {
      if (!this.isRunning) return;

      // Smooth interpolation (lerp) towards target frame for buttery motion
      const diff = this.targetFrameIndex - this.currentFrameIndex;
      if (Math.abs(diff) > 0.05) {
        this.currentFrameIndex += diff * 0.18;
        this.drawFrame(this.currentFrameIndex);
      } else if (Math.abs(diff) > 0.001) {
        this.currentFrameIndex = this.targetFrameIndex;
        this.drawFrame(this.currentFrameIndex);
      }

      this.rafId = requestAnimationFrame(loop);
    };

    this.rafId = requestAnimationFrame(loop);
  }

  destroy() {
    this.isRunning = false;
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
  }
}

// Global Singleton
export const scrollSequence = new ScrollSequenceEngine();
