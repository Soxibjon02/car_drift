/**
 * DRIFTVERSE - Home Page Component (Automotive Editorial Media Experience)
 * Inspired by Porsche / Ferrari / BMW M / Top Gear digital magazine excellence
 */
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";
import { scrollAnimator } from "../services/scrollAnimations.js";

export function renderHomePage(container) {
  const cars = store.getCars();
  const videos = store.getVideos();

  const carOfTheWeek = store.getCarById("bmw-m4-competition") || cars[0];
  const trendingVideos = videos.filter((v) => v.isTrending).slice(0, 4);
  const driftVideos = videos.filter((v) => v.category === "Drift").slice(0, 3);
  const soundVideos = videos.filter((v) => v.category === "Exhaust & Engine Sound").slice(0, 3);
  const popularCars = cars.slice(0, 6);

  container.innerHTML = `
    <!-- 1. CINEMATIC AUTOMOTIVE EDITORIAL HERO SECTION -->
    <section class="hero-section">
      <div class="hero-backdrop">
        <img 
          src="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1920&q=85" 
          class="hero-video-bg" 
          alt="BMW M4 Performance Drift" 
        />
        <div class="hero-overlay"></div>
        <div class="hero-grid-pattern"></div>
      </div>

      <div class="container hero-content">
        <div class="hero-badge-tag">
          Smoke. Speed. Precision.
        </div>

        <h1 class="hero-title">
          DRIFT<span style="color:var(--accent);">VERSE</span>
        </h1>

        <p class="hero-description">
          The world of performance cars, captured in motion. High-octane footage, live telemetry benchmarks, and virtual head-to-head engineering battles.
        </p>

        <div class="hero-cta-group">
          <button class="btn btn-primary btn-lg" id="hero-btn-explore">
            Explore Cars
          </button>
          <button class="btn btn-secondary btn-lg" id="hero-btn-watch">
            Watch Videos
          </button>
          <button class="btn btn-outline btn-lg" id="hero-btn-battle-arena">
            Compare Telemetry
          </button>
        </div>

        <!-- Editorial Telemetry Information Blocks -->
        <div class="hero-telemetry-strip">
          <div class="telemetry-item">
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">01</div>
            <div class="telemetry-value">2.8<span>s</span></div>
            <div class="telemetry-label">0–100 KM/H</div>
          </div>
          <div class="telemetry-item">
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">02</div>
            <div class="telemetry-value">1,914 <span>HP</span></div>
            <div class="telemetry-label">MAX POWER</div>
          </div>
          <div class="telemetry-item">
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">03</div>
            <div class="telemetry-value">480 <span>KM/H</span></div>
            <div class="telemetry-label">TOP SPEED</div>
          </div>
          <div class="telemetry-item">
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); margin-bottom:2px;">04</div>
            <div class="telemetry-value">${cars.length} <span>MODELS</span></div>
            <div class="telemetry-label">IN VAULT</div>
          </div>
        </div>
      </div>
    </section>

    <!-- 2. APEX SPOTLIGHT: CAR OF THE WEEK (SHATTERED ASSEMBLY ANIMATION) -->
    <section class="section-wrapper scroll-shatter-section home-section-spotlight">
      <div class="container">
        <div class="section-header shatter-fragment shatter-f1">
          <div class="section-title-wrap">
            <div class="section-tag">Featured Machine</div>
            <h2>Spotlight of the Week</h2>
            <div class="section-subtitle">Tuned for precision handling, high-speed cornering, and instant throttle response.</div>
          </div>
          <button class="btn btn-secondary btn-sm" id="btn-cotw-battle" data-car-id="${carOfTheWeek.id}">
            Compare Contender
          </button>
        </div>

        <div class="spotlight-card">
          <!-- Media Column (Shatter Fragment 2) -->
          <div class="shatter-fragment shatter-f2 spotlight-media">
            <img src="${carOfTheWeek.image}" class="spotlight-img" id="cotw-img" alt="${carOfTheWeek.model}" />
            <div class="spotlight-gradient-scrim"></div>
            <button class="car-rev-btn" id="cotw-rev-btn" data-sound="${carOfTheWeek.soundType}">
              Engine Sound
            </button>
          </div>

          <!-- Info Column -->
          <div class="spotlight-info-column">
            <div class="shatter-fragment shatter-f3">
              <div style="display:flex; gap:6px; margin-bottom:8px;">
                <span class="badge badge-amber">Spotlight</span>
                <span class="badge">${carOfTheWeek.category}</span>
              </div>
              <div style="font-family:var(--font-mono); font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; margin-bottom:4px;">${carOfTheWeek.brand}</div>
              <h3 style="font-size:clamp(1.75rem, 3vw, 2.25rem); font-weight:800; margin-bottom:12px; letter-spacing:-0.03em;">${carOfTheWeek.model}</h3>
              <p style="font-size:0.95rem; margin-bottom:24px; color:var(--text-secondary); line-height:1.6;">
                ${carOfTheWeek.description}
              </p>
            </div>

            <!-- Specs Grid (Shatter Fragment 4) -->
            <div class="car-specs-grid shatter-fragment shatter-f4" style="margin-bottom:24px; max-width:440px;">
              <div class="spec-item">
                <span class="spec-val" style="color:var(--text-primary);">${carOfTheWeek.horsepower} HP</span>
                <span class="spec-lbl">Power</span>
              </div>
              <div class="spec-item">
                <span class="spec-val" style="color:var(--text-primary);">${carOfTheWeek.acceleration}s</span>
                <span class="spec-lbl">0–100 KM/H</span>
              </div>
              <div class="spec-item">
                <span class="spec-val" style="color:var(--text-primary);">${carOfTheWeek.topSpeed} KM/H</span>
                <span class="spec-lbl">Top Speed</span>
              </div>
            </div>

            <div class="shatter-fragment shatter-f4" style="display:flex; gap:12px; flex-wrap:wrap;">
              <button class="btn btn-primary" id="cotw-view-specs" data-car-id="${carOfTheWeek.id}">
                View Specifications
              </button>
              <button class="btn btn-secondary" id="cotw-add-garage" data-car-id="${carOfTheWeek.id}">
                ${store.isCarInGarage(carOfTheWeek.id) ? "Saved in Garage" : "Add to Garage"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 3. TRENDING VIDEOS (TWO SIDES CONVERGING ANIMATION) -->
    <section class="section-wrapper scroll-split-section home-section-trending">
      <div class="container">
        <div class="section-header split-header">
          <div class="section-title-wrap">
            <div class="section-tag">Footage</div>
            <h2>Latest & Trending Videos</h2>
            <div class="section-subtitle">Curated 4K drift runs, drag shootouts, and track telemetry from across the globe.</div>
          </div>
          <button class="btn btn-ghost" data-route="videos">
            View All Videos →
          </button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
          ${trendingVideos.map((vid, idx) => {
            const splitClass = idx < 2 ? "split-left" : "split-right";
            return renderVideoCardHtml(vid, splitClass);
          }).join("")}
        </div>
      </div>
    </section>

    <!-- 4. POPULAR CARS SHOWCASE (PROGRESSIVE BLUR TO SHARP FOCUS) -->
    <section class="section-wrapper scroll-blur-section home-section-vault">
      <div class="container">
        <div class="section-header blur-header">
          <div class="section-title-wrap">
            <div class="section-tag">Collection</div>
            <h2>Performance Cars</h2>
            <div class="section-subtitle">From twin-turbo icons to modern hypercars and naturally aspirated thoroughbreds.</div>
          </div>
          <button class="btn btn-ghost" data-route="cars">
            View All Cars (${cars.length}) →
          </button>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:24px;">
          ${popularCars.map((c) => renderCarCardHtml(c, "blur-item")).join("")}
        </div>
      </div>
    </section>

    <!-- 5. DUAL EDITORIAL CHANNELS (LEFT / RIGHT TWO-SIDED CONVERGENCE) -->
    <section class="section-wrapper scroll-split-section home-section-channels">
      <div class="container">
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(340px, 1fr)); gap:36px;">
          <!-- Drift Section (Converges from Left) -->
          <div class="split-left">
            <div class="section-header" style="margin-bottom:20px;">
              <div class="section-title-wrap">
                <div class="section-tag">Angle & Smoke</div>
                <h3>Drift Sessions</h3>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:16px;">
              ${driftVideos.map((vid) => renderVideoCardHtml(vid)).join("")}
            </div>
          </div>

          <!-- Sound Section (Converges from Right) -->
          <div class="split-right">
            <div class="section-header" style="margin-bottom:20px;">
              <div class="section-title-wrap">
                <div class="section-tag">Acoustics</div>
                <h3>Exhaust & Sound Runs</h3>
              </div>
            </div>
            <div style="display:flex; flex-direction:column; gap:16px;">
              ${soundVideos.map((vid) => renderVideoCardHtml(vid)).join("")}
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 6. EDITORIAL CALLOUT: VIRTUAL DYNO COMPARE (SHATTERED ASSEMBLY ANIMATION) -->
    <section class="section-wrapper scroll-shatter-section home-section-compare" style="padding-top:0;">
      <div class="container">
        <div class="dyno-compare-card">
          <div class="section-tag shatter-fragment shatter-f1" style="justify-content:center; margin-bottom:12px;">Head-to-Head Comparison</div>
          <h2 class="shatter-fragment shatter-f2" style="font-size:clamp(1.8rem, 4vw, 3rem); margin-bottom:14px; letter-spacing:-0.03em;">
            Compare Technical Specifications
          </h2>
          <p class="shatter-fragment shatter-f3" style="max-width:600px; margin:0 auto 28px; font-size:1rem; color:var(--text-secondary); line-height:1.6;">
            Analyze horsepower, 0-100 acceleration, top velocity, and power-to-weight ratios side-by-side with interactive radar telemetry.
          </p>
          <div class="shatter-fragment shatter-f4">
            <button class="btn btn-primary btn-lg" data-route="compare">
              Launch Comparison Table
            </button>
          </div>
        </div>
      </div>
    </section>
  `;

  attachHomeEvents(container);
  // Trigger immediate scan & check for scroll animations
  scrollAnimator.refresh();
}

