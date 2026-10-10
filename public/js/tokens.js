// Component 3: Anonymous Token Login (Privacy Pass / Blind PQC Signatures)
(function() {
  class AnonymousTokenVault {
    constructor() {
      this.spendableTokens = [];
      this.redeemedHistory = [];
      this.issuerEndpoint = '/api/tokens/blind-sign';
    }

    init() {
      // Pre-seed vault with 3 anonymous privacy tokens
      this.mintDefaultTokens();
      this.bindEvents();
    }

    async mintDefaultTokens() {
      for (let i = 0; i < 3; i++) {
        await this.generateBlindedToken(false);
      }
      this.updateUI();
    }

    bindEvents() {
      const btnMint = document.getElementById('btnMintTokens');
      if (btnMint) {
        btnMint.addEventListener('click', () => this.generateBlindedToken(true));
      }

      // Expose globally for interactive in-viewport demo button
      window.triggerTokenRedeem = () => this.redeemTokenForCurrentSite();
    }

    async generateBlindedToken(showToastNotify = true) {
      const rawNonce = 'NONCE-0x' + Math.floor(Math.random() * 0xFFFFFFFFFF).toString(16).toUpperCase();
      const blindFactor = 'BLIND-SCALAR-0x' + Math.floor(Math.random() * 0xFFFFFF).toString(16).toUpperCase();
      const blindedDigest = 'BLIND-DIGEST-' + btoa(rawNonce + ':' + blindFactor).substring(0, 24);

      try {
        const res = await fetch(this.issuerEndpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blindedDigest,
            clientSessionNonce: rawNonce
          })
        });

        const data = await res.json();
        
        // Client unblinds signature locally
        const unblindedToken = 'TOKEN-MLDSA-' + Math.floor(Math.random() * 0xFFFFFFFFFF).toString(16).toUpperCase();
        const tokenItem = {
          id: unblindedToken,
          nonce: rawNonce,
          blindSignature: data.blindSignature,
          algorithm: data.algorithm,
          issuedAt: new Date().toLocaleTimeString(),
          status: 'SPENDABLE'
        };

        this.spendableTokens.push(tokenItem);
        this.updateUI();

        if (showToastNotify && window.EphemeralIdentity) {
          window.EphemeralIdentity.showToast(`Minted 1 Blinded ML-DSA Privacy Pass. Unlinkable token stored in vault.`);
        }
      } catch (err) {
        console.error('Failed to issue blind token:', err);
      }
    }

    async redeemTokenForCurrentSite() {
      if (this.spendableTokens.length === 0) {
        if (window.EphemeralIdentity) {
          window.EphemeralIdentity.showToast('No spendable anonymous tokens in vault! Click "Mint Blind Tokens" first.');
        }
        return;
      }

      const tokenToSpend = this.spendableTokens.pop();
      const activeUrl = window.AppController ? window.AppController.currentDomain : 'pq.cloudflareresearch.com';

      // Highlight step 4 in workflow visualizer
      this.highlightStep(4);

      try {
        const res = await fetch('/api/tokens/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            unblindedToken: tokenToSpend.id,
            tokenProof: `ZK-PROOF-DILITHIUM-${tokenToSpend.id.substring(6)}`,
            targetDomain: activeUrl
          })
        });

        const grant = await res.json();
        if (grant.success) {
          this.redeemedHistory.push({
            domain: activeUrl,
            grantId: grant.grantId,
            time: new Date().toLocaleTimeString()
          });

          this.updateUI();

          if (window.EphemeralIdentity) {
            window.EphemeralIdentity.showToast(`✓ Access Granted via Anonymous Token! Zero cookies or tracking traces left.`);
          }

          // Update site preview to reflect authenticated anonymous state
          const demoCard = document.querySelector('.interactive-demo-card');
          if (demoCard) {
            demoCard.innerHTML = `
              <div style="background: rgba(5, 255, 161, 0.1); border: 1px solid var(--quantum-emerald); border-radius: 6px; padding: 12px;">
                <h4 style="color: var(--quantum-emerald); margin-bottom: 4px;">✓ Anonymous Access Granted</h4>
                <p style="font-size: 12px; color: #fff;">Authenticated via Blind ML-DSA Token. Grant: <strong>${grant.grantId}</strong></p>
                <p style="font-size: 11px; color: var(--text-muted); margin-top: 4px;">Zero-Knowledge verified. Persistent identity: UNEXPOSED.</p>
              </div>
            `;
          }
        }
      } catch (err) {
        console.error('Redeem error:', err);
      }
    }

    highlightStep(stepNum) {
      for (let i = 1; i <= 4; i++) {
        const el = document.getElementById(`wfStep${i}`);
        if (el) {
          if (i === stepNum) el.classList.add('active');
          else el.classList.remove('active');
        }
      }
    }

    updateUI() {
      const badge = document.getElementById('tokenVaultCount');
      if (badge) badge.textContent = `${this.spendableTokens.length} Spendable`;

      const listContainer = document.getElementById('tokenVaultList');
      if (listContainer) {
        if (this.spendableTokens.length === 0) {
          listContainer.innerHTML = `<div style="font-size: 11px; color: var(--text-dim); text-align: center; padding: 10px;">Vault empty. Mint blinded tokens below.</div>`;
        } else {
          listContainer.innerHTML = this.spendableTokens.slice(-3).map(tok => `
            <div style="display: flex; justify-content: space-between; align-items: center; background: rgba(255,255,255,0.03); border: 1px solid var(--border-subtle); border-radius: 6px; padding: 6px 10px; font-size: 11px; margin-bottom: 6px;">
              <span style="font-family: var(--font-mono); color: var(--quantum-cyan);">${tok.id.substring(0, 18)}...</span>
              <span style="color: var(--quantum-emerald); font-weight: 600;">READY</span>
            </div>
          `).join('');
        }
      }
    }
  }

  window.AnonymousTokens = new AnonymousTokenVault();
})();
