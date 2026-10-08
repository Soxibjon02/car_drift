/**
 * DRIFTVERSE - Custom Automotive Video Player & Community Modal
 * Contained YouTube Playback (No External YouTube Redirects)
 * Connected to Neon PostgreSQL (Likes, Comments & Telemetry)
 */
import { api } from "../services/api.js";
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";
import { authService } from "../services/auth.js";

// Ensure YouTube IFrame API script is injected once
if (typeof window !== "undefined" && !window.YT) {
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  if (firstScriptTag && firstScriptTag.parentNode) {
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  } else {
    document.head.appendChild(tag);
  }
}

export class VideoPlayerModal {
  constructor() {
    this.container = null;
    this.currentVideo = null;
    this.comments = [];
    this.likesCount = 0;
    this.isLiked = false;
    this.isPlaying = false;
    this.progress = 0;
    this.ytPlayer = null;
    this.pollInterval = null;
    this.volume = 80;
    this.isMuted = false;
    this.init();
  }

  init() {
    this.container = document.createElement("div");
    this.container.id = "video-watch-modal";
    this.container.style.display = "none";
    document.body.appendChild(this.container);

    window.addEventListener("driftverse:watch-video", (e) => {
      if (e.detail && e.detail.videoId) {
        this.open(e.detail.videoId);
      }
    });
  }

  async open(videoId) {
    this.container.style.display = "block";
    document.body.style.overflow = "hidden";

    // Show initial loading shell
    this.renderLoading();

    try {
      // Fetch fresh video and comments from Neon PostgreSQL
      const data = await api.getVideoById(videoId).catch(() => null);
      if (data && data.video) {
        this.currentVideo = data.video;
        this.comments = data.comments || [];
        this.likesCount = data.video.likes_count || data.video.likes || 0;
        this.isLiked = data.video.is_liked || false;
      } else {
        // Fallback to store
        const fallback = store.getVideoById(videoId);
        if (!fallback) {
          this.close();
          return;
        }
        this.currentVideo = fallback;
        this.comments = store.getVideoComments ? store.getVideoComments(videoId) : [];
        this.likesCount = fallback.likes || 0;
        this.isLiked = store.isVideoLiked ? store.isVideoLiked(videoId) : false;
      }

      this.render();
      this.initYouTubePlayer();
      api.recordView(this.currentVideo.id);
    } catch (err) {
      console.error("Failed to load video data:", err);
    }
  }

  close() {
    this.stopPlaybackPolling();
    if (this.ytPlayer && typeof this.ytPlayer.destroy === "function") {
      try {
        this.ytPlayer.destroy();
      } catch {}
      this.ytPlayer = null;
    }
    this.isPlaying = false;
    this.container.style.display = "none";
    this.container.innerHTML = "";
    document.body.style.overflow = "";
  }

  renderLoading() {
    this.container.innerHTML = `
      <div class="modal-overlay" id="video-modal-backdrop">
        <div class="modal-dialog" style="max-width:1050px; padding:3rem; text-align:center; background:var(--bg-card); border:1px solid var(--border-medium); border-radius:var(--radius-sm);">
          <div style="font-family:var(--font-mono); color:var(--accent); font-size:1.1rem; margin-bottom:12px;">
            INITIALIZING SECURE VIDEO TELEMETRY...
          </div>
          <div style="color:var(--text-secondary); font-size:0.85rem;">Connecting to Neon PostgreSQL & Stream Engine...</div>
        </div>
      </div>
    `;
  }

