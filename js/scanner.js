/**
 * PlantDr AgroPalm - Mobile Leaf Scanner & Crop Health Diagnostics
 * Simulated AI Computer Vision scanner for in-field handheld crop disease identification.
 */

const LeafDoctor = {
  activeSampleIndex: 0,
  isScanning: false,

  init() {
    this.bindEvents();
    this.loadSample(0);
  },

  bindEvents() {
    const sampleBtns = document.querySelectorAll(".sample-select-btn");
    sampleBtns.forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        sampleBtns.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.loadSample(idx);
      });
    });

    const triggerScanBtn = document.getElementById("trigger-scan-btn");
    if (triggerScanBtn) {
      triggerScanBtn.addEventListener("click", () => this.runScanAnimation());
    }

    const fileInput = document.getElementById("leaf-camera-upload");
    if (fileInput) {
      fileInput.addEventListener("change", (e) => this.handleCustomUpload(e));
    }

    const speakDiagnosisBtn = document.getElementById("speak-diagnosis-btn");
    if (speakDiagnosisBtn) {
      speakDiagnosisBtn.addEventListener("click", () => this.speakDiagnosis());
    }
  },

  loadSample(index) {
    this.activeSampleIndex = index;
    const sample = FARM_DATA.diagnosticSamples[index];
    if (!sample) return;

    const previewImg = document.getElementById("leaf-scan-preview");
    if (previewImg) {
      previewImg.src = sample.image;
    }

    this.renderDiagnosticResult(sample);
  },

  handleCustomUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const previewImg = document.getElementById("leaf-scan-preview");
      if (previewImg) {
        previewImg.src = e.target.result;
      }

      // Generate a dynamic diagnosis for user upload
      const customSample = {
        name: "Cercospora Leaf Spot / Nutrient Imbalance",
        cropType: "Scanned Field Foliage",
        confidence: 94.2,
        severity: "Mild (18% Affected Area)",
        symptoms: "Circular necrotic spots observed with halo margins. Probable early fungal onset or minor magnesium deficiency.",
        cause: "High morning dew duration combined with warm ambient temperature or localized soil compaction.",
        impact: "Low risk if treated within 48-72 hours. Yield impact expected < 5%.",
        actionPlan: [
          { category: "Curative Spray", text: "Apply Mancozeb 75% WP (2 g/L) or Copper oxychloride (2.5 g/L)." },
          { category: "Foliar Nutrition", text: "Add 1% Magnesium Sulfate + Chelated Micronutrients to tank mix." },
          { category: "Monitoring", text: "Re-scan the field section in 4 days to verify arrest of lesion expansion." }
        ]
      };

      this.runScanAnimation(() => {
        this.renderDiagnosticResult(customSample);
      });
    };
    reader.readAsDataURL(file);
  },

  runScanAnimation(callback) {
    if (this.isScanning) return;
    this.isScanning = true;

    const laser = document.getElementById("scanner-laser-line");
    const scanStatus = document.getElementById("scanner-status-text");
    const boundingBox = document.getElementById("scanner-bounding-box");
    const triggerBtn = document.getElementById("trigger-scan-btn");

    if (triggerBtn) triggerBtn.disabled = true;
    if (laser) laser.style.display = "block";
    if (boundingBox) boundingBox.style.opacity = "0";
    if (scanStatus) scanStatus.innerHTML = `<span class="pulse-dot active"></span> Analyzing crop leaf tissue...`;

    // Audio or haptic feedback if supported
    if ("vibrate" in navigator) {
      navigator.vibrate([40, 60, 40]);
    }

    setTimeout(() => {
      if (scanStatus) scanStatus.innerHTML = `<span class="pulse-dot active"></span> Segmenting chlorophyll & lesion boundaries...`;
      if (boundingBox) boundingBox.style.opacity = "1";
    }, 900);

    setTimeout(() => {
      if (laser) laser.style.display = "none";
      if (scanStatus) scanStatus.innerHTML = `✓ AI Diagnosis Complete`;
      this.isScanning = false;
      if (triggerBtn) triggerBtn.disabled = false;

      if (callback) {
        callback();
      } else {
        const sample = FARM_DATA.diagnosticSamples[this.activeSampleIndex];
        this.renderDiagnosticResult(sample);
      }
    }, 1800);
  },

  renderDiagnosticResult(sample) {
    const nameEl = document.getElementById("diag-disease-name");
    const cropEl = document.getElementById("diag-crop-name");
    const confEl = document.getElementById("diag-confidence-val");
    const sevEl = document.getElementById("diag-severity-val");
    const symEl = document.getElementById("diag-symptoms");
    const causeEl = document.getElementById("diag-cause");
    const actionsEl = document.getElementById("diag-action-list");
    const badgeEl = document.getElementById("diag-status-badge");

    if (nameEl) nameEl.textContent = sample.name;
    if (cropEl) cropEl.textContent = sample.cropType;
    if (confEl) confEl.textContent = `${sample.confidence}%`;
    if (sevEl) sevEl.textContent = sample.severity;
    if (symEl) symEl.textContent = sample.symptoms;
    if (causeEl) causeEl.textContent = sample.cause;

    if (badgeEl) {
      if (sample.name.includes("Healthy")) {
        badgeEl.className = "diag-badge badge-success";
        badgeEl.textContent = "Crop Vigor: Excellent";
      } else {
        badgeEl.className = "diag-badge badge-warning";
        badgeEl.textContent = "Action Required";
      }
    }

    if (actionsEl && sample.actionPlan) {
      actionsEl.innerHTML = sample.actionPlan.map(act => `
        <div class="action-item">
          <div class="action-tag">${act.category}</div>
          <div class="action-content">${act.text}</div>
        </div>
      `).join("");
    }
  },

  speakDiagnosis() {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    const sample = FARM_DATA.diagnosticSamples[this.activeSampleIndex];
    if (!sample) return;

    window.speechSynthesis.cancel(); // Stop any ongoing speech

    const textToSpeak = `Plant Doctor diagnosis for ${sample.cropType}. Detected: ${sample.name}, with ${sample.confidence} percent confidence. Severity is ${sample.severity}. Recommended immediate action: ${sample.actionPlan[0]?.text || "Inspect field closely."}`;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    // Animate the voice button
    const btn = document.getElementById("speak-diagnosis-btn");
    if (btn) btn.classList.add("speaking-active");

    utterance.onend = () => {
      if (btn) btn.classList.remove("speaking-active");
    };

    window.speechSynthesis.speak(utterance);
  }
};

window.LeafDoctor = LeafDoctor;
