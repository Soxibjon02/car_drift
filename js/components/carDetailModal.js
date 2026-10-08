/**
 * DRIFTVERSE - Car Detail View / Modal (Editorial Redesign)
 * Full specifications, multi-photo gallery, acoustic engine sample, and actions
 */
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";

export class CarDetailModal {
  constructor() {
    this.container = null;
    this.car = null;
    this.activeImageIdx = 0;
    this.init();
  }

  init() {
    this.container = document.createElement("div");
    this.container.id = "car-detail-modal";
    this.container.style.display = "none";
    document.body.appendChild(this.container);

    window.addEventListener("driftverse:view-car", (e) => {
      if (e.detail && e.detail.carId) {
        this.open(e.detail.carId);
      }
    });
  }

  open(carId) {
    const car = store.getCarById(carId);
    if (!car) return;

    this.car = car;
    this.activeImageIdx = 0;
    this.container.style.display = "block";
    this.render();

    // Increment views
    store.updateCar(carId, { views: (car.views || 0) + 1 });
  }

  close() {
    this.container.style.display = "none";
  }

  render() {
    if (!this.car) return;

    const car = this.car;
    const inGarage = store.isCarInGarage(car.id);
    const inCompare = store.isCarCompared(car.id);

    // Associated videos for this car
    const carVideos = store.getVideos().filter(
      (v) =>
        (v.cars && v.cars.some((c) => c.toLowerCase().includes(car.model.toLowerCase()) || car.model.toLowerCase().includes(c.toLowerCase()))) ||
        v.title.toLowerCase().includes(car.model.toLowerCase())
    );

    const activeImg = car.gallery && car.gallery[this.activeImageIdx] ? car.gallery[this.activeImageIdx] : car.image;

    this.container.innerHTML = `
      <div class="modal-overlay" id="car-detail-backdrop">
        <div class="modal-dialog" style="max-width:960px; padding:0; background:#0D0D0D; border:1px solid var(--border-medium);">
          <button class="modal-close-btn" id="car-detail-close" style="top:16px; right:16px; z-index:20;">✕</button>

          <!-- Top Visual Screen -->
          <div style="position:relative; width:100%; height:clamp(300px, 40vw, 440px); background:#070707; overflow:hidden;">
            <img 
              id="car-detail-main-img" 
              src="${activeImg}" 
              style="width:100%; height:100%; object-fit:cover; filter:contrast(105%) brightness(92%); transition:opacity 0.25s ease;" 
              alt="${car.model}" 
            />

            <!-- Dark Gradient Overlay -->
            <div style="position:absolute; inset:0; background:linear-gradient(0deg, #0D0D0D 8%, rgba(13,13,13,0.4) 60%, rgba(13,13,13,0.8) 100%);"></div>

            <!-- Title & Metadata -->
            <div style="position:absolute; bottom:20px; left:24px; right:24px; display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:14px;">
              <div>
                <div style="display:flex; gap:6px; margin-bottom:6px;">
                  <span class="badge">${car.category}</span>
                  <span class="badge badge-amber">${car.year} • ${car.generation}</span>
                  <span class="badge">${car.drive}</span>
                </div>
                <h1 style="font-size:clamp(1.8rem, 3.5vw, 2.75rem); font-weight:800; line-height:1.05; color:#FFFFFF; letter-spacing:-0.03em;">
                  ${car.brand} ${car.model}
                </h1>
                <div style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted); margin-top:4px;">
                  Estimated MSRP: <strong style="color:var(--text-primary);">${car.price}</strong> • Community Rating: ${car.rating} / 5.0
                </div>
              </div>

              <!-- Engine Acoustic Rev Button -->
              <button class="btn btn-primary btn-sm" id="btn-dyno-rev" style="min-height:38px;">
                Engine Acoustic
              </button>
            </div>
          </div>

          <!-- Gallery Thumbnails -->
          ${
            car.gallery && car.gallery.length > 1
              ? `
            <div style="background:#111111; padding:10px 24px; display:flex; gap:10px; border-bottom:1px solid var(--border-subtle); overflow-x:auto;">
              ${car.gallery
                .map(
                  (imgUrl, idx) => `
                <img 
                  src="${imgUrl}" 
                  class="gallery-thumb ${idx === this.activeImageIdx ? 'active' : ''}" 
                  data-idx="${idx}" 
                  style="width:64px; height:42px; object-fit:cover; border-radius:var(--radius-xs); cursor:pointer; opacity:${idx === this.activeImageIdx ? '1' : '0.45'}; border:1px solid ${idx === this.activeImageIdx ? 'var(--accent)' : 'transparent'}; transition:all 0.15s;" 
                  alt="" 
                />
              `
                )
                .join("")}
            </div>
          `
              : ""
          }

          <!-- Body Content -->
          <div style="padding:1.75rem 2rem; max-height:450px; overflow-y:auto;">
            <!-- Primary Action CTAs -->
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:14px; margin-bottom:24px; padding-bottom:16px; border-bottom:1px solid var(--border-subtle);">
              <div style="font-size:0.9rem; color:var(--text-secondary); max-width:580px; line-height:1.6;">
                ${car.description}
              </div>

              <div style="display:flex; gap:10px;">
                <button class="btn ${inGarage ? 'btn-secondary' : 'btn-outline'} btn-sm" id="detail-btn-garage">
                  ${inGarage ? "Saved in Garage" : "Add to Garage"}
                </button>
                <button class="btn ${inCompare ? 'btn-primary' : 'btn-secondary'} btn-sm" id="detail-btn-compare">
                  ${inCompare ? "In Compare Roster" : "Add to Compare"}
                </button>
              </div>
            </div>

            <!-- Full Technical Specifications Grid -->
            <div class="section-tag" style="margin-bottom:12px;">Technical Telemetry</div>
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin-bottom:28px;">
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-xs);">
                <div class="spec-lbl">MAX HORSEPOWER</div>
                <div class="spec-val" style="font-size:1.25rem;">${car.horsepower} <span style="font-size:0.75rem; color:var(--text-muted);">HP</span></div>
              </div>
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-xs);">
                <div class="spec-lbl">PEAK TORQUE</div>
                <div class="spec-val" style="font-size:1.25rem;">${car.torque} <span style="font-size:0.75rem; color:var(--text-muted);">Nm</span></div>
              </div>
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-xs);">
                <div class="spec-lbl">0–100 KM/H</div>
                <div class="spec-val" style="font-size:1.25rem;">${car.acceleration}s</div>
              </div>
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-xs);">
                <div class="spec-lbl">TOP SPEED</div>
                <div class="spec-val" style="font-size:1.25rem;">${car.topSpeed} <span style="font-size:0.75rem; color:var(--text-muted);">KM/H</span></div>
              </div>
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-xs);">
                <div class="spec-lbl">CURB WEIGHT</div>
                <div class="spec-val" style="font-size:1.25rem;">${car.weight} <span style="font-size:0.75rem; color:var(--text-muted);">KG</span></div>
              </div>
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-xs);">
                <div class="spec-lbl">POWER-TO-WEIGHT</div>
                <div class="spec-val" style="font-size:1.25rem;">${((car.horsepower / car.weight) * 1000).toFixed(0)} <span style="font-size:0.75rem; color:var(--text-muted);">HP/T</span></div>
              </div>
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:12px; border-radius:var(--radius-xs); grid-column:span 2;">
                <div class="spec-lbl">ENGINE ARCHITECTURE</div>
                <div style="font-size:0.875rem; font-weight:600; color:#FFFFFF; margin-top:2px;">${car.engineDetails || car.engine}</div>
              </div>
            </div>

            <!-- Matched Video Footage -->
            ${
              carVideos.length > 0
                ? `
              <div class="section-tag" style="margin-bottom:12px;">Matched Footage (${carVideos.length})</div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:14px;">
                ${carVideos
                  .slice(0, 3)
                  .map(
                    (v) => `
                  <div class="video-card modal-rel-video" data-video-id="${v.id}">
                    <div class="video-card-media" style="padding-top:52%;">
                      <img src="${v.thumbnail}" class="video-card-img" alt="" />
                      <div class="video-play-overlay">
                        <div class="play-circle" style="width:36px; height:36px; font-size:0.8rem;">▶</div>
                      </div>
                      <span class="video-duration">${v.duration}</span>
                    </div>
                    <div style="padding:10px;">
                      <h4 style="font-size:0.85rem; font-weight:600; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${v.title}</h4>
                      <div style="font-size:0.7rem; color:var(--text-muted); margin-top:2px;">${(v.views || 0).toLocaleString()} views</div>
                    </div>
                  </div>
                `
                  )
                  .join("")}
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
    // Close button
    const closeBtn = this.container.querySelector("#car-detail-close");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    // Backdrop click
    const backdrop = this.container.querySelector("#car-detail-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    // Dyno rev acoustic sound button
    const revBtn = this.container.querySelector("#btn-dyno-rev");
    if (revBtn && this.car) {
      revBtn.addEventListener("click", () => {
        soundEngine.playRev(this.car.soundType);
      });
    }

    // Gallery thumbnail switcher
    this.container.querySelectorAll(".gallery-thumb").forEach((thumb) => {
      thumb.addEventListener("click", () => {
        const idx = parseInt(thumb.getAttribute("data-idx"), 10);
        this.activeImageIdx = idx;
        const mainImg = this.container.querySelector("#car-detail-main-img");
        if (mainImg && this.car.gallery && this.car.gallery[idx]) {
          mainImg.style.opacity = "0.4";
          setTimeout(() => {
            mainImg.src = this.car.gallery[idx];
            mainImg.style.opacity = "1";
          }, 150);
        }
        this.container.querySelectorAll(".gallery-thumb").forEach((t, i) => {
          t.style.opacity = i === idx ? "1" : "0.45";
          t.style.borderColor = i === idx ? "var(--accent)" : "transparent";
        });
      });
    });

    // Garage toggle
    const garageBtn = this.container.querySelector("#detail-btn-garage");
    if (garageBtn && this.car) {
      garageBtn.addEventListener("click", () => {
        const active = store.toggleGarage(this.car.id);
        garageBtn.textContent = active ? "Saved in Garage" : "Add to Garage";
        garageBtn.className = `btn ${active ? "btn-secondary" : "btn-outline"} btn-sm`;
        if (active) soundEngine.playRev("turbo-v6");
        window.dispatchEvent(
          new CustomEvent("driftverse:toast", {
            detail: { message: active ? "Added to your Garage!" : "Removed from Garage." }
          })
        );
      });
    }

    // Compare toggle
    const compareBtn = this.container.querySelector("#detail-btn-compare");
    if (compareBtn && this.car) {
      compareBtn.addEventListener("click", () => {
        const active = store.toggleCompare(this.car.id);
        compareBtn.textContent = active ? "In Compare Roster" : "Add to Compare";
        compareBtn.className = `btn ${active ? "btn-primary" : "btn-secondary"} btn-sm`;
        soundEngine.playClick();
        window.dispatchEvent(
          new CustomEvent("driftverse:toast", {
            detail: { message: active ? "Added to Compare Roster" : "Removed from Compare" }
          })
        );
      });
    }

    // Video clicks in modal
    this.container.querySelectorAll(".modal-rel-video").forEach((card) => {
      card.addEventListener("click", () => {
        const videoId = card.getAttribute("data-video-id");
        this.close();
        window.dispatchEvent(new CustomEvent("driftverse:watch-video", { detail: { videoId } }));
      });
    });
  }
}
