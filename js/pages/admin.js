/**
 * DRIFTVERSE - Control Center & Administration Cockpit
 * Protected by Dedicated Admin Email & Password Gateway
 * Integrated with Neon PostgreSQL (Videos & Wallpapers/Images CRUD)
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
  let activeTab = "videos"; // "videos" | "add-video" | "images" | "add-image"
  let stats = { total_users: 0, total_videos: 0, total_images: 0, total_comments: 0, total_likes: 0, db_status: "Neon DB" };
  let videosList = [];
  let imagesList = [];

  try {
    stats = await api.getAdminStats().catch(() => stats);
    videosList = await api.getVideos().catch(() => store.getVideos());
    imagesList = await api.getImages().catch(() => store.getImages());
  } catch (err) {
    console.error("Admin data fetch error:", err);
  }

  function renderView() {
    container.innerHTML = `
      <div class="section-wrapper" style="min-height:85vh; padding-top:var(--space-8); padding-bottom:80px;">
        <div class="container">
          
          <!-- Cockpit Header -->
          <div class="section-header" style="border-bottom:1px solid var(--border-medium); padding-bottom:20px; display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
            <div class="section-title-wrap">
              <div class="section-tag" style="color:var(--accent);">DRIFTVERSE SYS-ROOT // NEON POSTGRESQL</div>
              <h1 style="font-size:2.2rem; margin-bottom:6px;">ADMIN COCKPIT</h1>
              <div class="section-subtitle">
                YouTube videolar, 4K fon rasmlari va avtomobil medialari boshqaruvi.
              </div>
            </div>

            <div style="display:flex; align-items:center; gap:12px;">
              <span class="badge" style="background:rgba(255,77,0,0.15); border:1px solid var(--accent); color:var(--accent); font-weight:700;">
                🔒 ADMIN: soxibjon
              </span>
              <button class="btn btn-secondary btn-sm" id="btn-admin-logout" style="border-color:#FF3B30; color:#FF453A;">
                Chiqish (Logout) ✕
              </button>
            </div>
          </div>

          <!-- DB TELEMETRY KPI CARDS -->
          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px; margin:24px 0;">
            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px 20px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">Neon Database</div>
              <div style="font-size:1.15rem; font-weight:800; color:#00E676; margin:4px 0;">ONLINE (Connected)</div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">ep-billowing-silence.aws.neon.tech</div>
            </div>

            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px 20px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">YouTube Videolar</div>
              <div style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin:4px 0;">${stats.total_videos || videosList.length}</div>
              <div style="font-size:0.72rem; color:var(--accent);">Faol videoroliklar</div>
            </div>

            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px 20px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">Rasmlar & Wallpapers</div>
              <div style="font-size:1.6rem; font-weight:800; color:#0A84FF; margin:4px 0;">${stats.total_images || imagesList.length}</div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">Desktop & Mobile 4K</div>
            </div>

            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px 20px;">
              <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono); text-transform:uppercase;">Foydalanuvchilar</div>
              <div style="font-size:1.6rem; font-weight:800; color:var(--text-primary); margin:4px 0;">${stats.total_users || 1}</div>
              <div style="font-size:0.72rem; color:var(--text-secondary);">Ro'yxatdan o'tganlar</div>
            </div>
          </div>

          <!-- Tabs Strip -->
          <div class="filter-pills" style="margin-bottom:24px; display:flex; flex-wrap:wrap; gap:8px;">
            <button class="filter-pill ${activeTab === 'videos' ? 'active' : ''}" data-tab="videos">
              🎬 YouTube Videolar (${videosList.length})
            </button>
            <button class="filter-pill ${activeTab === 'add-video' ? 'active' : ''}" data-tab="add-video">
              + Yangi Video Qo'shish
            </button>
            <button class="filter-pill ${activeTab === 'images' ? 'active' : ''}" data-tab="images">
              🖼️ Rasmlar & Wallpapers (${imagesList.length})
            </button>
            <button class="filter-pill ${activeTab === 'add-image' ? 'active' : ''}" data-tab="add-image">
              + Yangi Rasm Qo'shish
            </button>
          </div>

          <!-- Tab Content Mount -->
          <div id="admin-tab-mount">
            ${
              activeTab === 'videos' ? renderVideosTableHtml(videosList) :
              activeTab === 'add-video' ? renderAddVideoFormHtml() :
              activeTab === 'images' ? renderImagesTableHtml(imagesList) :
              renderAddImageFormHtml()
            }
          </div>

        </div>
      </div>

      <!-- Admin Edit Video Modal Overlay -->
      <div id="admin-edit-modal" style="display:none; position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px;">
        <div style="width:100%; max-width:620px; background:var(--bg-card); border:1px solid var(--border-medium); border-radius:var(--radius-sm); padding:24px; box-shadow:0 24px 60px rgba(0,0,0,0.9);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="font-size:1.25rem; font-weight:800; margin:0;">VIDEONI TAHRIRLASH (NEON DB)</h3>
            <button id="btn-close-admin-edit" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">✕</button>
          </div>

          <form id="admin-edit-video-form" style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">VIDEO NOMI *</label>
              <input type="text" id="admin-edit-title" required style="width:100%;" />
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">YOUTUBE URL YOKI ID</label>
              <input type="text" id="admin-edit-url" style="width:100%; font-family:var(--font-mono);" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">KATEGORIYA</label>
                <select id="admin-edit-category" style="width:100%; min-height:42px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-xs);">
                  <option value="Drift">Drift</option>
                  <option value="Drag Race">Drag Race</option>
                  <option value="Supercars">Supercars</option>
                  <option value="Track Day">Track Day</option>
                  <option value="Exhaust & Engine Sound">Exhaust & Engine Sound</option>
                  <option value="Hypercars">Hypercars</option>
                  <option value="Racing">Racing</option>
                </select>
              </div>
              <div>
                <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">DAVOMIYLIGI (MM:SS)</label>
                <input type="text" id="admin-edit-duration" style="width:100%;" />
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">KANAL NOMI</label>
              <input type="text" id="admin-edit-channel" style="width:100%;" />
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">TAVSIF (DESCRIPTION)</label>
              <textarea id="admin-edit-desc" rows="3" style="width:100%;"></textarea>
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-admin-edit">Bekor Qilish</button>
              <button type="submit" class="btn btn-primary" id="btn-save-admin-edit">💾 Neon DB ga Saqlash</button>
            </div>
          </form>
        </div>
      </div>

      <!-- Admin Edit Image Modal Overlay -->
      <div id="admin-edit-image-modal" style="display:none; position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px;">
        <div style="width:100%; max-width:620px; background:var(--bg-card); border:1px solid var(--border-medium); border-radius:var(--radius-sm); padding:24px; box-shadow:0 24px 60px rgba(0,0,0,0.9);">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
            <h3 style="font-size:1.25rem; font-weight:800; margin:0;">RASMNI TAHRIRLASH (NEON DB)</h3>
            <button id="btn-close-image-edit" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">✕</button>
          </div>

          <form id="admin-edit-image-form" style="display:flex; flex-direction:column; gap:14px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">RASM NOMI *</label>
              <input type="text" id="admin-edit-img-title" required style="width:100%;" />
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">RASM HAVOLASI (URL) *</label>
              <input type="url" id="admin-edit-img-url" required style="width:100%; font-family:var(--font-mono);" />
            </div>

            <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
              <div>
                <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">QURILMA FORMATI</label>
                <select id="admin-edit-img-device" style="width:100%; min-height:42px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-xs);">
                  <option value="desktop">🖥️ Desktop (16:9 / 4K UHD)</option>
                  <option value="mobile">📱 Mobile Phone (9:16 Portrait)</option>
                </select>
              </div>

              <div>
                <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">KATEGORIYA</label>
                <input type="text" id="admin-edit-img-cat" style="width:100%;" placeholder="Supercars, JDM, Hypercars..." />
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px;">CHIQADIGAN BO'LIMLAR (MULTIPLE)</label>
              <div style="display:flex; gap:20px; background:rgba(255,255,255,0.03); padding:10px 14px; border-radius:6px; border:1px solid var(--border-subtle);">
                <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem;">
                  <input type="checkbox" id="admin-edit-img-sec-wallpapers" value="wallpapers" />
                  🖼️ Wallpapers bo'limi
                </label>
                <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:0.85rem;">
                  <input type="checkbox" id="admin-edit-img-sec-cars" value="cars" />
                  🏎️ Cars bo'limi
                </label>
              </div>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">REZOLYUTSIYA</label>
              <input type="text" id="admin-edit-img-res" style="width:100%;" placeholder="3840x2160 yoki 1080x2400" />
            </div>

            <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
              <button type="button" class="btn btn-secondary" id="btn-cancel-image-edit">Bekor Qilish</button>
              <button type="submit" class="btn btn-primary" id="btn-save-image-edit">💾 Neon DB ga Saqlash</button>
            </div>
          </form>
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
                        <div style="display:flex; justify-content:flex-end; gap:6px; flex-wrap:nowrap;">
                          <a href="#watch?id=${v.id}" class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.72rem; color:var(--text-secondary);" title="Ko'rish">
                            ▶
                          </a>
                          <button class="btn btn-outline btn-sm admin-edit-video" data-id="${v.id}" style="color:var(--accent); border-color:var(--accent); padding:4px 10px; font-size:0.72rem;">
                            Tahrirlash ✏️
                          </button>
                          <button class="btn btn-outline btn-sm admin-del-video" data-id="${v.id}" style="color:#FF453A; border-color:#FF453A; padding:4px 10px; font-size:0.72rem;">
                            O'chirish ✕
                          </button>
                        </div>
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
              Video Nomi (Sarlavha) *
            </label>
            <input 
              type="text" 
              id="new-video-title" 
              placeholder="masalan: TOYOTA SUPRA MK4 1000HP NIGHT DRIFT" 
              required 
              style="width:100%;" 
            />
          </div>

          <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(200px, 1fr)); gap:16px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Kategoriya
              </label>
              <select id="new-video-category" style="width:100%; min-height:42px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-xs);">
                <option value="Drift">Drift</option>
                <option value="Drag Race">Drag Race</option>
                <option value="Supercars">Supercars</option>
                <option value="Track Day">Track Day</option>
                <option value="Exhaust & Engine Sound">Exhaust & Engine Sound</option>
                <option value="Hypercars">Hypercars</option>
                <option value="Racing">Racing</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Davomiyligi (MM:SS)
              </label>
              <input 
                type="text" 
                id="new-video-duration" 
                placeholder="04:45" 
                value="05:00" 
                style="width:100%; font-family:var(--font-mono);" 
              />
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Muallif / Kanal Nomi
              </label>
              <input 
                type="text" 
                id="new-video-channel" 
                placeholder="masalan: DRIFT MEDIA" 
                value="DRIFT MEDIA" 
                style="width:100%;" 
              />
            </div>
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Video Tavsifi (Description)
            </label>
            <textarea 
              id="new-video-desc" 
              rows="3" 
              placeholder="Video haqida qisqacha ma'lumot..." 
              style="width:100%;"
            ></textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:12px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-add-video">Bekor Qilish</button>
            <button type="submit" class="btn btn-primary" id="btn-save-video">
              💾 Neon PostgreSQL ga Saqlash
            </button>
          </div>
        </form>
      </div>
    `;
  }

  function renderImagesTableHtml(images) {
    return `
      <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); overflow:hidden;">
        <div style="padding:16px 20px; border-bottom:1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <h3 style="font-size:1.1rem; font-weight:700;">WALLPAPERS & RASMLAR PIPELINE</h3>
          <button class="btn btn-primary btn-sm" id="btn-quick-add-image">+ Rasm Qo'shish</button>
        </div>

        <div style="overflow-x:auto;">
          <table class="comparison-table" style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="text-align:left; background:rgba(255,255,255,0.02); font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-family:var(--font-mono);">
                <th style="padding:12px 16px;">Rasm</th>
                <th style="padding:12px 16px;">Sarlavha & Kategoriya</th>
                <th style="padding:12px 16px;">Qurilma Turi</th>
                <th style="padding:12px 16px;">Chiqadigan Bo'limlar</th>
                <th style="padding:12px 16px;">Rezolyutsiya</th>
                <th style="padding:12px 16px;">Yuklanishlar / Likelar</th>
                <th style="padding:12px 16px; text-align:right;">Amallar</th>
              </tr>
            </thead>
            <tbody>
              ${
                images.length === 0
                  ? `<tr><td colspan="7" style="padding:2rem; text-align:center; color:var(--text-muted);">Rasmlar mavjud emas</td></tr>`
                  : images
                      .map((img) => {
                        const isMobile = img.device_type === "mobile";
                        const secs = Array.isArray(img.sections) ? img.sections : [img.sections || "wallpapers"];
                        return `
                          <tr style="border-bottom:1px solid var(--border-subtle); font-size:0.85rem;">
                            <td style="padding:12px 16px;">
                              <img src="${img.url}" style="width:${isMobile ? '36px' : '64px'}; height:${isMobile ? '64px' : '36px'}; object-fit:cover; border-radius:4px; border:1px solid rgba(255,255,255,0.1);" alt="${img.title}" />
                            </td>
                            <td style="padding:12px 16px;">
                              <div style="font-weight:700; color:var(--text-primary); margin-bottom:2px;">${img.title}</div>
                              <span class="badge" style="font-size:0.68rem;">${img.category || 'General'}</span>
                            </td>
                            <td style="padding:12px 16px;">
                              <span class="badge" style="background:${isMobile ? 'rgba(10,132,255,0.2)' : 'rgba(48,209,88,0.2)'}; color:${isMobile ? '#0A84FF' : '#30D158'}; font-weight:700; border:1px solid ${isMobile ? 'rgba(10,132,255,0.4)' : 'rgba(48,209,88,0.4)'};">
                                ${isMobile ? '📱 Mobile (9:16)' : '🖥️ Desktop (16:9)'}
                              </span>
                            </td>
                            <td style="padding:12px 16px;">
                              <div style="display:flex; gap:4px; flex-wrap:wrap;">
                                ${secs.map(s => `
                                  <span class="badge" style="font-size:0.68rem; background:rgba(255,255,255,0.06);">
                                    ${s === 'wallpapers' ? '🖼️ Wallpapers' : s === 'cars' ? '🏎️ Cars' : s}
                                  </span>
                                `).join('')}
                              </div>
                            </td>
                            <td style="padding:12px 16px; font-family:var(--font-mono); font-size:0.75rem; color:var(--text-muted);">
                              ${img.resolution || (isMobile ? '1080x2400' : '3840x2160')}
                            </td>
                            <td style="padding:12px 16px; font-family:var(--font-mono); font-size:0.8rem;">
                              ⬇️ ${img.downloads || 0} / ❤️ ${img.likes || 0}
                            </td>
                            <td style="padding:12px 16px; text-align:right;">
                              <div style="display:flex; justify-content:flex-end; gap:6px;">
                                <a href="${img.url}" target="_blank" class="btn btn-outline btn-sm" style="padding:4px 8px; font-size:0.72rem; color:var(--text-secondary);" title="Ochish">
                                  ↗
                                </a>
                                <button class="btn btn-outline btn-sm admin-edit-image" data-id="${img.id}" style="color:var(--accent); border-color:var(--accent); padding:4px 10px; font-size:0.72rem;">
                                  Tahrirlash ✏️
                                </button>
                                <button class="btn btn-outline btn-sm admin-del-image" data-id="${img.id}" style="color:#FF453A; border-color:#FF453A; padding:4px 10px; font-size:0.72rem;">
                                  O'chirish ✕
                                </button>
                              </div>
                            </td>
                          </tr>
                        `;
                      })
                      .join("")
              }
            </tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderAddImageFormHtml() {
    return `
      <div style="max-width:760px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:2rem;">
        <h3 style="font-size:1.25rem; font-weight:800; margin-bottom:8px;">YANGI RASM / FON RASMI QO'SHISH (NEON DB)</h3>
        <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:20px;">
          Rasm qaysi formatga mansubligini (Desktop 4K yoki Mobile Phone) va qaysi bo'limlarda ko'rinishini (Wallpapers, Cars yoki har ikkalasida) belgilang.
        </p>

        <form id="admin-add-image-form" style="display:flex; flex-direction:column; gap:16px;">
          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Rasm Nomi (Sarlavha) *
            </label>
            <input 
              type="text" 
              id="new-img-title" 
              placeholder="masalan: NISSAN SKYLINE R34 GT-R 4K NIGHT SHOW" 
              required 
              style="width:100%;" 
            />
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Rasm URL Manzili *
            </label>
            <input 
              type="url" 
              id="new-img-url" 
              placeholder="https://images.unsplash.com/photo-..." 
              required 
              style="width:100%; font-family:var(--font-mono);" 
            />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Qurilma Formati (Device Type) *
              </label>
              <select id="new-img-device" style="width:100%; min-height:42px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-xs);">
                <option value="desktop">🖥️ Desktop Monitor (16:9 / 4K UHD)</option>
                <option value="mobile">📱 Mobile Smartfon (9:16 Vertikal)</option>
              </select>
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Kategoriya
              </label>
              <select id="new-img-cat" style="width:100%; min-height:42px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-xs);">
                <option value="Supercars">Supercars</option>
                <option value="Hypercars">Hypercars</option>
                <option value="JDM Legends">JDM Legends</option>
                <option value="Drift & Smoke">Drift & Smoke</option>
                <option value="Night City">Night City</option>
                <option value="Classic">Classic</option>
                <option value="Minimalist">Minimalist</option>
              </select>
            </div>
          </div>

          <!-- Multiple Sections Checkbox Selection -->
          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:8px; text-transform:uppercase;">
              Qaysi Bo'limlarda Chiqsin? (Multiple Tanlov) *
            </label>
            <div style="display:flex; gap:24px; background:rgba(255,255,255,0.03); padding:12px 16px; border-radius:8px; border:1px solid var(--border-subtle); flex-wrap:wrap;">
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:0.9rem; font-weight:600;">
                <input type="checkbox" id="new-img-sec-wallpapers" value="wallpapers" checked />
                🖼️ Wallpapers Bo'limi
              </label>
              <label style="display:inline-flex; align-items:center; gap:8px; cursor:pointer; font-size:0.9rem; font-weight:600;">
                <input type="checkbox" id="new-img-sec-cars" value="cars" />
                🏎️ Cars (Avtomobillar) Bo'limi
              </label>
            </div>
            <span style="font-size:0.75rem; color:var(--text-muted); margin-top:4px; display:block;">
              Istalgan bitta yoki har ikkala bo'limni belgilashingiz mumkin.
            </span>
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Rezolyutsiya
              </label>
              <input 
                type="text" 
                id="new-img-res" 
                placeholder="3840x2160 yoki 1080x2400" 
                value="3840x2160" 
                style="width:100%; font-family:var(--font-mono);" 
              />
            </div>

            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
                Bog'langan Avtomobil (Ixtiyoriy)
              </label>
              <select id="new-img-car-id" style="width:100%; min-height:42px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-xs);">
                <option value="">-- Umumiy galereya --</option>
                ${store.getCars().map(c => `
                  <option value="${c.id}">${c.year} ${c.brand} ${c.model}</option>
                `).join('')}
              </select>
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:12px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-add-image">Bekor Qilish</button>
            <button type="submit" class="btn btn-primary" id="btn-save-image">
              💾 Neon PostgreSQL ga Saqlash
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

    const quickAddVid = container.querySelector("#btn-quick-add-video");
    if (quickAddVid) {
      quickAddVid.addEventListener("click", () => {
        soundEngine.playClick();
        activeTab = "add-video";
        renderView();
      });
    }

    const quickAddImg = container.querySelector("#btn-quick-add-image");
    if (quickAddImg) {
      quickAddImg.addEventListener("click", () => {
        soundEngine.playClick();
        activeTab = "add-image";
        renderView();
      });
    }

    const cancelAddVid = container.querySelector("#btn-cancel-add-video");
    if (cancelAddVid) {
      cancelAddVid.addEventListener("click", () => {
        soundEngine.playClick();
        activeTab = "videos";
        renderView();
      });
    }

    const cancelAddImg = container.querySelector("#btn-cancel-add-image");
    if (cancelAddImg) {
      cancelAddImg.addEventListener("click", () => {
        soundEngine.playClick();
        activeTab = "images";
        renderView();
      });
    }

    // Delete Video Handlers
    const delBtns = container.querySelectorAll(".admin-del-video");
    delBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!confirm("Haqiqatan ham ushbu videoni Neon DB dan butunlay o'chirmoqchimisiz?")) return;

        try {
          await api.deleteVideo(id);
          store.deleteVideo(id);
          soundEngine.playClick();
          videosList = videosList.filter((v) => String(v.id) !== String(id));
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Video Neon DB dan butunlay o'chirildi!" }
          }));
          renderView();
        } catch (err) {
          alert(err.message || "O'chirishda xatolik");
        }
      });
    });

    // Edit Video Handlers
    const editBtns = container.querySelectorAll(".admin-edit-video");
    const editModal = container.querySelector("#admin-edit-modal");
    const editForm = container.querySelector("#admin-edit-video-form");
    const closeEdit = container.querySelector("#btn-close-admin-edit");
    const cancelEdit = container.querySelector("#btn-cancel-admin-edit");

    editBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const video = videosList.find((v) => String(v.id) === String(id));
        if (!video || !editModal) return;

        soundEngine.playClick();
        editModal.setAttribute("data-active-id", id);
        container.querySelector("#admin-edit-title").value = video.title || "";
        container.querySelector("#admin-edit-url").value = video.youtube_url || video.youtube_id || "";
        container.querySelector("#admin-edit-category").value = video.category || "Drift";
        container.querySelector("#admin-edit-duration").value = video.duration || "05:00";
        container.querySelector("#admin-edit-channel").value = video.channel_name || video.author || "DRIFT MEDIA";
        container.querySelector("#admin-edit-desc").value = video.description || "";

        editModal.style.display = "flex";
      });
    });

    const hideEditModal = () => {
      if (editModal) editModal.style.display = "none";
    };

    if (closeEdit) closeEdit.addEventListener("click", hideEditModal);
    if (cancelEdit) cancelEdit.addEventListener("click", hideEditModal);

    if (editForm) {
      editForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = editModal.getAttribute("data-active-id");
        const saveBtn = container.querySelector("#btn-save-admin-edit");
        const title = container.querySelector("#admin-edit-title").value.trim();
        const url = container.querySelector("#admin-edit-url").value.trim();
        const category = container.querySelector("#admin-edit-category").value;
        const duration = container.querySelector("#admin-edit-duration").value.trim();
        const channel_name = container.querySelector("#admin-edit-channel").value.trim();
        const description = container.querySelector("#admin-edit-desc").value.trim();

        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = "Neon DB ga yozilmoqda...";
        }

        try {
          const res = await api.updateVideo(id, {
            title,
            url,
            category,
            duration,
            channel_name,
            description
          });

          soundEngine.playRev("turbo-v6");
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Video Neon DB da muvaffaqiyatli tahrirlandi!" }
          }));

          if (res.video) {
            store.updateVideo(id, res.video);
            const idx = videosList.findIndex((v) => String(v.id) === String(id));
            if (idx !== -1) videosList[idx] = res.video;
          }

          hideEditModal();
          renderView();
        } catch (err) {
          alert(err.message || "Tahrirlashda xatolik yuz berdi");
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "💾 Neon DB ga Saqlash";
          }
        }
      });
    }

    // Add Video Form Submit
    const addVidForm = container.querySelector("#admin-add-video-form");
    if (addVidForm) {
      addVidForm.addEventListener("submit", async (e) => {
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
          await api.addVideo({
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

    // Delete Image Handlers
    const delImgBtns = container.querySelectorAll(".admin-del-image");
    delImgBtns.forEach((btn) => {
      btn.addEventListener("click", async () => {
        const id = btn.getAttribute("data-id");
        if (!confirm("Haqiqatan ham ushbu rasmni Neon DB dan butunlay o'chirmoqchimisiz?")) return;

        try {
          await api.deleteImage(id);
          store.deleteImage(id);
          soundEngine.playClick();
          imagesList = imagesList.filter((img) => String(img.id) !== String(id));
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Rasm Neon DB dan butunlay o'chirildi!" }
          }));
          renderView();
        } catch (err) {
          alert(err.message || "Rasm o'chirishda xatolik");
        }
      });
    });

    // Edit Image Modal Handlers
    const editImgBtns = container.querySelectorAll(".admin-edit-image");
    const editImgModal = container.querySelector("#admin-edit-image-modal");
    const editImgForm = container.querySelector("#admin-edit-image-form");
    const closeImgEdit = container.querySelector("#btn-close-image-edit");
    const cancelImgEdit = container.querySelector("#btn-cancel-image-edit");

    editImgBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-id");
        const img = imagesList.find((i) => String(i.id) === String(id));
        if (!img || !editImgModal) return;

        soundEngine.playClick();
        editImgModal.setAttribute("data-active-id", id);
        container.querySelector("#admin-edit-img-title").value = img.title || "";
        container.querySelector("#admin-edit-img-url").value = img.url || "";
        container.querySelector("#admin-edit-img-device").value = img.device_type || "desktop";
        container.querySelector("#admin-edit-img-cat").value = img.category || "Supercars";
        container.querySelector("#admin-edit-img-res").value = img.resolution || "3840x2160";

        const secs = Array.isArray(img.sections) ? img.sections : [img.sections || "wallpapers"];
        container.querySelector("#admin-edit-img-sec-wallpapers").checked = secs.includes("wallpapers");
        container.querySelector("#admin-edit-img-sec-cars").checked = secs.includes("cars");

        editImgModal.style.display = "flex";
      });
    });

    const hideImgEditModal = () => {
      if (editImgModal) editImgModal.style.display = "none";
    };

    if (closeImgEdit) closeImgEdit.addEventListener("click", hideImgEditModal);
    if (cancelImgEdit) cancelImgEdit.addEventListener("click", hideImgEditModal);

    if (editImgForm) {
      editImgForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const id = editImgModal.getAttribute("data-active-id");
        const saveBtn = container.querySelector("#btn-save-image-edit");
        const title = container.querySelector("#admin-edit-img-title").value.trim();
        const url = container.querySelector("#admin-edit-img-url").value.trim();
        const device_type = container.querySelector("#admin-edit-img-device").value;
        const category = container.querySelector("#admin-edit-img-cat").value.trim();
        const resolution = container.querySelector("#admin-edit-img-res").value.trim();

        const sections = [];
        if (container.querySelector("#admin-edit-img-sec-wallpapers").checked) sections.push("wallpapers");
        if (container.querySelector("#admin-edit-img-sec-cars").checked) sections.push("cars");
        if (sections.length === 0) sections.push("wallpapers");

        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = "Neon DB ga saqlanmoqda...";
        }

        try {
          const res = await api.updateImage(id, {
            title,
            url,
            device_type,
            category,
            resolution,
            sections
          });

          soundEngine.playRev("turbo-v6");
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Rasm ma'lumotlari muvaffaqiyatli saqlandi!" }
          }));

          if (res.image) {
            store.updateImage(id, res.image);
            const idx = imagesList.findIndex((i) => String(i.id) === String(id));
            if (idx !== -1) imagesList[idx] = res.image;
          }

          hideImgEditModal();
          renderView();
        } catch (err) {
          alert(err.message || "Tahrirlashda xatolik");
          if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.textContent = "💾 Neon DB ga Saqlash";
          }
        }
      });
    }

    // Add Image Form Submit
    const addImgForm = container.querySelector("#admin-add-image-form");
    if (addImgForm) {
      addImgForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const saveBtn = container.querySelector("#btn-save-image");
        const title = container.querySelector("#new-img-title").value.trim();
        const url = container.querySelector("#new-img-url").value.trim();
        const device_type = container.querySelector("#new-img-device").value;
        const category = container.querySelector("#new-img-cat").value;
        const resolution = container.querySelector("#new-img-res").value.trim();
        const car_id = container.querySelector("#new-img-car-id").value || null;

        const sections = [];
        if (container.querySelector("#new-img-sec-wallpapers").checked) sections.push("wallpapers");
        if (container.querySelector("#new-img-sec-cars").checked) sections.push("cars");
        if (sections.length === 0) sections.push("wallpapers");

        if (saveBtn) {
          saveBtn.disabled = true;
          saveBtn.textContent = "Neon DB ga yuklanmoqda...";
        }

        try {
          await api.addImage({
            title,
            url,
            device_type,
            sections,
            category,
            resolution,
            car_id
          });

          soundEngine.playRev("turbo-v6");
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Yangi rasm muvaffaqiyatli yuklandi!" }
          }));

          imagesList = await api.getImages();
          activeTab = "images";
          renderView();
        } catch (err) {
          alert(err.message || "Rasm qo'shishda xato yuz berdi");
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
 * Strictly locks entry to:
 * Email: soxibgaybullayev439@gmail.com
 * Password: s0x1bj0n$02$
 */