// Reusable Video Card HTML Generator
export function renderVideoCardHtml(vid, extraClass = "") {
  return `
    <div class="video-card ${extraClass}" data-video-id="${vid.id}">
      <div class="video-card-media">
        <img src="${vid.thumbnail}" class="video-card-img" alt="${vid.title}" loading="lazy" />
        <div class="video-play-overlay">
          <div class="play-circle">▶</div>
        </div>
        <span class="video-duration">${vid.duration}</span>
      </div>
      <div class="video-card-body">
        <div class="video-cars-chips">
          <span class="badge">${vid.category}</span>
          ${vid.cars ? vid.cars.map((c) => `<span class="video-car-chip">${c}</span>`).join("") : ""}
        </div>
        <h4 class="video-title">${vid.title}</h4>
        <div class="video-meta-row">
          <span>${vid.author}</span>
          <span>${(vid.views || 0).toLocaleString()} views</span>
        </div>
      </div>
    </div>
  `;
}

// Reusable Car Card HTML Generator
export function renderCarCardHtml(car, extraClass = "") {
  const inGarage = store.isCarInGarage(car.id);
  const inCompare = store.isCarCompared(car.id);

  return `
    <div class="car-card ${extraClass}" data-car-id="${car.id}">
      <div class="car-card-media">
        <img src="${car.image}" class="car-card-img" alt="${car.model}" loading="lazy" />
        <div class="car-card-badges">
          <span class="badge">${car.category}</span>
          <span class="badge badge-amber">${car.drive}</span>
        </div>
        <div class="car-card-actions">
          <button class="car-action-icon-btn ${inGarage ? 'active' : ''} btn-card-garage" data-car-id="${car.id}" title="Save to Garage">
            ★
          </button>
          <button class="car-action-icon-btn ${inCompare ? 'active' : ''} btn-card-compare" data-car-id="${car.id}" title="Compare">
            ⇄
          </button>
        </div>
        <button class="car-rev-btn btn-card-rev" data-sound="${car.soundType}">
          Sound
        </button>
      </div>

      <div class="car-card-body">
        <div class="car-card-brand">${car.brand}</div>
        <h3 class="car-card-title">${car.model}</h3>

        <div class="car-specs-grid">
          <div class="spec-item">
            <span class="spec-val">${car.horsepower}</span>
            <span class="spec-lbl">HP</span>
          </div>
          <div class="spec-item">
            <span class="spec-val">${car.acceleration}s</span>
            <span class="spec-lbl">0–100</span>
          </div>
          <div class="spec-item">
            <span class="spec-val">${car.topSpeed}</span>
            <span class="spec-lbl">KM/H</span>
          </div>
        </div>

        <div class="car-card-footer">
          <span style="font-family:var(--font-mono); font-size:0.72rem; color:var(--text-muted);">${car.engine}</span>
          <button class="btn btn-outline btn-sm btn-card-specs" data-car-id="${car.id}">
            Specs
          </button>
        </div>
      </div>
    </div>
  `;
}

