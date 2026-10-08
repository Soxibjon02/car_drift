/**
 * DRIFTVERSE - Wallpapers & High-Resolution Media Hub
 * Features:
 * - Multi-section support (Wallpapers + Cars integration)
 * - Device-specific classification (Desktop 4K 16:9 vs Mobile Phone 9:16)
 * - High-speed search & category filtering
 * - Full-screen immersive Lightbox with zoom and keyboard navigation
 * - Direct download trigger with live download counters
 * - Favorites / like system
 */

import { store } from "../services/store.js";
import { api } from "../services/api.js";
import { soundEngine } from "../services/audio.js";

let currentDeviceFilter = "all"; // 'all', 'desktop', 'mobile'
let currentCategoryFilter = "all";
let currentSearchQuery = "";
let activeLightboxIndex = -1;
let currentFilteredList = [];

export function renderWallpapersPage(container) {
  soundEngine.playWhoosh();

  // Load from store or API
  renderHub(container);
}

function renderHub(container) {
  const allImages = store.getImages({ section: "wallpapers" });
  
  // Categorize counts
  const desktopCount = allImages.filter(img => img.device_type === "desktop").length;
  const mobileCount = allImages.filter(img => img.device_type === "mobile").length;
  const totalDownloads = allImages.reduce((sum, img) => sum + (img.downloads || 0), 0);

  // Extract categories
  const categories = ["all", ...new Set(allImages.map(img => img.category).filter(Boolean))];

  container.innerHTML = `
    <div class="wallpapers-page" style="min-height:90vh; padding-bottom:80px;">
      <!-- Hero Header -->
      <section style="background:linear-gradient(180deg, rgba(255,59,48,0.08) 0%, rgba(10,12,16,0.6) 100%); border-bottom:1px solid var(--border-subtle); padding:60px 0 40px;">
        <div class="container">
          <div style="display:flex; justify-content:space-between; align-items:flex-end; flex-wrap:wrap; gap:24px;">
            <div style="max-width:650px;">
              <div style="display:inline-flex; align-items:center; gap:8px; background:rgba(255,59,48,0.12); border:1px solid rgba(255,59,48,0.3); border-radius:100px; padding:4px 14px; font-family:var(--font-mono); font-size:0.75rem; color:var(--accent); font-weight:700; letter-spacing:0.08em; text-transform:uppercase; margin-bottom:16px;">
                <span>⚡</span> 4K ULTRA HD & SMARTPHONE MEDIA
              </div>
              <h1 style="font-size:clamp(2rem, 4vw, 3.2rem); font-weight:900; line-height:1.1; margin-bottom:16px; letter-spacing:-0.03em;">
                Eksklyuziv Avtomobil <span style="color:var(--accent); text-shadow:0 0 30px rgba(255,59,48,0.4);">Fon Rasmlari</span>
              </h1>
              <p style="color:var(--text-secondary); font-size:1.05rem; line-height:1.6; margin-bottom:0;">
                Desktop monitorlar uchun 4K Ultra HD keng format va smartfon ekranlari uchun 9:16 vertikal formatdagi professional avtomobil rasmlari.
              </p>
            </div>

            <!-- Fast Stats Counter -->
            <div style="display:flex; gap:16px; flex-wrap:wrap;">
              <div style="background:var(--card-bg, #16181f); border:1px solid var(--border-subtle); border-radius:12px; padding:12px 20px; text-align:center; min-width:110px;">
                <div style="font-family:var(--font-mono); font-size:1.5rem; font-weight:800; color:var(--accent);">${allImages.length}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Barcha Rasmlar</div>
              </div>
              <div style="background:var(--card-bg, #16181f); border:1px solid var(--border-subtle); border-radius:12px; padding:12px 20px; text-align:center; min-width:110px;">
                <div style="font-family:var(--font-mono); font-size:1.5rem; font-weight:800; color:#30D158;">${desktopCount}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Desktop 4K</div>
              </div>
              <div style="background:var(--card-bg, #16181f); border:1px solid var(--border-subtle); border-radius:12px; padding:12px 20px; text-align:center; min-width:110px;">
                <div style="font-family:var(--font-mono); font-size:1.5rem; font-weight:800; color:#0A84FF;">${mobileCount}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Mobile 9:16</div>
              </div>
              <div style="background:var(--card-bg, #16181f); border:1px solid var(--border-subtle); border-radius:12px; padding:12px 20px; text-align:center; min-width:110px;">
                <div style="font-family:var(--font-mono); font-size:1.5rem; font-weight:800; color:#FFD60A;">${totalDownloads}</div>
                <div style="font-size:0.72rem; color:var(--text-muted); text-transform:uppercase; letter-spacing:0.05em;">Yuklanishlar</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Filter Controls Bar -->
      <section style="position:sticky; top:70px; z-index:40; background:rgba(12,14,18,0.92); backdrop-filter:blur(16px); border-bottom:1px solid var(--border-subtle); padding:16px 0;">
        <div class="container">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
            <!-- Device Tabs -->
            <div style="display:inline-flex; background:rgba(255,255,255,0.06); padding:4px; border-radius:10px; border:1px solid var(--border-subtle);" id="device-tabs">
              <button class="filter-tab ${currentDeviceFilter === 'all' ? 'active' : ''}" data-device="all" style="padding:8px 16px; font-size:0.85rem; font-weight:600; border-radius:8px; border:none; background:${currentDeviceFilter === 'all' ? 'var(--accent)' : 'transparent'}; color:#fff; cursor:pointer; transition:all 0.2s;">
                🌐 Barchasi (${allImages.length})
              </button>
              <button class="filter-tab ${currentDeviceFilter === 'desktop' ? 'active' : ''}" data-device="desktop" style="padding:8px 16px; font-size:0.85rem; font-weight:600; border-radius:8px; border:none; background:${currentDeviceFilter === 'desktop' ? 'var(--accent)' : 'transparent'}; color:#fff; cursor:pointer; transition:all 0.2s;">
                🖥️ Desktop 4K (${desktopCount})
              </button>
              <button class="filter-tab ${currentDeviceFilter === 'mobile' ? 'active' : ''}" data-device="mobile" style="padding:8px 16px; font-size:0.85rem; font-weight:600; border-radius:8px; border:none; background:${currentDeviceFilter === 'mobile' ? 'var(--accent)' : 'transparent'}; color:#fff; cursor:pointer; transition:all 0.2s;">
                📱 Mobile Phone (${mobileCount})
              </button>
            </div>

            <!-- Search Field -->
            <div style="flex:1; max-width:320px; min-width:200px; position:relative;">
              <input type="text" id="wallpapers-search-input" value="${currentSearchQuery}" placeholder="Rasm yoki mashina qidirish..." style="width:100%; padding:10px 14px 10px 38px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid var(--border-subtle); color:#fff; font-size:0.85rem;" />
              <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); opacity:0.5; font-size:0.9rem;">🔍</span>
              ${currentSearchQuery ? `<button id="wallpapers-clear-search" style="position:absolute; right:10px; top:50%; transform:translateY(-50%); background:none; border:none; color:var(--text-muted); cursor:pointer;">✕</button>` : ''}
            </div>
          </div>

          <!-- Category Pills -->
          <div style="display:flex; gap:8px; overflow-x:auto; padding-top:12px; padding-bottom:4px; scrollbar-width:none;" id="category-pills">
            ${categories.map(cat => `
              <button class="cat-pill ${currentCategoryFilter === cat ? 'active' : ''}" data-category="${cat}" style="white-space:nowrap; padding:6px 14px; font-size:0.8rem; border-radius:100px; border:1px solid ${currentCategoryFilter === cat ? 'var(--accent)' : 'var(--border-subtle)'}; background:${currentCategoryFilter === cat ? 'rgba(255,59,48,0.18)' : 'rgba(255,255,255,0.03)'}; color:${currentCategoryFilter === cat ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-weight:${currentCategoryFilter === cat ? '700' : '500'}; transition:all 0.2s;">
                ${cat === 'all' ? 'Barcha Kategoriyalar' : cat}
              </button>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- Main Gallery Grid -->
      <section class="container" style="padding-top:36px;">
        <div id="wallpapers-grid-container">
          <!-- Populated by renderGrid -->
        </div>
      </section>

      <!-- Lightbox Modal Container -->
      <div id="wallpaper-lightbox-modal" style="display:none;"></div>
    </div>
  `;

  // Attach filter events
  attachHubEvents(container);

  // Render initial grid
  renderGrid(container);
}

function getFilteredImages() {
  let list = store.getImages({ section: "wallpapers" });

  if (currentDeviceFilter !== "all") {
    list = list.filter(img => img.device_type === currentDeviceFilter);
  }

  if (currentCategoryFilter !== "all") {
    list = list.filter(img => img.category?.toLowerCase() === currentCategoryFilter.toLowerCase());
  }

  if (currentSearchQuery.trim()) {
    const q = currentSearchQuery.toLowerCase().trim();
    list = list.filter(img => 
      (img.title && img.title.toLowerCase().includes(q)) ||
      (img.category && img.category.toLowerCase().includes(q)) ||
      (img.resolution && img.resolution.toLowerCase().includes(q))
    );
  }

  return list;
}

function renderGrid(container) {
  const gridContainer = container.querySelector("#wallpapers-grid-container");
  if (!gridContainer) return;

  const images = getFilteredImages();
  currentFilteredList = images;

  if (images.length === 0) {
    gridContainer.innerHTML = `
      <div style="text-align:center; padding:80px 20px; background:rgba(255,255,255,0.02); border:1px dashed var(--border-subtle); border-radius:16px;">
        <div style="font-size:3rem; margin-bottom:16px; opacity:0.6;">🖼️</div>
        <h3 style="font-size:1.3rem; margin-bottom:8px;">Mos keluvchi rasm topilmadi</h3>
        <p style="color:var(--text-muted); font-size:0.9rem; max-width:400px; margin:0 auto 20px;">
          Tanlangan parametrlar yoki qidiruv bo'yicha hozircha rasm mavjud emas. Filtrlarni tozalab ko'ring.
        </p>
        <button class="btn btn-secondary btn-sm" id="btn-reset-filters">Filtrlarni Tozalash</button>
      </div>
    `;

    const resetBtn = gridContainer.querySelector("#btn-reset-filters");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        currentDeviceFilter = "all";
        currentCategoryFilter = "all";
        currentSearchQuery = "";
        renderHub(container);
      });
    }
    return;
  }

  // Grid styling depends on device filter:
  // If desktop only: 16:9 widescreen columns
  // If mobile only: 9:16 portrait columns (smaller column width)
  // If all: mixed responsive grid
  let gridStyle = "display:grid; gap:24px; ";
  if (currentDeviceFilter === "mobile") {
    gridStyle += "grid-template-columns:repeat(auto-fill, minmax(220px, 1fr));";
  } else if (currentDeviceFilter === "desktop") {
    gridStyle += "grid-template-columns:repeat(auto-fill, minmax(360px, 1fr));";
  } else {
    gridStyle += "grid-template-columns:repeat(auto-fill, minmax(320px, 1fr));";
  }

  gridContainer.innerHTML = `
    <div style="${gridStyle}">
      ${images.map((img, idx) => {
        const isMobile = img.device_type === "mobile";
        const aspectRatio = isMobile ? "9 / 16" : "16 / 9";
        const isLiked = store.isImageLiked(img.id);
        const sections = Array.isArray(img.sections) ? img.sections : [img.sections || "wallpapers"];
        const inCars = sections.includes("cars");

        return `
          <div class="wallpaper-card" data-id="${img.id}" data-index="${idx}" style="background:var(--card-bg, #14171e); border:1px solid var(--border-subtle); border-radius:14px; overflow:hidden; display:flex; flex-direction:column; position:relative; transition:transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s; cursor:pointer;">
            
            <!-- Image Frame -->
            <div class="wallpaper-thumb-wrapper" style="position:relative; width:100%; aspect-ratio:${aspectRatio}; overflow:hidden; background:#08090c;">
              <img 
                src="${img.url}" 
                alt="${img.title}" 
                loading="lazy" 
                style="width:100%; height:100%; object-fit:cover; transition:transform 0.5s cubic-bezier(0.16, 1, 0.3, 1);"
                class="wallpaper-img"
              />

              <!-- Top badges -->
              <div style="position:absolute; top:12px; left:12px; right:12px; display:flex; justify-content:space-between; align-items:center; pointer-events:none;">
                <div style="display:flex; gap:6px;">
                  <span class="badge" style="background:${isMobile ? 'rgba(10,132,255,0.85)' : 'rgba(48,209,88,0.85)'}; color:#fff; font-weight:700; font-size:10px; padding:3px 8px; backdrop-filter:blur(8px); border:none;">
                    ${isMobile ? '📱 9:16 Mobile' : '🖥️ 4K Desktop'}
                  </span>
                  ${inCars ? `
                    <span class="badge" style="background:rgba(255,59,48,0.85); color:#fff; font-size:10px; padding:3px 8px; backdrop-filter:blur(8px); border:none;" title="Avtomobillar bo'limida ham mavjud">
                      🏎️ Cars
                    </span>
                  ` : ''}
                </div>
                <span class="badge" style="background:rgba(0,0,0,0.65); color:var(--text-muted); font-family:var(--font-mono); font-size:10px; padding:3px 8px; backdrop-filter:blur(8px); border:1px solid rgba(255,255,255,0.1);">
                  ${img.resolution || (isMobile ? '1080x2400' : '3840x2160')}
                </span>
              </div>

              <!-- Quick Hover Overlay with Preview Icon -->
              <div class="wallpaper-hover-overlay" style="position:absolute; inset:0; background:linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%); opacity:0; transition:opacity 0.25s; display:flex; align-items:center; justify-content:center; gap:12px;">
                <button class="btn btn-primary btn-sm btn-preview-img" data-index="${idx}" style="box-shadow:0 8px 24px rgba(0,0,0,0.5);">
                  👁️ Ko'rish (4K)
                </button>
              </div>
            </div>

            <!-- Info & Actions Footer -->
            <div style="padding:14px 16px; display:flex; flex-direction:column; gap:10px; flex:1;">
              <div>
                <div style="font-size:0.72rem; color:var(--accent); font-weight:700; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px;">
                  ${img.category || 'Automotive'}
                </div>
                <h4 style="font-size:0.95rem; font-weight:700; margin:0; line-height:1.3; color:#fff; text-overflow:ellipsis; overflow:hidden; white-space:nowrap;">
                  ${img.title}
                </h4>
              </div>

              <!-- Action Buttons Row -->
              <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto; padding-top:8px; border-top:1px solid rgba(255,255,255,0.06);">
                <div style="display:flex; align-items:center; gap:12px;">
                  <!-- Like Button -->
                  <button class="btn-like-img" data-id="${img.id}" style="background:none; border:none; display:inline-flex; align-items:center; gap:5px; font-size:0.82rem; color:${isLiked ? '#FF3B30' : 'var(--text-muted)'}; cursor:pointer; padding:4px 6px; border-radius:6px; transition:all 0.2s;">
                    <span>${isLiked ? '❤️' : '🤍'}</span>
                    <span class="like-count" style="font-family:var(--font-mono); font-size:0.8rem;">${img.likes || 0}</span>
                  </button>

                  <!-- Downloads Counter -->
                  <span style="font-size:0.78rem; color:var(--text-muted); font-family:var(--font-mono); display:inline-flex; align-items:center; gap:4px;" title="Yuklanishlar soni">
                    <span>⬇️</span> ${img.downloads || 0}
                  </span>
                </div>

                <!-- Download Trigger -->
                <button class="btn btn-secondary btn-sm btn-download-img" data-id="${img.id}" data-url="${img.url}" data-title="${img.title}" style="padding:6px 12px; font-size:0.8rem; border-radius:6px; font-weight:600;">
                  ⬇️ Yuklab Olish
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('')}
    </div>
  `;

  // Attach Card Interactions
  attachCardEvents(container);
}

function attachHubEvents(container) {
  // Device Tabs
  container.querySelectorAll("#device-tabs .filter-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      soundEngine.playClick();
      currentDeviceFilter = tab.getAttribute("data-device");
      container.querySelectorAll("#device-tabs .filter-tab").forEach(t => {
        const isActive = t === tab;
        t.style.background = isActive ? 'var(--accent)' : 'transparent';
        t.classList.toggle("active", isActive);
      });
      renderGrid(container);
    });
  });

  // Category Pills
  container.querySelectorAll("#category-pills .cat-pill").forEach(pill => {
    pill.addEventListener("click", () => {
      soundEngine.playClick();
      currentCategoryFilter = pill.getAttribute("data-category");
      container.querySelectorAll("#category-pills .cat-pill").forEach(p => {
        const isActive = p === pill;
        p.style.borderColor = isActive ? 'var(--accent)' : 'var(--border-subtle)';
        p.style.background = isActive ? 'rgba(255,59,48,0.18)' : 'rgba(255,255,255,0.03)';
        p.style.color = isActive ? 'var(--accent)' : 'var(--text-secondary)';
        p.style.fontWeight = isActive ? '700' : '500';
      });
      renderGrid(container);
    });
  });

  // Search Input
  const searchInput = container.querySelector("#wallpapers-search-input");
  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      currentSearchQuery = e.target.value;
      renderGrid(container);
    });
  }

  // Clear search
  const clearBtn = container.querySelector("#wallpapers-clear-search");
  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      currentSearchQuery = "";
      if (searchInput) searchInput.value = "";
      renderGrid(container);
    });
  }
}

