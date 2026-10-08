/**
 * DRIFTVERSE - Automotive Editorial Authentication Modal (Sign In / Register / Reset)
 */
import { authService } from "../services/auth.js";
import { soundEngine } from "../services/audio.js";

export class AuthModal {
  constructor() {
    this.container = null;
    this.mode = "login"; // "login" | "signup" | "forgot"
    this.init();
  }

  init() {
    this.container = document.createElement("div");
    this.container.id = "auth-modal-wrapper";
    this.container.style.display = "none";
    document.body.appendChild(this.container);

    window.addEventListener("driftverse:open-auth", (e) => {
      this.mode = (e.detail && e.detail.mode) || "login";
      this.open();
    });
  }

  open() {
    this.container.style.display = "block";
    this.render();
  }

  close() {
    this.container.style.display = "none";
  }

  render() {
    this.container.innerHTML = `
      <div class="modal-overlay" id="auth-modal-backdrop">
        <div class="modal-dialog" style="max-width:480px; background:#0D0D0D; border:1px solid var(--border-medium); padding:2rem 2.25rem;">
          <button class="modal-close-btn" id="auth-modal-close">✕</button>

          <!-- Brand Header -->
          <div style="text-align:center; margin-bottom:24px;">
            <div class="brand-logo" style="justify-content:center; margin-bottom:6px;">
              <div class="brand-logo-icon">▲</div>
              <div class="brand-logo-text">DRIFT<span>VERSE</span></div>
            </div>
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--text-muted); letter-spacing:0.12em; text-transform:uppercase;">
              Pilot Account Access
            </div>
          </div>

          <!-- Tabs -->
          <div style="display:flex; border-bottom:1px solid var(--border-subtle); margin-bottom:20px;">
            <button class="auth-tab-btn" id="tab-login" style="flex:1; padding:10px; font-family:var(--font-heading); font-size:0.85rem; font-weight:600; color:${this.mode === 'login' ? 'var(--accent)' : 'var(--text-muted)'}; border-bottom:2px solid ${this.mode === 'login' ? 'var(--accent)' : 'transparent'};">
              Sign In
            </button>
            <button class="auth-tab-btn" id="tab-signup" style="flex:1; padding:10px; font-family:var(--font-heading); font-size:0.85rem; font-weight:600; color:${this.mode === 'signup' ? 'var(--accent)' : 'var(--text-muted)'}; border-bottom:2px solid ${this.mode === 'signup' ? 'var(--accent)' : 'transparent'};">
              Create Account
            </button>
          </div>

          <!-- Form Area -->
          ${
            this.mode === "login"
              ? `
            <form id="form-auth-login" style="display:flex; flex-direction:column; gap:14px;">
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Email Address</label>
                <input type="email" id="login-email" placeholder="driver@driftverse.com" value="driver@driftverse.com" required style="width:100%;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Password</label>
                <input type="password" id="login-password" placeholder="••••••••" value="drift123" required style="width:100%;" />
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center; font-size:0.8rem;">
                <label style="display:flex; align-items:center; gap:6px; cursor:pointer; color:var(--text-muted);">
                  <input type="checkbox" checked /> Remember login
                </label>
                <a href="#" id="link-forgot-pass" style="color:var(--text-secondary); text-decoration:underline;">Forgot password?</a>
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%; margin-top:6px;">
                Sign In
              </button>
            </form>
          `
              : this.mode === "signup"
              ? `
            <form id="form-auth-signup" style="display:flex; flex-direction:column; gap:12px;">
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Driver Name</label>
                <input type="text" id="signup-name" placeholder="e.g. Kenji Fujiwara" required style="width:100%;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Email Address</label>
                <input type="email" id="signup-email" placeholder="kenji@apex.io" required style="width:100%;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Password</label>
                <input type="password" id="signup-password" placeholder="Create password" required style="width:100%;" />
              </div>
              <div>
                <label style="display:block; font-size:0.72rem; font-family:var(--font-mono); color:var(--text-muted); margin-bottom:6px; text-transform:uppercase;">Confirm Password</label>
                <input type="password" id="signup-confirm" placeholder="Confirm password" required style="width:100%;" />
              </div>
              <button type="submit" class="btn btn-primary" style="width:100%; margin-top:6px;">
                Create Account
              </button>
            </form>
          `
              : `
            <!-- Forgot Password View -->
            <div style="text-align:center;">
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-bottom:16px;">
                Enter your registered email address to receive password reset instructions.
              </p>
              <input type="email" id="forgot-email" placeholder="pilot@driftverse.com" style="width:100%; margin-bottom:16px;" />
              <button class="btn btn-primary" id="btn-forgot-submit" style="width:100%; margin-bottom:12px;">
                Send Reset Link
              </button>
              <button class="btn btn-ghost" id="btn-forgot-back">Back to Sign In</button>
            </div>
          `
          }

          <!-- Demo Profiles Box -->
          <div style="margin-top:20px; padding:12px; background:rgba(255,255,255,0.02); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); font-size:0.75rem; color:var(--text-muted);">
            <div style="font-weight:600; color:var(--text-secondary); margin-bottom:4px; text-transform:uppercase; font-size:0.7rem;">Demo Profiles:</div>
            <div>Admin: <strong style="color:var(--text-primary);">admin@driftverse.com</strong></div>
            <div>Driver: <strong style="color:var(--text-primary);">driver@driftverse.com</strong></div>
          </div>
        </div>
      </div>
    `;

    this.attachEvents();
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

    // Forgot password link
    const forgotLink = this.container.querySelector("#link-forgot-pass");
    if (forgotLink) {
      forgotLink.addEventListener("click", (e) => {
        e.preventDefault();
        soundEngine.playClick();
        this.mode = "forgot";
        this.render();
      });
    }

    const forgotBack = this.container.querySelector("#btn-forgot-back");
    if (forgotBack) {
      forgotBack.addEventListener("click", () => {
        soundEngine.playClick();
        this.mode = "login";
        this.render();
      });
    }

    // Login Form Submit
    const loginForm = this.container.querySelector("#form-auth-login");
    if (loginForm) {
      loginForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const email = this.container.querySelector("#login-email").value.trim();
        const res = authService.login(email);
        if (res.success) {
          soundEngine.playRev("turbo-v6");
          this.close();
          window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: `Welcome back, ${res.user.name}` } }));
          window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "garage" } }));
        } else {
          window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: res.error || "Login failed" } }));
        }
      });
    }

    // Signup Form Submit
    const signupForm = this.container.querySelector("#form-auth-signup");
    if (signupForm) {
      signupForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const name = this.container.querySelector("#signup-name").value.trim();
        const email = this.container.querySelector("#signup-email").value.trim();
        const res = authService.signup(name, email);
        if (res.success) {
          soundEngine.playRev("turbo-v6");
          this.close();
          window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: `Account created! Welcome, ${res.user.name}` } }));
          window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "garage" } }));
        } else {
          window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: res.error || "Signup failed" } }));
        }
      });
    }

    // Forgot Password Submit
    const forgotSubmit = this.container.querySelector("#btn-forgot-submit");
    if (forgotSubmit) {
      forgotSubmit.addEventListener("click", () => {
        const email = this.container.querySelector("#forgot-email").value.trim();
        if (email) {
          soundEngine.playClick();
          window.dispatchEvent(new CustomEvent("driftverse:toast", { detail: { message: `Reset link dispatched to ${email}` } }));
          this.mode = "login";
          this.render();
        }
      });
    }
  }
}
