// Component 1: Live PQC Trust Radar & Cryptographic Inspector
(function() {
  class TrustRadar {
    constructor() {
      this.canvas = null;
      this.ctx = null;
      this.sweepAngle = 0;
      this.animationFrame = null;
      this.currentData = null;
      this.blips = [];
      this.hoveredBlip = null;
    }

    init() {
      this.canvas = document.getElementById('radarCanvas');
      if (!this.canvas) return;
      this.ctx = this.canvas.getContext('2d');
      this.resize();

      window.addEventListener('resize', () => this.resize());

      // Mouse interaction for blips
      this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
      this.canvas.addEventListener('mouseleave', () => { this.hoveredBlip = null; });

      this.startAnimation();
    }

    resize() {
      if (!this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      this.canvas.width = rect.width * dpr;
      this.canvas.height = rect.height * dpr;
      this.ctx.scale(dpr, dpr);
    }

    updateData(data) {
      this.currentData = data;
      this.generateBlips(data);
      this.updateUI(data);
    }

    generateBlips(data) {
      this.blips = [];
      const rect = this.canvas.getBoundingClientRect();
      const radius = rect.width / 2;

      // Classify main origin zone
      let mainDistRatio = 0.85; // Classical (outer)
      let mainColor = '#ff0054';
      if (data.keyExchangeType === 'pure-pqc') {
        mainDistRatio = 0.22; // Native PQC (inner)
        mainColor = '#05ffa1';
      } else if (data.keyExchangeType === 'hybrid') {
        mainDistRatio = 0.52; // Hybrid (middle)
        mainColor = '#00f5d4';
      }

      this.blips.push({
        id: 'main',
        name: data.title || 'Origin Target',
        type: data.keyExchangeType,
        status: data.status,
        angle: Math.PI * 0.25,
        distRatio: mainDistRatio,
        color: mainColor,
        isMain: true,
        size: 9
      });

      // Third party blips
      if (data.thirdParties && data.thirdParties.length) {
        data.thirdParties.forEach((tp, idx) => {
          let distRatio = tp.pqc ? 0.55 : 0.88;
          let color = tp.pqc ? '#00f5d4' : '#ff0054';
          let angle = (Math.PI * 0.7) + (idx * 1.1);

          this.blips.push({
            id: `tp-${idx}`,
            name: tp.domain,
            type: tp.mode,
            status: tp.mode,
            angle: angle % (Math.PI * 2),
            distRatio: distRatio,
            color: color,
            isMain: false,
            size: 6
          });
        });
      }
    }

    startAnimation() {
      const render = () => {
        this.draw();
        this.sweepAngle = (this.sweepAngle + 0.02) % (Math.PI * 2);
        this.animationFrame = requestAnimationFrame(render);
      };
      this.animationFrame = requestAnimationFrame(render);
    }

    draw() {
      if (!this.ctx || !this.canvas) return;
      const rect = this.canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;
      const cx = width / 2;
      const cy = height / 2;
      const maxR = (width / 2) - 10;

      this.ctx.clearRect(0, 0, width, height);

      // 1. Draw Concentric Radar Rings
      // Outer Ring: Classical Vulnerable
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, maxR, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(255, 0, 84, 0.25)';
      this.ctx.lineWidth = 1.5;
      this.ctx.stroke();

      // Middle Ring: Hybrid PQC
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, maxR * 0.68, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(0, 245, 212, 0.3)';
      this.ctx.stroke();

      // Inner Ring: Native PQC Core
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, maxR * 0.35, 0, Math.PI * 2);
      this.ctx.strokeStyle = 'rgba(5, 255, 161, 0.4)';
      this.ctx.stroke();

      // 2. Zone Labels
      this.ctx.font = '9px "JetBrains Mono", monospace';
      this.ctx.fillStyle = 'rgba(5, 255, 161, 0.7)';
      this.ctx.fillText('NATIVE PQC', cx - 28, cy - (maxR * 0.35) + 12);

      this.ctx.fillStyle = 'rgba(0, 245, 212, 0.6)';
      this.ctx.fillText('HYBRID KYBER', cx - 34, cy - (maxR * 0.68) + 12);

      this.ctx.fillStyle = 'rgba(255, 0, 84, 0.6)';
      this.ctx.fillText('CLASSICAL VULNERABLE', cx - 55, cy - maxR + 12);

      // 3. Grid Crosshairs
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy - maxR);
      this.ctx.lineTo(cx, cy + maxR);
      this.ctx.moveTo(cx - maxR, cy);
      this.ctx.lineTo(cx + maxR, cy);
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
      this.ctx.lineWidth = 1;
      this.ctx.stroke();

      // 4. Sweeping Beam & Phosphor Trail
      const sweepEndAngle = this.sweepAngle;
      const trailAngle = 0.45; // trail length in radians

      const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR);
      gradient.addColorStop(0, 'rgba(0, 245, 212, 0.3)');
      gradient.addColorStop(0.8, 'rgba(0, 245, 212, 0.08)');
      gradient.addColorStop(1, 'rgba(0, 245, 212, 0)');

      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.arc(cx, cy, maxR, sweepEndAngle - trailAngle, sweepEndAngle);
      this.ctx.closePath();
      this.ctx.fillStyle = gradient;
      this.ctx.fill();

      // Sweep leading beam line
      this.ctx.beginPath();
      this.ctx.moveTo(cx, cy);
      this.ctx.lineTo(cx + Math.cos(sweepEndAngle) * maxR, cy + Math.sin(sweepEndAngle) * maxR);
      this.ctx.strokeStyle = 'rgba(0, 245, 212, 0.85)';
      this.ctx.lineWidth = 2;
      this.ctx.shadowColor = '#00f5d4';
      this.ctx.shadowBlur = 8;
      this.ctx.stroke();
      this.ctx.shadowBlur = 0; // reset shadow

      // 5. Draw Blips
      this.blips.forEach(blip => {
        const bx = cx + Math.cos(blip.angle) * (maxR * blip.distRatio);
        const by = cy + Math.sin(blip.angle) * (maxR * blip.distRatio);
        blip.x = bx;
        blip.y = by;

        // Check if sweep beam is currently scanning past this blip
        let angleDiff = Math.abs(this.sweepAngle - blip.angle);
        if (angleDiff > Math.PI) angleDiff = (Math.PI * 2) - angleDiff;
        const isIlluminated = angleDiff < 0.25;

        // Outer glow
        this.ctx.beginPath();
        this.ctx.arc(bx, by, blip.size * (isIlluminated ? 2.2 : 1.5), 0, Math.PI * 2);
        this.ctx.fillStyle = blip.color.replace(')', ', 0.2)').replace('rgb', 'rgba').replace('#ff0054', 'rgba(255, 0, 84, 0.25)').replace('#00f5d4', 'rgba(0, 245, 212, 0.25)').replace('#05ffa1', 'rgba(5, 255, 161, 0.25)');
        this.ctx.fill();

        // Core Dot
        this.ctx.beginPath();
        this.ctx.arc(bx, by, blip.size, 0, Math.PI * 2);
        this.ctx.fillStyle = blip.color;
        this.ctx.shadowColor = blip.color;
        this.ctx.shadowBlur = isIlluminated ? 12 : 6;
        this.ctx.fill();
        this.ctx.shadowBlur = 0;

        // Blip Label
        this.ctx.font = '10px "JetBrains Mono", monospace';
        this.ctx.fillStyle = blip.isMain ? '#fff' : 'rgba(240, 244, 252, 0.7)';
        this.ctx.fillText(blip.name.substring(0, 16), bx + blip.size + 4, by + 3);
      });

      // 6. Draw tooltip if hovered
      if (this.hoveredBlip) {
        this.drawTooltip(this.hoveredBlip, cx, cy);
      }
    }

    handleMouseMove(e) {
      const rect = this.canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      let found = null;
      for (const blip of this.blips) {
        if (!blip.x || !blip.y) continue;
        const dist = Math.hypot(mx - blip.x, my - blip.y);
        if (dist < blip.size + 8) {
          found = blip;
          break;
        }
      }
      this.hoveredBlip = found;
    }

    drawTooltip(blip, cx, cy) {
      const tx = Math.min(Math.max(blip.x + 12, 20), this.canvas.width / (window.devicePixelRatio || 1) - 160);
      const ty = Math.min(Math.max(blip.y - 10, 20), this.canvas.height / (window.devicePixelRatio || 1) - 60);

      this.ctx.fillStyle = 'rgba(10, 15, 26, 0.95)';
      this.ctx.strokeStyle = blip.color;
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.roundRect(tx, ty, 150, 48, 6);
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.font = 'bold 11px "Outfit", sans-serif';
      this.ctx.fillStyle = '#fff';
      this.ctx.fillText(blip.name.substring(0, 18), tx + 8, ty + 18);

      this.ctx.font = '10px "JetBrains Mono", monospace';
      this.ctx.fillStyle = blip.color;
      this.ctx.fillText(`Mode: ${blip.status}`, tx + 8, ty + 36);
    }

    updateUI(data) {
      // 1. Update Score Dial
      const scoreNumber = document.getElementById('scoreNumber');
      const scoreProgress = document.getElementById('scoreProgress');
      const scoreHeadline = document.getElementById('scoreHeadline');
      const scoreDesc = document.getElementById('scoreDesc');
      const scoreCard = document.getElementById('scoreSummaryCard');

      if (scoreNumber) scoreNumber.textContent = data.score;
      if (scoreProgress) {
        // Circumference of r=34 circle is ~213.6
        const circumference = 213.6;
        const offset = circumference - (circumference * (data.score / 100));
        scoreProgress.style.strokeDashoffset = offset;

        if (data.score >= 90) {
          scoreProgress.style.stroke = 'var(--quantum-emerald)';
          if (scoreCard) scoreCard.className = 'score-summary-card pqc';
        } else if (data.score >= 70) {
          scoreProgress.style.stroke = 'var(--quantum-cyan)';
          if (scoreCard) scoreCard.className = 'score-summary-card';
        } else {
          scoreProgress.style.stroke = 'var(--danger-crimson)';
          if (scoreCard) scoreCard.className = 'score-summary-card classical';
        }
      }

      if (scoreHeadline) scoreHeadline.textContent = `${data.status} Posture`;
      if (scoreDesc) {
        scoreDesc.textContent = data.keyExchangeType === 'classical'
          ? 'Harvest-Now-Decrypt-Later vulnerability active. Encrypted traffic can be stored today and broken once CRQC is available.'
          : 'Hybrid post-quantum key exchange active. Forward secrecy is protected against Shor\'s algorithm.';
      }

      // 2. Update Cryptographic Breakdown Fields
      this.setText('kemAlgName', data.keyExchange);
      this.setText('kemNistLevel', `NIST Category ${data.nistLevel || 0}`);
      this.setText('tlsCipherSuite', data.cipher);
      this.setText('certSigAlg', data.certSigAlg);
      this.setText('certKeyType', data.certKeyType);
      this.setText('certPqcStatus', data.certPqcStatus);
      this.setText('certIssuer', data.certIssuer || 'Verified CA');

      // 3. Update HNDL Warning Banner
      const hndlBanner = document.getElementById('hndlBanner');
      const hndlDesc = document.getElementById('hndlDesc');
      const hndlTimeline = document.getElementById('hndlTimeline');

      if (hndlBanner) {
        if (data.keyExchangeType === 'classical') {
          hndlBanner.className = 'hndl-banner';
          this.setText('hndlTitle', 'HARVEST-NOW-DECRYPT-LATER CRITICAL HAZARD');
          if (hndlDesc) hndlDesc.textContent = data.hndlRisk;
          if (hndlTimeline) hndlTimeline.innerHTML = `<strong>Adversary Horizon:</strong> ${data.hndlHorizon}`;
        } else {
          hndlBanner.className = 'hndl-banner safe';
          this.setText('hndlTitle', 'QUANTUM-SAFE FORWARD SECRECY ENGAGED');
          if (hndlDesc) hndlDesc.textContent = data.hndlRisk;
          if (hndlTimeline) hndlTimeline.innerHTML = `<strong>Quantum Horizon:</strong> ${data.hndlHorizon}`;
        }
      }

      // 4. Update Omnibox Security Pill
      const secPill = document.getElementById('omniboxSecurityPill');
      if (secPill) {
        if (data.keyExchangeType === 'pure-pqc') {
          secPill.className = 'omnibox-security-pill security-pill-pqc';
          secPill.textContent = '🛡️ PQC-NATIVE';
        } else if (data.keyExchangeType === 'hybrid') {
          secPill.className = 'omnibox-security-pill security-pill-hybrid';
          secPill.textContent = '🔒 HYBRID PQC';
        } else {
          secPill.className = 'omnibox-security-pill security-pill-classical';
          secPill.textContent = '⚠️ CLASSICAL';
        }
      }

      // 5. Update Third-Party Inspection List
      const tpListContainer = document.getElementById('thirdPartyList');
      if (tpListContainer && data.thirdParties) {
        tpListContainer.innerHTML = data.thirdParties.map(tp => `
          <div class="tp-item">
            <span class="tp-item-domain">${tp.domain}</span>
            <span class="card-badge ${tp.pqc ? 'good' : 'bad'}">${tp.mode}</span>
          </div>
        `).join('');
      }
    }

    setText(elementId, text) {
      const el = document.getElementById(elementId);
      if (el) el.textContent = text || 'N/A';
    }
  }

  window.TrustRadar = new TrustRadar();
})();
