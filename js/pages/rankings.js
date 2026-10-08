/**
 * DRIFTVERSE - Global Rankings & Leaderboard Page (Editorial Redesign)
 * Clean magazine ranking cards (01, 02, 03) with subtle metallic accents and comprehensive leaderboard
 */
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";

export function renderRankingsPage(container) {
  let activeBenchmark = "speed"; // "speed" | "power" | "accel" | "drift" | "jdm"

  function updateView() {
    let cars = store.getCars();

    let benchmarkTitle = "Top Velocity Record Holders";
    let benchmarkSubtitle = "The fastest production and limited-run machines capable of bending time.";
    let metricLabel = "Top Speed";

    if (activeBenchmark === "speed") {
      cars.sort((a, b) => b.topSpeed - a.topSpeed);
      benchmarkTitle = "Top Velocity Benchmarks";
      metricLabel = "Top Speed";
    } else if (activeBenchmark === "power") {
      cars.sort((a, b) => b.horsepower - a.horsepower);
      benchmarkTitle = "Horsepower Champions";
      metricLabel = "Max Output";
    } else if (activeBenchmark === "accel") {
      cars.sort((a, b) => a.acceleration - b.acceleration);
      benchmarkTitle = "0–100 km/h Acceleration";
      metricLabel = "0–100 KM/H";
    } else if (activeBenchmark === "drift") {
      cars = cars.filter((c) => c.category === "Drift" || c.tags.includes("Drift") || c.drive === "RWD");
      cars.sort((a, b) => (b.handlingScore || 85) - (a.handlingScore || 85));
      benchmarkTitle = "Touge & Drift Dynamics";
      metricLabel = "Handling Score";
    } else if (activeBenchmark === "jdm") {
      cars = cars.filter((c) => c.category === "JDM" || ["Nissan", "Toyota", "Mazda"].includes(c.brand));
      cars.sort((a, b) => (b.views || 0) - (a.views || 0));
      benchmarkTitle = "JDM Culture Icons";
      metricLabel = "Vault Rating";
    }

    const first = cars[0];
    const second = cars[1];
    const third = cars[2];

    container.innerHTML = `
      <div class="section-wrapper">
        <div class="container">
          <!-- Page Header -->
          <div class="section-header">
            <div class="section-title-wrap">
              <div class="section-tag">Leaderboard</div>
              <h1>Performance Rankings</h1>
              <div class="section-subtitle">${benchmarkSubtitle}</div>
            </div>
          </div>

          <!-- Benchmark Navigation Pills -->
          <div class="filter-pills" style="margin-bottom:32px;">
            <button class="filter-pill ${activeBenchmark === 'speed' ? 'active' : ''}" data-bm="speed">
              Top Speed
            </button>
            <button class="filter-pill ${activeBenchmark === 'power' ? 'active' : ''}" data-bm="power">
              Horsepower
            </button>
            <button class="filter-pill ${activeBenchmark === 'accel' ? 'active' : ''}" data-bm="accel">
              0–100 km/h
            </button>
            <button class="filter-pill ${activeBenchmark === 'drift' ? 'active' : ''}" data-bm="drift">
              Drift & Handling
            </button>
            <button class="filter-pill ${activeBenchmark === 'jdm' ? 'active' : ''}" data-bm="jdm">
              JDM Icons
            </button>
          </div>

          <!-- TOP 3 MAGAZINE RANKING DISPLAY -->
          <div class="podium-container">
            <!-- 2nd Place Silver -->
            ${
              second
                ? `
              <div class="podium-place podium-2">
                <div class="podium-box">
                  <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span style="font-family:var(--font-mono); font-size:1.4rem; font-weight:800; color:#A0A0A0;">02</span>
                    <span class="badge" style="border-color:rgba(192,192,192,0.4); color:#C0C0C0;">Silver</span>
                  </div>
                  <div style="width:100%; height:150px; overflow:hidden; border-radius:var(--radius-xs); margin-bottom:12px; background:#0B0B0B;">
                    <img src="${second.image}" style="width:100%; height:100%; object-fit:cover;" alt="${second.model}" />
                  </div>
                  <div style="width:100%; text-align:left;">
                    <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${second.brand}</div>
                    <h4 style="font-size:1.15rem; margin-bottom:8px; font-weight:700;">${second.model}</h4>
                    <div style="font-family:var(--font-telemetry); font-size:0.95rem; color:var(--text-primary); font-weight:700; margin-bottom:14px;">
                      ${formatBenchmarkMetric(second, activeBenchmark)}
                    </div>
                    <button class="btn btn-secondary btn-sm podium-btn-specs" data-car-id="${second.id}" style="width:100%;">
                      View Specs
                    </button>
                  </div>
                </div>
              </div>
            `
                : ""
            }

            <!-- 1st Place Gold -->
            ${
              first
                ? `
              <div class="podium-place podium-1">
                <div class="podium-box">
                  <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span style="font-family:var(--font-mono); font-size:1.6rem; font-weight:800; color:#D4AF37;">01</span>
                    <span class="badge" style="border-color:rgba(212,175,55,0.4); color:#D4AF37;">Champion</span>
                  </div>
                  <div style="width:100%; height:180px; overflow:hidden; border-radius:var(--radius-xs); margin-bottom:14px; background:#0B0B0B;">
                    <img src="${first.image}" style="width:100%; height:100%; object-fit:cover;" alt="${first.model}" />
                  </div>
                  <div style="width:100%; text-align:left;">
                    <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${first.brand}</div>
                    <h3 style="font-size:1.35rem; font-weight:800; margin-bottom:8px;">${first.model}</h3>
                    <div style="font-family:var(--font-telemetry); font-size:1.1rem; color:var(--accent); font-weight:700; margin-bottom:14px;">
                      ${formatBenchmarkMetric(first, activeBenchmark)}
                    </div>
                    <div style="display:flex; gap:8px;">
                      <button class="btn btn-primary btn-sm podium-btn-specs" data-car-id="${first.id}" style="flex:1;">
                        View Specs
                      </button>
                      <button class="car-rev-btn podium-btn-rev" data-sound="${first.soundType}" style="position:static;">
                        Sound
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            `
                : ""
            }

            <!-- 3rd Place Bronze -->
            ${
              third
                ? `
              <div class="podium-place podium-3">
                <div class="podium-box">
                  <div style="width:100%; display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                    <span style="font-family:var(--font-mono); font-size:1.4rem; font-weight:800; color:#B0703C;">03</span>
                    <span class="badge" style="border-color:rgba(205,127,50,0.4); color:#CD7F32;">Bronze</span>
                  </div>
                  <div style="width:100%; height:150px; overflow:hidden; border-radius:var(--radius-xs); margin-bottom:12px; background:#0B0B0B;">
                    <img src="${third.image}" style="width:100%; height:100%; object-fit:cover;" alt="${third.model}" />
                  </div>
                  <div style="width:100%; text-align:left;">
                    <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">${third.brand}</div>
                    <h4 style="font-size:1.15rem; margin-bottom:8px; font-weight:700;">${third.model}</h4>
                    <div style="font-family:var(--font-telemetry); font-size:0.95rem; color:var(--text-primary); font-weight:700; margin-bottom:14px;">
                      ${formatBenchmarkMetric(third, activeBenchmark)}
                    </div>
                    <button class="btn btn-secondary btn-sm podium-btn-specs" data-car-id="${third.id}" style="width:100%;">
                      View Specs
                    </button>
                  </div>
                </div>
              </div>
            `
                : ""
            }
          </div>

          <!-- FULL LEADERBOARD TABLE -->
          <div class="comparison-table-wrap">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th style="width:70px;">Rank</th>
                  <th>Vehicle</th>
                  <th>Category</th>
                  <th>Horsepower</th>
                  <th>0–100 km/h</th>
                  <th>Top Speed</th>
                  <th>Weight</th>
                  <th style="text-align:right;">Actions</th>
                </tr>
              </thead>
              <tbody>
                ${cars
                  .map((car, idx) => {
                    const rankNum = (idx + 1).toString().padStart(2, "0");
                    const isTop1 = idx === 0;
                    return `
                    <tr style="${isTop1 ? 'background:rgba(212,175,55,0.03);' : ''}">
                      <td style="font-family:var(--font-mono); font-weight:700; color:${isTop1 ? '#D4AF37' : idx === 1 ? '#C0C0C0' : idx === 2 ? '#CD7F32' : 'var(--text-muted)'}; font-size:0.85rem;">
                        ${rankNum}
                      </td>
                      <td>
                        <div style="display:flex; align-items:center; gap:12px;">
                          <img src="${car.image}" style="width:48px; height:32px; object-fit:cover; border-radius:var(--radius-xs);" alt="" />
                          <div>
                            <div style="font-weight:600; font-size:0.875rem;">${car.brand} ${car.model}</div>
                            <div style="font-family:var(--font-mono); font-size:0.68rem; color:var(--text-muted);">${car.engine}</div>
                          </div>
                        </div>
                      </td>
                      <td><span class="badge">${car.category}</span></td>
                      <td style="font-family:var(--font-telemetry); font-weight:600;">${car.horsepower} HP</td>
                      <td style="font-family:var(--font-telemetry); font-weight:600;">${car.acceleration}s</td>
                      <td style="font-family:var(--font-telemetry); font-weight:600;">${car.topSpeed} KM/H</td>
                      <td style="color:var(--text-muted); font-size:0.8rem;">${car.weight} kg</td>
                      <td style="text-align:right;">
                        <button class="btn btn-secondary btn-sm table-btn-specs" data-car-id="${car.id}">
                          Specs
                        </button>
                      </td>
                    </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    attachRankingsEvents(container);
  }

  function formatBenchmarkMetric(car, bm) {
    if (bm === "speed") return `${car.topSpeed} KM/H TOP SPEED`;
    if (bm === "power") return `${car.horsepower} HORSEPOWER`;
    if (bm === "accel") return `${car.acceleration}s (0–100 KM/H)`;
    if (bm === "drift") return `${car.handlingScore || 92} / 100 HANDLING SCORE`;
    if (bm === "jdm") return `${(car.views || 0).toLocaleString()} VAULT VIEWS`;
    return `${car.topSpeed} KM/H`;
  }

  function attachRankingsEvents(container) {
    // Benchmark filter pill switches
    container.querySelectorAll("[data-bm]").forEach((btn) => {
      btn.addEventListener("click", () => {
        soundEngine.playClick();
        activeBenchmark = btn.getAttribute("data-bm");
        updateView();
      });
    });

    // View Specs Buttons (Podium & Table)
    container.querySelectorAll(".podium-btn-specs, .table-btn-specs").forEach((btn) => {
      btn.addEventListener("click", () => {
        soundEngine.playClick();
        const carId = btn.getAttribute("data-car-id");
        window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
      });
    });

    // Rev acoustic button on champion podium
    container.querySelectorAll(".podium-btn-rev").forEach((btn) => {
      btn.addEventListener("click", () => {
        const soundType = btn.getAttribute("data-sound");
        soundEngine.playRev(soundType);
      });
    });
  }

  updateView();
}
