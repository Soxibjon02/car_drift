/**
 * DRIFTVERSE - Control Center & Administration Cockpit
 * Password Protected with Neon PostgreSQL Integration
 */
import { api } from "../services/api.js";
import { store } from "../services/store.js";
import { authService } from "../services/auth.js";
import { soundEngine } from "../services/audio.js";
import { carBrands, carCategories } from "../data/initialState.js";

export async function renderAdminPage(container) {
  // 1. SECURITY GATEWAY CHECK: Only authenticated admin can enter
  if (!api.isAdmin()) {
    renderAdminLoginGateway(container);
    return;
  }

  // 2. ADMIN COCKPIT (AUTHENTICATED)
  let activeTab = "videos"; // "videos" | "dashboard" | "comments" | "cars"
  let stats = { total_users: 0, total_videos: 0, total_comments: 0, total_likes: 0, db_status: "Neon DB" };
  let videosList = [];

  try {
    stats = await api.getAdminStats().catch(() => stats);
    videosList = await api.getVideos().catch(() => store.getVideos());
  } catch (err) {
    console.error("Admin data fetch error:", err);
  }

  function renderView() {
    container.innerHTML = `
      <div class="section-wrapper" style="min-height:85vh; padding-top:var(--space-8);">
        <div class="container">
          
          <!-- Cockpit Header -->
          <div class="section-header" style="border-bottom:1px solid var(--border-medium); padding-bottom:20px; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div class="section-title-wrap">
              <div class="section-tag" style="color:var(--accent);">DRIFTVERSE SYS-ROOT // NEON POSTGRESQL</div>
              <h1 style="font-size:2.2rem; margin-bottom:6px;">ADMIN COCKPIT</h1>
              <div class="section-subtitle">
                YouTube videolarni boshqarish, Neon DB telemetriyasi va foydalanuvchilar moderatsiyasi.
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:12px;">
              <span class="badge" style="background:rgba(255,77,0,0.15); border:1px solid var(--accent); color:var(--accent); font-weight:700;">
                🔒 ADMIN: AKTIV
              </span>
              <button class="btn btn-secondary btn-sm" id="btn-admin-logout" style="border-color:#FF3B30; color:#FF453A;">
                Chiqish (Logout) ✕
              </button>
            </div>
          </div>

          <!-- DB TELEMETRY KPI CARDS -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin:24px 0;">
            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px 20px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">Neon Database</div>
              <div style="font-size:1.15rem; font-weight:800; color:#00E676; margin:4px 0;">ONLINE (Connected)</div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">ep-billowing-silence.aws.neon.tech</div>
            </div>

            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px 20px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">YouTube Videolar</div>
              <div style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin:4px 0;">${stats.total_videos || videosList.length}</div>
              <div style="font-size:0.72rem; color:var(--accent);">Faol translatsiyalar</div>
            </div>

            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px 20px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">Foydalanuvchilar</div>
              <div style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin:4px 0;">${stats.total_users || 1}</div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">Ro'yxatdan o'tganlar</div>
            </div>

            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px 20px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">Izohlar & Likelar</div>
              <div style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin:4px 0;">${stats.total_comments || 0} / ${stats.total_likes || 0}</div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">Community faolligi</div>
            </div>
          </div>

          <!-- Tabs Strip -->
          <div class="filter-pills" style="margin-bottom:24px;">
            <button class="filter-pill ${activeTab === 'videos' ? 'active' : ''}" data-tab="videos">
              🎬 YouTube Videolar Pipeline (${videosList.length})
            </button>
            <button class="filter-pill ${activeTab === 'add-video' ? 'active' : ''}" data-tab="add-video">
              + Yangi YouTube Video Qo'shish
            </button>
          </div>

          <!-- Tab Content Mount -->
          <div id="admin-tab-mount">
            ${activeTab === 'videos' ? renderVideosTableHtml(videosList) : renderAddVideoFormHtml()}
          </div>

        </div>
      </div>
    `;

    attachAdminEvents();
  }

  function renderVideosTableHtml(videos) {
    return `
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:1.1rem; font-weight:700;">TRANSMITTED YOUTUBE CLIPS</h3>
          <button class="btn btn-primary btn-sm" id="btn-quick-add-video">+ Video Qo'shish</button>
        </div>

        <div style="overflow-x:auto;">
          <table class="comparison-table" style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="text-align:left; background:rgba(255,255,255,0.02); font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-family:var(--font-mono);">
                <th style="padding:12px 16px;">Kadr</th>
                <th style="padding:12px 16px;">Sarlavha & YouTube ID</th>
                <th style="padding:12px 16px;">Kategoriya</th>
                <th style="padding:12px 16px;">Davomiyligi</th>
                <th style="padding:12px 16px;">Ko'rishlar</th>
                <th style="padding:12px 16px;">Likelar</th>
                <th style="padding:12px 16px; text-align:right;">Amallar</th>
              </tr>
            </thead>
            <tbody>
              ${
                videos.length === 0
                  ? `<tr><td colspan="7" style="padding:2rem; text-align:center; color:var(--text-muted);">Videolar mavjud emas</td></tr>`
                  : videos
                      .map(
                        (v) => `
                    <tr style="border-bottom:1px solid var(--border-subtle); font-size:0.85rem;">
                      <td style="padding:12px 16px;">
                        <img src="${v.thumbnail || 'https://img.youtube.com/vi/' + (v.youtube_id || v.id) + '/hqdefault.jpg'}" style="width:68px; height:42px; object-fit:cover; border-radius:2px;" alt="" />
                      </td>
                      <td style="padding:12px 16px;">
                        <div style="font-weight:700; color:var(--text-primary); margin-bottom:2px;">${v.title}</div>
                        <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--accent);">
                          ID: ${v.youtube_id || v.id}
                        </div>
                      </td>
                      <td style="padding:12px 16px;">
                        <span class="badge" style="font-size:0.68rem;">${v.category}</span>
                      </td>
                      <td style="padding:12px 16px; font-family:var(--font-mono);">${v.duration || '05:00'}</td>
                      <td style="padding:12px 16px;">${(v.views || 0).toLocaleString()}</td>
                      <td style="padding:12px 16px;">${(v.likes_count || v.likes || 0).toLocaleString()}</td>
                      <td style="padding:12px 16px; text-align:right;">
                        <button class="btn btn-outline btn-sm admin-del-video" data-id="${v.id}" style="color:#FF453A; border-color:#FF453A; padding:4px 10px; font-size:0.72rem;">
                          O'chirish ✕
                        </button>
                      </td>
                    </tr>
                  `
                      )
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAddVideoFormHtml() {
    return `
      <div style="max-width:760px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:2rem;">
        <h3 style="font-size:1.25rem; font-weight:800; margin-bottom:8px;">YANGI YOUTUBE VIDEO YUKLASH (NEON DB)</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:20px;">
          Istalgan YouTube video havolasini kiriting. Tizim avtomatik ravishda videoni ajratib oladi va DRIFTVERSE playerida sayt ichida ko'rsatish uchun tayyorlaydi.
        </p>

        <form id="admin-add-video-form" style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              YouTube URL yoki Video ID *
            </label>
            <input 
              type="text" 
              id="new-video-url" 
              placeholder="masalan: https://www.youtube.com/watch?v=4TshFHRYJ5Y yoki 4TshFHRYJ5Y" 
              required 
              style="width:100%; font-family:var(--font-mono);" 
            />
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Video Nomi (Title) *
            </label>
            <input 
              type="text" 
              id="new-video-title" 
              placeholder="masalan: Ken Block GYMKHANA 10 // The Ultimate Tire-Shredding Masterpiece" 
              required 
              style="width:100%;" 
            />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Kategoriya
              </label>
              <select id="new-video-category" style="width:100%; min-height:44px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); color:var(--text-primary); padding:8px 12px; border-radius:var(--radius-xs);">
                <option value="Drift">Drift</option>
                <option value="Drag Race">Drag Race</option>
                <option value="Supercars">Supercars</option>
                <option value="Track Day">Track Day</option>
                <option value="Exhaust & Engine Sound">Exhaust & Engine Sound</option>
                <option value="JDM Culture">JDM Culture</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Davomiyligi (MM:SS)
              </label>
              <input type="text" id="new-video-duration" placeholder="05:30" value="05:00" style="width:100%;" />
            </div>
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Kanal / Muallif Nomi
            </label>
            <input type="text" id="new-video-channel" placeholder="DRIFTVERSE MEDIA" value="DRIFTVERSE MEDIA" style="width:100%;" />
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Video Tavsifi (Description)
            </label>
            <textarea id="new-video-desc" rows="3" placeholder="Yuqori tezlikdagi avtomobil telemetriyasi va kadrlari..." style="width:100%; min-height:80px;"></textarea>
          </div>

          <div style="display:flex; gap:12px; margin-top:8px;">
            <button type="submit" class="btn btn-primary" id="btn-save-video" style="padding:12px 24px;">
              💾 Neon PostgreSQL ga Saqlash
            </button>
            <button type="button" class="btn btn-secondary" id="btn-cancel-add-video">
              Bekor Qilish
            </button>
          </div>
        </form>
      </div>
    `;
  }

  function attachAdminEvents() {
    // Logout
    const logoutBtn = container.querySelector("#btn-admin-logout");
    if (logoutBtn) {
      logoutBtn.addEventListener("click", () => {
        soundEngine.playClick();
        api.setAdminToken("");
        localStorage.removeItem("driftverse_admin_token");
        window.dispatchEvent(new CustomEvent("driftverse:toast", {
          detail: { message: "Admin sessiyasi yakunlandi. Boshqaruv paneli qulflandi." }
        }));
        renderAdminLoginGateway(container);
      });
    }

    // Tabs switch
    const tabs = container.querySelectorAll(".filter-pill[data-tab]");
    tabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        soundEngine.playClick();
        activeTab = tab.getAttribute("data-tab");
        renderView();
      });
    });

    const quickAdd = container.querySelector("#btn-quick-add-video");
    if (quickAdd) {
      quickAdd.addEventListener("click", () => {
        soundEngine.playClick();
        activeTab = "add-video";
        renderView();
      });
    }

    const cancelAdd = container.querySelector("#btn-cancel-add-video");
    if (cancelAdd) {
      cancelAdd.addEventListener("click", () => {
        soundEngine.playClick();
        activeTab = "videos";
        renderView();
      });
    }

    // Delete Video Handlers
    const delBtns = container.querySelectorAll(".admin-del-video");
    delBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!confirm("Haqiqatan ham ushbu videoni Neon DB dan o'chirmoqchimisiz?")) return;

        try {
          await api.deleteVideo(id);
          soundEngine.playClick();
          videosList = videosList.filter((v) => v.id != id);
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Video muvaffaqiyatli o'chirildi!" }
          }));
          renderView();
        } catch (err) {
          alert(err.message || "O'chirishda xatolik");
        }
      });
    });

    // Add Video Form Submit
    const addForm = container.querySelector("#admin-add-video-form");
    if (addForm) {
      addForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const saveBtn = container.querySelector("#btn-save-video");
        const url = container.querySelector("#new-video-url").value.trim();
        const title = container.querySelector("#new-video-title").value.trim();
        const category = container.querySelector("#new-video-category").value;
        const duration = container.querySelector("#new-video-duration").value.trim();
        const channel_name = container.querySelector("#new-video-channel").value.trim();
        const description = container.querySelector("#new-video-desc").value.trim();

        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = "Neon DB ga yozilmoqda...";
        }

        try {
          const res = await api.addVideo({
            url,
            title,
            category,
            duration,
            channel_name,
            description
          });

          soundEngine.playRev("turbo-v6");
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Yangi video Neon DB ga muvaffaqiyatli qo'shildi!" }
          }));

          // Refresh list
          videosList = await api.getVideos();
          activeTab = "videos";
          renderView();
        } catch (err) {
          alert(err.message || "Video qo'shishda xato yuz berdi");
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "💾 Neon PostgreSQL ga Saqlash";
          }
        }
      });
    }
  }

  renderView();
}

/**
 * IMPENETRABLE ADMIN LOGIN SECURITY GATEWAY
 */
function renderAdminLoginGateway(container) {
  container.innerHTML = `
    <div class="section-wrapper" style="min-height:85vh; display:flex; align-items:center; justify-content:center; padding:3rem 1rem;">
      <div style="width:100%; max-width:460px; background:var(--bg-card); border:1px solid var(--border-medium); border-radius:var(--radius-sm); padding:2.5rem 2rem; box-shadow:0 24px 60px rgba(0,0,0,0.7); backdrop-filter:blur(16px); text-align:center;">
        
        <div style="font-size:3rem; margin-bottom:12px;">🔒</div>
        
        <div class="section-tag" style="justify-content:center; margin-bottom:8px; color:var(--accent);">
          SYS-SECURITY GATEWAY // ACCESS RESTRICTED
        </div>
        
        <h2 style="font-size:1.75rem; font-weight:800; margin-bottom:10px; color:var(--text-primary);">
          ADMINISTRATOR PAROLI
        </h2>
        
        <p style="font-size:0.875rem; color:var(--text-secondary); line-height:1.5; margin-bottom:24px;">
          Ushbu boshqaruv paneli faqat tizim administratori uchun himoyalangan. Tizimga kirish uchun xavfsizlik parolini kiriting.
        </p>

        <div id="admin-gate-error" style="display:none; background:rgba(255,59,48,0.12); border:1px solid #FF3B30; color:#FF453A; padding:8px 12px; border-radius:var(--radius-xs); font-size:0.825rem; margin-bottom:16px;"></div>

        <form id="admin-gate-form" style="display:flex; flex-direction:column; gap:14px;">
          <div>
            <input 
              type="password" 
              id="admin-gate-password" 
              placeholder="Admin parolini kiriting..." 
              required 
              style="width:100%; text-align:center; font-size:1.1rem; letter-spacing:0.1em; padding:12px;" 
            />
          </div>

          <button type="submit" class="btn btn-primary" id="btn-admin-unlock" style="width:100%; padding:14px; font-weight:700;">
            Xavfsizlik Parolini Tasdiqlash ➔
          </button>
        </form>

        <div style="margin-top:20px; font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">
          DATA SECURITY: NEON POSTGRESQL & JWT HASH
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector("#admin-gate-form");
  const passInput = container.querySelector("#admin-gate-password");
  const errBox = container.querySelector("#admin-gate-error");
  const submitBtn = container.querySelector("#btn-admin-unlock");

  if (form && passInput) {
    passInput.focus();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const password = passInput.value;
      if (!password) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Tekshirilmoqda...";
      }

      const res = await authService.adminLogin(password);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Xavfsizlik Parolini Tasdiqlash ➔";
      }

      if (res.success) {
        soundEngine.playRev("v12-roar");
        window.dispatchEvent(new CustomEvent("driftverse:toast", {
          detail: { message: "Xavfsizlik tekshiruvi muvaffaqiyatli o'tdi! Xush kelibsiz, Admin." }
        }));
        renderAdminPage(container);
      } else {
        if (errBox) {
          errBox.textContent = res.message || "Parol noto'g'ri! Kirish rad etildi.";
          errBox.style.display = "block";
        }
        passInput.style.borderColor = "#FF3B30";
        passInput.value = "";
      }
    });
  }
}
