// Component 4: Energy & Sustainability Benchmarking Dashboard
(function() {
  class SustainabilityDashboard {
    constructor() {
      this.currentMode = 'balanced';
      this.benchmarks = null;
    }

    init() {
      this.loadBenchmarkData();
      this.bindEvents();
      this.startTelemetryPolling();
    }

    async startTelemetryPolling() {
      const poll = async () => {
        try {
          const res = await fetch('/api/telemetry');
          const data = await res.json();
          if (data && data.recommendedProfile) {
            this.handleTelemetryScaling(data);
          }
        } catch (e) {
          // ignore network polling error
        }
      };
      await poll();
      setInterval(poll, 5000);
    }

    handleTelemetryScaling(telemetry) {
      const badge = document.getElementById('hwTelemetryBadge');
      if (badge) {
        badge.textContent = `⚡ Battery: ${telemetry.batteryLevel}% | ${telemetry.onAcPower ? 'AC Power' : 'Battery Mode'} | Target: ${telemetry.recommendedProfile}`;
      }

      if (!telemetry.onAcPower || telemetry.batteryLevel < 20) {
        if (this.currentMode !== 'eco') {
          console.log('⚡ Hardware Telemetry Adaptive Scaling Engaged: Switching to Eco-PQC Mode');
          const select = document.getElementById('sustainabilityModeSelect');
          if (select) select.value = 'eco';
          this.currentMode = 'eco';
          this.updateMetrics();
        }
      }
    }

    async loadBenchmarkData() {
      try {
        const res = await fetch('/api/sustainability/benchmarks');
        this.benchmarks = await res.json();
      } catch (e) {
        console.warn('Using local benchmark data');
      }
      this.updateMetrics();
    }

    bindEvents() {
      const modeSelect = document.getElementById('sustainabilityModeSelect');
      if (modeSelect) {
        modeSelect.addEventListener('change', (e) => {
          this.currentMode = e.target.value;
          this.updateMetrics();
        });
      }

      const trafficSlider = document.getElementById('globalTrafficSlider');
      if (trafficSlider) {
        trafficSlider.addEventListener('input', (e) => {
          const count = parseInt(e.target.value);
          this.updateScaleSimulation(count);
        });
      }
    }

    updateMetrics() {
      // Configuration per mode
      const modes = {
        'eco': {
          kem: 'ML-KEM-512',
          sig: 'Falcon-512',
          kemBytes: 1568, // pk + ct
          sigBytes: 1563, // pk + sig
          energyPerHandshakeUj: 66.5,
          memoryKb: 340,
          carbonPer1kGrams: 0.007
        },
        'balanced': {
          kem: 'X25519MLKEM768',
          sig: 'ML-DSA-65',
          kemBytes: 2336,
          sigBytes: 5261,
          energyPerHandshakeUj: 134.0,
          memoryKb: 780,
          carbonPer1kGrams: 0.014
        },
        'maximum': {
          kem: 'ML-KEM-1024',
          sig: 'ML-DSA-87',
          kemBytes: 3136,
          sigBytes: 7219,
          energyPerHandshakeUj: 192.2,
          memoryKb: 1420,
          carbonPer1kGrams: 0.021
        }
      };

      const selected = modes[this.currentMode] || modes['balanced'];

      // Update Quad Metrics
      this.setText('meterEnergyVal', `${selected.energyPerHandshakeUj.toFixed(1)} µJ`);
      this.setText('meterMemoryVal', `${selected.memoryKb} KB`);
      this.setText('meterPacketVal', `${(selected.kemBytes + selected.sigBytes).toLocaleString()} B`);
      this.setText('meterCarbonVal', `${selected.carbonPer1kGrams.toFixed(4)} g`);

      // Update packet bars relative to scale (max ~8000 B)
      const maxB = 8000;
      this.setBarWidth('barFillKyber', (selected.kemBytes / maxB) * 100);
      this.setBarWidth('barFillX25519', (64 / maxB) * 100);
      this.setBarWidth('barFillRsa', (768 / maxB) * 100);

      this.setText('barValKyber', `${selected.kemBytes} B (Lattice KEM)`);
      this.setText('barValX25519', `64 B (Classical ECC)`);
      this.setText('barValRsa', `768 B (Classical RSA-3072)`);

      const slider = document.getElementById('globalTrafficSlider');
      const trafficCount = slider ? parseInt(slider.value) : 10000000;
      this.updateScaleSimulation(trafficCount);
    }

    updateScaleSimulation(dailySessions) {
      const millions = (dailySessions / 1000000).toFixed(0);
      this.setText('sliderTrafficLabel', `${millions}M Daily Sessions`);

      // Calculate annual carbon emissions for chosen configuration
      // Classical RSA equivalent consumes ~310 µJ + high server CPU verification
      const rsaDailyEnergyJoules = (dailySessions * 310) / 1000000;
      const modesEnergy = {
        'eco': (dailySessions * 66.5) / 1000000,
        'balanced': (dailySessions * 134) / 1000000,
        'maximum': (dailySessions * 192.2) / 1000000
      };

      const currentEnergyJoules = modesEnergy[this.currentMode];
      const energyDeltaJoules = rsaDailyEnergyJoules - currentEnergyJoules;
      const kwhSavedDaily = energyDeltaJoules / 3600000;
      const annualKgCo2Saved = (kwhSavedDaily * 365 * 0.38).toFixed(1);

      this.setText('simCarbonSaved', `${annualKgCo2Saved} kg CO₂e`);
      this.setText('simEnergySaved', `${(kwhSavedDaily * 365).toFixed(1)} kWh/yr`);
    }

    setText(id, text) {
      const el = document.getElementById(id);
      if (el) el.textContent = text;
    }

    setBarWidth(id, pct) {
      const el = document.getElementById(id);
      if (el) el.style.width = `${Math.min(100, Math.max(2, pct))}%`;
    }
  }

  window.SustainabilityMeter = new SustainabilityDashboard();
})();
