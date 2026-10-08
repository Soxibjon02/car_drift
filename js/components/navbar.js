/**
 * DRIFTVERSE - Navbar & Navigation Component (Automotive Editorial Redesign)
 */
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";
import { authService } from "../services/auth.js";

export function renderNavbar(container, activeRoute = "home") {
  const user = store.currentUser;
  const isDark = store.theme === "dark";
  const soundOn = store.soundEnabled;

  const compareCount = store.compareList.length;

  container.innerHTML = `
    <header class="navbar" id="app-navbar">
      <div class="container navbar-container">
        <!-- Brand Logo -->
        <a class="brand-logo" data-route="home">
          <div class="brand-logo-icon">▲</div>
          <div class="brand-logo-text">DRIFT<span>VERSE</span></div>
        </a>

        <!-- Desktop Navigation Links (Editorial Grotesk) -->
        <ul class="nav-links">
          <li><a class="nav-link ${activeRoute === "home" ? "active" : ""}" data-route="home">Home</a></li>
          <li><a class="nav-link ${activeRoute === "cars" ? "active" : ""}" data-route="cars">Cars</a></li>
          <li><a class="nav-link ${activeRoute === "videos" ? "active" : ""}" data-route="videos">Videos</a></li>
          <li>
            <a class="nav-link ${activeRoute === "compare" ? "active" : ""}" data-route="compare">
              Compare ${compareCount > 0 ? `<span class="badge" style="padding:1px 6px; font-size:10px; margin-left:3px;">${compareCount}</span>` : ""}
            </a>
          </li>
          <li><a class="nav-link ${activeRoute === "rankings" ? "active" : ""}" data-route="rankings">Rankings</a></li>
          <li><a class="nav-link ${activeRoute === "trending" ? "active" : ""}" data-route="trending">Trending</a></li>
          <li><a class="nav-link ${activeRoute === "wallpapers" ? "active" : ""}" data-route="wallpapers">Wallpapers</a></li>
          <li><a class="nav-link ${activeRoute === "garage" ? "active" : ""}" data-route="garage">Garage</a></li>
        </ul>

        <!-- Action Buttons -->
        <div class="nav-actions">
          <!-- Global Search Button -->
          <button class="nav-action-btn" id="btn-search-trigger" title="Search (Ctrl+K)">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </button>

          <!-- PWA Install Button -->
          <button class="nav-action-btn" id="btn-pwa-install" title="Ilovani o'rnatish (Install App)" style="display:none; color:var(--accent);">
            📥
          </button>

          <!-- Audio Engine FX Toggle -->
          <button class="nav-action-btn" id="btn-sound-toggle" title="Acoustic Audio FX: ${soundOn ? 'ON' : 'OFF'}">
            <span style="font-size:0.8rem; font-family:var(--font-mono); font-weight:700;">${soundOn ? "FX" : "MUTE"}</span>
          </button>

          <!-- Theme Toggle -->
          <button class="nav-action-btn" id="btn-theme-toggle" title="Toggle Showroom Lighting">
            ${isDark ? "☀" : "☾"}
          </button>

          <!-- Mobile Hamburger Toggle -->
          <button class="nav-action-btn mobile-menu-toggle" id="btn-mobile-menu" aria-label="Open Navigation Menu">
            ☰
          </button>

          <!-- User Profile / Auth Button -->
          <div class="user-profile-menu">
            ${
              user
                ? `
              <div class="user-btn" id="btn-user-dropdown-toggle">
                <img src="${user.avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(user.username || user.name || 'driver')}" class="user-avatar" alt="${user.username || user.name}" />
                <span class="user-name">${user.username || user.name}</span>
                <span style="font-size:0.65rem; color:var(--text-muted);">▼</span>
              </div>
              <div class="user-dropdown" id="user-dropdown-menu">
                <div class="dropdown-header">
                  <div style="font-weight:600; font-size:0.825rem; color:var(--text-primary);">${user.username || user.name}</div>
                  <div class="dropdown-user-role" style="font-size:0.7rem; color:var(--accent); text-transform:uppercase;">${user.role || 'Pilot'}</div>
                </div>
                <div class="dropdown-item" data-route="garage">Mening Garajim (${user.garageCars?.length || 0})</div>
                <div style="border-top:1px solid var(--border-subtle); margin:4px 0;"></div>
                <div class="dropdown-item" id="btn-user-logout" style="color:#FF453A;">Chiqish (Logout)</div>
              </div>
            `
                : `
              <button class="btn btn-primary btn-sm" id="btn-auth-login">
                Kirish / Ro'yxat
              </button>
            `
            }
          </div>
        </div>
      </div>
    </header>

    <!-- Mobile Slide-out Drawer (Clean Full Height Editorial) -->
    <div class="mobile-drawer-overlay" id="mobile-drawer-overlay">
      <div class="mobile-drawer">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid var(--border-subtle);">
          <div class="brand-logo-text" style="font-size:1.15rem; font-weight:800;">DRIFT<span style="color:var(--accent);">VERSE</span></div>
          <button class="modal-close-btn" id="btn-close-drawer" style="position:static;">✕</button>
        </div>

        <!-- PWA Install Button in Drawer -->
        <button class="btn btn-primary" id="drawer-btn-pwa-install" style="display:flex; align-items:center; justify-content:center; gap:8px; font-size:0.85rem; padding:12px; margin-bottom:12px; width:100%;">
          📱 Ilovani O'rnatish (Install App)
        </button>

        <!-- Quick Controls inside Drawer -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-bottom:16px;">
          <button class="btn btn-secondary btn-sm" id="drawer-btn-search" style="font-size:0.75rem;">🔍 Qidiruv</button>
          <button class="btn btn-secondary btn-sm" id="drawer-btn-sound" style="font-size:0.75rem;">${soundOn ? '🔊 Ovoz: ON' : '🔇 Ovoz: OFF'}</button>
        </div>

        <a class="nav-link ${activeRoute === "home" ? "active" : ""}" data-route="home">Home</a>
        <a class="nav-link ${activeRoute === "cars" ? "active" : ""}" data-route="cars">Cars</a>
        <a class="nav-link ${activeRoute === "videos" ? "active" : ""}" data-route="videos">Videos</a>
        <a class="nav-link ${activeRoute === "compare" ? "active" : ""}" data-route="compare">Compare</a>
        <a class="nav-link ${activeRoute === "rankings" ? "active" : ""}" data-route="rankings">Rankings</a>
        <a class="nav-link ${activeRoute === "trending" ? "active" : ""}" data-route="trending">Trending</a>
        <a class="nav-link ${activeRoute === "wallpapers" ? "active" : ""}" data-route="wallpapers">Wallpapers</a>
        <a class="nav-link ${activeRoute === "garage" ? "active" : ""}" data-route="garage">My Garage</a>
      </div>
    </div>
  `;

  // Attach Event Handlers
  attachNavbarEvents(container);
}