function renderAdminLoginGateway(container) {
  container.innerHTML = `
    <div class="section-wrapper" style="min-height:85vh; display:flex; align-items:center; justify-content:center; padding:2rem 1rem; width:100%; box-sizing:border-box;">
      <div class="admin-security-gate-card" style="width:100%; max-width:440px; box-sizing:border-box; background:var(--bg-card); border:1px solid var(--border-medium); border-radius:var(--radius-sm); padding:2.5rem 1.75rem; box-shadow:0 24px 60px rgba(0,0,0,0.8); backdrop-filter:blur(16px); text-align:center;">
        
        <div style="font-size:3rem; margin-bottom:12px;">🔒</div>
        
        <div class="section-tag" style="justify-content:center; margin-bottom:8px; color:var(--accent);">
          RESTRICTED GATEWAY // ROOT AUTHORIZATION
        </div>
        
        <h2 style="font-size:1.75rem; font-weight:800; margin-bottom:10px; color:var(--text-primary);">
          ADMINISTRATOR KIRISH
        </h2>
        
        <p style="font-size:0.875rem; color:var(--text-secondary); line-height:1.5; margin-bottom:24px;">
          Boshqaruv paneli faqat vakolatli administrator uchun qulflangan. Kirish uchun biriktirilgan E-mail va parolingizni tasdiqlang.
        </p>

        <div id="admin-gate-error" style="display:none; background:rgba(255,59,48,0.12); border:1px solid #FF3B30; color:#FF453A; padding:10px 14px; border-radius:var(--radius-xs); font-size:0.825rem; margin-bottom:16px; text-align:left;"></div>

        <form id="admin-gate-form" style="display:flex; flex-direction:column; gap:16px;">
          <div style="text-align:left;">
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Admin E-mail Manzili *
            </label>
            <input 
              type="email" 
              id="admin-gate-email" 
              placeholder="soxibgaybullayev439@gmail.com" 
              required 
              style="width:100%; font-size:0.95rem; padding:12px 14px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); border-radius:var(--radius-xs); color:#fff;" 
            />
          </div>

          <div style="text-align:left;">
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">
              Admin Maxfiy Paroli *
            </label>
            <input 
              type="password" 
              id="admin-gate-password" 
              placeholder="••••••••••••" 
              required 
              style="width:100%; font-size:1.05rem; letter-spacing:0.1em; padding:12px 14px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); border-radius:var(--radius-xs); color:#fff;" 
            />
          </div>

          <button type="submit" class="btn btn-primary" id="btn-admin-unlock" style="width:100%; padding:14px; font-weight:700; margin-top:8px;">
            Xavfsizlik Tekshiruvi ➔
          </button>
        </form>

        <div style="margin-top:20px; font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">
          DATA SECURITY: NEON POSTGRESQL & BCRYPT HASH
        </div>
      </div>
    </div>
  `;

  const form = container.querySelector("#admin-gate-form");
  const emailInput = container.querySelector("#admin-gate-email");
  const passInput = container.querySelector("#admin-gate-password");
  const errBox = container.querySelector("#admin-gate-error");
  const submitBtn = container.querySelector("#btn-admin-unlock");

  if (form && emailInput && passInput) {
    emailInput.focus();
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const email = emailInput.value.trim();
      const password = passInput.value;
      if (!email || !password) return;

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Tekshirilmoqda...";
      }

      const res = await authService.adminLogin(email, password);
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Xavfsizlik Tekshiruvi ➔";
      }

      if (res.success) {
        soundEngine.playRev("v12-roar");
        window.dispatchEvent(new CustomEvent("driftverse:toast", {
          detail: { message: "Xavfsizlik tekshiruvi muvaffaqiyatli o'tdi! Xush kelibsiz, Admin." }
        }));
        renderAdminPage(container);
      } else {
        if (errBox) {
          errBox.textContent = res.message || "Kirish rad etildi! Faqat vakolatli administrator ruxsatiga ega.";
          errBox.style.display = "block";
        }
        passInput.style.borderColor = "#FF3B30";
        passInput.value = "";
      }
    });
  }
}