function attachHomeEvents(container) {
  // Navigation Buttons
  container.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      soundEngine.playClick();
      const route = btn.getAttribute("data-route");
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route } }));
    });
  });

  // Hero Premier Watch
  const heroWatch = container.querySelector("#hero-btn-watch");
  if (heroWatch) {
    heroWatch.addEventListener("click", () => {
      soundEngine.playRev("turbo-i6");
      window.dispatchEvent(new CustomEvent("driftverse:watch-video", { detail: { videoId: "vid-m4-night-drift" } }));
    });
  }

  // Hero Explore Cars
  const heroExplore = container.querySelector("#hero-btn-explore");
  if (heroExplore) {
    heroExplore.addEventListener("click", () => {
      soundEngine.playClick();
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "cars" } }));
    });
  }

  // Hero Battle Arena
  const heroBattle = container.querySelector("#hero-btn-battle-arena");
  if (heroBattle) {
    heroBattle.addEventListener("click", () => {
      soundEngine.playClick();
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "compare" } }));
    });
  }

  // COTW Rev Button
  const cotwRev = container.querySelector("#cotw-rev-btn");
  if (cotwRev) {
    cotwRev.addEventListener("click", () => {
      const soundType = cotwRev.getAttribute("data-sound");
      soundEngine.playRev(soundType);
    });
  }

  // COTW View Specs
  const cotwSpecs = container.querySelector("#cotw-view-specs");
  if (cotwSpecs) {
    cotwSpecs.addEventListener("click", () => {
      soundEngine.playClick();
      const carId = cotwSpecs.getAttribute("data-car-id");
      window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
    });
  }

  // COTW Add Garage
  const cotwGarage = container.querySelector("#cotw-add-garage");
  if (cotwGarage) {
    cotwGarage.addEventListener("click", () => {
      const carId = cotwGarage.getAttribute("data-car-id");
      const inGarage = store.isCarInGarage(carId);
      if (inGarage) {
        store.removeFromGarage(carId);
        cotwGarage.textContent = "Add to Garage";
        window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Removed from your Garage." } }));
      } else {
        store.addToGarage(carId);
        cotwGarage.textContent = "Saved in Garage";
        soundEngine.playRev("v8-supercharged");
        window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Added to your Garage!" } }));
      }
    });
  }

  // COTW Battle button
  const cotwBattle = container.querySelector("#btn-cotw-battle");
  if (cotwBattle) {
    cotwBattle.addEventListener("click", () => {
      soundEngine.playClick();
      const carId = cotwBattle.getAttribute("data-car-id");
      store.addToCompare(carId);
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "compare" } }));
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

  // Car Card: Rev Button
  container.querySelectorAll(".btn-card-rev").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const soundType = btn.getAttribute("data-sound");
      soundEngine.playRev(soundType);
    });
  });

  // Car Card: Garage button
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

  // Car Card: Compare button
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

  // Car Card: View Specs button
  container.querySelectorAll(".btn-card-specs").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const carId = btn.getAttribute("data-car-id");
      window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
    });
  });

  // Click entire car card opens specs view
  container.querySelectorAll(".car-card").forEach((card) => {
    card.addEventListener("click", (e) => {
      if (e.target.closest("button")) return;
      const carId = card.getAttribute("data-car-id");
      window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
    });
  });
}
