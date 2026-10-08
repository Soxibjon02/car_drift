/**
 * DRIFTVERSE - Automotive Editorial Footer Component
 * Professional 4-column layout matching high-end automotive media standards
 */
import { carBrands } from "../data/initialState.js";
import { soundEngine } from "../services/audio.js";

export function renderFooter(container) {
  const brandList = carBrands.filter((b) => b !== "All").slice(0, 10);

  container.innerHTML = `
    <footer class="site-footer">
      <div class="container">
        <!-- Multi-Column Links -->
        <div class="footer-grid">
          <!-- Col 1: Brand & Editorial Statement -->
          <div class="footer-col">
            <div class="brand-logo" style="margin-bottom:12px;">
              <div class="brand-logo-icon">▲</div>
              <div class="brand-logo-text">DRIFT<span>VERSE</span></div>
            </div>
            <p style="font-size:0.875rem; margin-bottom:16px; max-width:300px; color:var(--text-secondary); line-height:1.6;">
              Automotive culture, performance and speed. High-resolution footage, virtual dyno telemetry, and engineering analysis.
            </p>
            <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--accent); letter-spacing:0.12em;">
              POWER • SPEED • CONTROL
            </div>
          </div>

          <!-- Col 2: Explore -->
          <div class="footer-col">
            <h5>Explore</h5>
            <ul class="footer-links">
              <li><a data-route="cars">Performance Cars</a></li>
              <li><a data-route="videos">Videos & Footage</a></li>
              <li><a data-route="wallpapers">4K Wallpapers & Media</a></li>
              <li><a data-route="compare">Side-by-Side Compare</a></li>
              <li><a data-route="rankings">Global Speed Rankings</a></li>
              <li><a data-route="trending">Trending Machines</a></li>
            </ul>
          </div>

          <!-- Col 3: Categories -->
          <div class="footer-col">
            <h5>Categories</h5>
            <ul class="footer-links">
              <li><a data-route="cars" data-filter-brand="Nissan">JDM Icons</a></li>
              <li><a data-route="cars" data-filter-brand="Ferrari">Supercars</a></li>
              <li><a data-route="cars" data-filter-brand="Koenigsegg">Hypercars</a></li>
              <li><a data-route="cars" data-filter-brand="BMW">Sports Coupes</a></li>
              <li><a data-route="garage">My Saved Garage</a></li>
            </ul>
          </div>

          <!-- Col 4: Newsletter & Socials -->
          <div class="footer-col">
            <h5>Dispatch</h5>
            <p style="font-size:0.825rem; margin-bottom:14px; color:var(--text-muted); line-height:1.5;">
              Receive telemetry updates, drift shootouts, and new supercar additions.
            </p>
            <form id="footer-newsletter-form" style="display:flex; gap:6px; margin-bottom:16px;">
              <input type="email" id="footer-newsletter-email" placeholder="Enter email address" required style="flex:1; min-height:38px; font-size:0.8rem;" />
              <button type="submit" class="btn btn-primary btn-sm" style="min-height:38px;">Join</button>
            </form>
            <div style="display:flex; gap:16px; font-size:0.85rem; color:var(--text-muted);">
              <a href="#" style="transition:color 0.2s;">Instagram</a>
              <a href="#" style="transition:color 0.2s;">YouTube</a>
              <a href="#" style="transition:color 0.2s;">TikTok</a>
              <a href="#" style="transition:color 0.2s;">Telegram</a>
            </div>
          </div>
        </div>

        <!-- Automotive Brands Ticker -->
        <div style="border-top:1px solid var(--border-subtle); padding-top:20px; margin-bottom:24px;">
          <div style="display:flex; flex-wrap:wrap; align-items:center; gap:8px;">
            <span style="font-family:var(--font-mono); font-size:0.68rem; color:var(--text-muted); letter-spacing:0.08em; text-transform:uppercase; margin-right:6px;">
              Manufacturers:
            </span>
            ${brandList
              .map(
                (brand) => `
              <span class="badge" style="cursor:pointer;" data-filter-brand="${brand}">
                ${brand}
              </span>
            `
              )
              .join("")}
          </div>
        </div>

        <!-- Bottom Copyright & Legal -->
        <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; font-size:0.75rem; color:var(--text-muted); border-top:1px solid var(--border-subtle); padding-top:16px;">
          <div>© 2026 DRIFTVERSE Platform. All rights reserved.</div>
          <div style="display:flex; align-items:center; gap:16px;">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="#">Contact</a>
            <a data-route="admin" style="cursor:pointer; opacity:0.2; font-size:0.72rem; color:var(--text-muted); text-decoration:none; transition:opacity 0.2s;" onmouseover="this.style.opacity='0.8'" onmouseout="this.style.opacity='0.2'" title="Console">⚡ Core</a>
          </div>
        </div>
      </div>

      <!-- Subtle Background Watermark -->
      <div class="footer-watermark">DRIFTVERSE</div>
    </footer>
  `;

  // Attach Footer Navigation Events
  container.querySelectorAll("[data-route]").forEach((btn) => {
    btn.addEventListener("click", () => {
      soundEngine.playClick();
      const route = btn.getAttribute("data-route");
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route } }));
    });
  });

  // Newsletter Submit
  const form = container.querySelector("#footer-newsletter-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      soundEngine.playRev("turbo-v6");
      const emailInput = container.querySelector("#footer-newsletter-email");
      window.dispatchEvent(
        new CustomEvent("driftverse:toast", {
          detail: { message: `Subscription confirmed for ${emailInput.value}` }
        })
      );
      emailInput.value = "";
    });
  }

  // Brand click triggers car filter navigation
  container.querySelectorAll("[data-filter-brand]").forEach((badge) => {
    badge.addEventListener("click", () => {
      const brand = badge.getAttribute("data-filter-brand");
      window.dispatchEvent(new CustomEvent("driftverse:filter-brand", { detail: { brand } }));
      window.dispatchEvent(new CustomEvent("driftverse:navigate", { detail: { route: "cars" } }));
    });
  });
}
