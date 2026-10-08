/**
 * DRIFTVERSE - Trending & Real-Time Heat Index Page (Editorial Redesign)
 */
import { store } from "../services/store.js";
import { renderVideoCardHtml, renderCarCardHtml } from "./home.js";
import { soundEngine } from "../services/audio.js";

export function renderTrendingPage(container) {
  const cars = store.getCars();
  const videos = store.getVideos();

  // Top trending videos
  const trendingVids = videos.filter((v) => v.isTrending).slice(0, 6);
  // Viral cars by view metrics
  const viralCars = [...cars].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 4);

  // Trending Brands
  const trendingBrands = [
    { brand: "Nissan", searchVolume: "348,200 Views", badge: "+24% Activity" },
    { brand: "BMW M", searchVolume: "294,100 Views", badge: "+18% Activity" },
    { brand: "Toyota", searchVolume: "281,400 Views", badge: "+31% Activity" },
    { brand: "Porsche", searchVolume: "215,900 Views", badge: "+14% Activity" },
    { brand: "Koenigsegg", searchVolume: "192,800 Views", badge: "+45% Activity" }
  ];

  // Popular search queries
  const popularKeywords = [
    "Tokyo Drift", "GT-R Nismo Launch", "2JZ Anti-Lag", "M4 vs GT-R Drag",
    "Jesko Top Speed", "V10 at Monza", "Aventador Flames", "Touge Drift",
    "Rimac Nevera Record", "911 GT3 RS Nurburgring"
  ];

  container.innerHTML = `
    <div class="section-wrapper">
      <div class="container">
        <!-- Page Header -->
        <div class="section-header">
          <div class="section-title-wrap">
            <div class="section-tag">Telemetry Analytics</div>
            <h1>Trending Content</h1>
            <div class="section-subtitle">
              High-velocity footage, popular performance builds, and trending manufacturer queries over the past 24 hours.
            </div>
          </div>
        </div>

        <!-- 1. Trending Brands Strip -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:1.25rem 1.5rem; margin-bottom:36px;">
          <div class="section-tag" style="margin-bottom:10px;">Top Searched Constructors</div>
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:12px;">
            ${trendingBrands
              .map(
                (tb) => `
              <div class="trending-brand-card" data-brand="${tb.brand}">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                  <span style="font-size:0.875rem; font-weight:700; color:#fff;">${tb.brand}</span>
                  <span class="badge" style="font-size:0.65rem;">${tb.badge}</span>
                </div>
                <div style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">${tb.searchVolume}</div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- 2. Discovery Keywords Cloud -->
        <div style="margin-bottom:36px;">
          <div class="section-tag" style="margin-bottom:10px;">Popular Keywords</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;">
            ${popularKeywords
              .map(
                (kw) => `
              <button class="filter-pill trending-kw-pill" data-kw="${kw}">
                ${kw}
              </button>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- 3. Trending Videos Grid -->
        <div style="margin-bottom:44px;">
          <div class="section-header">
            <div class="section-title-wrap">
              <div class="section-tag">Footage</div>
              <h2>Trending Videos</h2>
            </div>
            <button class="btn btn-ghost" data-route="videos">All Videos →</button>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
            ${trendingVids.map((v) => renderVideoCardHtml(v)).join("")}
          </div>
        </div>

        <!-- 4. Trending Cars Grid -->
        <div>
          <div class="section-header">
            <div class="section-title-wrap">
              <div class="section-tag">Vault</div>
              <h2>Most Viewed Models</h2>
            </div>
            <button class="btn btn-ghost" data-route="cars">All Cars →</button>
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
            ${viralCars.map((c) => renderCarCardHtml(c)).join("")}
          </div>
        </div>
      </div>
    </div>
  `;

  attachTrendingEvents(container);
}

function attachTrendingEvents(container) {
  // Brand card clicks
  container.querySelectorAll(".trending-brand-card").forEach((card) => {
    card.addEventListener("click", () => {
      soundEngine.playClick();
      const brand = card.getAttribute("data-brand");
      window.dispatchEvent(new CustomEvent("driftverse:filter-brand", { detail: { brand } }));
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "cars" } }));
    });
  });

  // Keyword pill clicks
  container.querySelectorAll(".trending-kw-pill").forEach((pill) => {
    pill.addEventListener("click", () => {
      soundEngine.playClick();
      const kw = pill.getAttribute("data-kw");
      window.dispatchEvent(new CustomEvent("driftverse:open-search"));
    });
  });

  // Navigation buttons
  container.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      soundEngine.playClick();
      const route = btn.getAttribute("data-route");
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route } }));
    });
  });

  // Video card clicks
  container.querySelectorAll(".video-card").forEach((card) => {
    card.addEventListener("click", () => {
      soundEngine.playClick();
      const videoId = card.getAttribute("data-video-id");
      window.dispatchEvent(new CustomEvent("driftverse:watch-video", { detail: { videoId } }));
    });
  });

  // Car card clicks
  container.querySelectorAll(".btn-card-specs").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const carId = btn.getAttribute("data-car-id");
      window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
    });
  });

  container.querySelectorAll(".btn-card-rev").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const soundType = btn.getAttribute("data-sound");
      soundEngine.playRev(soundType);
    });
  });

  container.querySelectorAll(".car-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const carId = card.getAttribute("data-car-id");
      window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
    });
  });
}
