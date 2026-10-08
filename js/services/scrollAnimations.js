/**
 * DRIFTVERSE - Bidirectional Scroll Animation Controller
 * Handles 3 distinct high-impact scroll effects with symmetrical reversal on scroll up:
 * 1. Shattered assembly (.scroll-shatter-section)
 * 2. Two-sided convergence (.scroll-split-section)
 * 3. Progressive depth-of-field unblur (.scroll-blur-section)
 */

export class ScrollAnimationController {
  constructor() {
    this.elements = [];
    this.blurSections = [];
    this.isTicking = false;
    this.lastScrollY = window.scrollY;
  }

  init() {
    this.scan();
    this.bindEvents();
    // Run an initial pass
    this.checkScroll();
  }

  scan() {
    // Gather all animated elements
    const targets = document.querySelectorAll(
      ".scroll-shatter-section, .scroll-split-section, .scroll-blur-section"
    );
    this.elements = Array.from(targets);
    this.blurSections = Array.from(document.querySelectorAll(".scroll-blur-section"));
  }

  bindEvents() {
    window.addEventListener(
      "scroll",
      () => {
        if (!this.isTicking) {
          window.requestAnimationFrame(() => {
            this.checkScroll();
            this.isTicking = false;
          });
          this.isTicking = true;
        }
      },
      { passive: true }
    );

    window.addEventListener("resize", () => {
      this.checkScroll();
    }, { passive: true });
  }

  checkScroll() {
    const windowHeight = window.innerHeight;
    const currentScrollY = window.scrollY || window.pageYOffset;
    const isScrollingDown = currentScrollY >= this.lastScrollY;
    this.lastScrollY = currentScrollY;

    // Trigger bounds
    const enterTrigger = windowHeight * 0.86;
    const exitTrigger = windowHeight * 0.08;

    this.elements.forEach((el) => {
      const rect = el.getBoundingClientRect();

      // Check if element is comfortably within view
      const isInView = rect.top < enterTrigger && rect.bottom > exitTrigger;

      if (isInView) {
        if (!el.classList.contains("in-view")) {
          el.classList.add("in-view");
        }
      } else {
        // When user scrolls back UP (or past), reversibly remove 'in-view' class!
        if (el.classList.contains("in-view")) {
          el.classList.remove("in-view");
        }
      }
    });

    // Continuous blur unblur for high-precision tactile feel
    this.blurSections.forEach((section) => {
      const rect = section.getBoundingClientRect();
      const items = section.querySelectorAll(".blur-item");
      if (!items.length) return;

      // Calculate how far into the viewport the section has scrolled (0 to 1)
      const visibleDistance = windowHeight - rect.top;
      const totalRange = windowHeight * 0.7;
      const ratio = Math.max(0, Math.min(1, visibleDistance / totalRange));

      if (section.classList.contains("in-view")) {
        // Fine-tune custom property for continuous blur clearing
        section.style.setProperty("--scroll-reveal-ratio", ratio.toFixed(2));
      } else {
        section.style.removeProperty("--scroll-reveal-ratio");
      }
    });
  }

  refresh() {
    // Re-scan when routes change or DOM is updated
    this.scan();
    this.checkScroll();
  }
}

// Global Singleton
export const scrollAnimator = new ScrollAnimationController();
