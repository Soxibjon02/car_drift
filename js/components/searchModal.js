/**
 * DRIFTVERSE - Global Search Command Palette Modal (Editorial Redesign)
 */
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";

export class SearchModal {
  constructor() {
    this.container = null;
    this.isOpen = false;
    this.init();
  }

  init() {
    this.container = document.createElement("div");
    this.container.id = "global-search-modal";
    this.container.style.display = "none";
    document.body.appendChild(this.container);

    // Global shortcut Ctrl+K or /
    window.addEventListener("keydown", (e) => {
      if ((e.ctrlKey && e.key === "k") || (e.key === "/" && !["INPUT", "TEXTAREA"].includes(e.target.tagName))) {
        e.preventDefault();
        this.open();
      }
      if (e.key === "Escape" && this.isOpen) {
        this.close();
      }
    });

    window.addEventListener("driftverse:open-search", () => this.open());
  }

  open() {
    this.isOpen = true;
    this.container.style.display = "block";
    this.render();
    const input = this.container.querySelector("#search-modal-input");
    if (input) input.focus();
  }

  close() {
    this.isOpen = false;
    this.container.style.display = "none";
  }

  render(query = "") {
    const cars = store.getCars();
    const videos = store.getVideos();

    let matchedCars = [];
    let matchedVideos = [];

    if (query.trim()) {
      const q = query.toLowerCase();
      matchedCars = cars.filter(
        (c) =>
          c.model.toLowerCase().includes(q) ||
          c.brand.toLowerCase().includes(q) ||
          c.generation.toLowerCase().includes(q) ||
          c.engine.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );

      matchedVideos = videos.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.category.toLowerCase().includes(q) ||
          (v.cars && v.cars.some((c) => c.toLowerCase().includes(q))) ||
          v.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    this.container.innerHTML = `
      <div class="modal-overlay" id="search-modal-backdrop">
        <div class="modal-dialog" style="max-width:680px; padding:0; overflow:hidden; background:#0D0D0D; border:1px solid var(--border-medium);">
          <!-- Search Header -->
          <div style="padding:1.15rem 1.4rem; background:rgba(255,255,255,0.02); border-bottom:1px solid var(--border-subtle); display:flex; align-items:center; gap:12px;">
            <span style="font-size:1.1rem; color:var(--text-muted);">🔍</span>
            <input 
              type="text" 
              id="search-modal-input" 
              placeholder="Search vehicles, videos, engines... (e.g. M4, GT-R, V10, 2JZ)" 
              value="${query}"
              style="width:100%; background:transparent; border:none; box-shadow:none; font-size:1rem; color:#fff;"
            />
            <button class="modal-close-btn" id="search-modal-close" style="position:static;">✕</button>
          </div>

          <!-- Quick Suggestions -->
          <div style="padding:0.6rem 1.4rem; background:#090909; display:flex; gap:6px; border-bottom:1px solid var(--border-subtle); overflow-x:auto;">
            <span style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono); align-self:center; margin-right:4px;">Suggestions:</span>
            <button class="filter-pill search-suggestion" data-term="M4">BMW M4</button>
            <button class="filter-pill search-suggestion" data-term="GT-R">GT-R</button>
            <button class="filter-pill search-suggestion" data-term="Supra">Supra</button>
            <button class="filter-pill search-suggestion" data-term="Drag">Drag Race</button>
            <button class="filter-pill search-suggestion" data-term="Drift">Drift</button>
          </div>

          <!-- Results Container -->
          <div style="max-height:460px; overflow-y:auto; padding:1.25rem 1.4rem;">
            ${
              !query.trim()
                ? `
              <div style="text-align:center; padding:3rem 1rem; color:var(--text-muted);">
                <div style="font-size:0.95rem; color:var(--text-secondary); margin-bottom:4px; font-weight:600;">Vault Search</div>
                <div style="font-size:0.825rem;">Search performance vehicles, 4K footage, and technical telemetry.</div>
              </div>
            `
                : ""
            }

            ${
              query.trim() && matchedCars.length === 0 && matchedVideos.length === 0
                ? `
              <div style="text-align:center; padding:2.5rem 1rem; color:var(--text-muted);">
                <div style="color:var(--text-primary); margin-bottom:4px; font-weight:600;">No results for "${query}"</div>
                <div style="font-size:0.825rem;">Try searching for "BMW", "Nissan", "Supercar", "Drag", or "V8".</div>
              </div>
            `
                : ""
            }

            <!-- Cars Match Group -->
            ${
              matchedCars.length > 0
                ? `
              <div style="margin-bottom:20px;">
                <div class="section-tag" style="margin-bottom:10px;">Matched Vehicles (${matchedCars.length})</div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${matchedCars
                    .slice(0, 5)
                    .map(
                      (car) => `
                    <div class="search-car-item" data-car-id="${car.id}" style="display:flex; align-items:center; gap:12px; padding:8px 12px; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); cursor:pointer; transition:all 0.15s;">
                      <img src="${car.image}" style="width:54px; height:36px; object-fit:cover; border-radius:2px;" alt="${car.model}" />
                      <div style="flex:1;">
                        <div style="font-size:0.875rem; font-weight:600; color:#fff;">${car.brand} ${car.model}</div>
                        <div style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">${car.horsepower} HP • ${car.acceleration}s • ${car.topSpeed} KM/H</div>
                      </div>
                      <span class="badge">${car.category}</span>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }

            <!-- Videos Match Group -->
            ${
              matchedVideos.length > 0
                ? `
              <div>
                <div class="section-tag" style="margin-bottom:10px;">Matched Videos (${matchedVideos.length})</div>
                <div style="display:flex; flex-direction:column; gap:6px;">
                  ${matchedVideos
                    .slice(0, 5)
                    .map(
                      (vid) => `
                    <div class="search-video-item" data-video-id="${vid.id}" style="display:flex; align-items:center; gap:12px; padding:8px 12px; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); cursor:pointer; transition:all 0.15s;">
                      <div style="position:relative; width:60px; height:38px; flex-shrink:0;">
                        <img src="${vid.thumbnail}" style="width:100%; height:100%; object-fit:cover; border-radius:2px;" alt="${vid.title}" />
                        <span style="position:absolute; bottom:2px; right:2px; font-size:0.6rem; background:#000; padding:1px 3px; border-radius:2px;">${vid.duration}</span>
                      </div>
                      <div style="flex:1; overflow:hidden;">
                        <div style="font-size:0.85rem; font-weight:600; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${vid.title}</div>
                        <div style="font-size:0.72rem; color:var(--text-muted);">${vid.views.toLocaleString()} views • ${vid.category}</div>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            `
                : ""
            }
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  attachEvents() {
    const backdrop = this.container.querySelector("#search-modal-backdrop");
    const closeBtn = this.container.querySelector("#search-modal-close");
    const input = this.container.querySelector("#search-modal-input");

    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener("click", () => this.close());
    }

    if (input) {
      input.addEventListener("input", (e) => {
        this.render(e.target.value);
        const newInput = this.container.querySelector("#search-modal-input");
        if (newInput) {
          newInput.focus();
          newInput.setSelectionRange(newInput.value.length, newInput.value.length);
        }
      });
    }

    // Suggestions
    this.container.querySelectorAll(".search-suggestion").forEach((btn) => {
      btn.addEventListener("click", () => {
        const term = btn.getAttribute("data-term");
        this.render(term);
      });
    });

    // Car Click
    this.container.querySelectorAll(".search-car-item").forEach((item) => {
      item.addEventListener("click", () => {
        soundEngine.playClick();
        const carId = item.getAttribute("data-car-id");
        this.close();
        window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
      });
    });

    // Video Click
    this.container.querySelectorAll(".search-video-item").forEach((item) => {
      item.addEventListener("click", () => {
        soundEngine.playClick();
        const videoId = item.getAttribute("data-video-id");
        this.close();
        window.dispatchEvent(new CustomEvent("driftverse:watch-video", { detail: { videoId } }));
      });
    });
  }
}