  initYouTubePlayer() {
    const vid = this.currentVideo;
    if (!vid) return;

    // Helper: Initialize YT Player instance
    const setupPlayer = () => {
      const containerEl = document.getElementById("yt-player-mount");
      if (!containerEl) return;

      if (window.YT && window.YT.Player) {
        this.ytPlayer = new window.YT.Player("yt-player-mount", {
          videoId: vid.youtube_id || vid.id,
          playerVars: {
            autoplay: 1,
            controls: 0,           // ZERO native controls — No YouTube bars or logos!
            modestbranding: 1,
            rel: 0,
            iv_load_policy: 3,     // No annotations or external link cards
            disablekb: 1,          // Disable keyboard hotkeys that open YouTube
            fs: 0,                 // Custom DRIFTVERSE fullscreen only
            playsinline: 1,
            origin: window.location.origin
          },
          events: {
            onReady: (event) => {
              this.isPlaying = true;
              event.target.playVideo();
              event.target.setVolume(this.volume);
              this.startPlaybackPolling();
              this.updateControlsState();
            },
            onStateChange: (event) => {
              // 1 = PLAYING, 2 = PAUSED, 0 = ENDED
              if (event.data === window.YT.PlayerState.PLAYING) {
                this.isPlaying = true;
              } else if (event.data === window.YT.PlayerState.PAUSED) {
                this.isPlaying = false;
              } else if (event.data === window.YT.PlayerState.ENDED) {
                this.isPlaying = false;
                this.progress = 100;
              }
              this.updateControlsState();
            }
          }
        });
      } else {
        // Fallback: If YT API not ready yet, wait and retry
        setTimeout(setupPlayer, 200);
      }
    };

    setupPlayer();
  }

  startPlaybackPolling() {
    this.stopPlaybackPolling();
    this.pollInterval = setInterval(() => {
      if (this.ytPlayer && typeof this.ytPlayer.getCurrentTime === "function") {
        const currentTime = this.ytPlayer.getCurrentTime() || 0;
        const duration = this.ytPlayer.getDuration() || 1;
        this.progress = (currentTime / duration) * 100;

        const fill = document.getElementById("custom-player-progress-fill");
        const timeEl = document.getElementById("custom-player-timecode");
        if (fill) fill.style.width = `${Math.min(100, this.progress)}%`;

        if (timeEl) {
          const curMin = Math.floor(currentTime / 60);
          const curSec = Math.floor(currentTime % 60);
          const durMin = Math.floor(duration / 60);
          const durSec = Math.floor(duration % 60);
          timeEl.textContent = `${curMin.toString().padStart(2, "0")}:${curSec.toString().padStart(2, "0")} / ${durMin.toString().padStart(2, "0")}:${durSec.toString().padStart(2, "0")}`;
        }
      }
    }, 400);
  }