function attachCardEvents(container) {
  // Hover effect over cards
  container.querySelectorAll(".wallpaper-card").forEach(card => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-4px)";
      card.style.boxShadow = "0 16px 36px rgba(0,0,0,0.5)";
      const overlay = card.querySelector(".wallpaper-hover-overlay");
      const img = card.querySelector(".wallpaper-img");
      if (overlay) overlay.style.opacity = "1";
      if (img) img.style.transform = "scale(1.05)";
    });
    card.addEventListener("mouseleave", () => {
      card.style.transform = "translateY(0)";
      card.style.boxShadow = "none";
      const overlay = card.querySelector(".wallpaper-hover-overlay");
      const img = card.querySelector(".wallpaper-img");
      if (overlay) overlay.style.opacity = "0";
      if (img) img.style.transform = "scale(1)";
    });
  });

  // Click card to open lightbox
  container.querySelectorAll(".wallpaper-thumb-wrapper, .btn-preview-img").forEach(el => {
    el.addEventListener("click", (e) => {
      e.stopPropagation();
      const card = el.closest(".wallpaper-card");
      if (!card) return;
      const idx = parseInt(card.getAttribute("data-index"), 10);
      openLightbox(idx, container);
    });
  });

  // Like button
  container.querySelectorAll(".btn-like-img").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const id = btn.getAttribute("data-id");

      if (!store.currentUser) {
        window.dispatchEvent(new CustomEvent("driftverse:toast", {
          detail: { message: "Rasmga layk bosish uchun tizimga kiring!" }
        }));
        window.dispatchEvent(new CustomEvent("driftverse:open-auth"));
        return;
      }

      const res = store.toggleLikeImage(id);
      if (res) {
        // Send to API
        try {
          await api.likeImage(id);
        } catch (err) {
          console.warn("Could not sync like to server:", err);
        }
        btn.querySelector(".like-count").textContent = res.count;
        btn.querySelector("span").textContent = res.liked ? "❤️" : "🤍";
        btn.style.color = res.liked ? "#FF3B30" : "var(--text-muted)";
      }
    });
  });

  // Download button
  container.querySelectorAll(".btn-download-img").forEach(btn => {
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      soundEngine.playClick();
      const id = btn.getAttribute("data-id");
      const url = btn.getAttribute("data-url");
      const title = btn.getAttribute("data-title") || "driftverse-wallpaper";

      triggerDownload(id, url, title, container);
    });
  });
}

