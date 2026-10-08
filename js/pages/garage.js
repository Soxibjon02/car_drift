/**
 * DRIFTVERSE - My Garage & Pilot Vault Page (Editorial Redesign)
 */
import { store } from "../services/store.js";
import { authService } from "../services/auth.js";
import { renderCarCardHtml, renderVideoCardHtml } from "./home.js";
import { soundEngine } from "../services/audio.js";

export function renderGaragePage(container) {
  const user = store.currentUser;

  // Guest State
  if (!user) {
    container.innerHTML = `
      <div class="section-wrapper">
        <div class="container" style="text-align:center; padding:4rem 1.5rem;">
          <div class="section-tag" style="justify-content:center; margin-bottom:12px;">Authentication Required</div>
          <h1 style="font-size:2.2rem; margin-bottom:12px;">My Garage</h1>
          <p style="color:var(--text-secondary); max-width:500px; margin:0 auto 24px; font-size:0.95rem; line-height:1.6;">
            Sign in to access your personal collection, save favorite performance vehicles, and track comparison histories.
          </p>
          <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
            <button class="btn btn-primary" id="garage-btn-login">
              Sign In
            </button>
            <button class="btn btn-secondary" id="garage-btn-guest-demo">
              Load Demo Profile
            </button>
          </div>
        </div>
      </div>
    `;

    const loginBtn = container.querySelector("#garage-btn-login");
    if (loginBtn) {
      loginBtn.addEventListener("click", () => {
        soundEngine.playClick();
        window.dispatchEvent(new CustomEvent("driftverse:open-auth"));
      });
    }

    const demoBtn = container.querySelector("#garage-btn-guest-demo");
    if (demoBtn) {
      demoBtn.addEventListener("click", () => {
        authService.demoSwitchRole("User");
        soundEngine.playRev("turbo-v6");
        renderGaragePage(container);
      });
    }

    return;
  }

  // Authenticated State
  const garageCarIds = user.garageCars || [];
  const garageCars = garageCarIds.map((id) => store.getCarById(id)).filter(Boolean);

  const likedVideoIds = user.likedVideos || [];
  const likedVideos = likedVideoIds.map((id) => store.getVideoById(id)).filter(Boolean);

  const battleHistory = store.battleHistory || [];

  container.innerHTML = `
    <div class="section-wrapper">
      <div class="container">
        <!-- Pilot Profile Banner -->
        <div class="garage-header-card">
          <img src="${user.avatar}" class="garage-avatar" alt="${user.name}" />
          <div>
            <div style="display:flex; gap:8px; align-items:center; margin-bottom:4px;">
              <h2 style="font-size:1.5rem; margin:0; font-weight:700;">${user.name}</h2>
              <span class="badge badge-amber">${user.driverBadge || user.role}</span>
            </div>
            <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">
              ID: ${user.id} • Member Since: ${user.joined}
            </div>
          </div>

          <!-- Stats Strip -->
          <div class="garage-stats-strip">
            <div class="garage-stat-box">
              <div class="garage-stat-num">${garageCars.length}</div>
              <div class="garage-stat-lbl">Saved Cars</div>
            </div>
            <div class="garage-stat-box">
              <div class="garage-stat-num">${likedVideos.length}</div>
              <div class="garage-stat-lbl">Saved Videos</div>
            </div>
            <div class="garage-stat-box">
              <div class="garage-stat-num">${battleHistory.length}</div>
              <div class="garage-stat-lbl">Comparisons</div>
            </div>
          </div>
        </div>

        <!-- 1. SAVED CARS IN GARAGE -->
        <div style="margin-bottom:44px;">
          <div class="section-header">
            <div class="section-title-wrap">
              <div class="section-tag">Vault</div>
              <h2>Saved Performance Cars (${garageCars.length})</h2>
            </div>
            <button class="btn btn-secondary btn-sm" data-route="cars">
              + Browse Cars
            </button>
          </div>

          ${
            garageCars.length === 0
              ? `
            <div style="padding:3rem 1.5rem; text-align:center; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
              <h4 style="margin-bottom:6px;">No vehicles saved yet</h4>
              <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:16px;">Browse the collection and click the star icon to save vehicles here.</p>
              <button class="btn btn-primary btn-sm" data-route="cars">Explore Cars</button>
            </div>
          `
              : `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
              ${garageCars.map((c) => renderCarCardHtml(c)).join("")}
            </div>
          `
          }
        </div>

        <!-- 2. SAVED VIDEOS -->
        <div>
          <div class="section-header">
            <div class="section-title-wrap">
              <div class="section-tag">Footage</div>
              <h2>Saved Video Collection (${likedVideos.length})</h2>
            </div>
            <button class="btn btn-secondary btn-sm" data-route="videos">
              Browse Videos
            </button>
          </div>

          ${
            likedVideos.length === 0
              ? `
            <div style="padding:3rem 1.5rem; text-align:center; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
              <h4 style="margin-bottom:6px;">No saved videos</h4>
              <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:16px;">Watch videos and tap the save button to build your library.</p>
              <button class="btn btn-primary btn-sm" data-route="videos">Go to Videos</button>
            </div>
          `
              : `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
              ${likedVideos.map((v) => renderVideoCardHtml(v)).join("")}
            </div>
          `
          }
        </div>
      </div>
    </div>
  `;

  attachGarageEvents(container);
}

function attachGarageEvents(container) {
  // Navigation
  container.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      soundEngine.playClick();
      const route = btn.getAttribute("data-route");
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route } }));
    });
  });

  // Specs buttons
  container.querySelectorAll(".btn-card-specs").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const carId = btn.getAttribute("data-car-id");
      window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
    });
  });

  // Rev buttons
  container.querySelectorAll(".btn-card-rev").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const soundType = btn.getAttribute("data-sound");
      soundEngine.playRev(soundType);
    });
  });

  // Garage toggle
  container.querySelectorAll(".btn-card-garage").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const carId = btn.getAttribute("data-car-id");
      store.removeFromGarage(carId);
      renderGaragePage(container);
    });
  });

  // Compare toggle
  container.querySelectorAll(".btn-card-compare").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const carId = btn.getAttribute("data-car-id");
      const active = store.toggleCompare(carId);
      btn.classList.toggle("active", active);
      soundEngine.playClick();
      window.dispatchEvent(
        new CustomEvent("driftverse:toast", {
          detail: { message: active ? "Added to Compare Roster" : "Removed from Compare" }
        })
      );
    });
  });

  // Full car card click
  container.querySelectorAll(".car-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const carId = card.getAttribute("data-car-id");
      window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
    });
  });

  // Video clicks
  container.querySelectorAll(".video-card").forEach((card) => {
    card.addEventListener("click", () => {
      soundEngine.playClick();
      const videoId = card.getAttribute("data-video-id");
      window.dispatchEvent(new CustomEvent("driftverse:watch-video", { detail: { videoId } }));
    });
  });
}
