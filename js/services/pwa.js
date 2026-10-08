/**
 * DRIFTVERSE - Progressive Web App (PWA) Manager
 * Enables 1-click App Installation on Android, iOS, Windows & macOS
 */

class PwaManager {
  constructor() {
    this.deferredPrompt = null;
    this.isInstalled = false;
    this.init();
  }

  init() {
    // 1. Register Service Worker
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((reg) => {
            console.log("[PWA] Service Worker active, scope:", reg.scope);
          })
          .catch((err) => {
            console.warn("[PWA] Service Worker registration failed:", err);
          });
      });
    }

    // 2. Check if already running as standalone app
    if (
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true
    ) {
      this.isInstalled = true;
      console.log("[PWA] Running in standalone installed app mode.");
      return;
    }

    // 3. Listen for BeforeInstallPrompt event (Chrome, Edge, Android)
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      this.deferredPrompt = e;
      console.log("[PWA] beforeinstallprompt captured.");
      this.showInstallButtons();
      this.showFloatingBanner();
    });

    // 4. App Installed listener
    window.addEventListener("appinstalled", () => {
      this.isInstalled = true;
      this.deferredPrompt = null;
      this.hideInstallButtons();
      this.hideFloatingBanner();
      window.dispatchEvent(
        new CustomEvent("driftverse:toast", {
          detail: { message: "🎉 DRIFTVERSE ilovasi muvaffaqiyatli o'rnatildi!" }
        })
      );
    });

    // Setup UI after DOM ready
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => this.setupUi());
    } else {
      this.setupUi();
    }
  }

  isIos() {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    );
  }

  showInstallButtons() {
    const navBtn = document.getElementById("btn-pwa-install");
    if (navBtn) navBtn.style.display = "flex";

    const drawerBtn = document.getElementById("drawer-btn-pwa-install");
    if (drawerBtn) drawerBtn.style.display = "flex";
  }

  hideInstallButtons() {
    const navBtn = document.getElementById("btn-pwa-install");
    if (navBtn) navBtn.style.display = "none";

    const drawerBtn = document.getElementById("drawer-btn-pwa-install");
    if (drawerBtn) drawerBtn.style.display = "none";
  }

  setupUi() {
    // Show buttons if iOS
    if (this.isIos() && !this.isInstalled) {
      this.showInstallButtons();
    }

    // Bind clicks to global install triggers
    document.addEventListener("click", (e) => {
      if (
        e.target &&
        (e.target.id === "btn-pwa-install" ||
          e.target.closest("#btn-pwa-install") ||
          e.target.id === "drawer-btn-pwa-install" ||
          e.target.closest("#drawer-btn-pwa-install") ||
          e.target.id === "banner-btn-pwa-install")
      ) {
        e.preventDefault();
        this.promptInstall();
      }
    });
  }

  async promptInstall() {
    // If standard browser prompt available (Android / Chrome / Edge / Windows / Mac)
    if (this.deferredPrompt) {
      this.deferredPrompt.prompt();
      const choiceResult = await this.deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted installation prompt");
      }
      this.deferredPrompt = null;
      this.hideFloatingBanner();
      return;
    }

    // If iOS Safari
    if (this.isIos()) {
      this.showIosInstructionModal();
      return;
    }

    // If desktop or browser that doesn't fire beforeinstallprompt (or already prompted)
    this.showDesktopInstructionModal();
  }

  showFloatingBanner() {
    // Don't show if user dismissed recently
    if (sessionStorage.getItem("driftverse_pwa_banner_dismissed")) return;
    if (document.getElementById("pwa-floating-banner")) return;

    const banner = document.createElement("div");
    banner.id = "pwa-floating-banner";
    banner.innerHTML = `
      <div style="position:fixed; bottom:20px; left:20px; z-index:9999; max-width:380px; width:calc(100vw - 40px); background:rgba(15,15,18,0.95); border:1px solid var(--accent); border-radius:var(--radius-sm); padding:14px 16px; box-shadow:0 16px 40px rgba(0,0,0,0.85); backdrop-filter:blur(16px); display:flex; align-items:center; justify-content:space-between; gap:12px; animation:toastSlideIn 0.4s ease forwards;">
        <div style="display:flex; align-items:center; gap:12px;">
          <img src="/assets/icon.svg" style="width:40px; height:40px; border-radius:8px;" alt="DRIFTVERSE" />
          <div>
            <div style="font-weight:700; font-size:0.85rem; color:#fff;">DRIFTVERSE Ilovasi</div>
            <div style="font-size:0.72rem; color:var(--text-secondary);">Tezroq va qulayroq o'rnatib ishlatish</div>
          </div>
        </div>
        <div style="display:flex; align-items:center; gap:8px;">
          <button id="banner-btn-pwa-install" class="btn btn-primary btn-sm" style="padding:6px 12px; font-size:0.75rem; font-weight:700; white-space:nowrap;">
            O'rnatish 📱
          </button>
          <button id="banner-btn-pwa-close" style="color:var(--text-muted); font-size:1.1rem; padding:4px; cursor:pointer;">
            ✕
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    const closeBtn = banner.querySelector("#banner-btn-pwa-close");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        banner.remove();
        sessionStorage.setItem("driftverse_pwa_banner_dismissed", "true");
      });
    }
  }

  hideFloatingBanner() {
    const banner = document.getElementById("pwa-floating-banner");
    if (banner) banner.remove();
  }

  showIosInstructionModal() {
    let modal = document.getElementById("ios-install-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "ios-install-modal";
      modal.className = "modal-overlay";
      modal.innerHTML = `
        <div class="modal-dialog" style="max-width:440px; background:var(--bg-card); border:1px solid var(--border-medium); padding:2rem 1.5rem; text-align:center;">
          <button class="modal-close-btn" id="ios-modal-close" style="top:12px; right:12px;">✕</button>
          <div style="font-size:2.5rem; margin-bottom:12px;">📱</div>
          <h3 style="font-size:1.3rem; font-weight:800; color:var(--text-primary); margin-bottom:10px;">
            iPhone / iPad ga O'rnatish
          </h3>
          <p style="font-size:0.85rem; color:var(--text-secondary); line-height:1.5; margin-bottom:20px;">
            DRIFTVERSE'ni Apple qurilmangizga to'liq ilova sifatida o'rnatish uchun quyidagi oddiy qadamlarni bajaring:
          </p>
          <div style="background:rgba(255,255,255,0.03); border:1px solid var(--border-subtle); border-radius:var(--radius-xs); padding:14px; text-align:left; font-size:0.85rem; display:flex; flex-direction:column; gap:10px; margin-bottom:20px;">
            <div>1. Safari brauzerining pastki qismidagi <strong>"Ulashish" (Share) ⎋</strong> tugmasini bosing.</div>
            <div>2. Chiqqan ro'yxatdan <strong>"Bosh ekranga qo'shish" (+ Add to Home Screen)</strong> ni tanlang.</div>
            <div>3. Yuqori o'ng burchakdagi <strong>"Qo'shish" (Add)</strong> tugmasini bosing.</div>
          </div>
          <button class="btn btn-primary" id="ios-modal-got-it" style="width:100%;">
            Tushundim, rahmat! 👍
          </button>
        </div>
      `;
      document.body.appendChild(modal);

      modal.querySelector("#ios-modal-close").onclick = () => (modal.style.display = "none");
      modal.querySelector("#ios-modal-got-it").onclick = () => (modal.style.display = "none");
      modal.onclick = (e) => {
        if (e.target === modal) modal.style.display = "none";
      };
    }
    modal.style.display = "block";
  }

  showDesktopInstructionModal() {
    window.dispatchEvent(
      new CustomEvent("driftverse:toast", {
        detail: {
          message: "Brauzer manzil satridagi (URL) o'ng tomonidagi 'O'rnatish' (Install) belgisini bosing!"
        }
      })
    );
  }
}

export const pwa = new PwaManager();
