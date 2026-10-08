/**
 * DRIFTVERSE - Compare Engine & Visual Battle Arena (Editorial Redesign)
 * Side-by-side technical benchmarks, performance radar, drag simulation, and matched footage
 */
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";

export function renderComparePage(container) {
  const allCars = store.getCars();
  const comparedIds = store.compareList;
  const comparedCars = comparedIds.map((id) => store.getCarById(id)).filter(Boolean);

  // Smart Race Video Recommendations
  const { directMatches, relatedVideos } = store.getSmartRaceVideos(comparedIds);

  container.innerHTML = `
    <div class="section-wrapper">
      <div class="container">
        <!-- Section Header -->
        <div class="section-header">
          <div class="section-title-wrap">
            <div class="section-tag">Technical Telemetry</div>
            <h1>Side-by-Side Comparison</h1>
            <div class="section-subtitle">
              Select 2 to 4 performance machines to analyze acceleration curves, horsepower output, top speed, and power-to-weight differentials.
            </div>
          </div>

          <div style="display:flex; gap:10px; align-items:center;">
            <button class="btn btn-secondary btn-sm" id="btn-clear-roster">
              Clear Roster
            </button>
            <button class="btn btn-primary" id="btn-start-battle-main" ${comparedCars.length < 2 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>
              Simulate Drag Race
            </button>
          </div>
        </div>

        <!-- 1. Car Selector Slots (2 to 4 Slots) -->
        <div class="compare-grid" id="compare-slots-container">
          ${[0, 1, 2, 3]
            .map((slotIdx) => {
              const car = comparedCars[slotIdx];
              if (car) {
                return `
                  <div class="compare-card-slot filled">
                    <div style="position:relative; width:100%; height:180px; background:#0B0B0B;">
                      <img src="${car.image}" style="width:100%; height:100%; object-fit:cover;" alt="${car.model}" />
                      <button class="car-action-icon-btn remove-slot-btn" data-car-id="${car.id}" style="position:absolute; top:8px; right:8px;" title="Remove car">
                        ✕
                      </button>
                      <span class="badge" style="position:absolute; bottom:8px; left:8px;">${car.category}</span>
                      <button class="car-rev-btn slot-rev-btn" data-sound="${car.soundType}" style="bottom:8px; right:8px;">
                        Sound
                      </button>
                    </div>

                    <div style="padding:1.15rem;">
                      <div class="car-card-brand">${car.brand}</div>
                      <h3 style="font-size:1.15rem; margin-bottom:12px; font-weight:700;">${car.model}</h3>

                      <div class="car-specs-grid" style="margin-bottom:12px;">
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

                      <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">
                        ${car.engineDetails}
                      </div>
                    </div>
                  </div>
                `;
              } else {
                return `
                  <div class="compare-card-slot">
                    <div class="compare-empty-icon">+</div>
                    <h4 style="margin-bottom:4px; font-size:0.95rem; font-weight:600;">Slot ${slotIdx + 1}</h4>
                    <p style="font-size:0.8rem; color:var(--text-muted); margin-bottom:14px;">Select a vehicle from the vault</p>
                    <select class="slot-add-select" data-slot="${slotIdx}" style="max-width:220px; font-size:0.8rem;">
                      <option value="">-- Choose Car --</option>
                      ${allCars
                        .filter((c) => !comparedIds.includes(c.id))
                        .map((c) => `<option value="${c.id}">${c.brand} ${c.model} (${c.horsepower} HP)</option>`)
                        .join("")}
                    </select>
                  </div>
                `;
              }
            })
            .join("")}
        </div>

        ${
          comparedCars.length < 2
            ? `
          <div style="text-align:center; padding:3rem 1.5rem; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); margin-bottom:30px;">
            <div style="font-size:1.8rem; margin-bottom:8px; color:var(--accent);">⇄</div>
            <h3 style="margin-bottom:6px; font-size:1.25rem;">Select at Least 2 Vehicles</h3>
            <p style="font-size:0.875rem; color:var(--text-muted); max-width:480px; margin:0 auto;">
              Choose two or more models in the slots above to generate performance comparison bars, radar charts, and matched video footage.
            </p>
          </div>
        `
            : `
          <!-- 2. SIDE-BY-SIDE SPECIFICATIONS MATRIX -->
          <div class="comparison-table-wrap">
            <table class="comparison-table">
              <thead>
                <tr>
                  <th style="width:220px;">Metric</th>
                  ${comparedCars.map((c) => `<th>${c.brand} ${c.model}</th>`).join("")}
                </tr>
              </thead>
              <tbody>
                <!-- Horsepower -->
                <tr>
                  <td><strong>Horsepower</strong></td>
                  ${comparedCars
                    .map((c) => {
                      const maxHp = Math.max(...comparedCars.map((x) => x.horsepower));
                      const isMax = c.horsepower === maxHp;
                      return `
                      <td>
                        <span class="${isMax ? 'spec-leader' : ''}">${c.horsepower} HP ${isMax ? '★' : ''}</span>
                        <div class="spec-bar-wrapper">
                          <div class="spec-bar-fill" style="width:${(c.horsepower / 2000) * 100}%;"></div>
                        </div>
                      </td>
                    `;
                    })
                    .join("")}
                </tr>

                <!-- 0-100 km/h (Lower is better) -->
                <tr>
                  <td><strong>0–100 km/h</strong></td>
                  ${comparedCars
                    .map((c) => {
                      const minAcc = Math.min(...comparedCars.map((x) => x.acceleration));
                      const isBest = c.acceleration === minAcc;
                      return `
                      <td>
                        <span class="${isBest ? 'spec-leader' : ''}">${c.acceleration}s ${isBest ? '★' : ''}</span>
                        <div class="spec-bar-wrapper">
                          <div class="spec-bar-fill" style="width:${Math.max(15, 100 - (c.acceleration / 6) * 100)}%;"></div>
                        </div>
                      </td>
                    `;
                    })
                    .join("")}
                </tr>

                <!-- Top Speed -->
                <tr>
                  <td><strong>Top Speed</strong></td>
                  ${comparedCars
                    .map((c) => {
                      const maxSpeed = Math.max(...comparedCars.map((x) => x.topSpeed));
                      const isMax = c.topSpeed === maxSpeed;
                      return `
                      <td>
                        <span class="${isMax ? 'spec-leader' : ''}">${c.topSpeed} km/h ${isMax ? '★' : ''}</span>
                        <div class="spec-bar-wrapper">
                          <div class="spec-bar-fill" style="width:${(c.topSpeed / 500) * 100}%;"></div>
                        </div>
                      </td>
                    `;
                    })
                    .join("")}
                </tr>

                <!-- Power-to-weight Ratio -->
                <tr>
                  <td><strong>Power to Weight</strong></td>
                  ${comparedCars
                    .map((c) => {
                      const ptw = ((c.horsepower / c.weight) * 1000).toFixed(1);
                      const maxPtw = Math.max(...comparedCars.map((x) => (x.horsepower / x.weight) * 1000));
                      const isBest = Math.abs(parseFloat(ptw) - maxPtw) < 1;
                      return `
                      <td>
                        <span class="${isBest ? 'spec-leader' : ''}">${ptw} HP/Tonne</span>
                        <div class="spec-bar-wrapper">
                          <div class="spec-bar-fill" style="width:${Math.min(100, (parseFloat(ptw) / 1000) * 100)}%;"></div>
                        </div>
                      </td>
                    `;
                    })
                    .join("")}
                </tr>

                <!-- Drivetrain -->
                <tr>
                  <td><strong>Drivetrain</strong></td>
                  ${comparedCars.map((c) => `<td>${c.drive}</td>`).join("")}
                </tr>

                <!-- Engine & Aspiration -->
                <tr>
                  <td><strong>Engine Type</strong></td>
                  ${comparedCars.map((c) => `<td>${c.engine}</td>`).join("")}
                </tr>

                <!-- Transmission -->
                <tr>
                  <td><strong>Transmission</strong></td>
                  ${comparedCars.map((c) => `<td>${c.transmission}</td>`).join("")}
                </tr>

                <!-- Curb Weight -->
                <tr>
                  <td><strong>Curb Weight</strong></td>
                  ${comparedCars.map((c) => `<td>${c.weight.toLocaleString()} kg</td>`).join("")}
                </tr>

                <!-- Price / MSRP -->
                <tr>
                  <td><strong>Estimated MSRP</strong></td>
                  ${comparedCars.map((c) => `<td style="font-weight:600; color:var(--text-primary);">${c.price}</td>`).join("")}
                </tr>
              </tbody>
            </table>
          </div>

          <!-- 3. PERFORMANCE RADAR TELEMETRY CHART -->
          <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-md); padding:clamp(1.5rem, 3vw, 2.5rem); margin-bottom:36px;">
            <div class="section-tag" style="margin-bottom:8px;">Multi-Dimensional Analysis</div>
            <h3 style="margin-bottom:18px;">Performance Radar Overlay</h3>

            <div style="display:flex; flex-wrap:wrap; align-items:center; justify-content:center; gap:36px;">
              <div style="width:320px; height:320px; display:flex; align-items:center; justify-content:center;">
                ${renderRadarChartSvg(comparedCars)}
              </div>

              <!-- Legend Details -->
              <div style="flex:1; min-width:260px; display:flex; flex-direction:column; gap:12px;">
                <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:4px;">
                  Five-axis evaluation factoring engine output, top velocity, launch acceleration, cornering balance, and engine acoustic intensity.
                </div>

                <div style="display:flex; flex-direction:column; gap:8px;">
                  ${comparedCars
                    .map((c, idx) => {
                      const colors = ["#FF4D00", "#00B4D8", "#D4AF37", "#2EC4B6"];
                      const clr = colors[idx % colors.length];
                      return `
                      <div style="display:flex; align-items:center; justify-content:space-between; padding:8px 12px; background:rgba(255,255,255,0.02); border-left:3px solid ${clr}; border-radius:var(--radius-xs);">
                        <span style="font-weight:600; color:#fff; font-size:0.875rem;">${c.brand} ${c.model}</span>
                        <span class="badge" style="border-color:${clr}; color:${clr}; font-size:0.75rem;">${c.horsepower} HP • ${c.topSpeed} KM/H</span>
                      </div>
                    `;
                    })
                    .join("")}
                </div>
              </div>
            </div>
          </div>
        `
        }

        <!-- 4. SMART RACE VIDEO RECOMMENDATIONS -->
        <div style="margin-top:20px;">
          <div class="section-header">
            <div class="section-title-wrap">
              <div class="section-tag">Footage Matcher</div>
              <h2>Watch Them in Action</h2>
              <div class="section-subtitle">
                Relevant video recordings featuring the selected vehicles.
              </div>
            </div>
          </div>

          ${
            directMatches.length > 0
              ? `
            <div style="margin-bottom:30px;">
              <div style="display:inline-flex; align-items:center; gap:8px; padding:3px 10px; background:rgba(255,77,0,0.08); border:1px solid rgba(255,77,0,0.3); border-radius:var(--radius-xs); color:var(--accent); font-family:var(--font-mono); font-size:0.72rem; font-weight:600; margin-bottom:14px;">
                Direct Head-to-Head Matches (${directMatches.length})
              </div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                ${directMatches.map((v) => renderDirectMatchVideoCard(v)).join("")}
              </div>
            </div>
          `
              : `
            <div style="padding:1.25rem; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); margin-bottom:24px; font-size:0.85rem; color:var(--text-muted);">
              No tandem drag clip found for this exact pairing. Showing individual high-speed runs below:
            </div>
          `
          }

          <!-- Related Standalone Runs -->
          ${
            relatedVideos.length > 0
              ? `
            <div>
              <div class="section-tag" style="margin-bottom:12px;">Solo & Touge Runs</div>
              <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:20px;">
                ${relatedVideos.map((v) => renderDirectMatchVideoCard(v)).join("")}
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>

    <!-- Battle Countdown & Shootout Modal Container -->
    <div id="battle-modal-placeholder"></div>
  `;

  attachCompareEvents(container, comparedCars);
}

// Direct Match Video Card Renderer
function renderDirectMatchVideoCard(v) {
  return `
    <div class="video-card" data-video-id="${v.id}">
      <div class="video-card-media">
        <img src="${v.thumbnail}" class="video-card-img" alt="${v.title}" />
        <div class="video-play-overlay">
          <div class="play-circle">▶</div>
        </div>
        <span class="video-duration">${v.duration}</span>
      </div>
      <div class="video-card-body">
        <div class="video-cars-chips">
          <span class="badge" style="background:var(--accent); color:#fff;">Battle</span>
          <span class="badge">${v.category}</span>
        </div>
        <h4 class="video-title">${v.title}</h4>
        <div class="video-meta-row">
          <span>${(v.views || 0).toLocaleString()} views</span>
          <span>${v.category}</span>
        </div>
      </div>
    </div>
  `;
}

// Generate SVG Radar Chart for 2-4 Cars
function renderRadarChartSvg(cars) {
  const size = 320;
  const center = size / 2;
  const radius = 105;
  const metrics = ["Power", "Top Speed", "0–100 Accel", "Handling", "Acoustics"];
  const count = metrics.length;
  const colors = ["#FF4D00", "#00B4D8", "#D4AF37", "#2EC4B6"];

  const angleStep = (Math.PI * 2) / count;

  // Concentric polygon rings
  const rings = [0.25, 0.5, 0.75, 1.0];
  const ringPolygons = rings
    .map((r) => {
      const points = [];
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const x = center + radius * r * Math.cos(angle);
        const y = center + radius * r * Math.sin(angle);
        points.push(`${x},${y}`);
      }
      return `<polygon points="${points.join(' ')}" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="1" />`;
    })
    .join("");

  // Axis Spokes
  const spokes = [];
  const labels = [];
  for (let i = 0; i < count; i++) {
    const angle = i * angleStep - Math.PI / 2;
    const x = center + radius * Math.cos(angle);
    const y = center + radius * Math.sin(angle);
    spokes.push(`<line x1="${center}" y1="${center}" x2="${x}" y2="${y}" stroke="rgba(255,255,255,0.1)" stroke-width="1" />`);

    const lx = center + (radius + 20) * Math.cos(angle);
    const ly = center + (radius + 20) * Math.sin(angle);
    labels.push(
      `<text x="${lx}" y="${ly}" fill="#888" font-size="10" font-family="Inter" font-weight="600" text-anchor="middle" dominant-baseline="middle">${metrics[i]}</text>`
    );
  }

  // Car Radar Polygons
  const carPolygons = cars
    .map((c, idx) => {
      const pScale = Math.min(1, c.horsepower / 1800);
      const sScale = Math.min(1, c.topSpeed / 480);
      const aScale = Math.max(0.2, 1 - (c.acceleration - 1.8) / 4);
      const hScale = (c.handlingScore || 85) / 100;
      const acScale = c.category === "Hypercar" ? 0.95 : c.category === "Supercar" ? 0.9 : 0.8;

      const scales = [pScale, sScale, aScale, hScale, acScale];
      const points = [];

      for (let i = 0; i < count; i++) {
        const angle = i * angleStep - Math.PI / 2;
        const val = Math.max(0.15, scales[i]);
        const x = center + radius * val * Math.cos(angle);
        const y = center + radius * val * Math.sin(angle);
        points.push(`${x},${y}`);
      }

      const clr = colors[idx % colors.length];
      return `
        <polygon points="${points.join(' ')}" fill="${clr}" fill-opacity="0.12" stroke="${clr}" stroke-width="1.8" />
        ${points
          .map((pt) => {
            const [px, py] = pt.split(",");
            return `<circle cx="${px}" cy="${py}" r="3" fill="${clr}" />`;
          })
          .join("")}
      `;
    })
    .join("");

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      ${ringPolygons}
      ${spokes.join("")}
      ${carPolygons}
      ${labels.join("")}
    </svg>
  `;
}

