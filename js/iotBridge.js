/**
 * One Acre Intelligent Farm - ESP32 Hardware Integration & IoT Bridge
 * Designed to connect mock demo sensors seamlessly with real ESP32 / MQTT / WebSocket hardware.
 * 
 * Hardware Protocol: ESP32 LoRa Mesh -> Gateway -> WebSocket / MQTT REST API
 */

const IoTBridge = {
  mode: "simulation", // "simulation" | "websocket" | "mqtt" | "rest"
  status: "Connected (ESP32 Mesh Simulated)",
  config: {
    esp32Ip: "192.168.1.108",
    macAddress: "24:6F:28:9B:4A:12",
    gatewayId: "GW-ONE-ACRE-01",
    meshChannel: 11,
    rssi: "-64 dBm (Strong)",
    firmwareVersion: "ESP32-AgriSense-v2.8.4",
    samplingRateSec: 10,
    wsEndpoint: "ws://192.168.1.108:81/",
    mqttBroker: "mqtt://broker.hivemq.com:8884/mqtt",
    mqttTopic: "farm/oneacre/zones/+"
  },

  timerId: null,
  wsClient: null,
  listeners: [],

  init() {
    console.log("[IoTBridge] Initialized in mode:", this.mode);
    this.startSimulation();
  },

  onDataReceived(callback) {
    this.listeners.push(callback);
  },

  notifyListeners(data) {
    this.listeners.forEach(cb => {
      try { cb(data); } catch (e) { console.error("[IoTBridge] Listener error:", e); }
    });
  },

  startSimulation(intervalMs = 4500) {
    if (this.timerId) clearInterval(this.timerId);

    this.timerId = setInterval(() => {
      // Simulate real-time sensor fluctuation for all 8 zones
      ONE_ACRE_FARM.zones.forEach(zone => {
        // Minor natural drift (+- 0.15)
        const drift = (Math.random() - 0.49) * 0.3;
        zone.soilTemp = +(zone.soilTemp + drift * 0.2).toFixed(1);
        zone.airTemp = +(zone.airTemp + drift * 0.3).toFixed(1);

        // If Zone 04 is irrigating, moisture creeps up gradually
        if (zone.id === "zone-4" && ONE_ACRE_FARM.irrigation.pumpStatus === "ON") {
          zone.soilMoisture = Math.min(42, +(zone.soilMoisture + 0.3).toFixed(1));
          ONE_ACRE_FARM.irrigation.currentMoisture = zone.soilMoisture;
          ONE_ACRE_FARM.irrigation.waterSuppliedNow = Math.min(
            ONE_ACRE_FARM.irrigation.waterTargetNow,
            ONE_ACRE_FARM.irrigation.waterSuppliedNow + 1
          );
          ONE_ACRE_FARM.overview.todayWaterUsage += 1;
        }
      });

      // Update weather solar and ambient
      ONE_ACRE_FARM.weather.temperature = +(ONE_ACRE_FARM.weather.temperature + (Math.random() - 0.5) * 0.1).toFixed(1);
      ONE_ACRE_FARM.overview.avgSoilMoisture = Math.round(
        ONE_ACRE_FARM.zones.reduce((sum, z) => sum + z.soilMoisture, 0) / 8
      );

      this.notifyListeners({
        type: "TELEMETRY_UPDATE",
        timestamp: new Date().toISOString(),
        zones: ONE_ACRE_FARM.zones,
        overview: ONE_ACRE_FARM.overview
      });
    }, intervalMs);
  },

  /**
   * Future Real Hardware: Connect to real ESP32 via WebSocket
   */
  connectWebSocket(url = this.config.wsEndpoint) {
    try {
      console.log("[IoTBridge] Connecting to real ESP32 at:", url);
      this.wsClient = new WebSocket(url);

      this.wsClient.onopen = () => {
        this.mode = "websocket";
        this.status = "Live ESP32 WebSocket Connected";
        console.log("[IoTBridge] Connected to ESP32 Gateway");
      };

      this.wsClient.onmessage = (event) => {
        const payload = JSON.parse(event.data);
        this.ingestRealHardwarePayload(payload);
      };

      this.wsClient.onerror = (err) => {
        console.warn("[IoTBridge] WebSocket error (Falling back to simulated demo telemetry):", err);
        this.mode = "simulation";
      };
    } catch (err) {
      console.warn("[IoTBridge] Could not initiate WebSocket:", err);
    }
  },

  /**
   * Ingest payload matching standard ESP32 JSON schema:
   * { "zone": "zone-4", "moisture": 38.2, "soilTemp": 25.1, "ec": 1.1, "ph": 6.5 }
   */
  ingestRealHardwarePayload(payload) {
    if (!payload || !payload.zone) return;
    const targetZone = ONE_ACRE_FARM.zones.find(z => z.id === payload.zone || z.number === payload.zone);
    if (targetZone) {
      if (payload.moisture !== undefined) targetZone.soilMoisture = payload.moisture;
      if (payload.soilTemp !== undefined) targetZone.soilTemp = payload.soilTemp;
      if (payload.airTemp !== undefined) targetZone.airTemp = payload.airTemp;
      if (payload.ph !== undefined) targetZone.soilPh = payload.ph;
      if (payload.ec !== undefined) targetZone.ec = payload.ec;
      if (payload.npk) targetZone.npk = payload.npk;

      this.notifyListeners({ type: "HARDWARE_PAYLOAD", payload });
    }
  }
};

window.IoTBridge = IoTBridge;
