/**
 * DRIFTVERSE - Videos Platform Catalog Page (Editorial Redesign)
 * Categorized automotive video hub with live filters, search, and sorting
 */
import { store } from "../services/store.js";
import { categoriesList } from "../data/initialState.js";
import { renderVideoCardHtml } from "./home.js";
import { soundEngine } from "../services/audio.js";

export function renderVideosPage(container) {
  let activeCategory = "all";
  let searchQuery = "";
  let activeSort = "views"; // "views" | "newest" | "likes"

  function updateView() {
    let videos = store.getVideos();

    // Category filter
    if (activeCategory !== "all") {
      videos = videos.filter((v) => v.category === activeCategory);
    }

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      videos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          (v.cars && v.cars.some((c) => c.toLowerCase().includes(q))) ||
          v.category.toLowerCase().includes(q) ||
          v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Sorting
    if (activeSort === "views") {
      videos.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (activeSort === "newest") {
      videos.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
    } else if (activeSort === "likes") {
      videos.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    container.innerHTML = `
      <div class="section-wrapper">
        <div class="container">
          <!-- Page Header -->
          <div class="section-header">
            <div class="section-title-wrap">
              <div class="section-tag">Footage & Sessions</div>
              <h1>Automotive Videos</h1>
              <div class="section-subtitle">
                High-resolution drift runs, drag shootouts, exhaust acoustics, and mountain pass sessions captured in 4K.
              </div>
            </div>
          </div>

          <!-- Filter & Search Bar -->
          <div class="filter-bar">
            <!-- Row 1: Search & Sorting -->
            <div class="filter-row">
              <div class="search-input-wrap">
                <span class="search-icon-inside">🔍</span>
                <input 
                  type="text" 
                  id="video-search-input" 
                  placeholder="Filter by title, vehicle (e.g. M4, GT-R), or tag..." 
                  value="${searchQuery}"
                />
              </div>

              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Sort by:</span>
                <select id="video-sort-select" style="min-width:150px;">
                  <option value="views" ${activeSort === 'views' ? 'selected' : ''}>Most Viewed</option>
                  <option value="newest" ${activeSort === 'newest' ? 'selected' : ''}>Newest First</option>
                  <option value="likes" ${activeSort === 'likes' ? 'selected' : ''}>Most Liked</option>
                </select>
              </div>
            </div>

            <!-- Row 2: Category Pills -->
            <div class="filter-pills">
              ${categoriesList
                .map(
                  (cat) => `
                <button class="filter-pill ${activeCategory === cat.id ? 'active' : ''}" data-cat-id="${cat.id}">
                  ${cat.name}
                </button>
              `
                )
                .join("")}
            </div>
          </div>

          <!-- Video Grid Results -->
          ${
            videos.length === 0
              ? `
            <div style="text-align:center; padding:4rem 1.5rem; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
              <h3 style="margin-bottom:6px;">No Video Clips Found</h3>
              <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:20px;">Try adjusting your search query or resetting the category filter.</p>
              <button class="btn btn-secondary" id="btn-reset-video-filters">Reset Filters</button>
            </div>
          `
              : `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
              ${videos.map((vid) => renderVideoCardHtml(vid)).join("")}
            </div>
          `
          }
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Category pills
    container.querySelectorAll(".filter-pill").forEach((pill) => {
      pill.addEventListener("click", () => {
        soundEngine.playClick();
        activeCategory = pill.getAttribute("data-cat-id");
        updateView();
      });
    });

    // Search input
    const searchInput = container.querySelector("#video-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        searchQuery = e.target.value;
        updateView();
        const freshInput = container.querySelector("#video-search-input");
        if (freshInput) {
          freshInput.focus();
          freshInput.setSelectionRange(freshInput.value.length, freshInput.value.length);
        }
      });
    }

    // Sort select
    const sortSelect = container.querySelector("#video-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        soundEngine.playClick();
        activeSort = e.target.value;
        updateView();
      });
    }

    // Reset filters
    const resetBtn = container.querySelector("#btn-reset-video-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        soundEngine.playClick();
        activeCategory = "all";
        searchQuery = "";
        activeSort = "views";
        updateView();
      });
    }

    // Video Card click triggers watch video modal
    container.querySelectorAll(".video-card").forEach((card) => {
      card.addEventListener("click", () => {
        soundEngine.playClick();
        const videoId = card.getAttribute("data-video-id");
        window.dispatchEvent(new CustomEvent("driftverse:watch-video", { detail: { videoId } }));
      });
    });
  }

  updateView();
}