function attachCompareEvents(container, comparedCars) {
  // Clear roster
  const clearBtn = container.querySelector("#btn-clear-roster");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      soundEngine.playClick();
      store.clearCompare();
      renderComparePage(container);
    });
  }

  // Remove individual slot
  container.querySelectorAll(".remove-slot-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      soundEngine.playClick();
      const carId = btn.getAttribute("data-car-id");
      store.removeFromCompare(carId);
      renderComparePage(container);
    });
  });

  // Rev in slot
  container.querySelectorAll(".slot-rev-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const soundType = btn.getAttribute("data-sound");
      soundEngine.playRev(soundType);
    });
  });

  // Slot add select dropdowns
  container.querySelectorAll(".slot-add-select").forEach((select) => {
    select.addEventListener("change", (e) => {
      if (e.target.value) {
        soundEngine.playClick();
        store.addToCompare(e.target.value);
        renderComparePage(container);
      }
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

  // START BATTLE TRIGGER
  const startBattleBtn = container.querySelector("#btn-start-battle-main");
  if (startBattleBtn) {
    startBattleBtn.addEventListener("click", () => {
      if (comparedCars.length < 2) return;
      launchCinematicBattle(container, comparedCars);
    });
  }
}

// 3... 2... 1... GO! BATTLE COUNTDOWN & ANIMATED RACE SHOOTOUT
function launchCinematicBattle(container, cars) {
  const placeholder = container.querySelector("#battle-modal-placeholder");
  if (!placeholder) return;

  placeholder.innerHTML = `
    <div class="battle-modal-overlay" id="battle-modal-root">
      <div class="battle-modal-content">
        <!-- Countdown Screen -->
        <div id="battle-stage-countdown">
          <div class="section-tag" style="justify-content:center; margin-bottom:12px;">Launch Control Staging</div>
          <div class="countdown-display anim-countdown" id="battle-countdown-number">3</div>
          <p style="font-size:0.875rem; color:var(--text-muted); font-family:var(--font-mono);">
            HOLDING RPM // GREEN LIGHT IMMINENT...
          </p>
        </div>

        <!-- Animated Drag Strip Screen (Revealed at GO) -->
        <div id="battle-stage-drag" style="display:none;">
          <div class="section-tag" style="justify-content:center; margin-bottom:6px;">Quarter Mile Simulation</div>
          <h2 style="font-size:1.6rem; margin-bottom:16px;">Quarter Mile Sprint</h2>

          <div class="drag-strip-track">
            ${cars
              .map(
                (c, idx) => `
              <div class="drag-lane">
                <div class="lane-car-info">${c.brand} ${c.model}</div>
                <div class="lane-track-strip">
                  <div class="lane-racer-bullet" id="racer-bullet-${idx}" style="width:0%;">
                    ▲
                  </div>
                </div>
              </div>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Winner Podium & Category Awards (Revealed at finish) -->
        <div id="battle-stage-winner" style="display:none; text-align:center;">
          <div class="section-tag" style="justify-content:center; margin-bottom:4px;">Drag Simulation Winner</div>
          <h2 id="winner-car-name" style="color:var(--accent); font-size:2rem; margin-bottom:16px;"></h2>

          <!-- Category Winners Matrix -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(180px, 1fr)); gap:10px; margin:20px 0; text-align:left;">
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); padding:10px 14px; border-radius:var(--radius-xs);">
              <div style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono);">ACCELERATION</div>
              <div id="award-accel" style="font-weight:700; color:var(--text-primary); font-size:0.875rem;"></div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); padding:10px 14px; border-radius:var(--radius-xs);">
              <div style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono);">TOP VELOCITY</div>
              <div id="award-speed" style="font-weight:700; color:var(--text-primary); font-size:0.875rem;"></div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); padding:10px 14px; border-radius:var(--radius-xs);">
              <div style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono);">MAX POWER</div>
              <div id="award-power" style="font-weight:700; color:var(--accent); font-size:0.875rem;"></div>
            </div>
            <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); padding:10px 14px; border-radius:var(--radius-xs);">
              <div style="font-size:0.65rem; color:var(--text-muted); font-family:var(--font-mono);">POWER TO WEIGHT</div>
              <div id="award-ptw" style="font-weight:700; color:var(--text-primary); font-size:0.875rem;"></div>
            </div>
          </div>

          <button class="btn btn-primary" id="btn-close-battle-modal">
            Accept Telemetry Results
          </button>
        </div>
      </div>
    </div>
  `;

  // Start sequence: 3... 2... 1... GO!
  const numberEl = placeholder.querySelector("#battle-countdown-number");
  const stageCountdown = placeholder.querySelector("#battle-stage-countdown");
  const stageDrag = placeholder.querySelector("#battle-stage-drag");
  const stageWinner = placeholder.querySelector("#battle-stage-winner");

  let count = 3;
  soundEngine.playCountdownBeep(3);

  const countdownTimer = setInterval(() => {
    count--;
    if (count > 0) {
      if (numberEl) {
        numberEl.textContent = count;
        numberEl.classList.remove("anim-countdown");
        void numberEl.offsetWidth; // reflow
        numberEl.classList.add("anim-countdown");
      }
      soundEngine.playCountdownBeep(count);
    } else if (count === 0) {
      // "GO!"
      if (numberEl) {
        numberEl.textContent = "GO";
        numberEl.style.color = "var(--accent)";
      }
      soundEngine.playCountdownBeep("GO");

      // Switch to drag strip
      setTimeout(() => {
        stageCountdown.style.display = "none";
        stageDrag.style.display = "block";

        // Animate racer bullets
        cars.forEach((c, idx) => {
          const bullet = placeholder.querySelector(`#racer-bullet-${idx}`);
          if (bullet) {
            const duration = Math.max(1.2, c.acceleration * 0.45);
            bullet.style.transitionDuration = `${duration}s`;
            setTimeout(() => {
              bullet.style.width = "100%";
            }, 50);
          }
        });

        // Tally results after race ends
        setTimeout(() => {
          stageDrag.style.display = "none";
          stageWinner.style.display = "block";

          const bestAccel = [...cars].sort((a, b) => a.acceleration - b.acceleration)[0];
          const bestSpeed = [...cars].sort((a, b) => b.topSpeed - a.topSpeed)[0];
          const bestPower = [...cars].sort((a, b) => b.horsepower - a.horsepower)[0];
          const bestPtw = [...cars].sort((a, b) => b.horsepower / b.weight - a.horsepower / a.weight)[0];

          const overallWinner = bestAccel;

          placeholder.querySelector("#winner-car-name").textContent = `${overallWinner.brand} ${overallWinner.model}`;
          placeholder.querySelector("#award-accel").textContent = `${bestAccel.model} (${bestAccel.acceleration}s)`;
          placeholder.querySelector("#award-speed").textContent = `${bestSpeed.model} (${bestSpeed.topSpeed} KM/H)`;
          placeholder.querySelector("#award-power").textContent = `${bestPower.model} (${bestPower.horsepower} HP)`;
          placeholder.querySelector("#award-ptw").textContent = `${bestPtw.model} (${((bestPtw.horsepower / bestPtw.weight) * 1000).toFixed(0)} HP/T)`;

          soundEngine.playRev(overallWinner.soundType);

          const closeBtn = placeholder.querySelector("#btn-close-battle-modal");
          if (closeBtn) {
            closeBtn.addEventListener("click", () => {
              placeholder.innerHTML = "";
            });
          }
        }, 2200);
      }, 500);

      clearInterval(countdownTimer);
    }
  }, 900);
}
