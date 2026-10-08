/**
 * DRIFTVERSE - Custom Automotive Video Player & Watch Modal (Editorial Redesign)
 * Clean player controls, scrubber, comments, and linked car specifications
 */
import { store } from "../services/store.js";
import { soundEngine } from "../services/audio.js";
import { authService } from "../services/auth.js";

export class VideoPlayerModal {
  constructor() {
    this.container = null;
    this.currentVideo = null;
    this.isPlaying = false;
    this.progress = 0;
    this.interval = null;
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

  open(videoId) {
    const video = store.getVideoById(videoId);
    if (!video) return;

    this.currentVideo = video;
    this.isPlaying = true;
    this.progress = 12;
    this.container.style.display = "block";
    this.render();
    this.startPlaybackSimulator();

    // Increment view count
    store.updateVideo(videoId, { views: (video.views || 0) + 1 });
  }

  close() {
    this.stopPlaybackSimulator();
    this.isPlaying = false;
    this.container.style.display = "none";
  }

  startPlaybackSimulator() {
    this.stopPlaybackSimulator();
    this.interval = setInterval(() => {
      if (this.isPlaying && this.currentVideo) {
        this.progress += 0.5;
        if (this.progress >= 100) this.progress = 0;
        const bar = this.container.querySelector("#custom-player-progress-fill");
        const timeEl = this.container.querySelector("#custom-player-timecode");
        if (bar) bar.style.width = `${this.progress}%`;
        if (timeEl && this.currentVideo) {
          const currentSec = Math.floor((this.progress / 100) * this.currentVideo.durationSec);
          const mins = Math.floor(currentSec / 60);
          const secs = currentSec % 60;
          timeEl.textContent = `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")} / ${this.currentVideo.duration}`;
        }
      }
    }, 500);
  }

  stopPlaybackSimulator() {
    if (this.interval) clearInterval(this.interval);
  }

  render() {
    if (!this.currentVideo) return;

    const vid = this.currentVideo;
    const isLiked = store.isVideoLiked(vid.id);
    const comments = store.getVideoComments(vid.id);
    const relatedVids = store.getVideos().filter((v) => v.id !== vid.id).slice(0, 4);

    this.container.innerHTML = `
      <div class="modal-overlay" id="video-modal-backdrop">
        <div class="modal-dialog" style="max-width:1050px; padding:0; background:#0B0B0B; border:1px solid var(--border-medium);">
          <button class="modal-close-btn" id="video-modal-close" style="top:14px; right:14px; z-index:20;">✕</button>

          <!-- Top Section: Video Screen -->
          <div style="position:relative; width:100%; height:clamp(300px, 48vw, 520px); background:#000000; overflow:hidden;">
            <img 
              src="${vid.thumbnail}" 
              id="player-visual-canvas" 
              style="width:100%; height:100%; object-fit:cover; filter:contrast(105%) brightness(92%); transition:transform 8s ease-in-out;" 
              alt="${vid.title}"
            />

            <!-- Subtle Vignette -->
            <div style="position:absolute; inset:0; background:radial-gradient(circle at center, transparent 35%, rgba(0,0,0,0.55) 90%); pointer-events:none;"></div>

            <!-- Center Play/Pause State -->
            <div id="player-center-play-badge">
              ${this.isPlaying ? "❚❚" : "▶"}
            </div>

            <!-- Telemetry Indicator -->
            <div style="position:absolute; top:16px; left:18px; font-family:var(--font-mono); font-size:0.7rem; color:#fff; background:rgba(0,0,0,0.7); padding:3px 8px; border-left:2px solid var(--accent); border-radius:var(--radius-xs); letter-spacing:0.08em;">
              4K 60FPS • DIRECT TELEMETRY
            </div>

            <!-- Video Controls Bar -->
            <div style="position:absolute; bottom:0; left:0; width:100%; background:linear-gradient(transparent, rgba(0,0,0,0.92) 75%); padding:14px 18px 10px; display:flex; flex-direction:column; gap:8px;">
              <!-- Interactive Scrubber -->
              <div id="custom-player-progress-bar">
                <div id="custom-player-progress-fill" style="width:${this.progress}%;"></div>
              </div>

              <!-- Controls Row -->
              <div style="display:flex; align-items:center; justify-content:space-between; color:#fff; font-size:0.85rem;">
                <div style="display:flex; align-items:center; gap:14px;">
                  <button id="player-btn-play-pause" style="color:#fff; font-size:1rem; cursor:pointer;">
                    ${this.isPlaying ? "❚❚" : "▶"}
                  </button>
                  <button id="player-btn-rev" title="Rev Engine" style="color:var(--text-primary); font-family:var(--font-mono); font-size:0.72rem; border:1px solid var(--border-medium); padding:2px 8px; border-radius:var(--radius-xs);">
                    Sound
                  </button>
                  <span id="custom-player-timecode" style="font-family:var(--font-mono); font-size:0.75rem; color:var(--text-secondary);">
                    00:35 / ${vid.duration}
                  </span>
                </div>

                <div style="display:flex; align-items:center; gap:14px;">
                  <span class="badge" style="font-size:0.65rem;">4K</span>
                  <button id="player-btn-sound" style="color:#fff; cursor:pointer;">
                    ${store.soundEnabled ? "🔊" : "🔇"}
                  </button>
                  <button id="player-btn-fullscreen" title="Fullscreen" style="color:#fff; cursor:pointer;">
                    ⛶
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Section: Info & Comments -->
          <div style="padding:1.5rem 1.75rem; max-height:420px; overflow-y:auto;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:14px; margin-bottom:16px;">
              <div style="flex:1; min-width:280px;">
                <div class="section-tag" style="margin-bottom:4px;">${vid.category}</div>
                <h3 style="font-size:1.3rem; font-weight:700; color:#fff; line-height:1.3; margin-bottom:6px;">${vid.title}</h3>
                <div style="font-size:0.8rem; color:var(--text-muted); display:flex; gap:10px; align-items:center;">
                  <span>${(vid.views || 0).toLocaleString()} views</span>
                  <span>•</span>
                  <span>Uploaded: ${vid.uploadDate}</span>
                  <span>•</span>
                  <span>Creator: <strong>${vid.author}</strong></span>
                </div>
              </div>

              <!-- Like & Share -->
              <div style="display:flex; gap:8px; align-items:center;">
                <button class="btn btn-secondary btn-sm" id="player-btn-like" style="${isLiked ? 'border-color:var(--accent); color:var(--accent);' : ''}">
                  ${isLiked ? "★ Saved" : "☆ Save"} (${(vid.likes || 0).toLocaleString()})
                </button>
                <button class="btn btn-secondary btn-sm" id="player-btn-share">
                  Share
                </button>
              </div>
            </div>

            <!-- Linked Cars Chips -->
            ${
              vid.cars && vid.cars.length > 0
                ? `
              <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:8px 12px; margin-bottom:18px; display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
                <span style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); text-transform:uppercase;">Featured:</span>
                ${vid.cars
                  .map((carName) => {
                    const carObj = store.getCars().find((c) => c.model.toLowerCase() === carName.toLowerCase() || carName.toLowerCase().includes(c.model.toLowerCase()));
                    const carId = carObj ? carObj.id : "";
                    return `
                    <button class="btn btn-secondary btn-sm linked-car-tag" data-car-id="${carId}" style="padding:2px 8px; font-size:0.72rem; min-height:28px;">
                      ${carName}
                    </button>
                  `;
                  })
                  .join("")}
              </div>
            `
                : ""
            }

            <!-- Description -->
            <p style="font-size:0.875rem; line-height:1.6; margin-bottom:24px; color:var(--text-secondary); background:rgba(255,255,255,0.015); padding:12px; border-radius:var(--radius-xs); border:1px solid var(--border-subtle);">
              ${vid.description}
            </p>

            <!-- Dual Columns: Comments & Related Videos -->
            <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(280px, 1fr)); gap:24px;">
              <!-- Comments Column -->
              <div>
                <div class="section-tag" style="margin-bottom:10px;">Discussion (${comments.length})</div>
                
                <form id="player-comment-form" style="display:flex; gap:8px; margin-bottom:14px;">
                  <input 
                    type="text" 
                    id="player-comment-text" 
                    placeholder="${authService.isAuthenticated() ? 'Add to the discussion...' : 'Sign in to comment...'}" 
                    style="flex:1; min-height:38px; font-size:0.825rem;" 
                    ${authService.isAuthenticated() ? "" : "disabled"}
                  />
                  <button type="submit" class="btn btn-primary btn-sm" style="min-height:38px;" ${authService.isAuthenticated() ? "" : "disabled"}>
                    Post
                  </button>
                </form>

                <div style="display:flex; flex-direction:column; gap:10px;">
                  ${
                    comments.length === 0
                      ? `<div style="font-size:0.8rem; color:var(--text-muted);">No comments yet.</div>`
                      : comments
                          .map(
                            (c) => `
                        <div style="background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); padding:10px 12px; border-radius:var(--radius-xs);">
                          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
                            <div style="display:flex; align-items:center; gap:8px;">
                              <img src="${c.userAvatar}" style="width:20px; height:20px; border-radius:50%; object-fit:cover;" alt="" />
                              <span style="font-size:0.8rem; font-weight:600; color:#fff;">${c.userName}</span>
                            </div>
                            <span style="font-size:0.68rem; color:var(--text-muted);">${c.timestamp}</span>
                          </div>
                          <div style="font-size:0.825rem; color:var(--text-secondary); line-height:1.4;">${c.content}</div>
                        </div>
                      `
                          )
                          .join("")
                  }
                </div>
              </div>

              <!-- Related Videos Column -->
              <div>
                <div class="section-tag" style="margin-bottom:10px;">Related Runs</div>
                <div style="display:flex; flex-direction:column; gap:10px;">
                  ${relatedVids
                    .map(
                      (rv) => `
                    <div class="modal-rel-vid-row" data-video-id="${rv.id}" style="display:flex; gap:10px; cursor:pointer; padding:6px; background:rgba(255,255,255,0.015); border-radius:var(--radius-xs); border:1px solid var(--border-subtle); transition:all 0.15s;">
                      <img src="${rv.thumbnail}" style="width:84px; height:52px; object-fit:cover; border-radius:var(--radius-xs);" alt="" />
                      <div style="flex:1; overflow:hidden;">
                        <h5 style="font-size:0.8rem; font-weight:600; line-height:1.3; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:2px;">${rv.title}</h5>
                        <div style="font-size:0.7rem; color:var(--text-muted);">${(rv.views || 0).toLocaleString()} views • ${rv.duration}</div>
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

  attachEvents() {
    // Close button
    const closeBtn = this.container.querySelector("#video-modal-close");
    if (closeBtn) closeBtn.addEventListener("click", () => this.close());

    // Backdrop click
    const backdrop = this.container.querySelector("#video-modal-backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    // Play/Pause button
    const playBtn = this.container.querySelector("#player-btn-play-pause");
    const centerPlayBadge = this.container.querySelector("#player-center-play-badge");
    const togglePlay = () => {
      this.isPlaying = !this.isPlaying;
      if (playBtn) playBtn.textContent = this.isPlaying ? "❚❚" : "▶";
      if (centerPlayBadge) centerPlayBadge.textContent = this.isPlaying ? "❚❚" : "▶";
      soundEngine.playClick();
    };

    if (playBtn) playBtn.addEventListener("click", togglePlay);
    if (centerPlayBadge) centerPlayBadge.addEventListener("click", togglePlay);

    // Rev engine boost
    const revBtn = this.container.querySelector("#player-btn-rev");
    if (revBtn) {
      revBtn.addEventListener("click", () => {
        soundEngine.playRev("turbo-v6");
      });
    }

    // Sound toggle
    const soundBtn = this.container.querySelector("#player-btn-sound");
    if (soundBtn) {
      soundBtn.addEventListener("click", () => {
        const active = store.toggleSound();
        soundBtn.textContent = active ? "🔊" : "🔇";
      });
    }

    // Scrubber click
    const bar = this.container.querySelector("#custom-player-progress-bar");
    if (bar) {
      bar.addEventListener("click", (e) => {
        const rect = bar.getBoundingClientRect();
        const pos = (e.clientX - rect.left) / rect.width;
        this.progress = Math.min(100, Math.max(0, pos * 100));
        const fill = this.container.querySelector("#custom-player-progress-fill");
        if (fill) fill.style.width = `${this.progress}%`;
      });
    }

    // Like button
    const likeBtn = this.container.querySelector("#player-btn-like");
    if (likeBtn && this.currentVideo) {
      likeBtn.addEventListener("click", () => {
        const isLiked = store.toggleLikeVideo(this.currentVideo.id);
        likeBtn.textContent = isLiked ? "★ Saved" : "☆ Save";
        soundEngine.playClick();
        window.dispatchEvent(
          new CustomEvent("driftverse:toast", {
            detail: { message: isLiked ? "Saved to your Collection" : "Removed from Collection" }
          })
        );
      });
    }

    // Share button
    const shareBtn = this.container.querySelector("#player-btn-share");
    if (shareBtn && this.currentVideo) {
      shareBtn.addEventListener("click", () => {
        soundEngine.playClick();
        navigator.clipboard?.writeText(window.location.href);
        window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Video link copied to clipboard!" } }));
      });
    }

    // Linked car specs tag clicks
    this.container.querySelectorAll(".linked-car-tag").forEach((btn) => {
      btn.addEventListener("click", () => {
        const carId = btn.getAttribute("data-car-id");
        if (carId) {
          this.close();
          window.dispatchEvent(new CustomEvent("driftverse:view-car", { detail: { carId } }));
        }
      });
    });

    // Related video clicks
    this.container.querySelectorAll(".modal-rel-vid-row").forEach((row) => {
      row.addEventListener("click", () => {
        const videoId = row.getAttribute("data-video-id");
        this.open(videoId);
      });
    });

    // Comment submit
    const commentForm = this.container.querySelector("#player-comment-form");
    if (commentForm && this.currentVideo) {
      commentForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const input = this.container.querySelector("#player-comment-text");
        if (!input || !input.value.trim()) return;
        store.addComment(this.currentVideo.id, input.value.trim());
        input.value = "";
        this.render();
        window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: "Comment posted." } }));
      });
    }
  }
}
