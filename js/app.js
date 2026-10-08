/**
 * DRIFTVERSE - Master Application Controller & Router
 * POWER. SPEED. CONTROL.
 */
import { store } from "./services/store.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { SearchModal } from "./components/searchModal.js";
import { VideoPlayerModal } from "./components/videoPlayerModal.js";
import { CarDetailModal } from "./components/carDetailModal.js";
import { AuthModal } from "./components/authModal.js";
import { scrollSequence } from "./services/scrollSequence.js";
import { scrollAnimator } from "./services/scrollAnimations.js";

// Pages
import { renderHomePage } from "./pages/home.js";
import { renderVideosPage } from "./pages/videos.js";
import { renderCarsPage } from "./pages/cars.js";
import { renderComparePage } from "./pages/compare.js";
import { renderRankingsPage } from "./pages/rankings.js";
import { renderTrendingPage } from "./pages/trending.js";
import { renderGaragePage } from "./pages/garage.js";
import { renderAdminPage } from "./pages/admin.js";

class DriftverseApp {
  constructor() {
    this.currentRoute = "home";
    this.initialBrandFilter = "All";

    // Component instances
    this.searchModal = null;
    this.videoPlayerModal = null;
    this.carDetailModal = null;
    this.authModal = null;

    this.init();
  }

  init() {
    // 1. Initialize Theme
    document.documentElement.setAttribute("data-theme", store.theme);

    // 2. Initialize Modals
    this.searchModal = new SearchModal();
    this.videoPlayerModal = new VideoPlayerModal();
    this.carDetailModal = new CarDetailModal();
    this.authModal = new AuthModal();

    // 2b. Initialize Scroll Sequence Engine & Bidirectional Scroll Animations
    scrollSequence.init();
    scrollAnimator.init();

    // 3. Register Global Event Listeners
    this.registerEventListeners();

    // 4. Initial Route from URL Hash or default
    const hash = window.location.hash.replace("#", "");
    const validRoutes = ["home", "videos", "cars", "compare", "rankings", "trending", "garage", "admin"];
    if (hash && validRoutes.includes(hash)) {
      this.currentRoute = hash;
    }

    // 5. Render Navigation & Initial View
    this.render();

    // 6. Dismiss Loading Screen with Cinematic Engine Start
    setTimeout(() => {
      const loader = document.getElementById("loading-screen");
      if (loader) {
        loader.classList.add("loaded");
      }
    }, 1200);

    // 7. Subscribe to reactive store changes (e.g. user login, garage updates)
    store.subscribe(() => {
      this.updateNavbar();
    });
  }

  registerEventListeners() {
    // Route Navigation Event
    window.addEventListener("driftverse:navigate", (e) => {
      const route = e.detail?.route || "home";
      this.navigateTo(route);
    });

    // Hash change event (back/forward browser buttons)
    window.addEventListener("hashchange", () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && hash !== this.currentRoute) {
        this.navigateTo(hash, false);
      }
    });

    // Toast Notification Event
    window.addEventListener("driftverse:toast", (e) => {
      const message = e.detail?.message || "";
      this.showToast(message);
    });

    // Brand Filter Navigation Event
    window.addEventListener("driftverse:filter-brand", (e) => {
      this.initialBrandFilter = e.detail?.brand || "All";
    });
  }

  navigateTo(route, updateHash = true) {
    this.currentRoute = route;
    if (updateHash) {
      window.location.hash = `#${route}`;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
    this.render();
  }

  updateNavbar() {
    const navContainer = document.getElementById("navbar-mount");
    if (navContainer) {
      renderNavbar(navContainer, this.currentRoute);
    }
  }

  render() {
    // 1. Render Sticky Header
    this.updateNavbar();

    // 2. Render Active Page View
    const pageContainer = document.getElementById("page-mount");
    if (!pageContainer) return;

    pageContainer.innerHTML = "";

    switch (this.currentRoute) {
      case "home":
        renderHomePage(pageContainer);
        break;
      case "videos":
        renderVideosPage(pageContainer);
        break;
      case "cars":
        renderCarsPage(pageContainer, this.initialBrandFilter);
        this.initialBrandFilter = "All"; // reset once applied
        break;
      case "compare":
        renderComparePage(pageContainer);
        break;
      case "rankings":
        renderRankingsPage(pageContainer);
        break;
      case "trending":
        renderTrendingPage(pageContainer);
        break;
      case "garage":
        renderGaragePage(pageContainer);
        break;
      case "admin":
        renderAdminPage(pageContainer);
        break;
      default:
        renderHomePage(pageContainer);
    }

    // 3. Render Cinematic Footer
    const footerContainer = document.getElementById("footer-mount");
    if (footerContainer) {
      renderFooter(footerContainer);
    }

    // 4. Re-bind and check bidirectional scroll animations for newly rendered view
    setTimeout(() => {
      scrollAnimator.refresh();
      scrollSequence.onScroll();
    }, 50);
  }

  showToast(message) {
    const toastContainer = document.getElementById("toast-container");
    if (!toastContainer) return;

    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <span class="toast-icon">⚡</span>
      <span class="toast-message">${message}</span>
    `;

    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateY(20px)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Instantiate on DOM load
document.addEventListener("DOMContentLoaded", () => {
  window.driftverse = new DriftverseApp();
});
