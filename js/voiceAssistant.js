/**
 * One Acre Intelligent Farm - Voice Assistant ("Kisan Mitra / Kisan Vani")
 * Features:
 * - Two-way voice communication in 10 native Indian languages
 * - Web Speech API Recognition & Natural Speech Synthesis
 * - Agricultural Intent Parser (Water, Crops, Pump, Wildlife, Weather, Profit)
 * - Section-level "Read Aloud / Suno" audio narration for farmers
 * - Tone synthesizer for audio feedback
 * - Interactive Voice Assistant Modal & Floating Action Button
 */

const VoiceAssistant = {
  recognition: null,
  isListening: false,
  isSpeaking: false,
  synth: window.speechSynthesis || null,
  currentUtterance: null,
  audioCtx: null,

  init() {
    this.initSpeechRecognition();
    this.bindEvents();
    this.renderLanguageSelectors();
  },

  // 1. Initialize Web Speech Recognition
  initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition API not supported in this browser. Fallback input will be used.");
      return;
    }

    try {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = false;
      this.recognition.maxAlternatives = 1;

      this.recognition.onstart = () => {
        this.isListening = true;
        this.playBeep(600, 0.08); // Friendly feedback beep
        this.updateMicUI("listening");
      };

      this.recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        this.handleTranscript(transcript);
      };

      this.recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        this.isListening = false;
        this.updateMicUI("idle");
        if (event.error === "not-allowed") {
          this.showAssistantMessage(this.getLocalizedText("micDeniedNotice"));
        } else if (event.error !== "no-speech") {
          this.showAssistantMessage(this.getLocalizedText("micRetryNotice"));
        }
      };

      this.recognition.onend = () => {
        this.isListening = false;
        if (!this.isSpeaking) {
          this.updateMicUI("idle");
        }
      };
    } catch (e) {
      console.warn("Error initializing speech recognition:", e);
    }
  },

  // Set the speech recognition language based on active selection
  updateRecognitionLang() {
    if (!this.recognition) return;
    const langKey = TRANSLATIONS.currentLang;
    const langInfo = TRANSLATIONS.languages[langKey] || TRANSLATIONS.languages.hi;
    this.recognition.lang = langInfo.code;
  },

  // 2. Play gentle audio tones for feedback using Web Audio API
  playBeep(freq = 520, duration = 0.1) {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
      if (this.audioCtx && this.audioCtx.state === "suspended") {
        this.audioCtx.resume();
      }
      if (this.audioCtx) {
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(0.08, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      }
    } catch (e) {
      // Audio context might fail silently if interaction restrictions exist
    }
  },

  // 3. UI Event Bindings
  bindEvents() {
    // Open Voice Modal via FAB or Header Buttons
    const fabBtn = document.getElementById("kisan-voice-fab");
    const headerVoiceBtn = document.getElementById("btn-header-voice");
    const sidebarVoiceBtn = document.getElementById("btn-sidebar-voice");

    if (fabBtn) fabBtn.addEventListener("click", () => this.openVoiceModal());
    if (headerVoiceBtn) headerVoiceBtn.addEventListener("click", () => this.openVoiceModal());
    if (sidebarVoiceBtn) sidebarVoiceBtn.addEventListener("click", () => this.openVoiceModal());

    // Close Voice Modal
    const closeBtn = document.getElementById("close-voice-modal");
    const modal = document.getElementById("kisan-voice-modal");
    if (closeBtn) closeBtn.addEventListener("click", () => this.closeVoiceModal());
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) this.closeVoiceModal();
      });
    }

    // Main Mic Toggle Button in Assistant Modal
    const micBtn = document.getElementById("voice-assistant-mic-btn");
    if (micBtn) {
      micBtn.addEventListener("click", () => this.toggleListening());
    }

    // Fallback Text Input Form
    const queryInput = document.getElementById("voice-text-input");
    const sendBtn = document.getElementById("voice-send-btn");
    if (sendBtn && queryInput) {
      sendBtn.addEventListener("click", () => {
        const txt = queryInput.value.trim();
        if (txt) {
          this.handleTranscript(txt);
          queryInput.value = "";
        }
      });
      queryInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
          const txt = queryInput.value.trim();
          if (txt) {
            this.handleTranscript(txt);
            queryInput.value = "";
          }
        }
      });
    }

    // Quick Voice Action Chips
    const chips = document.querySelectorAll(".voice-quick-chip");
    chips.forEach(chip => {
      chip.addEventListener("click", () => {
        const queryType = chip.getAttribute("data-query");
        this.handleQuickQuery(queryType);
      });
    });

    // Replay and Stop buttons in Assistant
    const replayBtn = document.getElementById("btn-voice-replay");
    const stopBtn = document.getElementById("btn-voice-stop");
    if (replayBtn) replayBtn.addEventListener("click", () => this.replayLastAnswer());
    if (stopBtn) stopBtn.addEventListener("click", () => this.stopSpeaking());
  },

  // 4. Render Language Dropdown in Top Nav, Sidebar & Modal
  renderLanguageSelectors() {
    const currentLang = TRANSLATIONS.initLanguage();
    const selectors = [
      document.getElementById("top-language-select"),
      document.getElementById("modal-language-select")
    ];

    selectors.forEach(selectEl => {
      if (!selectEl) return;
      selectEl.innerHTML = Object.entries(TRANSLATIONS.languages).map(([key, lang]) => `
        <option value="${key}" ${key === currentLang ? "selected" : ""}>
          ${lang.flag} ${lang.nativeName} (${lang.name})
        </option>
      `).join("");

      selectEl.addEventListener("change", (e) => {
        this.switchLanguage(e.target.value);
      });
    });

    // Apply current language on initial load
    this.applyLanguage(currentLang, false);
  },

  switchLanguage(langKey) {
    if (!TRANSLATIONS.languages[langKey]) return;
    TRANSLATIONS.setLanguage(langKey);
    this.updateRecognitionLang();

    // Sync all dropdowns
    const selectors = [
      document.getElementById("top-language-select"),
      document.getElementById("modal-language-select")
    ];
    selectors.forEach(s => {
      if (s) s.value = langKey;
    });

    this.applyLanguage(langKey, true);
  },

  applyLanguage(langKey, announce = false) {
    // 1. Update static DOM elements with data-i18n
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      const translation = TRANSLATIONS.t(key, langKey);
      if (translation) {
        if (el.tagName === "INPUT" && el.hasAttribute("placeholder")) {
          el.placeholder = translation;
        } else {
          el.textContent = translation;
        }
      }
    });

    // 2. Refresh dynamic components if App is initialized
    if (window.App) {
      if (typeof window.App.renderOverviewCards === "function") window.App.renderOverviewCards();
      if (typeof window.App.render8ZoneFarmMap === "function") window.App.render8ZoneFarmMap();
      if (typeof window.App.renderCropIntelligenceTable === "function") window.App.renderCropIntelligenceTable();
      if (typeof window.App.renderIrrigationPanel === "function") window.App.renderIrrigationPanel();
      if (typeof window.App.renderPlantHealthSection === "function") window.App.renderPlantHealthSection();
      if (typeof window.App.renderWeatherSection === "function") window.App.renderWeatherSection();
      if (typeof window.App.renderEconomicsSection === "function") window.App.renderEconomicsSection();
      if (typeof window.App.renderAlerts === "function") window.App.renderAlerts();
      if (typeof window.App.renderPostHarvestSection === "function") window.App.renderPostHarvestSection();
    }

    // 3. Update quick query chips text
    this.updateQuickChipsLabels(langKey);

    // 4. Update Assistant initial welcome greeting
    const welcome = this.getAgrarianGreeting(langKey);
    const answerCard = document.getElementById("voice-answer-text");
    if (answerCard) answerCard.textContent = welcome;

    if (announce) {
      const confirmSpeech = this.getLanguageConfirmationText(langKey);
      this.speakText(confirmSpeech, langKey);
    }
  },

  updateQuickChipsLabels(lang) {
    const chipKeys = {
      water: "qWater",
      crops: "qCrop",
      pests: "qPestChip",
      pump: "qPump",
      animals: "qAnimals",
      weather: "qWeather",
      income: "qIncome",
      zone4: "qZone4",
      alerts: "qAlerts",
      postharvest: "qPostHarvestChip"
    };

    document.querySelectorAll(".voice-quick-chip").forEach(chip => {
      const q = chip.getAttribute("data-query");
      if (chipKeys[q]) {
        const textSpan = chip.querySelector(".chip-text");
        if (textSpan) {
          textSpan.textContent = TRANSLATIONS.t(chipKeys[q], lang);
        }
      }
    });
  },

  // 5. Open / Close Modal
  openVoiceModal() {
    const modal = document.getElementById("kisan-voice-modal");
    if (modal) {
      modal.classList.add("modal-open");
      this.updateMicUI("idle");
    }
  },

  closeVoiceModal() {
    this.stopSpeaking();
    if (this.recognition && this.isListening) {
      this.recognition.stop();
    }
    const modal = document.getElementById("kisan-voice-modal");
    if (modal) {
      modal.classList.remove("modal-open");
    }
  },

  // 6. Mic Listening Toggle
  toggleListening() {
    if (this.isSpeaking) {
      this.stopSpeaking();
    }

    if (!this.recognition) {
      this.showAssistantMessage(this.getLocalizedText("micNotSupported"));
      return;
    }

    if (this.isListening) {
      this.recognition.stop();
      this.isListening = false;
      this.updateMicUI("idle");
    } else {
      this.updateRecognitionLang();
      try {
        this.recognition.start();
      } catch (e) {
        console.warn("Recognition start failed:", e);
      }
    }
  },

  updateMicUI(state) {
    const micBtn = document.getElementById("voice-assistant-mic-btn");
    const statusText = document.getElementById("voice-mic-status-text");
    const waveEl = document.getElementById("voice-sound-waves");

    if (!micBtn || !statusText) return;

    micBtn.classList.remove("listening", "speaking", "thinking");
    if (waveEl) waveEl.classList.remove("wave-active");

    const lang = TRANSLATIONS.currentLang;

    if (state === "listening") {
      micBtn.classList.add("listening");
      statusText.textContent = TRANSLATIONS.t("micListening", lang);
      if (waveEl) waveEl.classList.add("wave-active");
    } else if (state === "thinking") {
      micBtn.classList.add("thinking");
      statusText.textContent = TRANSLATIONS.t("micProcessing", lang);
    } else if (state === "speaking") {
      micBtn.classList.add("speaking");
      statusText.textContent = TRANSLATIONS.t("micSpeaking", lang);
      if (waveEl) waveEl.classList.add("wave-active");
    } else {
      statusText.textContent = TRANSLATIONS.t("micTapToSpeak", lang);
    }
  },

  // 7. Process Incoming Farmer Speech / Text
  handleTranscript(text) {
    this.isListening = false;
    this.updateMicUI("thinking");

    // Display transcript
    const transcriptEl = document.getElementById("voice-user-transcript");
    if (transcriptEl) {
      transcriptEl.textContent = `“${text}”`;
      transcriptEl.classList.add("has-content");
    }

    // Process farmer's question
    setTimeout(() => {
      const response = this.evaluateFarmerQuery(text, TRANSLATIONS.currentLang);
      this.lastResponseText = response.speech;
      this.showAssistantResponse(response.display, response.speech, response.action);
    }, 400);
  },

  handleQuickQuery(queryType) {
    this.updateMicUI("thinking");
    const lang = TRANSLATIONS.currentLang;
    const query = this.evaluateQuickQuery(queryType, lang);
    this.lastResponseText = query.speech;

    const transcriptEl = document.getElementById("voice-user-transcript");
    if (transcriptEl) {
      transcriptEl.textContent = `“${query.userText}”`;
      transcriptEl.classList.add("has-content");
    }

    this.showAssistantResponse(query.display, query.speech, query.action);
  },

  showAssistantResponse(displayHtml, speechText, action = null) {
    const answerCard = document.getElementById("voice-answer-text");
    if (answerCard) {
      answerCard.innerHTML = displayHtml;
    }

    if (action && typeof action === "function") {
      action();
    }

    this.speakText(speechText, TRANSLATIONS.currentLang);
  },

  showAssistantMessage(messageText) {
    const answerCard = document.getElementById("voice-answer-text");
    if (answerCard) {
      answerCard.textContent = messageText;
    }
  },

  // 8. Natural Language Speech Synthesis
  speakText(text, langKey = null) {
    if (!this.synth) {
      console.warn("Speech Synthesis not supported");
      return;
    }

    this.synth.cancel(); // Stop any previous speech
    this.isSpeaking = true;
    this.updateMicUI("speaking");

    const lang = langKey || TRANSLATIONS.currentLang;
    const langInfo = TRANSLATIONS.languages[lang] || TRANSLATIONS.languages.hi;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langInfo.code;
    utterance.rate = 0.92; // Slightly measured pace for rural farmer comprehension
    utterance.pitch = 1.0;

    // Pick best matching voice
    const voices = this.synth.getVoices();
    const matchedVoice = voices.find(v => v.lang === langInfo.code || v.lang.startsWith(lang));
    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => {
      this.isSpeaking = false;
      this.updateMicUI("idle");
    };

    utterance.onerror = () => {
      this.isSpeaking = false;
      this.updateMicUI("idle");
    };

    this.currentUtterance = utterance;
    this.synth.speak(utterance);
  },

  stopSpeaking() {
    if (this.synth) {
      this.synth.cancel();
    }
    this.isSpeaking = false;
    this.updateMicUI("idle");
  },

  replayLastAnswer() {
    if (this.lastResponseText) {
      this.speakText(this.lastResponseText, TRANSLATIONS.currentLang);
    }
  },

  // 9. Section-Level "Read Aloud / Suno" Narration
  speakSection(sectionId) {
    const lang = TRANSLATIONS.currentLang;
    const narration = this.getSectionNarration(sectionId, lang);
    if (!narration) return;

    this.playBeep(480, 0.08);

    // Provide visual toast
    if (window.App && typeof App.showToast === "function") {
      App.showToast(`🔊 ${TRANSLATIONS.t('listenBtn', lang)}...`);
    }

    this.speakText(narration, lang);
  },

  speakZone(zoneId) {
    const lang = TRANSLATIONS.currentLang;
    const zone = ONE_ACRE_FARM.zones.find(z => z.id === zoneId);
    if (!zone) return;

    const narration = this.getZoneNarration(zone, lang);
    if (window.App && typeof App.showToast === "function") {
      App.showToast(`🔊 ${zone.name}`);
    }
    this.speakText(narration, lang);
  },

  // 10. Intelligent Agrarian Query Evaluation (Multilingual)
  evaluateFarmerQuery(input, lang) {
    const q = input.toLowerCase();

    // Check for Pump Start command
    if (
      q.includes("start pump") || q.includes("pump on") || q.includes("turn on pump") ||
      q.includes("पंप चालू") || q.includes("पानी चला") || q.includes("पंप स्टार्ट") ||
      q.includes("పంపు ఆన్") || q.includes("పంపు ప్రారంభించు") ||
      q.includes("பம்பை தொடங்கு") || q.includes("பம்பு ஆன்") ||
      q.includes("ಪಂಪ್ ಆನ್") || q.includes("ಪಂಪ್ ಪ್ರಾರಂಭ") ||
      q.includes("पंप सुरू") || q.includes("पंप चालू करा") ||
      q.includes("পাম্প চালু") || q.includes("পাম্প অন") ||
      q.includes("પંપ ચાલુ") || q.includes("પંપ ઓન") ||
      q.includes("ਪੰਪ ਚਲਾ") || q.includes("ਪੰਪ ਆਨ") ||
      q.includes("പമ്പ് ഓൺ")
    ) {
      return this.executePumpAction(true, lang);
    }

    // Check for Pump Stop command
    if (
      q.includes("stop pump") || q.includes("pump off") || q.includes("turn off pump") ||
      q.includes("पंप बंद") || q.includes("पानी रोको") ||
      q.includes("పంపు ఆఫ్") || q.includes("పంపు ఆపు") ||
      q.includes("பம்பை நிறுத்து") || q.includes("பம்பு ஆஃப்") ||
      q.includes("ಪಂಪ್ ಆಫ್") || q.includes("ಪಂಪ್ ನಿಲ್ಲಿಸಿ") ||
      q.includes("पंप बंद") || q.includes("पंप थांबवा") ||
      q.includes("পাম্প বন্ধ") || q.includes("পাম্প অফ") ||
      q.includes("પંપ બંધ") || q.includes("પંપ ઑફ") ||
      q.includes("ਪੰਪ ਬੰਦ") || q.includes("ਪੰਪ ਆਫ") ||
      q.includes("പമ്പ് ഓഫ്")
    ) {
      return this.executePumpAction(false, lang);
    }

    // Specific Zone 4 query
    if (
      q.includes("zone 4") || q.includes("zone four") || q.includes("ज़ोन 4") || q.includes("जोन 4") ||
      q.includes("జోన్ 4") || q.includes("மண்டலம் 4") || q.includes("ಜೋನ್ 4") ||
      q.includes("झोन 4") || q.includes("জোন ৪") || q.includes("ઝોન 4") ||
      q.includes("ਜ਼ੋਨ 4") || q.includes("സോൺ 4")
    ) {
      return this.evaluateQuickQuery("zone4", lang);
    }

    // Water & Irrigation queries
    if (
      q.includes("water") || q.includes("irrigation") || q.includes("moisture") || q.includes("pump") ||
      q.includes("पानी") || q.includes("सिंचाई") || q.includes("नमी") || q.includes("पंप") ||
      q.includes("నీరు") || q.includes("తేమ") || q.includes("పంపు") ||
      q.includes("தண்ணீர்") || q.includes("பாசனம்") || q.includes("ஈரம்") ||
      q.includes("ನೀರು") || q.includes("ತೇವಾಂಶ") ||
      q.includes("पाणी") || q.includes("सिंचन") || q.includes("ओलावा") ||
      q.includes("জল") || q.includes("সেচ") || q.includes("আর্দ্রতা") ||
      q.includes("પાણી") || q.includes("સિંચાઈ") || q.includes("ભેજ") ||
      q.includes("ਪਾਣੀ") || q.includes("ਸਿੰਚਾਈ") || q.includes("ਨਮੀ") ||
      q.includes("വെള്ളം") || q.includes("നന") || q.includes("ഈർപ്പം")
    ) {
      return this.evaluateQuickQuery("water", lang);
    }

    // Pest Attack & Fast Organic Remedy queries
    if (
      q.includes("pest") || q.includes("insect") || q.includes("attack") || q.includes("organic") || q.includes("remedy") || q.includes("cure") || q.includes("armyworm") || q.includes("mite") || q.includes("aphid") || q.includes("blight") ||
      q.includes("कीड़ा") || q.includes("सुंडी") || q.includes("जैविक") || q.includes("दवा") || q.includes("उपचार") || q.includes("कीटनाशक") || q.includes("माहू") || q.includes("रोकथाम") ||
      q.includes("పురుగు") || q.includes("సేంద్రీయ") || q.includes("మందు") ||
      q.includes("பூச்சி") || q.includes("மருந்து") ||
      q.includes("ಕೀಟ") || q.includes("ಔಷಧಿ") ||
      q.includes("कीड") || q.includes("औषध") ||
      q.includes("কীটপতঙ্গ") || q.includes("জৈব") ||
      q.includes("જીવાત") || q.includes("દવા") ||
      q.includes("ਕੀੜੇ") || q.includes("ਦਵਾਈ") ||
      q.includes("കീടങ്ങൾ") || q.includes("മരുന്ന്")
    ) {
      return this.evaluateQuickQuery("pests", lang);
    }

    // Crop Health & Disease queries
    if (
      q.includes("crop") || q.includes("health") || q.includes("disease") || q.includes("leaf") ||
      q.includes("फसल") || q.includes("पौधे") || q.includes("बीमारी") || q.includes("रोग") ||
      q.includes("పంట") || q.includes("మొక్క") || q.includes("రోగం") || q.includes("చీడ") ||
      q.includes("பயிர்") || q.includes("நோய்") ||
      q.includes("ಬೆಳೆ") || q.includes("ಸಸ್ಯ") || q.includes("ರೋಗ") ||
      q.includes("पीक") || q.includes("झाड") || q.includes("रोग") ||
      q.includes("ফসল") || q.includes("গাছ") || q.includes("রোগ") ||
      q.includes("પાક") || q.includes("છોડ") || q.includes("રોગ") ||
      q.includes("ਫਸਲ") || q.includes("ਪੌਦੇ") || q.includes("ਬਿਮਾਰੀ") ||
      q.includes("വിള") || q.includes("ചെടി") || q.includes("രോഗം")
    ) {
      return this.evaluateQuickQuery("crops", lang);
    }

    // Weather & Rain queries
    if (
      q.includes("weather") || q.includes("rain") || q.includes("temperature") || q.includes("forecast") ||
      q.includes("मौसम") || q.includes("बारिश") || q.includes("तापमान") || q.includes("हवा") ||
      q.includes("వాతావరణం") || q.includes("వర్షం") || q.includes("ఉష్ణోగ్రత") ||
      q.includes("வானிலை") || q.includes("மழை") || q.includes("வெப்பநிலை") ||
      q.includes("ಹವಾಮಾನ") || q.includes("ಮಳೆ") || q.includes("ತಾಪಮಾನ") ||
      q.includes("हवामान") || q.includes("पाऊस") || q.includes("तापमान") ||
      q.includes("আবহাওয়া") || q.includes("বৃষ্টি") || q.includes("তাপমাত্রা") ||
      q.includes("હવામાન") || q.includes("વરસાદ") || q.includes("તાપમાન") ||
      q.includes("ਮੌਸਮ") || q.includes("ਮੀਂਹ") || q.includes("ਤਾਪਮਾਨ") ||
      q.includes("കാലാവസ്ഥ") || q.includes("മഴ") || q.includes("താപനില")
    ) {
      return this.evaluateQuickQuery("weather", lang);
    }

    // Animals & Night Security queries
    if (
      q.includes("animal") || q.includes("security") || q.includes("boar") || q.includes("threat") || q.includes("night") ||
      q.includes("जानवर") || q.includes("सुरक्षा") || q.includes("सूअर") || q.includes("नीलगाय") || q.includes("खतरा") ||
      q.includes("జంతువు") || q.includes("భద్రత") || q.includes("పంది") ||
      q.includes("விலங்கு") || q.includes("பாதுகாப்பு") || q.includes("பன்றி") ||
      q.includes("ಪ್ರಾಣಿ") || q.includes("ಭದ್ರತೆ") || q.includes("ಕಾಡುಹಂದಿ") ||
      q.includes("प्राणी") || q.includes("सुरक्षा") || q.includes("रानडुक्कर") ||
      q.includes("পশু") || q.includes("নিরাপত্তা") || q.includes("শূকর") ||
      q.includes("પ્રાણી") || q.includes("સુરક્ષા") || q.includes("ભૂંડ") ||
      q.includes("ਜਾਨਵਰ") || q.includes("ਸੁਰੱਖਿਆ") || q.includes("ਸੂਰ") ||
      q.includes("മൃഗം") || q.includes("സുരക്ഷ") || q.includes("പന്നി")
    ) {
      return this.evaluateQuickQuery("animals", lang);
    }

    // Post-Harvest Direct Sales & Zero-Waste Upcycling queries
    if (
      q.includes("sell") || q.includes("direct") || q.includes("middleman") || q.includes("middlemen") ||
      q.includes("pack") || q.includes("packaging") || q.includes("waste") || q.includes("compost") ||
      q.includes("biochar") || q.includes("mushroom") || q.includes("upcycle") || q.includes("residue") ||
      q.includes("harvest") || q.includes("बिक्री") || q.includes("बेच") || q.includes("बिचौलिया") ||
      q.includes("दलाल") || q.includes("पैकिंग") || q.includes("कचरा") || q.includes("खाद") ||
      q.includes("वर्मीकम्पोस्ट") || q.includes("बायोचार") || q.includes("मशरूम") || q.includes("अवशेष") ||
      q.includes("అమ్మకం") || q.includes("వ్యర్థాలు") || q.includes("விற்பனை") || q.includes("கழிவு")
    ) {
      return this.evaluateQuickQuery("postharvest", lang);
    }

    // Economics / Earnings / Money queries
    if (
      q.includes("income") || q.includes("profit") || q.includes("money") || q.includes("cost") || q.includes("revenue") ||
      q.includes("कमाई") || q.includes("मुनाफा") || q.includes("खर्च") || q.includes("लागत") || q.includes("पैसा") ||
      q.includes("ఆదాయం") || q.includes("లాభం") || q.includes("ఖర్చు") ||
      q.includes("வருமானம்") || q.includes("லாபம்") || q.includes("செலவு") ||
      q.includes("ಆದಾಯ") || q.includes("ಲಾಭ") || q.includes("ವೆಚ್ಚ") ||
      q.includes("मिळकत") || q.includes("नफा") || q.includes("खर्च") ||
      q.includes("আয়") || q.includes("লাভ") || q.includes("খরচ") ||
      q.includes("આવક") || q.includes("નફો") || q.includes("ખર્ચ") ||
      q.includes("ਕਮਾਈ") || q.includes("ਮੁਨਾਫ਼ਾ") || q.includes("ਖ਼ਰਚ") ||
      q.includes("വരുമാനം") || q.includes("ലാഭം") || q.includes("ചെലവ്")
    ) {
      return this.evaluateQuickQuery("income", lang);
    }

    // Active Alerts queries
    if (
      q.includes("alert") || q.includes("warning") || q.includes("problem") ||
      q.includes("चेतावनी") || q.includes("समस्या") || q.includes("अलर्ट") ||
      q.includes("హెచ్చరిక") || q.includes("సమస్య") ||
      q.includes("எச்சரிக்கை") || q.includes("பிரச்சனை") ||
      q.includes("ಎಚ್ಚರಿಕೆ") || q.includes("ಸಮಸ್ಯೆ") ||
      q.includes("सूचना") || q.includes("चेतावणी") ||
      q.includes("সতর্কতা") || q.includes("সমস্যা") ||
      q.includes("ચેતવણી") || q.includes("સમસ્યા") ||
      q.includes("ਚੇਤਾਵਨੀ") || q.includes("ਮੁਸ਼ਕਲ") ||
      q.includes("മുന്നറിയിപ്പ്") || q.includes("പ്രശ്നം")
    ) {
      return this.evaluateQuickQuery("alerts", lang);
    }

    // Greetings
    if (
      q.includes("hello") || q.includes("hi") || q.includes("help") ||
      q.includes("नमस्ते") || q.includes("प्रणाम") || q.includes("राम राम") ||
      q.includes("నమస్కారం") || q.includes("வணக்கம்") || q.includes("ನಮಸ್ಕಾರ") ||
      q.includes("नमस्कार") || q.includes("নমস্কার") || q.includes("નમસ્તે") ||
      q.includes("ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ") || q.includes("നമസ്കാരം")
    ) {
      return {
        userText: input,
        display: `<strong>🌾 ${this.getAgrarianGreeting(lang)}</strong><br><br>${this.getAssistantHelpGuide(lang)}`,
        speech: `${this.getAgrarianGreeting(lang)} ${this.getAssistantHelpGuideSpeech(lang)}`,
        action: null
      };
    }

    // Default fallback agrarian answer
    return {
      userText: input,
      display: `<strong>🌾 ${TRANSLATIONS.t("voiceModalTitle", lang)}:</strong><br><br>${this.getDefaultGuidanceText(lang)}`,
      speech: this.getDefaultGuidanceSpeech(lang),
      action: null
    };
  },

  // Execute Pump actuation from voice command
  executePumpAction(turnOn, lang) {
    const isCurrentlyOn = ONE_ACRE_FARM.irrigation.pumpStatus === "ON";
    const action = () => {
      ONE_ACRE_FARM.irrigation.pumpStatus = turnOn ? "ON" : "OFF";
      ONE_ACRE_FARM.overview.pumpStatus = turnOn ? "ON" : "OFF";
      ONE_ACRE_FARM.irrigation.explanation = turnOn ?
        "Pump started by farmer voice command. Solenoid hydrating Sweet Corn Zone 04." :
        "Pump stopped by farmer voice command. System standing by.";

      if (window.App) {
        App.renderOverviewCards();
        App.renderIrrigationPanel();
        App.render8ZoneFarmMap();
        App.showToast(turnOn ? "⚡ Pump Started via Voice" : "🛑 Pump Stopped via Voice");
      }
    };

    const responses = {
      en: {
        speech: turnOn ?
          "Pump has been turned ON. Water is flowing to Zone 4 Sweet Corn." :
          "Pump has been turned OFF. All valves are safely closed.",
        display: turnOn ?
          "⚡ <strong>Sub-Surface Pump Activated!</strong><br>Drip line open for Zone 04 (Sweet Corn). Target moisture: 42%." :
          "🛑 <strong>Sub-Surface Pump Halted.</strong><br>All solenoid lines closed. System in standby mode."
      },
      hi: {
        speech: turnOn ?
          "पानी का पंप चालू कर दिया गया है। ज़ोन 4 मक्के के खेत में पानी दिया जा रहा है।" :
          "पानी का पंप बंद कर दिया गया है। सभी वाल्व बंद हैं।",
        display: turnOn ?
          "⚡ <strong>पंप चालू कर दिया गया है!</strong><br>ज़ोन 04 (मक्के का खेत) में ड्रिप सिंचाई सक्रिय है। लक्ष्य नमी: 42%." :
          "🛑 <strong>पंप बंद कर दिया गया है।</strong><br>सभी पाइप बंद हैं और सिस्टम स्टैंडबाय मोड में है।"
      },
      te: {
        speech: turnOn ?
          "నీటి పంపు ఆన్ చేయబడింది. జోన్ 4 మొక్కజొన్న చేనుకు నీరు సరఫరా అవుతోంది." :
          "నీటి పంపు ఆఫ్ చేయబడింది. అన్ని వాల్వ్‌లు మూసివేయబడ్డాయి.",
        display: turnOn ?
          "⚡ <strong>పంపు ఆన్ చేయబడింది!</strong><br>జోన్ 04 (స్వీట్ కార్న్) లో డ్రిప్ ద్వారా నీరు అందుతోంది." :
          "🛑 <strong>పంపు ఆఫ్ చేయబడింది.</strong><br>వ్యవస్థ స్టాండ్‌బై మోడ్‌లో ఉంది."
      },
      ta: {
        speech: turnOn ?
          "தண்ணீர் பம்பு ஆன் செய்யப்பட்டது. மண்டலம் 4 சோளப் பயிருக்கு நீர் பாய்கிறது." :
          "தண்ணீர் பம்பு ஆஃப் செய்யப்பட்டது. அனைத்து வால்வுகளும் மூடப்பட்டுள்ளன.",
        display: turnOn ?
          "⚡ <strong>பம்பு இயக்கப்பட்டது!</strong><br>மண்டலம் 04 சோளப் பயிருக்கு சொட்டுநீர் பாசனம் இயங்குகிறது." :
          "🛑 <strong>பம்பு நிறுத்தப்பட்டது.</strong><br>அனைத்து இணைப்புகளும் மூடப்பட்டுள்ளன."
      },
      kn: {
        speech: turnOn ?
          "ನೀರಿನ ಪಂಪ್ ಆನ್ ಮಾಡಲಾಗಿದೆ. ಜೋನ್ 4 ಜೋಳದ ಬೆಳೆಗೆ ನೀರು ಹರಿಯುತ್ತಿದೆ." :
          "ನೀರಿನ ಪಂಪ್ ಆಫ್ ಮಾಡಲಾಗಿದೆ. ಎಲ್ಲಾ ವಾಲ್ವ್‌ಗಳು ಮುಚ್ಚಲ್ಪಟ್ಟಿವೆ.",
        display: turnOn ?
          "⚡ <strong>ಪಂಪ್ ಆನ್ ಮಾಡಲಾಗಿದೆ!</strong><br>ವಲಯ 04 ಜೋಳದ ಬೆಳೆಗೆ ಹನಿ ನೀರಾವರಿ ಆರಂಭವಾಗಿದೆ." :
          "🛑 <strong>ಪಂಪ್ ಆಫ್ ಮಾಡಲಾಗಿದೆ.</strong><br>ಸಿಸ್ಟಮ್ ಸ್ಟ್ಯಾಂಡ್‌ಬೈ ಮೋಡ್‌ನಲ್ಲಿದೆ."
      },
      mr: {
        speech: turnOn ?
          "पाण्याचा पंप सुरू करण्यात आला आहे. झोन 4 मक्याच्या पिकाला पाणी देणे सुरू आहे." :
          "पाण्याचा पंप बंद करण्यात आला आहे. सर्व व्हॉल्व्ह सुरक्षितपणे बंद आहेत.",
        display: turnOn ?
          "⚡ <strong>पंप सुरू करण्यात आला आहे!</strong><br>झोन 04 (मका) मध्ये ठिबक सिंचन सुरू आहे." :
          "🛑 <strong>पंप बंद करण्यात आला आहे.</strong><br>सर्व पाईप बंद आहेत."
      },
      bn: {
        speech: turnOn ?
          "পানির পাম্প চালু করা হয়েছে। জোন ৪ ভুট্টা খেতে পানি দেওয়া হচ্ছে।" :
          "পানির পাম্প বন্ধ করা হয়েছে। সমস্ত ভালভ বন্ধ রয়েছে।",
        display: turnOn ?
          "⚡ <strong>পাম্প চালু করা হয়েছে!</strong><br>জোন ৪ (ভুট্টা) তে ড্রিপ সেচ চলছে।" :
          "🛑 <strong>পাম্প বন্ধ করা হয়েছে।</strong><br>সমস্ত লাইন বন্ধ এবং স্ট্যান্ডবাই আছে।"
      },
      gu: {
        speech: turnOn ?
          "પાણીનો પંપ ચાલુ કરવામાં આવ્યો છે. ઝોન 4 મકાઈના પાકમાં પાણી ચાલુ છે." :
          "પાણીનો પંપ બંધ કરવામાં આવ્યો છે. બધા વાલ્વ બંધ છે.",
        display: turnOn ?
          "⚡ <strong>પંપ ચાલુ કરવામાં આવ્યો છે!</strong><br>ઝોન 04 (મકાઈ) માં ટપક સિંચાઈ કાર્યરત છે." :
          "🛑 <strong>પંપ બંધ કરવામાં આવ્યો છે.</strong><br>સિસ્ટમ સ્ટેન્ડબાય મોડમાં છે."
      },
      pa: {
        speech: turnOn ?
          "ਪਾਣੀ ਦਾ ਪੰਪ ਚਾਲੂ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ। ਜ਼ੋਨ 4 ਮੱਕੀ ਦੇ ਖੇਤ ਨੂੰ ਪਾਣੀ ਮਿਲ ਰਿਹਾ ਹੈ।" :
          "ਪਾਣੀ ਦਾ ਪੰਪ ਬੰਦ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ। ਸਾਰੇ ਵਾਲਵ ਬੰਦ ਹਨ।",
        display: turnOn ?
          "⚡ <strong>ਪੰਪ ਚਾਲੂ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ!</strong><br>ਜ਼ੋਨ 04 (ਮੱਕੀ) ਵਿੱਚ ਤੁਪਕਾ ਸਿੰਚਾਈ ਚੱਲ ਰਹੀ ਹੈ।" :
          "🛑 <strong>ਪੰਪ ਬੰਦ ਕਰ ਦਿੱਤਾ ਗਿਆ ਹੈ।</strong><br>ਸਿਸਟਮ ਸਟੈਂਡਬਾਏ ਮੋਡ ਵਿੱਚ ਹੈ।"
      },
      ml: {
        speech: turnOn ?
          "വാട്ടർ പമ്പ് ഓൺ ചെയ്തു. സോൺ 4 ചോള കൃഷിയിലേക്ക് വെള്ളം ഒഴുകുന്നു." :
          "വാട്ടർ പമ്പ് ഓഫ് ചെയ്തു. എല്ലാ വാൽവുകളും അടച്ചു.",
        display: turnOn ?
          "⚡ <strong>പമ്പ് ഓൺ ചെയ്തു!</strong><br>സോൺ 04 (ചോളം) ലേക്ക് ഡ്രിപ്പ് ഇറിഗേഷൻ സജീവമാണ്." :
          "🛑 <strong>പമ്പ് ഓഫ് ചെയ്തു.</strong><br>സിസ്റ്റം സ്റ്റാൻഡ്ബൈ മോഡിലാണ്."
      }
    };

    const res = responses[lang] || responses.hi;
    return {
      userText: turnOn ? "Start Pump" : "Stop Pump",
      display: res.display,
      speech: res.speech,
      action: action
    };
  },

  // 11. Evaluate Quick One-Touch Voice Chips
  evaluateQuickQuery(type, lang) {
    const data = {
      water: {
        userText: TRANSLATIONS.t("qWater", lang),
        display: {
          en: `💧 <strong>Irrigation & Water Status:</strong><br>• Average Farm Moisture: <strong>48%</strong> (Target: 45-55%)<br>• Water Tank: <strong>68% Full (13,600 Liters)</strong> (14 Days reserve)<br>• Current Pump State: <strong>ON</strong> (Hydrating Zone 04 Sweet Corn at 22% moisture)<br>• Water Delivered Today: <strong>320 Liters</strong>`,
          hi: `💧 <strong>पानी और सिंचाई की स्थिति:</strong><br>• खेत की औसत नमी: <strong>48%</strong> (लक्ष्य: 45-55%)<br>• पानी की टंकी: <strong>68% भरी है (13,600 लीटर)</strong> (14 दिनों का बैकअप)<br>• वर्तमान पंप स्थिति: <strong>चालू है</strong> (ज़ोन 4 मक्के में 22% नमी होने पर पानी दिया जा रहा है)<br>• आज खर्च हुआ पानी: <strong>320 लीटर</strong>`,
          te: `💧 <strong>నీరు & నీటిపారుదల స్థితి:</strong><br>• సగటు నేల తేమ: <strong>48%</strong><br>• వాటర్ ట్యాంక్: <strong>68% నిండింది (13,600 లీటర్లు)</strong><br>• పంపు స్థితి: <strong>ఆన్</strong> (జోన్ 4 మొక్కజొన్నకు నీరు అందుతోంది)<br>• నేటి వినియోగం: <strong>320 లీటర్లు</strong>`,
          ta: `💧 <strong>நீர்ப்பாசன நிலை:</strong><br>• சராசரி மண் ஈரம்: <strong>48%</strong><br>• தண்ணீர் தொட்டி: <strong>68% நிறைந்துள்ளது (13,600 லிட்டர்)</strong><br>• பம்பு நிலை: <strong>இயங்குகிறது</strong> (மண்டலம் 4 சோளப்பயிர் நனைக்கப்படுகிறது)<br>• இன்றைய நீர் செலவு: <strong>320 லிட்டர்</strong>`,
          kn: `💧 <strong>ನೀರಾವರಿ & ನೀರಿನ ಮಟ್ಟ:</strong><br>• ಸರಾಸರಿ ತೇವಾಂಶ: <strong>48%</strong><br>• ನೀರಿನ ಟ್ಯಾಂಕ್: <strong>68% ಭರ್ತಿಯಾಗಿದೆ (13,600 ಲೀಟರ್)</strong><br>• ಪಂಪ್ ಸ್ಥಿತಿ: <strong>ಆನ್ ಆಗಿದೆ</strong> (ಜೋನ್ 4 ಬೆಳೆಗೆ ನೀರುಣಿಸಲಾಗುತ್ತಿದೆ)<br>• ಇಂದಿನ ಬಳಕೆ: <strong>320 ಲೀಟರ್</strong>`,
          mr: `💧 <strong>पाणी आणि सिंचन स्थिती:</strong><br>• सरासरी मातीतील ओलावा: <strong>48%</strong><br>• पाण्याची टाकी: <strong>68% भरलेली आहे (13,600 लिटर)</strong><br>• पंप स्थिती: <strong>सुरू आहे</strong> (झोन 4 मक्याच्या पिकाला पाणी देणे सुरू आहे)<br>• आजचा पाण्याचा वापर: <strong>320 लिटर</strong>`,
          bn: `💧 <strong>পানি ও সেচ অবস্থা:</strong><br>• গড় আর্দ্রতা: <strong>৪৮%</strong><br>• পানির ট্যাঙ্ক: <strong>৬৮% পূর্ণ (১৩,৬০০ লিটার)</strong><br>• পাম্পের অবস্থা: <strong>চালু আছে</strong> (জোন ৪ ভুট্টায় সেচ চলছে)<br>• আজকের খরচ: <strong>৩২০ লিটার</strong>`,
          gu: `💧 <strong>સિંચાઈ અને પાણીની સ્થિતિ:</strong><br>• સરેરાશ ભેજ: <strong>48%</strong><br>• પાણીની ટાંકી: <strong>68% ભરેલી છે (13,600 લિટર)</strong><br>• પંપ સ્થિતિ: <strong>ચાલુ છે</strong> (ઝોન 4 મકાઈમાં પાણી ચાલુ છે)<br>• આજનો વપરાશ: <strong>320 લિટર</strong>`,
          pa: `💧 <strong>ਸਿੰਚਾਈ ਅਤੇ ਪਾਣੀ ਦੀ ਸਥਿਤੀ:</strong><br>• ਔਸਤ ਨਮੀ: <strong>48%</strong><br>• ਪਾਣੀ ਦੀ ਟੈਂਕੀ: <strong>68% ਭਰੀ ਹੈ (13,600 ਲੀਟਰ)</strong><br>• ਪੰਪ ਸਥਿਤੀ: <strong>ਚਾਲੂ ਹੈ</strong> (ਜ਼ੋਨ 4 ਮੱਕੀ ਵਿੱਚ ਪਾਣੀ ਲੱਗ ਰਿਹਾ ਹੈ)<br>• ਅੱਜ ਦੀ ਖਪਤ: <strong>320 ਲੀਟਰ</strong>`,
          ml: `💧 <strong>ജലസേചന നില:</strong><br>• ശരാശരി ഈർപ്പം: <strong>48%</strong><br>• വാട്ടർ ടാങ്ക്: <strong>68% നിറഞ്ഞു (13,600 ലിറ്റർ)</strong><br>• പമ്പ് നില: <strong>ഓൺ ആണ്</strong> (സോൺ 4 ചോളത്തിലേക്ക് വെള്ളം പമ്പ് ചെയ്യുന്നു)<br>• ഇന്നത്തെ ഉപയോഗം: <strong>320 ലിറ്റർ</strong>`
        },
        speech: {
          en: "In your farm, average soil moisture is 48 percent. Water tank has 13,600 liters available. The irrigation pump is currently ON for Zone 4 sweet corn because soil moisture dropped to 22 percent.",
          hi: "किसान भाई, खेत में औसत नमी 48 प्रतिशत है। पानी की टंकी 68 प्रतिशत भरी है। ज़ोन 4 मक्के के खेत में नमी 22 प्रतिशत होने के कारण अभी पानी का पंप चालू है।",
          te: "రైతు సోదరా, పొలంలో సగటు తేమ 48 శాతం ఉంది. ట్యాంక్‌లో 13,600 లీటర్ల నీరు ఉంది. జోన్ 4 మొక్కజొన్న చేనులో తేమ 22 శాతం మాత్రమే ఉండటంతో ప్రస్తుతం పంపు నడుస్తోంది.",
          ta: "விவசாயி தோழரே, பண்ணையின் சராசரி ஈரம் 48 சதவீதம். தண்ணீர் தொட்டியில் 13,600 லிட்டர் நீர் உள்ளது. மண்டலம் 4ல் ஈரம் 22 சதவீதமாக குறைந்ததால் தற்போது பம்பு இயங்குகிறது.",
          kn: "ರೈತ ಬಾಂಧವರೇ, ಜಮೀನಿನಲ್ಲಿ ಸರಾಸರಿ ತೇವಾಂಶ 48 ಪ್ರತಿಶತ ಇದೆ. ನೀರಿನ ಟ್ಯಾಂಕ್‌ನಲ್ಲಿ 13,600 ಲೀಟರ್ ನೀರಿದೆ. ಜೋನ್ 4 ಬೆಳೆಯಲ್ಲಿ ತೇವಾಂಶ 22 ಪ್ರತಿಶತ ಇರುವುದರಿಂದ ಈಗ ಪಂಪ್ ಆನ್ ಆಗಿದೆ.",
          mr: "शेतकरी मित्रा, शेतात सरासरी ओलावा 48 टक्के आहे. पाण्याच्या टाकीत 13,600 लिटर पाणी उपलब्ध आहे. झोन 4 मध्ये ओलावा 22 टक्के असल्याने सध्या पाण्याचा पंप सुरू आहे.",
          bn: "কৃষক ভাই, খামারে গড় আর্দ্রতা ৪৮ শতাংশ। পানির ট্যাঙ্কে ১৩,৬০০ লিটার পানি আছে। জোন ৪ এ আর্দ্রতা কমে ২২ শতাংশ হওয়ায় বর্তমানে পাম্প চলছে।",
          gu: "ખેડૂત મિત્ર, ખેતરમાં સરેરાશ ભેજ 48 ટકા છે. પાણીની ટાંકીમાં 13,600 લિટર પાણી છે. ઝોન 4 માં ભેજ 22 ટકા હોવાથી હાલ પંપ ચાલુ છે.",
          pa: "ਕਿਸਾਨ ਵੀਰੋ, ਖੇਤ ਵਿੱਚ ਔਸਤ ਨਮੀ 48 ਫ਼ੀਸਦੀ ਹੈ। ਟੈਂਕੀ ਵਿੱਚ 13,600 ਲੀਟਰ ਪਾਣੀ ਹੈ। ਜ਼ੋਨ 4 ਵਿੱਚ ਨਮੀ 22 ਫ਼ੀਸਦੀ ਰਹਿ ਜਾਣ ਕਰਕੇ ਇਸ ਵੇਲੇ ਪੰਪ ਚੱਲ ਰਿਹਾ ਹੈ।",
          ml: "കർഷക മിത്രമേ, ഫാമിൽ ശരാശരി ഈർപ്പം 48 ശതമാനമാണ്. ടാങ്കിൽ 13,600 ലിറ്റർ വെള്ളമുണ്ട്. സോൺ 4 ൽ ഈർപ്പം 22 ശതമാനമായതിനാൽ ഇപ്പോൾ പമ്പ് പ്രവർത്തിക്കുന്നു."
        }
      },

      crops: {
        userText: TRANSLATIONS.t("qCrop", lang),
        display: {
          en: `🌱 <strong>Crop Health & Diseases:</strong><br>• Overall Health Score: <strong>87% Optimal Vigor</strong><br>• Healthy Zones: <strong>6 out of 8 Zones</strong><br>• Zone 04: Mild leaf chlorosis due to water stress (recovering with irrigation)<br>• Disease Risk: <strong>12% (Low)</strong>, Pest Risk: <strong>8% (Negligible)</strong><br>• Advice: Apply 1% chelated spray after irrigation; organic neem on Zone 06.`,
          hi: `🌱 <strong>फसल की सेहत और रोग जांच:</strong><br>• कुल स्वास्थ्य स्कोर: <strong>87% बहुत अच्छा</strong><br>• स्वस्थ ज़ोन: <strong>8 में से 6 ज़ोन बिल्कुल सही</strong><br>• ज़ोन 04: मक्के में पानी की कमी से हल्का पीलापन है जो सिंचाई के बाद ठीक हो जाएगा<br>• बीमारी का खतरा: <strong>12% (बहुत कम)</strong>, कीट का खतरा: <strong>8%</strong><br>• सलाह: सिंचाई के बाद 1% स्प्रे करें, ज़ोन 6 में नीम का तेल छिड़कें।`,
          te: `🌱 <strong>పంట ఆరోగ్యం & వ్యాధులు:</strong><br>• మొత్తం పంట ఆరోగ్యం: <strong>87% అద్భుతం</strong><br>• ఆరోగ్యకరమైన జోన్లు: <strong>8 లో 6 జోన్లు</strong><br>• జోన్ 04: నీటి కొరత వల్ల ఆకులు కాస్త పసుపు రంగులోకి మారాయి, నీరు పెట్టాక కోలుకుంటుంది<br>• తెగుళ్ల ముప్పు: <strong>12% (చాలా తక్కువ)</strong>`,
          ta: `🌱 <strong>பயிர் ஆரோக்கியம்:</strong><br>• ஒட்டுமொத்த பயிர் நலம்: <strong>87% நன்று</strong><br>• ஆரோக்கியமான மண்டலங்கள்: <strong>8ல் 6 மண்டலங்கள்</strong><br>• மண்டலம் 04: நீர் பற்றாக்குறையால் லேசான இலை வாடல், பாசனத்திற்கு பின் சரியாகிவிடும்<br>• நோய் தாக்கம்: <strong>12% (மிகக் குறைவு)</strong>`,
          kn: `🌱 <strong>ಬೆಳೆ ಆರೋಗ್ಯ & ರೋಗಗಳು:</strong><br>• ಒಟ್ಟು ಆರೋಗ್ಯ ಸ್ಕೋರ್: <strong>87% ಉತ್ತಮ</strong><br>• ಆರೋಗ್ಯಕರ ವಲಯಗಳು: <strong>8 ರಲ್ಲಿ 6 ವಲಯಗಳು</strong><br>• ವಲಯ 04: ನೀರಿನ ಕೊರತೆಯಿಂದ ಎಲೆಗಳಲ್ಲಿ ಲಘು ಹಳದಿ ಬಣ್ಣ, ನೀರುಣಿಸಿದ ನಂತರ ಸರಿಯಾಗುತ್ತದೆ<br>• ರೋಗದ ಅಪಾಯ: <strong>12% (ಕಡಿಮೆ)</strong>`,
          mr: `🌱 <strong>पिकांचे आरोग्य आणि रोग:</strong><br>• एकूण आरोग्य स्कोअर: <strong>87% उत्तम</strong><br>• निरोगी झोन: <strong>8 पैकी 6 झोन</strong><br>• झोन 04: पाण्याच्या कमतरतेमुळे मक्यात हलका पिवळेपणा, पाणी दिल्यावर सुधारेल<br>• रोगाचा धोका: <strong>12% (अतिशय कमी)</strong>`,
          bn: `🌱 <strong>ফসলের স্বাস্থ্য ও রোগ:</strong><br>• মোট স্বাস্থ্য স্কোর: <strong>৮৭% চমৎকার</strong><br>• সুস্থ জোন: <strong>৮টির মধ্যে ৬টি</strong><br>• জোন ৪: পানির অভাবে সামান্য পাতা হলুদ ভাব, সেচ দেওয়ার পর ঠিক হবে<br>• রোগের ঝুঁকি: <strong>১২% (খুব কম)</strong>`,
          gu: `🌱 <strong>પાકનું સ્વાસ્થ્ય અને રોગ:</strong><br>• એકંદર આરોગ્ય સ્કોર: <strong>87% ઉત્તમ</strong><br>• સ્વસ્થ ઝોન: <strong>8 માંથી 6 ઝોન</strong><br>• ઝોન 04: પાણીની અછતને લીધે પાંદડામાં થોડી પીળાશ છે જે સિંચાઈ પછી સુધરી જશે<br>• રોગનું જોખમ: <strong>12% (ઓછું)</strong>`,
          pa: `🌱 <strong>ਫਸਲ ਦੀ ਸਿਹਤ ਅਤੇ ਰੋਗ:</strong><br>• ਕੁੱਲ ਸਿਹਤ ਸਕੋਰ: <strong>87% ਬਹੁਤ ਵਧੀਆ</strong><br>• ਤੰਦਰੁਸਤ ਜ਼ੋਨ: <strong>8 ਵਿੱਚੋਂ 6 ਜ਼ੋਨ</strong><br>• ਜ਼ੋਨ 04: ਪਾਣੀ ਦੀ ਘਾਟ ਕਾਰਨ ਮੱਕੀ ਵਿੱਚ ਹਲਕਾ ਪੀਲਾਪਣ ਹੈ ਜੋ ਸਿੰਚਾਈ ਮਗਰੋਂ ਠੀਕ ਹੋ ਜਾਵੇਗਾ<br>• ਬਿਮਾਰੀ ਦਾ ਖਤਰਾ: <strong>12% (ਬਹੁਤ ਘੱਟ)</strong>`,
          ml: `🌱 <strong>വിള ആരോഗ്യവും രോഗങ്ങളും:</strong><br>• മൊത്തം വിള ആരോഗ്യം: <strong>87% മികച്ചത്</strong><br>• ആരോഗ്യമുള്ള സോണുകൾ: <strong>8 ൽ 6 എണ്ണം</strong><br>• സോൺ 04: ജലക്ഷാമം കാരണം നേരിയ ഇല മഞ്ഞളിപ്പ് ഉണ്ട്, നനച്ച ശേഷം മാറും<br>• രോഗ സാധ്യത: <strong>12% (കുറവ്)</strong>`
        },
        speech: {
          en: "Overall crop health is 87 percent with strong vigor across 6 zones. Zone 4 sweet corn has slight stress due to dry soil, but will recover with the current irrigation. Disease risk is low at only 12 percent.",
          hi: "आपकी फसलों का स्वास्थ्य 87 प्रतिशत बहुत अच्छा है। 8 में से 6 ज़ोन पूरी तरह स्वस्थ हैं। ज़ोन 4 मक्के में पानी की कमी से हल्का तनाव था जो अभी पानी मिलने से ठीक हो जाएगा। बीमारी का खतरा केवल 12 प्रतिशत है।",
          te: "మీ పంటల ఆరోగ్యం 87 శాతం చాలా బాగుంది. 8 లో 6 జోన్లు ఆరోగ్యంగా ఉన్నాయి. జోన్ 4 లో మాత్రమే కాస్త నీటి ఎద్దడి ఉంది. తెగుళ్ల ప్రమాదం కేవలం 12 శాతం మాత్రమే.",
          ta: "உங்கள் பயிர்களின் ஆரோக்கியம் 87 சதவீதம் மிகச் சிறப்பாக உள்ளது. 8ல் 6 மண்டலங்கள் செழிப்பாக உள்ளன. மண்டலம் 4க்கு தண்ணீர் பாய்ச்சப்படுகிறது. நோய் ஆபத்து 12 சதவீதம் மட்டுமே.",
          kn: "ಬೆಳೆಗಳ ಆರೋಗ್ಯ 87 ಪ್ರತಿಶತ ಉತ್ತಮವಾಗಿದೆ. 8 ರಲ್ಲಿ 6 ವಲಯಗಳು ಸಂಪೂರ್ಣವಾಗಿ ಚೆನ್ನಾಗಿವೆ. ರೋಗದ ಅಪಾಯ ಕೇವಲ 12 ಪ್ರತಿಶತ ಮಾತ್ರ ಇದೆ.",
          mr: "आपल्या पिकांचे आरोग्य 87 टक्के अतिशय चांगले आहे. 8 पैकी 6 झोन पूर्णपणे निरोगी आहेत. रोगाचा धोका केवळ 12 टक्के इतका कमी आहे.",
          bn: "আপনার ফসলের স্বাস্থ্য ৮৭ শতাংশ খুব ভালো। ৮টির মধ্যে ৬টি জোন সম্পূর্ণ সুস্থ। রোগবালাইয়ের ঝুঁকি মাত্র ১২ শতাংশ।",
          gu: "તમારા પાકનું સ્વાસ્થ્ય 87 ટકા ખૂબ સારું છે. 8 માંથી 6 ઝોન તંદુરસ્ત છે. રોગનું જોખમ ફક્ત 12 ટકા છે.",
          pa: "ਤੁਹਾਡੀ ਫਸਲ ਦੀ ਸਿਹਤ 87 ਫ਼ੀਸਦੀ ਬਹੁਤ ਵਧੀਆ ਹੈ। 8 ਵਿੱਚੋਂ 6 ਜ਼ੋਨ ਪੂਰੀ ਤਰ੍ਹਾਂ ਤੰਦਰੁਸਤ ਹਨ। ਬਿਮਾਰੀ ਦਾ ਖਤਰਾ ਸਿਰਫ 12 ਫ਼ੀਸਦੀ ਹੈ।",
          ml: "വിളകളുടെ ആരോഗ്യം 87 ശതമാനം മികച്ചതാണ്. 8 ൽ 6 സോണുകളും പൂർണ്ണ ആരോഗ്യത്തിലാണ്. രോഗസാധ്യത വെറും 12 ശതമാനം മാത്രമാണ്."
        }
      },

      pests: {
        userText: TRANSLATIONS.t("qPestChip", lang),
        display: {
          en: `🐛 <strong>Pest Attack Diagnosis & Organic Eradication:</strong><br>• Target: <strong>Fall Armyworm (Spodoptera frugiperda)</strong> on Zone 04 Sweet Corn<br>• Pest Classification: <strong>Chewing Caterpillar (Lepidoptera / Noctuid Larva)</strong><br>• Severity: <strong>38% Foliar Whorl Damage</strong> (Window-paned foliage & frass)<br>• <strong>Fast Organic Remedy:</strong> <strong>Cold-Pressed NSKE 5% + Bacillus thuringiensis (Bt @ 2g/L)</strong><br>• Recipe: 50ml Neem extract + 20g Bt powder in 10L water + 10ml natural bio-soap.<br>• Cultural Biocontrol: 10 'T'-shaped bird perches/acre for predatory Drongos.<br>• <strong>Estimated Eradication Time:</strong> <strong>3 to 4 Days (Active feeding halts in 18 hrs!)</strong>`,
          hi: `🐛 <strong>कीट आक्रमण निदान एवं त्वरित जैविक उपचार:</strong><br>• पहचाना गया कीट: <strong>फॉल आर्मीवर्म (सैनिक सुंडी)</strong> - ज़ोन 04 मक्के में<br>• कीट का प्रकार: <strong>पत्ती चबाने वाली इल्ली / सुंडी (लेपिडोप्टेरा)</strong><br>• नुकसान: <strong>38% पत्ती कटी हुई</strong> (डंठल व पत्तियों में छेद)<br>• <strong>त्वरित जैविक उपचार:</strong> <strong>नीम बीज अर्क (NSKE 5%) + बीटी पाउडर (Bt @ 2 ग्राम/लीटर)</strong><br>• नुस्खा: 50 मिली नीम अर्क + 20 ग्राम बीटी 10 लीटर पानी में 10 मिली देशी साबुन मिलाकर सुबह छिड़कें।<br>• प्राकृतिक सुरक्षा: खेत में 10 'T' आकार की लकड़ी की खूंटियां लगाएं (पक्षी सुंडी खाएंगे)।<br>• <strong>समस्या निवारण समय:</strong> <strong>3 से 4 दिन (18 घंटे में सुंडी का खाना बंद हो जाएगा)</strong>`,
          te: `🐛 <strong>తెగులు గుర్తింపు & సేంద్రీయ నివారణ:</strong><br>• తెగులు: <strong>లద్దె పురుగు (Fall Armyworm)</strong> - జోన్ 4 మొక్కజొన్న<br>• రకం: <strong>ఆకు తినే గొంగళి పురుగు</strong><br>• <strong>సేంద్రీయ పరిష్కారం:</strong> <strong>వేప నూనె (NSKE 5%) + బీటీ పౌడర్ (2 గ్రా/లీటర్)</strong><br>• నివారణ సమయం: <strong>3 నుండి 4 రోజులు (18 గంటల్లో తినడం ఆగిపోతుంది)</strong>`,
          ta: `🐛 <strong>பூச்சி தாக்குதல் & இயற்கை தீர்வு:</strong><br>• பூச்சி: <strong>படைப்புழு (Fall Armyworm)</strong> - மண்டலம் 4 மக்காச்சோளம்<br>• வகை: <strong>இலை உண்ணும் கம்பளிப்பூச்சி</strong><br>• <strong>இயற்கை மருந்து:</strong> <strong>வேப்பெண்ணெய் (NSKE 5%) + பிடி பவுடர் (Bt 2g/L)</strong><br>• தீர்வு காலம்: <strong>3 முதல் 4 நாட்கள் (18 மணி நேரத்தில் கட்டுப்படும்)</strong>`,
          kn: `🐛 <strong>ಕೀಟ ಬಾಧೆ ಗುರುತಿಸುವಿಕೆ & ಸಾವಯವ ಪರಿಹಾರ:</strong><br>• ಕೀಟ: <strong>ಸೈನಿಕ ಹುಳು (Fall Armyworm)</strong> - ವಲಯ 4 ಜೋಳ<br>• ಪ್ರಕಾರ: <strong>ಎಲೆ ತಿನ್ನುವ ಕಂಬಳಿಹುಳು</strong><br>• <strong>ಸಾವಯವ ಔಷಧಿ:</strong> <strong>ಬೇವಿನ ಕಷಾಯ (NSKE 5%) + ಬಿಟಿ ಪುಡಿ (2g/L)</strong><br>• ಪರಿಹಾರ ಸಮಯ: <strong>3 ರಿಂದ 4 ದಿನಗಳು (18 ಗಂಟೆಯಲ್ಲಿ ಹಾನಿ ನಿಲ್ಲುತ್ತದೆ)</strong>`,
          mr: `🐛 <strong>कीड निदान आणि सेंद्रिय उपाय:</strong><br>• कीड: <strong>लष्करी अळी (Fall Armyworm)</strong> - झोन 4 मका<br>• प्रकार: <strong>पाने खाणारी अळी</strong><br>• <strong>सेंद्रिय उपाय:</strong> <strong>निंबोळी अर्क (NSKE 5%) + बीटी पावडर (2g/L)</strong><br>• निवारण वेळ: <strong>3 ते 4 दिवस (18 तासांत खाणे बंद होते)</strong>`,
          bn: `🐛 <strong>কীটপতঙ্গ আক্রমণ ও দ্রুত জৈব সমাধান:</strong><br>• কীট: <strong>ফল আর্মিওয়ার্ম (Fall Armyworm)</strong> - জোন ৪ ভুট্টা<br>• ধরন: <strong>পাতাখেকো শুঁয়োপোকা</strong><br>• <strong>জৈব ওষুধ:</strong> <strong>নিম পাতার নির্যাস (NSKE 5%) + বিটি পাউডার (Bt 2g/L)</strong><br>• সমাধানের সময়: <strong>৩ থেকে ৪ দিন (১৮ ঘণ্টার মধ্যে খাওয়া বন্ধ হবে)</strong>`,
          gu: `🐛 <strong>જીવાત ઓળખ અને સજીવ ઉપચાર:</strong><br>• જીવાત: <strong>લશ્કરી ઈયળ (Fall Armyworm)</strong> - ઝોન 4 મકાઈ<br>• પ્રકાર: <strong>પાંદડા ચાવતી ઈયળ</strong><br>• <strong>સજીવ દવા:</strong> <strong>લીંબોળી અર્ક (NSKE 5%) + બીટી પાવડર (2g/L)</strong><br>• નિવારણ સમય: <strong>3 થી 4 દિવસ (18 કલાકમાં નુકસાન બંધ)</strong>`,
          pa: `🐛 <strong>ਕੀੜੇ ਦੀ ਪਛਾਣ ਅਤੇ ਜੈਵਿਕ ਇਲਾਜ:</strong><br>• ਕੀੜਾ: <strong>ਫਾਲ ਆਰਮੀਵਰਮ ਸੁੰਡੀ</strong> - ਜ਼ੋਨ 4 ਮੱਕੀ<br>• ਕਿਸਮ: <strong>ਪੱਤੇ ਖਾਣ ਵਾਲੀ ਸੁੰਡੀ</strong><br>• <strong>ਜੈਵਿਕ ਦਵਾਈ:</strong> <strong>ਨਿੰਮ ਦਾ ਅਰਕ (NSKE 5%) + ਬੀਟੀ ਪਾਊਡਰ (2g/L)</strong><br>• ਹੱਲ ਦਾ ਸਮਾਂ: <strong>3 ਤੋਂ 4 ਦਿਨ (18 ਘੰਟਿਆਂ ਵਿੱਚ ਨੁਕਸਾਨ ਬੰਦ)</strong>`,
          ml: `🐛 <strong>കീടബാധ നിർണയവും ജൈവ പരിഹാരവും:</strong><br>• കീടം: <strong>ഫോൾ ആർമിവേം പുഴു</strong> - സോൺ 4 ചോളം<br>• തരം: <strong>ഇല തിന്നുന്ന പുഴു</strong><br>• <strong>ജൈവ മരുന്ന്:</strong> <strong>വേപ്പെണ്ണ മിശ്രിതം (NSKE 5%) + ബിടി പൗഡർ (2g/L)</strong><br>• പരിഹാര സമയം: <strong>3 മുതൽ 4 ദിവസം വരെ (18 മണിക്കൂറിൽ ശമനം)</strong>`
        },
        speech: {
          en: "Plant Doctor detected Fall Armyworm caterpillars on Zone 4 sweet corn. This is a chewing noctuid caterpillar. The fast organic remedy is a foliar spray of 5 percent Neem extract with Bacillus thuringiensis bacteria and natural soap. Feeding will halt completely in 18 hours, and the pest will be 100 percent eradicated within 3 to 4 days.",
          hi: "प्लांट डॉक्टर ने ज़ोन 4 मक्के में फॉल आर्मीवर्म सैनिक सुंडी की पहचान की है। यह पत्ती चबाने वाली सुंडी है। इसका सबसे तेज़ जैविक इलाज नीम का अर्क और बीटी पाउडर का छिड़काव है। छिड़काव के 18 घंटे में सुंडी खाना बंद कर देगी और 3 से 4 दिनों में पूरी तरह खत्म हो जाएगी।",
          te: "జోన్ 4 మొక్కజొన్నలో లద్దె పురుగును గుర్తించాము. ఇది ఆకులను తినే గొంగళి పురుగు. దీనికి వేప నూనె మరియు బీటీ పౌడర్ పిచికారీ చేయడం ఉత్తమ సేంద్రీయ పరిష్కారం. 18 గంటల్లో పురుగులు తినడం ఆపేస్తాయి, 3 నుండి 4 రోజుల్లో పూర్తిగా నశిస్తాయి.",
          ta: "மண்டலம் 4 மக்காச்சோளத்தில் படைப்புழு தாக்குதல் கண்டறியப்பட்டுள்ளது. இது இலை உண்ணும் புழு. வேப்பெண்ணெய் மற்றும் பிடி பவுடர் தெளிப்பதே சிறந்த இயற்கை தீர்வு. 18 மணி நேரத்தில் புழுக்கள் உணவு உண்பதை நிறுத்திவிடும், 3 முதல் 4 நாட்களில் முற்றிலும் அழியும்.",
          kn: "ವಲಯ 4 ರ ಜೋಳದಲ್ಲಿ ಸೈನಿಕ ಹುಳು ಬಾಧೆ ಕಂಡುಬಂದಿದೆ. ಇದು ಎಲೆ ತಿನ್ನುವ ಕೀಟ. ಬೇವಿನ ಕಷಾಯ ಮತ್ತು ಬಿಟಿ ಪುಡಿ ಸಿಂಪಡಣೆ ಅತ್ಯುತ್ತಮ ಸಾವಯವ ಔಷಧಿ. 18 ಗಂಟೆಗಳಲ್ಲಿ ಹುಳುಗಳು ತಿನ್ನುವುದನ್ನು ನಿಲ್ಲಿಸುತ್ತವೆ ಮತ್ತು 3 ರಿಂದ 4 ದಿನಗಳಲ್ಲಿ ಸಂಪೂರ್ಣ ನಾಶವಾಗುತ್ತವೆ.",
          mr: "झोन 4 मधील मक्यावर लष्करी अळीचा प्रादुर्भाव आढळला आहे. ही पाने खाणारी अळी आहे. निंबोळी अर्क आणि बीटी पावडर फवारणी हा वेगवान सेंद्रिय उपाय आहे. 18 तासांत अळ्या खाणे बंद करतील आणि 3 ते 4 दिवसांत पूर्ण नायनाट होईल.",
          bn: "জোন ৪ ভুট্টায় ফল আর্মিওয়ার্ম শুঁয়োপোকা আক্রমণ শনাক্ত হয়েছে। এটি পাতাখেকো পোকা। নিম পাতার নির্যাস ও বিটি পাউডার স্প্রে করা হলো সবচেয়ে দ্রুত জৈব সমাধান। ১৮ ঘণ্টার মধ্যে পোকা খাওয়া বন্ধ করবে এবং ৩-৪ দিনে সম্পূর্ণ নির্মূল হবে।",
          gu: "ઝોન 4 મકાઈમાં લશ્કરી ઈયળનો ઉપદ્રવ જોવા મળ્યો છે. આ પાન ખાનારી ઈયળ છે. લીંબોળી અર્ક અને બીટી પાવડરનો છંટકાવ શ્રેષ્ઠ સજીવ ઉપચાર છે. 18 કલાકમાં ઈયળો ખાવાનું બંધ કરી દેશે અને 3 થી 4 દિવસમાં સંપૂર્ણ નાશ પામશે.",
          pa: "ਜ਼ੋਨ 4 ਮੱਕੀ ਵਿੱਚ ਫਾਲ ਆਰਮੀਵਰਮ ਸੁੰਡੀ ਦੇਖੀ ਗਈ ਹੈ। ਨਿੰਮ ਦਾ ਅਰਕ ਅਤੇ ਬੀਟੀ ਪਾਊਡਰ ਇਸ ਦਾ ਤੇਜ਼ ਜੈਵਿਕ ਹੱਲ ਹੈ। 18 ਘੰਟਿਆਂ ਵਿੱਚ ਸੁੰਡੀ ਖਾਣਾ ਬੰਦ ਕਰ ਦੇਵੇਗੀ ਅਤੇ 3 ਤੋਂ 4 ਦਿਨਾਂ ਵਿੱਚ ਪੂਰੀ ਤਰ੍ਹਾਂ ਖਤਮ ਹੋ ਜਾਵੇਗੀ।",
          ml: "സോൺ 4 ചോളത്തിൽ ഫോൾ ആർമിവേം പുഴുവിന്റെ സാന്നിധ്യം കണ്ടെത്തി. വേപ്പെണ്ണ മിശ്രിതവും ബിടി പൗഡറും തളിക്കുന്നത് വേഗത്തിലുള്ള ജൈവ പരിഹാരമാണ്. 18 മണിക്കൂറിനുള്ളിൽ പുഴുക്കൾ ഇല തിന്നുന്നത് നിർത്തും, 3-4 ദിവസത്തിനുള്ളിൽ പൂർണ്ണമായും നശിക്കും."
        }
      },

      animals: {
        userText: TRANSLATIONS.t("qAnimals", lang),
        display: {
          en: `🐗 <strong>Night Security & Wildlife Deterrence:</strong><br>• Surveillance: <strong>4 Thermal Cameras Active</strong> (North, East, South, Gate)<br>• Last Incident: <strong>02:17 AM</strong> at Zone 06 South Fence<br>• Target: <strong>Possible Wild Boar</strong> (91% AI Match, 38.5°C body heat)<br>• Deterrence: <strong>Ultrasound (24kHz) + Strobe Light Automatically Fired</strong><br>• Result: Animal retreated successfully. Zero crop damage!`,
          hi: `🐗 <strong>रात की सुरक्षा और जंगली जानवर:</strong><br>• कैमरे: <strong>4 थर्मल कैमरे चालू हैं</strong> (उत्तर, पूर्व, दक्षिण बाड़, मुख्य गेट)<br>• रात की घटना: <strong>रात 2:17 बजे</strong> ज़ोन 6 दक्षिण बाड़ पर<br>• पहचान: <strong>जंगली सूअर होने की 91% संभावना</strong><br>• बचाव कार्रवाई: <strong>अल्ट्रासाउंड आवाज़ और चमकती लाइट तुरंत जल उठी</strong><br>• नतीजा: जानवर खेत से दूर भाग गया। फसल को कोई नुकसान नहीं हुआ!`,
          te: `🐗 <strong>రాత్రి భద్రత & అడవి జంతువులు:</strong><br>• నిఘా: <strong>4 థర్మల్ కెమెరాలు యాక్టివ్</strong><br>• సంఘటన: <strong>రాత్రి 2:17 గంటలకు</strong> జోన్ 6 దక్షిణ కంచె వద్ద<br>• గుర్తింపు: <strong>అడవి పంది (91% ఏఐ నిర్ధారణ)</strong><br>• చర్య: <strong>అల్ట్రాసౌండ్ మరియు స్ట్రోబ్ లైట్ ఆటోమేటిక్‌గా మోగింది</strong><br>• ఫలితం: జంతువు పారిపోయింది, పంటకు ఎటువంటి నష్టం జరగలేదు!`,
          ta: `🐗 <strong>இரவு பாதுகாப்பு & விலங்குகள்:</strong><br>• கண்காணிப்பு: <strong>4 கேமராக்கள் இயங்குகின்றன</strong><br>• இரவு நிகழ்வு: <strong>அதிகாலை 2:17 மணிக்கு</strong> மண்டலம் 6 தெற்கு வேலி அருகில்<br>• கண்டறிதல்: <strong>காட்டுப்பன்றி (91% AI உறுதி)</strong><br>• நடவடிக்கை: <strong>ஒலி மற்றும் ஸ்ட்ரோப் விளக்கு மூலம் விரட்டப்பட்டது</strong><br>• முடிவு: பயிருக்கு எந்த சேதமும் இல்லை!`,
          kn: `🐗 <strong>ರಾತ್ರಿ ಭದ್ರತೆ & ವನ್ಯಜೀವಿಗಳು:</strong><br>• ಭದ್ರತೆ: <strong>4 ಥರ್ಮಲ್ ಕ್ಯಾಮೆರಾಗಳು ಸಕ್ರಿಯ</strong><br>• ಘಟನೆ: <strong>ರಾತ್ರಿ 2:17 ಕ್ಕೆ</strong> ವಲಯ 06 ದಕ್ಷಿಣ ಬೇಲಿ ಬಳಿ<br>• ಗುರುತು: <strong>ಕಾಡುಹಂದಿ (91% AI ಖಚಿತ)</strong><br>• ರಕ್ಷಣೆ: <strong>ಅಲ್ಟ್ರಾಸೌಂಡ್ ಸದ್ದು ಮತ್ತು ಬೆಳಕಿನಿಂದ ಓಡಿಸಲಾಗಿದೆ</strong><br>• ಫಲಿತಾಂಶ: ಬೆಳೆಗೆ ಯಾವುದೇ ಹಾನಿಯಾಗಿಲ್ಲ!`,
          mr: `🐗 <strong>रात्रीची सुरक्षा आणि वन्यजीव:</strong><br>• देखरेख: <strong>4 थर्मल कॅमेरे सक्रिय आहेत</strong><br>• घटना: <strong>रात्री 2:17 वाजता</strong> झोन 6 दक्षिण कुंपणावर<br>• ओळख: <strong>रानडुक्कर (91% AI जुळणी)</strong><br>• कारवाई: <strong>अल्ट्रासाऊंड आवाज आणि फ्लॅश लाईटने पळवून लावले</strong><br>• निकाल: पिकाचे कोणतेही नुकसान झालेले नाही!`,
          bn: `🐗 <strong>রাতের নিরাপত্তা ও বন্যপ্রাণী:</strong><br>• নজরদারি: <strong>৪টি থার্মাল ক্যামেরা সক্রিয়</strong><br>• ঘটনা: <strong>রাত ২:১৭ মিনিটে</strong> জোন ৬ দক্ষিণ বেড়ায়<br>• শনাক্তকরণ: <strong>বুনো শূকর (৯১% AI ম্যাচ)</strong><br>• ব্যবস্থা: <strong>শব্দ ও আলোর সংকেতে তাড়িয়ে দেওয়া হয়েছে</strong><br>• ফলাফল: ফসলের কোনো ক্ষতি হয়নি!`,
          gu: `🐗 <strong>રાત્રિ સુરક્ષા અને વન્યજીવ:</strong><br>• દેખરેખ: <strong>4 થર્મલ કેમેરા ચાલુ છે</strong><br>• ઘટના: <strong>રાત્રે 2:17 વાગ્યે</strong> ઝોન 6 દક્ષિણ વાડ પાસે<br>• ઓળખ: <strong>જંગલી ભૂંડ (91% AI)</strong><br>• કાર્યવાહી: <strong>અલ્ટ્રાસાઉન્ડ અને લાઈટ વડે ભગાડી દેવાયું</strong><br>• પરિણામ: પાકને કોઈ નુકસાન થયું નથી!`,
          pa: `🐗 <strong>ਰਾਤ ਦੀ ਸੁਰੱਖਿਆ ਅਤੇ ਜੰਗਲੀ ਜਾਨਵਰ:</strong><br>• ਨਿਗਰਾਨੀ: <strong>4 ਥਰਮਲ ਕੈਮਰੇ ਚੱਲ ਰਹੇ ਹਨ</strong><br>• ਘਟਨਾ: <strong>ਰਾਤ 2:17 ਵਜੇ</strong> ਜ਼ੋਨ 6 ਦੱਖਣੀ ਵਾੜ ਕੋਲ<br>• ਪਛਾਣ: <strong>ਜੰਗਲੀ ਸੂਰ (91% AI ਪੁਸ਼ਟੀ)</strong><br>• ਕਾਰਵਾਈ: <strong>ਅਲਟਰਾਸਾਊਂਡ ਆਵਾਜ਼ ਅਤੇ ਲਾਈਟ ਨਾਲ ਭਜਾ ਦਿੱਤਾ ਗਿਆ</strong><br>• ਨਤੀਜਾ: ਫਸਲ ਦਾ ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ ਹੋਇਆ!`,
          ml: `🐗 <strong>രാത്രി സുരക്ഷയും വന്യജീവികളും:</strong><br>• നിരീക്ഷണം: <strong>4 തെർമൽ ക്യാമറകൾ സജീവം</strong><br>• സംഭവം: <strong>പുലർച്ചെ 2:17 ന്</strong> സോൺ 6 തെക്ക് വേലിയിൽ<br>• കണ്ടെത്തൽ: <strong>കാട്ടുപന്നി (91% AI മാച്ച്)</strong><br>• പ്രതിരോധം: <strong>അൾട്രാസൗണ്ട് ശബ്ദവും വെളിച്ചവും നൽകി തുരത്തി</strong><br>• ഫലം: വിളകൾക്ക് നാശനഷ്ടമില്ല!`
        },
        speech: {
          en: "Farm perimeter is safe. At 2:17 AM, thermal camera detected a possible wild boar at Zone 6 fence. The automated ultrasonic sound and strobe light triggered immediately, deterring the animal. There is zero damage to your crops.",
          hi: "खेत की सुरक्षा पूरी तरह मजबूत है। रात को 2 बजकर 17 मिनट पर ज़ोन 6 की बाड़ के पास जंगली सूअर देखा गया था। स्वचालित सायरन और रोशनी जलने से वह तुरंत भाग गया। आपकी फसल सुरक्षित है।",
          te: "పొలం భద్రంగా ఉంది. రాత్రి 2 గంటల 17 నిమిషాలకు జోన్ 6 కంచె వద్ద అడవి పంది రాగా, ఆటోమేటిక్ సైరన్ మరియు లైట్ ద్వారా అది పారిపోయింది. పంట సురక్షితంగా ఉంది.",
          ta: "பண்ணை பாதுகாப்பாக உள்ளது. அதிகாலை 2:17 மணிக்கு மண்டலம் 6 வேலி அருகே காட்டுப்பன்றி வந்த போது தானியங்கி ஒலி எழுப்பி விரட்டப்பட்டது. பயிர் பாதுகாப்பாக உள்ளது.",
          kn: "ಜಮೀನು ಸುರಕ್ಷಿತವಾಗಿದೆ. ರಾತ್ರಿ 2:17 ಕ್ಕೆ ಬೇಲಿ ಬಳಿ ಕಾಡುಹಂದಿ ಬಂದಾಗ ಆಟೋಮ್ಯಾಟಿಕ್ ಸದ್ದು ಮತ್ತು ಬೆಳಕಿನಿಂದ ಅದನ್ನು ಓಡಿಸಲಾಗಿದೆ. ಬೆಳೆಗೆ ಯಾವುದೇ ಹಾನಿಯಾಗಿಲ್ಲ.",
          mr: "शेत पूर्णपणे सुरक्षित आहे. रात्री 2 वाजून 17 मिनिटांनी झोन 6 च्या कुंपणावर रानडुक्कर आले होते, पण सायरन वाजल्याने ते लगेच पळून गेले. पिकाचे कोणतेही नुकसान झाले नाही.",
          bn: "খামার নিরাপদ রয়েছে। রাত ২:১৭ মিনিটে জোন ৬ এর কাছে বুনো শূকর এলে স্বয়ংক্রিয় শব্দ সংকেতে তা পালিয়ে যায়। ফসলের কোনো ক্ষতি হয়নি।",
          gu: "ખેતર સુરક્ષિત છે. રાત્રે 2:17 વાગ્યે ઝોન 6 પાસે જંગલી ભૂંડ આવ્યું હતું, પરંતુ સાયરન વાગતા તે તરત જ ભાગી ગયું. પાક સલામત છે.",
          pa: "ਖੇਤ ਬਿਲਕੁਲ ਸੁਰੱਖਿਅਤ ਹੈ। ਰਾਤ 2:17 ਵਜੇ ਜ਼ੋਨ 6 ਕੋਲ ਜੰਗਲੀ ਸੂਰ ਆਇਆ ਸੀ, ਪਰ ਸਾਇਰਨ ਅਤੇ ਲਾਈਟ ਨਾਲ ਉਹ ਭੱਜ ਗਿਆ। ਫਸਲ ਦਾ ਕੋਈ ਨੁਕਸਾਨ ਨਹੀਂ ਹੋਇਆ।",
          ml: "ഫാം സുരക്ഷിതമാണ്. പുലർച്ചെ 2:17 ന് സോൺ 6 ൽ കാട്ടുപന്നി വന്നപ്പോൾ ഓട്ടോമാറ്റിക് ശബ്ദവും വെളിച്ചവും ഉപയോഗിച്ച് ഓടിച്ചു. വിളകൾ സുരക്ഷിതമാണ്."
        }
      },

      weather: {
        userText: TRANSLATIONS.t("qWeather", lang),
        display: {
          en: `🌦️ <strong>Weather & Environment:</strong><br>• Temperature: <strong>27.4°C</strong> (Ideal Photosynthesis)<br>• Humidity: <strong>62%</strong> | Rainfall (24h): <strong>0.0 mm</strong><br>• Wind: <strong>9.2 km/h NW</strong> | Solar PAR: <strong>1,450 µmol/m²/s</strong><br>• Rain Probability: <strong>15% Low</strong><br>• Smart Irrigation Decision: <strong>“Light overcast expected; maintaining normal soil moisture thresholds.”</strong>`,
          hi: `🌦️ <strong>मौसम और बारिश की जानकारी:</strong><br>• तापमान: <strong>27.4°C</strong> (फसल विकास के लिए उत्तम)<br>• हवा में नमी: <strong>62%</strong> | पिछले 24 घंटे में बारिश: <strong>0 मिमी</strong><br>• हवा की गति: <strong>9.2 किमी/घंटा</strong><br>• आज बारिश की संभावना: <strong>15% (बहुत कम)</strong><br>• स्मार्ट सलाह: <strong>“भारी बारिश की उम्मीद नहीं है, ड्रिप सिंचाई सामान्य रूप से जारी रखें।”</strong>`,
          te: `🌦️ <strong>వాతావరణం & వర్షం:</strong><br>• ఉష్ణోగ్రత: <strong>27.4°C</strong><br>• గాలిలో తేమ: <strong>62%</strong> | వర్షం: <strong>0 మి.మీ</strong><br>• వర్షం పడే అవకాశం: <strong>15% (తక్కువ)</strong><br>• సలహా: <strong>“వర్షం సూచన లేదు, సాధారణ నీటిపారుదల కొనసాగించండి.”</strong>`,
          ta: `🌦️ <strong>வானிலை தகவல்:</strong><br>• வெப்பநிலை: <strong>27.4°C</strong><br>• காற்றில் ஈரம்: <strong>62%</strong><br>• மழை வாய்ப்பு: <strong>15% (குறைவு)</strong><br>• ஆலோசனை: <strong>“மழை வாய்ப்பு குறைவு என்பதால் பாசனத்தை தொடரலாம்.”</strong>`,
          kn: `🌦️ <strong>ಹವಾಮಾನ & ಮಳೆ:</strong><br>• ತಾಪಮಾನ: <strong>27.4°C</strong><br>• ತೇವಾಂಶ: <strong>62%</strong><br>• ಮಳೆಯ ಸಾಧ್ಯತೆ: <strong>15% (ಕಡಿಮೆ)</strong><br>• ಸಲಹೆ: <strong>“ಮಳೆಯ ಸಾಧ್ಯತೆ ಕಡಿಮೆ ಇರುವುದರಿಂದ ಸಾಮಾನ್ಯ ನೀರಾವರಿ ಮುಂದುವರಿಸಿ.”</strong>`,
          mr: `🌦️ <strong>हवामान आणि पाऊस:</strong><br>• तापमान: <strong>27.4°C</strong><br>• हवेतील आर्द्रता: <strong>62%</strong><br>• पावसाची शक्यता: <strong>15% (कमी)</strong><br>• सल्ला: <strong>“मोठ्या पावसाची शक्यता नाही, नियमित ठिबक सिंचन सुरू ठेवा.”</strong>`,
          bn: `🌦️ <strong>আবহাওয়া ও বৃষ্টি:</strong><br>• তাপমাত্রা: <strong>২৭.৪°C</strong><br>• বাতাসের আর্দ্রতা: <strong>৬২%</strong><br>• বৃষ্টির সম্ভাবনা: <strong>১৫% (কম)</strong><br>• পরামর্শ: <strong>“ভারী বৃষ্টির সম্ভাবনা নেই, স্বাভাবিক সেচ চালু রাখুন।”</strong>`,
          gu: `🌦️ <strong>હવામાન અને વરસાદ:</strong><br>• તાપમાન: <strong>27.4°C</strong><br>• હવામાં ભેજ: <strong>62%</strong><br>• વરસાદની શક્યતા: <strong>15% (ઓછી)</strong><br>• સલાહ: <strong>“વરસાદની શક્યતા ઓછી છે, નિયમિત સિંચાઈ ચાલુ રાખો.”</strong>`,
          pa: `🌦️ <strong>ਮੌਸਮ ਅਤੇ ਮੀਂਹ:</strong><br>• ਤਾਪਮਾਨ: <strong>27.4°C</strong><br>• ਹਵਾ ਵਿੱਚ ਨਮੀ: <strong>62%</strong><br>• ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ: <strong>15% (ਬਹੁਤ ਘੱਟ)</strong><br>• ਸਲਾਹ: <strong>“ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਘੱਟ ਹੈ, ਤੁਪਕਾ ਸਿੰਚਾਈ ਜਾਰੀ ਰੱਖੋ।”</strong>`,
          ml: `🌦️ <strong>കാലാവസ്ഥയും മഴയും:</strong><br>• താപനില: <strong>27.4°C</strong><br>• ഈർപ്പം: <strong>62%</strong><br>• മഴ സാധ്യത: <strong>15% (കുറവ്)</strong><br>• നിർദ്ദേശം: <strong>“മഴയ്ക്ക് സാധ്യത കുറവാണ്, ജലസേചനം തുടരാം.”</strong>`
        },
        speech: {
          en: "Current temperature is 27.4 degrees Celsius with 62 percent humidity. Rain probability is only 15 percent today, so you can continue normal drip irrigation.",
          hi: "वर्तमान तापमान 27.4 डिग्री सेल्सियस है और हवा में 62 प्रतिशत नमी है। आज बारिश की संभावना केवल 15 प्रतिशत है, इसलिए सामान्य सिंचाई जारी रखें।",
          te: "ప్రస్తుత ఉష్ణోగ్రత 27.4 డిగ్రీల సెల్సియస్. నేడు వర్షం పడే అవకాశం కేవలం 15 శాతం మాత్రమే ఉంది. సాధారణ నీటిపారుదల కొనసాగించవచ్చు.",
          ta: "தற்போதைய வெப்பநிலை 27.4 டிகிரி செல்சியஸ். இன்று மழை பெய்யும் வாய்ப்பு 15 சதவீதம் மட்டுமே உள்ளதால் பாசனத்தை தொடரலாம்.",
          kn: "ಪ್ರಸ್ತುತ ತಾಪಮಾನ 27.4 ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಇದೆ. ಇಂದು ಮಳೆಯ ಸಾಧ್ಯತೆ ಕೇವಲ 15 ಪ್ರತಿಶತ ಮಾತ್ರ ಇದೆ.",
          mr: "सध्याचे तापमान 27.4 अंश सेल्सिअस असून आज पावसाची शक्यता केवळ 15 टक्के आहे. ठिबक सिंचन सुरू ठेवा.",
          bn: "বর্তমান তাপমাত্রা ২৭.৪ ডিগ্রি সেলসিয়াস। আজ বৃষ্টির সম্ভাবনা মাত্র ১৫ শতাংশ, তাই স্বাভাবিক সেচ চালিয়ে যেতে পারেন।",
          gu: "હાલનું તાપમાન 27.4 ડિગ્રી સેલ્સિયસ છે અને વરસાદની શક્યતા ફક્ત 15 ટકા છે. સામાન્ય સિંચાઈ ચાલુ રાખો.",
          pa: "ਮੌਜੂਦਾ ਤਾਪਮਾਨ 27.4 ਡਿਗਰੀ ਸੈਲਸੀਅਸ ਹੈ ਅਤੇ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਸਿਰਫ 15 ਫ਼ੀਸਦੀ ਹੈ। ਆਮ ਸਿੰਚਾਈ ਜਾਰੀ ਰੱਖੋ।",
          ml: "നിലവിലെ താപനില 27.4 ഡിഗ്രി സെൽഷ്യസാണ്. ഇന്ന് മഴയ്ക്ക് 15 ശതമാനം മാത്രമേ സാധ്യതയുള്ളൂ. ജലസേചനം തുടരാം."
        }
      },

      income: {
        userText: TRANSLATIONS.t("qIncome", lang),
        display: {
          en: `💰 <strong>1-Acre Farm Economics & Profit:</strong><br>• Total Cultivation Cost: <strong>₹67,000</strong> (Seeds, Bio-fert, Drip, Labor)<br>• Projected Total Yield: <strong>14.45 Metric Tons (14,450 kg)</strong><br>• Estimated Gross Revenue: <strong>₹6,81,000 (6.81 Lakh)</strong><br>• Estimated Net Farmer Return: <strong>₹6,14,000 (6.14 Lakh)</strong><br>• Return on Investment: <strong>+916% ROI</strong> across 8 multi-cropped zones!`,
          hi: `💰 <strong>1-एकड़ खेत की कुल कमाई और खर्च:</strong><br>• कुल खेती लागत: <strong>₹67,000</strong> (बीज, जैविक खाद, ड्रिप, मजदूरी)<br>• अनुमानित कुल उत्पादन: <strong>14.45 टन (14,450 किलो)</strong><br>• कुल अनुमानित बिक्री (राजस्व): <strong>₹6,81,000 (6.81 लाख)</strong><br>• किसान का शुद्ध मुनाफा: <strong>₹6,14,000 (6.14 लाख)</strong><br>• शुद्ध रिटर्न: <strong>+916% मुनाफा</strong> (बहु-फसली 8 ज़ोन से)!`,
          te: `💰 <strong>1-ఎకరం ఆదాయం & లాభం:</strong><br>• మొత్తం సాగు ఖర్చు: <strong>₹67,000</strong><br>• అంచనా దిగుబడి: <strong>14.45 టన్నులు (14,450 కిలోలు)</strong><br>• మొత్తం రాబడి: <strong>₹6.81 లక్షలు</strong><br>• రైతు నికర లాభం: <strong>₹6.14 లక్షలు</strong><br>• లాభం శాతం: <strong>+916% ROI</strong>!`,
          ta: `💰 <strong>1-ஏக்கர் வருமானம் & லாபம்:</strong><br>• சாகுபடி செலவு: <strong>₹67,000</strong><br>• எதிர்பார்க்கப்படும் மகசூல்: <strong>14.45 டன்கள்</strong><br>• மொத்த வருவாய்: <strong>₹6.81 லட்சம்</strong><br>• விவசாயியின் நிகர லாபம்: <strong>₹6.14 லட்சம்</strong><br>• முதலீட்டின் மீதான லாபம்: <strong>+916%</strong>!`,
          kn: `💰 <strong>1-ಎಕರೆ ಆದಾಯ & ನಿವ್ವಳ ಲಾಭ:</strong><br>• ಒಟ್ಟು ಕೃಷಿ ವೆಚ್ಚ: <strong>₹67,000</strong><br>• ನಿರೀಕ್ಷಿತ ಇಳುವರಿ: <strong>14.45 ಟನ್</strong><br>• ಒಟ್ಟು ಆದಾಯ: <strong>₹6.81 ಲಕ್ಷ</strong><br>• ರೈತನ ನಿವ್ವಳ ಲಾಭ: <strong>₹6.14 ಲಕ್ಷ</strong><br>• ಬಂಡವಾಳದ ಮೇಲಿನ ಲಾಭ: <strong>+916%</strong>!`,
          mr: `💰 <strong>1-एकर शेताचा नफा आणि हिशोब:</strong><br>• एकूण लागवड खर्च: <strong>₹67,000</strong><br>• अपेक्षित एकूण उत्पादन: <strong>14.45 टन</strong><br>• एकूण उत्पन्न: <strong>₹6.81 लाख</strong><br>• शेतकऱ्याचा निव्वळ नफा: <strong>₹6.14 लाख</strong><br>• नफ्याचे प्रमाण: <strong>+916% ROI</strong>!`,
          bn: `💰 <strong>১-একর খামারের আয় ও লাভ:</strong><br>• মোট চাষের খরচ: <strong>₹৬৭,০০০</strong><br>• আনুমানিক মোট ফলন: <strong>১৪.৪৫ টন</strong><br>• মোট আনুমানিক বিক্রয়: <strong>₹৬.৮১ লাখ</strong><br>• কৃষকের নিট লাভ: <strong>₹৬.১৪ লাখ</strong><br>• লাভের হার: <strong>+৯১৬%</strong>!`,
          gu: `💰 <strong>1-એકર ખેતરનો નફો અને આવક:</strong><br>• કુલ ખેતી ખર્ચ: <strong>₹67,000</strong><br>• અંદાજિત ઉત્પાદન: <strong>14.45 ટન</strong><br>• કુલ વેચાણ: <strong>₹6.81 લાખ</strong><br>• ખેડૂતનો ચોખ્ખો નફો: <strong>₹6.14 લાખ</strong><br>• નફાનું પ્રમાણ: <strong>+916%</strong>!`,
          pa: `💰 <strong>1-ਏਕੜ ਖੇਤ ਦਾ ਮੁਨਾਫ਼ਾ ਅਤੇ ਆਮਦਨ:</strong><br>• ਕੁੱਲ ਖੇਤੀ ਲਾਗਤ: <strong>₹67,000</strong><br>• ਅਨੁਮਾਨਿਤ ਕੁੱਲ ਝਾੜ: <strong>14.45 ਟਨ</strong><br>• ਕੁੱਲ ਆਮਦਨ: <strong>₹6.81 ਲੱਖ</strong><br>• ਕਿਸਾਨ ਦਾ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ: <strong>₹6.14 ਲੱਖ</strong><br>• ਮੁਨਾਫ਼ੇ ਦੀ ਦਰ: <strong>+916%</strong>!`,
          ml: `💰 <strong>ഒരേക്കർ ഫാം വരുമാനവും ലാഭവും:</strong><br>• ആകെ കൃഷി ചെലവ്: <strong>₹67,000</strong><br>• പ്രതീക്ഷിക്കുന്ന വിളവ്: <strong>14.45 ടൺ</strong><br>• ആകെ വിറ്റുവരവ്: <strong>₹6.81 ലക്ഷം</strong><br>• കർഷകന്റെ അറ്റാദായം: <strong>₹6.14 ലക്ഷം</strong><br>• ലാഭ ശതമാനം: <strong>+916%</strong>!`
        },
        speech: {
          en: "From your one-acre farm, total cultivation cost is ₹67,000. Expected harvest is 14.45 tons, with estimated revenue of ₹6.81 Lakh. Your estimated net profit is ₹6.14 Lakh, giving a return of over 900 percent.",
          hi: "किसान भाई, आपके 1 एकड़ खेत में कुल लागत ₹67,000 है। कुल पैदावार 14.45 टन रहने की उम्मीद है, जिससे कुल बिक्री ₹6.81 लाख होगी। आपका शुद्ध मुनाफा ₹6.14 लाख होगा, जो 900 प्रतिशत से अधिक लाभ है।",
          te: "మీ 1 ఎకరం పొలంలో మొత్తం సాగు ఖర్చు ₹67,000. దాదాపు 14.45 టన్నుల దిగుబడితో మొత్తం ఆదాయం ₹6.81 లక్షలు వస్తుంది. మీ నికర లాభం ₹6.14 లక్షలు.",
          ta: "உங்கள் 1 ஏக்கர் பண்ணையில் மொத்த சாகுபடி செலவு ₹67,000. எதிர்பார்க்கப்படும் மகசூல் 14.45 டன்கள், மொத்த வருவாய் ₹6.81 லட்சம். உங்களின் நிகர லாபம் ₹6.14 லட்சம்.",
          kn: "ನಿಮ್ಮ 1 ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ ಒಟ್ಟು ವೆಚ್ಚ ₹67,000. ಒಟ್ಟು ಆದಾಯ ₹6.81 ಲಕ್ಷ ಬರಲಿದ್ದು, ನಿಮ್ಮ ನಿವ್ವಳ ಲಾಭ ₹6.14 ಲಕ್ಷ ಆಗಲಿದೆ.",
          mr: "आपल्या 1 एकर शेतात एकूण खर्च ₹67,000 आहे. एकूण उत्पादन 14.45 टन असून एकूण विक्री ₹6.81 लाख होईल. आपला निव्वळ नफा ₹6.14 लाख राहील.",
          bn: "আপনার ১ একর খামারে মোট খরচ ₹৬৭,০০০। আনুমানিক মোট ফলন ১৪.৪৫ টন এবং মোট বিক্রয় ₹৬.৮১ লাখ। আপনার নিট লাভ হবে ₹৬.১৪ লাখ।",
          gu: "તમારા 1 એકર ખેતરમાં કુલ ખર્ચ ₹67,000 છે. કુલ ઉત્પાદન 14.45 ટન રહેશે અને કુલ વેચાણ ₹6.81 લાખ થશે. તમારો ચોખ્ખો નફો ₹6.14 લાખ રહેશે.",
          pa: "ਤੁਹਾਡੇ 1 ਏਕੜ ਖੇਤ ਵਿੱਚ ਕੁੱਲ ਖ਼ਰਚਾ ₹67,000 ਹੈ। ਕੁੱਲ ਝਾੜ 14.45 ਟਨ ਅਤੇ ਕੁੱਲ ਵਿਕਰੀ ₹6.81 ਲੱਖ ਰਹੇਗੀ। ਤੁਹਾਡਾ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ ₹6.14 ਲੱਖ ਹੋਵੇਗਾ।",
          ml: "നിങ്ങളുടെ ഒരേക്കർ ഫാമിൽ ആകെ ചെലവ് ₹67,000 ആണ്. മൊത്തം വിറ്റുവരവ് ₹6.81 ലക്ഷവും നിങ്ങളുടെ അറ്റാദായം ₹6.14 ലക്ഷവുമായിരിക്കും."
        }
      },

      zone4: {
        userText: TRANSLATIONS.t("qZone4", lang),
        display: {
          en: `🗺️ <strong>Zone 04 Inspection Report:</strong><br>• Crop: <strong>Sweet Corn (Zea mays rugosa)</strong> (DAS: 54, Tasseling stage)<br>• Soil Moisture: <strong>22%</strong> (Below target of 42% — Attention Needed)<br>• Irrigation: <strong>💧 ACTIVE</strong> (Sub-surface pump delivering 250 Liters)<br>• Soil Temp: <strong>25.6°C</strong> | pH: <strong>6.6</strong> | EC: <strong>1.4 dS/m</strong><br>• Est. Yield: <strong>2,400 kg</strong> (Est. Value: ₹72,000)`,
          hi: `🗺️ <strong>ज़ोन 04 (मीठी मक्का) की रिपोर्ट:</strong><br>• फसल: <strong>स्वीट कॉर्न (मक्का)</strong> (बुवाई के 54 दिन, भुट्टा बनने की अवस्था)<br>• मिट्टी में नमी: <strong>22%</strong> (ज़रूरी नमी 42% से कम थी)<br>• सिंचाई: <strong>💧 चालू है</strong> (ड्रिप द्वारा 250 लीटर पानी दिया जा रहा है)<br>• मिट्टी का तापमान: <strong>25.6°C</strong> | पीएच: <strong>6.6</strong><br>• अनुमानित पैदावार: <strong>2,400 किलो</strong> (अनुमानित मूल्य: ₹72,000)`,
          te: `🗺️ <strong>జోన్ 04 నివేదిక:</strong><br>• పంట: <strong>స్వీట్ కార్న్ (మొక్కజొన్న)</strong><br>• నేల తేమ: <strong>22%</strong> (లక్ష్యం: 42%)<br>• నీటిపారుదల: <strong>నడుస్తోంది</strong> (250 లీటర్లు అందుతున్నాయి)<br>• దిగుబడి అంచనా: <strong>2,400 కిలోలు</strong>`,
          ta: `🗺️ <strong>மண்டலம் 04 அறிக்கை:</strong><br>• பயிர்: <strong>இனிப்பு சோளம்</strong><br>• மண் ஈரம்: <strong>22%</strong> (தேவையான அளவு: 42%)<br>• பாசனம்: <strong>இயங்குகிறது</strong> (250 லிட்டர் நீர் பாய்கிறது)<br>• விளைச்சல்: <strong>2,400 கிலோ</strong>`,
          kn: `🗺️ <strong>ವಲಯ 04 ವರದಿ:</strong><br>• ಬೆಳೆ: <strong>ಸಿಹಿ ಜೋಳ (Sweet Corn)</strong><br>• ತೇವಾಂಶ: <strong>22%</strong> (ಗುರಿ: 42%)<br>• ನೀರಾವರಿ: <strong>ಚಾಲನೆಯಲ್ಲಿದೆ</strong> (250 ಲೀಟರ್ ಹರಿಯುತ್ತಿದೆ)<br>• ಇಳುವರಿ: <strong>2,400 ಕೆಜಿ</strong>`,
          mr: `🗺️ <strong>झोन 04 अहवाल:</strong><br>• पीक: <strong>स्वीट कॉर्न (मका)</strong><br>• मातीतील ओलावा: <strong>22%</strong> (आवश्यक: 42%)<br>• सिंचन: <strong>सुरू आहे</strong> (250 लिटर पाणी दिले जात आहे)<br>• अपेक्षित उत्पादन: <strong>2,400 किलो</strong>`,
          bn: `🗺️ <strong>জোন ৪ প্রতিবেদন:</strong><br>• ফসল: <strong>মিষ্টি ভুট্টা (Sweet Corn)</strong><br>• মাটির আর্দ্রতা: <strong>২২%</strong> (টার্গেট: ৪২%)<br>• সেচ: <strong>চালু আছে</strong> (২৫০ লিটার পানি দেওয়া হচ্ছে)<br>• ফলন: <strong>২,৪০০ কেজি</strong>`,
          gu: `🗺️ <strong>ઝોન 04 રિપોર્ટ:</strong><br>• પાક: <strong>સ્વીટ કોર્ન (મકાઈ)</strong><br>• જમીનમાં ભેજ: <strong>22%</strong> (લક્ષ્ય: 42%)<br>• સિંચાઈ: <strong>ચાલુ છે</strong> (250 લિટર પાણી અપાઈ રહ્યું છે)<br>• ઉત્પાદન: <strong>2,400 કિલો</strong>`,
          pa: `🗺️ <strong>ਜ਼ੋਨ 04 ਰਿਪੋਰਟ:</strong><br>• ਫਸਲ: <strong>ਸਵੀਟ ਕੌਰਨ (ਮੱਕੀ)</strong><br>• ਮਿੱਟੀ ਵਿੱਚ ਨਮੀ: <strong>22%</strong> (ਲੋੜੀਂਦੀ: 42%)<br>• ਸਿੰਚਾਈ: <strong>ਚਾਲੂ ਹੈ</strong> (250 ਲੀਟਰ ਪਾਣੀ ਦਿੱਤਾ ਜਾ ਰਿਹਾ ਹੈ)<br>• ਝਾੜ: <strong>2,400 ਕਿਲੋ</strong>`,
          ml: `🗺️ <strong>സോൺ 04 റിപ്പോർട്ട്:</strong><br>• വിള: <strong>സ്വീറ്റ് കോൺ (ചോളം)</strong><br>• ഈർപ്പം: <strong>22%</strong> (ആവശ്യമായത്: 42%)<br>• ജലസേചനം: <strong>സജീവം</strong> (250 ലിറ്റർ നൽകുന്നു)<br>• വിളവ്: <strong>2,400 കിലോഗ്രാം</strong>`
        },
        speech: {
          en: "Zone 4 has sweet corn at 54 days of growth. Soil moisture was low at 22 percent, so the automated pump is currently delivering 250 liters of water. Plant health remains good at 82 percent.",
          hi: "ज़ोन 4 में मीठी मक्का लगी है। यहाँ मिट्टी में नमी 22 प्रतिशत रह गई थी, इसलिए पंप द्वारा अभी 250 लीटर पानी दिया जा रहा है। पौधों की सेहत 82 प्रतिशत अच्छी है।",
          te: "జోన్ 4 లో మొక్కజొన్న పంట ఉంది. నేలలో తేమ 22 శాతం మాత్రమే ఉండటంతో ప్రస్తుతం పంపు ద్వారా 250 లీటర్ల నీరు అందుతోంది.",
          ta: "மண்டலம் 4ல் இனிப்பு சோளப்பயிர் உள்ளது. மண் ஈரம் 22 சதவீதமாக குறைந்ததால் தற்போது 250 லிட்டர் தண்ணீர் பாய்ச்சப்பட்டு வருகிறது.",
          kn: "ವಲಯ 4 ರಲ್ಲಿ ಜೋಳದ ಬೆಳೆಯಿದೆ. ತೇವಾಂಶ 22 ಪ್ರತಿಶತ ಇರುವುದರಿಂದ ಪ್ರಸ್ತುತ 250 ಲೀಟರ್ ನೀರು ನೀಡಲಾಗುತ್ತಿದೆ.",
          mr: "झोन 4 मध्ये मक्याचे पीक आहे. मातीत ओलावा 22 टक्के असल्याने सध्या 250 लिटर पाणी दिले जात आहे.",
          bn: "জোন ৪ এ মিষ্টি ভুট্টা রয়েছে। মাটির আর্দ্রতা ২২ শতাংশ হওয়ায় বর্তমানে ২৫০ লিটার পানি দেওয়া হচ্ছে।",
          gu: "ઝોન 4 માં મકાઈનો પાક છે. જમીનમાં ભેજ 22 ટકા હોવાથી હાલ 250 લિટર પાણી અપાઈ રહ્યું છે.",
          pa: "ਜ਼ੋਨ 4 ਵਿੱਚ ਮੱਕੀ ਲੱਗੀ ਹੈ। ਮਿੱਟੀ ਵਿੱਚ ਨਮੀ 22 ਫ਼ੀਸਦੀ ਹੋਣ ਕਰਕੇ ਹੁਣ 250 ਲੀਟਰ ਪਾਣੀ ਦਿੱਤਾ ਜਾ ਰਿਹਾ ਹੈ।",
          ml: "സോൺ 4 ൽ ചോള കൃഷിയാണ്. ഈർപ്പം 22 ശതമാനമായതിനാൽ ഇപ്പോൾ 250 ലിറ്റർ വെള്ളം നൽകുന്നു."
        }
      },

      alerts: {
        userText: TRANSLATIONS.t("qAlerts", lang),
        display: {
          en: `🚨 <strong>Active Farm Alerts (2 Items):</strong><br>1. <strong>Critical:</strong> Zone 04 Sweet Corn moisture reached 22% (Threshold: 35%). Action: Sub-surface pump triggered.<br>2. <strong>Warning:</strong> CAM-03 thermal surveillance flagged possible wild boar at South Fence (02:17 AM). Deterred via ultrasound strobe.`,
          hi: `🚨 <strong>खेत की सक्रिय चेतावनियां (2 सूचनाएं):</strong><br>1. <strong>गंभीर:</strong> ज़ोन 04 मक्के में नमी 22% तक गिर गई थी। कार्रवाई: स्वचालित पंप चालू कर दिया गया है।<br>2. <strong>चेतावनी:</strong> रात 2:17 बजे दक्षिण बाड़ के पास जंगली सूअर देखा गया था, जिसे अलार्म और लाइट से भगा दिया गया।`,
          te: `🚨 <strong>తాజా హెచ్చరికలు:</strong><br>1. జోన్ 4 మొక్కజొన్నలో తేమ 22% కి పడిపోయింది. పంపు ఆన్ చేయబడింది.<br>2. రాత్రి 2:17 కు దక్షిణ కంచె వద్ద అడవి పంది కనిపించింది, సైరన్ ద్వారా తరిమివేయబడింది.`,
          ta: `🚨 <strong>முக்கிய எச்சரிக்கைகள்:</strong><br>1. மண்டலம் 4ல் ஈரம் 22% ஆக குறைந்தது. தானியங்கி பம்பு இயங்குகிறது.<br>2. இரவு 2:17 மணிக்கு காட்டுப்பன்றி வேலி அருகே வந்தது, சத்தம் மூலம் விரட்டப்பட்டது.`,
          kn: `🚨 <strong>ತಾಜಾ ಎಚ್ಚರಿಕೆಗಳು:</strong><br>1. ವಲಯ 04 ರಲ್ಲಿ ತೇವಾಂಶ 22% ಗೆ ಇಳಿದಿದೆ. ಪಂಪ್ ಆನ್ ಮಾಡಲಾಗಿದೆ.<br>2. ರಾತ್ರಿ 2:17 ಕ್ಕೆ ಬೇಲಿ ಬಳಿ ಕಾಡುಹಂದಿ ಬಂದಿತ್ತು, ಸೈರನ್ ಮೂಲಕ ಓಡಿಸಲಾಗಿದೆ.`,
          mr: `🚨 <strong>सक्रिय सूचना:</strong><br>1. झोन 04 मध्ये ओलावा 22% पर्यंत खाली आला होता. पंप सुरू केला आहे.<br>2. रात्री 2:17 वाजता दक्षिण कुंपणावर रानडुक्कर आले होते, सायरनने पळवून लावले.`,
          bn: `🚨 <strong>সক্রিয় সতর্কতা:</strong><br>১. জোন ৪ এ আর্দ্রতা ২২% এ নেমেছিল। পাম্প চালু করা হয়েছে।<br>২. রাত ২:১৭ মিনিটে বুনো শূকর এসেছিল, সংকেত দিয়ে তাড়িয়ে দেওয়া হয়েছে।`,
          gu: `🚨 <strong>સક્રિય ચેતવણીઓ:</strong><br>1. ઝોન 04 માં ભેજ 22% થઈ ગયો હતો. પંપ ચાલુ કરાયો છે.<br>2. રાત્રે 2:17 વાગ્યે જંગલી ભૂંડ આવ્યું હતું, સાયરનથી ભગાડી દેવાયું.`,
          pa: `🚨 <strong>ਤਾਜ਼ਾ ਚੇਤਾਵਨੀਆਂ:</strong><br>1. ਜ਼ੋਨ 04 ਵਿੱਚ ਨਮੀ 22% ਰਹਿ ਗਈ ਸੀ। ਪੰਪ ਚਾਲੂ ਕੀਤਾ ਗਿਆ ਹੈ।<br>2. ਰਾਤ 2:17 ਵਜੇ ਜੰਗਲੀ ਸੂਰ ਆਇਆ ਸੀ, ਸਾਇਰਨ ਨਾਲ ਭਜਾ ਦਿੱਤਾ ਗਿਆ।`,
          ml: `🚨 <strong>സജീവ മുന്നറിയിപ്പുകൾ:</strong><br>1. സോൺ 04 ൽ ഈർപ്പം 22% ആയി കുറഞ്ഞു. പമ്പ് ഓൺ ചെയ്തു.<br>2. പുലർച്ചെ 2:17 ന് കാട്ടുപന്നി വന്നിരുന്നു, ശബ്ദം നൽകി തുരത്തി.`
        },
        speech: {
          en: "You have 2 active alerts. First: Zone 4 sweet corn needed water, and the pump is currently running. Second: a possible wild boar was detected at the south fence last night and was successfully deterred. All crops are safe.",
          hi: "खेत में 2 चेतावनियां हैं। पहली: ज़ोन 4 मक्के में पानी की कमी थी, जिसके लिए पंप अभी चल रहा है। दूसरी: रात को बाड़ के पास जंगली सूअर आया था जिसे भगा दिया गया। खेत पूरी तरह सुरक्षित है।",
          te: "పొలంలో 2 హెచ్చరికలు ఉన్నాయి. మొదటిది జోన్ 4 లో నీరు అవసరం పడటంతో పంపు నడుస్తోంది. రెండవది రాత్రి వచ్చిన అడవి పందిని తరిమివేయడం జరిగింది.",
          ta: "பண்ணையில் 2 எச்சரிக்கைகள் உள்ளன. மண்டலம் 4க்கு தண்ணீர் பாய்ச்சப்படுகிறது. இரவில் வந்த காட்டுப்பன்றி விரட்டப்பட்டது. பயிர் பாதுகாப்பாக உள்ளது.",
          kn: "ಜಮೀನಿನಲ್ಲಿ 2 ಎಚ್ಚರಿಕೆಗಳಿವೆ. ವಲಯ 4 ಕ್ಕೆ ನೀರುಣಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು ರಾತ್ರಿ ಬಂದ ಕಾಡುಹಂದಿಯನ್ನು ಓಡಿಸಲಾಗಿದೆ.",
          mr: "शेतात 2 सूचना आहेत. झोन 4 मध्ये पाणी देणे सुरू आहे आणि रात्री आलेल्या रानडुकराला पळवून लावण्यात आले आहे.",
          bn: "খামারে ২টি সতর্কতা রয়েছে। জোন ৪ এ পাম্প চলছে এবং রাতে আসা বুনো শূকর তাড়িয়ে দেওয়া হয়েছে।",
          gu: "ખેતરમાં 2 ચેતવણીઓ છે. ઝોન 4 માં પંપ ચાલે છે અને રાત્રે આવેલા ભૂંડને ભગાડી દેવાયું છે.",
          pa: "ਖੇਤ ਵਿੱਚ 2 ਚੇਤਾਵਨੀਆਂ ਹਨ। ਜ਼ੋਨ 4 ਵਿੱਚ ਪੰਪ ਚੱਲ ਰਿਹਾ ਹੈ ਅਤੇ ਰਾਤ ਨੂੰ ਆਏ ਜੰਗਲੀ ਸੂਰ ਨੂੰ ਭਜਾ ਦਿੱਤਾ ਗਿਆ ਹੈ।",
          ml: "ഫാമിൽ 2 മുന്നറിയിപ്പുകളുണ്ട്. സോൺ 4 ലേക്ക് പമ്പ് പ്രവർത്തിക്കുന്നു, രാത്രി വന്ന കാട്ടുപന്നിയെ തുരത്തി."
        }
      },

      postharvest: {
        userText: TRANSLATIONS.t("qPostHarvestChip", lang),
        display: {
          en: `📦 <strong>Direct Packing & Zero-Waste Circular Studio:</strong><br>• <strong>Middleman Elimination:</strong> Sell 14.45 tons directly to buyers for <strong>₹10,42,500</strong> vs only ₹4,85,000 in mandi (+₹5,57,500 extra profit!).<br>• <strong>Smart Packaging:</strong> Eco kraft boxes with digital QR traceability seal (0.00 ppm chemical purity guarantee).<br>• <strong>Active Pre-Orders:</strong> 3 direct society contracts worth ₹45,600 secured in escrow.<br>• <strong>Zero-Waste Upcycling:</strong> 2,500 kg biomass converted to 1,200 kg vermicompost, 180 kg biochar, and 120 kg oyster mushrooms (+₹58,400 wealth value!).`,
          hi: `📦 <strong>सीधी पैकेजिंग व शून्य-कचरा प्रबंधन:</strong><br>• <strong>बिचौलिया मुक्त बिक्री:</strong> बिना मंडी दलालों के 14.45 टन सीधे बेचकर <strong>₹10,42,500</strong> मिलेंगे (मंडी से ₹5,57,500 अधिक शुद्ध मुनाफा!).<br>• <strong>स्मार्ट पैकेजिंग:</strong> इको-फ्रेंडली क्राफ्ट बॉक्स एवं डिजिटल क्यूआर कोड सील (0.00 ppm शुद्ध जैविक गारंटी)।<br>• <strong>सीधे आर्डर:</strong> हाउसिंग सोसायटियों से ₹45,600 के 3 आर्डर एस्क्रो में सुरक्षित।<br>• <strong>कचरे से कमाई:</strong> 2,500 किलो फसल अवशेष से 1,200 किलो केंचुआ खाद, 180 किलो बायोचार और 120 किलो ढींगरी मशरूम तैयार (+₹58,400 अतिरिक्त कमाई!)।`
        },
        speech: {
          en: "By packaging and selling directly to consumers without middlemen, your farm earns ₹10.42 Lakh instead of ₹4.85 Lakh in wholesale mandi, earning you ₹5.57 Lakh in extra profit. All 2.5 tons of crop residue is upcycled into vermicompost, biochar, and oyster mushrooms, generating ₹58,400 from farm waste.",
          hi: "फसल कटाई के बाद बिना किसी बिचौलिए के सीधे पैकेजिंग करके बेचने से किसान को मंडी के ₹4.85 लाख के मुकाबले ₹10.42 लाख मिलेंगे, यानी ₹5.57 लाख का सीधा फायदा! साथ ही, 2.5 टन फसल अवशेष को केंचुआ खाद, बायोचार और ढींगरी मशरूम में बदलकर ₹58,400 की अतिरिक्त कमाई होगी।"
        }
      }
    };

    const item = data[type];
    if (!item) {
      return {
        userText: "",
        display: this.getDefaultGuidanceText(lang),
        speech: this.getDefaultGuidanceSpeech(lang),
        action: null
      };
    }

    return {
      userText: item.userText,
      display: item.display[lang] || item.display.en,
      speech: item.speech[lang] || item.speech.en,
      action: null
    };
  },

  // 12. Dynamic Section Summaries for "Read Aloud"
  getSectionNarration(sectionId, lang) {
    const narrations = {
      dashboard: {
        en: "In your one-acre intelligent farm, 6 out of 8 zones are completely healthy. Average soil moisture is 48 percent and the water tank is 68 percent full. The irrigation pump is currently ON hydrating Zone 4.",
        hi: "नमस्ते किसान भाई! आपके 1 एकड़ खेत में कुल 8 ज़ोन हैं। इनमें से 6 ज़ोन बिल्कुल स्वस्थ हैं। खेत की औसत नमी 48 प्रतिशत है और पानी की टंकी 68 प्रतिशत भरी है। ज़ोन 4 में नमी कम होने के कारण पानी का पंप अभी चालू है।",
        te: "నమస్కారం రైతు సోదరా! మీ 1 ఎకరం పొలంలో మొత్తం 8 జోన్లలో 6 జోన్లు ఆరోగ్యంగా ఉన్నాయి. సగటు నేల తేమ 48 శాతం, నీటి ట్యాంక్ 68 శాతం నిండి ఉంది. ప్రస్తుతం జోన్ 4 కు పంపు నడుస్తోంది.",
        ta: "வணக்கம் விவசாயி தோழரே! உங்கள் 1 ஏக்கர் பண்ணையில் 8ல் 6 மண்டலங்கள் ஆரோக்கியமாக உள்ளன. சராசரி மண் ஈரம் 48 சதவீதம், தண்ணீர் தொட்டி 68 சதவீதம் நிறைந்துள்ளது. மண்டலம் 4க்கு பம்பு இயங்குகிறது.",
        kn: "ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! ನಿಮ್ಮ 1 ಎಕರೆ ಜಮೀನಿನಲ್ಲಿ 8 ರಲ್ಲಿ 6 ವಲಯಗಳು ಉತ್ತಮವಾಗಿವೆ. ಸರಾಸರಿ ತೇವಾಂಶ 48 ಪ್ರತಿಶತ ಮತ್ತು ನೀರಿನ ಟ್ಯಾಂಕ್ 68 ಪ್ರತಿಶತ ಭರ್ತಿಯಾಗಿದೆ.",
        mr: "नमस्कार शेतकरी बंधूंनो! आपल्या 1 एकर शेतात 8 पैकी 6 झोन निरोगी आहेत. सरासरी मातीतील ओलावा 48 टक्के असून पाण्याची टाकी 68 टक्के भरलेली आहे. झोन 4 साठी पंप सुरू आहे.",
        bn: "নমস্কার কৃষক ভাই! আপনার ১ একর খামারে ৮টির মধ্যে ৬টি জোন সম্পূর্ণ সুস্থ। গড় মাটির আর্দ্রতা ৪৮ শতাংশ এবং পানির ট্যাঙ্ক ৬৮ শতাংশ পূর্ণ। জোন ৪ এ পাম্প চলছে।",
        gu: "નમસ્તે ખેડૂત મિત્ર! તમારા 1 એકર ખેતરમાં 8 માંથી 6 ઝોન સ્વસ્થ છે. સરેરાશ ભેજ 48 ટકા છે અને ટાંકી 68 ટકા ભરેલી છે. ઝોન 4 માટે પંપ ચાલુ છે.",
        pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਤੁਹਾਡੇ 1 ਏਕੜ ਖੇਤ ਵਿੱਚ 8 ਵਿੱਚੋਂ 6 ਜ਼ੋਨ ਬਿਲਕੁਲ ਤੰਦਰੁਸਤ ਹਨ। ਔਸਤ ਨਮੀ 48 ਫ਼ੀਸਦੀ ਹੈ ਅਤੇ ਪਾਣੀ ਦੀ ਟੈਂਕੀ 68 ਫ਼ੀਸਦੀ ਭਰੀ ਹੈ। ਜ਼ੋਨ 4 ਲਈ ਪੰਪ ਚੱਲ ਰਿਹਾ ਹੈ।",
        ml: "നമസ്കാരം കർഷക മിത്രമേ! നിങ്ങളുടെ ഒരേക്കർ ഫാമിൽ 8 ൽ 6 സോണുകളും പൂർണ്ണ ആരോഗ്യത്തിലാണ്. ശരാശരി ഈർപ്പം 48 ശതമാനമാണ്. സോൺ 4 ലേക്ക് ഇപ്പോൾ പമ്പ് പ്രവർത്തിക്കുന്നു."
      },

      "farm-zones": {
        en: "Your 1-acre farm is divided into 8 precision zones. Zone 1 has Bell Peppers, Zone 2 has Tomatoes, Zone 3 has Spinach, and Zone 4 has Sweet Corn, which currently needs water at 22 percent moisture. You can click on any zone to inspect deep telemetry.",
        hi: "आपका 1 एकड़ खेत 8 हिस्सों में बंटा है। ज़ोन 1 में शिमला मिर्च, ज़ोन 2 में टमाटर, ज़ोन 3 में पालक और ज़ोन 4 में मक्का लगा है। ज़ोन 4 में नमी 22 प्रतिशत होने के कारण अभी पानी दिया जा रहा है।",
        te: "మీ 1 ఎకరం పొలం 8 జోన్లుగా విభజించబడింది. జోన్ 1 లో క్యాప్సికమ్, జోన్ 2 లో టమాటా, జోన్ 3 లో పాలకూర, జోన్ 4 లో మొక్కజొన్న ఉన్నాయి. జోన్ 4 లో తేమ 22 శాతం ఉన్నందున నీరు అందుతోంది.",
        ta: "உங்கள் 1 ஏக்கர் பண்ணை 8 பகுதிகளாக பிரிக்கப்பட்டுள்ளது. மண்டலம் 1ல் குடைமிளகாய், மண்டலம் 2ல் தக்காளி, மண்டலம் 4ல் சோளம் பயிரிடப்பட்டுள்ளது. மண்டலம் 4க்கு தற்போது தண்ணீர் பாய்ச்சப்படுகிறது.",
        kn: "ನಿಮ್ಮ 1 ಎಕರೆ ಜಮೀನನ್ನು 8 ವಲಯಗಳಾಗಿ ವಿಂಗಡಿಸಲಾಗಿದೆ. ವಲಯ 4 ರಲ್ಲಿ ಜೋಳದ ಬೆಳೆಗೆ ಈಗ ನೀರು ಹರಿಸಲಾಗುತ್ತಿದೆ.",
        mr: "आपले 1 एकर शेत 8 भागात विभागले आहे. झोन 1 मध्ये शिमला मिरची, झोन 2 मध्ये टोमॅटो आणि झोन 4 मध्ये मका आहे. झोन 4 मध्ये पाणी देणे सुरू आहे.",
        bn: "আপনার ১ একর জমি ৮টি জোনে বিভক্ত। জোন ৪ এ মিষ্টি ভুট্টায় আর্দ্রতা ২২ শতাংশ হওয়ায় সেচ চলছে।",
        gu: "તમારું 1 એકર ખેતર 8 ઝોનમાં વહેંચાયેલું છે. ઝોન 4 માં મકાઈના પાકમાં હાલ સિંચાઈ ચાલુ છે.",
        pa: "ਤੁਹਾਡਾ 1 ਏਕੜ ਖੇਤ 8 ਹਿੱਸਿਆਂ ਵਿੱਚ ਵੰਡਿਆ ਹੈ। ਜ਼ੋਨ 4 ਵਿੱਚ ਮੱਕੀ ਲੱਗੀ ਹੈ ਅਤੇ ਹੁਣ ਪਾਣੀ ਲੱਗ ਰਿਹਾ ਹੈ।",
        ml: "നിങ്ങളുടെ ഒരേക്കർ ഫാം 8 സോണുകളായി തിരിച്ചിരിക്കുന്നു. സോൺ 4 ലെ ചോളത്തിലേക്ക് ഇപ്പോൾ വെള്ളം നൽകുന്നു."
      },

      "crop-intelligence": {
        en: "Crop Intelligence analyzes plant growth and soil chemistry. AI recommends multi-cropping rotations to maximize nutrient efficiency. Total estimated farm yield is 14.45 tons.",
        hi: "फसल ज्ञान आपके खेत की मिट्टी और फसल की बढ़वार की जांच करता है। एआई तकनीक आपकी मिट्टी के हिसाब से सबसे अच्छी फसल बताती है। इस 1 एकड़ खेत से 14.45 टन पैदावार मिलने का अनुमान है।",
        te: "పంట సమాచారం నేల పోషకాలను మరియు పెరుగుదలను విశ్లేషిస్తుంది. మొత్తం 1 ఎకరంలో 14.45 టన్నుల దిగుబడి వస్తుందని ఏఐ అంచనా వేస్తోంది.",
        ta: "பயிர் தகவல் அமைப்பானது மண் சத்துக்களை ஆய்வு செய்து சிறந்த பயிர்களை பரிந்துரைக்கிறது. மொத்த விளைச்சல் 14.45 டன்களாக இருக்கும் என கணக்கிடப்பட்டுள்ளது.",
        kn: "ಬೆಳೆ ಮಾಹಿತಿ ವ್ಯವಸ್ಥೆಯು ಮಣ್ಣಿನ ಫಲವತ್ತತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ ಉತ್ತಮ ಬೆಳೆಗಳನ್ನು ಶಿಫಾರಸು ಮಾಡುತ್ತದೆ.",
        mr: "पीक माहिती प्रणाली मातीतील घटकांची तपासणी करून योग्य पिकांचा सल्ला देते.",
        bn: "ফসলের তথ্য ব্যবস্থা মাটির পুষ্টি যাচাই করে সেরা ফসলের পরামর্শ দেয়।",
        gu: "પાકની માહિતી સિસ્ટમ જમીનની ચકાસણી કરીને શ્રેષ્ઠ પાકની ભલામણ કરે છે.",
        pa: "ਫਸਲ ਜਾਣਕਾਰੀ ਪ੍ਰਣਾਲੀ ਮਿੱਟੀ ਦੀ ਪਰਖ ਕਰਕੇ ਵਧੀਆ ਫਸਲਾਂ ਦੀ ਸਲਾਹ ਦਿੰਦੀ ਹੈ।",
        ml: "വിള വിവര സംവിധാനം മണ്ണിലെ പോഷകങ്ങൾ പരിശോധിച്ച് മികച്ച വിളകൾ നിർദ്ദേശിക്കുന്നു."
      },

      "smart-irrigation": {
        en: "Smart closed-loop irrigation delivers water only when root moisture drops. The pump is currently ON in auto mode because Zone 4 dropped below threshold. Water tank has 13,600 liters in reserve.",
        hi: "स्मार्ट सिंचाई प्रणाली मिट्टी में नमी कम होने पर अपने-आप पानी देती है। अभी ऑटो मोड में पंप चालू है क्योंकि ज़ोन 4 में पानी की कमी थी। पानी की टंकी में 13,600 लीटर पानी मौजूद है।",
        te: "స్మార్ట్ నీటిపారుదల వ్యవస్థ ఆటోమేటిక్‌గా నీరు అందిస్తుంది. ప్రస్తుతం జోన్ 4 కోసం పంపు ఆన్‌లో ఉంది. ట్యాంక్‌లో 13,600 లీటర్ల నీరు నిల్వ ఉంది.",
        ta: "ஸ்மார்ட் பாசன அமைப்பானது தானாகவே நீரைப் பாய்ச்சுகிறது. தற்போது மண்டலம் 4க்கு பம்பு இயங்குகிறது. தொட்டியில் 13,600 லிட்டர் நீர் உள்ளது.",
        kn: "ಸ್ಮಾರ್ಟ್ ನೀರಾವರಿ ವ್ಯವಸ್ಥೆಯು ಅಗತ್ಯವಿದ್ದಾಗ ಮಾತ್ರ ನೀರುಣಿಸುತ್ತದೆ. ಪ್ರಸ್ತುತ ಪಂಪ್ ಆನ್ ಆಗಿದೆ.",
        mr: "स्मार्ट सिंचन प्रणाली गरजेनुसार आपोआप पाणी देते. टाकीत 13,600 लिटर पाणी शिल्लक आहे.",
        bn: "স্মার্ট সেচ ব্যবস্থা প্রয়োজনে স্বয়ংক্রিয়ভাবে পানি দেয়। বর্তমানে পাম্প চালু আছে।",
        gu: "સ્માર્ટ સિંચાઈ સિસ્ટમ જરૂરિયાત મુજબ આપમેળે પાણી આપે છે. હાલ પંપ ચાલુ છે.",
        pa: "ਸਮਾਰਟ ਸਿੰਚਾਈ ਪ੍ਰਣਾਲੀ ਲੋੜ ਪੈਣ 'ਤੇ ਆਪਣੇ ਆਪ ਪਾਣੀ ਦਿੰਦੀ ਹੈ। ਇਸ ਵੇਲੇ ਪੰਪ ਚੱਲ ਰਿਹਾ ਹੈ।",
        ml: "സ്മാർട്ട് ജലസേചന സംവിധാനം ആവശ്യമുള്ളപ്പോൾ മാത്രം വെള്ളം നൽകുന്നു. ഇപ്പോൾ പമ്പ് പ്രവർത്തിക്കുന്നു."
      },

      "plant-health": {
        en: "Overall plant health is 87 percent with optimal vegetative vigor. Folia scans show mild moisture chlorosis in Zone 4 maize, which is resolving with irrigation. Disease and pest risks are negligible.",
        hi: "फसलों का कुल स्वास्थ्य 87 प्रतिशत बहुत बढ़िया है। ज़ोन 4 मक्के में पानी की कमी से हल्का पीलापन था, जो पानी देने से ठीक हो रहा है। खेत में किसी गंभीर बीमारी या कीड़े का खतरा नहीं है।",
        te: "మొత్తం పంట ఆరోగ్యం 87 శాతం చాలా బాగుంది. తెగుళ్లు లేదా పురుగుల ముప్పు చాలా తక్కువగా ఉంది.",
        ta: "பயிர்களின் ஒட்டுமொத்த ஆரோக்கியம் 87 சதவீதம். நோய்கள் அல்லது பூச்சிகளின் ஆபத்து மிகக் குறைவு.",
        kn: "ಬೆಳೆಗಳ ಒಟ್ಟು ಆರೋಗ್ಯ 87 ಪ್ರತಿಶತ ಉತ್ತಮವಾಗಿದೆ. ರೋಗದ ಅಪಾಯ ತೀರಾ ಕಡಿಮೆ ಇದೆ.",
        mr: "पिकांचे एकूण आरोग्य 87 टक्के अतिशय चांगले आहे. रोगांचा धोका नगण्य आहे.",
        bn: "ফসলের সামগ্রিক স্বাস্থ্য ৮৭ শতাংশ চমৎকার। রোগবালাইয়ের ঝুঁকি নেই বললেই চলে।",
        gu: "પાકનું એકંદર સ્વાસ્થ્ય 87 ટકા ખૂબ સારું છે. રોગનું જોખમ ઘણું ઓછું છે.",
        pa: "ਫਸਲਾਂ ਦੀ ਕੁੱਲ ਸਿਹਤ 87 ਫ਼ੀਸਦੀ ਬਹੁਤ ਵਧੀਆ ਹੈ। ਬਿਮਾਰੀਆਂ ਦਾ ਖਤਰਾ ਨਾ ਦੇ ਬਰਾਬਰ ਹੈ।",
        ml: "വിളകളുടെ മൊത്തം ആരോഗ്യം 87 ശതമാനം മികച്ചതാണ്. രോഗസാധ്യത വളരെ കുറവാണ്."
      },

      "farm-security": {
        en: "Four night-vision thermal cameras protect your farm perimeter 24/7. Last night at 2:17 AM, a possible wild boar was detected at the south fence and was immediately deterred by ultrasonic sound and strobe light. Crops are safe.",
        hi: "खेत की चारों तरफ 4 नाइट विज़न थर्मल कैमरे लगे हैं। रात 2:17 बजे दक्षिण बाड़ के पास जंगली सूअर देखा गया था, जिसे सायरन और तेज रोशनी से तुरंत भगा दिया गया। फसल पूरी तरह सुरक्षित है।",
        te: "4 థర్మల్ కెమెరాలు రాత్రింబవళ్లు పొలాన్ని కాపాడుతున్నాయి. రాత్రి వచ్చిన అడవి పందిని ఆటోమేటిక్ సైరన్ ద్వారా తరిమివేశారు. పంట సురక్షితంగా ఉంది.",
        ta: "4 கேமராக்கள் இரவும் பகலும் பண்ணையை பாதுகாக்கின்றன. இரவில் வந்த காட்டுப்பன்றி தானியங்கி முறையில் விரட்டப்பட்டது.",
        kn: "4 ಥರ್ಮಲ್ ಕ್ಯಾಮೆರಾಗಳು ಜಮೀನಿಗೆ ಕಾವಲಿವೆ. ರಾತ್ರಿ ಬಂದ ಕಾಡುಹಂದಿಯನ್ನು ಸೈರನ್ ಮೂಲಕ ಓಡಿಸಲಾಗಿದೆ.",
        mr: "4 थर्मल कॅमेरे शेताचे 24 तास रक्षण करत आहेत. रात्री आलेल्या रानडुकराला सायरनने पळवून लावले आहे.",
        bn: "৪টি থার্মাল ক্যামেরা খামার পাহারা দিচ্ছে। রাতে আসা বুনো শূকর সংকেত দিয়ে তাড়িয়ে দেওয়া হয়েছে।",
        gu: "4 થર્મલ કેમેરા ખેતરનું રક્ષણ કરે છે. રાત્રે આવેલા જંગલી ભૂંડને સાયરનથી ભગાડી દેવાયું.",
        pa: "4 ਥਰਮਲ ਕੈਮਰੇ ਖੇਤ ਦੀ ਰਾਖੀ ਕਰ ਰਹੇ ਹਨ। ਰਾਤ ਨੂੰ ਆਏ ਜੰਗਲੀ ਸੂਰ ਨੂੰ ਸਾਇਰਨ ਨਾਲ ਭਜਾ ਦਿੱਤਾ ਗਿਆ।",
        ml: "4 തെർമൽ ക്യാമറകൾ ഫാമിന് കാവലുണ്ട്. രാത്രി വന്ന കാട്ടുപന്നിയെ തുരത്തി."
      },

      "weather-environment": {
        en: "Current farm temperature is 27.4 degrees Celsius and humidity is 62 percent. Rain probability is only 15 percent, so regular drip irrigation is recommended.",
        hi: "खेत का तापमान 27.4 डिग्री सेल्सियस है और हवा में नमी 62 प्रतिशत है। आज बारिश की संभावना केवल 15 प्रतिशत है, इसलिए ड्रिप सिंचाई जारी रखें।",
        te: "ప్రస్తుత ఉష్ணోగ్రత 27.4 డిగ్రీలు, గాలిలో తేమ 62 శాతం. వర్షం అవకాశం 15 శాతం మాత్రమే.",
        ta: "தற்போதைய வெப்பநிலை 27.4 டிகிரி. மழை பெய்யும் வாய்ப்பு 15 சதவீதம் மட்டுமே உள்ளதால் பாசனம் செய்யலாம்.",
        kn: "ಪ್ರಸ್ತುತ ತಾಪಮಾನ 27.4 ಡಿಗ್ರಿ ಸೆಲ್ಸಿಯಸ್ ಇದೆ. ಮಳೆಯ ಸಾಧ್ಯತೆ ಕೇವಲ 15 ಪ್ರತಿಶತ.",
        mr: "सध्याचे तापमान 27.4 अंश सेल्सिअस असून पावसाची शक्यता केवळ 15 टक्के आहे.",
        bn: "বর্তমান তাপমাত্রা ২৭.৪ ডিগ্রি এবং বৃষ্টির সম্ভাবনা মাত্র ১৫ শতাংশ।",
        gu: "હાલનું તાપમાન 27.4 ડિગ્રી છે અને વરસાદની શક્યતા ફક્ત 15 ટકા છે.",
        pa: "ਮੌਜੂਦਾ ਤਾਪਮਾਨ 27.4 ਡਿਗਰੀ ਹੈ ਅਤੇ ਮੀਂਹ ਦੀ ਸੰਭਾਵਨਾ ਸਿਰਫ 15 ਫ਼ੀਸਦੀ ਹੈ।",
        ml: "നിലവിലെ താപനില 27.4 ഡിഗ്രിയാണ്. മഴയ്ക്ക് 15 ശതമാനം മാത്രമേ സാധ്യതയുള്ളൂ."
      },

      "farm-economics": {
        en: "Total cultivation cost for your 1 acre is ₹67,000. Expected multi-crop harvest is 14.45 tons with estimated revenue of ₹6.81 Lakh. Your estimated net profit is ₹6.14 Lakh.",
        hi: "आपके 1 एकड़ खेत की कुल लागत ₹67,000 है। कुल पैदावार 14.45 टन रहने की उम्मीद है, जिससे कुल बिक्री ₹6.81 लाख होगी। किसान भाई का शुद्ध मुनाफा ₹6.14 लाख होगा।",
        te: "మొత్తం సాగు ఖర్చు ₹67,000. ఆశించే దిగుబడి 14.45 టన్నులు కాగా, రైతు నికర లాభం ₹6.14 లక్షలు.",
        ta: "மொத்த சாகுபடி செலவு ₹67,000. எதிர்பார்க்கப்படும் மகசூல் 14.45 டன்கள், நிகர லாபம் ₹6.14 லட்சம்.",
        kn: "ಒಟ್ಟು ಕೃಷಿ ವೆಚ್ಚ ₹67,000. ನಿರೀಕ್ಷಿತ ಆದಾಯ ₹6.81 ಲಕ್ಷ ಮತ್ತು ನಿವ್ವಳ ಲಾಭ ₹6.14 ಲಕ್ಷ.",
        mr: "एकूण खर्च ₹67,000 असून एकूण उत्पन्न ₹6.81 लाख होईल. निव्वळ नफा ₹6.14 लाख राहील.",
        bn: "মোট চাষের খরচ ₹৬৭,০০০ এবং কৃষকের আনুমানিক নিট লাভ ₹৬.১৪ লাখ।",
        gu: "કુલ ખેતી ખર્ચ ₹67,000 છે અને ખેડૂતનો ચોખ્ખો નફો ₹6.14 લાખ રહેશે.",
        pa: "ਕੁੱਲ ਖ਼ਰਚਾ ₹67,000 ਹੈ ਅਤੇ ਕਿਸਾਨ ਦਾ ਸ਼ੁੱਧ ਮੁਨਾਫ਼ਾ ₹6.14 ਲੱਖ ਹੋਵੇਗਾ।",
        ml: "ആകെ കൃഷി ചെലവ് ₹67,000 ഉം അറ്റാദായം ₹6.14 ലക്ഷവുമായിരിക്കും."
      },

      "alert-center": {
        en: "Alert center reports 2 active events: Zone 4 sweet corn required hydration and pump is running; and night thermal surveillance deterred an animal at the south fence.",
        hi: "अलर्ट सेंटर में 2 सूचनाएं हैं: ज़ोन 4 मक्के में पानी की कमी थी जिसके लिए पंप चालू है; और रात को बाड़ के पास आए जानवर को भगा दिया गया है।",
        te: "హెచ్చరికల విభాగంలో 2 సమాచారాలు ఉన్నాయి. జోన్ 4 కు నీరు అందుతోంది మరియు రాత్రి వచ్చిన జంతువును తరిమివేయడం జరిగింది.",
        ta: "எச்சரிக்கை மையத்தில் 2 பதிவுகள் உள்ளன: மண்டலம் 4க்கு தண்ணீர் பாய்கிறது மற்றும் இரவில் வந்த விலங்கு விரட்டப்பட்டது.",
        kn: "ಎಚ್ಚರಿಕೆ ಕೇಂದ್ರದಲ್ಲಿ 2 ಸೂಚನೆಗಳಿವೆ: ವಲಯ 4 ಕ್ಕೆ ನೀರು ಹರಿಸಲಾಗುತ್ತಿದೆ ಮತ್ತು ರಾತ್ರಿ ಬಂದ ಪ್ರಾಣಿಯನ್ನು ಓಡಿಸಲಾಗಿದೆ.",
        mr: "अलर्ट सेंटरमध्ये 2 नोंदी आहेत: झोन 4 मध्ये पाणी देणे सुरू आहे आणि रात्री आलेल्या प्राण्याला पळवून लावले आहे.",
        bn: "সতর্কতা কেন্দ্রে ২টি তথ্য রয়েছে: জোন ৪ এ সেচ চলছে এবং রাতে আসা বন্যপ্রাণী তাড়িয়ে দেওয়া হয়েছে।",
        gu: "ચેતવણી કેન્દ્રમાં 2 વિગતો છે: ઝોન 4 માં સિંચાઈ ચાલુ છે અને રાત્રે આવેલા પ્રાણીને ભગાડી દેવાયું.",
        pa: "ਚੇਤਾਵਨੀ ਕੇਂਦਰ ਵਿੱਚ 2 ਸੂਚਨਾਵਾਂ ਹਨ: ਜ਼ੋਨ 4 ਵਿੱਚ ਪਾਣੀ ਲੱਗ ਰਿਹਾ ਹੈ ਅਤੇ ਰਾਤ ਨੂੰ ਆਏ ਜਾਨਵਰ ਨੂੰ ਭਜਾ ਦਿੱਤਾ ਗਿਆ।",
        ml: "മുന്നറിയിപ്പ് കേന്ദ്രത്തിൽ 2 വിവരങ്ങളുണ്ട്: സോൺ 4 ലേക്ക് വെള്ളം നൽകുന്നു, രാത്രി വന്ന മൃഗത്തെ തുരത്തി."
      },

      "post-harvest-market": {
        en: "Post-harvest direct sales eliminate middlemen, increasing your profit by ₹5.57 Lakh to ₹10.42 Lakh through standardized eco-packaging and QR traceability. 2.5 tons of crop residue is upcycled into vermicompost, biochar, and oyster mushrooms, generating ₹58,400 in wealth.",
        hi: "फसल कटाई के बाद बिना बिचौलियों के सीधे पैकेजिंग और बिक्री से आपको मंडी से ₹5.57 लाख अधिक, यानी ₹10.42 लाख मिलेंगे। साथ ही, 2.5 टन फसल अवशेष को खाद, बायोचार और ढींगरी मशरूम में बदलकर ₹58,400 का अतिरिक्त लाभ कमाया जा सकता है।"
      }
    };

    const sec = narrations[sectionId];
    if (!sec) return null;
    return sec[lang] || sec.en;
  },

  getZoneNarration(zone, lang) {
    const isIrrigating = zone.irrigationStatus.includes("IRRIGATING");
    const templates = {
      en: `${zone.name}. Crop is ${zone.crop}. Soil moisture is ${zone.soilMoisture} percent against target of ${zone.targetMoisture} percent. Plant health is ${zone.plantHealth} percent. ${isIrrigating ? "Irrigation is currently active." : "Irrigation is in standby."} Estimated yield is ${zone.estimatedYield}.`,
      hi: `${zone.name}. फसल है ${zone.crop}। मिट्टी की नमी ${zone.soilMoisture} प्रतिशत है, जबकि लक्ष्य ${zone.targetMoisture} प्रतिशत है। फसल का स्वास्थ्य ${zone.plantHealth} प्रतिशत अच्छा है। ${isIrrigating ? "अभी इस ज़ोन में पानी दिया जा रहा है।" : "सिंचाई स्टैंडबाय पर है।"} अनुमानित पैदावार ${zone.estimatedYield} है।`,
      te: `${zone.name}. పంట ${zone.crop}. నేల తేమ ${zone.soilMoisture} శాతం. పంట ఆరోగ్యం ${zone.plantHealth} శాతం. అంచనా దిగుబడి ${zone.estimatedYield}.`,
      ta: `${zone.name}. பயிர் ${zone.crop}. மண் ஈரம் ${zone.soilMoisture} சதவீதம். பயிர் ஆரோக்கியம் ${zone.plantHealth} சதவீதம். எதிர்பார்க்கப்படும் மகசூல் ${zone.estimatedYield}.`,
      kn: `${zone.name}. ಬೆಳೆ ${zone.crop}. ತೇವಾಂಶ ${zone.soilMoisture} ಪ್ರತಿಶತ. ಬೆಳೆಯ ಆರೋಗ್ಯ ${zone.plantHealth} ಪ್ರತಿಶತ. ಇಳುವರಿ ${zone.estimatedYield}.`,
      mr: `${zone.name}. पीक ${zone.crop}. मातीतील ओलावा ${zone.soilMoisture} टक्के आहे. पिकाचे आरोग्य ${zone.plantHealth} टक्के आहे. अपेक्षित उत्पादन ${zone.estimatedYield}.`,
      bn: `${zone.name}. ফসল ${zone.crop}। মাটির আর্দ্রতা ${zone.soilMoisture} শতাংশ। স্বাস্থ্য ${zone.plantHealth} শতাংশ। আনুমানিক ফলন ${zone.estimatedYield}।`,
      gu: `${zone.name}. પાક ${zone.crop} છે. જમીનમાં ભેજ ${zone.soilMoisture} ટકા છે. પાકનું સ્વાસ્થ્ય ${zone.plantHealth} ટકા છે. અંદાજિત ઉત્પાદન ${zone.estimatedYield}.`,
      pa: `${zone.name}. ਫਸਲ ${zone.crop} ਹੈ। ਮਿੱਟੀ ਦੀ ਨਮੀ ${zone.soilMoisture} ਫ਼ੀਸਦੀ ਹੈ। ਫਸਲ ਦੀ ਸਿਹਤ ${zone.plantHealth} ਫ਼ੀਸਦੀ ਹੈ। ਝਾੜ ${zone.estimatedYield}.`,
      ml: `${zone.name}. വിള ${zone.crop} ആണ്. മണ്ണിലെ ഈർപ്പം ${zone.soilMoisture} ശതമാനം. വിള ആരോഗ്യം ${zone.plantHealth} ശതമാനം. വിളവ് ${zone.estimatedYield}.`
    };

    return templates[lang] || templates.en;
  },

  // Greetings and Helper strings
  getAgrarianGreeting(lang) {
    const greetings = {
      en: "Welcome farmer friend! Kisan Mitra is active. Ask me about water, crops, weather, animals or income.",
      hi: "राम राम किसान भाई! किसान मित्र आपकी सेवा में हाज़िर है। पानी, फसल, मौसम, जंगली जानवर या कमाई के बारे में पूछें।",
      te: "నమస్కారం రైతు సోదరా! రైతు మిత్ర సిద్ధంగా ఉంది. నీరు, పంట, వాతావరణం లేదా ఆదాయం గురించి అడగండి.",
      ta: "வணக்கம் விவசாயி தோழரே! உழவர் தோழன் தயாராக உள்ளது. நீர், பயிர், வானிலை அல்லது வருமானம் பற்றி கேளுங்கள்.",
      kn: "ನಮಸ್ಕಾರ ರೈತ ಬಾಂಧವರೇ! ರೈತ ಮಿತ್ರ ಸಿದ್ಧವಾಗಿದೆ. ನೀರು, ಬೆಳೆ, ಹವಾಮಾನ ಅಥವಾ ಆದಾಯದ ಬಗ್ಗೆ ಕೇಳಿ.",
      mr: "राम राम शेतकरी मित्रा! शेतकरी मित्र आपल्या सेवेत आहे. पाणी, पीक, हवामान किंवा नफ्याबद्दल विचारा.",
      bn: "নমস্কার কৃষক ভাই! কৃষক বন্ধু প্রস্তুত। পানি, ফসল, আবহাওয়া বা আয় সম্পর্কে জিজ্ঞাসা করুন।",
      gu: "નમસ્તે ખેડૂત મિત્ર! ખેડૂત મિત્ર તૈયાર છે. પાણી, પાક, હવામાન કે નફા વિશે પૂછો.",
      pa: "ਸਤਿ ਸ੍ਰੀ ਅਕਾਲ ਕਿਸਾਨ ਵੀਰੋ! ਕਿਸਾਨ ਮਿੱਤਰ ਤਿਆਰ ਹੈ। ਪਾਣੀ, ਫਸਲ, ਮੌਸਮ ਜਾਂ ਕਮਾਈ ਬਾਰੇ ਪੁੱਛੋ।",
      ml: "നമസ്കാരം കർഷക മിത്രമേ! കർഷക മിത്രം തയ്യാറാണ്. ജലം, വിളവ്, കാലാവസ്ഥ എന്നിവ ചോദിക്കുക."
    };
    return greetings[lang] || greetings.hi;
  },

  getLanguageConfirmationText(lang) {
    const confirms = {
      en: "Language set to English. You can speak or listen now.",
      hi: "भाषा हिन्दी सेट की गई है। अब आप बोल सकते हैं या सुन सकते हैं।",
      te: "భాష తెలుగులోకి మార్చబడింది. మీరు ఇప్పుడు మాట్లాడవచ్చు లేదా వినవచ్చు.",
      ta: "மொழி தமிழாக மாற்றப்பட்டுள்ளது. இப்போது நீங்கள் பேசலாம் அல்லது கேட்கலாம்.",
      kn: "ಭಾಷೆಯನ್ನು ಕನ್ನಡಕ್ಕೆ ಹೊಂದಿಸಲಾಗಿದೆ. ನೀವು ಈಗ ಮಾತನಾಡಬಹುದು.",
      mr: "भाषा मराठी निवडली आहे. आता आपण बोलू किंवा ऐकू शकता.",
      bn: "ভাষা বাংলায় পরিবর্তন করা হয়েছে। এখন আপনি কথা বলতে পারেন।",
      gu: "ભાષા ગુજરાતી સેટ કરવામાં આવી છે. હવે તમે બોલી શકો છો.",
      pa: "ਬੋਲੀ ਪੰਜਾਬੀ ਚੁਣੀ ਗਈ ਹੈ। ਹੁਣ ਤੁਸੀਂ ਬੋਲ ਸਕਦੇ ਹੋ।",
      ml: "ഭാഷ മലയാളമായി മാറ്റി. ഇനി നിങ്ങൾക്ക് സംസാരിക്കാം."
    };
    return confirms[lang] || confirms.hi;
  },

  getAssistantHelpGuide(lang) {
    const guides = {
      en: "You can ask in your native language:<br>• “How is my crop health?”<br>• “Does the farm need water?”<br>• “Turn on the pump” / “Turn off the pump”<br>• “Were there any wild animals last night?”<br>• “Will it rain today?”<br>• “What is my estimated profit?”",
      hi: "आप अपनी भाषा में पूछ सकते हैं:<br>• “मेरी फसल की सेहत कैसी है?”<br>• “खेत में पानी की स्थिति क्या है?”<br>• “पंप चालू करो” या “पंप बंद करो”<br>• “रात में कोई जंगली जानवर आया था क्या?”<br>• “आज बारिश होगी क्या?”<br>• “मेरी कुल कमाई और मुनाफा कितना है?”",
      te: "మీరు మీ భాషలో అడగవచ్చు:<br>• “పంట ఆరోగ్యం ఎలా ఉంది?”<br>• “పొలంలో నీటి పరిస్థితి ఏమిటి?”<br>• “పంపు ఆన్ చేయి” లేదా “పంపు ఆఫ్ చేయి”<br>• “రాత్రి అడవి జంతువులు వచ్చాయా?”<br>• “ఈరోజు వర్షం పడుతుందా?”<br>• “నా లాభం ఎంత?”",
      ta: "நீங்கள் உங்கள் மொழியில் கேட்கலாம்:<br>• “பயிர் நலம் எப்படி உள்ளது?”<br>• “தண்ணீர் தேவைப்படுகிறதா?”<br>• “பம்பை தொடங்கு” அல்லது “பம்பை நிறுத்து”<br>• “இரவில் விலங்குகள் வந்தனவா?”<br>• “இன்று மழை பெய்யுமா?”<br>• “மொத்த லாபம் எவ்வளவு?”",
      kn: "ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಕೇಳಬಹುದು:<br>• “ಬೆಳೆ ಹೇಗಿದೆ?”<br>• “ನೀರಿನ ಮಟ್ಟ ಎಷ್ಟಿದೆ?”<br>• “ಪಂಪ್ ಆನ್ ಮಾಡಿ”<br>• “ರಾತ್ರಿ ಪ್ರಾಣಿಗಳು ಬಂದಿದ್ದವೇ?”<br>• “ಇಂದು ಮಳೆ ಬರುತ್ತದೆಯೇ?”",
      mr: "आपण आपल्या भाषेत विचारू शकता:<br>• “माझे पीक कसे आहे?”<br>• “पाण्याची काय स्थिती आहे?”<br>• “पंप सुरू करा” किंवा “पंप बंद करा”<br>• “रात्री जंगली प्राणी आले होते का?”<br>• “एकूण नफा किती?”",
      bn: "আপনি নিজের ভাষায় জিজ্ঞাসা করতে পারেন:<br>• “ফসল কেমন আছে?”<br>• “পানির অবস্থা কি?”<br>• “পাম্প চালু করুন”<br>• “রাতে বুনো পশু এসেছিল কি?”<br>• “মোট লাভ কত?”",
      gu: "તમે તમારી ભાષામાં પૂછી શકો છો:<br>• “પાક કેવો છે?”<br>• “પાણીની સ્થિતિ શું છે?”<br>• “પંપ ચાલુ કરો”<br>• “રાત્રે પ્રાણીઓ આવ્યા હતા?”<br>• “કુલ નફો કેટલો?”",
      pa: "ਤੁਸੀਂ ਆਪਣੀ ਬੋਲੀ ਵਿੱਚ ਪੁੱਛ ਸਕਦੇ ਹੋ:<br>• “ਫਸਲ ਦੀ ਸਿਹਤ ਕਿਵੇਂ ਹੈ?”<br>• “ਪਾਣੀ ਦੀ ਕੀ ਸਥਿਤੀ ਹੈ?”<br>• “ਪੰਪ ਚਲਾਓ”<br>• “ਰਾਤ ਨੂੰ ਜਾਨਵਰ ਆਏ ਸਨ?”<br>• “ਕੁੱਲ ਮੁਨਾਫ਼ਾ ਕਿੰਨਾ ਹੈ?”",
      ml: "നിങ്ങൾക്ക് സ്വന്തം ഭാഷയിൽ ചോദിക്കാം:<br>• “വിളവ് എങ്ങനെയുണ്ട്?”<br>• “വെള്ളം ആവശ്യമുണ്ടോ?”<br>• “പമ്പ് ഓൺ ചെയ്യുക”<br>• “രാത്രി മൃഗങ്ങൾ വന്നിരുന്നോ?”"
    };
    return guides[lang] || guides.hi;
  },

  getAssistantHelpGuideSpeech(lang) {
    const speeches = {
      en: "You can ask about crop health, water levels, pump control, wild animals, rain forecast, or estimated profit.",
      hi: "आप मुझसे फसल की सेहत, पानी का स्तर, पंप चालू या बंद करना, जंगली जानवर, बारिश या मुनाफे के बारे में पूछ सकते हैं।",
      te: "మీరు పంట ఆరోగ్యం, నీటి స్థాయి, పంపు నియంత్రణ, అడవి జంతువులు, వర్షం లేదా లాభం గురించి నన్ను అడగవచ్చు.",
      ta: "பயிர் நலம், நீர் அளவு, பம்பு கட்டுப்பாடு, காட்டு விலங்குகள், மழை அல்லது லாபம் பற்றி என்னிடம் கேட்கலாம்.",
      kn: "ನೀವು ಬೆಳೆ ಆರೋಗ್ಯ, ನೀರಿನ ಮಟ್ಟ, ಪಂಪ್ ನಿಯಂತ್ರಣ, ಪ್ರಾಣಿಗಳು ಅಥವಾ ಲಾಭದ ಬಗ್ಗೆ ಕೇಳಬಹುದು.",
      mr: "आपण पिकांचे आरोग्य, पाण्याची पातळी, पंप सुरू-बंद करणे, वन्यजीव किंवा नफ्याबद्दल विचारू शकता.",
      bn: "আপনি ফসলের স্বাস্থ্য, পানির স্তর, পাম্প নিয়ন্ত্রণ, বন্যপ্রাণী বা লাভ সম্পর্কে জিজ্ঞাসা করতে পারেন।",
      gu: "તમે પાકનું સ્વાસ્થ્ય, પાણીનું સ્તર, પંપ નિયંત્રણ, વન્યજીવ કે નફા વિશે પૂછી શકો છો.",
      pa: "ਤੁਸੀਂ ਫਸਲ ਦੀ ਸਿਹਤ, ਪਾਣੀ ਦਾ ਪੱਧਰ, ਪੰਪ ਕੰਟਰੋਲ, ਜਾਨਵਰ ਜਾਂ ਮੁਨਾਫ਼ੇ ਬਾਰੇ ਪੁੱਛ ਸਕਦੇ ਹੋ।",
      ml: "വിള ആരോഗ്യം, ജലനിരപ്പ്, പമ്പ് നിയന്ത്രണം, വന്യജീവികൾ അല്ലെങ്കിൽ ലാഭം എന്നിവയെക്കുറിച്ച് ചോദിക്കാം."
    };
    return speeches[lang] || speeches.hi;
  },

  getDefaultGuidanceText(lang) {
    return this.getAssistantHelpGuide(lang);
  },

  getDefaultGuidanceSpeech(lang) {
    return this.getAssistantHelpGuideSpeech(lang);
  },

  getLocalizedText(key) {
    const strings = {
      micDeniedNotice: "माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया ब्राउज़र में माइक की अनुमति दें या नीचे अपना सवाल लिखें।",
      micRetryNotice: "आवाज साफ नहीं आई। कृपया दोबारा बोलें या नीचे दिए गए बटनों पर क्लिक करें।",
      micNotSupported: "इस ब्राउज़र में आवाज पहचान उपलब्ध नहीं है। कृपया नीचे लिखकर या बटन दबाकर पूछें।"
    };
    return strings[key] || "कृपया दोबारा प्रयास करें।";
  }
};

window.VoiceAssistant = VoiceAssistant;
