/**
 * DRIFTVERSE - Automotive Editorial Authentication Modal
 * Connected to Neon PostgreSQL (Login / Register / Secure Session)
 */
import { authService } from "../services/auth.js";
import { soundEngine } from "../services/audio.js";

export class AuthModal {
  constructor() {
    this.container = null;
    this.mode = "login"; // "login" | "signup"
    this.init();
  }

  init() {
    this.container = document.createElement("div");
    this.container.id = "auth-modal-wrapper";
    this.container.style.display = "none";
    document.body.appendChild(this.container);

    window.addEventListener("driftverse:open-auth", (e) => {
      this.mode = (e.detail && e.detail.mode) || "login";
      this.promptMessage = (e.detail && e.detail.message) || null;
      this.open();
    });
  }

  open() {
    this.container.style.display = "block";
    this.render();
  }

  close() {
    this.container.style.display = "none";
    this.promptMessage = null;
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-overlay" id="auth-modal-backdrop">
        <div class="modal-dialog" style="max-width:440px; background:var(--bg-card); border:1px solid var(--border-medium); padding:2rem 2.25rem; backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px);">
          <button class="modal-close-btn" id="auth-modal-close" style="top:14px; right:14px;">✕</button>

          <!-- Brand Header -->
          <div style="text-align:center; margin-bottom:20px;">
            <div class="brand-logo" style="justify-content:center; margin-bottom:6px;">
              <div class="brand-logo-icon">▲</div>
              <div class="brand-logo-text">DRIFT<span>VERSE</span></div>
            </div>
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); letter-spacing:0.12em; text-transform:uppercase;">
              PILOT TELEMETRY & COMMUNITY ACCESS
            </div>
          </div>

          ${
            this.promptMessage
              ? `
            <div style="background:rgba(255,77,0,0.1); border:1px solid var(--accent); padding:10px 14px; border-radius:var(--radius-xs); margin-bottom:16px; font-size:0.8rem; color:var(--text-primary); text-align:center;">
              ⚠️ ${this.promptMessage}
            </div>
          `
              : ""
          }

          <!-- Tabs -->
          <div style="display:flex; border-bottom:1px solid var(--border-subtle); margin-bottom:20px;">
            <button class="auth-tab-btn" id="tab-login" style="flex:1; padding:10px; font-family:var(--font-heading); font-size:0.85rem; font-weight:700; color:${this.mode === 'login' ? 'var(--accent)' : 'var(--text-muted)'}; border-bottom:2px solid ${this.mode === 'login' ? 'var(--accent)' : 'transparent'};">
              Tizimga Kirish (Sign In)
            </button>
            <button class="auth-tab-btn" id="tab-signup" style="flex:1; padding:10px; font-family:var(--font-heading); font-size:0.85rem; font-weight:700; color:${this.mode === 'signup' ? 'var(--accent)' : 'var(--text-muted)'}; border-bottom:2px solid ${this.mode === 'signup' ? 'var(--accent)' : 'transparent'};">
              Ro'yxatdan o'tish (Register)
            </button>
          </div>

          <div id="auth-error-msg" style="display:none; background:rgba(255,59,48,0.12); border:1px solid #FF3B30; color:#FF453A; padding:8px 12px; border-radius:var(--radius-xs); font-size:0.8rem; margin-bottom:14px;"></div>

          <!-- Form Area -->
          ${
            this.mode === "login"
              ? `
            <form id="form-auth-login" style="display:flex; flex-direction:column; gap:14px;">
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Foydalanuvchi nomi yoki Email</label>
                <input type="text" id="login-identifier" placeholder="masalan: soxibjon yoki email" required style="width:100%;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Parol</label>
                <input type="password" id="login-password" placeholder="••••••••" required style="width:100%;" />
              </div>
              <button type="submit" class="btn btn-primary" id="btn-submit-login" style="width:100%; margin-top:8px;">
                Tizimga Kirish ➔
              </button>
            </form>
          `
              : `
            <form id="form-auth-signup" style="display:flex; flex-direction:column; gap:12px;">
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Foydalanuvchi nomi (Username)</label>
                <input type="text" id="signup-name" placeholder="masalan: apex_racer" required style="width:100%;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Email Manzili</label>
                <input type="email" id="signup-email" placeholder="siz@driftverse.io" required style="width:100%;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Parol (kamida 6 ta belgi)</label>
                <input type="password" id="signup-password" placeholder="••••••••" required minlength="6" style="width:100%;" />
              </div>
              <button type="submit" class="btn btn-primary" id="btn-submit-signup" style="width:100%; margin-top:8px;">
                Hisob Yaratish ➔
              </button>
            </form>
          `
          }

          <div style="margin-top:18px; padding:10px 12px; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); font-size:0.72rem; color:var(--text-muted); text-align:center;">
            🔒 Ma'lumotlar xavfsiz Neon PostgreSQL serverida saqlanadi
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
  }

  showError(msg) {
    const el = this.container.querySelector("#auth-error-msg");
    if (el) {
      el.textContent = msg;
      el.style.display = "block";
    }
  }

  attachEvents() {
    const backdrop = this.container.querySelector("#auth-modal-backdrop");
    const closeBtn = this.container.querySelector("#auth-modal-close");

    if (closeBtn) closeBtn.addEventListener("click", () => this.close());
    if (backdrop) {
      backdrop.addEventListener("click", (e) => {
        if (e.target === backdrop) this.close();
      });
    }

    // Tab buttons
    const tabLogin = this.container.querySelector("#tab-login");
    const tabSignup = this.container.querySelector("#tab-signup");
    if (tabLogin) {
      tabLogin.addEventListener("click", () => {
        soundEngine.playClick();
        this.mode = "login";
        this.render();
      });
    }
    if (tabSignup) {
      tabSignup.addEventListener("click", () => {
        soundEngine.playClick();
        this.mode = "signup";
        this.render();
      });
    }

    // Login Form Submit
    const loginForm = this.container.querySelector("#form-auth-login");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = this.container.querySelector("#btn-submit-login");
        const identifier = this.container.querySelector("#login-identifier").value.trim();
        const password = this.container.querySelector("#login-password").value;

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Tekshirilmoqda...";
        }

        const res = await authService.login(identifier, password);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Tizimga Kirish ➔";
        }

        if (res.success) {
          soundEngine.playRev("v8-drift");
          this.close();
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: `Xush kelibsiz, ${res.user.username}!` }
          }));
        } else {
          this.showError(res.message || "Kirishda xatolik");
        }
      });
    }

    // Signup Form Submit
    const signupForm = this.container.querySelector("#form-auth-signup");
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = this.container.querySelector("#btn-submit-signup");
        const username = this.container.querySelector("#signup-name").value.trim();
        const email = this.container.querySelector("#signup-email").value.trim();
        const password = this.container.querySelector("#signup-password").value;

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = "Hisob yaratilmoqda...";
        }

        const res = await authService.register(username, email, password);
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Hisob Yaratish ➔";
        }

        if (res.success) {
          soundEngine.playRev("v8-drift");
          this.close();
          window.dispatchEvent(new CustomEvent("driftverse:toast", {
            detail: { message: `Ro'yxatdan o'tdingiz! Xush kelibsiz, ${res.user.username}!` }
          }));
        } else {
          this.showError(res.message || "Ro'yxatdan o'tishda xatolik");
        }
      });
    }
  }
}
