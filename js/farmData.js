/**
 * One Acre Intelligent Farm - Comprehensive Data Model
 * Tagline: "Smart Farm → Healthy Crops → Safe Land → Higher Income"
 * Paradigm: SENSE → ANALYZE → DECIDE → ACT → MONITOR → ALERT → OPTIMIZE
 */

const ONE_ACRE_FARM = {
  project: {
    name: "One Acre Intelligent Farm",
    tagline: "Smart Farm → Healthy Crops → Safe Land → Higher Income",
    version: "v2.4 Hackathon Edition",
    totalAcreage: 1.0, // 1 Acre (43,560 sq.ft)
    totalZones: 8,
    status: "Attention", // Healthy | Attention | Critical
    statusDescription: "1 Zone Critically Dry (Zone 04 Hydrating), 1 Animal Alert Deterred (Zone 06)",
    lastSync: "Just now (Live ESP32 Mesh)",
    farmer: {
      name: "AgriTech Lead / Innovator",
      role: "Farm Administrator",
      farmId: "OAF-IND-2026",
      location: "Agro Innovation Plot, Sector 8"
    }
  },

  overview: {
    totalZones: 8,
    healthyZones: 6,
    attentionZones: 1,
    criticalZones: 1,
    avgSoilMoisture: 48, // %
    avgTemperature: 27, // °C
    waterTankLevel: 68, // % (13,600 / 20,000 Liters)
    waterTankLiters: 13600,
    waterTankCapacity: 20000,
    pumpStatus: "ON", // ON | OFF
    pumpActiveZone: "Zone 04",
    pumpReason: "Zone 04 soil moisture (22%) is below critical crop threshold (35%). Drip cycle active.",
    todayWaterUsage: 320, // L
    weeklyWaterUsage: 2140, // L
    activeAlertsCount: 2
  },

  // 8 Individual Intelligent Zones (each ~0.125 acre)
  zones: [
    {
      id: "zone-1",
      number: "01",
      name: "Zone 01 • Bell Pepper Plot",
      crop: "Bell Peppers (Capsicum)",
      recommendedCrop: "Bell Peppers (Capsicum)",
      suitability: 96,
      status: "Healthy",
      statusClass: "healthy",
      soilMoisture: 52,
      targetMoisture: 50,
      irrigationStatus: "Standby",
      plantHealth: 94,
      soilTemp: 24.2,
      airTemp: 26.8,
      humidity: 65,
      soilPh: 6.4,
      ec: 1.2, // dS/m
      waterRequirement: "3.8 mm/day (~210 L)",
      growthStage: "Flowering & Early Fruit",
      das: 42, // Days after sowing
      expectedHarvest: "Nov 14, 2026",
      diseaseRisk: 6, // %
      waterStress: "Low",
      nutrientStress: "Low",
      estimatedYield: "1,850 kg",
      marketPrice: "₹45/kg",
      estimatedRevenue: "₹83,250",
      nextIrrigationTime: "Tomorrow, 06:30 AM",
      npk: { n: 72, p: 45, k: 190 },
      description: "Sandy loam with drip fertigation line. Excellent vegetative vigor."
    },
    {
      id: "zone-2",
      number: "02",
      name: "Zone 02 • Cherry Tomato Trellis",
      crop: "Cherry Tomatoes (Ruby Star)",
      recommendedCrop: "Cherry Tomatoes",
      suitability: 93,
      status: "Healthy",
      statusClass: "healthy",
      soilMoisture: 49,
      targetMoisture: 48,
      irrigationStatus: "Standby",
      plantHealth: 91,
      soilTemp: 24.8,
      airTemp: 27.1,
      humidity: 62,
      soilPh: 6.6,
      ec: 1.4,
      waterRequirement: "4.2 mm/day (~230 L)",
      growthStage: "Fruit Set & Maturation",
      das: 50,
      expectedHarvest: "Nov 02, 2026",
      diseaseRisk: 8,
      waterStress: "Low",
      nutrientStress: "Low",
      estimatedYield: "2,100 kg",
      marketPrice: "₹40/kg",
      estimatedRevenue: "₹84,000",
      nextIrrigationTime: "Tomorrow, 07:00 AM",
      npk: { n: 68, p: 42, k: 210 },
      description: "Raised beds with vertical bamboo staking. Optimal chlorophyll index."
    },
    {
      id: "zone-3",
      number: "03",
      name: "Zone 03 • Organic Spinach Bed",
      crop: "Baby Spinach & Chard",
      recommendedCrop: "Leafy Greens (Spinach)",
      suitability: 88,
      status: "Needs Attention",
      statusClass: "attention",
      soilMoisture: 33,
      targetMoisture: 45,
      irrigationStatus: "Queued (Next in Line)",
      plantHealth: 82,
      soilTemp: 25.4,
      airTemp: 28.0,
      humidity: 58,
      soilPh: 6.8,
      ec: 1.1,
      waterRequirement: "3.2 mm/day (~180 L)",
      growthStage: "Vegetative Foliar Expansion",
      das: 24,
      expectedHarvest: "Oct 18, 2026",
      diseaseRisk: 12,
      waterStress: "Moderate",
      nutrientStress: "Low",
      estimatedYield: "950 kg",
      marketPrice: "₹35/kg",
      estimatedRevenue: "₹33,250",
      nextIrrigationTime: "Today, 14:15 PM (Auto)",
      npk: { n: 85, p: 38, k: 160 },
      description: "Moisture approaching wilting boundary. Queued for micro-sprinkler cycle."
    },
    {
      id: "zone-4",
      number: "04",
      name: "Zone 04 • Sweet Corn Block",
      crop: "Sweet Corn (Pioneer Hybrid)",
      recommendedCrop: "Sweet Corn",
      suitability: 91,
      status: "Critical",
      statusClass: "critical",
      soilMoisture: 22,
      targetMoisture: 42,
      irrigationStatus: "IRRIGATING NOW",
      plantHealth: 74,
      soilTemp: 28.2,
      airTemp: 29.5,
      humidity: 46,
      soilPh: 6.1,
      ec: 0.9,
      waterRequirement: "5.4 mm/day (~295 L)",
      growthStage: "Tasseling & Silking",
      das: 58,
      expectedHarvest: "Nov 20, 2026",
      diseaseRisk: 15,
      waterStress: "High (Under Active Recovery)",
      nutrientStress: "Moderate (Nitrogen Leached)",
      estimatedYield: "1,550 kg",
      marketPrice: "₹28/kg",
      estimatedRevenue: "₹43,400",
      nextIrrigationTime: "RUNNING (12 min left)",
      npk: { n: 48, p: 32, k: 140 },
      description: "Rootzone moisture dropped to 22%. Automated pump triggered closed-loop soak."
    },
    {
      id: "zone-5",
      number: "05",
      name: "Zone 05 • Trellised Cucumber",
      crop: "Cucumber (F1 Crispy Green)",
      recommendedCrop: "Cucumbers",
      suitability: 95,
      status: "Healthy",
      statusClass: "healthy",
      soilMoisture: 54,
      targetMoisture: 52,
      irrigationStatus: "Standby",
      plantHealth: 92,
      soilTemp: 23.9,
      airTemp: 26.5,
      humidity: 67,
      soilPh: 6.5,
      ec: 1.3,
      waterRequirement: "4.6 mm/day (~250 L)",
      growthStage: "Active Harvest Flush",
      das: 45,
      expectedHarvest: "Continuous / Oct 12",
      diseaseRisk: 9,
      waterStress: "Low",
      nutrientStress: "Low",
      estimatedYield: "2,400 kg",
      marketPrice: "₹30/kg",
      estimatedRevenue: "₹72,000",
      nextIrrigationTime: "Tomorrow, 06:00 AM",
      npk: { n: 76, p: 48, k: 220 },
      description: "High organic compost content. Steady moisture retention and vigor."
    },
    {
      id: "zone-6",
      number: "06",
      name: "Zone 06 • French Green Beans",
      crop: "French Beans (Contender)",
      recommendedCrop: "Legumes / French Beans",
      suitability: 94,
      status: "Healthy",
      statusClass: "healthy",
      soilMoisture: 47,
      targetMoisture: 46,
      irrigationStatus: "Standby",
      plantHealth: 89,
      soilTemp: 24.6,
      airTemp: 27.2,
      humidity: 63,
      soilPh: 6.7,
      ec: 1.1,
      waterRequirement: "3.5 mm/day (~190 L)",
      growthStage: "Pod Filling Stage",
      das: 38,
      expectedHarvest: "Oct 28, 2026",
      diseaseRisk: 7,
      waterStress: "Low",
      nutrientStress: "Low",
      estimatedYield: "1,250 kg",
      marketPrice: "₹55/kg",
      estimatedRevenue: "₹68,750",
      nextIrrigationTime: "Tomorrow, 08:30 AM",
      npk: { n: 55, p: 44, k: 175 },
      description: "Border zone near south fence. Night deterrent strobe activated at 02:17 AM."
    },
    {
      id: "zone-7",
      number: "07",
      name: "Zone 07 • Nantes Sweet Carrots",
      crop: "Carrots (Nantes Scarlet)",
      recommendedCrop: "Root Vegetables (Carrots)",
      suitability: 92,
      status: "Healthy",
      statusClass: "healthy",
      soilMoisture: 44,
      targetMoisture: 45,
      irrigationStatus: "Standby",
      plantHealth: 93,
      soilTemp: 23.5,
      airTemp: 26.0,
      humidity: 66,
      soilPh: 6.3,
      ec: 1.0,
      waterRequirement: "3.1 mm/day (~170 L)",
      growthStage: "Root Bulking",
      das: 62,
      expectedHarvest: "Nov 10, 2026",
      diseaseRisk: 5,
      waterStress: "Low",
      nutrientStress: "Low",
      estimatedYield: "2,800 kg",
      marketPrice: "₹32/kg",
      estimatedRevenue: "₹89,600",
      nextIrrigationTime: "Tomorrow, 07:30 AM",
      npk: { n: 58, p: 52, k: 240 },
      description: "Deep tilled sandy loam. Potassium levels optimal for root expansion."
    },
    {
      id: "zone-8",
      number: "08",
      name: "Zone 08 • Protected Strawberries",
      crop: "Strawberries (Winter Dawn)",
      recommendedCrop: "High-Value Berries",
      suitability: 96,
      status: "Healthy",
      statusClass: "healthy",
      soilMoisture: 48,
      targetMoisture: 48,
      irrigationStatus: "Standby",
      plantHealth: 95,
      soilTemp: 23.1,
      airTemp: 25.8,
      humidity: 68,
      soilPh: 6.2,
      ec: 1.2,
      waterRequirement: "3.4 mm/day (~185 L)",
      growthStage: "Fruit Ripening & Flush",
      das: 70,
      expectedHarvest: "Continuous / Daily",
      diseaseRisk: 6,
      waterStress: "Low",
      nutrientStress: "Low",
      estimatedYield: "1,150 kg",
      marketPrice: "₹180/kg",
      estimatedRevenue: "₹2,07,000",
      nextIrrigationTime: "Tomorrow, 06:45 AM",
      npk: { n: 70, p: 46, k: 230 },
      description: "Black mulch drip line with micro-sensors. Highest value crop sector."
    }
  ],

  // Smart Irrigation Subsystem
  irrigation: {
    pumpStatus: "ON",
    pumpMode: "AUTO", // AUTO | MANUAL
    waterTankPercent: 68,
    waterTankLiters: 13600,
    currentZone: "Zone 04 (Sweet Corn)",
    currentMoisture: 22,
    targetMoisture: 42,
    waterSuppliedNow: 180, // L
    waterTargetNow: 250, // L
    durationMinutes: 28,
    totalScheduledMinutes: 40,
    todayConsumption: 320, // L
    weeklyConsumption: 2140, // L
    nextZone: "Zone 03 (Spinach)",
    nextEstimatedWater: 180, // L
    explanation: "Pump ON because Zone 04 soil moisture (22%) is below required threshold (35%). Closed-loop drip cycle active."
  },

  // AI Plant Health & Disease Screening
  plantHealth: {
    overallHealthPercent: 87,
    growthStatus: "Vigorous / Vegetative & Fruiting",
    waterStress: "Low (Localized in Zone 04)",
    nutrientStress: "Moderate (Zone 04 N-deficit)",
    diseaseRisk: 12,
    pestRisk: 8,
    aiObservation: "Leaf reflectance scans indicate mild chlorosis in Zone 04 maize due to moisture deficit. Zero fungal sporulation detected in strawberry Zone 08.",
    aiConfidence: 82,
    recommendedAction: "Complete Zone 04 deep soak, apply 1% chelated foliar spray after rehydration, continue organic neem deterrent on Zone 06.",
    disclaimer: "AI screening / decision support — not a guaranteed laboratory diagnosis."
  },

  // Pest & Disease Attack Database with Organic Solutions & Eradication Timelines
  pestDiseaseAttacks: [
    {
      id: "armyworm_corn",
      name: "Fall Armyworm (Spodoptera frugiperda)",
      hindiName: "फॉल आर्मीवर्म (सैनिक सुंडी)",
      crop: "Sweet Corn / Maize",
      zoneId: "zone-4",
      zoneName: "Zone 04 (Sweet Corn)",
      image: "assets/pest_armyworm_maize.jpg",
      confidence: 96.4,
      severity: "High (38% Foliar Damage)",
      severityLevel: "critical",
      pestType: "Chewing Caterpillar / Noctuid Larva (Lepidoptera)",
      pestTypeIcon: "🐛",
      pestTypeClassification: "Folivorous Chewing Insect",
      damagePattern: "Deep central whorl defoliation, window-paned leaves, damp brownish frass pellets",
      symptoms: "Saw-toothed ragged leaf edges with extensive chewing damage inside top vegetative whorls.",
      biologicalCause: "Noctuid moth migration & nocturnal egg laying triggered by warm humid conditions (27-31°C).",
      yieldRisk: "Up to 35-45% harvest reduction if larvae bore into the ear developing silk.",
      organicSolution: {
        title: "Cold-Pressed NSKE 5% + Bacillus thuringiensis (Bt) Bio-Spray",
        certification: "🌱 100% Certified Organic • 0-Day Pre-Harvest Interval (PHI) • Pollinator Safe",
        summary: "Targeted bio-insecticidal spray combining Neem Azadirachtin with microbial Bt endotoxin for rapid gut paralysis.",
        recipe: [
          { step: "Bio-Mix Preparation", detail: "Dissolve 50 ml cold-pressed Neem Seed Kernel Extract (NSKE 10,000 ppm) + 20g Bacillus thuringiensis var. kurstaki (Bt) powder in 10 Liters water." },
          { step: "Organic Spreader", detail: "Add 10 ml natural coconut-oil potassium soap as an organic surfactant to adhere to waxy corn cuticles." },
          { step: "Targeted Application", detail: "Direct nozzle straight down into central leaf whorls between 06:00 - 08:30 AM before larvae retreat from morning light." }
        ],
        culturalBiocontrol: "Install 10 'T'-shaped bamboo bird perches per acre for predatory Drongos and Mynas + deploy 5 Trichogramma parasitoid wasp cards.",
        modeOfAction: "Bt crystal endotoxin binds to alkaline insect midgut receptors within 6 hours, paralyzing chewing apparatus immediately. Neem interrupts larval molting hormone (ecdysone)."
      },
      eradication: {
        estimatedTime: "3 to 4 Days",
        quickKnockdown: "18 Hours (Feeding Ceases Completely)",
        timelineBadge: "⏱️ 3 - 4 Days for Total Eradication",
        stages: [
          {
            timeframe: "0 - 18 Hours",
            title: "Immediate Feeding Paralysis",
            desc: "Bt endotoxin halts all caterpillar chewing; foliar damage stops progressing immediately.",
            progress: 35,
            badgeClass: "badge-stage-1"
          },
          {
            timeframe: "24 - 48 Hours",
            title: "85% Larval Mortality & Desiccation",
            desc: "Caterpillars collapse from bacterial septicemia and drop from whorls. Azadirachtin repels fresh moth visits.",
            progress: 75,
            badgeClass: "badge-stage-2"
          },
          {
            timeframe: "72 - 96 Hours",
            title: "100% Clean Eradication & Shoot Regrowth",
            desc: "All instars eradicated. Central whorls uncurl cleanly; fresh green vegetative shoots emerge vigorously.",
            progress: 100,
            badgeClass: "badge-stage-3"
          }
        ]
      }
    },
    {
      id: "spider_mites_pepper",
      name: "Two-Spotted Red Spider Mites (Tetranychus urticae)",
      hindiName: "लाल मकड़ी / लाल माइट्स",
      crop: "Bell Peppers (Capsicum)",
      zoneId: "zone-1",
      zoneName: "Zone 01 (Bell Peppers)",
      image: "assets/pest_spider_mites.jpg",
      confidence: 94.8,
      severity: "Moderate (29% Leaf Area)",
      severityLevel: "warning",
      pestType: "Phytophagous Sap-Sucking Arachnid (Acari / Tetranychidae)",
      pestTypeIcon: "🕷️",
      pestTypeClassification: "Cell-Puncturing Sap Sucker",
      damagePattern: "Micro-chlorotic yellow stippling dots, fine dense silk webbing on abaxial leaf surfaces, bronzing",
      symptoms: "Under-leaf web mats, yellow speckling on top foliage, reduced leaf turgor and premature leaf drop.",
      biologicalCause: "Hot, dry microclimates (>30°C and RH < 50%) causing explosive mite reproductive cycles.",
      yieldRisk: "20-25% photosynthesis inhibition and fruit sunscald due to foliar canopy loss.",
      organicSolution: {
        title: "Cold-Pressed Neem Oil (10,000 ppm) + Potassium Bio-Soap Wash",
        certification: "🌱 100% Certified Organic • OMRI Listed • Zero Chemical Residue",
        summary: "Dual-action contact suffocation wash disrupting mite respiratory spiracles combined with wettable bio-sulfur.",
        recipe: [
          { step: "Acaricidal Mix", detail: "Emulsify 5 ml pure Neem Oil (10,000 ppm) with 3 ml organic potassium soap in 1 Liter lukewarm water until milky white." },
          { step: "Optional Bio-Booster", detail: "Add 2g wettable micronized bio-sulfur per liter (avoid if temp > 33°C to prevent scorch)." },
          { step: "High-Pressure Drench", detail: "Spray underside of all foliage using fine mist cone nozzle at 2.5 bar pressure late evening (05:00 - 06:30 PM)." }
        ],
        culturalBiocontrol: "Introduce predatory mites (Phytoseiulus persimilis @ 5 mites/m²) which devour 20 mite eggs daily + mist water to elevate canopy humidity.",
        modeOfAction: "Organic soap dissolves waxy protective cuticle causing rapid dehydration within 12h, while azadirachtin suffocates adult mites and halts egg eclosion."
      },
      eradication: {
        estimatedTime: "48 to 72 Hours",
        quickKnockdown: "12 Hours (Contact Asphyxiation)",
        timelineBadge: "⏱️ 48 - 72 Hours for Total Eradication",
        stages: [
          {
            timeframe: "0 - 12 Hours",
            title: "Contact Suffocation & Web Disruption",
            desc: "Soap-oil film dissolves protective webbing and blocks mite breathing spiracles; active adults become immobile.",
            progress: 40,
            badgeClass: "badge-stage-1"
          },
          {
            timeframe: "24 - 48 Hours",
            title: "90% Egg Hatch Arrest & Predator Cleanup",
            desc: "Bio-sulfur and azadirachtin prevent newly laid eggs from hatching. Beneficial predatory mites consume remaining eggs.",
            progress: 80,
            badgeClass: "badge-stage-2"
          },
          {
            timeframe: "48 - 72 Hours",
            title: "Colony Collapse & Foliar Rebound",
            desc: "All life stages eradicated. Abaxial leaf undersides clean. Plants resume normal transpiration and photosynthetic vigor.",
            progress: 100,
            badgeClass: "badge-stage-3"
          }
        ]
      }
    },
    {
      id: "aphids_whitefly_chilli",
      name: "Whiteflies & Leaf Curl Vector (Bemisia tabaci / Aphids)",
      hindiName: "सफेद मक्खी और माहू (एफिड्स)",
      crop: "Chilli / Green Pepper",
      zoneId: "zone-2",
      zoneName: "Zone 02 (Chilli)",
      image: "assets/pest_aphids_whitefly.jpg",
      confidence: 97.2,
      severity: "High (41% Canopy, Viral Vector Risk)",
      severityLevel: "critical",
      pestType: "Phloem-Feeding Piercing-Sucking Insect (Hemiptera / Aleyrodidae)",
      pestTypeIcon: "🪰",
      pestTypeClassification: "Phloem Sap-Sucking Vector",
      damagePattern: "Honeydew glistening on leaf tops, black sooty mold growth, upward curling and crinkling of leaves",
      symptoms: "Clouds of tiny white insects fly up when shaken; sticky honeydew deposits; stunted apical shoots.",
      biologicalCause: "Dense canopy with elevated nitrogen fertilization and warm daytime temperatures (28-34°C).",
      yieldRisk: "Up to 50% yield loss due to Chilli Leaf Curl Virus transmission and sooty mold photosynthetic blockage.",
      organicSolution: {
        title: "Agniastra (Garlic-Chilli-Asafoetida) + Beauveria bassiana Bio-Spray",
        certification: "🌱 100% Traditional Ayurvedic Agri-Biocontrol • Non-Toxic • Pollinator Safe",
        summary: "Pungent natural botanical repellent coupled with entomopathogenic white muscardine fungus for complete vector control.",
        recipe: [
          { step: "Botanical Extraction", detail: "Mix 20 ml fermented Agniastra extract (crushed garlic, green chillies, neem leaves, and hing in cow urine) per Liter of water." },
          { step: "Fungal Inoculant", detail: "Add Beauveria bassiana bio-pesticide powder (1×10⁸ CFU/g @ 5g/L) to infect soft-bodied nymphs." },
          { step: "Canopy Wash", detail: "Spray both upper and lower leaf surfaces thoroughly, especially apical shoots, during sunset hours." }
        ],
        culturalBiocontrol: "Install 15 yellow sticky traps per acre at crop canopy level to trap 70%+ of flying adults + plant African Marigold border trap crops.",
        modeOfAction: "Capsaicin and allicin vapor repels adult whiteflies within minutes, while Beauveria fungal spores germinate through nymph cuticles within 48h."
      },
      eradication: {
        estimatedTime: "3 to 5 Days",
        quickKnockdown: "24 Hours (Mass Trap Catch & Repellency)",
        timelineBadge: "⏱️ 3 - 5 Days for Total Eradication",
        stages: [
          {
            timeframe: "0 - 24 Hours",
            title: "Adult Repulsion & Sticky Trapping",
            desc: "Pungent volatiles drive adult flies onto yellow sticky traps; active sap feeding drops by 70%.",
            progress: 30,
            badgeClass: "badge-stage-1"
          },
          {
            timeframe: "24 - 72 Hours",
            title: "Beauveria White Muscardine Infection",
            desc: "Entomopathogenic fungal hyphae proliferate inside nymphs and aphids, leading to complete larval mortality.",
            progress: 75,
            badgeClass: "badge-stage-2"
          },
          {
            timeframe: "72 - 120 Hours",
            title: "Zero Vector Transmission & New Foliage",
            desc: "Nymph colonies eradicated. Honeydew washes away with morning dew; terminal shoots uncurl and grow virus-free.",
            progress: 100,
            badgeClass: "badge-stage-3"
          }
        ]
      }
    },
    {
      id: "early_blight_tomato",
      name: "Early Blight / Target Spot (Alternaria solani)",
      hindiName: "अगेती झुलसा (अर्ली ब्लाइट)",
      crop: "Tomatoes / Solanaceae",
      zoneId: "zone-5",
      zoneName: "Zone 05 (Tomatoes)",
      image: "assets/sample_early_blight.jpg",
      confidence: 96.8,
      severity: "Moderate (34% Foliar Surface)",
      severityLevel: "warning",
      pestType: "Airborne Necrotrophic Fungal Pathogen (Pleosporales)",
      pestTypeIcon: "🍄",
      pestTypeClassification: "Foliar Fungal Necrotroph",
      damagePattern: "Concentric 'target-board' dark brown lesions with surrounding chlorotic yellow halo margins",
      symptoms: "Circular necrotic spots on lower mature foliage spreading upward; stem lesions near soil line.",
      biologicalCause: "Alternaria solani conidia germination during warm days (25-29°C) and alternating humid night dew cycles.",
      yieldRisk: "Up to 30-40% yield drop due to premature defoliation and direct sunscald on ripening tomatoes.",
      organicSolution: {
        title: "Trichoderma harzianum Bio-Fungicide + Sour Whey / Cow Buttermilk Spray",
        certification: "🌱 100% Bio-Organic Certified • Zero Copper Residue • Soil Microbe Friendly",
        summary: "Competitive bio-antagonistic beneficial fungi paired with lactic acid bacteria to suppress Alternaria spore proliferation.",
        recipe: [
          { step: "Bio-Fungicide Suspension", detail: "Blend 5g Trichoderma harzianum (2×10⁶ CFU/g) + 3g Potassium Bicarbonate (food-grade baking soda) per Liter of water." },
          { step: "Lactic Acid Enhancer", detail: "Add 100 ml sour fermented cow buttermilk/whey per Liter (natural lactic acid alters leaf pH preventing spore germination)." },
          { step: "Canopy Pruning", detail: "Sanitize shears in 70% alcohol and prune all lower infected leaves within 10 inches of soil before foliar drench." }
        ],
        culturalBiocontrol: "Apply 2-inch organic straw mulch around plant base to prevent rain-splash spore rebound + adjust drip to avoid foliar wetness.",
        modeOfAction: "Potassium bicarbonate instantly alters leaf surface pH, rupturing fungal hyphae walls within 8 hours. Trichoderma hyper-parasitizes surviving pathogen spores."
      },
      eradication: {
        estimatedTime: "4 to 6 Days",
        quickKnockdown: "12 Hours (Spore Germination Arrested)",
        timelineBadge: "⏱️ 4 - 6 Days for Total Eradication",
        stages: [
          {
            timeframe: "0 - 12 Hours",
            title: "Spore Rupture & pH Alkaline Shift",
            desc: "Bicarbonate & lactic wash cauterizes active spore-producing margins; lesion expansion stops completely.",
            progress: 30,
            badgeClass: "badge-stage-1"
          },
          {
            timeframe: "24 - 72 Hours",
            title: "Trichoderma Biological Colonization",
            desc: "Beneficial Trichoderma mycelium outcompetes Alternaria, forming a living protective microbial armor over leaf cuticles.",
            progress: 70,
            badgeClass: "badge-stage-2"
          },
          {
            timeframe: "96 - 144 Hours",
            title: "Lesions Cauterized & Fruit Cluster Safety",
            desc: "Infection halted permanently. Diseased spots dry to paper-thin harmless tissue; upper canopy and fruit clusters remain 100% clean.",
            progress: 100,
            badgeClass: "badge-stage-3"
          }
        ]
      }
    },
    {
      id: "black_aphids_eggplant",
      name: "Black Aphids & Sooty Mold (Aphis gossypii)",
      hindiName: "काला माहू / मोयला (काली फफूंद)",
      crop: "Eggplant (Brinjal) / Solanum",
      zoneId: "zone-7",
      zoneName: "Zone 07 (Eggplant)",
      image: "assets/pest_aphids_whitefly.jpg",
      confidence: 95.1,
      severity: "Moderate (26% Shoot Tips)",
      severityLevel: "warning",
      pestType: "Colonial Soft-Bodied Sap-Sucking Hemipteran",
      pestTypeIcon: "🪲",
      pestTypeClassification: "Soft-Bodied Sap Sucker",
      damagePattern: "Dense black/green aphid clusters on tender terminal shoots, stunted leaf curling, sticky honeydew film",
      symptoms: "Terminal buds curled tightly inward; swarms of ants farming aphids; sooty mold coating lower leaves.",
      biologicalCause: "Cool overcast mornings with high relative humidity and rapid tender vegetative flush.",
      yieldRisk: "15-20% loss from flower drop and malformed undersized eggplants.",
      organicSolution: {
        title: "Cold Wood-Ash Dusting + Karanja & Neem Bio-Soap Emulsion",
        certification: "🌱 100% Traditional Organic • Zero Chemical Residue • Immediate Knockdown",
        summary: "Rapid osmotic desiccating wash that dissolves aphid waxy bodies coupled with wood ash ant barrier.",
        recipe: [
          { step: "Soap Emulsion", detail: "Mix 4 ml pure Karanja (Pongamia) oil + 2 ml pure Neem oil with 3 ml natural liquid castile soap per Liter of water." },
          { step: "Terminal Shoot Spray", detail: "Spray directly onto terminal clustered shoots and leaf undersides with fine mist in early morning." },
          { step: "Base Wood-Ash Ring", detail: "Dust finely sieved hardwood ash around plant stems to prevent mutualistic ants from protecting aphid colonies." }
        ],
        culturalBiocontrol: "Release native 7-spotted Ladybird Beetles (Coccinella septempunctata @ 500/acre) or Green Lacewing larvae which each devour 60 aphids/day.",
        modeOfAction: "Bio-soap breaks the lipid bilayer of soft-bodied aphids within 2 hours, causing fatal osmotic dehydration. Wood ash physically lacerates ant cuticles."
      },
      eradication: {
        estimatedTime: "24 to 48 Hours",
        quickKnockdown: "6 Hours (Fastest Rapid Desiccation)",
        timelineBadge: "⏱️ 24 - 48 Hours for Total Eradication",
        stages: [
          {
            timeframe: "0 - 6 Hours",
            title: "Cuticle Dissolution & Desiccation",
            desc: "Bio-soap penetrates aphid cuticle; 80% mortality achieved within 6 hours of application.",
            progress: 45,
            badgeClass: "badge-stage-1"
          },
          {
            timeframe: "12 - 24 Hours",
            title: "Ant Barrier & 98% Colony Drop",
            desc: "Wood ash severs ant-aphid symbiosis. Surviving aphids fall to ground; ladybugs devour stragglers.",
            progress: 85,
            badgeClass: "badge-stage-2"
          },
          {
            timeframe: "24 - 48 Hours",
            title: "Total Eradication & Shoot Uncurling",
            desc: "All shoots completely cleared of pests. Sticky honeydew degrades; terminal leaves uncurl and resume vigorous vegetative growth.",
            progress: 100,
            badgeClass: "badge-stage-3"
          }
        ]
      }
    }
  ],

  // Night Security & Animal Deterrence
  security: {
    cameras: [
      { id: "CAM-01", name: "North Boundary", status: "Active (1080p IR)", healthy: true },
      { id: "CAM-02", name: "East Trellis Gate", status: "Active (1080p IR)", healthy: true },
      { id: "CAM-03", name: "South Perimeter (Zone 06)", status: "ALERT TRIGGERED", healthy: false },
      { id: "CAM-04", name: "Farmhouse Storage", status: "Active (1080p IR)", healthy: true }
    ],
    irNightVision: "ON (Dusk-to-Dawn Automation)",
    thermalCamera: "ACTIVE (Calibrated 8-14 µm)",
    activeAlerts: 1,
    detectedCounts: {
      human: 0,
      rodent: 1,
      wildBoar: 1,
      dog: 0,
      livestock: 0,
      unknown: 0
    },
    incidents: [
      {
        id: "SEC-104",
        detectedObject: "Possible Wild Boar",
        zone: "Zone 06 (South Perimeter)",
        camera: "CAM-03",
        time: "02:17 AM (Logged Today)",
        confidence: 91,
        thermalSignature: "Confirmed (38.5°C body heat vs 18°C soil)",
        deterrenceStatus: "Activated (Ultrasonic 24kHz + Strobe Pulse)",
        farmerAlertStatus: "SMS & In-App Notification Delivered",
        image: "assets/thermal_security_cam.jpg",
        notes: "Deterrence pulse initiated immediately. Animal retreated toward peripheral scrubland."
      },
      {
        id: "SEC-103",
        detectedObject: "Possible Rodent",
        zone: "Zone 08 (Compost Edge)",
        camera: "CAM-02",
        time: "Yesterday, 23:40 PM",
        confidence: 78,
        thermalSignature: "Low Heat Signature",
        deterrenceStatus: "Auditory Chime Triggered",
        farmerAlertStatus: "Logged in History",
        image: "assets/thermal_security_cam.jpg",
        notes: "Small signature, no crop damage detected."
      }
    ]
  },

  // Weather & Micro-climate Environment
  weather: {
    temperature: 27.4,
    humidity: 62,
    rainfallPast24h: 0.0,
    windSpeed: 9.2,
    windDirection: "NW",
    lightIntensity: "78,500 Lux (PAR 1,450 µmol/m²/s)",
    rainProbability: 15,
    weatherCondition: "Clear & Sunny with Afternoon Convection",
    forecastRainThursday: 75,
    intelligentMessage: "Rain expected on Thursday (75% probability, ~18mm forecast) — Thursday irrigation cycle postponed to conserve 450 L water and prevent fertilizer leaching."
  },

  // Farm Economics (1-Acre Precision Farm)
  economics: {
    cultivationCosts: [
      { item: "Seeds & Premium Seedlings", cost: 14200 },
      { item: "Organic Fertilizer & Bio-nutrients", cost: 18500 },
      { item: "Water & Irrigation Management", cost: 4800 },
      { item: "Electricity & Solar Battery Ops", cost: 3200 },
      { item: "Labour (Pruning & Trellising)", cost: 16000 },
      { item: "Pest & Bio-Control Formulations", cost: 6500 },
      { item: "Misc Field Operations & Tools", cost: 3800 }
    ],
    totalCultivationCost: 67000, // ₹67,000 (~$805)
    totalEstimatedYieldKg: 14450, // 14.45 Tons from 1 Acre
    estimatedRevenue: 681250, // ₹6,81,250 (~$8,180) across high value crops
    estimatedNetReturn: 614250, // ₹6,14,250 (~$7,375)
    roiPercent: 916 // High-value micro-crop multi-cropping
  },

  // Alert Center Notifications Feed
  alerts: [
    {
      id: "ALT-1",
      severity: "critical",
      severityLabel: "Critical",
      zone: "Zone 04",
      time: "14m ago",
      title: "Zone 04 requires irrigation",
      description: "Soil moisture dropped to 22% (wilting boundary 35%).",
      action: "Closed-loop pump triggered. Drip valve 04 currently active for 40 minutes.",
      resolved: false
    },
    {
      id: "ALT-2",
      severity: "critical",
      severityLabel: "Critical",
      zone: "Zone 06",
      time: "02:17 AM",
      title: "Possible animal detected in Zone 06",
      description: "CAM-03 thermal camera detected possible wild boar (91% confidence).",
      action: "Ultrasonic deterrence and strobe triggered. Perimeter inspected.",
      resolved: true
    },
    {
      id: "ALT-3",
      severity: "warning",
      severityLabel: "Attention",
      zone: "Zone 03",
      time: "48m ago",
      title: "Zone 03 soil moisture low",
      description: "Moisture reached 33% in baby spinach beds.",
      action: "Auto-queued for irrigation immediately after Zone 04 finishes.",
      resolved: false
    },
    {
      id: "ALT-4",
      severity: "warning",
      severityLabel: "Attention",
      zone: "Zone 04",
      time: "1h ago",
      title: "Possible plant stress detected",
      description: "Vegetative leaf curl observed via multispectral canopy sensor.",
      action: "Water stress identified as primary root cause. Fertigation scheduled.",
      resolved: false
    },
    {
      id: "ALT-5",
      severity: "success",
      severityLabel: "Success",
      zone: "Zone 01",
      time: "2h ago",
      title: "Irrigation completed successfully",
      description: "Bell pepper bed received 210 L water. Rootzone moisture stabilized at 52%.",
      action: "Solenoid valve 01 closed cleanly. Flow meter confirmed nominal.",
      resolved: true
    },
    {
      id: "ALT-6",
      severity: "success",
      severityLabel: "Success",
      zone: "System",
      time: "3h ago",
      title: "Water tank level sufficient",
      description: "Solar rainwater harvesting reservoir at 68% capacity (13,600 L).",
      action: "Adequate storage for next 14 operational days.",
      resolved: true
    }
  ],

  // Historical Analytics Series (Today, 7 Days, 30 Days)
  analytics: {
    today: {
      labels: ["02:00", "05:00", "08:00", "11:00", "14:00", "17:00", "20:00", "23:00"],
      soilMoisture: [51, 50, 48, 46, 44, 46, 48, 48],
      waterUsage: [0, 40, 90, 70, 60, 40, 20, 0],
      temperature: [21, 20, 24, 28, 30, 28, 25, 22],
      humidity: [78, 82, 70, 56, 52, 60, 72, 76]
    },
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      soilMoisture: [52, 50, 49, 47, 46, 48, 48],
      waterUsage: [280, 310, 340, 290, 320, 300, 300],
      temperature: [25, 26, 28, 27, 26, 27, 27],
      humidity: [68, 64, 60, 65, 69, 63, 62]
    },
    month: {
      labels: ["Wk 1", "Wk 2", "Wk 3", "Wk 4"],
      soilMoisture: [53, 50, 47, 48],
      waterUsage: [1950, 2100, 2250, 2140],
      temperature: [24, 26, 27, 27],
      humidity: [70, 66, 62, 62]
    },
    zoneWaterUsage: [210, 230, 180, 295, 250, 190, 170, 185], // Liters per zone
    zoneYields: [1850, 2100, 950, 1550, 2400, 1250, 2800, 1150] // kg per zone
  },

  // 11. Post-Harvest Direct-to-Consumer (D2C) & Zero-Middlemen Marketplace
  postHarvestMarket: {
    heroImage: "assets/direct_farm_packaging.jpg",
    totalMandiValue: 485000, // ₹4.85 Lakh (Traditional Middleman Price)
    totalDirectValue: 1042500, // ₹10.42 Lakh (Direct D2C Farmgate Price)
    extraProfitAmount: 557500, // +₹5,57,500 Extra Farmer Profit (115% Increase)
    economicsComparison: {
      extraProfitDirect: 557500,
      totalMandiGross: 485000,
      totalDirectGross: 1042500
    },
    crops: [
      {
        id: "crop_corn",
        name: "Sweet Corn (Golden Bantam)",
        hindiName: "मीठी मक्का (स्वीट कॉर्न)",
        zone: "Zone 04",
        yieldKg: 1550,
        mandiPrice: 18, // ₹/kg via middleman
        directPrice: 45, // ₹/kg direct to buyer
        profitGainPercent: 150,
        packagingType: "Ventilated 5-Cob Kraft Box with Biodegradable Husk Wrap",
        shelfLife: "6 - 8 Days in Ambient Shade",
        qrBatchCode: "QR-OAF-CORN-Z04-2026",
        buyerDemand: "High (Housing Societies & Farmgate Pickups)",
        status: "Harvesting & Packing Ready"
      },
      {
        id: "crop_peppers",
        name: "Bell Peppers (Capsicum)",
        hindiName: "शिमला मिर्च (रंग-बिरंगी)",
        zone: "Zone 01",
        yieldKg: 1850,
        mandiPrice: 32,
        directPrice: 85,
        profitGainPercent: 165,
        packagingType: "Cushioned 1kg Eco-Fiber Tray with Micro-perforated Seal",
        shelfLife: "10 - 14 Days",
        qrBatchCode: "QR-OAF-PEPP-Z01-2026",
        buyerDemand: "Very High (Organic Stores & Gourmet Cafes)",
        status: "Packing Ready"
      },
      {
        id: "crop_tomatoes",
        name: "Plum & Vine Tomatoes",
        hindiName: "देसी व संकर टमाटर",
        zone: "Zone 05",
        yieldKg: 2400,
        mandiPrice: 14,
        directPrice: 40,
        profitGainPercent: 185,
        packagingType: "Recycled Corrugated 2kg Clamshell Box",
        shelfLife: "7 - 10 Days",
        qrBatchCode: "QR-OAF-TOMA-Z05-2026",
        buyerDemand: "Consistent (Weekly Residential Subscriptions)",
        status: "Peak Harvest Active"
      },
      {
        id: "crop_chillies",
        name: "Green Hot Chillies (G4)",
        hindiName: "हरी मिर्च (तीखी देशी)",
        zone: "Zone 02",
        yieldKg: 2100,
        mandiPrice: 40,
        directPrice: 110,
        profitGainPercent: 175,
        packagingType: "Moisture-Wicking 250g Biodegradable Cornstarch Pouches",
        shelfLife: "14 - 18 Days",
        qrBatchCode: "QR-OAF-CHIL-Z02-2026",
        buyerDemand: "High (Wholesale Direct Co-ops & Grocery Apps)",
        status: "Packing Ready"
      },
      {
        id: "crop_eggplant",
        name: "Eggplant / Brinjal (Round Purple)",
        hindiName: "गोल बैंगन (देशी ऑर्गेनिक)",
        zone: "Zone 07",
        yieldKg: 2800,
        mandiPrice: 16,
        directPrice: 48,
        profitGainPercent: 200,
        packagingType: "Breathable 2kg Jute Net Bag with Farm Tag",
        shelfLife: "8 - 10 Days",
        qrBatchCode: "QR-OAF-BRIN-Z07-2026",
        buyerDemand: "Moderate (Local Apartment Associations)",
        status: "Fruiting / Packing"
      },
      {
        id: "crop_strawberries",
        name: "Strawberries (Sweet Charlie)",
        hindiName: "स्ट्रॉबेरी (ताजा मीठी)",
        zone: "Zone 08",
        yieldKg: 1150,
        mandiPrice: 120,
        directPrice: 280,
        profitGainPercent: 133,
        packagingType: "Ventilated 250g Kraft Paper Punnets with Cellulose Lid",
        shelfLife: "4 - 5 Days Cold Chain",
        qrBatchCode: "QR-OAF-STRAW-Z08-2026",
        buyerDemand: "Extreme (Direct D2C Pre-Orders Sold Out)",
        status: "Direct Dispatch Active"
      }
    ],
    activeOrders: [
      {
        id: "ORD-881",
        buyer: "Green Meadows Resident Welfare Society (Tower A-D)",
        type: "Direct Community Buying",
        items: "45 boxes Sweet Corn + 60 kg Tomatoes",
        totalAmount: 11250,
        paymentStatus: "Escrow Secured (Pre-Paid)",
        status: "Ready to Dispatch",
        deliveryMode: "Direct Farmgate E-Van Delivery",
        expectedDelivery: "Today, 04:30 PM"
      },
      {
        id: "ORD-882",
        buyer: "Nisarga Pure Organic Supermarket (2 Outlets)",
        type: "Retail Partner (Zero Middleman)",
        items: "80 kg Bell Peppers + 40 kg Chillies",
        totalAmount: 15600,
        paymentStatus: "Instant UPI on Delivery",
        status: "Packing in Progress",
        deliveryMode: "Store Pickup / Scheduled",
        expectedDelivery: "Tomorrow, 07:00 AM"
      },
      {
        id: "ORD-883",
        buyer: "Farm-Fresh Weekly Subscription Club (32 Families)",
        type: "Consumer Subscription",
        items: "32 Custom 5kg Multi-Crop Veggie Baskets",
        totalAmount: 18750,
        paymentStatus: "Monthly Pre-Paid Subscription",
        status: "Confirmed & Scheduled",
        deliveryMode: "Home Doorstep Drops",
        expectedDelivery: "Saturday Morning"
      }
    ],
    packagingStandards: [
      {
        step: 1,
        title: "In-Field Grading & Sorting",
        desc: "Grade A (Prime Retail 85%): Zero skin blemishes, optimal size for highest direct retail price. Grade B (15%): Routed to local sauces/drying or circular bio-conversion."
      },
      {
        step: 2,
        title: "100% Zero-Plastic Eco Packaging",
        desc: "Pack using breathable corrugated kraft paper boxes, corn-starch bags, and jute ties. Keeps moisture balanced and attracts premium conscious urban buyers."
      },
      {
        step: 3,
        title: "Digital QR Traceability Seal",
        desc: "Every box receives a scannable QR label showing harvest time, farm plot, zero chemical bio-spray log, and farmer signature. Builds unshakeable buyer trust."
      },
      {
        step: 4,
        title: "Direct Doorstep / Society Dispatch",
        desc: "Dispatch within 4 hours of harvest during cool morning hours. Guarantees 100% farm-gate freshness with zero commission cut to market middlemen."
      }
    ]
  },

  // 12. Zero-Waste Circular Economy (Waste-to-Wealth Upcycling Studio)
  wasteToWealth: {
    heroImage: "assets/farm_waste_upcycling.jpg",
    totalBiomassKg: 2500, // 2.5 Tons of harvest residue
    totalWealthPotential: 58400, // ₹58,400 generated from waste
    co2ePreventedKg: 3800, // 3.8 Tons CO2 emissions stopped (zero stubble burning)
    soilOrganicCarbonBoost: "+0.45% Organic Carbon across 1 Acre",
    biomassInventory: [
      { type: "Sweet Corn Stover & Dried Husk Leaves", qtyKg: 850, category: "High-Cellulose Dry Biomass", idealFor: "Oyster Mushrooms & Biochar" },
      { type: "Tomato & Bell Pepper Pruned Foliage", qtyKg: 620, category: "Nitrogen-Rich Green Leaves", idealFor: "Aerobic Vermicompost (Black Gold)" },
      { type: "Chilli Stems & Woody Pruning Twigs", qtyKg: 380, category: "Dense Lignin Biomass", idealFor: "Low-Oxygen Pyrolysis Biochar" },
      { type: "Culled Produce & Non-Grade Fruit Scraps", qtyKg: 240, category: "Sugar & Enzyme Rich Mash", idealFor: "Fermented Jeevamrutha Tonic" },
      { type: "Field Weeding & Root Trimmings", qtyKg: 410, category: "Mixed Botanical Biomass", idealFor: "Layered Weed Mulch & Compost Base" }
    ],
    upcyclingPathways: [
      {
        id: "path_vermicompost",
        title: "Aerobic Vermicomposting ('Black Gold')",
        hindiTitle: "केंचुआ खाद / वर्मीकम्पोस्ट (काला सोना)",
        icon: "🪱",
        wasteInput: "Tender green leaves, sweet corn husks, vegetable trimmings (1,000 kg)",
        process: "Chop residue into 2-inch pieces, pre-compost with cow dung slurry for 10 days, introduce Eisenia fetida red worms in shaded beds.",
        outputYield: "1,200 kg Supreme Vermicompost Humus",
        cycleTime: "45 - 60 Days",
        economicValue: "₹18,500 Saved in Farm Fertilizers OR ₹21,600 Direct Sale (@ ₹18/kg packaged)",
        soilBenefit: "Increases microbial count by 400% and cation exchange capacity (CEC)."
      },
      {
        id: "path_biochar",
        title: "Biomass Biochar & Soil Carbon Sink",
        hindiTitle: "बायोचार / जैविक कोयला (स्थाई उर्वरता)",
        icon: "🔥",
        wasteInput: "Dry corn stalks, woody chilli stems, dried branches (500 kg)",
        process: "Load into low-oxygen conical metal pit/kiln, ignite from top, smother with water when flame turns transparent blue (pyrolysis).",
        outputYield: "180 kg Porous High-Surface Biochar",
        cycleTime: "4 - 6 Hours Pyrolysis + 48h Inoculation",
        economicValue: "Permanently saves 35% irrigation water + locks carbon for 100+ years",
        soilBenefit: "Creates micro-habitats for beneficial mycorrhizae and prevents nutrient leaching."
      },
      {
        id: "path_mushrooms",
        title: "Gourmet Oyster Mushroom Cultivation",
        hindiTitle: "ढींगरी मशरूम उत्पादन (कचरे से कमाई)",
        icon: "🍄",
        wasteInput: "Chopped sweet corn stalks & clean dry husk fibers (300 kg)",
        process: "Pasteurize chopped straw in 65°C hot water for 2 hours, pack in cylindrical poly-bags with Pleurotus ostreatus mushroom spawn in humid dark room.",
        outputYield: "120 kg Fresh Gourmet Oyster Mushrooms",
        cycleTime: "22 - 28 Days to Harvest",
        economicValue: "₹24,000 Direct Cash Revenue (Sold @ ₹200/kg to local buyers)",
        soilBenefit: "Spent mushroom substrate (SMS) acts as enriched bio-fertilizer for the next crop cycle!"
      },
      {
        id: "path_jeevamrutha",
        title: "Liquid Bio-Enzyme & Jeevamrutha Tonic",
        hindiTitle: "तरल जीवामृत व फल रस खाद",
        icon: "🧪",
        wasteInput: "Culled overripe tomatoes, soft vegetables, fruit scraps (150 kg)",
        process: "Mash culled fruits in a 200-liter drum with 10 kg cow dung, 10L cow urine, 2 kg jaggery, and 2 kg pulse flour. Stir clockwise twice daily for 7 days.",
        outputYield: "500 Liters Potent Liquid Bio-Stimulant",
        cycleTime: "7 Days Fermentation",
        economicValue: "Saves ₹12,000 in commercial micronutrient foliar tonics",
        soilBenefit: "Billion-fold multiplication of indigenous nitrogen-fixing & phosphorus-solubilizing bacteria."
      },
      {
        id: "path_mulch_mats",
        title: "Biodegradable Mulch Mats & Fiber Sheets",
        hindiTitle: "मल्चिंग मैट व जैविक आवरण",
        icon: "🌾",
        wasteInput: "Coarse corn husk fibers & tough plant stems (450 kg)",
        process: "Shred dry fibers, compress with natural starch binder into breathable 1-meter wide sheets to line crop irrigation furrows.",
        outputYield: "180 Linear Meters of Organic Mulch",
        cycleTime: "Same Day Processing",
        economicValue: "Replaces ₹4,500 worth of single-use plastic mulch film",
        soilBenefit: "Suppresses weeds naturally, cools soil temperature by 4°C, and completely biodegrades into humus."
      }
    ]
  }
};

window.ONE_ACRE_FARM = ONE_ACRE_FARM;