async function triggerDownload(id, url, title, container) {
  // Record download in store and backend
  store.recordImageDownload(id);
  try {
    await api.downloadImage(id);
  } catch (err) {
    console.warn("Could not sync download counter to server:", err);
  }

  // Trigger browser download via anchor
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);

  window.dispatchEvent(new CustomEvent("driftverse:toast", {
    detail: { message: `📥 "${title}" fon rasmi muvaffaqiyatli yuklandi!` }
  }));

  // Re-render grid to update download counters
  renderGrid(container);
}

function openLightbox(index, container) {
  if (index < 0 || index >= currentFilteredList.length) return;
  activeLightboxIndex = index;
  const img = currentFilteredList[index];
  const isMobile = img.device_type === "mobile";
  const isLiked = store.isImageLiked(img.id);

  const modal = container.querySelector("#wallpaper-lightbox-modal");
  if (!modal) return;

  soundEngine.playWhoosh();

  modal.style.display = "block";
  modal.innerHTML = `
    <div style="position:fixed; inset:0; z-index:9999; background:rgba(0,0,0,0.94); backdrop-filter:blur(20px); display:flex; flex-direction:column; animation:fadeIn 0.25s ease;">
      <!-- Top Bar -->
      <div style="display:flex; justify-content:space-between; align-items:center; padding:16px 24px; border-bottom:1px solid rgba(255,255,255,0.08);">
        <div style="display:flex; align-items:center; gap:12px;">
          <span class="badge" style="background:${isMobile ? '#0A84FF' : '#30D158'}; color:#fff; font-size:11px;">
            ${isMobile ? '📱 Mobile 9:16' : '🖥️ Desktop 4K UHD'}
          </span>
          <h3 style="font-size:1.1rem; margin:0; font-weight:700; color:#fff;">${img.title}</h3>
          <span style="font-size:0.8rem; color:var(--text-muted); font-family:var(--font-mono);">${img.resolution || 'High Resolution'}</span>
        </div>

        <div style="display:flex; align-items:center; gap:12px;">
          <!-- Download in Lightbox -->
          <button class="btn btn-primary btn-sm" id="lightbox-download-btn" style="display:flex; align-items:center; gap:6px;">
            ⬇️ Yuklab Olish
          </button>
          <!-- Close Button -->
          <button id="lightbox-close-btn" style="background:rgba(255,255,255,0.1); border:none; color:#fff; width:38px; height:38px; border-radius:50%; font-size:1.1rem; cursor:pointer; display:flex; align-items:center; justify-content:center; transition:background 0.2s;">
            ✕
          </button>
        </div>
      </div>

      <!-- Main Stage with Image & Navigation -->
      <div style="flex:1; position:relative; display:flex; align-items:center; justify-content:center; padding:20px; overflow:hidden;">
        <!-- Prev Button -->
        ${activeLightboxIndex > 0 ? `
          <button id="lightbox-prev-btn" style="position:absolute; left:24px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.15); color:#fff; width:50px; height:50px; border-radius:50%; font-size:1.4rem; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
            ❮
          </button>
        ` : ''}

        <!-- Image Container -->
        <div style="max-width:92%; max-height:85vh; display:flex; align-items:center; justify-content:center; box-shadow:0 24px 64px rgba(0,0,0,0.8); border-radius:12px; overflow:hidden;">
          <img 
            src="${img.url}" 
            alt="${img.title}" 
            style="max-width:100%; max-height:82vh; object-fit:contain; border-radius:12px;" 
            id="lightbox-main-img"
          />
        </div>

        <!-- Next Button -->
        ${activeLightboxIndex < currentFilteredList.length - 1 ? `
          <button id="lightbox-next-btn" style="position:absolute; right:24px; top:50%; transform:translateY(-50%); background:rgba(0,0,0,0.6); border:1px solid rgba(255,255,255,0.15); color:#fff; width:50px; height:50px; border-radius:50%; font-size:1.4rem; cursor:pointer; z-index:10; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
            ❯
          </button>
        ` : ''}
      </div>

      <!-- Bottom Info Row -->
      <div style="padding:14px 24px; display:flex; justify-content:space-between; align-items:center; border-top:1px solid rgba(255,255,255,0.08); background:rgba(0,0,0,0.5);">
        <div style="display:flex; gap:16px; align-items:center;">
          <span style="font-size:0.85rem; color:var(--text-muted);">
            Kategoriya: <strong style="color:var(--text-primary);">${img.category || 'General'}</strong>
          </span>
          <span style="font-size:0.85rem; color:var(--text-muted); font-family:var(--font-mono);">
            Yuklanishlar: <strong style="color:var(--text-primary);">${img.downloads || 0}</strong>
          </span>
        </div>

        <div style="font-size:0.8rem; color:var(--text-muted); font-family:var(--font-mono);">
          ${activeLightboxIndex + 1} / ${currentFilteredList.length}
        </div>
      </div>
    </div>
  `;

  // Attach Lightbox Events
  const closeBtn = modal.querySelector("#lightbox-close-btn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeLightbox);
  }

  const dlBtn = modal.querySelector("#lightbox-download-btn");
  if (dlBtn) {
    dlBtn.addEventListener("click", () => {
      triggerDownload(img.id, img.url, img.title, container);
    });
  }

  const prevBtn = modal.querySelector("#lightbox-prev-btn");
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      soundEngine.playClick();
      openLightbox(activeLightboxIndex - 1, container);
    });
  }

  const nextBtn = modal.querySelector("#lightbox-next-btn");
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      soundEngine.playClick();
      openLightbox(activeLightboxIndex + 1, container);
    });
  }

  // Keyboard Navigation
  function handleKeyDown(e) {
    if (e.key === "Escape") {
      closeLightbox();
    } else if (e.key === "ArrowLeft" && activeLightboxIndex > 0) {
      openLightbox(activeLightboxIndex - 1, container);
    } else if (e.key === "ArrowRight" && activeLightboxIndex < currentFilteredList.length - 1) {
      openLightbox(activeLightboxIndex + 1, container);
    }
  }

  function closeLightbox() {
    soundEngine.playClick();
    modal.style.display = "none";
    modal.innerHTML = "";
    window.removeEventListener("keydown", handleKeyDown);
  }

  window.addEventListener("keydown", handleKeyDown);
}