function attachNavbarEvents(container) {
  // Navigation Route Clicks
  container.querySelectorAll("[data-route]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const route = el.getAttribute("data-route");
      soundEngine.playClick();
      // Close mobile drawer if open
      const drawer = document.getElementById("mobile-drawer-overlay");
      if (drawer) drawer.classList.remove("open");
      const dropdown = document.getElementById("user-dropdown-menu");
      if (dropdown) dropdown.classList.remove("open");

      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route } }));
    });
  });

  // Search Trigger
  const searchBtn = container.querySelector("#btn-search-trigger");
  if (searchBtn) {
    searchBtn.addEventListener("click", () => {
      soundEngine.playClick();
      window.dispatchEvent(new CustomEvent("driftverse:open-search"));
    });
  }

  // Audio FX Toggle
  const soundBtn = container.querySelector("#btn-sound-toggle");
  if (soundBtn) {
    soundBtn.addEventListener("click", () => {
      const active = store.toggleSound();
      if (active) soundEngine.playRev("turbo-v6");
      soundBtn.querySelector("span").textContent = active ? "FX" : "MUTE";
      soundBtn.title = `Acoustic Audio FX: ${active ? "ON" : "OFF"}`;
    });
  }

  // Theme Toggle
  const themeBtn = container.querySelector("#btn-theme-toggle");
  if (themeBtn) {
    themeBtn.addEventListener("click", () => {
      soundEngine.playClick();
      const next = store.toggleTheme();
      themeBtn.innerHTML = next === "dark" ? "☀" : "☾";
    });
  }

  // User Dropdown Toggle
  const userBtn = container.querySelector("#btn-user-dropdown-toggle");
  const userDropdown = container.querySelector("#user-dropdown-menu");
  if (userBtn && userDropdown) {
    userBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      userDropdown.classList.toggle("open");
    });

    document.addEventListener("click", () => {
      userDropdown.classList.remove("open");
    });
  }

  // Quick Demo Role Switches
  const switchAdminBtn = container.querySelector("#demo-switch-admin");
  if (switchAdminBtn) {
    switchAdminBtn.addEventListener("click", () => {
      authService.demoSwitchRole("Admin");
      window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Switched to Administrator: Commander Drift" } }));
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "admin" } }));
    });
  }

  const switchUserBtn = container.querySelector("#demo-switch-user");
  if (switchUserBtn) {
    switchUserBtn.addEventListener("click", () => {
      authService.demoSwitchRole("User");
      window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Switched to Pro Driver: Alex Apex" } }));
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "home" } }));
    });
  }

  // Auth Login trigger
  const loginBtn = container.querySelector("#btn-auth-login");
  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      soundEngine.playClick();
      window.dispatchEvent(new CustomEvent("driftverse:open-auth"));
    });
  }

  // Logout trigger
  const logoutBtn = container.querySelector("#btn-user-logout");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      soundEngine.playClick();
      authService.logout();
      window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Signed out. Browsing as Guest." } }));
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "home" } }));
    });
  }

  // Mobile Drawer Toggle
  const mobileMenuBtn = container.querySelector("#btn-mobile-menu");
  const drawerOverlay = container.querySelector("#mobile-drawer-overlay");
  const closeDrawerBtn = container.querySelector("#btn-close-drawer");

  if (mobileMenuBtn && drawerOverlay) {
    mobileMenuBtn.addEventListener("click", () => {
      drawerOverlay.classList.add("open");
    });
  }

  if (closeDrawerBtn && drawerOverlay) {
    closeDrawerBtn.addEventListener("click", () => {
      drawerOverlay.classList.remove("open");
    });
  }

  const drawerSearchBtn = container.querySelector("#drawer-btn-search");
  if (drawerSearchBtn && drawerOverlay) {
    drawerSearchBtn.addEventListener("click", () => {
      soundEngine.playClick();
      drawerOverlay.classList.remove("open");
      window.dispatchEvent(new CustomEvent("driftverse:open-search"));
    });
  }

  const drawerSoundBtn = container.querySelector("#drawer-btn-sound");
  if (drawerSoundBtn) {
    drawerSoundBtn.addEventListener("click", () => {
      const active = store.toggleSound();
      if (active) soundEngine.playRev("turbo-v6");
      drawerSoundBtn.textContent = active ? "🔊 Ovoz: ON" : "🔇 Ovoz: OFF";
    });
  }

  // Dynamic navbar scroll appearance
  const syncNavbarScroll = () => {
    const nav = document.getElementById("app-navbar");
    if (nav) {
      if (window.scrollY > 20) {
        nav.classList.add("scrolled");
      } else {
        nav.classList.remove("scrolled");
      }
    }
  };

  if (!window._driftverseNavbarScrollAttached) {
    window._driftverseNavbarScrollAttached = true;
    window.addEventListener("scroll", syncNavbarScroll, { passive: true });
  }
  syncNavbarScroll();
}
