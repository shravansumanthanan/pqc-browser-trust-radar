// Main Browser Controller & App Coordinator
(function() {
  class BrowserApp {
    constructor() {
      this.currentDomain = 'pq.cloudflareresearch.com';
      this.currentPolicy = 'hybrid_permissive';
      this.activeTab = 'radar';
      this.historyStack = [];
    }

    async init() {
      // Initialize sub-modules
      if (window.TrustRadar) window.TrustRadar.init();
      if (window.EphemeralIdentity) window.EphemeralIdentity.init();
      if (window.AnonymousTokens) window.AnonymousTokens.init();
      if (window.SustainabilityMeter) window.SustainabilityMeter.init();

      this.bindUI();
      // Load default starting domain
      await this.navigateTo(this.currentDomain);
    }

    bindUI() {
      // 1. Omnibox form submission
      const form = document.getElementById('omniboxForm');
      if (form) {
        form.addEventListener('submit', (e) => {
          e.preventDefault();
          const input = document.getElementById('omniboxInput');
          if (input && input.value.trim()) {
            this.navigateTo(input.value.trim());
          }
        });
      }

      // 2. Quick target preset chips
      const chips = document.querySelectorAll('.target-chip');
      chips.forEach(chip => {
        chip.addEventListener('click', () => {
          const target = chip.getAttribute('data-target');
          chips.forEach(c => c.classList.remove('active'));
          chip.classList.add('active');
          this.navigateTo(target);
        });
      });

      // 3. Crypto Agility Policy selector
      const policySelect = document.getElementById('cryptoPolicySelect');
      if (policySelect) {
        policySelect.addEventListener('change', (e) => {
          this.currentPolicy = e.target.value;
          if (window.EphemeralIdentity) {
            const policyNames = {
              'hybrid_permissive': 'Hybrid Permissive',
              'strict_pqc': 'Strict Post-Quantum Only',
              'legacy_compat': 'Legacy Compatibility'
            };
            window.EphemeralIdentity.showToast(`Crypto-Agility Policy changed to: ${policyNames[this.currentPolicy]}`);
          }
          // Re-evaluate current site under new policy
          this.navigateTo(this.currentDomain);
        });
      }

      // 4. HUD Navigation Tabs
      const tabBtns = document.querySelectorAll('.hud-tab-btn');
      tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const tabTarget = btn.getAttribute('data-hud-tab');
          this.switchHudTab(tabTarget);
        });
      });

      // 5. Omnibox reload button
      const btnReload = document.getElementById('btnNavReload');
      if (btnReload) {
        btnReload.addEventListener('click', () => this.navigateTo(this.currentDomain));
      }
    }

    switchHudTab(tabName) {
      this.activeTab = tabName;
      document.querySelectorAll('.hud-tab-btn').forEach(b => {
        if (b.getAttribute('data-hud-tab') === tabName) b.classList.add('active');
        else b.classList.remove('active');
      });

      const panes = {
        'radar': 'paneTrustRadar',
        'identity': 'paneEphemeralIdentity',
        'tokens': 'paneAnonymousTokens',
        'sustainability': 'paneSustainability'
      };

      Object.keys(panes).forEach(k => {
        const el = document.getElementById(panes[k]);
        if (el) {
          el.style.display = (k === tabName) ? 'flex' : 'none';
        }
      });
    }

    async navigateTo(targetUrl) {
      this.currentDomain = targetUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '');

      // Update input
      const omniboxInput = document.getElementById('omniboxInput');
      if (omniboxInput) omniboxInput.value = targetUrl;

      // Update Active Chip
      document.querySelectorAll('.target-chip').forEach(c => {
        if (c.getAttribute('data-target') === this.currentDomain) c.classList.add('active');
        else c.classList.remove('active');
      });

      // Show loading indicator in viewport
      this.renderLoading(this.currentDomain);

      try {
        const res = await fetch(`/api/scan?url=${encodeURIComponent(targetUrl)}`);
        const data = await res.json();

        // Check Strict PQC policy enforcement
        if (this.currentPolicy === 'strict_pqc' && data.keyExchangeType === 'classical') {
          this.renderPolicyBlocked(data);
          if (window.TrustRadar) window.TrustRadar.updateData(data);
          return;
        }

        // Render site viewport content
        this.renderViewportSite(data);

        // Update Trust Radar & Inspector
        if (window.TrustRadar) {
          window.TrustRadar.updateData(data);
        }

        // Refresh sustainability metrics
        if (window.SustainabilityMeter) {
          window.SustainabilityMeter.updateMetrics();
        }

      } catch (err) {
        console.error('Scan error:', err);
        this.renderError(this.currentDomain, err.message);
      }
    }

    renderLoading(domain) {
      const container = document.getElementById('viewportContent');
      if (container) {
        container.innerHTML = `
          <div style="text-align: center; padding: 60px 20px;">
            <div class="radar-spin-ring" style="width: 48px; height: 48px; margin: 0 auto 20px; border-width: 3px;"></div>
            <h3 style="font-family: var(--font-sans); color: var(--text-main); margin-bottom: 6px;">Initiating Post-Quantum Handshake Probe</h3>
            <p style="font-family: var(--font-mono); font-size: 12px; color: var(--quantum-cyan);">Connecting to ${domain} with ML-KEM-768 & ML-DSA extensions...</p>
          </div>
        `;
      }
    }

    renderViewportSite(data) {
      const titleEl = document.getElementById('viewportSiteTitle');
      const urlEl = document.getElementById('viewportSiteUrl');
      const container = document.getElementById('viewportContent');

      if (titleEl) titleEl.textContent = data.title;
      if (urlEl) urlEl.textContent = data.url;

      if (container) {
        container.innerHTML = data.htmlContent || `
          <div class="site-preview-hero">
            <span class="site-badge pqc-badge">${data.status.toUpperCase()}</span>
            <h2>${data.title}</h2>
            <p>Target site evaluated via Ephemeral PQC Trust Radar.</p>
          </div>
        `;
      }
    }

    renderPolicyBlocked(data) {
      const titleEl = document.getElementById('viewportSiteTitle');
      const urlEl = document.getElementById('viewportSiteUrl');
      const container = document.getElementById('viewportContent');

      if (titleEl) titleEl.textContent = `CONNECTION BLOCKED: ${data.title}`;
      if (urlEl) urlEl.textContent = data.url;

      if (container) {
        container.innerHTML = `
          <div class="site-preview-hero" style="border-color: rgba(255, 0, 84, 0.5); box-shadow: 0 0 30px rgba(255, 0, 84, 0.2);">
            <span class="site-badge danger-badge">STRICT PQC ENFORCEMENT INTERCEPT</span>
            <h2 style="color: #ff3366;">Access Intercepted: Classical Downgrade Detected</h2>
            <p>Your Crypto-Agility Policy is set to <strong>Strict Post-Quantum Only</strong>. The connection to <code>${data.url}</code> attempted to negotiate an unshielded classical handshake (<code>${data.keyExchange}</code>) with certificate (<code>${data.certSigAlg}</code>).</p>
            
            <div class="site-alert-box error" style="margin-top: 16px;">
              <strong>Harvest-Now-Decrypt-Later Risk:</strong> Data transmitted under this classical session is subject to adversary wiretapping and retrospective quantum decryption.
            </div>

            <div style="display: flex; gap: 12px; margin-top: 20px;">
              <button class="site-btn danger" onclick="window.AppController.switchPolicyAndLoad('hybrid_permissive')">
                Switch to Hybrid Permissive & Proceed
              </button>
              <button class="site-btn" style="background: rgba(255,255,255,0.08); color: #fff;" onclick="window.AppController.navigateTo('pq.cloudflareresearch.com')">
                Return to Safe PQC Target
              </button>
            </div>
          </div>
        `;
      }
    }

    switchPolicyAndLoad(newPolicy) {
      const select = document.getElementById('cryptoPolicySelect');
      if (select) select.value = newPolicy;
      this.currentPolicy = newPolicy;
      this.navigateTo(this.currentDomain);
    }

    renderError(domain, errMsg) {
      const container = document.getElementById('viewportContent');
      if (container) {
        container.innerHTML = `
          <div class="site-preview-hero">
            <span class="site-badge danger-badge">PROBE ERROR</span>
            <h2>Failed to Inspect ${domain}</h2>
            <p style="color: var(--danger-crimson);">${errMsg}</p>
          </div>
        `;
      }
    }
  }

  window.AppController = new BrowserApp();
  document.addEventListener('DOMContentLoaded', () => {
    window.AppController.init();
  });
})();