  stopPlaybackPolling() {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  togglePlayPause() {
    if (!this.ytPlayer) return;
    soundEngine.playClick();
    if (this.isPlaying) {
      if (typeof this.ytPlayer.pauseVideo === "function") this.ytPlayer.pauseVideo();
      this.isPlaying = false;
    } else {
      if (typeof this.ytPlayer.playVideo === "function") this.ytPlayer.playVideo();
      this.isPlaying = true;
    }
    this.updateControlsState();
    this.showCenterPulse(this.isPlaying ? "▶" : "❚❚");
  }

  showCenterPulse(icon) {
    const badge = document.getElementById("player-center-play-badge");
    if (badge) {
      badge.textContent = icon;
      badge.style.opacity = "1";
      badge.style.transform = "translate(-50%, -50%) scale(1.15)";
      setTimeout(() => {
        badge.style.opacity = "0";
        badge.style.transform = "translate(-50%, -50%) scale(0.9)";
      }, 500);
    }
  }

  updateControlsState() {
    const playBtn = document.getElementById("player-btn-play-pause");
    if (playBtn) {
      playBtn.innerHTML = this.isPlaying
        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    }
  }

  render() {
    if (!this.currentVideo) return;
    const vid = this.currentVideo;
    const relatedVids = store.getVideos().filter((v) => v.id !== vid.id).slice(0, 4);
    const currentUser = authService.getCurrentUser();

    this.container.innerHTML = `
      <div class="modal-overlay" id="video-modal-backdrop">
        <div class="modal-dialog" id="video-player-modal-dialog" style="max-width:1080px; padding:0; background:var(--bg-card); border:1px solid var(--border-medium); border-radius:var(--radius-sm); overflow:hidden; box-shadow:0 24px 60px rgba(0,0,0,0.85); backdrop-filter:blur(20px);">
          
          <!-- Top Title Bar -->
          <div style="display:flex; justify-content:space-between; align-items:center; padding:12px 20px; background:rgba(10,10,12,0.95); border-bottom:1px solid var(--border-subtle);">
            <div style="display:flex; align-items:center; gap:10px;">
              <span class="badge" style="background:var(--accent); color:#fff; font-size:0.68rem; font-weight:700;">DRIFTVERSE STREAM</span>
              <span style="font-family:var(--font-heading); font-size:0.9rem; font-weight:700; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:600px;">
                ${vid.title}
              </span>
            </div>
            <button class="modal-close-btn" id="video-modal-close" style="position:static; width:32px; height:32px; border-radius:var(--radius-xs); background:rgba(255,255,255,0.06);">✕</button>
          </div>

          <!-- VIDEO PLAYER FRAME & SHIELD LAYER -->
          <div id="player-screen-wrapper" style="position:relative; width:100%; aspect-ratio:16/9; background:#000000; overflow:hidden;">
            
            <!-- YouTube Iframe Mount Point -->
            <div id="yt-player-mount" style="position:absolute; inset:0; width:100%; height:100%; pointer-events:none;"></div>

            <!-- IMPENETRABLE CLICK SHIELD (Blocks all external YouTube clicks & links) -->
            <!-- 1. Top Bar Shield (Blocks title link) -->
            <div style="position:absolute; top:0; left:0; width:100%; height:70px; z-index:15; cursor:pointer;" id="yt-shield-top"></div>
            <!-- 2. Bottom Right Shield (Blocks watermark logo) -->
            <div style="position:absolute; bottom:0; right:0; width:140px; height:60px; z-index:15; cursor:pointer;" id="yt-shield-bottom-right"></div>
            <!-- 3. Fullscreen Center Click Handler for Play / Pause -->
            <div id="player-shield-overlay" style="position:absolute; inset:0; z-index:12; cursor:pointer;" title="Bosing: Play / Pause"></div>

            <!-- Center Pulse Badge -->
            <div id="player-center-play-badge" style="position:absolute; top:50%; left:50%; transform:translate(-50%, -50%) scale(0.9); width:72px; height:72px; border-radius:50%; background:rgba(0,0,0,0.75); border:2px solid var(--accent); color:#fff; display:flex; align-items:center; justify-content:center; font-size:2rem; pointer-events:none; z-index:16; opacity:0; transition:all 0.3s ease;">
              ▶
            </div>

            <!-- Top Left Telemetry Watermark -->
            <div style="position:absolute; top:16px; left:20px; font-family:var(--font-mono); font-size:0.7rem; color:#fff; background:rgba(10,10,12,0.75); padding:4px 10px; border-left:3px solid var(--accent); border-radius:var(--radius-xs); letter-spacing:0.1em; z-index:14; pointer-events:none;">
              LIVE TELEMETRY // 1080P 60FPS
            </div>

            <!-- CUSTOM DRIFTVERSE PLAYER CONTROLS HUD -->
            <div id="custom-player-controls" style="position:absolute; bottom:0; left:0; width:100%; background:linear-gradient(transparent, rgba(10,10,12,0.95) 70%); padding:16px 20px 12px; display:flex; flex-direction:column; gap:10px; z-index:20;">
              
              <!-- Interactive High-Octane Scrubber -->
              <div id="custom-player-progress-bar" style="position:relative; width:100%; height:6px; background:rgba(255,255,255,0.2); border-radius:3px; cursor:pointer;">
                <div id="custom-player-progress-fill" style="position:absolute; top:0; left:0; height:100%; width:${this.progress}%; background:var(--accent); border-radius:3px; transition:width 0.1s linear;"></div>
              </div>

              <!-- Controls Row -->
              <div style="display:flex; align-items:center; justify-content:space-between; color:#fff;">
                <div style="display:flex; align-items:center; gap:16px;">
                  <button id="player-btn-play-pause" style="background:transparent; border:none; color:#fff; cursor:pointer; display:flex; align-items:center; justify-content:center; padding:4px;">
                    ${
                      this.isPlaying
                        ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`
                        : `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`
                    }
                  </button>

                  <button id="player-btn-rev" title="Exhaust Sound Flutter" style="background:rgba(255,77,0,0.12); border:1px solid var(--accent); color:var(--accent); font-family:var(--font-mono); font-size:0.7rem; font-weight:700; padding:3px 10px; border-radius:var(--radius-xs); cursor:pointer;">
                    EXHAUST REV 💨
                  </button>

                  <span id="custom-player-timecode" style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary);">
                    00:00 / ${vid.duration || "05:00"}
                  </span>
                </div>

