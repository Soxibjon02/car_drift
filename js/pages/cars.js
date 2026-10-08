/**
 * DRIFTVERSE - Cars Collection & Discovery Page (Editorial Redesign)
 * Advanced multi-filter (Brand, Category, Engine, HP range, Top Speed, Transmission)
 */
import { store } from "../services/store.js";
import { carBrands, carCategories } from "../data/initialState.js";
import { renderCarCardHtml } from "./home.js";
import { soundEngine } from "../services/audio.js";

export function renderCarsPage(container, initialBrand = "All") {
  let search = "";
  let brand = initialBrand;
  let category = "All";
  let engine = "All";
  let hpRange = "All";
  let speedRange = "All";
  let transmission = "All";
  let sortBy = "power"; // "power" | "speed" | "acceleration" | "popular" | "alpha"

  function updateView() {
    let cars = store.getCars();

    // Search query
    if (search.trim()) {
      const q = search.toLowerCase();
      cars = cars.filter(
        (c) =>
          c.model.toLowerCase().includes(q) ||
          c.brand.toLowerCase().includes(q) ||
          c.generation.toLowerCase().includes(q) ||
          c.engine.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    // Brand filter
    if (brand !== "All") {
      cars = cars.filter((c) => c.brand.toLowerCase() === brand.toLowerCase());
    }

    // Category filter
    if (category !== "All") {
      cars = cars.filter((c) => c.category.toLowerCase() === category.toLowerCase());
    }

    // Engine filter
    if (engine !== "All") {
      cars = cars.filter((c) => c.engine.toLowerCase() === engine.toLowerCase());
    }

    // Transmission filter
    if (transmission !== "All") {
      cars = cars.filter((c) => c.transmission.toLowerCase() === transmission.toLowerCase());
    }

    // Horsepower range
    if (hpRange === "under-300") {
      cars = cars.filter((c) => c.horsepower < 300);
    } else if (hpRange === "300-500") {
      cars = cars.filter((c) => c.horsepower >= 300 && c.horsepower <= 500);
    } else if (hpRange === "500-700") {
      cars = cars.filter((c) => c.horsepower > 500 && c.horsepower <= 700);
    } else if (hpRange === "700-1000") {
      cars = cars.filter((c) => c.horsepower > 700 && c.horsepower <= 1000);
    } else if (hpRange === "1000-plus") {
      cars = cars.filter((c) => c.horsepower > 1000);
    }

    // Top speed range
    if (speedRange === "under-250") {
      cars = cars.filter((c) => c.topSpeed < 250);
    } else if (speedRange === "250-300") {
      cars = cars.filter((c) => c.topSpeed >= 250 && c.topSpeed <= 300);
    } else if (speedRange === "300-350") {
      cars = cars.filter((c) => c.topSpeed > 300 && c.topSpeed <= 350);
    } else if (speedRange === "350-plus") {
      cars = cars.filter((c) => c.topSpeed > 350);
    }

    // Sorting
    if (sortBy === "power") {
      cars.sort((a, b) => b.horsepower - a.horsepower);
    } else if (sortBy === "speed") {
      cars.sort((a, b) => b.topSpeed - a.topSpeed);
    } else if (sortBy === "acceleration") {
      cars.sort((a, b) => a.acceleration - b.acceleration);
    } else if (sortBy === "popular") {
      cars.sort((a, b) => (b.views || 0) - (a.views || 0));
    } else if (sortBy === "alpha") {
      cars.sort((a, b) => `${a.brand} ${a.model}`.localeCompare(`${b.brand} ${b.model}`));
    }

    container.innerHTML = `
      <div class="section-wrapper">
        <div class="container">
          <!-- Page Header -->
          <div class="section-header">
            <div class="section-title-wrap">
              <div class="section-tag">Performance Vault</div>
              <h1>Cars Collection</h1>
              <div class="section-subtitle">
                Explore curated machinery with comprehensive telemetry specifications, engine architecture, and acoustic sound samples.
              </div>
            </div>

            <!-- Quick Active Count -->
            <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted);">
              Displaying <strong style="color:var(--text-primary);">${cars.length}</strong> of ${store.getCars().length} models
            </div>
          </div>

          <!-- Comprehensive Multi-Filter Bar -->
          <div class="filter-bar">
            <!-- Row 1: Search & Sorting -->
            <div class="filter-row">
              <div class="search-input-wrap">
                <span class="search-icon-inside">🔍</span>
                <input 
                  type="text" 
                  id="car-search-input" 
                  placeholder="Search brand, model, generation (e.g. M4, GT-R, S15, V10, 2JZ)..." 
                  value="${search}"
                />
              </div>

              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted); text-transform:uppercase;">Sort by:</span>
                <select id="car-sort-select" style="min-width:160px;">
                  <option value="power" ${sortBy === 'power' ? 'selected' : ''}>Most Powerful (HP)</option>
                  <option value="speed" ${sortBy === 'speed' ? 'selected' : ''}>Top Speed</option>
                  <option value="acceleration" ${sortBy === 'acceleration' ? 'selected' : ''}>Quickest 0–100</option>
                  <option value="popular" ${sortBy === 'popular' ? 'selected' : ''}>Most Viewed</option>
                  <option value="alpha" ${sortBy === 'alpha' ? 'selected' : ''}>Alphabetical (A–Z)</option>
                </select>
              </div>
            </div>

            <!-- Row 2: Category Pills -->
            <div class="filter-pills">
              <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted); margin-right:4px;">Class:</span>
              ${carCategories
                .map(
                  (cat) => `
                <button class="filter-pill ${category.toLowerCase() === cat.toLowerCase() ? 'active' : ''}" data-category="${cat}">
                  ${cat}
                </button>
              `
                )
                .join("")}
            </div>

            <!-- Row 3: Dropdowns for Brand, Engine, HP Range, Top Speed, Transmission -->
            <div class="filter-row" style="padding-top:10px; border-top:1px solid var(--border-subtle); display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:10px;">
              <div>
                <label style="display:block; font-size:0.68rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px; text-transform:uppercase;">Manufacturer</label>
                <select id="car-brand-select" style="width:100%;">
                  ${carBrands.map((b) => `<option value="${b}" ${brand.toLowerCase() === b.toLowerCase() ? 'selected' : ''}>${b}</option>`).join("")}
                </select>
              </div>

              <div>
                <label style="display:block; font-size:0.68rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px; text-transform:uppercase;">Horsepower</label>
                <select id="car-hp-select" style="width:100%;">
                  <option value="All" ${hpRange === 'All' ? 'selected' : ''}>All Output</option>
                  <option value="under-300" ${hpRange === 'under-300' ? 'selected' : ''}>Under 300 HP</option>
                  <option value="300-500" ${hpRange === '300-500' ? 'selected' : ''}>300 – 500 HP</option>
                  <option value="500-700" ${hpRange === '500-700' ? 'selected' : ''}>500 – 700 HP</option>
                  <option value="700-1000" ${hpRange === '700-1000' ? 'selected' : ''}>700 – 1000 HP</option>
                  <option value="1000-plus" ${hpRange === '1000-plus' ? 'selected' : ''}>1000+ HP Hyper</option>
                </select>
              </div>

              <div>
                <label style="display:block; font-size:0.68rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px; text-transform:uppercase;">Top Speed</label>
                <select id="car-speed-select" style="width:100%;">
                  <option value="All" ${speedRange === 'All' ? 'selected' : ''}>All Speeds</option>
                  <option value="under-250" ${speedRange === 'under-250' ? 'selected' : ''}>Under 250 km/h</option>
                  <option value="250-300" ${speedRange === '250-300' ? 'selected' : ''}>250 – 300 km/h</option>
                  <option value="300-350" ${speedRange === '300-350' ? 'selected' : ''}>300 – 350 km/h</option>
                  <option value="350-plus" ${speedRange === '350-plus' ? 'selected' : ''}>350+ km/h</option>
                </select>
              </div>

              <div>
                <label style="display:block; font-size:0.68rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px; text-transform:uppercase;">Engine Cylinder</label>
                <select id="car-engine-select" style="width:100%;">
                  <option value="All" ${engine === 'All' ? 'selected' : ''}>All Engines</option>
                  <option value="I4" ${engine === 'I4' ? 'selected' : ''}>I4 Turbo</option>
                  <option value="I6" ${engine === 'I6' ? 'selected' : ''}>I6 (2JZ / S58)</option>
                  <option value="V6" ${engine === 'V6' ? 'selected' : ''}>V6 (VR38 Nismo)</option>
                  <option value="V8" ${engine === 'V8' ? 'selected' : ''}>V8 (Twin-Turbo / NA)</option>
                  <option value="V10" ${engine === 'V10' ? 'selected' : ''}>V10 Screamer</option>
                  <option value="V12" ${engine === 'V12' ? 'selected' : ''}>V12 Atmospheric</option>
                  <option value="Rotary" ${engine === 'Rotary' ? 'selected' : ''}>Rotary (13B-REW)</option>
                  <option value="Electric" ${engine === 'Electric' ? 'selected' : ''}>Electric Quad-Motor</option>
                </select>
              </div>

              <div>
                <label style="display:block; font-size:0.68rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px; text-transform:uppercase;">Gearbox</label>
                <select id="car-trans-select" style="width:100%;">
                  <option value="All" ${transmission === 'All' ? 'selected' : ''}>All Gearboxes</option>
                  <option value="Manual" ${transmission === 'Manual' ? 'selected' : ''}>Manual</option>
                  <option value="DCT" ${transmission === 'DCT' ? 'selected' : ''}>Dual-Clutch (DCT / PDK)</option>
                  <option value="Automatic" ${transmission === 'Automatic' ? 'selected' : ''}>Automatic / Direct</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Cars Grid -->
          ${
            cars.length === 0
              ? `
            <div style="text-align:center; padding:4rem 1.5rem; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md);">
              <h3 style="margin-bottom:6px;">No Vehicles Matching Filter Criteria</h3>
              <p style="font-size:0.875rem; color:var(--text-muted); margin-bottom:20px;">Try relaxing your horsepower or cylinder constraints.</p>
              <button class="btn btn-secondary" id="btn-reset-car-filters">Reset All Filters</button>
            </div>
          `
              : `
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
              ${cars.map((c) => renderCarCardHtml(c)).join("")}
            </div>
          `
          }
        </div>
      </div>
    `;

    attachEvents();
  }

  function attachEvents() {
    // Search input
    const searchInput = container.querySelector("#car-search-input");
    if (searchInput) {
      searchInput.addEventListener("input", (e) => {
        search = e.target.value;
        updateView();
        const fresh = container.querySelector("#car-search-input");
        if (fresh) {
          fresh.focus();
          fresh.setSelectionRange(fresh.value.length, fresh.value.length);
        }
      });
    }

    // Sort select
    const sortSelect = container.querySelector("#car-sort-select");
    if (sortSelect) {
      sortSelect.addEventListener("change", (e) => {
        soundEngine.playClick();
        sortBy = e.target.value;
        updateView();
      });
    }

    // Category pills
    container.querySelectorAll("[data-category]").forEach((pill) => {
      pill.addEventListener("click", () => {
        soundEngine.playClick();
        category = pill.getAttribute("data-category");
        updateView();
      });
    });

    // Dropdown filters
    const brandSelect = container.querySelector("#car-brand-select");
    if (brandSelect) {
      brandSelect.addEventListener("change", (e) => {
        brand = e.target.value;
        updateView();
      });
    }

    const hpSelect = container.querySelector("#car-hp-select");
    if (hpSelect) {
      hpSelect.addEventListener("change", (e) => {
        hpRange = e.target.value;
        updateView();
      });
    }

    const speedSelect = container.querySelector("#car-speed-select");
    if (speedSelect) {
      speedSelect.addEventListener("change", (e) => {
        speedRange = e.target.value;
        updateView();
      });
    }

    const engineSelect = container.querySelector("#car-engine-select");
    if (engineSelect) {
      engineSelect.addEventListener("change", (e) => {
        engine = e.target.value;
        updateView();
      });
    }

    const transSelect = container.querySelector("#car-trans-select");
    if (transSelect) {
      transSelect.addEventListener("change", (e) => {
        transmission = e.target.value;
        updateView();
      });
    }

    // Reset filters button
    const resetBtn = container.querySelector("#btn-reset-car-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        soundEngine.playClick();
        search = "";
        brand = "All";
        category = "All";
        engine = "All";
        hpRange = "All";
        speedRange = "All";
        transmission = "All";
        sortBy = "power";
        updateView();
      });
    }

    // Car Cards: Specs View click
    container.querySelectorAll(".btn-card-specs").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        soundEngine.playClick();
        const carId = btn.getAttribute("data-car-id");
        window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
      });
    });

    // Car Cards: Rev Audio click
    container.querySelectorAll(".btn-card-rev").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const soundType = btn.getAttribute("data-sound");
        soundEngine.playRev(soundType);
      });
    });

    // Car Cards: Garage click
    container.querySelectorAll(".btn-card-garage").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const carId = btn.getAttribute("data-car-id");
        const active = store.toggleGarage(carId);
        btn.classList.toggle("active", active);
        if (active) soundEngine.playRev("turbo-v6");
        window.dispatchEvent(
          new CustomEvent("driftverse:toast", {
            detail: { message: active ? "Added to your Garage!" : "Removed from Garage." }
          })
        );
      });
    });

    // Car Cards: Compare click
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

    // Full Card click
    container.querySelectorAll(".car-card").forEach((card) => {
      card.addEventListener("click", (e) => {
        if (e.target.closest("button")) return;
        const carId = card.getAttribute("data-car-id");
        window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
      });
    });
  }

  updateView();
}
