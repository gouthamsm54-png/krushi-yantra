/**
 * One Acre Intelligent Farm - Master Application Controller
 * Handles live clock, 8-zone interactive map & modal drawer, irrigation controls,
 * AI plant health scanner, alert filtering, and telemetry updates.
 */

const App = {
  selectedZone: null,
  activeFilter: "all",
  _initialized: false,

  init() {
    if (this._initialized) return;
    this._initialized = true;

    if (window.TRANSLATIONS) window.TRANSLATIONS.initLanguage();
    if (window.VoiceAssistant) window.VoiceAssistant.init();

    this.startLiveClock();
    this.renderOverviewCards();
    this.render8ZoneFarmMap();
    this.renderCropIntelligenceTable();
    this.renderIrrigationPanel();
    this.renderPlantHealthSection();
    this.initPestDoctor();
    this.renderWeatherSection();
    this.renderEconomicsSection();
    this.renderAlerts();
    this.renderPostHarvestSection();
    this.calculateWasteOutput();
    this.bindSidebarNav();
    this.bindModals();
    this.bindIrrigationActions();

    // Initialize sub-modules
    if (window.FarmCharts) {
      window.FarmCharts.init();
      setTimeout(() => window.FarmCharts.renderAllCharts(), 250);
      setTimeout(() => window.FarmCharts.renderAllCharts(), 1000);
    }
    if (window.SoilAnalysis) {
      window.SoilAnalysis.init();
    }
    if (window.CropReplanning) {
      window.CropReplanning.init();
    }
    if (window.FarmSecurity) window.FarmSecurity.init();
    if (window.IoTBridge) {
      window.IoTBridge.init();
      window.IoTBridge.onDataReceived((data) => this.handleTelemetryUpdate(data));
    }
  },

  // 1. Live Date & Time Clock
  startLiveClock() {
    const clockEl = document.getElementById("live-datetime");
    const update = () => {
      const now = new Date();
      const options = { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' };
      if (clockEl) clockEl.textContent = now.toLocaleDateString('en-US', options);
    };
    update();
    setInterval(update, 1000);
  },

  // 2. Farm Overview Cards
  renderOverviewCards() {
    const ov = ONE_ACRE_FARM.overview;
    this.setText("ov-total-zones", ov.totalZones);
    this.setText("ov-healthy-zones", `${ov.healthyZones}/${ov.totalZones}`);
    this.setText("ov-avg-moisture", `${ov.avgSoilMoisture}%`);
    this.setText("ov-avg-temp", `${ov.avgTemperature}°C`);
    this.setText("ov-tank-level", `${ov.waterTankLevel}%`);
    this.setText("ov-pump-status", ov.pumpStatus);
    this.setText("ov-water-usage", `${ov.todayWaterUsage} L`);
    this.setText("ov-active-alerts", ov.activeAlertsCount);

    const pumpPill = document.getElementById("ov-pump-pill");
    if (pumpPill) {
      if (ov.pumpStatus === "ON") {
        pumpPill.className = "metric-pill pill-active-pump";
        pumpPill.innerHTML = `<span class="pulse-dot active"></span> Pumping (Zone 04)`;
      } else {
        pumpPill.className = "metric-pill pill-idle";
        pumpPill.innerHTML = `<span class="pulse-dot idle"></span> Pump Idle`;
      }
    }
  },

  // 3. 8-Zone Interactive Farm Map (2 rows x 4 columns)
  render8ZoneFarmMap() {
    const container = document.getElementById("farm-zones-grid");
    if (!container) return;

    container.innerHTML = ONE_ACRE_FARM.zones.map(z => {
      let statusBadgeColor = "badge-healthy";
      let statusIndicatorColor = "#16a34a";
      if (z.statusClass === "attention") {
        statusBadgeColor = "badge-attention";
        statusIndicatorColor = "#f59e0b";
      } else if (z.statusClass === "critical") {
        statusBadgeColor = "badge-critical";
        statusIndicatorColor = "#ef4444";
      }

      const isIrrigating = z.irrigationStatus.includes("IRRIGATING");

      return `
        <div class="zone-plot-card ${z.statusClass} ${isIrrigating ? 'irrigating-active' : ''}" 
             onclick="App.openZoneSoilProfile('${z.id}')"
             title="Click to inspect soil fertility & telemetry for ${z.name}">
          
          <div class="zone-card-header">
            <div class="zone-id-badge">
              <span class="zone-pin-indicator" style="background:${statusIndicatorColor};"></span>
              <span class="zone-num-label">ZONE ${z.number}</span>
            </div>
            <span class="zone-status-badge ${statusBadgeColor}">${z.status}</span>
            <button class="btn-read-aloud" style="margin-left:auto; padding:2px 8px; font-size:0.72rem;" onclick="event.stopPropagation(); VoiceAssistant.speakZone('${z.id}');" title="Listen to plot details / इस ज़ोन की आवाज़ सुनें">
              🔊
            </button>
          </div>

          <div class="zone-crop-info">
            <h3 class="zone-crop-title">${z.crop}</h3>
            <div class="zone-recommended-sub">Recommended: ${z.recommendedCrop}</div>
          </div>

          <div class="zone-metrics-row">
            <div class="zone-metric-box">
              <span class="z-label">Soil Moisture</span>
              <div class="z-val-flex">
                <span class="z-val ${z.soilMoisture < 30 ? 'text-danger' : 'text-success'}">${z.soilMoisture}%</span>
                <div class="mini-bar-track">
                  <div class="mini-bar-fill" style="width:${z.soilMoisture}%; background:${statusIndicatorColor};"></div>
                </div>
              </div>
            </div>

            <div class="zone-metric-box">
              <span class="z-label">Irrigation</span>
              <span class="z-val ${isIrrigating ? 'text-primary-water pulse-text' : 'text-muted'}">
                ${isIrrigating ? '💧 ACTIVE' : z.irrigationStatus}
              </span>
            </div>

            <div class="zone-metric-box">
              <span class="z-label">Plant Health</span>
              <span class="z-val text-success">${z.plantHealth}%</span>
            </div>
          </div>

          <div class="zone-card-footer">
            <span class="inspect-btn-text">🌱 Inspect Soil Fertility Profile & Telemetry →</span>
          </div>
        </div>
      `;
    }).join("");
  },

  // Open Dedicated Soil Analysis & Fertility Profile for a specific zone
  openZoneSoilProfile(zoneId) {
    this.closeZoneModal();
    if (window.SoilAnalysis) {
      SoilAnalysis.selectZone(zoneId, true);
    } else {
      this.openZoneModal(zoneId);
    }
  },

  // Open Detailed Modal for a specific zone
  openZoneModal(zoneId) {
    const zone = ONE_ACRE_FARM.zones.find(z => z.id === zoneId);
    if (!zone) return;
    this.selectedZone = zone;

    this.setText("modal-zone-title", `${zone.name}`);
    this.setText("modal-crop-name", zone.crop);
    this.setText("modal-recommended", zone.recommendedCrop);
    this.setText("modal-suitability", `${zone.suitability}% Match`);
    this.setText("modal-status", zone.status);
    this.setText("modal-soil-moisture", `${zone.soilMoisture}% (Target: ${zone.targetMoisture}%)`);
    this.setText("modal-soil-temp", `${zone.soilTemp}°C`);
    this.setText("modal-air-temp", `${zone.airTemp}°C`);
    this.setText("modal-humidity", `${zone.humidity}%`);
    this.setText("modal-ph", `${zone.soilPh}`);
    this.setText("modal-ec", `${zone.ec} dS/m`);
    this.setText("modal-water-req", zone.waterRequirement);
    this.setText("modal-irrigation-status", zone.irrigationStatus);
    this.setText("modal-growth-stage", `${zone.growthStage} (DAS: ${zone.das})`);
    this.setText("modal-plant-health", `${zone.plantHealth}%`);
    this.setText("modal-disease-risk", `${zone.diseaseRisk}% (${zone.diseaseRisk > 10 ? 'Moderate' : 'Low'})`);
    this.setText("modal-water-stress", zone.waterStress);
    this.setText("modal-nutrient-stress", zone.nutrientStress);
    this.setText("modal-yield", `${zone.estimatedYield} (Est. Revenue: ${zone.estimatedRevenue})`);
    this.setText("modal-next-irrigation", zone.nextIrrigationTime);
    this.setText("modal-npk", `N: ${zone.npk.n} ppm | P: ${zone.npk.p} ppm | K: ${zone.npk.k} ppm`);

    const modalBackdrop = document.getElementById("zone-details-modal");
    if (modalBackdrop) {
      modalBackdrop.classList.add("modal-open");
    }
  },

  closeZoneModal() {
    const modalBackdrop = document.getElementById("zone-details-modal");
    if (modalBackdrop) {
      modalBackdrop.classList.remove("modal-open");
    }
  },

  // 4. Crop & Soil Intelligence Section
  renderCropIntelligenceTable() {
    const container = document.getElementById("crop-intel-grid");
    if (!container) return;

    container.innerHTML = ONE_ACRE_FARM.zones.map(z => `
      <div class="crop-intel-card">
        <div class="intel-header">
          <div class="intel-zone-tag">Zone ${z.number}</div>
          <span class="suitability-pill">${z.suitability}% Suitability</span>
        </div>
        <div class="intel-crops">
          <div class="current-crop"><strong>Current:</strong> ${z.crop}</div>
          <div class="recommended-crop"><strong>AI Recommends:</strong> ${z.recommendedCrop}</div>
        </div>
        <div class="intel-metrics-grid">
          <div class="intel-col">
            <span class="meta-label">Growth Stage</span>
            <span class="meta-val">${z.growthStage}</span>
          </div>
          <div class="intel-col">
            <span class="meta-label">DAS / Harvest</span>
            <span class="meta-val">${z.das} days (${z.expectedHarvest})</span>
          </div>
          <div class="intel-col">
            <span class="meta-label">Water Demand</span>
            <span class="meta-val">${z.waterRequirement}</span>
          </div>
          <div class="intel-col">
            <span class="meta-label">Est. Yield</span>
            <span class="meta-val" style="color:var(--primary-dark); font-weight:700;">${z.estimatedYield}</span>
          </div>
        </div>

        <!-- Soil telemetry gauge summary for zone -->
        <div class="intel-soil-strip">
          <div class="soil-bar-item">
            <span>Moisture: <strong>${z.soilMoisture}%</strong></span>
            <div class="strip-track"><div class="strip-fill" style="width:${z.soilMoisture}%; background:var(--primary);"></div></div>
          </div>
          <div class="soil-bar-item">
            <span>Soil pH: <strong>${z.soilPh}</strong></span>
            <div class="strip-track"><div class="strip-fill" style="width:${(z.soilPh/14)*100}%; background:#0284c7;"></div></div>
          </div>
          <div class="soil-bar-item">
            <span>EC: <strong>${z.ec} dS/m</strong></span>
            <div class="strip-track"><div class="strip-fill" style="width:${(z.ec/2.5)*100}%; background:#8b5cf6;"></div></div>
          </div>
        </div>
      </div>
    `).join("");
  },

  // 5. Smart Irrigation Section
  renderIrrigationPanel() {
    const ir = ONE_ACRE_FARM.irrigation;
    this.setText("irrig-pump-state", ir.pumpStatus);
    this.setText("irrig-mode-state", `${ir.pumpMode} MODE`);
    this.setText("irrig-tank-level", `${ir.waterTankPercent}% (${ir.waterTankLiters.toLocaleString()} L)`);
    this.setText("irrig-current-zone", ir.currentZone);
    this.setText("irrig-soil-moisture", `${ir.currentMoisture}%`);
    this.setText("irrig-target-moisture", `${ir.targetMoisture}%`);
    this.setText("irrig-water-supplied", `${ir.waterSuppliedNow} L / ${ir.waterTargetNow} L`);
    this.setText("irrig-duration", `${ir.durationMinutes} min (${ir.totalScheduledMinutes - ir.durationMinutes} min left)`);
    this.setText("irrig-today-cons", `${ir.todayConsumption} L`);
    this.setText("irrig-week-cons", `${ir.weeklyConsumption} L`);
    this.setText("irrig-next-zone", ir.nextZone);
    this.setText("irrig-next-water", `${ir.nextEstimatedWater} L`);
    this.setText("irrig-explanation-text", `“${ir.explanation}”`);

    const tankFill = document.getElementById("water-tank-progress");
    if (tankFill) tankFill.style.width = `${ir.waterTankPercent}%`;

    const flowAnim = document.getElementById("pump-flow-animation");
    if (flowAnim) {
      if (ir.pumpStatus === "ON") {
        flowAnim.classList.add("flowing-active");
      } else {
        flowAnim.classList.remove("flowing-active");
      }
    }
  },

  bindIrrigationActions() {
    const btnAuto = document.getElementById("btn-irrig-auto");
    const btnManual = document.getElementById("btn-irrig-manual");
    const btnStart = document.getElementById("btn-irrig-start");
    const btnStop = document.getElementById("btn-irrig-stop");

    if (btnAuto) {
      btnAuto.addEventListener("click", () => {
        ONE_ACRE_FARM.irrigation.pumpMode = "AUTO";
        btnAuto.classList.add("btn-active-mode");
        btnManual?.classList.remove("btn-active-mode");
        this.showToast("Smart Irrigation set to AUTO Closed-Loop Mode");
        this.renderIrrigationPanel();
      });
    }

    if (btnManual) {
      btnManual.addEventListener("click", () => {
        ONE_ACRE_FARM.irrigation.pumpMode = "MANUAL";
        btnManual.classList.add("btn-active-mode");
        btnAuto?.classList.remove("btn-active-mode");
        this.showToast("Manual Irrigation Override Enabled");
        this.renderIrrigationPanel();
      });
    }

    if (btnStart) {
      btnStart.addEventListener("click", () => {
        ONE_ACRE_FARM.irrigation.pumpStatus = "ON";
        ONE_ACRE_FARM.overview.pumpStatus = "ON";
        ONE_ACRE_FARM.irrigation.explanation = "Pump started manually. Hydrating selected solenoid line.";
        this.showToast("⚡ Sub-Surface Pump Started: Water delivery active");
        this.renderOverviewCards();
        this.renderIrrigationPanel();
        this.render8ZoneFarmMap();
      });
    }

    if (btnStop) {
      btnStop.addEventListener("click", () => {
        ONE_ACRE_FARM.irrigation.pumpStatus = "OFF";
        ONE_ACRE_FARM.overview.pumpStatus = "OFF";
        ONE_ACRE_FARM.irrigation.explanation = "Pump halted by operator override. All zone solenoids closed.";
        this.showToast("🛑 Sub-Surface Pump Stopped. Standby mode active.");
        this.renderOverviewCards();
        this.renderIrrigationPanel();
        this.render8ZoneFarmMap();
      });
    }
  },

  // 6. Plant Health Section
  renderPlantHealthSection() {
    const ph = ONE_ACRE_FARM.plantHealth;
    this.setText("ph-overall-val", `${ph.overallHealthPercent}%`);
    this.setText("ph-growth-status", ph.growthStatus);
    this.setText("ph-water-stress", ph.waterStress);
    this.setText("ph-nutrient-stress", ph.nutrientStress);
    this.setText("ph-disease-risk", `${ph.diseaseRisk}%`);
    this.setText("ph-pest-risk", `${ph.pestRisk}%`);
    this.setText("ph-ai-observation", ph.aiObservation);
    this.setText("ph-ai-confidence", `${ph.aiConfidence}%`);
    this.setText("ph-recommended-action", ph.recommendedAction);
    this.setText("ph-disclaimer", ph.disclaimer);

    const healthBar = document.getElementById("overall-health-fill");
    if (healthBar) healthBar.style.width = `${ph.overallHealthPercent}%`;
  },

  // 6B. AI Pest & Disease Attack Diagnosis & Organic Eradication Center
  currentPestAttack: null,
  isPestScanning: false,

  initPestDoctor() {
    if (!ONE_ACRE_FARM.pestDiseaseAttacks || ONE_ACRE_FARM.pestDiseaseAttacks.length === 0) return;
    this.currentPestAttack = ONE_ACRE_FARM.pestDiseaseAttacks[0];
    this.renderPestDiagnosticCard(this.currentPestAttack);
  },

  selectPestCase(pestId, btnElement) {
    const attack = ONE_ACRE_FARM.pestDiseaseAttacks.find(p => p.id === pestId);
    if (!attack) return;

    if (btnElement) {
      document.querySelectorAll(".pest-sample-btn").forEach(b => b.classList.remove("active"));
      btnElement.classList.add("active");
    }

    this.currentPestAttack = attack;
    this.runPestDiagnosisScan();
  },

  runPestDiagnosisScan(callback) {
    if (this.isPestScanning) return;
    this.isPestScanning = true;

    const laser = document.getElementById("pest-scan-laser");
    const statusPill = document.getElementById("pest-scan-status-pill");
    const statusText = document.getElementById("pest-status-text");
    const bbox = document.getElementById("pest-scan-bbox");
    const triggerBtn = document.getElementById("btn-trigger-pest-scan");

    if (triggerBtn) triggerBtn.disabled = true;
    if (laser) laser.style.display = "block";
    if (bbox) bbox.style.opacity = "0";
    if (statusPill) {
      statusPill.className = "pest-hud-pill status-analyzing";
      if (statusText) statusText.textContent = "AI Scanning Chlorophyll...";
    }

    // Audio or haptic feedback if supported
    if ("vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    setTimeout(() => {
      if (statusText) statusText.textContent = "Segmenting Pest & Lesion...";
      if (bbox) bbox.style.opacity = "1";
    }, 600);

    setTimeout(() => {
      if (laser) laser.style.display = "none";
      if (statusPill) {
        statusPill.className = "pest-hud-pill status-detected";
        if (statusText) statusText.textContent = "Attack Identified ✓";
      }
      this.isPestScanning = false;
      if (triggerBtn) triggerBtn.disabled = false;

      this.renderPestDiagnosticCard(this.currentPestAttack);

      if (callback) callback();
    }, 1200);
  },

  renderPestDiagnosticCard(pest) {
    if (!pest) return;

    const img = document.getElementById("pest-scan-image");
    if (img) img.src = pest.image;

    const previewLeaf = document.getElementById("leaf-camera-img");
    if (previewLeaf) previewLeaf.src = pest.image;

    this.setText("pest-bbox-label", `${pest.pestTypeIcon || '⚠️'} ${pest.pestTypeClassification} • ${pest.confidence}% Match`);
    this.setText("pest-hud-severity-tag", `Damage: ${pest.severity}`);
    this.setText("pest-name", pest.name);
    this.setText("pest-hindi-name", pest.hindiName || "");
    this.setText("pest-severity-pill", pest.severity);
    this.setText("pest-type-badge", `${pest.pestTypeIcon || '🐛'} ${pest.pestType}`);
    this.setText("pest-zone-badge", `🗺️ ${pest.zoneName}`);
    this.setText("pest-conf-badge", `🎯 ${pest.confidence}% AI Match`);

    this.setText("pest-organs", pest.targetOrgans || "Foliar and apical shoots");
    this.setText("pest-classification", pest.pestTypeClassification);
    this.setText("pest-symptoms", pest.symptoms);
    this.setText("pest-yield-risk", pest.yieldRisk);

    // Fast Organic Solution
    if (pest.organicSolution) {
      const sol = pest.organicSolution;
      this.setText("organic-title", sol.title);
      this.setText("organic-cert", sol.certification);
      this.setText("organic-summary", sol.summary);
      this.setText("organic-mode-of-action", sol.modeOfAction);
      this.setText("organic-cultural", sol.culturalBiocontrol);

      const stepsContainer = document.getElementById("pest-recipe-steps");
      if (stepsContainer && sol.recipe) {
        stepsContainer.innerHTML = sol.recipe.map((r, i) => `
          <div class="recipe-step-item">
            <div class="recipe-step-num">${i + 1}</div>
            <div class="recipe-step-content">
              <strong>${r.step}:</strong> ${r.detail}
            </div>
          </div>
        `).join("");
      }
    }

    // Estimated Eradication Timeline
    if (pest.eradication) {
      const era = pest.eradication;
      this.setText("eradication-time-text", era.estimatedTime);
      this.setText("quick-knockdown-badge", `⚡ ${era.quickKnockdown}`);

      const stagesGrid = document.getElementById("eradication-stages-grid");
      if (stagesGrid && era.stages) {
        stagesGrid.innerHTML = era.stages.map((st, i) => `
          <div class="stage-milestone-box">
            <div class="stage-timeframe">Stage ${i + 1} • ${st.timeframe}</div>
            <div class="stage-title">${st.title}</div>
            <div class="stage-desc">${st.desc}</div>
            <div class="stage-progress-track">
              <div class="stage-progress-fill" style="width: ${st.progress}%;"></div>
            </div>
          </div>
        `).join("");
      }
    }
  },

  applyOrganicRemedy() {
    if (!this.currentPestAttack) return;
    const pest = this.currentPestAttack;

    // Find and update the associated zone
    const targetZone = ONE_ACRE_FARM.zones.find(z => z.id === pest.zoneId);
    if (targetZone) {
      targetZone.status = "Recovering (Organic Protocol)";
      targetZone.statusClass = "attention";
      targetZone.diseaseRisk = Math.max(2, targetZone.diseaseRisk - 15);
      this.render8ZoneFarmMap();
    }

    // Add incident notification to Alert Center
    const alertId = `ALT-PEST-${Date.now().toString().slice(-4)}`;
    ONE_ACRE_FARM.alerts.unshift({
      id: alertId,
      severity: "warning",
      severityLabel: "Organic Remedy Applied",
      zone: pest.zoneName,
      time: "Just now",
      title: `Organic Protocol Applied for ${pest.name}`,
      description: `Target: ${pest.pestType}. Bio-remedy formulation [${pest.organicSolution.title}] applied. Estimated complete eradication in ${pest.eradication.estimatedTime}.`,
      action: `Scout zone in 24 hours to verify ${pest.eradication.quickKnockdown} knockdown progress.`,
      resolved: false
    });
    this.renderAlerts();
    this.renderOverviewCards();

    // Show interactive toast
    this.showToast(`🌿 Applied ${pest.organicSolution.title}! Eradication underway (${pest.eradication.estimatedTime}).`);

    // Voice utterance confirmation if requested
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`Organic bio-remedy protocol applied successfully on ${pest.zoneName}. Estimated problem eradication time is ${pest.eradication.estimatedTime}.`);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  },

  speakPestDiagnosis() {
    if (!("speechSynthesis" in window)) {
      this.showToast("Text-to-speech is not supported in this browser.");
      return;
    }

    const pest = this.currentPestAttack;
    if (!pest) return;

    window.speechSynthesis.cancel();

    const lang = (window.TRANSLATIONS && TRANSLATIONS.currentLang) || "en";
    let textToSpeak = "";

    if (lang === "hi") {
      textToSpeak = `प्लांट डॉक्टर निदान: ${pest.zoneName} में ${pest.hindiName || pest.name} की पहचान की गई है। यह ${pest.pestTypeClassification} है। जैविक उपचार: ${pest.organicSolution.title}। समस्या निवारण समय: ${pest.eradication.estimatedTime}।`;
    } else {
      textToSpeak = `Plant Doctor Diagnostic: Identified ${pest.name} on ${pest.zoneName}. Pest type classification: ${pest.pestTypeClassification}, ${pest.pestType}. Fast organic solution: ${pest.organicSolution.title}. Estimated problem eradication time: ${pest.eradication.estimatedTime}.`;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 1.0;

    const btn = document.getElementById("btn-listen-pest");
    if (btn) btn.classList.add("speaking");

    utterance.onend = () => {
      if (btn) btn.classList.remove("speaking");
    };

    window.speechSynthesis.speak(utterance);
  },

  printRecipeCard() {
    const pest = this.currentPestAttack;
    if (!pest) return;

    let modal = document.getElementById("recipe-card-modal");
    if (!modal) {
      modal = document.createElement("div");
      modal.id = "recipe-card-modal";
      modal.className = "recipe-card-modal-backdrop";
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="recipe-card-window">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:14px; border-bottom:2px solid var(--primary-border); padding-bottom:10px;">
          <div>
            <h3 style="font-family:var(--font-heading); color:var(--primary-deep); font-size:1.25rem;">🌿 100% Organic Farmer Prescription Card</h3>
            <div style="font-size:0.75rem; color:var(--text-secondary);">One Acre Intelligent Farm • Plant Health & Pest Defense</div>
          </div>
          <button onclick="document.getElementById('recipe-card-modal').classList.remove('open')" style="border:none; background:#f1f5f9; width:32px; height:32px; border-radius:50%; font-size:1.1rem; cursor:pointer;">&times;</button>
        </div>

        <div style="margin-bottom:12px;">
          <div style="font-size:0.75rem; text-transform:uppercase; color:var(--text-muted); font-weight:700;">Identified Target:</div>
          <div style="font-size:1.1rem; font-weight:800; color:var(--text-primary);">${pest.name} (${pest.hindiName || ''})</div>
          <div style="font-size:0.8rem; color:var(--danger); font-weight:600;">Type: ${pest.pestType} • ${pest.zoneName}</div>
        </div>

        <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:var(--radius-md); padding:14px; margin-bottom:14px;">
          <div style="font-size:0.75rem; font-weight:800; color:var(--primary-dark); text-transform:uppercase;">Remedy Name:</div>
          <div style="font-size:1rem; font-weight:800; color:var(--primary-deep);">${pest.organicSolution.title}</div>
          <div style="font-size:0.75rem; color:#15803d; margin-top:2px;">${pest.organicSolution.certification}</div>
        </div>

        <div style="margin-bottom:14px;">
          <strong style="font-size:0.82rem; color:var(--primary-deep);">Preparation & Application Instructions:</strong>
          <div style="margin-top:6px; display:flex; flex-direction:column; gap:8px;">
            ${pest.organicSolution.recipe.map((r, i) => `
              <div style="font-size:0.8rem; padding:8px; background:#f8fafc; border-radius:6px; border-left:3px solid var(--primary);">
                <strong>Step ${i + 1} (${r.step}):</strong> ${r.detail}
              </div>
            `).join("")}
          </div>
        </div>

        <div style="background:#eff6ff; border:1px solid #bfdbfe; border-radius:var(--radius-md); padding:12px; margin-bottom:16px;">
          <div style="font-size:0.75rem; color:#1e40af; font-weight:700;">⏱️ Problem Eradication Timeline:</div>
          <div style="font-size:0.95rem; font-weight:800; color:#0369a1; margin-top:2px;">${pest.eradication.estimatedTime}</div>
          <div style="font-size:0.76rem; color:#2563eb;">⚡ Immediate Knockdown: ${pest.eradication.quickKnockdown}</div>
        </div>

        <div style="display:flex; justify-content:flex-end; gap:10px;">
          <button onclick="window.print()" class="btn-irrig btn-mode" style="padding:8px 16px;">🖨️ Print Prescription</button>
          <button onclick="document.getElementById('recipe-card-modal').classList.remove('open')" class="btn-irrig btn-start" style="padding:8px 16px;">Done</button>
        </div>
      </div>
    `;

    modal.classList.add("open");
  },

  handleCustomLeafUpload(event) {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const customSample = {
        id: "custom_scanned_attack",
        name: "Cercospora Leaf Spot & Fungal Mycelium / Leaf Miner Larvae",
        hindiName: "सर्कोस्पोरा पर्ण चित्ती एवं लीफ माइनर कीट",
        crop: "Custom Uploaded Field Sample",
        zoneId: "zone-4",
        zoneName: "Field Foliage Camera Scan",
        image: e.target.result,
        confidence: 95.3,
        severity: "Moderate (27% Foliar Damage)",
        severityLevel: "warning",
        pestType: "Fungal Spores & Micro Leaf-Mining Larvae",
        pestTypeIcon: "🔬",
        pestTypeClassification: "Dual Fungal & Insect Tissue Invader",
        damagePattern: "Serpentine leaf tunnels combined with circular necrotic fungal halo spots",
        symptoms: "Whitish winding trails inside leaf mesophyll and expanding brown spots.",
        biologicalCause: "High leaf surface wetness (>8 hours) and warm ambient temperature.",
        yieldRisk: "15-20% photosynthesis reduction if tunnels expand across canopy.",
        organicSolution: {
          title: "Cold-Pressed Neem Oil (5ml/L) + Trichoderma viride + Bio-Soap Wash",
          certification: "🌱 100% Certified Organic • Zero Residue",
          summary: "Dual bio-fungicide and insect growth inhibitor halting leaf miners and fungal mycelium.",
          recipe: [
            { step: "Mix Bio-Fungicide", detail: "Dissolve 5 ml cold-pressed Neem Oil + 5g Trichoderma viride bio-powder in 1 Liter lukewarm water." },
            { step: "Add Liquid Emulsifier", detail: "Add 2 ml liquid castile or khadi coconut soap; shake vigorously until homogeneous milky suspension." },
            { step: "Morning Foliar Spray", detail: "Spray both leaf sides thoroughly at 07:00 AM before direct noon sun." }
          ],
          culturalBiocontrol: "Prune heavily infested leaves and dispose outside field. Hang yellow sticky cards at canopy height.",
          modeOfAction: "Azadirachtin penetrates leaf epidermis suffocating miner larvae; Trichoderma antagonizes fungal pathogens."
        },
        eradication: {
          estimatedTime: "3 to 5 Days",
          quickKnockdown: "24 Hours (Larval Mining Arrested)",
          timelineBadge: "⏱️ 3 - 5 Days for Total Eradication",
          stages: [
            { timeframe: "0 - 24 Hours", title: "Leaf Miner Feeding Cessation", desc: "Larvae ingest azadirachtin inside tunnels and halt feeding.", progress: 35 },
            { timeframe: "24 - 48 Hours", title: "Fungal Spore Antagonism", desc: "Trichoderma colonizes leaf surface, preventing halo spot spread.", progress: 75 },
            { timeframe: "72 - 120 Hours", title: "Full Containment & Clean Foliage", desc: "Lesions dry up, mines turn brown and dead; new clean foliage emerges.", progress: 100 }
          ]
        }
      };

      this.currentPestAttack = customSample;
      this.runPestDiagnosisScan();
      this.showToast("📷 Scanned custom leaf image successfully!");
    };
    reader.readAsDataURL(file);
  },

  inspectZonePestAttack(zoneId) {
    this.closeZoneModal();

    // Map zone to appropriate pest attack preset
    const matchingAttack = ONE_ACRE_FARM.pestDiseaseAttacks.find(p => p.zoneId === zoneId) || ONE_ACRE_FARM.pestDiseaseAttacks[0];

    const hub = document.getElementById("pest-eradication-hub");
    if (hub) {
      hub.scrollIntoView({ behavior: "smooth" });
    }

    const btn = document.querySelector(`.pest-sample-btn[data-pest-id="${matchingAttack.id}"]`);
    this.selectPestCase(matchingAttack.id, btn);
    this.showToast(`🔬 Inspecting Pest & Disease Attack for ${matchingAttack.zoneName}`);
  },

  simulateRandomAttack() {
    const attacks = ONE_ACRE_FARM.pestDiseaseAttacks;
    const currentIndex = attacks.findIndex(p => p.id === (this.currentPestAttack?.id || ""));
    const nextIndex = (currentIndex + 1) % attacks.length;
    const nextAttack = attacks[nextIndex];

    const btn = document.querySelector(`.pest-sample-btn[data-pest-id="${nextAttack.id}"]`);
    this.selectPestCase(nextAttack.id, btn);

    this.showToast(`🚨 New Attack Detected: ${nextAttack.name} in ${nextAttack.zoneName}!`);
  },

  // 7. Weather & Environment Section
  renderWeatherSection() {
    const w = ONE_ACRE_FARM.weather;
    this.setText("weather-temp", `${w.temperature}°C`);
    this.setText("weather-humidity", `${w.humidity}%`);
    this.setText("weather-rainfall", `${w.rainfallPast24h} mm`);
    this.setText("weather-wind", `${w.windSpeed} km/h ${w.windDirection}`);
    this.setText("weather-light", w.lightIntensity);
    this.setText("weather-rain-prob", `${w.rainProbability}%`);
    this.setText("weather-condition", w.weatherCondition);
    this.setText("weather-smart-message", `“${w.intelligentMessage}”`);
  },

  // 8. Farm Economics Section
  renderEconomicsSection() {
    const ec = ONE_ACRE_FARM.economics;
    const costListEl = document.getElementById("cultivation-cost-list");
    if (costListEl) {
      costListEl.innerHTML = ec.cultivationCosts.map(c => `
        <div class="cost-row">
          <span>${c.item}</span>
          <strong>₹${c.cost.toLocaleString()}</strong>
        </div>
      `).join("");
    }

    this.setText("eco-total-cost", `₹${ec.totalCultivationCost.toLocaleString()}`);
    this.setText("eco-total-yield", `${ec.totalEstimatedYieldKg.toLocaleString()} kg (14.45 T)`);
    this.setText("eco-total-revenue", `₹${ec.estimatedRevenue.toLocaleString()}`);
    this.setText("eco-net-return", `₹${ec.estimatedNetReturn.toLocaleString()}`);
    this.setText("eco-roi", `+${ec.roiPercent}% Return on Cost`);
  },

  // 9. Alert Center Section
  renderAlerts() {
    const container = document.getElementById("alerts-feed-container");
    if (!container) return;

    let alerts = ONE_ACRE_FARM.alerts;
    if (this.activeFilter !== "all") {
      alerts = alerts.filter(a => a.severity === this.activeFilter);
    }

    if (alerts.length === 0) {
      container.innerHTML = `<div class="empty-feed">No alerts matching filter "${this.activeFilter}". System running smoothly.</div>`;
      return;
    }

    container.innerHTML = alerts.map(a => `
      <div class="alert-item-card severity-${a.severity} ${a.resolved ? 'alert-resolved' : ''}">
        <div class="alert-icon-col">
          ${a.severity === 'critical' ? '🔴' : a.severity === 'warning' ? '🟡' : '🟢'}
        </div>
        <div class="alert-content-col">
          <div class="alert-topline">
            <span class="alert-title-strong">${a.title}</span>
            <div class="alert-meta">
              <span class="alert-zone-tag">${a.zone}</span>
              <span class="alert-time-text">${a.time}</span>
            </div>
          </div>
          <div class="alert-desc-text">${a.description}</div>
          <div class="alert-action-rec">
            <strong>Recommended Action:</strong> ${a.action}
          </div>
        </div>
        <div class="alert-btn-col">
          ${a.resolved ? 
            `<span class="badge-resolved">✓ Resolved</span>` : 
            `<button class="btn-ack" onclick="App.resolveAlert('${a.id}')">Acknowledge</button>`
          }
        </div>
      </div>
    `).join("");
  },

  filterAlerts(severity, btnElement) {
    this.activeFilter = severity;
    document.querySelectorAll(".alert-filter-btn").forEach(b => b.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");
    this.renderAlerts();
  },

  resolveAlert(alertId) {
    const alert = ONE_ACRE_FARM.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.resolved = true;
      ONE_ACRE_FARM.overview.activeAlertsCount = Math.max(0, ONE_ACRE_FARM.overview.activeAlertsCount - 1);
      this.renderOverviewCards();
      this.renderAlerts();
      this.showToast(`Alert "${alert.title}" acknowledged.`);
    }
  },

  // 10. Sidebar Navigation & Active States
  bindSidebarNav() {
    const links = document.querySelectorAll(".sidebar-nav-item");
    links.forEach(link => {
      link.addEventListener("click", (e) => {
        links.forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        const targetId = link.getAttribute("href");
        if (targetId && targetId.startsWith("#")) {
          e.preventDefault();
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
          }
          if (targetId === "#analytics" || targetId === "#dashboard") {
            setTimeout(() => {
              if (window.FarmCharts) FarmCharts.renderAllCharts();
            }, 100);
          }
          if (targetId === "#soil-analysis") {
            setTimeout(() => {
              if (window.SoilAnalysis) SoilAnalysis.renderAllCharts();
            }, 100);
          }
          if (targetId === "#crop-replanning") {
            setTimeout(() => {
              if (window.CropReplanning) CropReplanning.renderReplanningGrid();
            }, 100);
          }
          if (targetId === "#farm-history") {
            setTimeout(() => {
              if (window.CropReplanning) CropReplanning.renderHistorySection();
            }, 100);
          }
        }

        // Close sidebar on mobile after clicking link
        const sidebar = document.getElementById("farm-sidebar");
        if (sidebar && window.innerWidth <= 900) {
          sidebar.classList.remove("sidebar-open");
        }
      });
    });

    // Mobile sidebar toggle button
    const menuToggle = document.getElementById("mobile-menu-toggle");
    const sidebar = document.getElementById("farm-sidebar");
    if (menuToggle && sidebar) {
      menuToggle.addEventListener("click", () => {
        sidebar.classList.toggle("sidebar-open");
      });
    }
  },

  bindModals() {
    const closeBtn = document.getElementById("close-zone-modal");
    const modalBackdrop = document.getElementById("zone-details-modal");

    if (closeBtn) closeBtn.addEventListener("click", () => this.closeZoneModal());
    if (modalBackdrop) {
      modalBackdrop.addEventListener("click", (e) => {
        if (e.target === modalBackdrop) this.closeZoneModal();
      });
    }

    // Hardware settings modal toggle
    const settingsBtn = document.getElementById("btn-open-iot-settings");
    const iotModal = document.getElementById("iot-settings-modal");
    const closeIotBtn = document.getElementById("close-iot-modal");

    if (settingsBtn && iotModal) {
      settingsBtn.addEventListener("click", () => iotModal.classList.add("modal-open"));
    }
    if (closeIotBtn && iotModal) {
      closeIotBtn.addEventListener("click", () => iotModal.classList.remove("modal-open"));
    }

    // QR Traceability Modal Backdrop listener
    const qrModal = document.getElementById("qr-traceability-modal");
    if (qrModal) {
      qrModal.addEventListener("click", (e) => {
        if (e.target === qrModal) this.closeQrModal();
      });
    }
  },

  // Handle telemetry updates from IoTBridge
  handleTelemetryUpdate(data) {
    if (data.type === "TELEMETRY_UPDATE") {
      this.renderOverviewCards();
      this.render8ZoneFarmMap();
      this.renderIrrigationPanel();

      if (window.SoilAnalysis && data.zones) {
        window.SoilAnalysis.handleLiveSensorUpdate(data.zones);
      }

      if (this.selectedZone) {
        // Refresh modal if open
        const fresh = ONE_ACRE_FARM.zones.find(z => z.id === this.selectedZone.id);
        if (fresh) {
          this.setText("modal-soil-moisture", `${fresh.soilMoisture}% (Target: ${fresh.targetMoisture}%)`);
          this.setText("modal-soil-temp", `${fresh.soilTemp}°C`);
          this.setText("modal-air-temp", `${fresh.airTemp}°C`);
        }
      }
    }
  },

  // 11. Post-Harvest Direct Sales & Zero-Waste Upcycling Studio
  switchPostHarvestTab(tab, btnElement) {
    document.querySelectorAll(".ph-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".ph-tab-panel").forEach(p => p.classList.remove("active"));

    if (btnElement) btnElement.classList.add("active");

    const panel = document.getElementById(tab === "sales" ? "ph-panel-sales" : "ph-panel-waste");
    if (panel) panel.classList.add("active");
  },

  renderPostHarvestSection() {
    const ph = ONE_ACRE_FARM.postHarvestMarket;
    const wt = ONE_ACRE_FARM.wasteToWealth;
    if (!ph || !wt) return;

    // 1. Summary Cards
    const extraVal = (ph.economicsComparison && ph.economicsComparison.extraProfitDirect) || ph.extraProfitAmount || 557500;
    this.setText("ph-direct-extra-val", `+₹${extraVal.toLocaleString()}`);
    this.setText("ph-total-biomass-val", `${(wt.totalBiomassKg / 1000).toFixed(1)} Tons`);
    this.setText("ph-waste-wealth-val", `₹${wt.totalWealthPotential.toLocaleString()}`);

    // 2. D2C vs Middleman Price Table
    const tableBody = document.getElementById("d2c-price-table-body");
    if (tableBody) {
      tableBody.innerHTML = ph.crops.map(c => `
        <tr>
          <td>
            <div style="font-weight:800; color:var(--text-primary);">${c.name}</div>
            <div style="font-size:0.72rem; color:var(--text-muted);">${c.hindiName || ''} • <span style="font-weight:700; color:var(--primary-deep);">${c.zone}</span></div>
          </td>
          <td>
            <div style="font-weight:700;">${c.yieldKg.toLocaleString()} kg</div>
            <div style="font-size:0.7rem; color:var(--text-secondary);">${c.shelfLife}</div>
          </td>
          <td>
            <span class="price-pill-mandi">₹${c.mandiPrice}/kg</span>
            <div style="font-size:0.68rem; color:var(--danger);">Gross: ₹${(c.yieldKg * c.mandiPrice).toLocaleString()}</div>
          </td>
          <td>
            <span class="price-pill-direct">₹${c.directPrice}/kg</span>
            <div style="font-size:0.68rem; color:#15803d; font-weight:700;">Gross: ₹${(c.yieldKg * c.directPrice).toLocaleString()}</div>
          </td>
          <td>
            <span class="gain-badge">+${c.profitGainPercent}% (+₹${((c.yieldKg * c.directPrice) - (c.yieldKg * c.mandiPrice)).toLocaleString()})</span>
            <button onclick="App.openQrModal('${c.id}')" style="margin-left:6px; background:#f0fdf4; border:1px solid #86efac; color:#15803d; border-radius:12px; padding:2px 8px; font-size:0.72rem; font-weight:700; cursor:pointer;" title="Preview QR Label">
              🏷️ QR Seal
            </button>
          </td>
        </tr>
      `).join("");
    }

    // 3. Direct Community Pre-Orders Dispatch Board
    const ordersGrid = document.getElementById("direct-orders-grid");
    if (ordersGrid) {
      ordersGrid.innerHTML = ph.activeOrders.map(o => `
        <div class="order-ticket">
          <div class="order-ticket-header">
            <span class="order-id-tag">📦 ${o.id}</span>
            <span class="gain-badge" style="font-size:0.68rem; background:${o.status.includes('Dispatched') ? '#e2e8f0' : '#fef3c7'}; color:${o.status.includes('Dispatched') ? '#475569' : '#b45309'};">
              ${o.status}
            </span>
          </div>
          <div class="order-buyer-title">${o.buyer}</div>
          <div class="order-details-line"><strong>Order Items:</strong> ${o.items}</div>
          <div class="order-details-line"><strong>Delivery:</strong> ${o.deliveryMode}</div>
          <div class="order-details-line"><strong>Schedule:</strong> ${o.expectedDelivery}</div>
          <div class="order-amount-pill">₹${o.totalAmount.toLocaleString()} <span style="font-size:0.72rem; color:var(--text-muted); font-weight:600;">(Zero Brokerage)</span></div>
          <button class="btn-dispatch-order ${o.status.includes('Dispatched') ? 'dispatched' : ''}" onclick="App.dispatchOrder('${o.id}')">
            ${o.status.includes('Dispatched') ? '✓ Dispatched to Buyers' : '🚚 Dispatch Farm Order Now'}
          </button>
        </div>
      `).join("");
    }

    // 4. Biomass Residue Inventory List
    const biomassList = document.getElementById("biomass-inventory-list");
    if (biomassList) {
      biomassList.innerHTML = wt.biomassInventory.map(b => `
        <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 12px; background:var(--bg-card-subtle); border-radius:var(--radius-md); font-size:0.78rem;">
          <div>
            <strong style="color:var(--text-primary);">${b.type}</strong>
            <div style="font-size:0.7rem; color:var(--text-secondary);">${b.category} • <span style="color:#0284c7; font-weight:600;">Best for: ${b.idealFor}</span></div>
          </div>
          <span style="font-family:var(--font-heading); font-size:0.95rem; font-weight:800; color:var(--primary-deep);">${b.qtyKg} kg</span>
        </div>
      `).join("");
    }

    // 5. 5 Circular Upcycling Pathways Cards
    const pathwaysGrid = document.getElementById("upcycling-pathways-grid");
    if (pathwaysGrid) {
      pathwaysGrid.innerHTML = wt.upcyclingPathways.map(p => `
        <div class="pathway-card">
          <div class="pathway-top">
            <div class="pathway-icon">${p.icon}</div>
            <div>
              <div class="pathway-title">${p.title}</div>
              <div class="pathway-hindi">${p.hindiTitle}</div>
            </div>
          </div>

          <div style="font-size:0.76rem; color:var(--text-secondary); margin-bottom:8px; line-height:1.35;">
            <strong>Input Residue:</strong> ${p.wasteInput}
          </div>

          <div class="pathway-spec-box">
            <div><strong>Bio-Process:</strong> ${p.process}</div>
            <div><strong>Standard Yield:</strong> <span style="color:#15803d; font-weight:700;">${p.outputYield}</span></div>
            <div><strong>Cycle Time:</strong> ⏱️ ${p.cycleTime}</div>
          </div>

          <div class="pathway-value-badge">
            💰 ${p.economicValue}
          </div>
          <div style="font-size:0.7rem; color:var(--text-muted); margin-top:6px;">
            🌱 <strong>Soil / Eco Impact:</strong> ${p.soilBenefit}
          </div>
        </div>
      `).join("");
    }
  },

  calculateWasteOutput() {
    const typeSelect = document.getElementById("calc-waste-type");
    const weightInput = document.getElementById("calc-waste-weight");
    if (!typeSelect || !weightInput) return;

    const wasteType = typeSelect.value;
    const kg = Math.max(10, parseFloat(weightInput.value) || 100);

    let compostRatio = 0.6;
    let biocharRatio = 0.18;
    let mushroomRatio = 0.12;
    let enzymeRatio = 0.3;
    let unitValuePerKgInput = 24.5; // Average total value per kg residue

    switch (wasteType) {
      case "corn_stover":
        compostRatio = 0.55;
        biocharRatio = 0.28;
        mushroomRatio = 0.35; // high cellulose ideal for oyster mushrooms
        enzymeRatio = 0.15;
        unitValuePerKgInput = 32.0;
        break;
      case "tomato_pepper":
        compostRatio = 0.85; // tender nitrogen-rich foliage
        biocharRatio = 0.08;
        mushroomRatio = 0.05;
        enzymeRatio = 0.4;
        unitValuePerKgInput = 26.0;
        break;
      case "chilli_stems":
        compostRatio = 0.3;
        biocharRatio = 0.36; // dense woody twigs ideal for pyrolysis biochar
        mushroomRatio = 0.1;
        enzymeRatio = 0.1;
        unitValuePerKgInput = 28.5;
        break;
      case "culled_fruits":
        compostRatio = 0.4;
        biocharRatio = 0.0;
        mushroomRatio = 0.0;
        enzymeRatio = 2.5; // 2.5 liters of liquid bio-enzyme per kg fruit mash
        unitValuePerKgInput = 45.0; // saves expensive foliar bio-tonics
        break;
      case "field_weeds":
        compostRatio = 0.75;
        biocharRatio = 0.12;
        mushroomRatio = 0.08;
        enzymeRatio = 0.25;
        unitValuePerKgInput = 21.0;
        break;
    }

    const compostKg = Math.round(kg * compostRatio);
    const biocharKg = Math.round(kg * biocharRatio);
    const mushroomKg = Math.round(kg * mushroomRatio);
    const enzymeLiters = Math.round(kg * enzymeRatio);
    const totalWealth = Math.round(kg * unitValuePerKgInput);

    this.setText("calc-res-compost", `${compostKg} kg`);
    this.setText("calc-res-biochar", `${biocharKg} kg`);
    this.setText("calc-res-mushrooms", `${mushroomKg} kg`);
    this.setText("calc-res-enzyme", `${enzymeLiters} Liters`);
    this.setText("calc-res-total-value", `₹${totalWealth.toLocaleString()}`);
  },

  initiateUpcycleBatch() {
    const typeSelect = document.getElementById("calc-waste-type");
    const weightInput = document.getElementById("calc-waste-weight");
    const typeName = typeSelect ? typeSelect.options[typeSelect.selectedIndex].text : "Crop Residue";
    const kg = weightInput ? weightInput.value : "500";

    this.showToast(`♻️ Upcycling Batch Started: ${kg} kg of ${typeName}! Zero stubble burning.`);

    // Add notification to Alert Center
    const alertId = `ALT-UPCYCLE-${Date.now().toString().slice(-4)}`;
    ONE_ACRE_FARM.alerts.unshift({
      id: alertId,
      severity: "success",
      severityLabel: "Circular Waste Upcycling",
      zone: "Post-Harvest Bio-Hub",
      time: "Just now",
      title: `Upcycling Batch Activated: ${kg} kg ${typeName}`,
      description: `Crop residue diverted from burning into circular bio-conversion. Estimated wealth return is currently in processing.`,
      action: "Monitor vermicompost bed moisture and mushroom fruiting humidity daily.",
      resolved: false
    });
    this.renderAlerts();
    this.renderOverviewCards();

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`Circular agriculture upcycling batch initiated for ${kg} kilograms of harvest residue. 100 percent zero-waste farm cycle.`);
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  },

  dispatchOrder(orderId) {
    const order = ONE_ACRE_FARM.postHarvestMarket.activeOrders.find(o => o.id === orderId);
    if (!order) return;

    order.status = "Dispatched (On E-Van to Buyer)";
    this.renderPostHarvestSection();
    this.showToast(`🚚 Order ${order.id} dispatched directly to ${order.buyer}! Zero middleman brokerage.`);
  },

  simulateNewOrder() {
    const randomOrderId = `ORD-${Math.floor(884 + Math.random() * 90)}`;
    const newOrder = {
      id: randomOrderId,
      buyer: "Urban Greens Organic Co-Operative (50 Member Households)",
      type: "Direct Community Pre-Order",
      items: "50 kg Sweet Corn + 40 kg Vine Tomatoes + 20 kg Strawberries",
      totalAmount: 14800,
      paymentStatus: "Escrow Secured (Pre-Paid UPI)",
      status: "Packing in Progress",
      deliveryMode: "Direct Farmgate E-Van Delivery",
      expectedDelivery: "Tomorrow, 06:00 AM"
    };

    ONE_ACRE_FARM.postHarvestMarket.activeOrders.unshift(newOrder);
    this.renderPostHarvestSection();
    this.showToast(`🎉 New Direct Pre-Order Received from ${newOrder.buyer} for ₹${newOrder.totalAmount.toLocaleString()}!`);
  },

  openQrModal(cropId) {
    const crop = ONE_ACRE_FARM.postHarvestMarket.crops.find(c => c.id === cropId) || ONE_ACRE_FARM.postHarvestMarket.crops[0];
    this.selectedQrCrop = crop;

    this.setText("qr-modal-crop-name", crop.name);
    this.setText("qr-modal-hindi-name", crop.hindiName || "");
    this.setText("qr-modal-batch-code", crop.qrBatchCode);
    this.setText("qr-modal-zone", `${crop.zone} (${crop.name.split(' ')[0]})`);
    this.setText("qr-modal-harvest-time", "Today, 05:45 AM (Dew Fresh)");
    this.setText("qr-modal-chemical", "0.00 ppm • 100% Bio-Organic");
    this.setText("qr-modal-pack-type", crop.packagingType);

    const modal = document.getElementById("qr-traceability-modal");
    if (modal) modal.classList.add("modal-open");
  },

  closeQrModal() {
    const modal = document.getElementById("qr-traceability-modal");
    if (modal) modal.classList.remove("modal-open");
  },

  printQrLabel() {
    const crop = this.selectedQrCrop || ONE_ACRE_FARM.postHarvestMarket.crops[0];
    this.showToast(`🖨️ Sent ${crop.qrBatchCode} thermal label to farmgate bluetooth printer.`);
    window.print();
  },

  simulateBuyerScan() {
    const crop = this.selectedQrCrop || ONE_ACRE_FARM.postHarvestMarket.crops[0];
    alert(`📱 BUYER DIGITAL PASSPORT VERIFIED!\n\n🌱 Farm: One-Acre Intelligent Smart Farm\n🌾 Produce: ${crop.name}\n🗺️ Harvest Plot: ${crop.zone}\n⏱️ Harvested: Today, 05:45 AM\n🧪 Chemical Pesticides: 0.00 ppm (Guaranteed Bio-Organic)\n💧 Soil Moisture at Harvest: 48%\n🤝 Farmer Direct: ₹${crop.directPrice}/kg (Middleman Cut: ₹0)\n\nThank you for supporting smallholder direct agriculture!`);
  },

  showToast(message) {
    let toast = document.getElementById("farm-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "farm-toast";
      toast.className = "farm-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 3200);
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  }
};

window.App = App;

// Safe auto-initialize when DOM is ready or if already ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      App.init();
    });
  } else {
    App.init();
  }
}
