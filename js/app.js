/**
 * DRIFTVERSE - Master Application Controller & Router
 * POWER. SPEED. CONTROL.
 */
import { store } from "./services/store.js";
import { api } from "./services/api.js";
import { renderNavbar } from "./components/navbar.js";
import { renderFooter } from "./components/footer.js";
import { SearchModal } from "./components/searchModal.js";
import { VideoPlayerModal } from "./components/videoPlayerModal.js";
import { CarDetailModal } from "./components/carDetailModal.js";
import { AuthModal } from "./components/authModal.js";
import { scrollSequence } from "./services/scrollSequence.js";
import { scrollAnimator } from "./services/scrollAnimations.js";
import { pwa } from "./services/pwa.js";

// Pages
import { renderHomePage } from "./pages/home.js";
import { renderVideosPage } from "./pages/videos.js";
import { renderWatchPage } from "./pages/watch.js";
import { renderCarsPage } from "./pages/cars.js";
import { renderComparePage } from "./pages/compare.js";
import { renderRankingsPage } from "./pages/rankings.js";
import { renderTrendingPage } from "./pages/trending.js";
import { renderGaragePage } from "./pages/garage.js";
import { renderWallpapersPage } from "./pages/wallpapers.js";
import { renderAdminPage } from "./pages/admin.js";

class DriftverseApp {
  constructor() {
    this.currentRoute = "home";
    this.currentWatchId = null;
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
    this.carDetailModal = new CarDetailModal();
    this.authModal = new AuthModal();

    // 2b. Initialize Scroll Sequence Engine & Bidirectional Scroll Animations
    scrollSequence.init();
    scrollAnimator.init();

    // 3. Register Global Event Listeners
    this.registerEventListeners();

    // 4. Initial Route from URL Hash or default
    const rawHash = window.location.hash.replace("#", "");
    const baseRoute = rawHash.split("?")[0].split("/")[0];
    const validRoutes = ["home", "videos", "watch", "cars", "wallpapers", "compare", "rankings", "trending", "garage", "admin"];
    if (baseRoute && validRoutes.includes(baseRoute)) {
      this.currentRoute = baseRoute;
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

    // 8. Sync live Videos and Auth with Neon PostgreSQL Backend
    api.getVideos().then((freshVideos) => {
      if (Array.isArray(freshVideos)) {
        store.videos = freshVideos.map((fv) => ({
          ...fv,
          id: fv.id,
          youtube_id: fv.youtube_id,
          likes: fv.likes_count !== undefined ? fv.likes_count : (fv.likes || 0),
          uploadDate: fv.created_at ? fv.created_at.split("T")[0] : "2024-09-15",
          isTrending: true,
          isFeatured: true
        }));
        try {
          localStorage.setItem("driftverse_videos_v1", JSON.stringify(store.videos));
        } catch {}
        store.notify();
        if (this.currentRoute === "home" || this.currentRoute === "videos" || this.currentRoute === "trending" || this.currentRoute === "watch") {
          this.render();
        }
      }
    }).catch(() => {});

    // 8b. Sync Wallpapers & Media with Neon PostgreSQL Backend
    api.getImages().then((freshImages) => {
      if (Array.isArray(freshImages)) {
        store.images = freshImages;
        try {
          localStorage.setItem("driftverse_images_v1", JSON.stringify(freshImages));
        } catch {}
        store.notify();
        if (this.currentRoute === "wallpapers") {
          this.render();
        }
      }
    }).catch(() => {});

    api.getCurrentUser().then((currentUser) => {
      if (currentUser) {
        store.setCurrentUser(currentUser);
        this.updateNavbar();
      }
    }).catch(() => {});
  }

  registerEventListeners() {
    // Route Navigation Event
    window.addEventListener("driftverse:navigate", (e) => {
      const route = e.detail?.route || "home";
      this.navigateTo(route);
    });

    // Dedicated Watch Video Event (Replaces modal with dedicated page)
    window.addEventListener("driftverse:watch-video", (e) => {
      const videoId = e.detail?.videoId;
      if (videoId) {
        this.currentWatchId = videoId;
        this.navigateTo(`watch?id=${encodeURIComponent(videoId)}`);
      } else {
        this.navigateTo("videos");
      }
    });

    // Auth Changed Event
    window.addEventListener("driftverse:auth-changed", () => {
      this.updateNavbar();
      if (this.currentRoute === "admin" || this.currentRoute === "garage") {
        this.render();
      }
    });

    // Hash change event (back/forward browser buttons)
    window.addEventListener("hashchange", () => {
      const rawHash = window.location.hash.replace("#", "");
      if (rawHash) {
        this.navigateTo(rawHash, false);
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
    const raw = route.replace("#", "");
    const base = raw.split("?")[0].split("/")[0];
    this.currentRoute = base;

    if (base === "watch") {
      const matchParam = raw.match(/[?&]id=([^&]+)/);
      if (matchParam) {
        this.currentWatchId = decodeURIComponent(matchParam[1]);
      } else {
        const matchSlash = raw.match(/^watch\/(.+)$/);
        if (matchSlash) this.currentWatchId = decodeURIComponent(matchSlash[1]);
      }
    }

    if (updateHash) {
      window.location.hash = `#${raw}`;
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
      case "watch":
        renderWatchPage(pageContainer, this.currentWatchId);
        break;
      case "cars":
        renderCarsPage(pageContainer, this.initialBrandFilter);
        this.initialBrandFilter = "All"; // reset once applied
        break;
      case "wallpapers":
        renderWallpapersPage(pageContainer);
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
