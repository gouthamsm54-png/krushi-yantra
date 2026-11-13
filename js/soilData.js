/**
 * Krushi Yantra - Soil Intelligence Data Model
 * 8-Zone Individual Soil Testing, Soil Fertility, Soil Health & Crop Suitability Database
 * Standardized according to ICAR (Indian Council of Agricultural Research) & Soil Health Card norms.
 */

const SOIL_ANALYSIS_DATA = {
  version: "2.8-AgriLab",
  lastUpdated: "2026-10-28T09:30:00Z",
  accreditedLab: {
    name: "ICAR - National Soil Testing & Analytical Laboratory",
    centre: "Regional Agro-Testing Centre, Pune / New Delhi",
    accreditationNo: "NABL / AGRI-SOIL-7742",
    chiefAgronomist: "Dr. Arvind S. Sharma, M.Sc (Soil Science & Agril. Chemistry)",
    contact: "soil-lab@krushiyantra.gov.in"
  },

  // Documented Soil Quality Index (SQI) Scoring Methodology
  methodology: {
    name: "Weighted Soil Quality Index (SQI-ICAR 2026)",
    description: "Multi-parameter agronomic assessment combining physical, chemical, and biological soil health indicators into a 100-point composite score.",
    weights: {
      phBalance: { weight: 15, optimalRange: "6.2 - 7.5", description: "Soil reaction and nutrient availability buffer" },
      organicCarbon: { weight: 20, optimalRange: "0.75% - 1.20%", description: "Microbial humus, CEC, and soil biological vitality" },
      macronutrients: { weight: 30, optimalRange: "N (280-560 kg/ha), P (23-56 kg/ha), K (145-335 kg/ha), S (>10 mg/kg)", description: "Core primary and secondary plant nutrition reserves" },
      micronutrients: { weight: 15, optimalRange: "Zn (>0.6 ppm), Fe (>4.5 ppm), Cu (>0.2 ppm), Mn (>2.0 ppm), B (>0.5 ppm)", description: "Essential micro-catalysts and enzymatic growth triggers" },
      physicalProperties: { weight: 20, optimalRange: "Moisture 40-60%, Compaction <150 PSI, Drainage: Well-Drained", description: "Aeration, root penetrability, water infiltration, and tilth" }
    },
    scoringBands: [
      { min: 85, max: 100, label: "Prime Soil Health (Grade A+)", color: "#16a34a", badge: "badge-prime", advice: "Prime fertile condition. Maintain balanced organic replenishment and precision fertigation." },
      { min: 70, max: 84, label: "Good Soil Health (Grade A)", color: "#22c55e", badge: "badge-good", advice: "Productive soil. Minor targeted micronutrient or organic matter augmentation recommended." },
      { min: 55, max: 69, label: "Moderate Fertility (Grade B)", color: "#f59e0b", badge: "badge-warning", advice: "Requires structural soil correction. Address specific nutrient deficiencies and improve organic carbon." },
      { min: 0, max: 54, label: "Degraded / Critical (Grade C)", color: "#ef4444", badge: "badge-danger", advice: "Urgent intervention needed. Lime/gypsum treatment, hardpan subsoiling, and intensive organic matter restoration required." }
    ]
  },

  // ICAR Standard Reference Limits for Indian Agricultural Soils
  referenceStandards: {
    ph: { lowLimit: 6.0, highLimit: 7.5, optimalLow: 6.2, optimalHigh: 7.2, unit: "pH", name: "Soil Reaction (pH)" },
    ec: { lowLimit: 0, highLimit: 1.6, optimalLow: 0.2, optimalHigh: 1.2, unit: "dS/m", name: "Electrical Conductivity (Salinity)" },
    soilMoisture: { lowLimit: 35, highLimit: 65, optimalLow: 45, optimalHigh: 58, unit: "%", name: "Soil Moisture (Field Capacity)" },
    soilTemp: { lowLimit: 18, highLimit: 32, optimalLow: 22, optimalHigh: 28, unit: "°C", name: "Soil Rootzone Temperature" },
    compaction: { lowLimit: 80, highLimit: 200, optimalLow: 100, optimalHigh: 150, unit: "PSI", name: "Soil Penetration Resistance" },
    whc: { lowLimit: 18, highLimit: 40, optimalLow: 25, optimalHigh: 35, unit: "%", name: "Water-Holding Capacity" },
    n: { lowLimit: 280, highLimit: 560, unit: "kg/ha", name: "Available Nitrogen (N)" },
    p: { lowLimit: 23, highLimit: 56, unit: "kg/ha", name: "Available Phosphorus (P₂O₅)" },
    k: { lowLimit: 145, highLimit: 335, unit: "kg/ha", name: "Available Potassium (K₂O)" },
    oc: { lowLimit: 0.50, highLimit: 0.75, unit: "%", name: "Soil Organic Carbon (OC)" },
    s: { lowLimit: 10.0, highLimit: 25.0, unit: "mg/kg", name: "Available Sulphur (S)" },
    zn: { lowLimit: 0.60, highLimit: 1.50, unit: "ppm", name: "Available Zinc (Zn)" },
    fe: { lowLimit: 4.50, highLimit: 10.0, unit: "ppm", name: "Available Iron (Fe)" },
    cu: { lowLimit: 0.20, highLimit: 0.80, unit: "ppm", name: "Available Copper (Cu)" },
    mn: { lowLimit: 2.00, highLimit: 6.00, unit: "ppm", name: "Available Manganese (Mn)" },
    b: { lowLimit: 0.50, highLimit: 1.20, unit: "ppm", name: "Available Boron (B)" }
  },

  // 8 Independent Zones with Unique Laboratory Test Values & Readings
  zones: {
    "zone-1": {
      id: "zone-1",
      number: "01",
      name: "Zone 01 • Bell Pepper Plot",
      crop: "Bell Peppers (Capsicum)",
      hindiCrop: "शिमला मिर्च",
      acreage: 0.125,
      sampleId: "KY-SOIL-Z01-2026-OCT",
      collectionDate: "2026-10-18",
      testingDate: "2026-10-22",
      testingLab: "ICAR-Central Soil Testing Laboratory, Pune",
      labTechnician: "S. K. Deshmukh, Lab Scientist",
      measurementSource: "Verified Laboratory Certificate (NABL Accredited)",
      sourceType: "lab", // "lab" | "sensor" | "manual"
      
      // A. Basic Soil Properties
      properties: {
        ph: 6.4,
        phStatus: "Slightly Acidic (Optimal for Solanaceae)",
        ec: 1.2,
        ecStatus: "Non-Saline (Normal)",
        soilMoisture: 52, // Live synced with ESP32
        soilMoistureSource: "ESP32 LoRa Probe #01 (Live)",
        soilTemp: 24.2, // Live synced with ESP32
        soilTempSource: "ESP32 DS18B20 #01 (Live)",
        soilTexture: "Sandy Loam",
        textureDetails: "Sand: 64%, Silt: 21%, Clay: 15%",
        soilType: "Alluvial Inceptisol (Indo-Gangetic Transition)",
        soilDepthTopsoil: "45 cm",
        soilDepthEffective: "110 cm (Deep rooting zone)",
        waterHoldingCapacity: 24.5,
        waterHoldingCapacityRating: "Moderate-Good",
        drainageCondition: "Well-Drained",
        compaction: 125,
        compactionRating: "Low (Friable, Optimal Root Penetration)"
      },

      // B. Soil Fertility Analysis
      nutrients: {
        macronutrients: [
          { key: "n", name: "Available Nitrogen (N)", symbol: "N", value: 285, unit: "kg/ha", status: "Medium", range: "280 - 560 kg/ha", defAlert: false, advice: "Maintains vigorous foliar development. Apply split top-dressing of neem-coated urea at flowering.", source: "Lab (Alkaline Permanganate Method)" },
          { key: "p", name: "Available Phosphorus (P)", symbol: "P", value: 24.5, unit: "kg/ha", status: "Medium", range: "23 - 56 kg/ha", defAlert: false, advice: "Adequate root establishment. Supplement with rock phosphate or SSP during weeding.", source: "Lab (Olsen Method)" },
          { key: "k", name: "Available Potassium (K)", symbol: "K", value: 215, unit: "kg/ha", status: "Medium-High", range: "145 - 335 kg/ha", defAlert: false, advice: "Excellent fruit wall thickness and bell pepper firmness. Continue current fertigation.", source: "Lab (Flame Photometer Method)" },
          { key: "oc", name: "Organic Carbon (OC)", symbol: "OC", value: 0.68, unit: "%", status: "Medium", range: "0.50 - 0.75%", defAlert: false, advice: "Incorporate 1.5 tons/acre well-decomposed vermicompost post-harvest.", source: "Lab (Walkley-Black Method)" },
          { key: "s", name: "Available Sulphur (S)", symbol: "S", value: 18.2, unit: "mg/kg", status: "Sufficient", range: "10.0 - 25.0 mg/kg", defAlert: false, advice: "No sulphur deficiency. Good pungent aroma and capsaicin balance.", source: "Lab (Turbidimetric Method)" }
        ],
        micronutrients: [
          { key: "zn", name: "Available Zinc (Zn)", symbol: "Zn", value: 0.85, unit: "ppm", status: "Adequate", range: "0.60 - 1.50 ppm", defAlert: false, advice: "Sufficient for enzymatic leaf expansion. No immediate intervention needed.", source: "Lab (DTPA Extractable AAS)" },
          { key: "fe", name: "Available Iron (Fe)", symbol: "Fe", value: 6.8, unit: "ppm", status: "Adequate", range: "4.50 - 10.0 ppm", defAlert: false, advice: "Healthy chlorophyll synthesis; no chlorosis observed.", source: "Lab (DTPA Extractable AAS)" },
          { key: "cu", name: "Available Copper (Cu)", symbol: "Cu", value: 0.42, unit: "ppm", status: "Adequate", range: "0.20 - 0.80 ppm", defAlert: false, advice: "Resistant to fungal die-back.", source: "Lab (DTPA Extractable AAS)" },
          { key: "mn", name: "Available Manganese (Mn)", symbol: "Mn", value: 4.1, unit: "ppm", status: "Adequate", range: "2.00 - 6.00 ppm", defAlert: false, advice: "Normal photosynthetic electron transport.", source: "Lab (DTPA Extractable AAS)" },
          { key: "b", name: "Available Boron (B)", symbol: "B", value: 0.62, unit: "ppm", status: "Adequate", range: "0.50 - 1.20 ppm", defAlert: false, advice: "Healthy pollen tube germination; prevents blossom-drop.", source: "Lab (Hot Water Soluble Azomethine-H)" }
        ]
      },

      // 3. Soil Health Score & Assessment
      soilHealth: {
        score: 88,
        grade: "Grade A+ (Prime Fertility)",
        fertilityStatus: "High Fertility (Balanced NPK & Micronutrients)",
        phStatus: "Slightly Acidic (6.4) - Ideal Solanaceae Range",
        salinityStatus: "Non-Saline (1.2 dS/m)",
        ocStatus: "Moderate-Good (0.68%)",
        deficiencySummary: "0 Critical Deficiencies Detected",
        moistureStatus: "52% - Optimal Field Capacity",
        drainageStatus: "Well-Drained Sandy Loam Tilth",
        biologicalVitality: "High Microbial Activity (Earthworm Castings Present)"
      },

      // 4. Test History
      testHistory: [
        { sampleId: "KY-SOIL-Z01-2026-OCT", date: "2026-10-22", lab: "ICAR Pune", score: 88, ph: 6.4, ec: 1.2, oc: 0.68, n: 285, p: 24.5, k: 215, notes: "Current active test. Post-monsoon cycle." },
        { sampleId: "KY-SOIL-Z01-2026-APR", date: "2026-04-12", lab: "ICAR Pune", score: 82, ph: 6.5, ec: 1.3, oc: 0.61, n: 260, p: 22.0, k: 195, notes: "Pre-kharif baseline test. Mild nitrogen depletion." },
        { sampleId: "KY-SOIL-Z01-2025-OCT", date: "2025-10-15", lab: "State Agri Testing Lab", score: 78, ph: 6.6, ec: 1.4, oc: 0.54, n: 240, p: 19.5, k: 180, notes: "Initial baseline before precision organic amendment program." }
      ],

      // 5. Historical Telemetry Curves (24-Hour)
      telemetryHistory: {
        timestamps: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        moisture: [54, 53, 51, 48, 50, 53, 52],
        temperature: [22.1, 21.4, 23.0, 26.8, 25.4, 24.0, 24.2]
      },

      // 6. Agronomic Soil Improvement Plan
      improvementPlan: [
        { pillar: "Nutrient Deficiency Correction", action: "Apply 25 kg/acre Neem-coated Urea in 2 split top-dressings at flowering to maintain N above 300 kg/ha.", reason: "Capsicum fruiting flush draws heavily on soluble nitrogen reserves." },
        { pillar: "Organic Matter Humification", action: "Apply 1.2 tons of cured vermicompost enriched with Trichoderma viride.", reason: "Boosts soil biological buffering and maintains cation exchange capacity above 18 meq/100g." },
        { pillar: "pH & Micro-Environment", action: "Maintain existing neutral pH buffer (6.4). Avoid ammonium sulphate fertilizers that acidify rootzone.", reason: "pH 6.4 guarantees 95% uptake efficiency for phosphorus and trace elements." },
        { pillar: "Salinity & Drainage Optimization", action: "Maintain scheduled 2-hour drip pulses to prevent salt accumulation along bed shoulders.", reason: "Drip fertigation maintains localized low EC (1.2 dS/m) in the active root bulb." },
        { pillar: "Precision Fertilizer Recommendation", action: "19:19:19 Water Soluble NPK @ 2.5 kg/acre via drip every 4 days + 0.1% Borax foliar spray.", reason: "Prevents blossom end rot and maintains uniform fruit wall development without vegetative lankiness." }
      ],

      // 7. Multi-Factor Crop Suitability
      cropSuitability: {
        mostSuitable: [
          { name: "Bell Peppers (Capsicum)", hindiName: "शिमला मिर्च", suitabilityScore: 96, category: "vegetables", requiredPh: "6.0 - 6.8", existingPh: "6.4 (Perfect)", requiredTexture: "Well-drained Sandy Loam", existingTexture: "Sandy Loam (Optimal)", waterReq: "3.8 mm/day (~210 L)", duration: "110 - 130 Days", challenges: "Susceptible to blossom-end drop if moisture drops below 40%." },
          { name: "Cherry Tomatoes", hindiName: "चेरी टमाटर", suitabilityScore: 94, category: "vegetables", requiredPh: "6.2 - 7.0", existingPh: "6.4 (Optimal)", requiredTexture: "Loam to Sandy Loam", existingTexture: "Sandy Loam", waterReq: "4.0 mm/day (~225 L)", duration: "90 - 110 Days", challenges: "Requires staking and pruning to prevent foliar humidity buildup." },
          { name: "French Green Beans", hindiName: "फ्रेंच बीन्स", suitabilityScore: 92, category: "pulses", requiredPh: "6.0 - 7.0", existingPh: "6.4 (Optimal)", requiredTexture: "Friable Loam", existingTexture: "Sandy Loam", waterReq: "3.2 mm/day (~180 L)", duration: "60 - 75 Days", challenges: "Avoid waterlogging; excellent rotational nitrogen-fixing crop." }
        ],
        suitableCategories: {
          vegetables: ["Bell Peppers (96%)", "Cherry Tomatoes (94%)", "Okra / Bhindi (90%)", "Zucchini (88%)", "Eggplant / Brinjal (87%)"],
          fruits: ["Strawberries (89%)", "Papaya (86%)", "Pomegranate (84%)", "Guava (82%)"],
          pulses: ["French Beans (92%)", "Cowpea / Lobia (88%)", "Green Gram / Moong (86%)"],
          cereals: ["Baby Corn / Sweet Corn (88%)", "Barley (78%)"]
        },
        requiresImprovement: [
          { name: "Carrots (Nantes)", issue: "Fine sand proportion (64%) can cause minor taproot curvature; add silt loam mulch for straight roots.", fixRequired: "Silt enrichment & deep tillage" },
          { name: "Cauliflower", issue: "Requires slightly higher Boron and Sulphur reserves during curd setting.", fixRequired: "Apply Borax 1 kg/acre" }
        ],
        notRecommended: [
          { name: "Paddy / Lowland Rice", reason: "Soil is excessively well-drained sandy loam with rapid percolation; water retention is inadequate for flooded puddled fields." },
          { name: "Tea / Coffee", reason: "Requires strongly acidic soils (pH 4.5 - 5.5) and high elevation cool climate." }
        ]
      }
    },

    "zone-2": {
      id: "zone-2",
      number: "02",
      name: "Zone 02 • Cherry Tomato Trellis",
      crop: "Cherry Tomatoes (Ruby Star)",
      hindiCrop: "चेरी टमाटर",
      acreage: 0.125,
      sampleId: "KY-SOIL-Z02-2026-OCT",
      collectionDate: "2026-10-18",
      testingDate: "2026-10-22",
      testingLab: "ICAR-Central Soil Testing Laboratory, Pune",
      labTechnician: "S. K. Deshmukh, Lab Scientist",
      measurementSource: "Verified Laboratory Certificate (NABL Accredited)",
      sourceType: "lab",
      properties: {
        ph: 6.6,
        phStatus: "Near Neutral (Ideal for Tomato Lycopene & Calcium)",
        ec: 1.4,
        ecStatus: "Normal (Good Nutrient Buffer)",
        soilMoisture: 49,
        soilMoistureSource: "ESP32 LoRa Probe #02 (Live)",
        soilTemp: 24.8,
        soilTempSource: "ESP32 DS18B20 #02 (Live)",
        soilTexture: "Loam (Rich Crumb Structure)",
        textureDetails: "Sand: 46%, Silt: 34%, Clay: 20%",
        soilType: "Red Loamy Soil (Alfisol Intergrade)",
        soilDepthTopsoil: "55 cm",
        soilDepthEffective: "100 cm",
        waterHoldingCapacity: 27.0,
        waterHoldingCapacityRating: "Good",
        drainageCondition: "Well-Drained",
        compaction: 135,
        compactionRating: "Optimal"
      },
      nutrients: {
        macronutrients: [
          { key: "n", name: "Available Nitrogen (N)", symbol: "N", value: 270, unit: "kg/ha", status: "Medium", range: "280 - 560 kg/ha", defAlert: false, advice: "Balanced vegetative growth without excessive sucker formation.", source: "Lab" },
          { key: "p", name: "Available Phosphorus (P)", symbol: "P", value: 21.0, unit: "kg/ha", status: "Medium-Low", range: "23 - 56 kg/ha", defAlert: true, advice: "Slightly low. Apply Single Super Phosphate (SSP) @ 15 kg/acre with PSB biofertilizer.", source: "Lab" },
          { key: "k", name: "Available Potassium (K)", symbol: "K", value: 240, unit: "kg/ha", status: "High", range: "145 - 335 kg/ha", defAlert: false, advice: "High potassium ensures high Brix sweetness and thick skin.", source: "Lab" },
          { key: "oc", name: "Organic Carbon (OC)", symbol: "OC", value: 0.62, unit: "%", status: "Medium", range: "0.50 - 0.75%", defAlert: false, advice: "Good organic carbon; mulch with paddy straw to conserve moisture.", source: "Lab" },
          { key: "s", name: "Available Sulphur (S)", symbol: "S", value: 16.5, unit: "mg/kg", status: "Sufficient", range: "10.0 - 25.0 mg/kg", defAlert: false, advice: "No sulphur issues.", source: "Lab" }
        ],
        micronutrients: [
          { key: "zn", name: "Available Zinc (Zn)", symbol: "Zn", value: 0.78, unit: "ppm", status: "Adequate", range: "0.60 - 1.50 ppm", defAlert: false, advice: "Sufficient for nodal elongation.", source: "Lab" },
          { key: "fe", name: "Available Iron (Fe)", symbol: "Fe", value: 7.2, unit: "ppm", status: "High", range: "4.50 - 10.0 ppm", defAlert: false, advice: "Red soils naturally rich in iron oxides.", source: "Lab" },
          { key: "cu", name: "Available Copper (Cu)", symbol: "Cu", value: 0.38, unit: "ppm", status: "Adequate", range: "0.20 - 0.80 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "mn", name: "Available Manganese (Mn)", symbol: "Mn", value: 5.4, unit: "ppm", status: "Adequate", range: "2.00 - 6.00 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "b", name: "Available Boron (B)", symbol: "B", value: 0.48, unit: "ppm", status: "Deficient", range: "0.50 - 1.20 ppm", defAlert: true, advice: "WARNING: Boron is below 0.5 ppm critical cutoff! Risk of flower drop and fruit cracking. Apply Solubor foliar spray (0.15%).", source: "Lab" }
        ]
      },
      soilHealth: {
        score: 84,
        grade: "Grade A (Good Soil Health)",
        fertilityStatus: "High Potassium, Moderate Nitrogen, Boron Deficient",
        phStatus: "Near Neutral (6.6) - Optimal for Tomatoes",
        salinityStatus: "Non-Saline (1.4 dS/m)",
        ocStatus: "Moderate (0.62%)",
        deficiencySummary: "1 Micronutrient Deficiency (Boron: 0.48 ppm)",
        moistureStatus: "49% - Steady Rootzone Moisture",
        drainageStatus: "Well-Drained Loamy Soil",
        biologicalVitality: "Good Microbial Activity"
      },
      testHistory: [
        { sampleId: "KY-SOIL-Z02-2026-OCT", date: "2026-10-22", lab: "ICAR Pune", score: 84, ph: 6.6, ec: 1.4, oc: 0.62, n: 270, p: 21.0, k: 240, notes: "Current test. High K, Boron deficiency detected." },
        { sampleId: "KY-SOIL-Z02-2026-APR", date: "2026-04-12", lab: "ICAR Pune", score: 81, ph: 6.7, ec: 1.3, oc: 0.58, n: 250, p: 20.5, k: 220, notes: "Pre-season test." }
      ],
      telemetryHistory: {
        timestamps: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        moisture: [51, 50, 48, 46, 48, 50, 49],
        temperature: [22.4, 21.8, 23.5, 27.2, 26.0, 24.6, 24.8]
      },
      improvementPlan: [
        { pillar: "Nutrient Deficiency Correction", action: "Apply Solubor (20% Boron) foliar spray @ 1.5 g/liter during 30% flowering stage.", reason: "Boron is critical for pollen viability and calcium pectate deposition in tomato fruit skins." },
        { pillar: "Phosphorus Boosting", action: "Band place 12 kg SSP mixed with 50 kg farm compost and 1 kg PSB (Phosphate Solubilizing Bacteria).", reason: "Overcomes phosphorus fixation and stimulates rapid secondary feeder root development." },
        { pillar: "Potassium Maintenance", action: "Continue fertigation with Potassium Nitrate (13:0:45) @ 3 kg/acre weekly during fruit swelling.", reason: "Ensures uniform red coloration, prevents blotchy ripening, and maximizes market value." },
        { pillar: "Organic Carbon & Moisture", action: "Top-dress with 500 kg vermicompost and apply thick organic straw mulch along trellis beds.", reason: "Maintains uniform soil temperature and prevents soil splash on lower leaves, suppressing early blight." },
        { pillar: "pH & Salinity Management", action: "Maintain current pH 6.6. Monitor drainage runoff EC to keep below 1.8 dS/m.", reason: "Protects sensitive root hairs from osmotic shock during peak afternoon heat." }
      ],
      cropSuitability: {
        mostSuitable: [
          { name: "Cherry Tomatoes", hindiName: "चेरी टमाटर", suitabilityScore: 94, category: "vegetables", requiredPh: "6.2 - 7.0", existingPh: "6.6 (Optimal)", requiredTexture: "Loam", existingTexture: "Loam (Ideal)", waterReq: "4.2 mm/day (~230 L)", duration: "90 - 110 Days", challenges: "Requires timely Boron foliar spray to avoid flower drop." },
          { name: "Strawberries", hindiName: "स्ट्रॉबेरी", suitabilityScore: 91, category: "fruits", requiredPh: "5.8 - 6.8", existingPh: "6.6 (Good)", requiredTexture: "Deep Sandy Loam", existingTexture: "Loam", waterReq: "3.5 mm/day (~195 L)", duration: "120 - 150 Days", challenges: "Needs drip mulch beds to prevent fruit rot." },
          { name: "Eggplant (Brinjal)", hindiName: "बैंगन", suitabilityScore: 90, category: "vegetables", requiredPh: "6.0 - 7.0", existingPh: "6.6 (Optimal)", requiredTexture: "Rich Loam", existingTexture: "Loam", waterReq: "4.0 mm/day (~220 L)", duration: "100 - 120 Days", challenges: "Monitor shoot and fruit borer." }
        ],
        suitableCategories: {
          vegetables: ["Cherry Tomatoes (94%)", "Eggplant (90%)", "Capsicum (89%)", "Cluster Beans / Gwar (86%)"],
          fruits: ["Strawberries (91%)", "Pomegranate (87%)", "Watermelon (85%)"],
          pulses: ["Cowpea (88%)", "Black Gram / Urad (84%)"],
          cereals: ["Sweet Corn (86%)"]
        },
        requiresImprovement: [
          { name: "Green Peas", issue: "Requires higher phosphorus reserves and cooler soil temperatures.", fixRequired: "Apply SSP & cool mulch" }
        ],
        notRecommended: [
          { name: "Potato", issue: "Soil pH 6.6 increases risk of common scab (Streptomyces scabies); potatoes prefer pH 5.2 - 5.8.", fixRequired: "Unsuitable without acidifying amendments" }
        ]
      }
    },

    "zone-3": {
      id: "zone-3",
      number: "03",
      name: "Zone 03 • Organic Spinach Bed",
      crop: "Baby Spinach & Chard",
      hindiCrop: "पालक व चौलाई",
      acreage: 0.125,
      sampleId: "KY-SOIL-Z03-2026-OCT",
      collectionDate: "2026-10-18",
      testingDate: "2026-10-22",
      testingLab: "ICAR-Central Soil Testing Laboratory, Pune",
      labTechnician: "S. K. Deshmukh, Lab Scientist",
      measurementSource: "Verified Laboratory Certificate (NABL Accredited)",
      sourceType: "lab",
      properties: {
        ph: 6.8,
        phStatus: "Neutral (Optimal for Leafy Greens)",
        ec: 1.1,
        ecStatus: "Non-Saline (Very Safe)",
        soilMoisture: 33, // Queued for irrigation
        soilMoistureSource: "ESP32 LoRa Probe #03 (Live)",
        soilTemp: 25.4,
        soilTempSource: "ESP32 DS18B20 #03 (Live)",
        soilTexture: "Silt Loam",
        textureDetails: "Sand: 25%, Silt: 55%, Clay: 20%",
        soilType: "Humus-Rich Floodplain Loam",
        soilDepthTopsoil: "50 cm",
        soilDepthEffective: "85 cm",
        waterHoldingCapacity: 32.5,
        waterHoldingCapacityRating: "High (Excellent Humus Content)",
        drainageCondition: "Moderately Well-Drained",
        compaction: 110,
        compactionRating: "Very Low (Soft Friable Garden Tilth)"
      },
      nutrients: {
        macronutrients: [
          { key: "n", name: "Available Nitrogen (N)", symbol: "N", value: 340, unit: "kg/ha", status: "High", range: "280 - 560 kg/ha", defAlert: false, advice: "Rich vegetative nitrogen promotes dark green tender leaves.", source: "Lab" },
          { key: "p", name: "Available Phosphorus (P)", symbol: "P", value: 18.5, unit: "kg/ha", status: "Medium-Low", range: "23 - 56 kg/ha", defAlert: false, advice: "Slightly low; spinach has short root systems, so soluble rock phosphate or compost tea helps.", source: "Lab" },
          { key: "k", name: "Available Potassium (K)", symbol: "K", value: 185, unit: "kg/ha", status: "Medium", range: "145 - 335 kg/ha", defAlert: false, advice: "Adequate.", source: "Lab" },
          { key: "oc", name: "Organic Carbon (OC)", symbol: "OC", value: 0.92, unit: "%", status: "High", range: "0.50 - 0.75%", defAlert: false, advice: "EXCELLENT: Organic carbon exceeds 0.9%! High biological fertility and moisture retention.", source: "Lab" },
          { key: "s", name: "Available Sulphur (S)", symbol: "S", value: 14.8, unit: "mg/kg", status: "Sufficient", range: "10.0 - 25.0 mg/kg", defAlert: false, advice: "Adequate.", source: "Lab" }
        ],
        micronutrients: [
          { key: "zn", name: "Available Zinc (Zn)", symbol: "Zn", value: 0.92, unit: "ppm", status: "Adequate", range: "0.60 - 1.50 ppm", defAlert: false, advice: "Normal.", source: "Lab" },
          { key: "fe", name: "Available Iron (Fe)", symbol: "Fe", value: 8.5, unit: "ppm", status: "High", range: "4.50 - 10.0 ppm", defAlert: false, advice: "Rich iron ensures high nutritional iron content in harvested spinach.", source: "Lab" },
          { key: "cu", name: "Available Copper (Cu)", symbol: "Cu", value: 0.45, unit: "ppm", status: "Adequate", range: "0.20 - 0.80 ppm", defAlert: false, advice: "Normal.", source: "Lab" },
          { key: "mn", name: "Available Manganese (Mn)", symbol: "Mn", value: 4.8, unit: "ppm", status: "Adequate", range: "2.00 - 6.00 ppm", defAlert: false, advice: "Normal.", source: "Lab" },
          { key: "b", name: "Available Boron (B)", symbol: "B", value: 0.70, unit: "ppm", status: "Adequate", range: "0.50 - 1.20 ppm", defAlert: false, advice: "Normal.", source: "Lab" }
        ]
      },
      soilHealth: {
        score: 86,
        grade: "Grade A+ (Prime Soil Health)",
        fertilityStatus: "High Organic Matter (OC 0.92%), High N, Good Microbial Ecology",
        phStatus: "Neutral (6.8) - Ideal for Greens",
        salinityStatus: "Non-Saline (1.1 dS/m)",
        ocStatus: "High (0.92% - Benchmark)",
        deficiencySummary: "0 Critical Deficiencies",
        moistureStatus: "33% - Needs Hydration (Irrigation Queued)",
        drainageStatus: "Soft Friable Silt Loam",
        biologicalVitality: "Very High (Earthworm Castings & Beneficial Fungi)"
      },
      testHistory: [
        { sampleId: "KY-SOIL-Z03-2026-OCT", date: "2026-10-22", lab: "ICAR Pune", score: 86, ph: 6.8, ec: 1.1, oc: 0.92, n: 340, p: 18.5, k: 185, notes: "Current test. Excellent organic carbon." }
      ],
      telemetryHistory: {
        timestamps: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        moisture: [38, 37, 36, 34, 33, 33, 33],
        temperature: [22.8, 22.1, 23.9, 27.8, 26.5, 25.0, 25.4]
      },
      improvementPlan: [
        { pillar: "Moisture Restoration", action: "Trigger scheduled micro-sprinkler cycle (180 Liters) to bring rootzone moisture back to 45%.", reason: "Spinach has tender succulent leaves that wilt rapidly if moisture drops below 30%." },
        { pillar: "Phosphorus Supplementation", action: "Drench beds with fermented Jeevamrutha or liquid compost tea enriched with rock phosphate.", reason: "Boosts root growth in rapid 30-day harvest cycles without chemical salt buildup." },
        { pillar: "Organic Carbon Sustenance", action: "Continue incorporating crop residues and vermicompost between successional cuttings.", reason: "Maintains topsoil friability and soft texture for seed emergence." },
        { pillar: "pH & Micro-Nutrients", action: "No chemical amendments required. Soil pH 6.8 is agronomic perfection for leafy vegetables.", reason: "Nutrient bioavailability is at maximum thermodynamic equilibrium." },
        { pillar: "Biological Disease Defense", action: "Apply foliar spray of Pseudomonas fluorescens @ 5 g/L to protect against downy mildew.", reason: "Organic biological protection without toxic synthetic fungicides." }
      ],
      cropSuitability: {
        mostSuitable: [
          { name: "Baby Spinach", hindiName: "पालक", suitabilityScore: 95, category: "vegetables", requiredPh: "6.5 - 7.5", existingPh: "6.8 (Ideal)", requiredTexture: "Silt Loam", existingTexture: "Silt Loam (Benchmark)", waterReq: "3.2 mm/day (~180 L)", duration: "25 - 35 Days", challenges: "Requires timely hydration during mid-day heat." },
          { name: "Swiss Chard & Beet Greens", hindiName: "चौलाई व चुकंदर पत्ता", suitabilityScore: 93, category: "vegetables", requiredPh: "6.2 - 7.2", existingPh: "6.8", requiredTexture: "Humus Loam", existingTexture: "Silt Loam", waterReq: "3.4 mm/day (~190 L)", duration: "40 - 55 Days", challenges: "Cut outer leaves frequently to encourage new flushes." },
          { name: "Coriander / Cilantro", hindiName: "धनिया", suitabilityScore: 92, category: "vegetables", requiredPh: "6.0 - 7.5", existingPh: "6.8", requiredTexture: "Friable Loam", existingTexture: "Silt Loam", waterReq: "2.8 mm/day (~155 L)", duration: "35 - 45 Days", challenges: "Prevent bolting by harvesting before temperature exceeds 30°C." }
        ],
        suitableCategories: {
          vegetables: ["Spinach (95%)", "Swiss Chard (93%)", "Coriander (92%)", "Methi / Fenugreek (90%)", "Lettuce (88%)"],
          fruits: ["Strawberries (86%)"],
          pulses: ["Green Gram / Moong (87%)", "Lentils / Masoor (85%)"],
          cereals: ["Wheat (84%)", "Barley (82%)"]
        },
        requiresImprovement: [
          { name: "Watermelon", issue: "Silt loam retains too much water during fruit ripening, which can dilute sugar content.", fixRequired: "Raised sandy beds" }
        ],
        notRecommended: [
          { name: "Groundnut / Peanut", reason: "Silt loam can compact around developing pegs, making pod harvesting difficult compared to light sandy soil." }
        ]
      }
    },

    "zone-4": {
      id: "zone-4",
      number: "04",
      name: "Zone 04 • Sweet Corn Block",
      crop: "Sweet Corn (Pioneer Hybrid)",
      hindiCrop: "स्वीट कॉर्न / मक्का",
      acreage: 0.125,
      sampleId: "KY-SOIL-Z04-2026-OCT",
      collectionDate: "2026-10-18",
      testingDate: "2026-10-22",
      testingLab: "ICAR-Central Soil Testing Laboratory, Pune",
      labTechnician: "S. K. Deshmukh, Lab Scientist",
      measurementSource: "Verified Laboratory Certificate (NABL Accredited)",
      sourceType: "lab",
      properties: {
        ph: 5.8,
        phStatus: "Moderately Acidic (Aluminum Fixation Risk)",
        ec: 0.9,
        ecStatus: "Low (Nutrient Depleted)",
        soilMoisture: 22, // Critically Low, currently pump hydrating!
        soilMoistureSource: "ESP32 LoRa Probe #04 (Live Telemetry)",
        soilTemp: 28.2, // High temp due to dry ground
        soilTempSource: "ESP32 DS18B20 #04 (Live Telemetry)",
        soilTexture: "Sandy Clay Loam (Degraded Surface)",
        textureDetails: "Sand: 52%, Silt: 20%, Clay: 28%",
        soilType: "Degraded Inceptisol with Subsoil Hardpan",
        soilDepthTopsoil: "35 cm",
        soilDepthEffective: "45 cm (Compacted Subsoil Barrier at 40 cm)",
        waterHoldingCapacity: 17.5,
        waterHoldingCapacityRating: "Low (Poor Infiltration / Runoff Risk)",
        drainageCondition: "Impaired (Slow Subsoil Permeability)",
        compaction: 260,
        compactionRating: "High Compaction (Severe Hardpan Barrier)"
      },
      nutrients: {
        macronutrients: [
          { key: "n", name: "Available Nitrogen (N)", symbol: "N", value: 175, unit: "kg/ha", status: "Deficient", range: "280 - 560 kg/ha", defAlert: true, advice: "CRITICAL: Severe Nitrogen deficiency! Crop tasseling requires high N. Apply split dose of 35 kg/acre Urea with neem extract immediately.", source: "Lab" },
          { key: "p", name: "Available Phosphorus (P)", symbol: "P", value: 14.2, unit: "kg/ha", status: "Deficient", range: "23 - 56 kg/ha", defAlert: true, advice: "CRITICAL: P fixed by acidic soil (pH 5.8). Apply Single Super Phosphate (SSP) with 200 kg farm compost.", source: "Lab" },
          { key: "k", name: "Available Potassium (K)", symbol: "K", value: 155, unit: "kg/ha", status: "Low-Medium", range: "145 - 335 kg/ha", defAlert: false, advice: "Borderline low. Corn needs K for stalk strength and wind resistance.", source: "Lab" },
          { key: "oc", name: "Organic Carbon (OC)", symbol: "OC", value: 0.41, unit: "%", status: "Low", range: "0.50 - 0.75%", defAlert: true, advice: "DEPLETED: Soil organic carbon is critically low (0.41%). Intensive monoculture has exhausted humus.", source: "Lab" },
          { key: "s", name: "Available Sulphur (S)", symbol: "S", value: 8.4, unit: "mg/kg", status: "Deficient", range: "10.0 - 25.0 mg/kg", defAlert: true, advice: "Deficient (<10 mg/kg). Sulphur deficiency causes yellowing of upper corn leaves.", source: "Lab" }
        ],
        micronutrients: [
          { key: "zn", name: "Available Zinc (Zn)", symbol: "Zn", value: 0.48, unit: "ppm", status: "Deficient", range: "0.60 - 1.50 ppm", defAlert: true, advice: "CRITICAL: Zinc deficiency causes 'White Bud' of maize! Soil application of Zinc Sulphate (ZnSO4 21%) @ 10 kg/acre required.", source: "Lab" },
          { key: "fe", name: "Available Iron (Fe)", symbol: "Fe", value: 9.8, unit: "ppm", status: "High", range: "4.50 - 10.0 ppm", defAlert: false, advice: "Iron availability is artificially elevated due to soil acidity.", source: "Lab" },
          { key: "cu", name: "Available Copper (Cu)", symbol: "Cu", value: 0.28, unit: "ppm", status: "Marginal", range: "0.20 - 0.80 ppm", defAlert: false, advice: "Low-normal.", source: "Lab" },
          { key: "mn", name: "Available Manganese (Mn)", symbol: "Mn", value: 6.2, unit: "ppm", status: "High", range: "2.00 - 6.00 ppm", defAlert: false, advice: "Elevated due to acidity.", source: "Lab" },
          { key: "b", name: "Available Boron (B)", symbol: "B", value: 0.35, unit: "ppm", status: "Deficient", range: "0.50 - 1.20 ppm", defAlert: true, advice: "Deficient. Poor ear cob filling and kernel gap risk. Apply Borax 2 kg/acre.", source: "Lab" }
        ]
      },
      soilHealth: {
        score: 52,
        grade: "Grade C (Degraded / Action Required)",
        fertilityStatus: "Severely Depleted (Low N, Low P, Low OC, Low Zn, Low B)",
        phStatus: "Moderately Acidic (5.8) - Needs Agricultural Lime",
        salinityStatus: "Low EC (0.9 dS/m) - Leached",
        ocStatus: "Low (0.41%) - Severely Depleted",
        deficiencySummary: "5 Deficiencies Detected: N, P, S, Zn, B",
        moistureStatus: "22% - Critical Water Stress (Active Drip Soak)",
        drainageStatus: "Compacted Subsoil (260 PSI Hardpan at 40cm)",
        biologicalVitality: "Depleted (Low Earthworm Count, Low Microbial Biomass)"
      },
      testHistory: [
        { sampleId: "KY-SOIL-Z04-2026-OCT", date: "2026-10-22", lab: "ICAR Pune", score: 52, ph: 5.8, ec: 0.9, oc: 0.41, n: 175, p: 14.2, k: 155, notes: "Current test. Multiple macro and micronutrient deficiencies, severe subsoil compaction." },
        { sampleId: "KY-SOIL-Z04-2026-APR", date: "2026-04-12", lab: "ICAR Pune", score: 58, ph: 5.9, ec: 1.0, oc: 0.45, n: 190, p: 16.0, k: 165, notes: "Pre-season test. Exhibited early signs of nutrient depletion." }
      ],
      telemetryHistory: {
        timestamps: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        moisture: [26, 25, 24, 22, 21, 22, 22],
        temperature: [24.0, 23.2, 25.5, 30.1, 29.4, 28.5, 28.2]
      },
      improvementPlan: [
        { pillar: "pH Neutralization & Liming", action: "Broadcast Agricultural Lime (CaCO3) @ 250 kg/acre post-harvest and lightly incorporate into top 15 cm.", reason: "Neutralizes acidic pH from 5.8 to 6.5, eliminating aluminum toxicity and unlocking fixed phosphorus." },
        { pillar: "Organic Carbon Rebuilding", action: "Apply 4 tons/acre well-rotted Farmyard Manure (FYM) or composted pressmud, followed by green manuring with Dhaincha (Sesbania).", reason: "Restores organic carbon from 0.41% to >0.65%, dramatically improving cation exchange and moisture holding capacity." },
        { pillar: "Hardpan Shattering & Decompaction", action: "Perform subsoiling / chisel ploughing to 50 cm depth across the plot before the next crop cycle.", reason: "Breaks the 260 PSI subsoil hardpan barrier, allowing corn taproots to tap subsoil moisture." },
        { pillar: "Immediate Nitrogen & Zinc Rescue", action: "Apply 25 kg Neem Urea + 5 kg Zinc Sulphate (21%) blended in 100 kg moist compost directly along the drip line.", reason: "Halts leaf chlorosis and supplies critical nitrogen for ear tasseling and cob grain development." },
        { pillar: "Phosphorus & Sulphur Replenishment", action: "Band place 40 kg Single Super Phosphate (SSP) containing 16% P₂O₅ and 11% Sulphur.", reason: "SSP provides both deficient Phosphorus and Sulphur in water-soluble plant-available form." }
      ],
      cropSuitability: {
        mostSuitable: [
          { name: "Sweet Corn (Under Recovery)", hindiName: "स्वीट कॉर्न / मक्का", suitabilityScore: 78, category: "cereals", requiredPh: "5.8 - 7.0", existingPh: "5.8 (Tolerable)", requiredTexture: "Well-drained Loam", existingTexture: "Compacted Sandy Clay Loam", waterReq: "5.4 mm/day (~295 L)", duration: "80 - 95 Days", challenges: "Requires urgent nitrogen top-dressing and deep subsoiling." },
          { name: "Ragi / Finger Millet", hindiName: "रागी / मंडुआ", suitabilityScore: 88, category: "cereals", requiredPh: "5.0 - 7.0", existingPh: "5.8 (Excellent match)", requiredTexture: "Tolerates light to sandy clay loam", existingTexture: "Sandy Clay Loam", waterReq: "2.8 mm/day (~150 L)", duration: "90 - 110 Days", challenges: "Highly acid-tolerant, drought-resilient alternative crop." },
          { name: "Cassava / Tapioca", hindiName: "कसावा / शकरकंद", suitabilityScore: 84, category: "vegetables", requiredPh: "5.2 - 6.5", existingPh: "5.8 (Good)", requiredTexture: "Sandy Clay Loam", existingTexture: "Sandy Clay Loam", waterReq: "3.0 mm/day (~165 L)", duration: "180 - 240 Days", challenges: "Deep rooter, thrives in moderately acidic soils." }
        ],
        suitableCategories: {
          vegetables: ["Sweet Potato (86%)", "Tapioca (84%)", "Okra (75%)"],
          fruits: ["Pineapple (88%)", "Cashew (85%)", "Mango (80%)"],
          pulses: ["Cowpea / Lobia (82%)", "Horse Gram / Kulthi (89%)"],
          cereals: ["Ragi / Finger Millet (88%)", "Foxtail Millet (85%)", "Sweet Corn (78%)"]
        },
        requiresImprovement: [
          { name: "Sweet Corn", issue: "Soil compaction (260 PSI) restricts ear development and nitrogen is leached.", fixRequired: "Subsoiling + Urea & Zinc Top-dress" },
          { name: "Soybean", issue: "Rhizobium nodulation fails in soils below pH 6.2 without liming.", fixRequired: "Apply lime 250 kg/acre" }
        ],
        notRecommended: [
          { name: "Spinach & Leafy Vegetables", reason: "Acidic soil fixes phosphorus and zinc; shallow roots cannot penetrate the 260 PSI hardpan." },
          { name: "Cauliflower / Cabbage", reason: "Severely prone to Whiptail disorder and Molybdenum deficiency in acidic soils below pH 6.0." }
        ]
      }
    },

    "zone-5": {
      id: "zone-5",
      number: "05",
      name: "Zone 05 • Trellised Cucumber",
      crop: "Cucumber (F1 Crispy Green)",
      hindiCrop: "खीरा / ककड़ी",
      acreage: 0.125,
      sampleId: "KY-SOIL-Z05-2026-OCT",
      collectionDate: "2026-10-18",
      testingDate: "2026-10-22",
      testingLab: "ICAR-Central Soil Testing Laboratory, Pune",
      labTechnician: "S. K. Deshmukh, Lab Scientist",
      measurementSource: "Verified Laboratory Certificate (NABL Accredited)",
      sourceType: "lab",
      properties: {
        ph: 6.5,
        phStatus: "Optimal (Neutral-Slightly Acidic)",
        ec: 1.3,
        ecStatus: "Normal (Ideal Conductivity)",
        soilMoisture: 54,
        soilMoistureSource: "ESP32 LoRa Probe #05 (Live)",
        soilTemp: 23.9,
        soilTempSource: "ESP32 DS18B20 #05 (Live)",
        soilTexture: "Alluvial Sandy Loam",
        textureDetails: "Sand: 58%, Silt: 28%, Clay: 14%",
        soilType: "Deep Riverbank Alluvium (Fluvisol)",
        soilDepthTopsoil: "65 cm",
        soilDepthEffective: "120 cm",
        waterHoldingCapacity: 28.0,
        waterHoldingCapacityRating: "Good",
        drainageCondition: "Well-Drained",
        compaction: 130,
        compactionRating: "Low (Very Healthy Root Penetration)"
      },
      nutrients: {
        macronutrients: [
          { key: "n", name: "Available Nitrogen (N)", symbol: "N", value: 310, unit: "kg/ha", status: "Medium-High", range: "280 - 560 kg/ha", defAlert: false, advice: "Continuous vine production without nitrogen lag.", source: "Lab" },
          { key: "p", name: "Available Phosphorus (P)", symbol: "P", value: 28.0, unit: "kg/ha", status: "High", range: "23 - 56 kg/ha", defAlert: false, advice: "Optimal root vigor.", source: "Lab" },
          { key: "k", name: "Available Potassium (K)", symbol: "K", value: 260, unit: "kg/ha", status: "High", range: "145 - 335 kg/ha", defAlert: false, advice: "Prevents tapered fruit tips and ensures crisp cucumber flesh.", source: "Lab" },
          { key: "oc", name: "Organic Carbon (OC)", symbol: "OC", value: 0.84, unit: "%", status: "High", range: "0.50 - 0.75%", defAlert: false, advice: "High organic matter due to regular compost mulching.", source: "Lab" },
          { key: "s", name: "Available Sulphur (S)", symbol: "S", value: 22.0, unit: "mg/kg", status: "Sufficient", range: "10.0 - 25.0 mg/kg", defAlert: false, advice: "Optimal.", source: "Lab" }
        ],
        micronutrients: [
          { key: "zn", name: "Available Zinc (Zn)", symbol: "Zn", value: 1.15, unit: "ppm", status: "Adequate", range: "0.60 - 1.50 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "fe", name: "Available Iron (Fe)", symbol: "Fe", value: 7.5, unit: "ppm", status: "Adequate", range: "4.50 - 10.0 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "cu", name: "Available Copper (Cu)", symbol: "Cu", value: 0.52, unit: "ppm", status: "Adequate", range: "0.20 - 0.80 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "mn", name: "Available Manganese (Mn)", symbol: "Mn", value: 4.5, unit: "ppm", status: "Adequate", range: "2.00 - 6.00 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "b", name: "Available Boron (B)", symbol: "B", value: 0.85, unit: "ppm", status: "Adequate", range: "0.50 - 1.20 ppm", defAlert: false, advice: "Prevents bent fruit curvature.", source: "Lab" }
        ]
      },
      soilHealth: {
        score: 94,
        grade: "Grade A+ (Prime Benchmark Soil)",
        fertilityStatus: "Prime Fertility (All Macro & Micronutrients in Optimal Sufficiency)",
        phStatus: "Optimal (6.5) - Thermodynamic Equilibrium",
        salinityStatus: "Non-Saline (1.3 dS/m)",
        ocStatus: "High (0.84%)",
        deficiencySummary: "Zero Deficiencies (Benchmark Agricultural Model)",
        moistureStatus: "54% - Ideal Drip Field Capacity",
        drainageStatus: "Deep Alluvial Loam Tilth",
        biologicalVitality: "Abundant Earthworms, High Mycorrhizal Inoculation"
      },
      testHistory: [
        { sampleId: "KY-SOIL-Z05-2026-OCT", date: "2026-10-22", lab: "ICAR Pune", score: 94, ph: 6.5, ec: 1.3, oc: 0.84, n: 310, p: 28.0, k: 260, notes: "Benchmark soil health. Highest scoring zone on the farm." }
      ],
      telemetryHistory: {
        timestamps: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        moisture: [56, 55, 54, 52, 53, 55, 54],
        temperature: [21.8, 21.0, 22.8, 26.2, 25.0, 23.8, 23.9]
      },
      improvementPlan: [
        { pillar: "Maintenance of Benchmark Quality", action: "Continue current organic vermicompost addition (@ 1 ton/acre annually) after cucumber harvest.", reason: "Maintains high soil organic carbon (0.84%) and active soil microbial food web." },
        { pillar: "Split Fertigation Strategy", action: "Maintain 13:40:13 water-soluble fertilizer during flowering followed by 0:0:50 potassium sulphate during fruiting.", reason: "Sustains heavy harvest output (2,400 kg projected) without depleting soil bank." },
        { pillar: "Salinity Watch", action: "Maintain seasonal leaching cycle before monsoons to ensure EC stays under 1.5 dS/m.", reason: "Cucumbers are sensitive to sodium accumulation." }
      ],
      cropSuitability: {
        mostSuitable: [
          { name: "Cucumbers (Trellised)", hindiName: "खीरा / ककड़ी", suitabilityScore: 96, category: "vegetables", requiredPh: "6.0 - 7.0", existingPh: "6.5 (Optimal)", requiredTexture: "Rich Sandy Loam", existingTexture: "Alluvial Sandy Loam", waterReq: "4.6 mm/day (~250 L)", duration: "60 - 75 Days", challenges: "Requires continuous trellis pruning and powdery mildew scouting." },
          { name: "Muskmelon / Cantaloupe", hindiName: "खरबूजा", suitabilityScore: 95, category: "fruits", requiredPh: "6.0 - 7.0", existingPh: "6.5", requiredTexture: "Deep Sandy Loam", existingTexture: "Alluvial Loam", waterReq: "4.2 mm/day (~230 L)", duration: "80 - 90 Days", challenges: "Reduce watering 10 days before harvest to concentrate sugar." },
          { name: "Zucchini", hindiName: "जुकिनी", suitabilityScore: 94, category: "vegetables", requiredPh: "6.0 - 7.5", existingPh: "6.5", requiredTexture: "Loam", existingTexture: "Alluvial Loam", waterReq: "4.0 mm/day (~220 L)", duration: "50 - 65 Days", challenges: "Daily harvesting required to prevent oversized fruit." }
        ],
        suitableCategories: {
          vegetables: ["Cucumber (96%)", "Zucchini (94%)", "Bitter Gourd (92%)", "Bottle Gourd (91%)", "Tomato (90%)"],
          fruits: ["Muskmelon (95%)", "Watermelon (93%)", "Strawberries (89%)"],
          pulses: ["French Beans (91%)", "Cowpea (89%)"],
          cereals: ["Sweet Corn (92%)"]
        },
        requiresImprovement: [],
        notRecommended: [
          { name: "Acidophilic Berries (Blueberry)", reason: "Requires strongly acidic peat soils (pH 4.5 - 5.2); incompatible with neutral alluvial loam." }
        ]
      }
    },

    "zone-6": {
      id: "zone-6",
      number: "06",
      name: "Zone 06 • French Green Beans",
      crop: "French Beans (Contender)",
      hindiCrop: "फ्रेंच बीन्स",
      acreage: 0.125,
      sampleId: "KY-SOIL-Z06-2026-OCT",
      collectionDate: "2026-10-18",
      testingDate: "2026-10-22",
      testingLab: "ICAR-Central Soil Testing Laboratory, Pune",
      labTechnician: "S. K. Deshmukh, Lab Scientist",
      measurementSource: "Verified Laboratory Certificate (NABL Accredited)",
      sourceType: "lab",
      properties: {
        ph: 7.4,
        phStatus: "Slightly Alkaline (Calcareous Influence)",
        ec: 1.6,
        ecStatus: "Borderline High (Monitor for Salinity)",
        soilMoisture: 47,
        soilMoistureSource: "ESP32 LoRa Probe #06 (Live)",
        soilTemp: 24.6,
        soilTempSource: "ESP32 DS18B20 #06 (Live)",
        soilTexture: "Clay Loam (Heavy Crumb)",
        textureDetails: "Sand: 35%, Silt: 32%, Clay: 33%",
        soilType: "Medium Black Soil (Vertisol Intergrade)",
        soilDepthTopsoil: "70 cm",
        soilDepthEffective: "110 cm",
        waterHoldingCapacity: 34.0,
        waterHoldingCapacityRating: "High (Deep Moisture Reservoir)",
        drainageCondition: "Moderately Well-Drained",
        compaction: 175,
        compactionRating: "Moderate (Shrink-Swell Characteristic)"
      },
      nutrients: {
        macronutrients: [
          { key: "n", name: "Available Nitrogen (N)", symbol: "N", value: 245, unit: "kg/ha", status: "Medium", range: "280 - 560 kg/ha", defAlert: false, advice: "Legume nodules fixing atmospheric nitrogen; maintain Rhizobium phase.", source: "Lab" },
          { key: "p", name: "Available Phosphorus (P)", symbol: "P", value: 22.5, unit: "kg/ha", status: "Medium", range: "23 - 56 kg/ha", defAlert: false, advice: "Adequate.", source: "Lab" },
          { key: "k", name: "Available Potassium (K)", symbol: "K", value: 280, unit: "kg/ha", status: "High", range: "145 - 335 kg/ha", defAlert: false, advice: "Black Vertisols naturally rich in illitic clay minerals.", source: "Lab" },
          { key: "oc", name: "Organic Carbon (OC)", symbol: "OC", value: 0.58, unit: "%", status: "Medium", range: "0.50 - 0.75%", defAlert: false, advice: "Moderate organic matter.", source: "Lab" },
          { key: "s", name: "Available Sulphur (S)", symbol: "S", value: 12.0, unit: "mg/kg", status: "Marginal", range: "10.0 - 25.0 mg/kg", defAlert: false, advice: "Borderline. Sulphur improves amino acid content in beans.", source: "Lab" }
        ],
        micronutrients: [
          { key: "zn", name: "Available Zinc (Zn)", symbol: "Zn", value: 0.55, unit: "ppm", status: "Deficient", range: "0.60 - 1.50 ppm", defAlert: true, advice: "DEFICIENT: Slightly alkaline pH (7.4) restricts Zinc solubility. Apply Zinc EDTA foliar spray @ 1 g/L.", source: "Lab" },
          { key: "fe", name: "Available Iron (Fe)", symbol: "Fe", value: 4.2, unit: "ppm", status: "Deficient", range: "4.50 - 10.0 ppm", defAlert: true, advice: "DEFICIENT: Iron chlorosis risk in black calcareous soils. Apply Fe-EDDHA (chelated iron) or Ferrous Sulphate foliar spray.", source: "Lab" },
          { key: "cu", name: "Available Copper (Cu)", symbol: "Cu", value: 0.44, unit: "ppm", status: "Adequate", range: "0.20 - 0.80 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "mn", name: "Available Manganese (Mn)", symbol: "Mn", value: 3.2, unit: "ppm", status: "Adequate", range: "2.00 - 6.00 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "b", name: "Available Boron (B)", symbol: "B", value: 0.58, unit: "ppm", status: "Adequate", range: "0.50 - 1.20 ppm", defAlert: false, advice: "Optimal.", source: "Lab" }
        ]
      },
      soilHealth: {
        score: 76,
        grade: "Grade A (Good Agricultural Condition)",
        fertilityStatus: "High Potassium, Good Moisture Holding, Alkaline Micronutrient Lockup",
        phStatus: "Slightly Alkaline (7.4) - Calcareous Influence",
        salinityStatus: "Borderline EC (1.6 dS/m)",
        ocStatus: "Moderate (0.58%)",
        deficiencySummary: "2 Micronutrient Deficiencies: Zinc (0.55 ppm) & Iron (4.2 ppm)",
        moistureStatus: "47% - High Water Retention Capacity",
        drainageStatus: "Clay Loam with Shrink-Swell Cracks",
        biologicalVitality: "Active Rhizobium Legume Nodulation"
      },
      testHistory: [
        { sampleId: "KY-SOIL-Z06-2026-OCT", date: "2026-10-22", lab: "ICAR Pune", score: 76, ph: 7.4, ec: 1.6, oc: 0.58, n: 245, p: 22.5, k: 280, notes: "Current test. High potassium, borderline EC, Zn and Fe deficiency due to alkaline reaction." }
      ],
      telemetryHistory: {
        timestamps: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        moisture: [49, 48, 47, 46, 46, 47, 47],
        temperature: [22.8, 22.0, 23.6, 27.0, 25.8, 24.4, 24.6]
      },
      improvementPlan: [
        { pillar: "Alkaline Micronutrient Mobilization", action: "Apply Chelated Zinc (Zn-EDTA 12%) @ 1.5 g/L and Chelated Iron (Fe-EDDHA) @ 1.0 g/L as foliar sprays.", reason: "Overcomes soil fixation where calcareous minerals precipitate zinc and iron into insoluble carbonates." },
        { pillar: "Salinity & EC Mitigation", action: "Incorporate 500 kg elemental agricultural gypsum or pressmud to displace exchangeable sodium and lower EC.", reason: "Improves water infiltration through the dense 33% clay fraction and prevents surface crusting." },
        { pillar: "Rhizobium Bio-Inoculation", action: "Seed-treat French Beans with Rhizobium leguminosarum phaseoli culture before sowing.", reason: "Boosts root nodulation, providing 30-40 kg/ha of natural biological nitrogen." }
      ],
      cropSuitability: {
        mostSuitable: [
          { name: "French Beans", hindiName: "फ्रेंच बीन्स", suitabilityScore: 92, category: "pulses", requiredPh: "6.5 - 7.5", existingPh: "7.4 (Good match)", requiredTexture: "Clay Loam", existingTexture: "Clay Loam", waterReq: "3.5 mm/day (~190 L)", duration: "65 - 80 Days", challenges: "Requires foliar zinc/iron spray to prevent interveinal chlorosis." },
          { name: "Chickpea / Bengal Gram", hindiName: "चना", suitabilityScore: 94, category: "pulses", requiredPh: "6.8 - 8.0", existingPh: "7.4 (Perfect)", requiredTexture: "Heavy Clay Loam", existingTexture: "Clay Loam", waterReq: "2.4 mm/day (~130 L)", duration: "90 - 110 Days", challenges: "Extremely well adapted to black clay soils with deep residual moisture." },
          { name: "Cotton / Kapas", hindiName: "कपास", suitabilityScore: 90, category: "cereals", requiredPh: "7.0 - 8.2", existingPh: "7.4", requiredTexture: "Deep Black Vertisol", existingTexture: "Clay Loam", waterReq: "4.5 mm/day (~245 L)", duration: "150 - 180 Days", challenges: "Requires long frost-free season." }
        ],
        suitableCategories: {
          vegetables: ["Onions (89%)", "French Beans (92%)", "Garlic (88%)", "Okra (87%)"],
          fruits: ["Guava (88%)", "Fig / Anjeer (87%)", "Pomegranate (89%)"],
          pulses: ["Chickpea / Gram (94%)", "Pigeon Pea / Arhar (90%)", "Black Gram (88%)"],
          cereals: ["Sorghum / Jowar (91%)", "Wheat (88%)", "Pearl Millet / Bajra (86%)"]
        },
        requiresImprovement: [
          { name: "Potato", issue: "Clay loam sticks to tubers during harvest and high pH 7.4 causes severe potato scab.", fixRequired: "Acidifying mulch & sand beds" }
        ],
        notRecommended: [
          { name: "Carrots (Nantes)", reason: "Heavy 33% clay loam causes taproot branching, forking, and stunt deformation." }
        ]
      }
    },

    "zone-7": {
      id: "zone-7",
      number: "07",
      name: "Zone 07 • Nantes Sweet Carrots",
      crop: "Carrots (Nantes Scarlet)",
      hindiCrop: "गाजर",
      acreage: 0.125,
      sampleId: "KY-SOIL-Z07-2026-OCT",
      collectionDate: "2026-10-18",
      testingDate: "2026-10-22",
      testingLab: "ICAR-Central Soil Testing Laboratory, Pune",
      labTechnician: "S. K. Deshmukh, Lab Scientist",
      measurementSource: "Verified Laboratory Certificate (NABL Accredited)",
      sourceType: "lab",
      properties: {
        ph: 6.3,
        phStatus: "Slightly Acidic (Optimal for Carrots)",
        ec: 1.0,
        ecStatus: "Low / Very Safe",
        soilMoisture: 44,
        soilMoistureSource: "ESP32 LoRa Probe #07 (Live)",
        soilTemp: 23.5,
        soilTempSource: "ESP32 DS18B20 #07 (Live)",
        soilTexture: "Fine Sandy Loam (Stone-Free)",
        textureDetails: "Sand: 72%, Silt: 18%, Clay: 10%",
        soilType: "Deep Sandy Alluvium (Stone-Free Loose Bed)",
        soilDepthTopsoil: "80 cm",
        soilDepthEffective: "130 cm",
        waterHoldingCapacity: 19.5,
        waterHoldingCapacityRating: "Moderate-Low (Excellent Permeability)",
        drainageCondition: "Excessively Well-Drained",
        compaction: 95,
        compactionRating: "Very Low (Soft Deep Bed for Straight Taproots)"
      },
      nutrients: {
        macronutrients: [
          { key: "n", name: "Available Nitrogen (N)", symbol: "N", value: 210, unit: "kg/ha", status: "Low-Medium", range: "280 - 560 kg/ha", defAlert: false, advice: "Moderate nitrogen is deliberately maintained; excess nitrogen causes hairy, forked carrot roots.", source: "Lab" },
          { key: "p", name: "Available Phosphorus (P)", symbol: "P", value: 32.0, unit: "kg/ha", status: "High", range: "23 - 56 kg/ha", defAlert: false, advice: "High phosphorus stimulates long straight taproot extension.", source: "Lab" },
          { key: "k", name: "Available Potassium (K)", symbol: "K", value: 275, unit: "kg/ha", status: "High", range: "145 - 335 kg/ha", defAlert: false, advice: "High potassium promotes beta-carotene pigment synthesis and high natural sugar content.", source: "Lab" },
          { key: "oc", name: "Organic Carbon (OC)", symbol: "OC", value: 0.54, unit: "%", status: "Medium", range: "0.50 - 0.75%", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "s", name: "Available Sulphur (S)", symbol: "S", value: 15.0, unit: "mg/kg", status: "Sufficient", range: "10.0 - 25.0 mg/kg", defAlert: false, advice: "Optimal.", source: "Lab" }
        ],
        micronutrients: [
          { key: "zn", name: "Available Zinc (Zn)", symbol: "Zn", value: 0.82, unit: "ppm", status: "Adequate", range: "0.60 - 1.50 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "fe", name: "Available Iron (Fe)", symbol: "Fe", value: 6.4, unit: "ppm", status: "Adequate", range: "4.50 - 10.0 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "cu", name: "Available Copper (Cu)", symbol: "Cu", value: 0.36, unit: "ppm", status: "Adequate", range: "0.20 - 0.80 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "mn", name: "Available Manganese (Mn)", symbol: "Mn", value: 3.9, unit: "ppm", status: "Adequate", range: "2.00 - 6.00 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "b", name: "Available Boron (B)", symbol: "B", value: 0.65, unit: "ppm", status: "Adequate", range: "0.50 - 1.20 ppm", defAlert: false, advice: "Boron prevents five-star core splitting in carrots.", source: "Lab" }
        ]
      },
      soilHealth: {
        score: 90,
        grade: "Grade A+ (Prime Root-Crop Health)",
        fertilityStatus: "Prime Root-Crop Conditions (High P, High K, Low Compaction)",
        phStatus: "Slightly Acidic (6.3) - Optimal",
        salinityStatus: "Very Low (1.0 dS/m)",
        ocStatus: "Moderate (0.54%)",
        deficiencySummary: "Zero Deficiencies",
        moistureStatus: "44% - Evenly Moist Loose Soil",
        drainageStatus: "Deep Stone-Free Sandy Tilth (95 PSI)",
        biologicalVitality: "Clean Soil Free of Nematode Galls"
      },
      testHistory: [
        { sampleId: "KY-SOIL-Z07-2026-OCT", date: "2026-10-22", lab: "ICAR Pune", score: 90, ph: 6.3, ec: 1.0, oc: 0.54, n: 210, p: 32.0, k: 275, notes: "Current test. Excellent friable soil tilth." }
      ],
      telemetryHistory: {
        timestamps: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        moisture: [46, 45, 44, 43, 43, 44, 44],
        temperature: [21.5, 20.8, 22.2, 25.8, 24.5, 23.2, 23.5]
      },
      improvementPlan: [
        { pillar: "Rootzone Friability Preservation", action: "Avoid heavy machinery or foot traffic on carrot beds; maintain broad bed furrows (BBF).", reason: "Compaction above 120 PSI forces taproots to split into multiple forks." },
        { pillar: "Potassium Top-Dressing", action: "Apply Potassium Schoenite or Sulphate of Potash (0:0:50) @ 2 kg/acre via drip during root bulking.", reason: "Enhances root crispness, deep orange carotene hue, and post-harvest shelf life." },
        { pillar: "Frequent Light Irrigation", action: "Deliver short 30-minute drip cycles every 2 days instead of heavy weekly soaking.", reason: "Sandy loam drains rapidly; uniform moisture prevents root splitting and growth cracks." }
      ],
      cropSuitability: {
        mostSuitable: [
          { name: "Carrots (Nantes)", hindiName: "गाजर", suitabilityScore: 96, category: "vegetables", requiredPh: "5.8 - 6.8", existingPh: "6.3 (Ideal)", requiredTexture: "Deep Stone-Free Sand", existingTexture: "Fine Sandy Loam (Optimal)", waterReq: "3.1 mm/day (~170 L)", duration: "80 - 100 Days", challenges: "Requires light frequent irrigation to prevent dry-wet root cracks." },
          { name: "Radish / Mooli", hindiName: "मूली", suitabilityScore: 95, category: "vegetables", requiredPh: "6.0 - 7.0", existingPh: "6.3", requiredTexture: "Loose Sandy Loam", existingTexture: "Fine Sandy Loam", waterReq: "2.6 mm/day (~145 L)", duration: "40 - 55 Days", challenges: "Fast growing, harvest promptly to prevent pithiness." },
          { name: "Groundnut / Peanut", hindiName: "मूंगफली", suitabilityScore: 93, category: "pulses", requiredPh: "6.0 - 7.0", existingPh: "6.3", requiredTexture: "Light Sandy Soil", existingTexture: "Sandy Loam", waterReq: "3.5 mm/day (~190 L)", duration: "110 - 125 Days", challenges: "Pegs penetrate effortlessly into the soft 95 PSI soil." }
        ],
        suitableCategories: {
          vegetables: ["Carrots (96%)", "Radish (95%)", "Beetroot (91%)", "Turnip (90%)"],
          fruits: ["Watermelon (94%)", "Muskmelon (93%)"],
          pulses: ["Groundnut (93%)", "Cowpea (89%)"],
          cereals: ["Pearl Millet / Bajra (90%)"]
        },
        requiresImprovement: [],
        notRecommended: [
          { name: "Paddy Rice", reason: "Rapid deep percolation through 72% sand fraction prevents ponding." }
        ]
      }
    },

    "zone-8": {
      id: "zone-8",
      number: "08",
      name: "Zone 08 • High-Density Culinary Herbs",
      crop: "Culinary Herbs & Spearmint",
      hindiCrop: "पुदीना, तुलसी व औषधीय पौधे",
      acreage: 0.125,
      sampleId: "KY-SOIL-Z08-2026-OCT",
      collectionDate: "2026-10-18",
      testingDate: "2026-10-22",
      testingLab: "ICAR-Central Soil Testing Laboratory, Pune",
      labTechnician: "S. K. Deshmukh, Lab Scientist",
      measurementSource: "Verified Laboratory Certificate (NABL Accredited)",
      sourceType: "lab",
      properties: {
        ph: 6.9,
        phStatus: "Neutral (Optimal for Essential Oils)",
        ec: 1.2,
        ecStatus: "Non-Saline (Very Safe)",
        soilMoisture: 48,
        soilMoistureSource: "ESP32 LoRa Probe #08 (Live)",
        soilTemp: 24.1,
        soilTempSource: "ESP32 DS18B20 #08 (Live)",
        soilTexture: "Rich Garden Loam (Vermicompost Base)",
        textureDetails: "Sand: 40%, Silt: 40%, Clay: 20%",
        soilType: "Enriched Garden Loam with Vermicompost",
        soilDepthTopsoil: "45 cm",
        soilDepthEffective: "90 cm",
        waterHoldingCapacity: 30.5,
        waterHoldingCapacityRating: "High",
        drainageCondition: "Well-Drained",
        compaction: 120,
        compactionRating: "Low (Very Soft, High Worm Activity)"
      },
      nutrients: {
        macronutrients: [
          { key: "n", name: "Available Nitrogen (N)", symbol: "N", value: 290, unit: "kg/ha", status: "Medium-High", range: "280 - 560 kg/ha", defAlert: false, advice: "Stimulates dense stolon and aromatic leaf growth.", source: "Lab" },
          { key: "p", name: "Available Phosphorus (P)", symbol: "P", value: 26.5, unit: "kg/ha", status: "High", range: "23 - 56 kg/ha", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "k", name: "Available Potassium (K)", symbol: "K", value: 220, unit: "kg/ha", status: "High", range: "145 - 335 kg/ha", defAlert: false, advice: "High potassium enhances menthol and essential oil concentration.", source: "Lab" },
          { key: "oc", name: "Organic Carbon (OC)", symbol: "OC", value: 0.78, unit: "%", status: "High", range: "0.50 - 0.75%", defAlert: false, advice: "Optimal biological carbon.", source: "Lab" },
          { key: "s", name: "Available Sulphur (S)", symbol: "S", value: 17.5, unit: "mg/kg", status: "Sufficient", range: "10.0 - 25.0 mg/kg", defAlert: false, advice: "Optimal.", source: "Lab" }
        ],
        micronutrients: [
          { key: "zn", name: "Available Zinc (Zn)", symbol: "Zn", value: 0.90, unit: "ppm", status: "Adequate", range: "0.60 - 1.50 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "fe", name: "Available Iron (Fe)", symbol: "Fe", value: 7.1, unit: "ppm", status: "Adequate", range: "4.50 - 10.0 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "cu", name: "Available Copper (Cu)", symbol: "Cu", value: 0.40, unit: "ppm", status: "Adequate", range: "0.20 - 0.80 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "mn", name: "Available Manganese (Mn)", symbol: "Mn", value: 4.2, unit: "ppm", status: "Adequate", range: "2.00 - 6.00 ppm", defAlert: false, advice: "Optimal.", source: "Lab" },
          { key: "b", name: "Available Boron (B)", symbol: "B", value: 0.60, unit: "ppm", status: "Adequate", range: "0.50 - 1.20 ppm", defAlert: false, advice: "Optimal.", source: "Lab" }
        ]
      },
      soilHealth: {
        score: 91,
        grade: "Grade A+ (Prime Soil Health)",
        fertilityStatus: "Prime Aromatic Herb Soil (High OC, Balanced NPK, High Microbial Bio-Titer)",
        phStatus: "Neutral (6.9) - Optimal",
        salinityStatus: "Non-Saline (1.2 dS/m)",
        ocStatus: "High (0.78%)",
        deficiencySummary: "Zero Deficiencies",
        moistureStatus: "48% - Steady Rootzone Moisture",
        drainageStatus: "Well-Drained Organic Loam",
        biologicalVitality: "Very High (Enriched with Bio-Enzymes)"
      },
      testHistory: [
        { sampleId: "KY-SOIL-Z08-2026-OCT", date: "2026-10-22", lab: "ICAR Pune", score: 91, ph: 6.9, ec: 1.2, oc: 0.78, n: 290, p: 26.5, k: 220, notes: "Current test. Excellent organic carbon." }
      ],
      telemetryHistory: {
        timestamps: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00", "Now"],
        moisture: [50, 49, 48, 46, 47, 48, 48],
        temperature: [22.0, 21.2, 23.0, 26.5, 25.2, 24.0, 24.1]
      },
      improvementPlan: [
        { pillar: "Aromatic Essential Oil Optimization", action: "Apply foliar amino acid spray (panchagavya or seaweed extract @ 3 ml/L) 10 days before leaf harvesting.", reason: "Triggers glandular trichome density and increases menthol/thymol yield by 25%." },
        { pillar: "Weed Control & Organic Mulching", action: "Maintain dense planting canopy and mulch bare inter-row soil with shredded pine or sugarcane bagasse.", reason: "Keeps soil cool and prevents weed competition without chemical herbicides." }
      ],
      cropSuitability: {
        mostSuitable: [
          { name: "Spearmint & Peppermint", hindiName: "पुदीना", suitabilityScore: 97, category: "vegetables", requiredPh: "6.5 - 7.5", existingPh: "6.9 (Ideal)", requiredTexture: "Rich Loam", existingTexture: "Garden Loam", waterReq: "3.5 mm/day (~185 L)", duration: "60 - 75 Days (Perennial cuttings)", challenges: "Requires moist soil; stolons multiply vigorously." },
          { name: "Holy Basil (Tulsi)", hindiName: "तुलसी", suitabilityScore: 95, category: "vegetables", requiredPh: "6.5 - 7.5", existingPh: "6.9", requiredTexture: "Well-Drained Loam", existingTexture: "Garden Loam", waterReq: "2.8 mm/day (~150 L)", duration: "70 - 90 Days", challenges: "Scout for powdery mildew in humid monsoon." },
          { name: "Oregano & Thyme", hindiName: "अजवाइन पत्ता / थाइम", suitabilityScore: 92, category: "vegetables", requiredPh: "6.5 - 7.8", existingPh: "6.9", requiredTexture: "Gravelly / Light Loam", existingTexture: "Garden Loam", waterReq: "2.5 mm/day (~135 L)", duration: "80 - 100 Days", challenges: "Requires excellent sun exposure." }
        ],
        suitableCategories: {
          vegetables: ["Mint (97%)", "Tulsi (95%)", "Oregano (92%)", "Rosemary (89%)", "Coriander (93%)"],
          fruits: ["Strawberries (91%)"],
          pulses: ["Bush Beans (89%)"],
          cereals: ["Baby Corn (85%)"]
        },
        requiresImprovement: [],
        notRecommended: [
          { name: "Heavy Field Cereals", reason: "High-value garden beds reserved for intensive essential oil and culinary herbs." }
        ]
      }
    }
  }
};

// Bind to window and ONE_ACRE_FARM
if (typeof window !== "undefined") {
  window.SOIL_ANALYSIS_DATA = SOIL_ANALYSIS_DATA;
  if (window.ONE_ACRE_FARM) {
    window.ONE_ACRE_FARM.soilAnalysis = SOIL_ANALYSIS_DATA;
  }
}

