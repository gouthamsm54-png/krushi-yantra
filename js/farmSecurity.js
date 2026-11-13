/**
 * One Acre Intelligent Farm - Night Security & Autonomous Drone Defense System
 * Features: 4 Camera status, IR/Thermal overlay, AI object detection,
 * and Autonomous Drone Zone Interceptor that scrambles, flies to target coordinates,
 * and chases animals/intruders out of the 1-acre field.
 */

const FarmSecurity = {
  activeCamera: "CAM-03",
  droneMissionActive: false,
  droneTimeoutIds: [],
  audioCtx: null,

  // Zone coordinates on the 2D radar grid (% top, % left)
  zoneCoordinates: {
    "Zone 01": { top: 18, left: 14 },
    "Zone 02": { top: 18, left: 38 },
    "Zone 03": { top: 18, left: 63 },
    "Zone 04": { top: 18, left: 88 },
    "Zone 05": { top: 82, left: 14 },
    "Zone 06": { top: 82, left: 38 },
    "Zone 07": { top: 82, left: 63 },
    "Zone 08": { top: 82, left: 88 },
    "Hangar":  { top: 50, left: 50 }
  },

  init() {
    this.bindEvents();
    this.renderDetectionCounts();
    if (window.ONE_ACRE_FARM && window.ONE_ACRE_FARM.security && window.ONE_ACRE_FARM.security.incidents) {
      this.renderIncidentDetails(window.ONE_ACRE_FARM.security.incidents[0]);
    }
  },

  bindEvents() {
    const camButtons = document.querySelectorAll(".cam-select-btn");
    camButtons.forEach(btn => {
      btn.addEventListener("click", () => {
        camButtons.forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        this.activeCamera = btn.getAttribute("data-cam");
        this.switchCameraFeed(this.activeCamera);
      });
    });

    const triggerDeterrenceBtn = document.getElementById("trigger-deterrence-btn");
    if (triggerDeterrenceBtn) {
      triggerDeterrenceBtn.addEventListener("click", () => {
        this.triggerAutoDefense("Wild Boar", "Zone 06", "CAM-03");
      });
    }
  },

  getAudioContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  },

  playAlertTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  },

  playSonicSirenTone() {
    try {
      const ctx = this.getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(600, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1400, ctx.currentTime + 0.2);
      osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.4);
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      // Graceful fallback
    }
  },

  switchCameraFeed(camId) {
    const feedImg = document.getElementById("security-feed-image");
    const camLabel = document.getElementById("current-cam-label");
    const cameras = window.ONE_ACRE_FARM ? window.ONE_ACRE_FARM.security.cameras : [];
    const camObj = cameras.find(c => c.id === camId);

    if (camLabel && camObj) {
      camLabel.textContent = `${camObj.id} • ${camObj.name}`;
    }

    if (feedImg) {
      if (camId === "CAM-03") {
        feedImg.src = "assets/thermal_security_cam.jpg";
      } else {
        feedImg.src = "assets/field_satellite.jpg";
      }
    }
  },

  renderDetectionCounts() {
    const counts = window.ONE_ACRE_FARM ? window.ONE_ACRE_FARM.security.detectedCounts : { human: 0, rodent: 1, wildBoar: 1, dog: 0, livestock: 0, unknown: 0 };
    const container = document.getElementById("security-ai-counts-grid");
    if (!container) return;

    const items = [
      { label: "Human", count: counts.human, icon: "👤", badge: "0 Logged" },
      { label: "Rodent", count: counts.rodent, icon: "🐀", badge: "1 Screened" },
      { label: "Wild Boar", count: counts.wildBoar, icon: "🐗", badge: "1 Active Alert", alert: true },
      { label: "Canine / Dog", count: counts.dog, icon: "🐕", badge: "0 Logged" },
      { label: "Livestock", count: counts.livestock, icon: "🐄", badge: "0 Logged" },
      { label: "Unknown Obj", count: counts.unknown, icon: "❓", badge: "0 Logged" }
    ];

    container.innerHTML = items.map(item => `
      <div class="ai-detect-stat-card ${item.alert ? 'alert-highlight' : ''}">
        <div class="detect-icon">${item.icon}</div>
        <div class="detect-info">
          <div class="detect-name">${item.label}</div>
          <div class="detect-count">${item.count}</div>
          <span class="detect-badge ${item.alert ? 'badge-danger' : 'badge-subtle'}">${item.badge}</span>
        </div>
      </div>
    `).join("");
  },

  renderIncidentDetails(incident) {
    if (!incident) return;
    this.setText("incident-title", incident.detectedObject);
    this.setText("incident-zone", incident.zone);
    this.setText("incident-cam", incident.camera);
    this.setText("incident-time", incident.time);
    this.setText("incident-confidence", `${incident.confidence}% AI Match`);
    this.setText("incident-thermal", incident.thermalSignature);
    this.setText("incident-deterrence", incident.deterrenceStatus);
    this.setText("incident-alert-status", incident.farmerAlertStatus);
  },

  setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
  },

  logDroneEvent(message, type = "normal") {
    const logBox = document.getElementById("drone-live-log-box");
    if (!logBox) return;

    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0];
    const logLine = document.createElement("div");
    logLine.className = `log-line ${type === 'alert' ? 'text-danger' : type === 'success' ? 'text-success' : 'text-primary-water'}`;
    logLine.innerHTML = `<strong>[${timeStr}]</strong> ${message}`;
    logBox.prepend(logLine);
  },

  setMissionStep(activeStepNumber) {
    for (let i = 1; i <= 5; i++) {
      const stepEl = document.getElementById(`m-step-${i}`);
      const connEl = document.getElementById(`m-conn-${i}`);
      if (stepEl) {
        stepEl.classList.remove("active", "completed");
        if (i < activeStepNumber) stepEl.classList.add("completed");
        if (i === activeStepNumber) stepEl.classList.add("active");
      }
      if (connEl) {
        connEl.classList.remove("active");
        if (i < activeStepNumber) connEl.classList.add("active");
      }
    }
  },

  /**
   * PRIMARY AUTONOMOUS DRONE WORKFLOW
   * 1. Detect presence of animal or human on Camera
   * 2. Send Alert to Drone Zone
   * 3. Drone scrambles & flies across farm radar to target zone
   * 4. Drone arrives, shines spotlight, emits ultrasonic repeller, and chases animal out of field
   * 5. Animal retreats outside boundary fence, drone returns to dock (RTH)
   */
  triggerAutoDefense(entityType = "Wild Boar", zoneId = "Zone 06", camId = "CAM-03") {
    if (this.droneMissionActive) {
      if (window.App && App.showToast) App.showToast("Drone is already engaged on an active interception mission!");
      return;
    }

    this.droneMissionActive = true;
    this.clearAllTimers();

    // 1. Switch to Camera & Trigger Visual Camera Alert
    this.switchCameraFeed(camId);
    const camButtons = document.querySelectorAll(".cam-select-btn");
    camButtons.forEach(b => {
      b.classList.toggle("active", b.getAttribute("data-cam") === camId);
    });

    const feedWrapper = document.querySelector(".thermal-feed-wrapper");
    if (feedWrapper) feedWrapper.classList.add("strobe-flash-active");

    const droneSprite = document.getElementById("radar-drone-sprite");
    const intruderMarker = document.getElementById("radar-intruder-marker");
    const intruderEmoji = document.getElementById("radar-intruder-emoji");
    const intruderTag = document.getElementById("radar-intruder-tag");
    const statusBadge = document.getElementById("drone-dock-status-badge");
    const statusText = document.getElementById("drone-dock-status-text");
    const coordsText = document.getElementById("drone-flight-coords");

    // Configure intruder emoji
    let emoji = "🐗";
    if (entityType.toLowerCase().includes("human")) emoji = "👤";
    else if (entityType.toLowerCase().includes("rodent")) emoji = "🐀";
    if (intruderEmoji) intruderEmoji.textContent = emoji;
    if (intruderTag) intruderTag.textContent = entityType;

    // Highlight target on radar
    const targetCoords = this.zoneCoordinates[zoneId] || { top: 82, left: 38 };
    if (intruderMarker) {
      intruderMarker.style.display = "flex";
      intruderMarker.style.top = `${targetCoords.top}%`;
      intruderMarker.style.left = `${targetCoords.left}%`;
      intruderMarker.classList.add("radar-pulse-alert");
    }

    // --- STEP 1: CAMERA AI DETECTION ---
    this.setMissionStep(1);
    this.playAlertTone();
    this.logDroneEvent(`🎯 Camera ${camId} AI locked onto ${entityType} in ${zoneId} (Thermal confidence 94%).`, "alert");
    
    if (window.App && App.showToast) {
      App.showToast(`🚨 ${entityType.toUpperCase()} DETECTED in ${zoneId}! Telemetry transmitting...`);
    }

    // --- STEP 2: ALERT SENT TO DRONE ZONE (after 900ms) ---
    this.droneTimeoutIds.push(setTimeout(() => {
      this.setMissionStep(2);
      this.playAlertTone();
      if (statusBadge) {
        statusBadge.className = "drone-dock-badge status-alert";
      }
      if (statusText) statusText.textContent = `ALERT TO DRONE ZONE • SCRAMBLING`;
      if (coordsText) coordsText.textContent = `ALERT: Vector locked to ${zoneId} • Ready for launch`;

      this.logDroneEvent(`📡 Priority Alert received at Drone Dock Hangar: Scrambling GARUDA-01 to ${zoneId}.`, "alert");

      // --- STEP 3: DRONE LAUNCH & FLIGHT (after 1800ms) ---
      this.droneTimeoutIds.push(setTimeout(() => {
        this.setMissionStep(3);
        if (droneSprite) droneSprite.classList.add("drone-in-flight");
        if (statusBadge) statusBadge.className = "drone-dock-badge status-flight";
        if (statusText) statusText.textContent = `DRONE EN ROUTE TO ${zoneId.toUpperCase()}`;

        this.setText("drone-telemetry-speed", "44.8 km/h");
        this.setText("drone-telemetry-alt", "14.2 m");

        // Animate drone flying across the radar to the zone coordinates
        if (droneSprite) {
          droneSprite.style.transition = "top 2.2s cubic-bezier(0.25, 0.1, 0.25, 1), left 2.2s cubic-bezier(0.25, 0.1, 0.25, 1), transform 0.5s ease";
          droneSprite.style.top = `${targetCoords.top}%`;
          droneSprite.style.left = `${targetCoords.left}%`;
        }

        this.logDroneEvent(`🚀 Agro-Drone GARUDA-01 airborne! Climbing to 14m, cruising at 45 km/h towards ${zoneId}.`, "normal");

        // --- STEP 4: INTERCEPT & CHASE ANIMAL OUT (after 2400ms flight) ---
        this.droneTimeoutIds.push(setTimeout(() => {
          this.setMissionStep(4);
          this.playSonicSirenTone();
          if (droneSprite) droneSprite.classList.add("chasing-active");
          if (statusBadge) statusBadge.className = "drone-dock-badge status-deterring";
          if (statusText) statusText.textContent = `CHASING ${entityType.toUpperCase()} OUT OF FIELD`;

          this.setText("drone-telemetry-speed", "18.5 km/h");
          this.setText("drone-telemetry-alt", "6.5 m (Low-Altitude Repel)");

          this.logDroneEvent(`🔊 GARUDA-01 arrived at ${zoneId}! 120dB ultrasonic wave & 2400lm strobe spotlight engaged!`, "alert");

          const detIndicator = document.getElementById("deterrence-live-indicator");
          if (detIndicator) {
            detIndicator.innerHTML = `<span class="pulse-dot active" style="background:#ef4444;"></span> Drone actively chasing ${entityType} over farm boundary wire!`;
          }

          // Move the intruder animal OUT of the field (fleeing off the radar)
          if (intruderMarker) {
            intruderMarker.style.transition = "top 1.6s ease-in, left 1.6s ease-in, opacity 1.6s ease";
            intruderMarker.style.top = `${targetCoords.top + 16}%`; // Past the southern fence!
            intruderMarker.style.opacity = "0.2";
          }

          this.logDroneEvent(`💨 Target retreating! ${entityType} fleeing south beyond perimeter boundary fence.`, "success");

          // --- STEP 5: PERIMETER SECURED & DRONE RETURNS TO BASE (after 2200ms) ---
          this.droneTimeoutIds.push(setTimeout(() => {
            this.setMissionStep(5);
            if (feedWrapper) feedWrapper.classList.remove("strobe-flash-active");
            if (droneSprite) droneSprite.classList.remove("chasing-active");
            if (intruderMarker) {
              intruderMarker.style.display = "none";
              intruderMarker.style.opacity = "1";
            }

            if (statusBadge) statusBadge.className = "drone-dock-badge status-docked";
            if (statusText) statusText.textContent = `MISSION SUCCESS • RETURNING TO DOCK`;

            this.logDroneEvent(`✅ ${entityType} completely chased out of farm field! Perimeter 100% secured.`, "success");

            if (detIndicator) {
              detIndicator.innerHTML = `✓ Perimeter Secured. Drone successfully chased ${entityType} outside boundary fence.`;
            }

            if (window.App && App.showToast) {
              App.showToast(`✅ Drone successfully chased ${entityType} out of field!`);
            }

            // Drone flies back to central Hangar
            if (droneSprite) {
              droneSprite.style.transition = "top 2s ease-in-out, left 2s ease-in-out";
              droneSprite.style.top = `50%`;
              droneSprite.style.left = `50%`;
            }

            // Docking complete
            this.droneTimeoutIds.push(setTimeout(() => {
              if (droneSprite) droneSprite.classList.remove("drone-in-flight");
              if (statusText) statusText.textContent = `DRONE DOCKED • RECHARGING`;
              this.setText("drone-telemetry-speed", "0.0 km/h");
              this.setText("drone-telemetry-alt", "0.0 m (AGL)");
              this.setText("drone-telemetry-batt", "96% (Solar Dock)");
              this.logDroneEvent(`🏡 GARUDA-01 landed and locked into Hangar Dock. Battery recharging.`, "normal");
              this.droneMissionActive = false;
            }, 2100));

          }, 2400));

        }, 2400));

      }, 1000));

    }, 900));
  },

  abortDroneMission() {
    this.clearAllTimers();
    this.droneMissionActive = false;

    const droneSprite = document.getElementById("radar-drone-sprite");
    const intruderMarker = document.getElementById("radar-intruder-marker");
    const feedWrapper = document.querySelector(".thermal-feed-wrapper");
    const statusBadge = document.getElementById("drone-dock-status-badge");
    const statusText = document.getElementById("drone-dock-status-text");

    if (feedWrapper) feedWrapper.classList.remove("strobe-flash-active");
    if (intruderMarker) intruderMarker.style.display = "none";

    if (droneSprite) {
      droneSprite.classList.remove("drone-in-flight", "chasing-active");
      droneSprite.style.transition = "top 1s ease, left 1s ease";
      droneSprite.style.top = "50%";
      droneSprite.style.left = "50%";
    }

    if (statusBadge) statusBadge.className = "drone-dock-badge status-docked";
    if (statusText) statusText.textContent = `DRONE DOCKED • STANDBY`;
    this.setText("drone-telemetry-speed", "0.0 km/h");
    this.setText("drone-telemetry-alt", "0.0 m (AGL)");

    this.setMissionStep(1);
    this.logDroneEvent(`🛑 Mission aborted by farmer. Drone returned to Hangar Dock.`, "normal");
    if (window.App && App.showToast) App.showToast("🛑 Drone mission recalled to base.");
  },

  clearAllTimers() {
    this.droneTimeoutIds.forEach(id => clearTimeout(id));
    this.droneTimeoutIds = [];
  },

  simulateDeterrencePulse() {
    this.triggerAutoDefense("Wild Boar", "Zone 06", "CAM-03");
  }
};

window.FarmSecurity = FarmSecurity;
