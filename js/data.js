/**
 * PlantDr AgroPalm - Data Layer & Sensor Telemetry
 * Provides realistic agronomic data, multi-field states, and diagnostic knowledge.
 */

const FARM_DATA = {
  farmer: {
    name: "Farmer Vikram Singh",
    farmName: "Sunrise Bio-Agri Farm",
    location: "Punjab Agro Corridor, Sector 4",
    totalAcres: 290,
    activeSensors: 42,
    onlineStatus: "All 42 LoRaWAN Nodes Connected",
    batteryLevel: 94
  },

  fields: [
    {
      id: "sec-4",
      name: "Sector 4 • North Soybean Basin",
      crop: "Soybeans (JS-335)",
      stage: "Pod Development (R3)",
      acres: 160,
      soilType: "Clay Loam",
      healthScore: 94,
      healthStatus: "Optimal",
      healthClass: "badge-success",
      ndviMean: 0.88,
      ndviStatus: "Dense Biomass",
      soilMoisture: {
        current: 44, // %
        depth10cm: 41,
        depth30cm: 45,
        depth60cm: 49,
        targetMin: 35,
        targetMax: 50,
        status: "Optimal Hydration"
      },
      nutrients: {
        nitrogen: { value: 68, unit: "ppm", status: "Optimal", range: "50-80" },
        phosphorus: { value: 42, unit: "ppm", status: "Good", range: "30-50" },
        potassium: { value: 185, unit: "ppm", status: "Optimal", range: "150-220" },
        ph: { value: 6.5, unit: "pH", status: "Balanced (Neutral)", range: "6.0-7.0" },
        ec: { value: 1.2, unit: "dS/m", status: "Ideal Salinity", range: "< 2.0" }
      },
      microWeather: {
        airTemp: 27.8,
        humidity: 64,
        solarRadiation: 820, // W/m²
        windSpeed: 8.5, // km/h
        windDirection: "NW",
        dewPoint: 19.4,
        et0: 4.1, // mm/day Evapotranspiration
        leafWetnessDuration: 2.2 // hours
      },
      irrigation: {
        zone1: { name: "Sub-surface Drip Alpha", active: true, minutesLeft: 22, flowLpm: 120, mode: "Smart Auto" },
        zone2: { name: "Micro-Sprinkler Beta", active: false, minutesLeft: 0, flowLpm: 0, mode: "Standby" },
        waterReservoir: 82, // %
        dailyWaterUsed: 1450 // Liters
      },
      alerts: [
        { id: 1, type: "info", title: "Optimal Spray Window Today", msg: "Wind speed 8 km/h and dry canopy from 3 PM to 6 PM.", time: "10m ago" },
        { id: 2, type: "success", title: "Moisture Recharged", msg: "Sub-surface drip maintained 44% at 30cm root depth.", time: "45m ago" }
      ],
      hourlyTrends: {
        labels: ["04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
        moisture: [40, 39, 38, 42, 45, 44, 43, 44, 44, 43],
        temp: [19, 21, 24, 27, 30, 29, 28, 25, 23, 21],
        solar: [0, 80, 350, 680, 840, 810, 620, 210, 20, 0]
      }
    },
    {
      id: "sec-11",
      name: "Sector 11 • West Maize & Corn",
      crop: "Pioneer Hybrid Corn",
      stage: "Silking / Tasseling",
      acres: 85,
      soilType: "Sandy Loam",
      healthScore: 68,
      healthStatus: "Water Stress Alert",
      healthClass: "badge-danger",
      ndviMean: 0.54,
      ndviStatus: "Moderate Stress Zone",
      soilMoisture: {
        current: 24, // %
        depth10cm: 20,
        depth30cm: 25,
        depth60cm: 32,
        targetMin: 35,
        targetMax: 50,
        status: "Critically Dry (Below Wilting Point Threshold)"
      },
      nutrients: {
        nitrogen: { value: 38, unit: "ppm", status: "Low Deficit", range: "50-80" },
        phosphorus: { value: 31, unit: "ppm", status: "Moderate", range: "30-50" },
        potassium: { value: 140, unit: "ppm", status: "Slight Deficit", range: "150-220" },
        ph: { value: 5.8, unit: "pH", status: "Slightly Acidic", range: "6.0-7.0" },
        ec: { value: 0.9, unit: "dS/m", status: "Low", range: "< 2.0" }
      },
      microWeather: {
        airTemp: 31.2,
        humidity: 48,
        solarRadiation: 910,
        windSpeed: 14.2,
        windDirection: "W",
        dewPoint: 17.1,
        et0: 5.8,
        leafWetnessDuration: 0.5
      },
      irrigation: {
        zone1: { name: "Center Pivot Section C", active: false, minutesLeft: 0, flowLpm: 0, mode: "Emergency Scheduled" },
        zone2: { name: "Furrow Drip Line 4", active: false, minutesLeft: 0, flowLpm: 0, mode: "Offline" },
        waterReservoir: 65,
        dailyWaterUsed: 800
      },
      alerts: [
        { id: 3, type: "danger", title: "Urgent: Moisture Deficit in Sector 11", msg: "Soil moisture dropped to 24%. Rootzone drought detected. Turn on Pivot C.", time: "5m ago" },
        { id: 4, type: "warning", title: "High Evapotranspiration", msg: "ET0 reached 5.8mm/day with 31°C heat.", time: "1h ago" }
      ],
      hourlyTrends: {
        labels: ["04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
        moisture: [31, 30, 29, 28, 26, 25, 24, 24, 23, 23],
        temp: [21, 23, 27, 30, 32, 33, 31, 28, 25, 23],
        solar: [0, 95, 410, 750, 910, 890, 680, 240, 25, 0]
      }
    },
    {
      id: "sec-7",
      name: "Sector 7 • High Density Orchard",
      crop: "Gala & Honeycrisp Apples",
      stage: "Fruit Swell Stage",
      acres: 45,
      soilType: "Silty Clay",
      healthScore: 78,
      healthStatus: "Fungal Risk High",
      healthClass: "badge-warning",
      ndviMean: 0.72,
      ndviStatus: "Moderate Foliage Density",
      soilMoisture: {
        current: 52, // %
        depth10cm: 55,
        depth30cm: 51,
        depth60cm: 48,
        targetMin: 35,
        targetMax: 50,
        status: "Slight Waterlogging Risk"
      },
      nutrients: {
        nitrogen: { value: 72, unit: "ppm", status: "Optimal", range: "50-80" },
        phosphorus: { value: 48, unit: "ppm", status: "Optimal", range: "30-50" },
        potassium: { value: 210, unit: "ppm", status: "Rich", range: "150-220" },
        ph: { value: 6.8, unit: "pH", status: "Ideal", range: "6.0-7.0" },
        ec: { value: 1.4, unit: "dS/m", status: "Normal", range: "< 2.0" }
      },
      microWeather: {
        airTemp: 24.5,
        humidity: 86,
        solarRadiation: 650,
        windSpeed: 4.8,
        windDirection: "NE",
        dewPoint: 22.0,
        et0: 3.2,
        leafWetnessDuration: 7.5 // High risk for fungal sporulation
      },
      irrigation: {
        zone1: { name: "Orchard Microsprinklers", active: false, minutesLeft: 0, flowLpm: 0, mode: "Auto Paused (High Rain Soil)" },
        zone2: { name: "Canopy Foggers", active: false, minutesLeft: 0, flowLpm: 0, mode: "Standby" },
        waterReservoir: 95,
        dailyWaterUsed: 420
      },
      alerts: [
        { id: 5, type: "warning", title: "Leaf Wetness Warning: 7.5 Hours", msg: "Prolonged leaf wetness combined with 86% humidity promotes fungal spores. Inspect leaves.", time: "18m ago" },
        { id: 6, type: "info", title: "Irrigation Paused", msg: "Soil moisture is above 50%. Rain delay activated.", time: "2h ago" }
      ],
      hourlyTrends: {
        labels: ["04:00", "06:00", "08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"],
        moisture: [54, 53, 53, 52, 52, 51, 51, 52, 52, 53],
        temp: [17, 18, 20, 22, 25, 24, 23, 21, 19, 18],
        solar: [0, 60, 280, 520, 650, 630, 480, 160, 10, 0]
      }
    }
  ],

  // Diagnostic Presets for Palm Leaf Scanner
  diagnosticSamples: [
    {
      id: "blight_sample",
      name: "Early Blight (Alternaria solani)",
      image: "assets/sample_early_blight.jpg",
      cropType: "Solanaceae (Tomato / Potato)",
      confidence: 96.8,
      severity: "Moderate (34% Foliar Surface)",
      symptoms: "Concentric 'target-board' brown-black lesions with yellow chlorotic halos on lower foliage.",
      cause: "Alternaria solani fungus proliferates under warm temperatures (24-29°C) and alternating wet/dry cycles.",
      impact: "May reduce photosynthetic capacity and cause up to 25-35% harvest loss if defoliation spreads.",
      actionPlan: [
        { category: "Immediate Treatment", text: "Apply Copper Hydroxide (2.5 g/L) or Azoxystrobin (1.0 ml/L) within 24 hours." },
        { category: "Organic Option", text: "Foliar spray with Bacillus subtilis bio-fungicide + Neem oil formulation (5 ml/L)." },
        { category: "Canopy Management", text: "Prune infected lower foliage immediately and dispose away from the field perimeter." },
        { category: "Irrigation Tweak", text: "Switch from overhead sprinklers to drip irrigation to prevent foliar wetness." }
      ]
    },
    {
      id: "healthy_sample",
      name: "Healthy Vigorous Crop",
      image: "assets/sample_healthy_leaf.jpg",
      cropType: "Leguminosae (Soybean)",
      confidence: 99.2,
      severity: "None (Healthy Tissue)",
      symptoms: "Rich emerald green coloration, intact cuticle, turgid leaf veins, no pest bite marks or chlorosis.",
      cause: "Optimal chlorophyll-a/b synthesis, well-balanced nitrogen metabolism, and adequate stomatal conductance.",
      impact: "Projected peak photosynthetic yield efficiency (>95%).",
      actionPlan: [
        { category: "Maintenance", text: "Maintain current fertigation schedule and soil moisture between 38% - 46%." },
        { category: "Scouting", text: "Continue routine pest scouting twice weekly during morning dew hours." }
      ]
    }
  ],

  // 5-Day Agricultural Spray & Weather Outlook
  weatherForecast: [
    { day: "Today", tempMax: 30, tempMin: 19, icon: "☀️", condition: "Sunny & Mild Wind", spraySuitability: "Excellent", sprayColor: "#10b981", rainProb: 5, wind: 8 },
    { day: "Tomorrow", tempMax: 31, tempMin: 20, icon: "🌤️", condition: "Partly Cloudy", spraySuitability: "Good (Morning)", sprayColor: "#10b981", rainProb: 15, wind: 11 },
    { day: "Thu", tempMax: 28, tempMin: 18, icon: "🌦️", condition: "Scattered Showers", spraySuitability: "Unsafe (Rain Risk)", sprayColor: "#ef4444", rainProb: 75, wind: 24 },
    { day: "Fri", tempMax: 26, tempMin: 17, icon: "🌧️", condition: "Moderate Rain", spraySuitability: "No Spray (Washout)", sprayColor: "#ef4444", rainProb: 85, wind: 19 },
    { day: "Sat", tempMax: 29, tempMin: 18, icon: "🌤️", condition: "Clear Sky", spraySuitability: "Good", sprayColor: "#10b981", rainProb: 10, wind: 9 }
  ]
};

// Export to global scope
window.FARM_DATA = FARM_DATA;
