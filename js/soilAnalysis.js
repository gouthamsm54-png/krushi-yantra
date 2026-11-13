/**
 * Krushi Yantra - Soil Intelligence & Soil Fertility Module (soilAnalysis.js)
 * Master Controller for 8-Zone Individual Soil Testing, Lab Report Management,
 * Soil Health Gauge, Interactive Charts, AI Crop Suitability, and Firebase Sync.
 */

const SoilAnalysis = {
  activeZoneId: "zone-1",
  activeTab: "overview", // "overview" | "properties" | "nutrients" | "charts" | "suitability" | "improvement" | "report"
  firebaseConfig: {
    enabled: false,
    databaseUrl: "",
    apiKey: "",
    lastSyncTime: null
  },
  charts: {},

  init() {
    this.loadPersistedData();
    this.loadFirebaseConfig();
    this.bindEvents();
    this.render8ZoneSummary();
    this.renderDedicatedZoneView(this.activeZoneId);
    
    // Register with IoTBridge for live ESP32 telemetry updates
    if (window.IoTBridge) {
      window.IoTBridge.onDataReceived((data) => {
        if (data.type === "TELEMETRY_UPDATE" && data.zones) {
          this.handleLiveSensorUpdate(data.zones);
        }
      });
    }

    console.log("[SoilAnalysis] Initialized successfully for 8 agricultural zones.");
  },

  loadPersistedData() {
    try {
      const saved = localStorage.getItem("krushi_soil_analysis_zones");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (window.SOIL_ANALYSIS_DATA && window.SOIL_ANALYSIS_DATA.zones) {
          Object.keys(parsed).forEach(zoneId => {
            if (window.SOIL_ANALYSIS_DATA.zones[zoneId]) {
              window.SOIL_ANALYSIS_DATA.zones[zoneId] = {
                ...window.SOIL_ANALYSIS_DATA.zones[zoneId],
                ...parsed[zoneId]
              };
            }
          });
        }
      }
    } catch (e) {
      console.warn("[SoilAnalysis] Could not load persisted soil data:", e);
    }
  },

  persistData() {
    try {
      if (window.SOIL_ANALYSIS_DATA && window.SOIL_ANALYSIS_DATA.zones) {
        localStorage.setItem("krushi_soil_analysis_zones", JSON.stringify(window.SOIL_ANALYSIS_DATA.zones));
      }
    } catch (e) {
      console.warn("[SoilAnalysis] Could not persist soil data:", e);
    }
  },

  loadFirebaseConfig() {
    try {
      const saved = localStorage.getItem("krushi_firebase_config");
      if (saved) {
        this.firebaseConfig = { ...this.firebaseConfig, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn("[SoilAnalysis] Could not load Firebase config:", e);
    }
  },

  saveFirebaseConfig(config) {
    this.firebaseConfig = { ...this.firebaseConfig, ...config };
    localStorage.setItem("krushi_firebase_config", JSON.stringify(this.firebaseConfig));
    if (this.firebaseConfig.enabled && this.firebaseConfig.databaseUrl) {
      this.syncAllZonesToFirebase();
    }
  },

  bindEvents() {
    // Zone Switcher Buttons / Pills
    document.addEventListener("click", (e) => {
      const targetBtn = e.target.closest(".soil-zone-pill");
      if (targetBtn) {
        const zoneId = targetBtn.getAttribute("data-zone");
        if (zoneId) {
          this.selectZone(zoneId);
        }
      }

      // Soil Tab Switching
      const tabBtn = e.target.closest(".soil-tab-btn");
      if (tabBtn) {
        const tabKey = tabBtn.getAttribute("data-tab");
        if (tabKey) {
          this.switchTab(tabKey, tabBtn);
        }
      }
    });

    // Handle Window Resize for Canvas Charts
    window.addEventListener("resize", () => {
      if (this.activeTab === "charts" || this.activeTab === "overview") {
        this.renderAllCharts();
      }
    }, { passive: true });
  },

  // 1. Zone Selection & Navigation
  selectZone(zoneId, scrollToView = false) {
    if (!window.SOIL_ANALYSIS_DATA || !window.SOIL_ANALYSIS_DATA.zones[zoneId]) return;
    this.activeZoneId = zoneId;

    // Update active zone pills
    document.querySelectorAll(".soil-zone-pill").forEach(pill => {
      pill.classList.toggle("active", pill.getAttribute("data-zone") === zoneId);
    });

    // Update 8-zone summary highlights
    document.querySelectorAll(".summary-zone-mini-card").forEach(card => {
      card.classList.toggle("selected", card.getAttribute("data-zone") === zoneId);
    });

    // Re-render dedicated profile
    this.renderDedicatedZoneView(zoneId);

    if (scrollToView) {
      const profileSection = document.getElementById("zone-soil-profile-view");
      if (profileSection) {
        profileSection.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  },

  switchTab(tabKey, btnElement) {
    this.activeTab = tabKey;
    document.querySelectorAll(".soil-tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".soil-tab-pane").forEach(p => p.classList.remove("active"));

    if (btnElement) btnElement.classList.add("active");
    const activePane = document.getElementById(`soil-pane-${tabKey}`);
    if (activePane) {
      activePane.classList.add("active");
    }

    if (tabKey === "charts") {
      setTimeout(() => this.renderAllCharts(), 60);
    }
  },

  // 2. Render Top-Level 8-Zone Soil Health Summary
  render8ZoneSummary() {
    const container = document.getElementById("soil-8zone-summary-grid");
    if (!container || !window.SOIL_ANALYSIS_DATA) return;

    const zones = window.SOIL_ANALYSIS_DATA.zones;
    const cardsHtml = Object.values(zones).map(z => {
      const isSelected = z.id === this.activeZoneId;
      const score = z.soilHealth.score;
      let badgeClass = "badge-prime";
      let statusColor = "#16a34a";
      if (score < 60) {
        badgeClass = "badge-danger";
        statusColor = "#ef4444";
      } else if (score < 75) {
        badgeClass = "badge-warning";
        statusColor = "#f59e0b";
      } else if (score < 85) {
        badgeClass = "badge-good";
        statusColor = "#22c55e";
      }

      return `
        <div class="summary-zone-mini-card ${isSelected ? 'selected' : ''}" 
             data-zone="${z.id}" 
             onclick="SoilAnalysis.selectZone('${z.id}', true)" 
             title="Inspect Soil Profile for ${z.name}">
          
          <div class="mini-card-top">
            <span class="mini-zone-tag">ZONE ${z.number}</span>
            <span class="mini-score-badge ${badgeClass}">${score}/100</span>
          </div>

          <div class="mini-crop-title">${z.crop}</div>
          
          <div class="mini-metrics-row">
            <div class="mini-metric">
              <span class="m-label">pH</span>
              <span class="m-val">${z.properties.ph}</span>
            </div>
            <div class="mini-metric">
              <span class="m-label">EC</span>
              <span class="m-val">${z.properties.ec}</span>
            </div>
            <div class="mini-metric">
              <span class="m-label">Moisture</span>
              <span class="m-val" style="color:var(--water);">${z.properties.soilMoisture}%</span>
            </div>
          </div>

          <div class="mini-status-text" style="color:${statusColor};">
            ● ${z.soilHealth.fertilityStatus.split('(')[0]}
          </div>

          <button class="btn-inspect-soil" onclick="event.stopPropagation(); SoilAnalysis.selectZone('${z.id}', true)">
            Inspect Soil Profile →
          </button>
        </div>
      `;
    }).join("");

    container.innerHTML = cardsHtml;
  },

  // 3. Render Dedicated Profile View for Active Zone
  renderDedicatedZoneView(zoneId) {
    const data = window.SOIL_ANALYSIS_DATA.zones[zoneId];
    if (!data) return;

    // 1. Zone Header & Lab Accreditation
    this.setText("sz-header-title", `Zone ${data.number} • ${data.crop}`);
    this.setText("sz-header-name", data.name);
    this.setText("sz-sample-id", data.sampleId);
    this.setText("sz-test-date", `${data.testingDate} (Collection: ${data.collectionDate})`);
    this.setText("sz-lab-name", `${data.testingLab} • ${data.measurementSource}`);

    // Source Tag
    const sourceEl = document.getElementById("sz-source-badge");
    if (sourceEl) {
      if (data.sourceType === "lab") {
        sourceEl.className = "sz-source-pill source-lab";
        sourceEl.innerHTML = "🔬 Verified Laboratory Test (NABL Accredited)";
      } else if (data.sourceType === "sensor") {
        sourceEl.className = "sz-source-pill source-sensor";
        sourceEl.innerHTML = "📡 Live ESP32 Mesh Telemetry (Continuous)";
      } else {
        sourceEl.className = "sz-source-pill source-manual";
        sourceEl.innerHTML = "✍️ Manual Farmer Entry";
      }
    }

    // 2. Executive Soil Health Gauge & Status
    this.renderExecutiveHealthScore(data);

    // 3. Basic Soil Properties (Section A)
    this.renderBasicProperties(data);

    // 4. Nutrient Fertility Breakdown (Section B)
    this.renderNutrientFertility(data);

    // 5. Intelligent Soil Condition Analysis & Agronomic Rules (Section 6)
    this.renderSoilConditionRules(data);

    // 6. AI Multi-Factor Crop Suitability (Section 7)
    this.renderCropSuitability(data);

    // 7. Zone-Specific Soil Improvement Plan (Section 8)
    this.renderImprovementPlan(data);

    // 8. Laboratory Test Report Section (Section 4)
    this.renderLaboratoryReportSection(data);

    // 9. Update Charts if on Charts Tab
    if (this.activeTab === "charts") {
      setTimeout(() => this.renderAllCharts(), 60);
    }
  },

  // Executive Soil Health Score & SVG Circular Gauge
  renderExecutiveHealthScore(data) {
    const score = data.soilHealth.score;
    this.setText("sz-score-val", score);
    this.setText("sz-score-grade", data.soilHealth.grade);
    this.setText("sz-health-summary", data.soilHealth.fertilityStatus);

    // SVG Circular Gauge stroke calculation
    // Circumference = 2 * PI * r = 2 * 3.14159 * 54 = 339.29
    const circle = document.getElementById("sz-gauge-circle");
    if (circle) {
      const maxStroke = 339.3;
      const offset = maxStroke - (maxStroke * (score / 100));
      circle.style.strokeDashoffset = offset;

      let color = "#16a34a"; // Green
      if (score < 60) color = "#ef4444"; // Red
      else if (score < 75) color = "#f59e0b"; // Amber
      else if (score < 85) color = "#22c55e"; // Bright Green
      circle.style.stroke = color;
    }

    // Render 7 Key Executive Assessment Pills
    const pillsContainer = document.getElementById("sz-exec-pills-row");
    if (pillsContainer) {
      const pills = [
        { label: "Overall Fertility", val: data.soilHealth.fertilityStatus.split('(')[0], icon: "🌾", status: score >= 80 ? "good" : score >= 60 ? "warning" : "danger" },
        { label: "Soil Reaction", val: data.soilHealth.phStatus, icon: "🧪", status: data.properties.ph >= 6.0 && data.properties.ph <= 7.5 ? "good" : "warning" },
        { label: "Salinity Status", val: data.soilHealth.salinityStatus, icon: "⚡", status: data.properties.ec <= 1.4 ? "good" : "warning" },
        { label: "Organic Carbon", val: data.soilHealth.ocStatus, icon: "🍂", status: data.nutrients.macronutrients.find(m => m.key === "oc")?.value >= 0.6 ? "good" : "danger" },
        { label: "Deficiencies", val: data.soilHealth.deficiencySummary, icon: "⚠️", status: data.soilHealth.deficiencySummary.includes("0") ? "good" : "danger" },
        { label: "Soil Moisture", val: `${data.properties.soilMoisture}% (Field Capacity)`, icon: "💧", status: data.properties.soilMoisture >= 40 ? "good" : "warning" },
        { label: "Soil Drainage", val: data.properties.drainageCondition, icon: "🚿", status: "good" }
      ];

      pillsContainer.innerHTML = pills.map(p => `
        <div class="sz-exec-pill pill-${p.status}">
          <span class="pill-icon">${p.icon}</span>
          <div class="pill-text">
            <span class="pill-label">${p.label}</span>
            <span class="pill-val">${p.val}</span>
          </div>
        </div>
      `).join("");
    }
  },

  // Section A: Basic Soil Properties
  renderBasicProperties(data) {
    const container = document.getElementById("sz-properties-grid");
    if (!container) return;

    const p = data.properties;
    const cards = [
      {
        title: "Soil pH Reaction",
        val: `${p.ph}`,
        unit: "pH",
        sub: p.phStatus,
        status: p.ph >= 6.0 && p.ph <= 7.2 ? "normal" : p.ph < 6.0 ? "acidic" : "alkaline",
        icon: "🧪",
        ref: "Optimal: 6.2 - 7.2"
      },
      {
        title: "Electrical Conductivity (EC)",
        val: `${p.ec}`,
        unit: "dS/m",
        sub: p.ecStatus,
        status: p.ec <= 1.4 ? "normal" : "warning",
        icon: "⚡",
        ref: "Normal: < 1.6 dS/m"
      },
      {
        title: "Soil Moisture %",
        val: `${p.soilMoisture}%`,
        unit: "",
        sub: p.soilMoistureSource,
        status: p.soilMoisture >= 40 && p.soilMoisture <= 60 ? "normal" : "warning",
        icon: "💧",
        ref: "Ideal: 45% - 55%"
      },
      {
        title: "Soil Temperature",
        val: `${p.soilTemp}°C`,
        unit: "",
        sub: p.soilTempSource,
        status: "normal",
        icon: "🌡️",
        ref: "Optimal: 22°C - 28°C"
      },
      {
        title: "Soil Texture",
        val: p.soilTexture,
        unit: "",
        sub: p.textureDetails || "Texture analysis",
        status: "normal",
        icon: "🌱",
        ref: "Optimal Agricultural Tilth"
      },
      {
        title: "Soil Classification / Type",
        val: p.soilType,
        unit: "",
        sub: "Regional Agro-Climatic Order",
        status: "normal",
        icon: "🗺️",
        ref: "ICAR Soil Taxonomy"
      },
      {
        title: "Topsoil & Rooting Depth",
        val: p.soilDepthTopsoil,
        unit: `(Root: ${p.soilDepthEffective})`,
        sub: "Effective root penetration zone",
        status: "normal",
        icon: "📏",
        ref: "Shallow (<30cm) to Deep (>90cm)"
      },
      {
        title: "Water-Holding Capacity",
        val: `${p.waterHoldingCapacity}%`,
        unit: "",
        sub: p.waterHoldingCapacityRating,
        status: p.waterHoldingCapacity >= 20 ? "normal" : "warning",
        icon: "🚰",
        ref: "Optimal: 25% - 35%"
      },
      {
        title: "Soil Drainage Condition",
        val: p.drainageCondition,
        unit: "",
        sub: "Subsurface infiltration permeability",
        status: p.drainageCondition.includes("Poor") || p.drainageCondition.includes("Impaired") ? "warning" : "normal",
        icon: "🚿",
        ref: "Well-Drained Non-Waterlogged"
      },
      {
        title: "Soil Compaction",
        val: `${p.compaction}`,
        unit: "PSI",
        sub: p.compactionRating,
        status: p.compaction > 200 ? "danger" : "normal",
        icon: "🔨",
        ref: "Optimal: < 150 PSI (Penetrometer)"
      }
    ];

    container.innerHTML = cards.map(c => `
      <div class="soil-prop-card prop-${c.status}">
        <div class="prop-icon-header">
          <span class="prop-icon">${c.icon}</span>
          <span class="prop-ref-tag">${c.ref}</span>
        </div>
        <div class="prop-title">${c.title}</div>
        <div class="prop-val-row">
          <span class="prop-val">${c.val}</span>
          <span class="prop-unit">${c.unit}</span>
        </div>
        <div class="prop-sub">${c.sub}</div>
      </div>
    `).join("");
  },

  // Section B: Macronutrient & Micronutrient Fertility
  renderNutrientFertility(data) {
    const macroContainer = document.getElementById("sz-macro-nutrients-grid");
    const microContainer = document.getElementById("sz-micro-nutrients-grid");
    if (!macroContainer || !microContainer) return;

    const renderNutrientCard = (n) => {
      let statusClass = "status-med";
      let statusLabel = n.status;
      if (n.status === "High" || n.status === "Sufficient") statusClass = "status-high";
      else if (n.status === "Deficient" || n.defAlert) {
        statusClass = "status-def";
        statusLabel = "DEFICIENT";
      }

      // Visual range progress calculation
      const ref = window.SOIL_ANALYSIS_DATA.referenceStandards[n.key];
      let percent = 50;
      if (ref) {
        percent = Math.min(100, Math.max(10, Math.round((n.value / (ref.highLimit * 1.3)) * 100)));
      }

      return `
        <div class="nutrient-card ${n.defAlert ? 'has-deficiency' : ''}">
          <div class="nutrient-header">
            <div class="nutrient-symbol-box">${n.symbol}</div>
            <div class="nutrient-name-block">
              <div class="nutrient-name">${n.name}</div>
              <div class="nutrient-range">Standard Range: ${n.range}</div>
            </div>
            <span class="nutrient-status-pill ${statusClass}">${statusLabel}</span>
          </div>

          <div class="nutrient-val-row">
            <div class="nutrient-measured-num">${n.value} <span class="unit-span">${n.unit}</span></div>
            <div class="nutrient-source-tag">${n.source || 'Laboratory Verified'}</div>
          </div>

          <div class="nutrient-bar-track">
            <div class="nutrient-bar-fill ${statusClass}" style="width: ${percent}%;"></div>
            <div class="range-marker-low" title="Low boundary"></div>
            <div class="range-marker-high" title="Optimal boundary"></div>
          </div>

          ${n.defAlert ? `
            <div class="deficiency-warning-banner">
              ⚠️ <strong>Deficiency Detected:</strong> ${n.advice}
            </div>
          ` : `
            <div class="nutrient-advice-text">
              💡 ${n.advice}
            </div>
          `}
        </div>
      `;
    };

    macroContainer.innerHTML = data.nutrients.macronutrients.map(renderNutrientCard).join("");
    microContainer.innerHTML = data.nutrients.micronutrients.map(renderNutrientCard).join("");
  },

  // Section 6: Intelligent Soil Condition Analysis & Agronomic Rules
  renderSoilConditionRules(data) {
    const container = document.getElementById("sz-condition-rules-box");
    if (!container) return;

    const p = data.properties;
    const n = data.nutrients;
    const rules = [];

    // Rule 1: Soil pH
    if (p.ph < 6.0) {
      rules.push({
        type: "danger",
        title: "Acidic Soil Warning (pH " + p.ph + " < 6.0)",
        issue: "Soil reaction is acidic. High aluminum and manganese solubility can injure root tips and fix soluble phosphorus into insoluble aluminum phosphate.",
        recommendation: "Apply Agricultural Lime (CaCO3) or Dolomite @ 250 - 300 kg/acre. Avoid acid-forming fertilizers like ammonium sulphate. Re-test pH after 60 days."
      });
    } else if (p.ph > 7.6) {
      rules.push({
        type: "warning",
        title: "Alkaline / Calcareous Soil Alert (pH " + p.ph + " > 7.6)",
        issue: "High calcium carbonate content causes precipitation of phosphorus and locks micronutrients (Zinc, Iron, Manganese) into insoluble forms.",
        recommendation: "Incorporate Agricultural Gypsum (CaSO4) @ 400 kg/acre and apply sulfur-rich organic pressmud. Use chelated foliar sprays (Fe-EDDHA and Zn-EDTA)."
      });
    } else {
      rules.push({
        type: "success",
        title: "Optimal Soil pH (pH " + p.ph + " in 6.0 - 7.2 Safe Zone)",
        issue: "Soil reaction is in thermodynamic equilibrium. Maximum nutrient bioavailability for both macro and micronutrients.",
        recommendation: "Maintain current neutral organic buffer. Avoid excessive unbuffered chemical fertilizer overdosing."
      });
    }

    // Rule 2: Electrical Conductivity / Salinity
    if (p.ec > 1.6) {
      rules.push({
        type: "warning",
        title: "Elevated Electrical Conductivity (EC " + p.ec + " dS/m)",
        issue: "Soluble salt accumulation detected. High osmotic potential increases plant root energy needed to absorb water, causing physiological moisture stress.",
        recommendation: "Apply a 15% leaching fraction during drip irrigation. Improve subsurface field drainage and avoid saline borewell irrigation water."
      });
    } else {
      rules.push({
        type: "success",
        title: "Non-Saline Optimal EC (" + p.ec + " dS/m)",
        issue: "Safe electrolyte concentration in the rootzone soil solution. No salt toxicity risk.",
        recommendation: "Continue scheduled balanced fertigation."
      });
    }

    // Rule 3: Organic Carbon
    const ocNutrient = n.macronutrients.find(m => m.key === "oc");
    const ocVal = ocNutrient ? ocNutrient.value : 0.6;
    if (ocVal < 0.50) {
      rules.push({
        type: "danger",
        title: "Depleted Soil Organic Carbon (" + ocVal + "% < 0.50%)",
        issue: "Critical humus depletion. Low organic matter drastically reduces Cation Exchange Capacity (CEC), water retention, and beneficial microbial populations.",
        recommendation: "Incorporate 4 to 5 tons/acre well-decomposed Farmyard Manure (FYM) or vermicompost. Practice in-situ green manuring with Dhaincha (Sesbania) or Sunn Hemp."
      });
    } else {
      rules.push({
        type: "success",
        title: "Good Soil Organic Carbon Balance (" + ocVal + "%)",
        issue: "Healthy biological soil sponge. Supports indigenous mycorrhizae, earthworms, and nutrient buffering.",
        recommendation: "Continue mulching with farm crop residue to sustain humus replenishment."
      });
    }

    // Rule 4: Deficiencies Summary
    const defs = [...n.macronutrients, ...n.micronutrients].filter(item => item.defAlert);
    if (defs.length > 0) {
      rules.push({
        type: "warning",
        title: `Nutrient Deficiencies Detected (${defs.length} Parameter${defs.length > 1 ? 's' : ''}: ${defs.map(d => d.symbol).join(', ')})`,
        issue: "Plant metabolic pathways are constrained by Liebig's Law of the Minimum. Yield potential will be capped by these specific deficiencies.",
        recommendation: defs.map(d => `<strong>${d.symbol}:</strong> ${d.advice}`).join("<br>")
      });
    }

    // Rule 5: Soil Compaction
    if (p.compaction > 200) {
      rules.push({
        type: "danger",
        title: "Severe Subsoil Compaction (" + p.compaction + " PSI Hardpan)",
        issue: "Penetration resistance exceeds 200 PSI. Roots are deflected sideways, unable to access deep subsoil moisture reserves.",
        recommendation: "Perform deep chisel subsoiling to 45-50 cm depth during dry land preparation. Avoid driving heavy tractor implements over wet furrows."
      });
    }

    container.innerHTML = rules.map(r => `
      <div class="condition-rule-card rule-${r.type}">
        <div class="rule-title-row">
          <span class="rule-icon">${r.type === 'danger' ? '🔴' : r.type === 'warning' ? '⚠️' : '✅'}</span>
          <h4 class="rule-heading">${r.title}</h4>
        </div>
        <div class="rule-body">
          <p class="rule-issue"><strong>Agronomic Finding:</strong> ${r.issue}</p>
          <div class="rule-action"><strong>Recommended Corrective Action:</strong> ${r.recommendation}</div>
        </div>
      </div>
    `).join("");
  },

  // Section 7: AI Multi-Factor Crop Suitability
  renderCropSuitability(data) {
    const container = document.getElementById("sz-suitability-content");
    if (!container || !data.cropSuitability) return;

    const cs = data.cropSuitability;
    let html = `
      <div class="suitability-top-banner">
        <div class="banner-badge">🤖 AI Multi-Factor Agronomic Evaluation</div>
        <p class="banner-sub">Analyzed against 12 agro-ecological variables: pH (${data.properties.ph}), Texture (${data.properties.soilTexture}), NPK, Organic Carbon (${data.nutrients.macronutrients.find(m => m.key === "oc")?.value}%), Salinity (${data.properties.ec} dS/m), Moisture, Compaction, and Drainage.</p>
      </div>

      <!-- 1. Top Recommended Crops -->
      <h4 class="suitability-section-heading">🌟 Highly Recommended Crops for Zone ${data.number}</h4>
      <div class="crop-suitability-grid">
        ${cs.mostSuitable.map(c => `
          <div class="crop-suit-card">
            <div class="crop-suit-top">
              <div>
                <h5 class="crop-suit-name">${c.name}</h5>
                <span class="crop-suit-hindi">${c.hindiName || ''}</span>
              </div>
              <div class="crop-suit-score-badge">${c.suitabilityScore}% Match</div>
            </div>

            <div class="crop-specs-table">
              <div class="cs-spec-row">
                <span class="cs-label">Required pH:</span>
                <span class="cs-val">${c.requiredPh} (Zone: <strong>${c.existingPh}</strong>)</span>
              </div>
              <div class="cs-spec-row">
                <span class="cs-label">Texture Match:</span>
                <span class="cs-val">${c.requiredTexture}</span>
              </div>
              <div class="cs-spec-row">
                <span class="cs-label">Water Demand:</span>
                <span class="cs-val">${c.waterReq}</span>
              </div>
              <div class="cs-spec-row">
                <span class="cs-label">Crop Cycle:</span>
                <span class="cs-val">${c.duration}</span>
              </div>
            </div>

            <div class="crop-challenge-box">
              <strong>Cultivation Challenge:</strong> ${c.challenges}
            </div>
          </div>
        `).join("")}
      </div>

      <!-- 2. Categorized Crop Breakdown -->
      <h4 class="suitability-section-heading" style="margin-top:24px;">📊 Category-Wise Suitability Breakdown</h4>
      <div class="category-breakdown-grid">
        <div class="cat-box">
          <div class="cat-header">🥕 Suitable Vegetables</div>
          <div class="cat-tags-row">
            ${cs.suitableCategories.vegetables.map(item => `<span class="cat-tag">${item}</span>`).join("")}
          </div>
        </div>
        <div class="cat-box">
          <div class="cat-header">🍎 Suitable Fruits</div>
          <div class="cat-tags-row">
            ${cs.suitableCategories.fruits.map(item => `<span class="cat-tag">${item}</span>`).join("")}
          </div>
        </div>
        <div class="cat-box">
          <div class="cat-header">🫘 Suitable Pulses & Legumes</div>
          <div class="cat-tags-row">
            ${cs.suitableCategories.pulses.map(item => `<span class="cat-tag">${item}</span>`).join("")}
          </div>
        </div>
        <div class="cat-box">
          <div class="cat-header">🌾 Suitable Cereals & Grains</div>
          <div class="cat-tags-row">
            ${cs.suitableCategories.cereals.map(item => `<span class="cat-tag">${item}</span>`).join("")}
          </div>
        </div>
      </div>

      <!-- 3. Requiring Improvement & Not Recommended -->
      <div class="suitability-warning-grid" style="margin-top:24px;">
        <div class="suit-warn-box">
          <h5>⚠️ Crops Requiring Soil Improvement</h5>
          ${cs.requiresImprovement && cs.requiresImprovement.length > 0 ? cs.requiresImprovement.map(r => `
            <div class="warn-item">
              <strong>${r.name}:</strong> ${r.issue}
              <div class="fix-tag">Prerequisite Fix: ${r.fixRequired}</div>
            </div>
          `).join("") : '<div class="warn-item">All candidate crops thrive under current optimal soil condition.</div>'}
        </div>

        <div class="suit-danger-box">
          <h5>🚫 Crops Not Recommended (High Agronomic Risk)</h5>
          ${cs.notRecommended && cs.notRecommended.length > 0 ? cs.notRecommended.map(nr => `
            <div class="danger-item">
              <strong>${nr.name}:</strong> ${nr.reason}
            </div>
          `).join("") : '<div class="danger-item">No major crop incompatibilities identified.</div>'}
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  // Section 8: Zone-Specific Soil Improvement Plan
  renderImprovementPlan(data) {
    const container = document.getElementById("sz-improvement-plan-container");
    if (!container || !data.improvementPlan) return;

    container.innerHTML = data.improvementPlan.map((p, idx) => `
      <div class="improvement-step-card">
        <div class="step-num-badge">${idx + 1}</div>
        <div class="step-content">
          <div class="step-pillar-title">${p.pillar}</div>
          <div class="step-action-text">${p.action}</div>
          <div class="step-reason-box">
            <strong>Agronomic Rationale:</strong> ${p.reason}
          </div>
        </div>
      </div>
    `).join("");
  },

  // Section 4: Laboratory Test Report Section
  renderLaboratoryReportSection(data) {
    const container = document.getElementById("sz-report-dossier-box");
    if (!container) return;

    const allNutrients = [
      ...data.nutrients.macronutrients,
      ...data.nutrients.micronutrients
    ];

    container.innerHTML = `
      <div class="soil-report-official-card">
        <div class="report-header-banner">
          <div class="rep-gov-logo">🇮🇳 KRUSHI YANTRA • AGRI-TEST CERTIFICATE</div>
          <div class="rep-lab-seal">Accredited Lab: ${data.testingLab}</div>
        </div>

        <div class="report-metadata-grid">
          <div><span class="rm-lbl">Zone Identifier:</span> <strong>Zone ${data.number} (${data.name})</strong></div>
          <div><span class="rm-lbl">Soil Sample ID:</span> <strong>${data.sampleId}</strong></div>
          <div><span class="rm-lbl">Collection Date:</span> <strong>${data.collectionDate}</strong></div>
          <div><span class="rm-lbl">Analysis / Report Date:</span> <strong>${data.testingDate}</strong></div>
          <div><span class="rm-lbl">Soil Order & Texture:</span> <strong>${data.properties.soilTexture} (${data.properties.soilType})</strong></div>
          <div><span class="rm-lbl">Health Score / Rating:</span> <strong style="color:var(--primary); font-size:1.05rem;">${data.soilHealth.score}/100 • ${data.soilHealth.grade}</strong></div>
        </div>

        <h5 style="margin: 18px 0 8px; font-weight: 800; color: var(--primary-deep);">Measured Soil Parameters & Nutrient Status</h5>
        <div class="table-responsive">
          <table class="soil-report-table">
            <thead>
              <tr>
                <th>Parameter</th>
                <th>Measured Value</th>
                <th>Reference Range</th>
                <th>Status</th>
                <th>Testing Protocol</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Soil Reaction (pH)</td>
                <td><strong>${data.properties.ph}</strong></td>
                <td>6.0 - 7.5</td>
                <td><span class="rep-pill rep-normal">${data.properties.phStatus.split(' ')[0]}</span></td>
                <td>1:2.5 Soil-Water Suspension (Potentiometric)</td>
              </tr>
              <tr>
                <td>Electrical Conductivity (EC)</td>
                <td><strong>${data.properties.ec} dS/m</strong></td>
                <td>< 1.6 dS/m</td>
                <td><span class="rep-pill rep-normal">${data.properties.ecStatus.split(' ')[0]}</span></td>
                <td>1:2.5 Supernatant (Conductivity Bridge)</td>
              </tr>
              <tr>
                <td>Soil Moisture (Current Field)</td>
                <td><strong>${data.properties.soilMoisture}%</strong></td>
                <td>40% - 60%</td>
                <td><span class="rep-pill rep-normal">Continuous</span></td>
                <td>ESP32 Capacitive TDR Probe / Gravimetric Oven</td>
              </tr>
              <tr>
                <td>Soil Rootzone Temperature</td>
                <td><strong>${data.properties.soilTemp}°C</strong></td>
                <td>20°C - 30°C</td>
                <td><span class="rep-pill rep-normal">Optimal</span></td>
                <td>DS18B20 Thermistor / Soil Thermometer</td>
              </tr>
              ${allNutrients.map(n => `
                <tr>
                  <td>${n.name}</td>
                  <td><strong>${n.value} ${n.unit}</strong></td>
                  <td>${n.range}</td>
                  <td><span class="rep-pill ${n.defAlert ? 'rep-def' : 'rep-normal'}">${n.status}</span></td>
                  <td>${n.source || 'Standard Laboratory Assay'}</td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>

        <div class="report-actions-row">
          <button class="btn-soil-action btn-add-test" onclick="SoilAnalysis.openAddTestModal('${data.id}')">
            ➕ Add New Soil Test
          </button>
          <button class="btn-soil-action btn-edit-test" onclick="SoilAnalysis.openEditTestModal('${data.id}')">
            ✏️ Edit Current Test
          </button>
          <button class="btn-soil-action btn-history-test" onclick="SoilAnalysis.openTestHistoryModal('${data.id}')">
            📜 View Test History (${data.testHistory ? data.testHistory.length : 1} Records)
          </button>
          <button class="btn-soil-action btn-download-pdf" onclick="SoilAnalysis.downloadReportPdf('${data.id}')">
            📥 Download Soil Test Report (PDF)
          </button>
        </div>
      </div>
    `;
  },

  // 5. Dynamic Fertility Visualizations (Canvas Charts)
  renderAllCharts() {
    const data = window.SOIL_ANALYSIS_DATA.zones[this.activeZoneId];
    if (!data) return;

    this.drawNpkComparisonChart("chart-soil-npk", data);
    this.drawMacronutrientsChart("chart-soil-macro", data);
    this.drawMicronutrientsChart("chart-soil-micro", data);
    this.drawPhIndicator("chart-soil-ph-scale", data.properties.ph);
    this.drawEcIndicator("chart-soil-ec-scale", data.properties.ec);
    this.drawOrganicCarbonGauge("chart-soil-oc-gauge", data);
    this.drawTelemetryCurve("chart-soil-moist-hist", data.telemetryHistory.timestamps, data.telemetryHistory.moisture, "#0284c7", "%");
    this.drawTelemetryCurve("chart-soil-temp-hist", data.telemetryHistory.timestamps, data.telemetryHistory.temperature, "#f59e0b", "°C");
  },

  // Chart 1: NPK Comparison Bar Chart (Measured vs ICAR Recommended Baseline)
  drawNpkComparisonChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, 320);
    const height = Math.max(parent ? parent.clientHeight : 0, 180);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, width, height);

    const padding = { top: 25, right: 20, bottom: 35, left: 45 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const n = data.nutrients.macronutrients;
    const nVal = n.find(m => m.key === "n")?.value || 250;
    const pVal = n.find(m => m.key === "p")?.value || 20;
    const kVal = n.find(m => m.key === "k")?.value || 200;

    // ICAR Reference Baselines for comparison
    const items = [
      { label: "Nitrogen (N)", measured: nVal, benchmark: 350, unit: "kg/ha", color: "#16a34a" },
      { label: "Phosphorus (P)", measured: pVal, benchmark: 35, unit: "kg/ha", color: "#0284c7" },
      { label: "Potassium (K)", measured: kVal, benchmark: 250, unit: "kg/ha", color: "#f59e0b" }
    ];

    const groupWidth = chartW / items.length;
    const barWidth = Math.min(26, groupWidth * 0.32);

    // Draw Grid Lines
    ctx.strokeStyle = "rgba(100, 116, 139, 0.15)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw Bars
    items.forEach((item, idx) => {
      const maxVal = Math.max(item.measured, item.benchmark) * 1.25 || 100;
      const groupX = padding.left + groupWidth * idx;

      // 1. Measured Bar
      const hMeasured = Math.max(6, (item.measured / maxVal) * chartH);
      const xMeasured = groupX + (groupWidth / 2) - barWidth - 4;
      const yMeasured = padding.top + chartH - hMeasured;

      ctx.fillStyle = item.color;
      this.roundRect(ctx, xMeasured, yMeasured, barWidth, hMeasured, 3, true);

      // Value label
      ctx.fillStyle = "#1e293b";
      ctx.font = "bold 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${item.measured}`, xMeasured + barWidth / 2, yMeasured - 4);

      // 2. Benchmark Reference Bar (Striped / Subtle)
      const hBench = Math.max(6, (item.benchmark / maxVal) * chartH);
      const xBench = groupX + (groupWidth / 2) + 4;
      const yBench = padding.top + chartH - hBench;

      ctx.fillStyle = "rgba(100, 116, 139, 0.25)";
      this.roundRect(ctx, xBench, yBench, barWidth, hBench, 3, true);

      // Benchmark value label
      ctx.fillStyle = "#64748b";
      ctx.font = "500 8.5px 'JetBrains Mono', monospace";
      ctx.fillText(`Ref:${item.benchmark}`, xBench + barWidth / 2, yBench - 4);

      // Label below group
      ctx.fillStyle = "#475569";
      ctx.font = "600 10px 'Inter', sans-serif";
      ctx.fillText(item.label, groupX + groupWidth / 2, height - padding.bottom + 14);
      ctx.font = "400 8px 'Inter', sans-serif";
      ctx.fillStyle = "#94a3b8";
      ctx.fillText(`(${item.unit})`, groupX + groupWidth / 2, height - padding.bottom + 25);
    });
  },

  // Chart 2: Macronutrients Radar / Bar Status (N, P, K, OC, S)
  drawMacronutrientsChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, 320);
    const height = Math.max(parent ? parent.clientHeight : 0, 180);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 20, right: 20, bottom: 25, left: 60 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const macros = data.nutrients.macronutrients;
    const rowHeight = chartH / macros.length;

    macros.forEach((m, idx) => {
      const y = padding.top + rowHeight * idx + 6;
      const ref = window.SOIL_ANALYSIS_DATA.referenceStandards[m.key];
      const maxRange = ref ? ref.highLimit * 1.3 : 100;
      const percent = Math.min(100, Math.max(10, (m.value / maxRange) * 100));
      const barW = (percent / 100) * chartW;

      // Label
      ctx.fillStyle = "#334155";
      ctx.font = "600 10px 'Inter', sans-serif";
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(m.symbol, padding.left - 10, y + 6);

      // Background track
      ctx.fillStyle = "rgba(226, 232, 240, 0.6)";
      this.roundRect(ctx, padding.left, y, chartW, 12, 4, true);

      // Color Fill
      let color = "#16a34a";
      if (m.defAlert) color = "#ef4444";
      else if (m.status === "High" || m.status === "Sufficient") color = "#22c55e";
      else if (m.status === "Medium") color = "#0284c7";

      ctx.fillStyle = color;
      this.roundRect(ctx, padding.left, y, barW, 12, 4, true);

      // Value text inside / right of bar
      ctx.fillStyle = "#1e293b";
      ctx.font = "600 9px 'JetBrains Mono', monospace";
      ctx.textAlign = "left";
      ctx.fillText(`${m.value} ${m.unit} (${m.status})`, padding.left + barW + 6, y + 7);
    });
  },

  // Chart 3: Micronutrient Levels Chart (Zn, Fe, Cu, Mn, B with critical threshold line)
  drawMicronutrientsChart(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, 320);
    const height = Math.max(parent ? parent.clientHeight : 0, 180);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const padding = { top: 22, right: 18, bottom: 32, left: 35 };
    const chartW = width - padding.left - padding.right;
    const chartH = height - padding.top - padding.bottom;

    const micros = data.nutrients.micronutrients;
    const barWidth = Math.min(24, (chartW / micros.length) * 0.45);
    const gap = chartW / micros.length;

    // Grid
    ctx.strokeStyle = "rgba(100, 116, 139, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i <= 3; i++) {
      const y = padding.top + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    micros.forEach((m, idx) => {
      const ref = window.SOIL_ANALYSIS_DATA.referenceStandards[m.key];
      const maxVal = ref ? ref.highLimit * 1.25 : 10;
      const barH = Math.max(8, (m.value / maxVal) * chartH);
      const x = padding.left + gap * idx + (gap - barWidth) / 2;
      const y = padding.top + chartH - barH;

      let color = m.defAlert ? "#ef4444" : "#059669";
      ctx.fillStyle = color;
      this.roundRect(ctx, x, y, barWidth, barH, 4, true);

      // Value
      ctx.fillStyle = m.defAlert ? "#b91c1c" : "#1e293b";
      ctx.font = "bold 8.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "center";
      ctx.fillText(`${m.value}`, x + barWidth / 2, y - 4);

      // Label below
      ctx.fillStyle = "#475569";
      ctx.font = "600 10px 'Inter', sans-serif";
      ctx.fillText(m.symbol, x + barWidth / 2, height - padding.bottom + 12);
    });
  },

  // Chart 4: Soil pH Scale Indicator
  drawPhIndicator(canvasId, phVal) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, 300);
    const height = 65;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = 18;
    const barW = width - pad * 2;
    const barY = 16;
    const barH = 14;

    // Gradient 0 (Red) -> 7 (Green) -> 14 (Purple)
    const grad = ctx.createLinearGradient(pad, 0, pad + barW, 0);
    grad.addColorStop(0.0, "#dc2626"); // Strong Acid
    grad.addColorStop(0.3, "#f59e0b"); // Moderate Acid
    grad.addColorStop(0.48, "#22c55e"); // Optimal 6.5
    grad.addColorStop(0.52, "#16a34a"); // Neutral 7.0
    grad.addColorStop(0.7, "#0284c7"); // Slight Alkaline
    grad.addColorStop(1.0, "#7c3aed"); // Strong Alkaline

    ctx.fillStyle = grad;
    this.roundRect(ctx, pad, barY, barW, barH, 6, true);

    // Indicator needle for phVal (Scale: 4.0 to 9.5)
    const minPh = 4.0;
    const maxPh = 9.5;
    const clampedPh = Math.max(minPh, Math.min(maxPh, phVal));
    const needleX = pad + ((clampedPh - minPh) / (maxPh - minPh)) * barW;

    // Pointer Triangle
    ctx.beginPath();
    ctx.moveTo(needleX, barY - 1);
    ctx.lineTo(needleX - 6, barY - 10);
    ctx.lineTo(needleX + 6, barY - 10);
    ctx.closePath();
    ctx.fillStyle = "#1e293b";
    ctx.fill();

    // Value on top
    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`pH ${phVal}`, needleX, barY - 13);

    // Bottom scale labels
    ctx.font = "500 8.5px 'Inter', sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("4.0 (Acidic)", pad + 15, barY + barH + 14);
    ctx.fillText("6.5 - 7.0 (Optimal)", pad + barW / 2, barY + barH + 14);
    ctx.fillText("9.0+ (Alkaline)", pad + barW - 20, barY + barH + 14);
  },

  // Chart 5: Soil EC Indicator (0 to 3 dS/m)
  drawEcIndicator(canvasId, ecVal) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, 300);
    const height = 65;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = 18;
    const barW = width - pad * 2;
    const barY = 16;
    const barH = 14;

    // EC bands: <1.0 Green (Non-Saline), 1.0-1.8 Yellow (Slight Saline), >1.8 Red (Saline)
    const grad = ctx.createLinearGradient(pad, 0, pad + barW, 0);
    grad.addColorStop(0.0, "#22c55e");
    grad.addColorStop(0.45, "#16a34a");
    grad.addColorStop(0.65, "#f59e0b");
    grad.addColorStop(1.0, "#ef4444");

    ctx.fillStyle = grad;
    this.roundRect(ctx, pad, barY, barW, barH, 6, true);

    const minEc = 0.0;
    const maxEc = 3.0;
    const clampedEc = Math.max(minEc, Math.min(maxEc, ecVal));
    const needleX = pad + ((clampedEc - minEc) / (maxEc - minEc)) * barW;

    ctx.beginPath();
    ctx.moveTo(needleX, barY - 1);
    ctx.lineTo(needleX - 6, barY - 10);
    ctx.lineTo(needleX + 6, barY - 10);
    ctx.closePath();
    ctx.fillStyle = "#1e293b";
    ctx.fill();

    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${ecVal} dS/m`, needleX, barY - 13);

    ctx.font = "500 8.5px 'Inter', sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("0.0 (Normal)", pad + 15, barY + barH + 14);
    ctx.fillText("1.2 Safe Buffer", pad + barW / 2, barY + barH + 14);
    ctx.fillText("2.5+ Saline Risk", pad + barW - 25, barY + barH + 14);
  },

  // Chart 6: Organic Carbon Meter
  drawOrganicCarbonGauge(canvasId, data) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, 300);
    const height = 65;

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const ocNutrient = data.nutrients.macronutrients.find(m => m.key === "oc");
    const ocVal = ocNutrient ? ocNutrient.value : 0.65;

    const pad = 18;
    const barW = width - pad * 2;
    const barY = 16;
    const barH = 14;

    // Organic Carbon bands: <0.5% Low, 0.5-0.75% Med, >0.75% High
    const grad = ctx.createLinearGradient(pad, 0, pad + barW, 0);
    grad.addColorStop(0.0, "#ef4444"); // Low
    grad.addColorStop(0.4, "#f59e0b"); // Medium
    grad.addColorStop(0.7, "#22c55e"); // High
    grad.addColorStop(1.0, "#059669"); // Rich Humus

    ctx.fillStyle = grad;
    this.roundRect(ctx, pad, barY, barW, barH, 6, true);

    const minOc = 0.2;
    const maxOc = 1.2;
    const clampedOc = Math.max(minOc, Math.min(maxOc, ocVal));
    const needleX = pad + ((clampedOc - minOc) / (maxOc - minOc)) * barW;

    ctx.beginPath();
    ctx.moveTo(needleX, barY - 1);
    ctx.lineTo(needleX - 6, barY - 10);
    ctx.lineTo(needleX + 6, barY - 10);
    ctx.closePath();
    ctx.fillStyle = "#1e293b";
    ctx.fill();

    ctx.font = "bold 11px 'JetBrains Mono', monospace";
    ctx.textAlign = "center";
    ctx.fillText(`${ocVal}% OC`, needleX, barY - 13);

    ctx.font = "500 8.5px 'Inter', sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("<0.5% Low", pad + 15, barY + barH + 14);
    ctx.fillText("0.75% High Target", pad + barW / 2, barY + barH + 14);
    ctx.fillText(">1.0% Prime Humus", pad + barW - 30, barY + barH + 14);
  },

  // Chart 7 & 8: Historical Telemetry Curve (24h Trend)
  drawTelemetryCurve(canvasId, timestamps, points, color, unit) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !points || !points.length) return;

    const ctx = canvas.getContext("2d");
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const parent = canvas.parentElement;
    const width = Math.max(parent ? parent.clientWidth : 0, 320);
    const height = Math.max(parent ? parent.clientHeight : 0, 160);

    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, width, height);

    const pad = { top: 20, right: 18, bottom: 25, left: 35 };
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;

    const min = Math.min(...points) * 0.9;
    const max = Math.max(...points) * 1.1;
    const range = (max - min) || 1;

    // Grid
    ctx.strokeStyle = "rgba(100, 116, 139, 0.12)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    for (let i = 0; i <= 3; i++) {
      const y = pad.top + (chartH / 3) * i;
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(width - pad.right, y);
      ctx.stroke();

      const val = Math.round(max - (range / 3) * i);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "8.5px 'JetBrains Mono', monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${val}${unit}`, pad.left - 6, y + 3);
    }
    ctx.setLineDash([]);

    const pts = points.map((v, i) => ({
      x: pad.left + (chartW / (points.length - 1)) * i,
      y: pad.top + chartH - ((v - min) / range) * chartH
    }));

    // Area Fill
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const cx = (pts[i].x + pts[i + 1].x) / 2;
      ctx.bezierCurveTo(cx, pts[i].y, cx, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
    }
    ctx.lineTo(pts[pts.length - 1].x, pad.top + chartH);
    ctx.lineTo(pts[0].x, pad.top + chartH);
    ctx.closePath();

    const grad = ctx.createLinearGradient(0, pad.top, 0, pad.top + chartH);
    grad.addColorStop(0, color === "#0284c7" ? "rgba(2, 132, 199, 0.25)" : "rgba(245, 158, 11, 0.25)");
    grad.addColorStop(1, "rgba(255, 255, 255, 0.0)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Stroke
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 0; i < pts.length - 1; i++) {
      const cx = (pts[i].x + pts[i + 1].x) / 2;
      ctx.bezierCurveTo(cx, pts[i].y, cx, pts[i + 1].y, pts[i + 1].x, pts[i + 1].y);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 2.4;
    ctx.stroke();

    // Dots and timestamps
    pts.forEach((pt, i) => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, i === pts.length - 1 ? 4 : 2.5, 0, Math.PI * 2);
      ctx.fillStyle = i === pts.length - 1 ? color : "#ffffff";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();

      if (timestamps[i]) {
        ctx.fillStyle = "#64748b";
        ctx.font = "8px 'Inter', sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(timestamps[i], pt.x, height - 6);
      }
    });
  },

  // 6. Mathematical Soil Quality Index (SQI) Calculation
  calculateSoilHealthScore(properties, nutrients) {
    // 1. pH Score (weight 15%)
    let phScore = 100;
    const ph = properties.ph;
    if (ph < 6.0) phScore = Math.max(30, 100 - (6.0 - ph) * 45);
    else if (ph > 7.5) phScore = Math.max(40, 100 - (ph - 7.5) * 40);

    // 2. Organic Carbon (weight 20%)
    const oc = nutrients.macronutrients.find(m => m.key === "oc")?.value || 0.6;
    let ocScore = 100;
    if (oc >= 0.75) ocScore = 100;
    else if (oc >= 0.50) ocScore = 75 + ((oc - 0.50) / 0.25) * 20;
    else ocScore = Math.max(25, (oc / 0.50) * 60);

    // 3. Macronutrient Sufficiency Index (weight 30%)
    let macroScore = 100;
    let defCount = 0;
    nutrients.macronutrients.forEach(m => {
      if (m.defAlert || m.status === "Deficient") defCount += 1.5;
      else if (m.status === "Low" || m.status === "Low-Medium") defCount += 0.8;
    });
    macroScore = Math.max(30, 100 - defCount * 18);

    // 4. Micronutrient Index (weight 15%)
    let microScore = 100;
    let microDefCount = 0;
    nutrients.micronutrients.forEach(m => {
      if (m.defAlert || m.status === "Deficient") microDefCount += 1;
    });
    microScore = Math.max(35, 100 - microDefCount * 22);

    // 5. Physical Properties (weight 20%)
    let physScore = 100;
    if (properties.compaction > 200) physScore -= 30;
    if (properties.drainageCondition.includes("Poor") || properties.drainageCondition.includes("Impaired")) physScore -= 25;
    if (properties.soilMoisture < 30 || properties.soilMoisture > 70) physScore -= 20;
    physScore = Math.max(40, physScore);

    // Weighted composite
    const composite = (phScore * 0.15) + (ocScore * 0.20) + (macroScore * 0.30) + (microScore * 0.15) + (physScore * 0.20);
    const finalScore = Math.round(composite);

    let grade = "Grade A+ (Prime Fertility)";
    if (finalScore < 55) grade = "Grade C (Degraded / Urgent Action)";
    else if (finalScore < 70) grade = "Grade B (Moderate Fertility)";
    else if (finalScore < 85) grade = "Grade A (Good Soil Health)";

    return { score: finalScore, grade, phScore, ocScore, macroScore, microScore, physScore };
  },

  // 7. Manual Entry & Laboratory Test Management
  openAddTestModal(zoneId) {
    const data = window.SOIL_ANALYSIS_DATA.zones[zoneId || this.activeZoneId];
    if (!data) return;

    this.setText("soil-modal-title", `Add New Laboratory Soil Test • Zone ${data.number}`);
    document.getElementById("form-zone-id").value = data.id;
    document.getElementById("form-sample-id").value = `KY-SOIL-Z${data.number}-${new Date().getFullYear()}-NOV`;
    document.getElementById("form-test-date").value = new Date().toISOString().split("T")[0];
    document.getElementById("form-lab-name").value = data.testingLab;

    // Prefill with realistic baseline
    document.getElementById("form-ph").value = data.properties.ph;
    document.getElementById("form-ec").value = data.properties.ec;
    document.getElementById("form-moisture").value = data.properties.soilMoisture;
    document.getElementById("form-texture").value = data.properties.soilTexture;
    document.getElementById("form-compaction").value = data.properties.compaction;

    const n = data.nutrients.macronutrients;
    document.getElementById("form-n").value = n.find(m => m.key === "n")?.value || 280;
    document.getElementById("form-p").value = n.find(m => m.key === "p")?.value || 25;
    document.getElementById("form-k").value = n.find(m => m.key === "k")?.value || 220;
    document.getElementById("form-oc").value = n.find(m => m.key === "oc")?.value || 0.65;
    document.getElementById("form-s").value = n.find(m => m.key === "s")?.value || 16;

    const m = data.nutrients.micronutrients;
    document.getElementById("form-zn").value = m.find(x => x.key === "zn")?.value || 0.8;
    document.getElementById("form-fe").value = m.find(x => x.key === "fe")?.value || 6.5;
    document.getElementById("form-cu").value = m.find(x => x.key === "cu")?.value || 0.4;
    document.getElementById("form-mn").value = m.find(x => x.key === "mn")?.value || 4.0;
    document.getElementById("form-b").value = m.find(x => x.key === "b")?.value || 0.6;

    const modal = document.getElementById("soil-test-modal");
    if (modal) modal.classList.add("modal-open");
  },

  openEditTestModal(zoneId) {
    this.openAddTestModal(zoneId);
    this.setText("soil-modal-title", `Edit Active Soil Test Records • Zone ${window.SOIL_ANALYSIS_DATA.zones[zoneId].number}`);
  },

  saveSoilTestForm(event) {
    if (event) event.preventDefault();
    const zoneId = document.getElementById("form-zone-id").value;
    const targetZone = window.SOIL_ANALYSIS_DATA.zones[zoneId];
    if (!targetZone) return;

    // Extract form values
    const sampleId = document.getElementById("form-sample-id").value.trim() || `KY-SOIL-${zoneId.toUpperCase()}`;
    const testDate = document.getElementById("form-test-date").value || new Date().toISOString().split("T")[0];
    const labName = document.getElementById("form-lab-name").value.trim() || "Regional Soil Testing Laboratory";
    const source = document.getElementById("form-source-type").value || "lab";

    const ph = parseFloat(document.getElementById("form-ph").value) || 6.5;
    const ec = parseFloat(document.getElementById("form-ec").value) || 1.2;
    const moisture = parseFloat(document.getElementById("form-moisture").value) || 50;
    const texture = document.getElementById("form-texture").value.trim() || "Sandy Loam";
    const compaction = parseInt(document.getElementById("form-compaction").value) || 130;

    const n = parseFloat(document.getElementById("form-n").value) || 280;
    const p = parseFloat(document.getElementById("form-p").value) || 24;
    const k = parseFloat(document.getElementById("form-k").value) || 220;
    const oc = parseFloat(document.getElementById("form-oc").value) || 0.65;
    const s = parseFloat(document.getElementById("form-s").value) || 16;

    const zn = parseFloat(document.getElementById("form-zn").value) || 0.8;
    const fe = parseFloat(document.getElementById("form-fe").value) || 6.5;
    const cu = parseFloat(document.getElementById("form-cu").value) || 0.4;
    const mn = parseFloat(document.getElementById("form-mn").value) || 4.0;
    const b = parseFloat(document.getElementById("form-b").value) || 0.6;

    // Update active zone properties
    targetZone.sampleId = sampleId;
    targetZone.testingDate = testDate;
    targetZone.testingLab = labName;
    targetZone.sourceType = source;
    targetZone.measurementSource = source === "lab" ? `Verified Lab Report (${labName})` : source === "sensor" ? "ESP32 Continuous Telemetry" : "Manual Farmer Entry";

    targetZone.properties.ph = ph;
    targetZone.properties.phStatus = ph < 6.0 ? "Acidic" : ph > 7.5 ? "Alkaline" : "Neutral / Optimal";
    targetZone.properties.ec = ec;
    targetZone.properties.ecStatus = ec > 1.6 ? "Saline Warning" : "Normal";
    targetZone.properties.soilMoisture = moisture;
    targetZone.properties.soilTexture = texture;
    targetZone.properties.compaction = compaction;
    targetZone.properties.compactionRating = compaction > 200 ? "High Compaction (Hardpan)" : "Optimal";

    // Update nutrients
    targetZone.nutrients.macronutrients.forEach(item => {
      if (item.key === "n") { item.value = n; item.status = n < 280 ? "Deficient" : n > 560 ? "High" : "Medium"; item.defAlert = n < 280; }
      if (item.key === "p") { item.value = p; item.status = p < 23 ? "Deficient" : p > 56 ? "High" : "Medium"; item.defAlert = p < 23; }
      if (item.key === "k") { item.value = k; item.status = k < 145 ? "Deficient" : k > 335 ? "High" : "Medium"; item.defAlert = k < 145; }
      if (item.key === "oc") { item.value = oc; item.status = oc < 0.5 ? "Low" : oc > 0.75 ? "High" : "Medium"; item.defAlert = oc < 0.5; }
      if (item.key === "s") { item.value = s; item.status = s < 10 ? "Deficient" : "Sufficient"; item.defAlert = s < 10; }
    });

    targetZone.nutrients.micronutrients.forEach(item => {
      if (item.key === "zn") { item.value = zn; item.status = zn < 0.6 ? "Deficient" : "Adequate"; item.defAlert = zn < 0.6; }
      if (item.key === "fe") { item.value = fe; item.status = fe < 4.5 ? "Deficient" : "Adequate"; item.defAlert = fe < 4.5; }
      if (item.key === "cu") { item.value = cu; item.status = cu < 0.2 ? "Deficient" : "Adequate"; item.defAlert = cu < 0.2; }
      if (item.key === "mn") { item.value = mn; item.status = mn < 2.0 ? "Deficient" : "Adequate"; item.defAlert = mn < 2.0; }
      if (item.key === "b") { item.value = b; item.status = b < 0.5 ? "Deficient" : "Adequate"; item.defAlert = b < 0.5; }
    });

    // Recalculate Soil Health Score
    const newHealth = this.calculateSoilHealthScore(targetZone.properties, targetZone.nutrients);
    targetZone.soilHealth.score = newHealth.score;
    targetZone.soilHealth.grade = newHealth.grade;

    // Archive in test history
    if (!targetZone.testHistory) targetZone.testHistory = [];
    targetZone.testHistory.unshift({
      sampleId,
      date: testDate,
      lab: labName,
      score: newHealth.score,
      ph, ec, oc, n, p, k,
      notes: `Updated via Soil Test Form (${source})`
    });

    // Persist & sync
    this.persistData();
    this.syncZoneToFirebase(zoneId, targetZone);

    // Close modal
    const modal = document.getElementById("soil-test-modal");
    if (modal) modal.classList.remove("modal-open");

    // Re-render
    this.render8ZoneSummary();
    this.renderDedicatedZoneView(zoneId);

    if (window.App && App.showToast) {
      App.showToast(`✅ Soil test report for Zone ${targetZone.number} saved & Soil Health recalculated!`);
    }
  },

  openTestHistoryModal(zoneId) {
    const data = window.SOIL_ANALYSIS_DATA.zones[zoneId || this.activeZoneId];
    if (!data) return;

    this.setText("history-modal-title", `Historical Soil Test Logs • Zone ${data.number}`);
    const tableBody = document.getElementById("history-table-body");
    if (tableBody) {
      const history = data.testHistory || [];
      tableBody.innerHTML = history.map(h => `
        <tr>
          <td><strong>${h.date}</strong></td>
          <td><span class="history-sample-tag">${h.sampleId}</span></td>
          <td>${h.lab}</td>
          <td><strong style="color:var(--primary); font-size:0.95rem;">${h.score}/100</strong></td>
          <td>pH ${h.ph}</td>
          <td>${h.oc}%</td>
          <td>${h.n} / ${h.p} / ${h.k}</td>
          <td><span class="history-notes-text">${h.notes || 'Routine assay'}</span></td>
        </tr>
      `).join("");
    }

    const modal = document.getElementById("soil-history-modal");
    if (modal) modal.classList.add("modal-open");
  },

  // 8. Printable PDF Soil Health Certificate
  downloadReportPdf(zoneId) {
    const data = window.SOIL_ANALYSIS_DATA.zones[zoneId || this.activeZoneId];
    if (!data) return;

    const printContainer = document.getElementById("soil-print-certificate");
    if (!printContainer) return;

    const allNutrients = [
      ...data.nutrients.macronutrients,
      ...data.nutrients.micronutrients
    ];

    printContainer.innerHTML = `
      <div class="print-certificate-body">
        <div class="cert-header">
          <div class="cert-flag-line"></div>
          <div class="cert-title-group">
            <h1 class="cert-main-title">KRUSHI YANTRA • SOIL HEALTH CARD</h1>
            <div class="cert-subtitle">Department of Agriculture & Farmers Welfare • Digital Soil Intelligence Gateway</div>
            <div class="cert-lab-name">Authorized Laboratory: ${data.testingLab} (Accreditation: NABL / AGRI-SOIL-7742)</div>
          </div>
          <div class="cert-qr-block">
            <div class="cert-stamp">VALIDATED<br>LAB REPORT</div>
          </div>
        </div>

        <div class="cert-farmer-grid">
          <div><span>Farm Plot:</span> <strong>One Acre Intelligent Farm • Sector 08</strong></div>
          <div><span>Zone Identifier:</span> <strong>Zone ${data.number} (${data.crop})</strong></div>
          <div><span>Sample Serial ID:</span> <strong>${data.sampleId}</strong></div>
          <div><span>Sampling Date:</span> <strong>${data.collectionDate}</strong></div>
          <div><span>Testing Date:</span> <strong>${data.testingDate}</strong></div>
          <div><span>Chief Agronomist:</span> <strong>Dr. Arvind S. Sharma (Lead Soil Chemist)</strong></div>
        </div>

        <div class="cert-score-banner">
          <div class="cert-score-box">
            <div class="cs-num">${data.soilHealth.score}<span>/100</span></div>
            <div class="cs-grade">${data.soilHealth.grade}</div>
          </div>
          <div class="cert-summary-bullets">
            <div>● <strong>Fertility Assessment:</strong> ${data.soilHealth.fertilityStatus}</div>
            <div>● <strong>Soil Reaction:</strong> pH ${data.properties.ph} (${data.properties.phStatus})</div>
            <div>● <strong>Salinity / Conductivity:</strong> ${data.properties.ec} dS/m (${data.properties.ecStatus})</div>
            <div>● <strong>Organic Carbon:</strong> ${data.soilHealth.ocStatus}</div>
            <div>● <strong>Soil Texture & Tilth:</strong> ${data.properties.soilTexture} • ${data.properties.soilType}</div>
          </div>
        </div>

        <h3 class="cert-section-h3">Comprehensive Chemical & Physical Test Parameters</h3>
        <table class="cert-param-table">
          <thead>
            <tr>
              <th>Test Parameter</th>
              <th>Observed Reading</th>
              <th>Standard Safe Limits</th>
              <th>Nutrient Rating</th>
              <th>Agronomic Improvement Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Soil Reaction (pH)</td>
              <td><strong>${data.properties.ph}</strong></td>
              <td>6.0 - 7.5</td>
              <td>${data.properties.phStatus.split(' ')[0]}</td>
              <td>${data.properties.ph < 6.0 ? 'Apply Lime @ 250 kg/acre' : data.properties.ph > 7.6 ? 'Apply Gypsum' : 'Optimal Reaction'}</td>
            </tr>
            <tr>
              <td>Electrical Conductivity (EC)</td>
              <td><strong>${data.properties.ec} dS/m</strong></td>
              <td>< 1.6 dS/m</td>
              <td>${data.properties.ecStatus.split(' ')[0]}</td>
              <td>${data.properties.ec > 1.6 ? 'Leaching Fraction Required' : 'Safe Non-Saline Buffer'}</td>
            </tr>
            ${allNutrients.map(n => `
              <tr>
                <td>${n.name}</td>
                <td><strong>${n.value} ${n.unit}</strong></td>
                <td>${n.range}</td>
                <td style="font-weight:700; color:${n.defAlert ? '#dc2626' : '#16a34a'};">${n.status}</td>
                <td>${n.advice}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>

        <h3 class="cert-section-h3" style="margin-top:16px;">Top Recommended Crops for this Zone</h3>
        <div class="cert-crops-list">
          ${data.cropSuitability.mostSuitable.map(c => `
            <div class="cert-crop-pill">
              <strong>${c.name}:</strong> ${c.suitabilityScore}% Suitability Match • Water: ${c.waterReq}
            </div>
          `).join("")}
        </div>

        <div class="cert-signatures-row">
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>Authorized Analytical Chemist</div>
            <div style="font-size:0.7rem; color:#64748b;">ICAR National Soil Testing Centre</div>
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            <div>Chief Agronomist & Soil Specialist</div>
            <div style="font-size:0.7rem; color:#64748b;">Krushi Yantra Soil Intelligence Bureau</div>
          </div>
        </div>
      </div>
    `;

    // Open print preview
    window.print();
  },

  // 9. Firebase Realtime / Firestore Integration & Sync
  syncZoneToFirebase(zoneId, zoneData) {
    if (!this.firebaseConfig.enabled || !this.firebaseConfig.databaseUrl) {
      // Local persistence fallback
      return;
    }

    try {
      const endpoint = `${this.firebaseConfig.databaseUrl.replace(/\/$/, "")}/soil_analysis/${zoneId.replace("-", "_")}.json`;
      const payload = {
        zone_id: zoneId,
        current_test: {
          sample_id: zoneData.sampleId,
          collection_date: zoneData.collectionDate,
          testing_date: zoneData.testingDate,
          lab_name: zoneData.testingLab,
          measurement_source: zoneData.measurementSource,
          source_type: zoneData.sourceType,
          properties: zoneData.properties,
          macronutrients: zoneData.nutrients.macronutrients,
          micronutrients: zoneData.nutrients.micronutrients
        },
        soil_health: zoneData.soilHealth,
        test_history: zoneData.testHistory,
        recommendations: zoneData.improvementPlan,
        crop_suitability: zoneData.cropSuitability,
        last_updated: new Date().toISOString()
      };

      fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
      .then(res => res.json())
      .then(resp => {
        console.log(`[SoilAnalysis] Synced ${zoneId} to Firebase:`, resp);
        this.firebaseConfig.lastSyncTime = new Date().toISOString();
      })
      .catch(err => {
        console.warn(`[SoilAnalysis] Firebase sync failed for ${zoneId} (offline fallback active):`, err);
      });
    } catch (e) {
      console.warn("[SoilAnalysis] Firebase sync exception:", e);
    }
  },

  syncAllZonesToFirebase() {
    if (!window.SOIL_ANALYSIS_DATA || !window.SOIL_ANALYSIS_DATA.zones) return;
    Object.keys(window.SOIL_ANALYSIS_DATA.zones).forEach(zoneId => {
      this.syncZoneToFirebase(zoneId, window.SOIL_ANALYSIS_DATA.zones[zoneId]);
    });
  },

  // 10. Live Sensor Telemetry Handling (ESP32 Integration)
  handleLiveSensorUpdate(farmZones) {
    if (!farmZones || !farmZones.length || !window.SOIL_ANALYSIS_DATA) return;

    let hasChanges = false;
    farmZones.forEach(fz => {
      const soilZone = window.SOIL_ANALYSIS_DATA.zones[fz.id];
      if (soilZone) {
        if (fz.soilMoisture !== undefined && soilZone.properties.soilMoisture !== fz.soilMoisture) {
          soilZone.properties.soilMoisture = fz.soilMoisture;
          hasChanges = true;
        }
        if (fz.soilTemp !== undefined && soilZone.properties.soilTemp !== fz.soilTemp) {
          soilZone.properties.soilTemp = fz.soilTemp;
          hasChanges = true;
        }
      }
    });

    if (hasChanges) {
      this.render8ZoneSummary();
      const current = window.SOIL_ANALYSIS_DATA.zones[this.activeZoneId];
      if (current) {
        this.renderBasicProperties(current);
        this.renderExecutiveHealthScore(current);
      }
    }
  },

  // Utilities
  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  roundRect(ctx, x, y, width, height, radius, fill) {
    if (height < 2) return;
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x, y + r);
    ctx.lineTo(x, y + height);
    ctx.lineTo(x + width, y + height);
    ctx.lineTo(x + width, y + r);
    ctx.quadraticCurveTo(x + width, y, x + width - r, y);
    ctx.lineTo(x + r, y);
    ctx.quadraticCurveTo(x, y, x, y + r);
    ctx.closePath();
    if (fill) ctx.fill();
  }
};

window.SoilAnalysis = SoilAnalysis;

// Auto-initialize when DOM is ready
if (typeof document !== "undefined") {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => SoilAnalysis.init());
  } else {
    SoilAnalysis.init();
  }
}