                <!-- Right Controls: Volume, Speed & Fullscreen -->
                <div style="display:flex; align-items:center; gap:14px;">
                  <!-- Volume Control -->
                  <div style="display:flex; align-items:center; gap:8px;">
                    <button id="player-btn-mute" style="background:transparent; border:none; color:#fff; cursor:pointer; font-size:0.9rem;">
                      ${this.isMuted ? "🔇" : "🔊"}
                    </button>
                    <input type="range" id="player-volume-slider" min="0" max="100" value="${this.volume}" style="width:70px; height:4px; accent-color:var(--accent); cursor:pointer;" />
                  </div>

                  <!-- Speed Selector -->
                  <select id="player-speed-select" style="background:rgba(255,255,255,0.08); border:1px solid var(--border-subtle); color:#fff; font-family:var(--font-mono); font-size:0.72rem; padding:2px 6px; border-radius:var(--radius-xs); cursor:pointer;">
                    <option value="0.75">0.75x</option>
                    <option value="1" selected>1.0x</option>
                    <option value="1.25">1.25x</option>
                    <option value="1.5">1.5x</option>
                  </select>

                  <!-- Fullscreen Button -->
                  <button id="player-btn-fullscreen" title="Fullscreen" style="background:transparent; border:none; color:#fff; cursor:pointer; font-size:1.1rem; padding:2px;">
                    ⛶
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- BOTTOM SECTION: INFO, LIKES & REAL-TIME COMMENTS -->
          <div style="padding:1.75rem 2rem; max-height:450px; overflow-y:auto; background:var(--bg-card);">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px; margin-bottom:18px; border-bottom:1px solid var(--border-subtle); padding-bottom:16px;">
              <div style="flex:1; min-width:280px;">
                <div style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                  <span class="badge" style="background:rgba(255,77,0,0.1); color:var(--accent);">${vid.category}</span>
                  <span style="font-size:0.75rem; color:var(--text-muted); font-family:var(--font-mono);">
                    ID: ${vid.youtube_id || vid.id}
                  </span>
                </div>
                <h2 style="font-size:1.35rem; font-weight:800; color:var(--text-primary); line-height:1.3; margin-bottom:8px;">
                  ${vid.title}
                </h2>
                <div style="font-size:0.8rem; color:var(--text-secondary); display:flex; gap:12px; align-items:center; flex-wrap:wrap;">
                  <span>👁️ ${(vid.views || 0).toLocaleString()} ko'rishlar</span>
                  <span>•</span>
                  <span>Kanal: <strong>${vid.channel_name || "DRIFTVERSE"}</strong></span>
                  <span>•</span>
                  <span>Davomiyligi: <strong>${vid.duration || "05:00"}</strong></span>
                </div>
              </div>

              <!-- Like Button with Live Neon DB counter -->
              <div style="display:flex; gap:10px; align-items:center;">
                <button class="btn ${this.isLiked ? 'btn-primary' : 'btn-secondary'}" id="player-btn-like" style="display:flex; align-items:center; gap:8px; font-weight:700;">
                  <span id="player-like-icon">${this.isLiked ? '❤️' : '🤍'}</span>
                  <span id="player-like-text">${this.isLiked ? 'Yoqdi' : 'Like'}</span>
                  <span class="badge" id="player-like-counter" style="background:rgba(255,255,255,0.15); margin-left:4px;">${this.likesCount}</span>
                </button>
              </div>
            </div>

            <!-- Description -->
            <p style="font-size:0.875rem; line-height:1.6; margin-bottom:24px; color:var(--text-secondary); background:rgba(255,255,255,0.02); padding:14px; border-radius:var(--radius-xs); border:1px solid var(--border-subtle);">
              ${vid.description || "DRIFTVERSE rasmiy yuqori sifatli avtomobil kadrlari."}
            </p>

