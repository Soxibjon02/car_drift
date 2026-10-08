/**
 * DRIFTVERSE - Control Center & Administration Cockpit
 * Role-Based Access Control (RBAC), KPI telemetry cards, SVG charts,
 * Video Management, Car Vault Management, User Moderation, and Comment Moderation
 */
import { store } from "../services/store.js";
import { authService } from "../services/auth.js";
import { soundEngine } from "../services/audio.js";
import { carBrands, carCategories, categoriesList } from "../data/initialState.js";

export function renderAdminPage(container) {
  // Security RBAC Check
  if (!authService.isAdmin()) {
    container.innerHTML = `
      <div class="section-wrapper">
        <div class="container" style="text-align:center; padding:5rem 1rem;">
          <div style="font-size:4rem; margin-bottom:16px;">🛑</div>
          <div class="section-tag" style="justify-content:center; margin-bottom:12px; color:#FF0000;">SECURITY PROTOCOL ENGAGED</div>
          <h1 style="font-size:2.5rem; margin-bottom:12px;">ACCESS DENIED: CLEARANCE REQUIRED</h1>
          <p style="color:var(--text-secondary); max-width:600px; margin:0 auto 24px; font-size:1rem;">
            You have attempted to breach the DRIFTVERSE Control Center without verified Administrator privileges.
          </p>
          <div style="display:flex; justify-content:center; gap:16px; flex-wrap:wrap;">
            <button class="btn btn-secondary" id="admin-denied-home">
              RETURN TO SAFETY (HOME) 🏠
            </button>
            <button class="btn btn-primary" id="admin-denied-unlock-demo">
              👑 DEMO: ELEVATE TO DRIFT COMMANDER (ADMIN)
            </button>
          </div>
        </div>
      </div>
    `;

    const homeBtn = container.querySelector("#admin-denied-home");
    if (homeBtn) {
      homeBtn.addEventListener("click", () => {
        soundEngine.playClick();
        window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "home" } }));
      });
    }

    const unlockDemo = container.querySelector("#admin-denied-unlock-demo");
    if (unlockDemo) {
      unlockDemo.addEventListener("click", () => {
        authService.demoSwitchRole("Admin");
        soundEngine.playRev("v12-roar");
        window.dispatchEvent(
          new CustomEvent("driftverse:toast", {
            detail: { message: "Clearance Granted: Commander Drift Activated." }
          })
        );
        renderAdminPage(container);
      });
    }
    return;
  }

  // Admin Cockpit State
  let activeTab = "dashboard"; // "dashboard" | "videos" | "cars" | "users" | "comments"

  function updateAdminView() {
    const cars = store.getCars();
    const videos = store.getVideos();
    const users = store.users;
    const comments = store.comments;

    const totalViews = videos.reduce((acc, v) => acc + (v.views || 0), 0);
    const totalLikes = videos.reduce((acc, v) => acc + (v.likes || 0), 0);

    container.innerHTML = `
      <div class="section-wrapper">
        <div class="container">
          <!-- Admin Cockpit Header -->
          <div class="section-header" style="border-bottom:1px solid var(--border-medium); padding-bottom:20px;">
            <div class="section-title-wrap">
              <div class="section-tag" style="color:var(--accent);">DRIFTVERSE CONTROL CENTER // SYS-ROOT</div>
              <h1>ADMIN COCKPIT</h1>
              <div class="section-subtitle">
                System telemetry monitoring, media pipeline moderation, car vault curation, and pilot security roles.
              </div>
            </div>

            <!-- Active Admin Badge -->
            <div style="display:flex; align-items:center; gap:12px;">
              <span class="badge" style="background:rgba(255,45,0,0.2); border-color:var(--accent); color:#FF6A00;">
                CLEARANCE: COMMANDER
              </span>
              <button class="btn btn-secondary btn-sm" id="btn-admin-view-site">
                VIEW PUBLIC SITE ➔
              </button>
            </div>
          </div>

          <!-- Cockpit Tabs Navigation Strip -->
          <div class="filter-pills" style="margin:24px 0 32px;">
            <button class="filter-pill ${activeTab === 'dashboard' ? 'active' : ''}" data-admin-tab="dashboard">
              📊 Telemetry Dashboard
            </button>
            <button class="filter-pill ${activeTab === 'videos' ? 'active' : ''}" data-admin-tab="videos">
              🎬 Video Pipeline (${videos.length})
            </button>
            <button class="filter-pill ${activeTab === 'cars' ? 'active' : ''}" data-admin-tab="cars">
              🏎️ Car Vault (${cars.length})
            </button>
            <button class="filter-pill ${activeTab === 'users' ? 'active' : ''}" data-admin-tab="users">
              👥 Pilot Accounts (${users.length})
            </button>
            <button class="filter-pill ${activeTab === 'comments' ? 'active' : ''}" data-admin-tab="comments">
              💬 Chatter Moderation (${comments.length})
            </button>
          </div>

          <!-- Dynamic Tab Content -->
          <div id="admin-tab-content">
            ${
              activeTab === "dashboard"
                ? renderDashboardTabHtml(cars, videos, users, comments, totalViews, totalLikes)
                : activeTab === "videos"
                ? renderVideosTabHtml(videos)
                : activeTab === "cars"
                ? renderCarsTabHtml(cars)
                : activeTab === "users"
                ? renderUsersTabHtml(users)
                : renderCommentsTabHtml(comments)
            }
          </div>
        </div>
      </div>

      <!-- Action Modals Placeholders -->
      <div id="admin-submodal-placeholder"></div>
    `;

    attachAdminEvents(container);
  }

  // --- TAB 1: TELEMETRY DASHBOARD ---
  function renderDashboardTabHtml(cars, videos, users, comments, totalViews, totalLikes) {
    return `
      <!-- KPI Stats Grid -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:36px;">
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-left:4px solid var(--accent); padding:20px; border-radius:var(--radius-xs);">
          <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">TOTAL REGISTERED PILOTS</div>
          <div style="font-family:var(--font-display); font-size:2rem; font-weight:900; color:#fff; margin-top:4px;">${users.length}</div>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-left:4px solid #FF6A00; padding:20px; border-radius:var(--radius-xs);">
          <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">TRANSMITTED CLIPS</div>
          <div style="font-family:var(--font-display); font-size:2rem; font-weight:900; color:#FF6A00; margin-top:4px;">${videos.length}</div>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-left:4px solid #00E676; padding:20px; border-radius:var(--radius-xs);">
          <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">MACHINES IN VAULT</div>
          <div style="font-family:var(--font-display); font-size:2rem; font-weight:900; color:#00E676; margin-top:4px;">${cars.length}</div>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-left:4px solid #00E5FF; padding:20px; border-radius:var(--radius-xs);">
          <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">GLOBAL CLIP VIEWS</div>
          <div style="font-family:var(--font-display); font-size:2rem; font-weight:900; color:#00E5FF; margin-top:4px;">${(totalViews / 1000000).toFixed(2)}M</div>
        </div>
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-left:4px solid #FFD700; padding:20px; border-radius:var(--radius-xs);">
          <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">PILOT APPRECIATION LIKES</div>
          <div style="font-family:var(--font-display); font-size:2rem; font-weight:900; color:#FFD700; margin-top:4px;">${(totalLikes / 1000).toFixed(0)}K</div>
        </div>
      </div>

      <!-- Telemetry Visual SVG Charts -->
      <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(380px, 1fr)); gap:24px;">
        <!-- Chart 1: Bandwidth & Watch Telemetry -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:1.75rem;">
          <div class="section-tag" style="margin-bottom:8px;">BANDWIDTH CONSUMPTION</div>
          <h3 style="font-size:1.25rem; margin-bottom:16px;">HIGH-OCTANE WATCH DURATION (TB)</h3>
          
          <svg viewBox="0 0 400 180" style="width:100%; height:auto;">
            <!-- Grid lines -->
            <line x1="20" y1="30" x2="380" y2="30" stroke="rgba(255,255,255,0.06)" />
            <line x1="20" y1="80" x2="380" y2="80" stroke="rgba(255,255,255,0.06)" />
            <line x1="20" y1="130" x2="380" y2="130" stroke="rgba(255,255,255,0.06)" />
            
            <!-- Curved Area Line -->
            <path d="M 20 140 Q 80 120 140 85 T 260 50 T 380 20 L 380 160 L 20 160 Z" fill="rgba(255,45,0,0.15)" />
            <path d="M 20 140 Q 80 120 140 85 T 260 50 T 380 20" fill="none" stroke="var(--accent)" stroke-width="3" />
            
            <!-- Points -->
            <circle cx="20" cy="140" r="4" fill="#fff" />
            <circle cx="140" cy="85" r="4" fill="#fff" />
            <circle cx="260" cy="50" r="4" fill="#fff" />
            <circle cx="380" cy="20" r="4" fill="var(--accent)" />

            <!-- Labels -->
            <text x="20" y="175" fill="#888" font-size="10" font-family="monospace">MON</text>
            <text x="140" y="175" fill="#888" font-size="10" font-family="monospace">WED</text>
            <text x="260" y="175" fill="#888" font-size="10" font-family="monospace">FRI</text>
            <text x="360" y="175" fill="#888" font-size="10" font-family="monospace">SUN</text>
          </svg>
        </div>

        <!-- Chart 2: Category Distribution Breakdown -->
        <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-sm); padding:1.75rem;">
          <div class="section-tag" style="margin-bottom:8px;">CHANNEL TRAFFIC DYNAMICS</div>
          <h3 style="font-size:1.25rem; margin-bottom:16px;">CONTENT ENGAGEMENT SPECTRUM</h3>

          <div style="display:flex; flex-direction:column; gap:14px; margin-top:20px;">
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span>💨 DRIFT ZONE</span>
                <span style="color:var(--accent); font-weight:700;">42%</span>
              </div>
              <div class="spec-bar-wrapper">
                <div class="spec-bar-fill" style="width:42%;"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span>⚡ SUPERCARS & HYPERCARS</span>
                <span style="color:#00E5FF; font-weight:700;">28%</span>
              </div>
              <div class="spec-bar-wrapper">
                <div class="spec-bar-fill" style="background:#00E5FF; width:28%;"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span>🔰 JDM CULTURE (2JZ / ROTARY)</span>
                <span style="color:#FFD700; font-weight:700;">18%</span>
              </div>
              <div class="spec-bar-wrapper">
                <div class="spec-bar-fill" style="background:#FFD700; width:18%;"></div>
              </div>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:0.8rem; margin-bottom:4px;">
                <span>🔊 EXHAUST & SOUND BATTLES</span>
                <span style="color:#00E676; font-weight:700;">12%</span>
              </div>
              <div class="spec-bar-wrapper">
                <div class="spec-bar-fill" style="background:#00E676; width:12%;"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  // --- TAB 2: VIDEOS MANAGEMENT ---
  function renderVideosTabHtml(videos) {
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="font-size:1.3rem;">TRANSMITTED VIDEO REGISTRY (${videos.length})</h3>
        <button class="btn btn-primary" id="btn-admin-add-video">
          + BROADCAST NEW CLIP 🎬
        </button>
      </div>

      <div class="comparison-table-wrap">
        <table class="comparison-table">
          <thead>
            <tr>
              <th style="width:80px;">PREVIEW</th>
              <th>TITLE & LINKED CARS</th>
              <th>CHANNEL</th>
              <th>DURATION</th>
              <th>VIEWS</th>
              <th>LIKES</th>
              <th>STATUS</th>
              <th style="text-align:right;">CONTROL</th>
            </tr>
          </thead>
          <tbody>
            ${videos
              .map(
                (v) => `
              <tr>
                <td>
                  <img src="${v.thumbnail}" style="width:64px; height:40px; object-fit:cover; border-radius:2px;" alt="" />
                </td>
                <td>
                  <div style="font-weight:700; color:#fff; font-size:0.9rem;">${v.title}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">
                    Cars: ${v.cars?.join(", ") || "None"}
                  </div>
                </td>
                <td><span class="badge">${v.category}</span></td>
                <td style="font-family:var(--font-mono);">${v.duration}</td>
                <td>${(v.views || 0).toLocaleString()}</td>
                <td>${(v.likes || 0).toLocaleString()}</td>
                <td>
                  ${v.isTrending ? '<span class="badge badge-amber" style="font-size:0.65rem;">TRENDING</span>' : '<span style="font-size:0.75rem; color:#888;">Standard</span>'}
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-secondary btn-sm admin-toggle-trend" data-vid-id="${v.id}" style="padding:4px 8px; font-size:0.7rem;">
                    ${v.isTrending ? "UN-TREND" : "MAKE TREND"}
                  </button>
                  <button class="btn btn-outline btn-sm admin-del-vid" data-vid-id="${v.id}" style="padding:4px 8px; font-size:0.7rem; color:#ff4444; border-color:#ff4444;">
                    DELETE
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- TAB 3: CARS MANAGEMENT ---
  function renderCarsTabHtml(cars) {
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
        <h3 style="font-size:1.3rem;">ENGINEERED CAR VAULT (${cars.length})</h3>
        <button class="btn btn-primary" id="btn-admin-add-car">
          + REGISTER NEW WEAPON 🏎️
        </button>
      </div>

      <div class="comparison-table-wrap">
        <table class="comparison-table">
          <thead>
            <tr>
              <th style="width:80px;">PHOTO</th>
              <th>MODEL & BRAND</th>
              <th>CLASS</th>
              <th>POWER</th>
              <th>TOP SPEED</th>
              <th>0-100</th>
              <th>ENGINE</th>
              <th style="text-align:right;">CONTROL</th>
            </tr>
          </thead>
          <tbody>
            ${cars
              .map(
                (c) => `
              <tr>
                <td>
                  <img src="${c.image}" style="width:64px; height:40px; object-fit:cover; border-radius:2px;" alt="" />
                </td>
                <td>
                  <div style="font-weight:700; color:#fff; font-size:0.95rem;">${c.brand} ${c.model}</div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">${c.generation} // ${c.drive}</div>
                </td>
                <td><span class="badge">${c.category}</span></td>
                <td style="color:var(--accent); font-weight:700;">${c.horsepower} HP</td>
                <td style="color:#FF6A00; font-weight:700;">${c.topSpeed} km/h</td>
                <td style="color:#00E676; font-weight:700;">${c.acceleration}s</td>
                <td style="font-size:0.8rem;">${c.engine}</td>
                <td style="text-align:right;">
                  <button class="btn btn-outline btn-sm admin-del-car" data-car-id="${c.id}" style="padding:4px 8px; font-size:0.7rem; color:#ff4444; border-color:#ff4444;">
                    SCRAP
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- TAB 4: USERS MANAGEMENT ---
  function renderUsersTabHtml(users) {
    return `
      <div style="margin-bottom:20px;">
        <h3 style="font-size:1.3rem;">AUTHENTICATED PILOTS REGISTRY (${users.length})</h3>
      </div>

      <div class="comparison-table-wrap">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>CALLSIGN</th>
              <th>COMMUNICATION EMAIL</th>
              <th>ROLE CLEARANCE</th>
              <th>PILOT RANK</th>
              <th>STATUS</th>
              <th style="text-align:right;">SECURITY ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${users
              .map(
                (u) => `
              <tr>
                <td>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${u.avatar}" style="width:32px; height:32px; border-radius:var(--radius-xs); object-fit:cover;" alt="" />
                    <span style="font-weight:700; color:#fff;">${u.name}</span>
                  </div>
                </td>
                <td style="font-family:var(--font-mono); font-size:0.8rem;">${u.email}</td>
                <td>
                  <select class="admin-change-role-select" data-user-id="${u.id}" style="font-size:0.75rem; padding:4px 8px;">
                    <option value="User" ${u.role === 'User' ? 'selected' : ''}>Pilot (User)</option>
                    <option value="Admin" ${u.role === 'Admin' ? 'selected' : ''}>Commander (Admin)</option>
                  </select>
                </td>
                <td><span class="badge badge-amber">${u.driverBadge || u.role}</span></td>
                <td>
                  ${u.isBlocked ? '<span style="color:#ff4444; font-weight:700;">SUSPENDED</span>' : '<span style="color:#00E676; font-weight:700;">ACTIVE</span>'}
                </td>
                <td style="text-align:right;">
                  <button class="btn btn-secondary btn-sm admin-toggle-block" data-user-id="${u.id}" style="padding:4px 10px; font-size:0.75rem;">
                    ${u.isBlocked ? "UNSUSPEND" : "SUSPEND"}
                  </button>
                </td>
              </tr>
            `
              )
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  // --- TAB 5: COMMENTS MODERATION ---
  function renderCommentsTabHtml(comments) {
    return `
      <div style="margin-bottom:20px;">
        <h3 style="font-size:1.3rem;">COMMUNITY CHATTER MODERATION (${comments.length})</h3>
      </div>

      <div class="comparison-table-wrap">
        <table class="comparison-table">
          <thead>
            <tr>
              <th>AUTHOR</th>
              <th>TARGET VIDEO</th>
              <th>MESSAGE CONTENT</th>
              <th>TIMESTAMP</th>
              <th style="text-align:right;">ACTION</th>
            </tr>
          </thead>
          <tbody>
            ${comments
              .map((c) => {
                const vid = store.getVideoById(c.videoId);
                return `
                <tr>
                  <td>
                    <div style="display:flex; align-items:center; gap:8px;">
                      <img src="${c.userAvatar}" style="width:24px; height:24px; border-radius:50%;" alt="" />
                      <strong style="color:#fff;">${c.userName}</strong>
                    </div>
                  </td>
                  <td style="font-size:0.8rem; color:var(--text-muted);">${vid ? vid.title : c.videoId}</td>
                  <td style="font-size:0.85rem; color:#eee;">${c.content}</td>
                  <td style="font-size:0.75rem; color:var(--text-muted);">${c.timestamp}</td>
                  <td style="text-align:right;">
                    <button class="btn btn-outline btn-sm admin-del-comment" data-comment-id="${c.id}" style="color:#ff4444; border-color:#ff4444; padding:4px 8px; font-size:0.7rem;">
                      REMOVE
                    </button>
                  </td>
                </tr>
              `;
              })
              .join("")}
          </tbody>
        </table>
      </div>
    `;
  }

  function attachAdminEvents(container) {
    // Tabs Navigation
    container.querySelectorAll("[data-admin-tab]").forEach((btn) => {
      btn.addEventListener("click", () => {
        soundEngine.playClick();
        activeTab = btn.getAttribute("data-admin-tab");
        updateAdminView();
      });
    });

    // View site
    const siteBtn = container.querySelector("#btn-admin-view-site");
    if (siteBtn) {
      siteBtn.addEventListener("click", () => {
        soundEngine.playClick();
        window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "home" } }));
      });
    }

    // Toggle Trending Video
    container.querySelectorAll(".admin-toggle-trend").forEach((btn) => {
      btn.addEventListener("click", () => {
        soundEngine.playClick();
        const vidId = btn.getAttribute("data-vid-id");
        const vid = store.getVideoById(vidId);
        if (vid) {
          store.updateVideo(vidId, { isTrending: !vid.isTrending });
          updateAdminView();
        }
      });
    });

    // Delete Video
    container.querySelectorAll(".admin-del-vid").forEach((btn) => {
      btn.addEventListener("click", () => {
        const vidId = btn.getAttribute("data-vid-id");
        if (confirm("Delete this high-octane clip permanently from the database?")) {
          soundEngine.playClick();
          store.deleteVideo(vidId);
          window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Video purged from system." } }));
          updateAdminView();
        }
      });
    });

    // Delete Car
    container.querySelectorAll(".admin-del-car").forEach((btn) => {
      btn.addEventListener("click", () => {
        const carId = btn.getAttribute("data-car-id");
        if (confirm("Scrap this vehicle from the official vault?")) {
          soundEngine.playClick();
          store.deleteCar(carId);
          window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Car removed from vault." } }));
          updateAdminView();
        }
      });
    });

    // Toggle User Block
    container.querySelectorAll(".admin-toggle-block").forEach((btn) => {
      btn.addEventListener("click", () => {
        soundEngine.playClick();
        const userId = btn.getAttribute("data-user-id");
        store.toggleBlockUser(userId);
        updateAdminView();
      });
    });

    // User Role Change
    container.querySelectorAll(".admin-change-role-select").forEach((sel) => {
      sel.addEventListener("change", (e) => {
        soundEngine.playClick();
        const userId = sel.getAttribute("data-user-id");
        store.updateUserRole(userId, e.target.value);
        window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: `Role updated to ${e.target.value}` } }));
      });
    });

    // Delete Comment
    container.querySelectorAll(".admin-del-comment").forEach((btn) => {
      btn.addEventListener("click", () => {
        soundEngine.playClick();
        const commentId = btn.getAttribute("data-comment-id");
        store.deleteComment(commentId);
        updateAdminView();
      });
    });

    // Add Video Modal Trigger
    const addVidBtn = container.querySelector("#btn-admin-add-video");
    if (addVidBtn) {
      addVidBtn.addEventListener("click", () => {
        soundEngine.playClick();
        openAddVideoModal(container);
      });
    }

    // Add Car Modal Trigger
    const addCarBtn = container.querySelector("#btn-admin-add-car");
    if (addCarBtn) {
      addCarBtn.addEventListener("click", () => {
        soundEngine.playClick();
        openAddCarModal(container);
      });
    }
  }

  // Add Video Modal
  function openAddVideoModal(container) {
    const modalWrap = container.querySelector("#admin-submodal-placeholder");
    modalWrap.innerHTML = `
      <div class="modal-overlay" id="add-video-modal-backdrop">
        <div class="modal-dialog" style="max-width:600px; padding:2rem;">
          <button class="modal-close-btn" id="add-vid-close">✕</button>
          <div class="section-tag" style="margin-bottom:8px;">BROADCAST PIPELINE</div>
          <h2 style="font-size:1.6rem; margin-bottom:20px;">PUBLISH NEW AUTOMOTIVE VIDEO</h2>

          <form id="form-add-video" style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">TITLE</label>
              <input type="text" id="new-vid-title" placeholder="e.g. Supra vs GT-R Midnight Run" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">CATEGORY</label>
              <select id="new-vid-category" style="width:100%;">
                ${categoriesList.filter((c) => c.id !== "all").map((c) => `<option value="${c.id}">${c.name}</option>`).join("")}
              </select>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">ASSOCIATED CARS (Comma separated for Smart Battles)</label>
              <input type="text" id="new-vid-cars" placeholder="e.g. BMW M4 Competition, Nissan GT-R Nismo" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">DURATION</label>
              <input type="text" id="new-vid-duration" placeholder="e.g. 05:42" value="06:30" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">THUMBNAIL URL</label>
              <input type="url" id="new-vid-thumb" placeholder="https://images.unsplash.com/..." value="https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=1200&q=80" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">DESCRIPTION</label>
              <textarea id="new-vid-desc" rows="3" placeholder="Telemetry synopsis..." required style="width:100%;"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="margin-top:10px;">
              BROADCAST TO PLATFORM 🎬
            </button>
          </form>
        </div>
      </div>
    `;

    modalWrap.querySelector("#add-vid-close").addEventListener("click", () => (modalWrap.innerHTML = ""));
    modalWrap.querySelector("#form-add-video").addEventListener("submit", (e) => {
      e.preventDefault();
      const title = modalWrap.querySelector("#new-vid-title").value;
      const category = modalWrap.querySelector("#new-vid-category").value;
      const carsInput = modalWrap.querySelector("#new-vid-cars").value;
      const duration = modalWrap.querySelector("#new-vid-duration").value;
      const thumbnail = modalWrap.querySelector("#new-vid-thumb").value;
      const description = modalWrap.querySelector("#new-vid-desc").value;

      const carsArray = carsInput.split(",").map((s) => s.trim()).filter(Boolean);

      store.addVideo({
        title,
        category,
        cars: carsArray,
        duration,
        durationSec: 360,
        thumbnail,
        description,
        author: store.currentUser.name,
        isTrending: true,
        tags: [category, ...carsArray]
      });

      soundEngine.playRev("turbo-v6");
      window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Video successfully published live!" } }));
      modalWrap.innerHTML = "";
      updateAdminView();
    });
  }

  // Add Car Modal
  function openAddCarModal(container) {
    const modalWrap = container.querySelector("#admin-submodal-placeholder");
    modalWrap.innerHTML = `
      <div class="modal-overlay" id="add-car-modal-backdrop">
        <div class="modal-dialog" style="max-width:700px; padding:2rem;">
          <button class="modal-close-btn" id="add-car-close">✕</button>
          <div class="section-tag" style="margin-bottom:8px;">VAULT EXPANSION</div>
          <h2 style="font-size:1.6rem; margin-bottom:20px;">REGISTER NEW HIGH-OCTANE MACHINE</h2>

          <form id="form-add-car" style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">BRAND</label>
              <input type="text" id="new-car-brand" placeholder="e.g. Porsche" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">MODEL</label>
              <input type="text" id="new-car-model" placeholder="e.g. 718 Cayman GT4 RS" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">CATEGORY</label>
              <select id="new-car-category" style="width:100%;">
                ${carCategories.filter((c) => c !== "All").map((c) => `<option value="${c}">${c}</option>`).join("")}
              </select>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">HORSEPOWER (BHP)</label>
              <input type="number" id="new-car-hp" placeholder="493" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">0 - 100 KM/H (SEC)</label>
              <input type="number" step="0.1" id="new-car-accel" placeholder="3.4" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">TOP SPEED (KM/H)</label>
              <input type="number" id="new-car-speed" placeholder="315" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">ENGINE ARCHITECTURE</label>
              <input type="text" id="new-car-engine" placeholder="4.0L Naturally Aspirated Flat-6" required style="width:100%;" />
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">DRIVETRAIN (RWD / AWD)</label>
              <input type="text" id="new-car-drive" placeholder="RWD" required style="width:100%;" />
            </div>
            <div style="grid-column:span 2;">
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">IMAGE URL</label>
              <input type="url" id="new-car-image" value="https://images.unsplash.com/photo-1614162692292-7ac56d7f7f1e?auto=format&fit=crop&w=1200&q=80" required style="width:100%;" />
            </div>
            <div style="grid-column:span 2;">
              <label style="display:block; font-size:0.75rem; color:var(--text-muted); margin-bottom:4px;">SYNOPSIS</label>
              <textarea id="new-car-desc" rows="2" placeholder="Chassis characteristics..." required style="width:100%;"></textarea>
            </div>
            <button type="submit" class="btn btn-primary" style="grid-column:span 2; margin-top:8px;">
              ENGAGE VAULT ENTRY 🏎️
            </button>
          </form>
        </div>
      </div>
    `;

    modalWrap.querySelector("#add-car-close").addEventListener("click", () => (modalWrap.innerHTML = ""));
    modalWrap.querySelector("#form-add-car").addEventListener("submit", (e) => {
      e.preventDefault();
      const brand = modalWrap.querySelector("#new-car-brand").value;
      const model = modalWrap.querySelector("#new-car-model").value;
      const category = modalWrap.querySelector("#new-car-category").value;
      const horsepower = parseInt(modalWrap.querySelector("#new-car-hp").value);
      const acceleration = parseFloat(modalWrap.querySelector("#new-car-accel").value);
      const topSpeed = parseInt(modalWrap.querySelector("#new-car-speed").value);
      const engineDetails = modalWrap.querySelector("#new-car-engine").value;
      const drive = modalWrap.querySelector("#new-car-drive").value;
      const image = modalWrap.querySelector("#new-car-image").value;
      const description = modalWrap.querySelector("#new-car-desc").value;

      store.addCar({
        brand,
        model,
        category,
        horsepower,
        acceleration,
        topSpeed,
        torque: Math.floor(horsepower * 1.1),
        weight: 1450,
        engine: "V8",
        engineDetails,
        drive,
        transmission: "DCT",
        transmissionDetails: "7-Speed Dual-Clutch",
        price: "$140,000",
        soundType: "v8-twin-turbo",
        image,
        description,
        tags: [brand, model, category]
      });

      soundEngine.playRev("v8-twin-turbo");
      window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Vehicle added to DRIFTVERSE vault!" } }));
      modalWrap.innerHTML = "";
      updateAdminView();
    });
  }

  updateAdminView();
}
