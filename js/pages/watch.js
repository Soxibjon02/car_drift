/**
 * DRIFTVERSE - Dedicated Cinematic Video Watch Page
 * Full Mobile-Responsive, Seamless YouTube Stream, Community Comments & Neon PostgreSQL Sync
 */
import { api } from "../services/api.js";
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";
import { authService } from "../services/auth.js";
import { renderVideoCardHtml } from "./home.js";

export async function renderWatchPage(container, targetId) {
  // Determine video ID from param or window hash (#watch?id=14 or #watch/14)
  let videoId = targetId;
  if (!videoId) {
    const hash = window.location.hash;
    const matchParam = hash.match(/[?&]id=([^&]+)/);
    if (matchParam) {
      videoId = decodeURIComponent(matchParam[1]);
    } else {
      const matchSlash = hash.match(/^#watch\/(.+)$/);
      if (matchSlash) {
        videoId = decodeURIComponent(matchSlash[1]);
      }
    }
  }

  // Initial Loading Skeleton
  container.innerHTML = `
    <div class="section-wrapper" style="min-height:85vh; padding-top:var(--space-8);">
      <div class="container" style="max-width:1200px;">
        <div style="display:flex; align-items:center; gap:12px; margin-bottom:20px;">
          <a href="#videos" class="btn btn-secondary btn-sm" id="btn-watch-back">← Videolarga qaytish</a>
          <span class="badge" style="background:rgba(255,77,0,0.12); color:var(--accent); border:1px solid var(--accent);">DRIFTVERSE STREAM</span>
        </div>
        <div style="width:100%; aspect-ratio:16/9; background:#0e0e11; border-radius:var(--radius-sm); border:1px solid var(--border-subtle); display:flex; align-items:center; justify-content:center;">
          <div style="font-family:var(--font-mono); color:var(--accent); font-size:1rem; letter-spacing:0.1em;">
            ⚡ VIDEO STREAM YUKLANMOQDA...
          </div>
        </div>
      </div>
    </div>
  `;

  // Fetch live video data from Neon PostgreSQL
  let videoData = null;
  let commentsList = [];
  let isLiked = false;
  let likesCount = 0;

  if (videoId) {
    try {
      const res = await api.getVideoById(videoId);
      if (res && res.video) {
        videoData = res.video;
        commentsList = res.comments || [];
        likesCount = res.video.likes_count !== undefined ? res.video.likes_count : (res.video.likes || 0);
        isLiked = !!res.video.is_liked;
      }
    } catch (err) {
      console.warn("API video fetch failed, falling back to store:", err);
    }
  }

  // Fallback to client store if API returned null
  if (!videoData && videoId) {
    videoData = store.getVideoById(videoId);
    if (videoData) {
      likesCount = videoData.likes || 0;
    }
  }

  // If still no video found, try first available video from store or show 404 state
  if (!videoData) {
    const all = store.getVideos();
    if (all && all.length > 0) {
      videoData = all[0];
      videoId = videoData.id;
      likesCount = videoData.likes || 0;
    }
  }

  // If absolutely no videos in DB/store
  if (!videoData) {
    container.innerHTML = `
      <div class="section-wrapper" style="min-height:80vh; display:flex; align-items:center; justify-content:center;">
        <div class="container" style="max-width:560px; text-align:center;">
          <div style="font-size:3.5rem; margin-bottom:16px;">🎬</div>
          <h2 style="font-size:1.8rem; font-weight:800; margin-bottom:12px;">Video topilmadi</h2>
          <p style="color:var(--text-secondary); margin-bottom:24px; line-height:1.6;">
            Ushbu video o'chirilgan yoki tizimda mavjud emas. Yangi videolarni ko'rish uchun videoteqaga o'ting.
          </p>
          <a href="#videos" class="btn btn-primary" style="padding:12px 28px;">Barcha Videolar Katalogi ➔</a>
        </div>
      </div>
    `;
    return;
  }

  // Record view count
  if (videoData.id) {
    api.recordView(videoData.id);
  }

  // Extract clean YouTube embed ID
  let youtubeId = videoData.youtube_id || videoData.id;
  if (videoData.youtube_url) {
    const match = videoData.youtube_url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/);
    if (match) youtubeId = match[1];
  }

  const relatedVideos = store.getVideos().filter((v) => String(v.id) !== String(videoData.id) && v.youtube_id !== youtubeId).slice(0, 4);
  const currentUser = authService.getCurrentUser();
  const isAdmin = api.isAdmin();

  // Render Full Cinematic Watch Layout
  container.innerHTML = `
    <div class="watch-page-wrapper" style="min-height:90vh; padding:var(--space-6) 0 var(--space-16);">
      <div class="container" style="max-width:1200px;">
        
        <!-- Breadcrumbs Navigation -->
        <div class="watch-top-nav" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
          <div style="display:flex; align-items:center; gap:10px;">
            <a href="#videos" class="btn btn-secondary btn-sm" id="btn-watch-back" style="display:inline-flex; align-items:center; gap:6px;">
              <span>←</span> <span>Videolarga qaytish</span>
            </a>
            <span class="badge" style="background:rgba(255,77,0,0.12); color:var(--accent); border:1px solid var(--accent); font-size:0.7rem; font-weight:700;">
              ${videoData.category || 'Drift'}
            </span>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <span style="display:inline-flex; align-items:center; gap:6px; font-family:var(--font-mono); font-size:0.72rem; color:#00E676; background:rgba(0,230,118,0.1); border:1px solid rgba(0,230,118,0.3); padding:4px 10px; border-radius:var(--radius-xs);">
              <span style="width:6px; height:6px; border-radius:50%; background:#00E676; display:inline-block; animation:pulse 1.8s infinite;"></span>
              1080P 60FPS // NEON DB
            </span>
          </div>
        </div>

        <!-- 16:9 CINEMATIC RESPONSIVE VIDEO PLAYER FRAME -->
        <div class="watch-player-card" style="position:relative; width:100%; aspect-ratio:16/9; background:#000000; border-radius:var(--radius-sm); border:1px solid var(--border-medium); overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,0.9); margin-bottom:24px;">
          <iframe 
            id="watch-iframe"
            src="https://www.youtube.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&enablejsapi=1" 
            title="${videoData.title}"
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
            allowfullscreen
            style="position:absolute; top:0; left:0; width:100%; height:100%; border:0; display:block;"
          ></iframe>
        </div>

        <!-- VIDEO DETAILS & ACTION BAR -->
        <div class="watch-meta-grid" style="display:grid; grid-template-columns:1fr; gap:24px; margin-bottom:32px;">
          
          <div>
            <!-- Video Title -->
            <h1 class="watch-video-title" style="font-size:clamp(1.4rem, 4vw, 2.2rem); font-weight:800; line-height:1.25; margin-bottom:14px; color:var(--text-primary); word-break:break-word;">
              ${videoData.title}
            </h1>

            <!-- Meta details row -->
            <div class="watch-stats-row" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px; padding-bottom:18px; border-bottom:1px solid var(--border-subtle);">
              
              <!-- Author / Channel details -->
              <div style="display:flex; align-items:center; gap:12px;">
                <div style="width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg, var(--accent), #ff8c00); display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:1.1rem; border:2px solid var(--border-medium); flex-shrink:0;">
                  ${(videoData.channel_name || videoData.author || 'D')[0].toUpperCase()}
                </div>
                <div>
                  <div style="font-weight:700; font-size:0.95rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
                    ${videoData.channel_name || videoData.author || 'DRIFTVERSE MEDIA'}
                    <span style="color:var(--accent); font-size:0.8rem;" title="Tasdiqlangan kanal">✓</span>
                  </div>
                  <div style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">
                    <span>${(videoData.views || 0).toLocaleString()} ko'rishlar</span>
                    <span style="margin:0 6px;">•</span>
                    <span>Davomiyligi: ${videoData.duration || '05:00'}</span>
                  </div>
                </div>
              </div>

              <!-- Action Buttons Bar -->
              <div class="watch-actions-bar" style="display:flex; align-items:center; flex-wrap:wrap; gap:10px;">
                
                <!-- Like Button -->
                <button 
                  class="btn btn-sm ${isLiked ? 'btn-primary' : 'btn-secondary'}" 
                  id="btn-watch-like" 
                  style="display:inline-flex; align-items:center; gap:8px; min-height:40px; padding:6px 16px; font-weight:700;"
                >
                  <span style="font-size:1.1rem; color:${isLiked ? '#fff' : 'var(--accent)'};">${isLiked ? '❤️' : '🤍'}</span>
                  <span>Yoqdi</span>
                  <span class="badge" id="watch-likes-badge" style="background:rgba(0,0,0,0.3); color:#fff; font-size:0.75rem; padding:2px 8px;">
                    ${likesCount}
                  </span>
                </button>

                <!-- Exhaust Rev Button -->
                <button 
                  class="btn btn-secondary btn-sm" 
                  id="btn-watch-rev" 
                  style="display:inline-flex; align-items:center; gap:6px; min-height:40px; padding:6px 14px; border-color:var(--border-medium);"
                >
                  <span>💨</span>
                  <span>Dvigatel Tovushi</span>
                </button>

                <!-- Share Button -->
                <button 
                  class="btn btn-secondary btn-sm" 
                  id="btn-watch-share" 
                  style="display:inline-flex; align-items:center; gap:6px; min-height:40px; padding:6px 14px;"
                >
                  <span>🔗</span>
                  <span>Ulashish</span>
                </button>

                <!-- Admin Edit & Delete buttons if admin -->
                ${
                  isAdmin
                    ? `
                  <div style="display:inline-flex; gap:6px; margin-left:4px;">
                    <button class="btn btn-secondary btn-sm" id="btn-watch-admin-edit" style="color:var(--accent); border-color:var(--accent); min-height:40px; padding:6px 12px;">
                      ✏️ Tahrirlash
                    </button>
                    <button class="btn btn-secondary btn-sm" id="btn-watch-admin-delete" style="color:#FF453A; border-color:#FF3B30; min-height:40px; padding:6px 12px;">
                      🗑️ O'chirish
                    </button>
                  </div>
                `
                    : ""
                }

              </div>
            </div>

            <!-- Video Description Box -->
            <div class="watch-description-box" style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:18px 20px; margin-top:18px;">
              <div style="font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); text-transform:uppercase; margin-bottom:8px; letter-spacing:0.05em;">
                VIDEO TAVSIFI & TELEMETRIYA
              </div>
              <p style="font-size:0.9rem; line-height:1.65; color:var(--text-secondary); margin:0 0 14px; word-break:break-word;">
                ${videoData.description || 'DRIFTVERSE yuqori sifatli avtomobil videolavhasi. Neon PostgreSQL orqali sinxronlashtirilgan.'}
              </p>

              <!-- Tags / Car badges -->
              <div style="display:flex; flex-wrap:wrap; gap:8px; align-items:center;">
                <span class="badge" style="font-size:0.7rem;">#${videoData.category || 'Drift'}</span>
                ${
                  videoData.cars && Array.isArray(videoData.cars)
                    ? videoData.cars.map((c) => `<span class="badge" style="font-size:0.7rem; background:rgba(255,255,255,0.06); color:var(--text-primary);">🏎️ ${c}</span>`).join("")
                    : `<span class="badge" style="font-size:0.7rem; background:rgba(255,255,255,0.06); color:var(--text-primary);">🏎️ DRIFTVERSE SERIES</span>`
                }
                <span class="badge" style="font-size:0.7rem; font-family:var(--font-mono); color:var(--text-muted);">ID: ${youtubeId}</span>
              </div>
            </div>

          </div>

        </div>

        <!-- TWO COLUMN SECTION: COMMENTS & RELATED VIDEOS -->
        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:32px; margin-top:16px;">
          
          <!-- LEFT / MAIN: LIVE COMMUNITY COMMENTS -->
          <div class="watch-comments-col">
            
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
              <h3 style="font-size:1.2rem; font-weight:800; display:flex; align-items:center; gap:8px;">
                <span>💬 Muhokama & Izohlar</span>
                <span class="badge" id="watch-comments-count-badge" style="background:rgba(255,77,0,0.15); color:var(--accent); font-size:0.75rem;">
                  ${commentsList.length}
                </span>
              </h3>
            </div>

            <!-- Post New Comment Box -->
            <div style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:16px; margin-bottom:20px;">
              <form id="watch-comment-form" style="display:flex; flex-direction:column; gap:12px;">
                <textarea 
                  id="watch-comment-input" 
                  rows="3" 
                  placeholder="${currentUser ? `${currentUser.username} sifatida fikringizni bildiring...` : "Videoga fikringizni yozing..."}"
                  style="width:100%; min-height:75px; font-size:0.875rem;" 
                  required
                ></textarea>

                <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px;">
                  <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">
                    ${currentUser ? `Avtor: @${currentUser.username}` : "DRIFTVERSE HAMJAMIYATI"}
                  </span>
                  <button type="submit" class="btn btn-primary btn-sm" id="btn-submit-comment" style="padding:8px 20px; font-weight:700;">
                    Izoh qoldirish ➔
                  </button>
                </div>
              </form>
            </div>

            <!-- Comments List Stream -->
            <div id="watch-comments-mount" style="display:flex; flex-direction:column; gap:12px;">
              ${renderCommentsListHtml(commentsList, currentUser, isAdmin)}
            </div>

          </div>

          <!-- RIGHT / SIDEBAR: RELATED HIGH-OCTANE VIDEOS -->
          <div class="watch-related-col">
            <h3 style="font-size:1.15rem; font-weight:800; margin-bottom:16px; display:flex; align-items:center; gap:8px;">
              <span>🔥 Boshqa Videolar</span>
            </h3>

            <div style="display:flex; flex-direction:column; gap:16px;">
              ${
                relatedVideos.length === 0
                  ? `<div style="padding:24px; text-align:center; color:var(--text-muted); background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs);">Boshqa videolar mavjud emas</div>`
                  : relatedVideos
                      .map(
                        (v) => `
                    <div class="related-video-card" data-video-id="${v.id}" style="display:flex; gap:12px; background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); overflow:hidden; padding:8px; cursor:pointer; transition:transform 0.2s ease, border-color 0.2s ease;">
                      <div style="width:120px; aspect-ratio:16/9; position:relative; flex-shrink:0; border-radius:2px; overflow:hidden; background:#000;">
                        <img src="${v.thumbnail || 'https://img.youtube.com/vi/' + (v.youtube_id || v.id) + '/hqdefault.jpg'}" style="width:100%; height:100%; object-fit:cover;" alt="" loading="lazy" />
                        <span style="position:absolute; bottom:4px; right:4px; font-size:0.65rem; background:rgba(0,0,0,0.85); color:#fff; padding:1px 4px; border-radius:2px; font-family:var(--font-mono);">
                          ${v.duration || '05:00'}
                        </span>
                      </div>
                      <div style="flex:1; min-width:0; display:flex; flex-direction:column; justify-content:center;">
                        <span class="badge" style="font-size:0.625rem; align-self:flex-start; margin-bottom:4px;">${v.category}</span>
                        <div style="font-size:0.85rem; font-weight:700; color:var(--text-primary); line-height:1.3; overflow:hidden; text-overflow:ellipsis; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; margin-bottom:4px;">
                          ${v.title}
                        </div>
                        <div style="font-size:0.72rem; color:var(--text-muted); font-family:var(--font-mono);">
                          ${(v.views || 0).toLocaleString()} views
                        </div>
                      </div>
                    </div>
                  `
                      )
                      .join("")
              }
            </div>
          </div>

        </div>

      </div>
    </div>

    <!-- Admin Edit Video Modal Overlay (Hidden by default) -->
    <div id="watch-admin-edit-modal" style="display:none; position:fixed; inset:0; z-index:99999; background:rgba(0,0,0,0.85); backdrop-filter:blur(8px); align-items:center; justify-content:center; padding:16px;">
      <div style="width:100%; max-width:620px; background:var(--bg-card); border:1px solid var(--border-medium); border-radius:var(--radius-sm); padding:24px; box-shadow:0 24px 60px rgba(0,0,0,0.9);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
          <h3 style="font-size:1.25rem; font-weight:800; margin:0;">VIDEONI TAHRIRLASH (NEON DB)</h3>
          <button id="btn-close-edit-modal" style="background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;">✕</button>
        </div>

        <form id="watch-admin-edit-form" style="display:flex; flex-direction:column; gap:14px;">
          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">VIDEO NOMI *</label>
            <input type="text" id="edit-video-title" value="${videoData.title}" required style="width:100%;" />
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">YOUTUBE URL YOKI ID</label>
            <input type="text" id="edit-video-url" value="${videoData.youtube_url || youtubeId}" style="width:100%; font-family:var(--font-mono);" />
          </div>

          <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">KATEGORIYA</label>
              <select id="edit-video-category" style="width:100%; min-height:42px; background:rgba(255,255,255,0.04); border:1px solid var(--border-medium); color:var(--text-primary); padding:6px 10px; border-radius:var(--radius-xs);">
                <option value="Drift" ${videoData.category === 'Drift' ? 'selected' : ''}>Drift</option>
                <option value="Drag Race" ${videoData.category === 'Drag Race' ? 'selected' : ''}>Drag Race</option>
                <option value="Supercars" ${videoData.category === 'Supercars' ? 'selected' : ''}>Supercars</option>
                <option value="Track Day" ${videoData.category === 'Track Day' ? 'selected' : ''}>Track Day</option>
                <option value="Exhaust & Engine Sound" ${videoData.category === 'Exhaust & Engine Sound' ? 'selected' : ''}>Exhaust & Engine Sound</option>
                <option value="Hypercars" ${videoData.category === 'Hypercars' ? 'selected' : ''}>Hypercars</option>
                <option value="Racing" ${videoData.category === 'Racing' ? 'selected' : ''}>Racing</option>
              </select>
            </div>
            <div>
              <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">DAVOMIYLIGI (MM:SS)</label>
              <input type="text" id="edit-video-duration" value="${videoData.duration || '05:00'}" style="width:100%;" />
            </div>
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">KANAL NOMI</label>
            <input type="text" id="edit-video-channel" value="${videoData.channel_name || videoData.author || 'DRIFTVERSE'}" style="width:100%;" />
          </div>

          <div>
            <label style="display:block; font-size:0.75rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:4px;">TAVSIF (DESCRIPTION)</label>
            <textarea id="edit-video-desc" rows="3" style="width:100%;">${videoData.description || ''}</textarea>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:10px; margin-top:8px;">
            <button type="button" class="btn btn-secondary" id="btn-cancel-edit">Bekor Qilish</button>
            <button type="submit" class="btn btn-primary" id="btn-save-edit">💾 Neon DB ga Saqlash</button>
          </div>
        </form>
      </div>
    </div>
  `;

  // Attach all Interactive Events
  attachWatchEvents();

  function renderCommentsListHtml(comments, user, admin) {
    if (!comments || comments.length === 0) {
      return `
        <div style="text-align:center; padding:2rem 1rem; color:var(--text-muted); background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); font-size:0.85rem;">
          Birinchi bo'lib fikr bildiring va avtomobil ishqibozlari bilan muhokama qiling!
        </div>
      `;
    }

    return comments
      .map((c) => {
        const canDelete = admin || (user && user.id === c.user_id);
        const dateStr = c.created_at ? new Date(c.created_at).toLocaleDateString() : "Hozirgina";
        return `
          <div class="watch-comment-card" data-comment-id="${c.id}" style="background:var(--bg-card); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:14px 16px;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
              <div style="display:flex; align-items:center; gap:10px;">
                <img src="${c.user_avatar || 'https://api.dicebear.com/7.x/bottts/svg?seed=' + encodeURIComponent(c.user_name || 'Driver')}" style="width:34px; height:34px; border-radius:50%; border:1px solid var(--border-subtle); object-fit:cover;" alt="" />
                <div>
                  <div style="font-weight:700; font-size:0.875rem; color:var(--text-primary); display:flex; align-items:center; gap:6px;">
                    ${c.user_name}
                    ${c.user_role === 'admin' ? '<span class="badge" style="font-size:0.6rem; background:rgba(255,77,0,0.15); color:var(--accent);">ADMIN</span>' : ''}
                  </div>
                  <div style="font-size:0.7rem; color:var(--text-muted); font-family:var(--font-mono);">${dateStr}</div>
                </div>
              </div>
              ${
                canDelete
                  ? `
                <button class="btn-del-comment" data-comment-id="${c.id}" style="background:none; border:none; color:#FF453A; font-size:0.75rem; cursor:pointer; padding:4px;">
                  ✕ O'chirish
                </button>
              `
                  : ""
              }
            </div>
            <p style="font-size:0.875rem; color:var(--text-secondary); line-height:1.5; margin:0; word-break:break-word;">
              ${c.content}
            </p>
          </div>
        `;
      })
      .join("");
  }

  function attachWatchEvents() {
    // Like button toggle
    const likeBtn = container.querySelector("#btn-watch-like");
    const likesBadge = container.querySelector("#watch-likes-badge");
    if (likeBtn) {
      likeBtn.addEventListener("click", async () => {
        soundEngine.playClick();
        if (!authService.isAuthenticated()) {
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Like qo'yish uchun tizimga kiring!" }
          }));
          window.dispatchEvent(new CustomEvent("driftverse:open-auth-modal"));
          return;
        }

        try {
          const res = await api.toggleLikeVideo(videoData.id);
          isLiked = res.is_liked;
          likesCount = res.likes_count;
          if (likesBadge) likesBadge.textContent = likesCount;
          likeBtn.className = `btn btn-sm ${isLiked ? 'btn-primary' : 'btn-secondary'}`;
          likeBtn.querySelector("span").textContent = isLiked ? "❤️" : "🤍";
          likeBtn.querySelector("span").style.color = isLiked ? "#fff" : "var(--accent)";
          soundEngine.playRev("turbo-v6");
        } catch (err) {
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: err.message || "Like qo'yishda xatolik" }
          }));
        }
      });
    }

    // Exhaust Rev button
    const revBtn = container.querySelector("#btn-watch-rev");
    if (revBtn) {
      revBtn.addEventListener("click", () => {
        soundEngine.playRev("v12-roar");
        window.dispatchEvent(new CustomEvent("driftverse:toast", {
          detail: { message: "🏎️ 9,000 RPM Dvigatel Tovushi Revv!" }
        }));
      });
    }

    // Share button
    const shareBtn = container.querySelector("#btn-watch-share");
    if (shareBtn) {
      shareBtn.addEventListener("click", async () => {
        soundEngine.playClick();
        const shareUrl = `${window.location.origin}${window.location.pathname}#watch?id=${videoData.id}`;
        try {
          if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareUrl);
          }
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Video havolasi buferga nusxalandi!" }
          }));
        } catch {
          prompt("Video havolasini nusxalang:", shareUrl);
        }
      });
    }

    // Related video click navigates to that video
    container.querySelectorAll(".related-video-card").forEach((card) => {
      card.addEventListener("click", () => {
        soundEngine.playClick();
        const nextId = card.getAttribute("data-video-id");
        window.location.hash = `#watch?id=${nextId}`;
        window.scrollTo({ top: 0, behavior: "smooth" });
        renderWatchPage(container, nextId);
      });
    });

    // Comment Form Submit
    const commentForm = container.querySelector("#watch-comment-form");
    if (commentForm) {
      commentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const input = container.querySelector("#watch-comment-input");
        const submitBtn = container.querySelector("#btn-submit-comment");
        const text = input ? input.value.trim() : "";
        if (!text) return;

        if (!authService.isAuthenticated()) {
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Izoh qoldirish uchun tizimga kiring!" }
          }));
          window.dispatchEvent(new CustomEvent("driftverse:open-auth-modal"));
          return;
        }

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Yuborilmoqda...";
        }

        try {
          const res = await api.addComment(videoData.id, text);
          soundEngine.playClick();
          if (input) input.value = "";
          if (res.comment) {
            commentsList.unshift(res.comment);
          }
          const mount = container.querySelector("#watch-comments-mount");
          if (mount) mount.innerHTML = renderCommentsListHtml(commentsList, authService.getCurrentUser(), api.isAdmin());
          const badge = container.querySelector("#watch-comments-count-badge");
          if (badge) badge.textContent = commentsList.length;
          attachCommentDeleteEvents();
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Izohingiz muvaffaqiyatli qoldirildi!" }
          }));
        } catch (err) {
          alert(err.message || "Izoh qoldirishda xato");
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "Izoh qoldirish ➔";
          }
        }
      });
    }

    attachCommentDeleteEvents();

    function attachCommentDeleteEvents() {
      container.querySelectorAll(".btn-del-comment").forEach((btn) => {
        btn.addEventListener("click", async () => {
          const cId = btn.getAttribute("data-comment-id");
          if (!confirm("Haqiqatan ham ushbu izohni o'chirmoqchimisiz?")) return;
          try {
            await api.deleteComment(cId);
            soundEngine.playClick();
            commentsList = commentsList.filter((c) => String(c.id) !== String(cId));
            const mount = container.querySelector("#watch-comments-mount");
            if (mount) mount.innerHTML = renderCommentsListHtml(commentsList, authService.getCurrentUser(), api.isAdmin());
            const badge = container.querySelector("#watch-comments-count-badge");
            if (badge) badge.textContent = commentsList.length;
            attachCommentDeleteEvents();
          } catch (err) {
            alert(err.message || "O'chirishda xatolik");
          }
        });
      });
    }

    // Admin Delete Video
    const adminDelBtn = container.querySelector("#btn-watch-admin-delete");
    if (adminDelBtn) {
      adminDelBtn.addEventListener("click", async () => {
        if (!confirm("Haqiqatan ham ushbu videoni Neon DB dan BUTUNLAY o'chirmoqchimisiz?")) return;
        try {
          await api.deleteVideo(videoData.id);
          store.deleteVideo(videoData.id);
          soundEngine.playClick();
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Video Neon DB dan butunlay o'chirildi!" }
          }));
          window.location.hash = "#videos";
        } catch (err) {
          alert(err.message || "Videoni o'chirishda xatolik");
        }
      });
    }

    // Admin Edit Video
    const adminEditBtn = container.querySelector("#btn-watch-admin-edit");
    const editModal = container.querySelector("#watch-admin-edit-modal");
    const closeEditBtn = container.querySelector("#btn-close-edit-modal");
    const cancelEditBtn = container.querySelector("#btn-cancel-edit");
    const editForm = container.querySelector("#watch-admin-edit-form");

    if (adminEditBtn && editModal) {
      adminEditBtn.addEventListener("click", () => {
        soundEngine.playClick();
        editModal.style.display = "flex";
      });

      const hideModal = () => {
        editModal.style.display = "none";
      };

      if (closeEditBtn) closeEditBtn.addEventListener("click", hideModal);
      if (cancelEditBtn) cancelEditBtn.addEventListener("click", hideModal);

      if (editForm) {
        editForm.addEventListener("submit", async (e) => {
          e.preventDefault();
          const saveBtn = container.querySelector("#btn-save-edit");
          const title = container.querySelector("#edit-video-title").value.trim();
          const url = container.querySelector("#edit-video-url").value.trim();
          const category = container.querySelector("#edit-video-category").value;
          const duration = container.querySelector("#edit-video-duration").value.trim();
          const channel_name = container.querySelector("#edit-video-channel").value.trim();
          const description = container.querySelector("#edit-video-desc").value.trim();

          if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.textContent = "Neon DB ga saqlanmoqda...";
          }

          try {
            const res = await api.updateVideo(videoData.id, {
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

            // Sync with local store
            if (res.video) {
              store.updateVideo(videoData.id, res.video);
            }

            hideModal();
            // Re-render watch page with fresh data
            renderWatchPage(container, videoData.id);
          } catch (err) {
            alert(err.message || "Tahrirlashda xatolik");
            if (saveBtn) {
              saveBtn.disabled = false;
              saveBtn.textContent = "💾 Neon DB ga Saqlash";
            }
          }
        });
      }
    }
  }
}