            <!-- Dual Columns: Real Neon DB Comments & Related Videos -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:24px;">
              
              <!-- COMMENTS SECTION -->
              <div>
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                  <div class="section-tag" style="margin-bottom:0;">MUHOKAMA & IZOHLAR (<span id="comments-count-badge">${this.comments.length}</span>)</div>
                  ${!currentUser ? `<span style="font-size:0.72rem; color:var(--accent);">Izoh yozish uchun kiring</span>` : ''}
                </div>

                <!-- Add Comment Form -->
                <form id="player-comment-form" style="display:flex; gap:8px; margin-bottom:16px;">
                  <input 
                    type="text" 
                    id="player-comment-input" 
                    placeholder="${currentUser ? 'Fikringizni bildiring...' : 'Izoh qoldirish uchun tizimga kiring...'}" 
                    style="flex:1; min-height:42px; font-size:0.85rem;" 
                  />
                  <button type="submit" class="btn btn-primary" id="player-comment-submit" style="min-height:42px; padding:0 16px;">
                    Yuborish
                  </button>
                </form>

                <!-- Comments List Container -->
                <div id="player-comments-list" style="display:flex; flex-direction:column; gap:10px;">
                  ${
                    this.comments.length === 0
                      ? `<div style="font-size:0.8rem; color:var(--text-muted); padding:12px; text-align:center;">Hali hech kim fikr bildirmadi. Birinchi bo'lib fikr qoldiring!</div>`
                      : this.comments
                          .map((c) => this.renderCommentItem(c, currentUser))
                          .join("")
                  }
                </div>
              </div>

              <!-- RELATED RUNS COLUMN -->
              <div>
                <div class="section-tag" style="margin-bottom:12px;">TAVSIYA ETILGAN VIDEOLAR</div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                  ${relatedVids
                    .map(
                      (rv) => `
                    <div class="modal-rel-vid-row" data-video-id="${rv.id}" style="display:flex; gap:12px; cursor:pointer; padding:8px; background:rgba(255,255,255,0.02); border-radius:var(--radius-xs); border:1px solid var(--border-subtle); transition:all 0.15s ease;">
                      <img src="${rv.thumbnail}" style="width:96px; height:60px; object-fit:cover; border-radius:var(--radius-xs);" alt="" />
                      <div style="flex:1; overflow:hidden;">
                        <div style="font-weight:700; font-size:0.825rem; color:var(--text-primary); white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:4px;">${rv.title}</div>
                        <div style="font-size:0.72rem; color:var(--accent); font-family:var(--font-mono); margin-bottom:2px;">${rv.category}</div>
                        <div style="font-size:0.7rem; color:var(--text-muted);">${(rv.views || 0).toLocaleString()} views</div>
                      </div>
                    </div>
                  `
                    )
                    .join("")}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  renderCommentItem(c, currentUser) {
    const isOwner = currentUser && (currentUser.id === c.user_id || currentUser.role === "admin");
    const avatar = c.user_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(c.user_name || "driver")}`;
    const dateFormatted = c.created_at ? new Date(c.created_at).toLocaleDateString() : "Hozirgina";

    return `
      <div class="comment-item" id="comment-row-${c.id}" style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:10px 14px; border-radius:var(--radius-xs);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
          <div style="display:flex; align-items:center; gap:8px;">
            <img src="${avatar}" style="width:24px; height:24px; border-radius:50%; object-fit:cover;" alt="" />
            <span style="font-size:0.825rem; font-weight:700; color:var(--text-primary);">${c.user_name}</span>
            ${c.user_role === 'admin' ? '<span class="badge" style="background:var(--accent); color:#fff; font-size:0.6rem; padding:1px 4px;">ADMIN</span>' : ''}
          </div>
          <div style="display:flex; align-items:center; gap:8px;">
            <span style="font-size:0.68rem; color:var(--text-muted); font-family:var(--font-mono);">${dateFormatted}</span>
            ${
              isOwner
                ? `<button class="btn-delete-comment" data-comment-id="${c.id}" style="background:transparent; border:none; color:#FF453A; font-size:0.75rem; cursor:pointer;" title="O'chirish">✕</button>`
                : ""
            }
          </div>
        </div>
        <div style="font-size:0.85rem; color:var(--text-secondary); line-height:1.45; word-break:break-word;">
          ${c.content}
        </div>
      </div>
    `;
  }

  attachEvents() {
    const backdrop = this.container.querySelector("#video-modal-backdrop");
    const closeBtn = this.container.querySelector("#video-modal-close");

    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    // Shield click: Toggles play/pause without allowing clicks to reach YouTube
    const shield = this.container.querySelector("#player-shield-overlay");
    const topShield = this.container.querySelector("#yt-shield-top");
    const brShield = this.container.querySelector("#yt-shield-bottom-right");

    [shield, topShield, brShield].forEach((el) => {
      if (el) {
        el.addEventListener("click", (e) => {
          e.stopPropagation();
          this.togglePlayPause();
        });
      }
    });

    // Play/Pause button
    const playPauseBtn = this.container.querySelector("#player-btn-play-pause");
    if (playPauseBtn) {
      playPauseBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        this.togglePlayPause();
      });
    }

    // Exhaust Rev button
    const revBtn = this.container.querySelector("#player-btn-rev");
    if (revBtn) {
      revBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        soundEngine.playRev("turbo-v6");
        window.dispatchEvent(new CustomEvent("driftverse:toast", {
          detail: { message: "💨 Turbo Anti-Lag Spool Engaged!" }
        }));
      });
    }

    // Scrubber click/seek
    const progressBar = this.container.querySelector("#custom-player-progress-bar");
    if (progressBar) {
      progressBar.addEventListener("click", (e) => {
        e.stopPropagation();
        if (!this.ytPlayer || typeof this.ytPlayer.getDuration !== "function") return;
        const rect = progressBar.getBoundingClientRect();
        const clickRatio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const duration = this.ytPlayer.getDuration();
        const targetTime = clickRatio * duration;
        this.ytPlayer.seekTo(targetTime, true);
        this.progress = clickRatio * 100;
        const fill = this.container.querySelector("#custom-player-progress-fill");
        if (fill) fill.style.width = `${this.progress}%`;
      });
    }

    // Volume Slider & Mute
    const volSlider = this.container.querySelector("#player-volume-slider");
    const muteBtn = this.container.querySelector("#player-btn-mute");

    if (volSlider) {
      volSlider.addEventListener("input", (e) => {
        this.volume = parseInt(e.target.value);
        if (this.ytPlayer && typeof this.ytPlayer.setVolume === "function") {
          this.ytPlayer.setVolume(this.volume);
          if (this.isMuted && this.volume > 0) {
            this.ytPlayer.unMute();
            this.isMuted = false;
            if (muteBtn) muteBtn.textContent = "🔊";
          }
        }
      });
    }

    if (muteBtn) {
      muteBtn.addEventListener("click", () => {
        if (!this.ytPlayer) return;
        if (this.isMuted) {
          this.ytPlayer.unMute();
          this.isMuted = false;
          muteBtn.textContent = "🔊";
        } else {
          this.ytPlayer.mute();
          this.isMuted = true;
          muteBtn.textContent = "🔇";
        }
      });
    }

    // Playback Speed Selector
    const speedSelect = this.container.querySelector("#player-speed-select");
    if (speedSelect) {
      speedSelect.addEventListener("change", (e) => {
        const rate = parseFloat(e.target.value);
        if (this.ytPlayer && typeof this.ytPlayer.setPlaybackRate === "function") {
          this.ytPlayer.setPlaybackRate(rate);
        }
      });
    }

    // Fullscreen Toggle
    const fsBtn = this.container.querySelector("#player-btn-fullscreen");
    const modalDialog = this.container.querySelector("#video-player-modal-dialog");
    if (fsBtn && modalDialog) {
      fsBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) {
          modalDialog.requestFullscreen().catch(() => {});
        } else {
          document.exitFullscreen().catch(() => {});
        }
      });
    }

    // LIKE BUTTON (Live Neon DB)
    const likeBtn = this.container.querySelector("#player-btn-like");
    if (likeBtn) {
      likeBtn.addEventListener("click", async () => {
        soundEngine.playClick();
        if (!authService.isAuthenticated()) {
          window.dispatchEvent(new CustomEvent("driftverse:open-auth", {
            detail: { mode: "login", message: "Videoni yoqtirish (Like) uchun tizimga kiring!" }
          }));
          return;
        }

        try {
          const res = await api.toggleLikeVideo(this.currentVideo.id);
          this.isLiked = res.is_liked;
          this.likesCount = res.likes_count;

          const icon = this.container.querySelector("#player-like-icon");
          const text = this.container.querySelector("#player-like-text");
          const counter = this.container.querySelector("#player-like-counter");

          if (icon) icon.textContent = this.isLiked ? "❤️" : "🤍";
          if (text) text.textContent = this.isLiked ? "Yoqdi" : "Like";
          if (counter) counter.textContent = this.likesCount;

          if (this.isLiked) {
            likeBtn.className = "btn btn-primary";
            soundEngine.playRev("v8-drift");
          } else {
            likeBtn.className = "btn btn-secondary";
          }
        } catch (err) {
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: err.message || "Like bosishda xatolik" }
          }));
        }
      });
    }

    // COMMENT FORM (Live Neon DB)
    const commentForm = this.container.querySelector("#player-comment-form");
    const commentInput = this.container.querySelector("#player-comment-input");

    if (commentForm && commentInput) {
      // Focus click if not authenticated
      commentInput.addEventListener("focus", () => {
        if (!authService.isAuthenticated()) {
          commentInput.blur();
          window.dispatchEvent(new CustomEvent("driftverse:open-auth", {
            detail: { mode: "login", message: "Muhokamada qatnashish va fikr bildirish uchun tizimga kiring!" }
          }));
        }
      });

      commentForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const content = commentInput.value.trim();
        if (!content) return;

        if (!authService.isAuthenticated()) {
          window.dispatchEvent(new CustomEvent("driftverse:open-auth", {
            detail: { mode: "login", message: "Fikr qoldirish uchun tizimga kiring!" }
          }));
          return;
        }

        const submitBtn = this.container.querySelector("#player-comment-submit");
        if (submitBtn) submitBtn.disabled = true;

        try {
          const res = await api.addComment(this.currentVideo.id, content);
          commentInput.value = "";
          this.comments.unshift(res.comment);

          // Update comments list
          const list = this.container.querySelector("#player-comments-list");
          const countBadge = this.container.querySelector("#comments-count-badge");
          if (countBadge) countBadge.textContent = this.comments.length;

          if (list) {
            const newCommentHtml = this.renderCommentItem(res.comment, authService.getCurrentUser());
            list.insertAdjacentHTML("afterbegin", newCommentHtml);
            this.bindDeleteCommentEvents();
          }

          soundEngine.playClick();
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: "Izohingiz muvaffaqiyatli saqlandi!" }
          }));
        } catch (err) {
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: err.message || "Izoh yozishda xato" }
          }));
        } finally {
          if (submitBtn) submitBtn.disabled = false;
        }
      });
    }

    this.bindDeleteCommentEvents();

    // Related videos click
    const relRows = this.container.querySelectorAll(".modal-rel-vid-row");
    relRows.forEach((row) => {
      row.addEventListener("click", () => {
        const vidId = row.getAttribute("data-video-id");
        if (vidId) {
          this.close();
          setTimeout(() => this.open(vidId), 150);
        }
      });
    });
  }

  bindDeleteCommentEvents() {
    const deleteBtns = this.container.querySelectorAll(".btn-delete-comment");
    deleteBtns.forEach((btn) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const commentId = btn.getAttribute("data-comment-id");
        if (!commentId) return;

        try {
          await api.deleteComment(commentId);
          this.comments = this.comments.filter((c) => c.id != commentId);
          const row = document.getElementById(`comment-row-${commentId}`);
          if (row) row.remove();
          const countBadge = this.container.querySelector("#comments-count-badge");
          if (countBadge) countBadge.textContent = this.comments.length;
          soundEngine.playClick();
        } catch (err) {
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: err.message || "O'chirishda xatolik" }
          }));
        }
      };
    });
  }
}
