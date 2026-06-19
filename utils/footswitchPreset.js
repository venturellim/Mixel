// footswitchPreset.js — Extreme FX Rack + Presets + Controller (Versione Unificata)
// Con pannello FX a tendina stile mixer, LED BOSS style, pulsante dopo Spartito

import * as Tone from "https://esm.sh/tone";

console.log("footswitchPreset.js ver. 005 loaded");

// ============================================================
// STATO INTERNO — INIZIALIZZAZIONE LAZY
// ============================================================

let fxRack = null;
let footswitchPresets = null;
let initialized = false;
let isPanelOpen = false;

// ============================================================
// 🎛 FX RACK — INIZIALIZZAZIONE
// ============================================================

export function initFxRack() {
    if (initialized) return;
    
    console.log("🎛 Inizializzazione FX Rack...");
    
    try {
        fxRack = {

            // ===== MODULAZIONI =====
            chorus: new Tone.Chorus(0.25, 4, 0.6),
            flanger: new Tone.FeedbackDelay("16n", 0.5),
            phaser: new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350 }),
            tremolo: new Tone.Tremolo(9, 0.6),
            vibrato: new Tone.Vibrato(5, 0.3),

            // ===== DELAY =====
            delay8: new Tone.FeedbackDelay("8n", 0.35),
            delay8d: new Tone.FeedbackDelay("8n.", 0.40),
            delayQuarter: new Tone.FeedbackDelay("4n", 0.25),

            // ===== RIVERBERI =====
            reverbHall: new Tone.Reverb({ decay: 4.5, wet: 0.40 }),
            reverbPlate: new Tone.Reverb({ decay: 2.8, wet: 0.35 }),
            reverbShimmer: new Tone.Reverb({ decay: 6.0, wet: 0.60 }),

            // ===== SHIMMER =====
            shimmerPitch: new Tone.PitchShift({ pitch: 12, wet: 0.50 }),
            shimmerPitch2: new Tone.PitchShift({ pitch: 7, wet: 0.40 }),

            // ===== EQ / WIDENER =====
            eq: new Tone.EQ3({ low: -1, mid: 1, high: 2 }),
            widener: new Tone.StereoWidener(0.80),
            stereoSpread: new Tone.StereoWidener(0.90),

            // ===== AUTO FX =====
            autowah: new Tone.AutoWah({ baseFrequency: 100, octaves: 4, sensitivity: 0.5, wet: 0.7 }),
            envelopeFilter: new Tone.Filter({ type: "bandpass", frequency: 800 }),

            // ===== SPECIAL FX =====
            harmonizer5: new Tone.PitchShift({ pitch: 7, wet: 0.50 }),
            harmonizerOct: new Tone.PitchShift({ pitch: 12, wet: 0.50 }),

            // ===== DISTORSIONI =====
            distortion: new Tone.Distortion(0.6),
            overdrive: new Tone.Distortion(0.3),
            bitcrusher: new Tone.BitCrusher(4),
        };

        // Avvia gli effetti che necessitano di start()
        if (fxRack.chorus) fxRack.chorus.start();
        if (fxRack.tremolo) fxRack.tremolo.start();
        
        footswitchPresets = {

            // ===== HEAVY METAL =====
            heavyIntro: ["autowah", "eq"],
            heavyVerse: ["eq"],
            heavyChorus: ["widener", "eq"],
            heavySolo: ["delay8d", "reverbPlate", "widener"],
            heavyOutro: ["autowah", "reverbHall"],

            // ===== EPIC METAL =====
            epicIntro: ["flanger", "reverbHall"],
            epicVerse: ["chorus", "eq"],
            epicChorus: ["chorus", "delay8d", "reverbHall"],
            epicSolo: ["delay8d", "harmonizer5", "reverbHall", "widener"],
            epicOutro: ["stereoSpread", "reverbHall"],

            // ===== PROG METAL =====
            progIntro: ["phaser", "eq"],
            progVerse: ["eq"],
            progChorus: ["widener", "delayQuarter"],
            progSolo: ["delay8d", "reverbPlate", "harmonizer5", "widener"],
            progOutro: ["vibrato", "tremolo", "reverbHall"],

            // ===== BALLAD =====
            balladVerse: ["chorus", "delay8d"],
            balladChorus: ["chorus", "delay8d", "shimmerPitch", "reverbShimmer"],
            balladOutro: ["chorus", "reverbHall"],

            // ===== AMBIENT =====
            ambientIntro: ["chorus", "delay8d", "shimmerPitch", "reverbShimmer"],
            ambientPad: ["shimmerPitch", "shimmerPitch2", "reverbShimmer"],
        };

        initialized = true;
        console.log("✅ FX Rack inizializzato con successo");
        
    } catch (error) {
        console.error("❌ Errore durante l'inizializzazione del FX Rack:", error);
        fxRack = {};
        footswitchPresets = {};
        initialized = true;
    }
}

// ============================================================
// 🔥 FUNZIONE DI ROUTING — CAMBIA CATENA EFFETTI AL VOLO
// ============================================================

export function applyPreset(guitarLead, presetName) {
    initFxRack();
    
    if (!guitarLead) {
        console.warn(`⚠️ applyPreset: guitarLead non disponibile per "${presetName}"`);
        return;
    }
    
    if (!footswitchPresets || !footswitchPresets[presetName]) {
        console.warn(`⚠️ applyPreset: preset "${presetName}" non trovato`);
        try {
            guitarLead.disconnect();
            guitarLead.connect(Tone.Destination);
        } catch(e) {}
        return;
    }

    try {
        guitarLead.disconnect();
        const chain = footswitchPresets[presetName]
            .map(name => fxRack[name])
            .filter(fx => fx !== undefined && fx !== null);

        if (chain.length === 0) {
            guitarLead.connect(Tone.Destination);
            console.log(`🎛 Preset ${presetName}: clean (no FX)`);
            return;
        }

        guitarLead.chain(...chain, Tone.Destination);
        console.log(`🎛 Preset ${presetName}: ${chain.map(fx => fx.constructor?.name || 'FX').join(' → ')}`);
        
    } catch(error) {
        console.error(`❌ Errore applicazione preset ${presetName}:`, error);
        try {
            guitarLead.disconnect();
            guitarLead.connect(Tone.Destination);
        } catch(e) {}
    }
}

// ============================================================
// 🎛️ CONTROLLO PARAMETRI IN TEMPO REALE
// ============================================================

export function getEffectParams(effectName) {
    initFxRack();
    
    const effect = fxRack[effectName];
    if (!effect) return null;
    
    const paramMap = {
        chorus: {
            frequency: { min: 0.1, max: 10, step: 0.1, label: "Rate", unit: "Hz" },
            depth: { min: 0, max: 1, step: 0.01, label: "Depth", unit: "" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        tremolo: {
            frequency: { min: 1, max: 20, step: 0.5, label: "Rate", unit: "Hz" },
            depth: { min: 0, max: 1, step: 0.01, label: "Depth", unit: "" }
        },
        vibrato: {
            frequency: { min: 1, max: 15, step: 0.5, label: "Rate", unit: "Hz" },
            depth: { min: 0, max: 1, step: 0.01, label: "Depth", unit: "" }
        },
        delay8d: {
            delayTime: { min: 0.1, max: 2, step: 0.01, label: "Time", unit: "s" },
            feedback: { min: 0, max: 0.9, step: 0.01, label: "Feedback", unit: "" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        delay8: {
            delayTime: { min: 0.1, max: 1.5, step: 0.01, label: "Time", unit: "s" },
            feedback: { min: 0, max: 0.9, step: 0.01, label: "Feedback", unit: "" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        reverbHall: {
            decay: { min: 0.5, max: 10, step: 0.5, label: "Decay", unit: "s" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        reverbPlate: {
            decay: { min: 0.5, max: 6, step: 0.5, label: "Decay", unit: "s" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        reverbShimmer: {
            decay: { min: 1, max: 12, step: 0.5, label: "Decay", unit: "s" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        autowah: {
            baseFrequency: { min: 50, max: 500, step: 10, label: "Freq", unit: "Hz" },
            octaves: { min: 1, max: 6, step: 0.5, label: "Octaves", unit: "" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        phaser: {
            frequency: { min: 0.1, max: 5, step: 0.1, label: "Rate", unit: "Hz" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        flanger: {
            delayTime: { min: 0.05, max: 0.5, step: 0.01, label: "Delay", unit: "s" },
            feedback: { min: 0, max: 0.9, step: 0.01, label: "Feedback", unit: "" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        },
        widener: {
            width: { min: 0, max: 1, step: 0.01, label: "Width", unit: "" }
        },
        harmonizer5: {
            pitch: { min: -12, max: 12, step: 0.5, label: "Pitch", unit: "st" },
            wet: { min: 0, max: 1, step: 0.01, label: "Mix", unit: "" }
        }
    };
    
    return paramMap[effectName] || null;
}

export function setEffectParam(effectName, paramName, value) {
    initFxRack();
    
    const effect = fxRack[effectName];
    if (!effect) {
        console.warn(`⚠️ Effetto "${effectName}" non trovato`);
        return false;
    }
    
    try {
        if (effect[paramName] && typeof effect[paramName].value !== 'undefined') {
            effect[paramName].value = value;
            return true;
        } else if (typeof effect[paramName] === 'function') {
            effect[paramName](value);
            return true;
        } else if (paramName.includes('.')) {
            const parts = paramName.split('.');
            let target = effect;
            for (let i = 0; i < parts.length - 1; i++) {
                target = target[parts[i]];
                if (!target) throw new Error(`Property ${parts[i]} not found`);
            }
            const lastKey = parts[parts.length - 1];
            if (target[lastKey] && typeof target[lastKey].value !== 'undefined') {
                target[lastKey].value = value;
                return true;
            }
        }
        console.warn(`⚠️ Parametro "${paramName}" non trovato su "${effectName}"`);
        return false;
    } catch(e) {
        console.warn(`⚠️ Errore impostazione ${effectName}.${paramName}:`, e);
        return false;
    }
}

export function getEffectParam(effectName, paramName) {
    initFxRack();
    
    const effect = fxRack[effectName];
    if (!effect) return null;
    
    try {
        if (effect[paramName] && typeof effect[paramName].value !== 'undefined') {
            return effect[paramName].value;
        }
        if (paramName.includes('.')) {
            const parts = paramName.split('.');
            let target = effect;
            for (let i = 0; i < parts.length; i++) {
                target = target[parts[i]];
                if (!target) return null;
            }
            if (typeof target.value !== 'undefined') return target.value;
            return target;
        }
        return null;
    } catch(e) {
        return null;
    }
}

export function getAvailableEffects() {
    initFxRack();
    return Object.keys(fxRack || {});
}

// ============================================================
// 🎛️ UI — CREAZIONE PANNELLO CONTROLLI (STILE MIXER)
// ============================================================

export function initFxController() {
    console.log("🎛️ Inizializzazione FX Controller...");
    
    // Crea il pulsante FX dopo Spartito
    createFxButton();
    
    // Crea il pannello a tendina (stile mixer)
    createFxPanel();
    
    // Setup event listeners
    setupEventListeners();
    
    // Genera i controlli per gli effetti
    buildEffectControls();
    
    console.log("✅ FX Controller pronto!");
}

// ============================================================
// CREA PULSANTE FX (DOPO SPARTITO)
// ============================================================

function createFxButton() {
    const playerControls = document.querySelector('.player-controls');
    if (!playerControls) {
        console.warn("⚠️ .player-controls non trovato");
        return;
    }
    
    if (document.getElementById('btnFxEffects')) return;
    
    const btn = document.createElement('button');
    btn.id = 'btnFxEffects';
    btn.textContent = '🎚️ FX';
    btn.className = 'fx-effects-btn';
    btn.style.cssText = `
        background: rgba(255,255,255,0.1);
        border: 1px solid rgba(255,255,255,0.2);
        border-radius: 30px;
        color: #fff;
        padding: 8px 14px;
        cursor: pointer;
        font-size: 13px;
        transition: all 0.2s;
    `;
    
    // Cerca il pulsante Spartito e inserisci DOPO
    const spartitoBtn = document.getElementById('btnSpartito');
    if (spartitoBtn && spartitoBtn.nextSibling) {
        playerControls.insertBefore(btn, spartitoBtn.nextSibling);
    } else if (spartitoBtn) {
        playerControls.appendChild(btn);
    } else {
        // Se non c'è spartito, metti alla fine
        playerControls.appendChild(btn);
    }
    
    console.log("✅ Pulsante FX aggiunto dopo Spartito");
}

// ============================================================
// CREA PANNELLO FX (STILE MIXER — SCENDE DALL'ALTO)
// ============================================================

function createFxPanel() {
    if (document.getElementById('fxEffectsPanel')) return;
    
    const panel = document.createElement('div');
    panel.id = 'fxEffectsPanel';
    panel.className = 'fx-effects-panel';
    panel.style.cssText = `
        position: fixed;
        top: -100%;
        left: 0;
        right: 0;
        background: rgba(0, 0, 0, 0.95);
        backdrop-filter: blur(20px);
        border-bottom-left-radius: 20px;
        border-bottom-right-radius: 20px;
        padding: 20px;
        transition: top 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        z-index: 1000;
        max-height: 80vh;
        overflow-y: auto;
        box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    `;
    
    panel.innerHTML = `
        <div class="panel-header">
            <h2>🎚️ Controlli Effetti</h2>
            <button id="closeFxEffectsPanel" class="close-panel-btn">✖</button>
        </div>
        <div class="fx-search">
            <input type="text" id="fx-effects-search" placeholder="🔍 Cerca effetto..." style="
                width: 100%;
                padding: 10px 16px;
                border-radius: 10px;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.05);
                color: #fff;
                font-size: 14px;
                outline: none;
                box-sizing: border-box;
                margin-bottom: 15px;
            ">
        </div>
        <div id="fx-effects-content"></div>
        <div style="
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding-top: 15px;
            border-top: 1px solid rgba(255,255,255,0.1);
            margin-top: 15px;
        ">
            <button id="fx-effects-reset" style="
                background: rgba(255,107,107,0.15);
                border: 1px solid rgba(255,107,107,0.2);
                color: #ff6b6b;
                padding: 8px 20px;
                border-radius: 8px;
                cursor: pointer;
                font-size: 13px;
                transition: all 0.3s;
            ">🔄 Reset All</button>
            <span id="fx-effects-status" style="font-size: 12px; color: #4ecdc4;">✅ Live</span>
        </div>
    `;
    
    document.body.appendChild(panel);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    const btn = document.getElementById('btnFxEffects');
    const panel = document.getElementById('fxEffectsPanel');
    const close = document.getElementById('closeFxEffectsPanel');
    const search = document.getElementById('fx-effects-search');
    const reset = document.getElementById('fx-effects-reset');
    
    if (btn && panel) {
        btn.addEventListener('click', () => {
            panel.classList.toggle('show');
            btn.style.background = panel.classList.contains('show') 
                ? 'rgba(255,107,107,0.3)' 
                : 'rgba(255,255,255,0.1)';
            btn.style.borderColor = panel.classList.contains('show') 
                ? '#ff6b6b' 
                : 'rgba(255,255,255,0.2)';
        });
    }
    
    if (close && panel) {
        close.addEventListener('click', () => {
            panel.classList.remove('show');
            if (btn) {
                btn.style.background = 'rgba(255,255,255,0.1)';
                btn.style.borderColor = 'rgba(255,255,255,0.2)';
            }
        });
    }
    
    if (search) {
        search.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.fx-effect-group').forEach(group => {
                const name = group.dataset.effect.toLowerCase();
                group.style.display = name.includes(query) ? 'block' : 'none';
            });
        });
    }
    
    if (reset) {
        reset.addEventListener('click', resetAllEffects);
    }
}

// ============================================================
// COSTRUISCI CONTROLLI CON LED (BOSS STYLE)
// ============================================================

function buildEffectControls() {
    const container = document.getElementById('fx-effects-content');
    if (!container) return;
    
    container.innerHTML = '';
    
    const effects = getAvailableEffects();
    const sortedEffects = effects.sort();
    const effectsWithParams = sortedEffects.filter(name => getEffectParams(name) !== null);
    
    if (effectsWithParams.length === 0) {
        container.innerHTML = '<div style="text-align:center;color:#555;padding:30px 0;">Nessun effetto disponibile</div>';
        return;
    }
    
    // Raggruppa effetti per categoria
    const categories = {
        modulazione: ['chorus', 'flanger', 'phaser', 'tremolo', 'vibrato'],
        delay: ['delay8', 'delay8d', 'delayQuarter'],
        riverbero: ['reverbHall', 'reverbPlate', 'reverbShimmer'],
        shimmer: ['shimmerPitch', 'shimmerPitch2'],
        eq: ['eq', 'widener', 'stereoSpread'],
        auto: ['autowah', 'envelopeFilter'],
        special: ['harmonizer5', 'harmonizerOct'],
        distorsione: ['distortion', 'overdrive', 'bitcrusher']
    };
    
    // Ordina effetti per categoria
    const categorizedEffects = [];
    Object.entries(categories).forEach(([category, effectList]) => {
        effectList.forEach(name => {
            if (effectsWithParams.includes(name)) {
                categorizedEffects.push({ name, category });
            }
        });
    });
    
    // Aggiungi effetti non categorizzati
    effectsWithParams.forEach(name => {
        if (!categorizedEffects.find(e => e.name === name)) {
            categorizedEffects.push({ name, category: 'altro' });
        }
    });
    
    // Crea i gruppi per categoria
    let currentCategory = '';
    categorizedEffects.forEach(({ name, category }) => {
        if (category !== currentCategory) {
            currentCategory = category;
            const categoryTitle = document.createElement('div');
            categoryTitle.style.cssText = `
                font-size: 11px;
                text-transform: uppercase;
                letter-spacing: 2px;
                color: #666;
                padding: 15px 0 8px 0;
                border-bottom: 1px solid rgba(255,255,255,0.05);
                margin-bottom: 10px;
            `;
            categoryTitle.textContent = category.toUpperCase();
            container.appendChild(categoryTitle);
        }
        
        const group = createEffectGroupWithLED(name, getEffectParams(name));
        container.appendChild(group);
    });
}

// ============================================================
// CREA GRUPPO EFFETTO CON LED (BOSS STYLE)
// ============================================================

function createEffectGroupWithLED(effectName, params) {
    const group = document.createElement('div');
    group.className = 'fx-effect-group';
    group.dataset.effect = effectName;
    group.style.cssText = `
        margin-bottom: 10px;
        background: rgba(255,255,255,0.03);
        border-radius: 10px;
        padding: 10px 14px;
        border: 1px solid rgba(255,255,255,0.04);
        transition: all 0.3s;
    `;
    
    // Stato dell'effetto (ON/OFF)
    const isActive = checkIfEffectActive(effectName);
    
    // Header con LED (BOSS style)
    const header = document.createElement('div');
    header.style.cssText = `
        display: flex;
        justify-content: space-between;
        align-items: center;
        cursor: pointer;
        user-select: none;
    `;
    
    // LED + Nome
    const ledContainer = document.createElement('div');
    ledContainer.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
    `;
    
    // LED
    const led = document.createElement('div');
    led.className = 'fx-led';
    led.style.cssText = `
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: ${isActive ? '#ff3333' : '#222'};
        box-shadow: ${isActive ? '0 0 10px rgba(255,51,51,0.5)' : 'none'};
        transition: all 0.3s;
        flex-shrink: 0;
        border: 1px solid ${isActive ? 'rgba(255,51,51,0.3)' : 'rgba(255,255,255,0.05)'};
    `;
    ledContainer.appendChild(led);
    
    // Nome
    const nameSpan = document.createElement('span');
    nameSpan.style.cssText = `
        font-size: 13px;
        color: ${isActive ? '#fff' : '#666'};
        font-weight: ${isActive ? '600' : '400'};
        transition: color 0.3s;
    `;
    nameSpan.textContent = formatEffectName(effectName);
    ledContainer.appendChild(nameSpan);
    
    header.appendChild(ledContainer);
    
    // Toggle
    const toggleBtn = document.createElement('button');
    toggleBtn.style.cssText = `
        background: none;
        border: none;
        color: #555;
        font-size: 14px;
        cursor: pointer;
        transition: transform 0.3s;
        padding: 0 4px;
    `;
    toggleBtn.textContent = '▼';
    toggleBtn.classList.add('fx-toggle-btn');
    header.appendChild(toggleBtn);
    
    group.appendChild(header);
    
    // Body con parametri
    const body = document.createElement('div');
    body.className = 'fx-params-body';
    body.style.cssText = `
        margin-top: 10px;
        display: none;
        padding-top: 10px;
        border-top: 1px solid rgba(255,255,255,0.05);
    `;
    
    // Parametri
    Object.entries(params).forEach(([paramName, paramConfig]) => {
        const paramDiv = document.createElement('div');
        paramDiv.className = 'fx-param';
        paramDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 4px 0;
        `;
        
        const currentValue = getEffectParam(effectName, paramName);
        const value = currentValue !== null ? currentValue : paramConfig.min;
        
        paramDiv.innerHTML = `
            <label style="
                font-size: 10px;
                color: #888;
                width: 50px;
                flex-shrink: 0;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            ">${paramConfig.label}</label>
            <input type="range" 
                   min="${paramConfig.min}" 
                   max="${paramConfig.max}" 
                   step="${paramConfig.step}" 
                   value="${value}"
                   data-effect="${effectName}"
                   data-param="${paramName}"
                   style="
                       flex: 1;
                       height: 3px;
                       -webkit-appearance: none;
                       appearance: none;
                       background: linear-gradient(to right, #2a2a3a, #ff6b6b);
                       border-radius: 2px;
                       outline: none;
                       cursor: pointer;
                   ">
            <span class="fx-param-value" style="
                font-size: 10px;
                color: #ff6b6b;
                min-width: 40px;
                text-align: right;
                font-family: monospace;
            ">${Number(value).toFixed(2)}</span>
            ${paramConfig.unit ? `<span style="font-size: 9px; color: #555; min-width: 18px;">${paramConfig.unit}</span>` : ''}
        `;
        
        // Slider event
        const slider = paramDiv.querySelector('input[type="range"]');
        const valueDisplay = paramDiv.querySelector('.fx-param-value');
        
        slider.addEventListener('input', () => {
            const val = parseFloat(slider.value);
            valueDisplay.textContent = val.toFixed(2);
            setEffectParam(effectName, paramName, val);
            
            const status = document.getElementById('fx-effects-status');
            if (status) {
                status.textContent = '⚡ Live';
                status.style.color = '#ff6b6b';
                setTimeout(() => {
                    status.textContent = '✅ Live';
                    status.style.color = '#4ecdc4';
                }, 500);
            }
        });
        
        body.appendChild(paramDiv);
    });
    
    group.appendChild(body);
    
    // Toggle body
    toggleBtn.addEventListener('click', () => {
        const isOpen = body.style.display === 'block';
        body.style.display = isOpen ? 'none' : 'block';
        toggleBtn.style.transform = isOpen ? 'rotate(0deg)' : 'rotate(180deg)';
    });
    
    // Hover effect
    group.addEventListener('mouseenter', () => {
        group.style.borderColor = 'rgba(255,107,107,0.2)';
    });
    group.addEventListener('mouseleave', () => {
        group.style.borderColor = 'rgba(255,255,255,0.04)';
    });
    
    return group;
}

// ============================================================
// CHECK IF EFFECT IS ACTIVE
// ============================================================

function checkIfEffectActive(effectName) {
    // Verifica se l'effetto è presente nel fxRack
    // Il LED rosso indica che l'effetto è disponibile
    return fxRack && fxRack[effectName] !== undefined;
}

// ============================================================
// RESET TUTTI GLI EFFETTI
// ============================================================

function resetAllEffects() {
    document.querySelectorAll('.fx-effect-group .fx-param input[type="range"]').forEach(slider => {
        const effectName = slider.dataset.effect;
        const paramName = slider.dataset.param;
        const defaultValue = parseFloat(slider.min);
        
        slider.value = defaultValue;
        const valueDisplay = slider.parentElement.querySelector('.fx-param-value');
        if (valueDisplay) valueDisplay.textContent = defaultValue.toFixed(2);
        setEffectParam(effectName, paramName, defaultValue);
    });
    
    const status = document.getElementById('fx-effects-status');
    if (status) {
        status.textContent = '🔄 Reset!';
        status.style.color = '#ff6b6b';
        setTimeout(() => {
            status.textContent = '✅ Live';
            status.style.color = '#4ecdc4';
        }, 1000);
    }
}

// ============================================================
// UTILITY
// ============================================================

function formatEffectName(name) {
    return name
        .replace(/([A-Z])/g, ' $1')
        .replace(/(\d+)/g, ' $1')
        .replace(/^./, str => str.toUpperCase())
        .trim();
}

// ============================================================
// TOGGLE FX PANEL
// ============================================================

export function toggleFxEffectsPanel() {
    const panel = document.getElementById('fxEffectsPanel');
    if (panel) {
        panel.classList.toggle('show');
        const btn = document.getElementById('btnFxEffects');
        if (btn) {
            btn.style.background = panel.classList.contains('show') 
                ? 'rgba(255,107,107,0.3)' 
                : 'rgba(255,255,255,0.1)';
            btn.style.borderColor = panel.classList.contains('show') 
                ? '#ff6b6b' 
                : 'rgba(255,255,255,0.2)';
        }
    }
}

// ============================================================
// UTILITY — PER DEBUG
// ============================================================

export function getFxRackStatus() {
    return {
        initialized,
        effectsCount: fxRack ? Object.keys(fxRack).length : 0,
        presetsCount: footswitchPresets ? Object.keys(footswitchPresets).length : 0,
    };
}

// ============================================================
// CLASSIFICAZIONE GROOVE → FAMIGLIA
// ============================================================

export const grooveFamilies = {
    gallop_classic: "heavy",
    gallop_triplet: "heavy",
    thrash_diamond: "heavy",
    palm_mute_chug: "heavy",
    motorhead_drive: "heavy",
    speed_metal: "heavy",
    death_roll: "heavy",
    thrash_skank: "heavy",
    groove_metal: "heavy",
    epic_verse_open: "epic",
    epic_verse_ride: "epic",
    epic_verse_pad: "epic",
    epic_pre_timpani: "epic",
    epic_pre_build: "epic",
    epic_pre_sustain: "epic",
    epic_chorus_anthem: "epic",
    epic_chorus_sustain: "epic",
    epic_chorus_double: "epic",
    symphonic_blast: "epic",
    cinematic_buildup: "epic",
    technical_sync: "prog",
    meshuggah_ish: "prog",
    prog_odd: "prog",
    djent: "prog",
    ballad_intro_strum: "ballad",
    ballad_intro_slow: "ballad",
    ballad_verse_simple: "ballad",
    ballad_verse_strum: "ballad",
    ballad_pre_build: "ballad",
    ballad_chorus_full: "ballad",
    ballad_chorus_simple: "ballad",
    intro_ambient: "ambient",
    stoner_doom: "ambient",
    doom_slow: "ambient"
};

export const familyPresetMap = {
    heavy: {
        intro: "heavyIntro",
        verse: "heavyVerse",
        prechorus: "heavyVerse",
        chorus: "heavyChorus",
        solo: "heavySolo",
        outro: "heavyOutro"
    },
    epic: {
        intro: "epicIntro",
        verse: "epicVerse",
        prechorus: "epicVerse",
        chorus: "epicChorus",
        solo: "epicSolo",
        outro: "epicOutro"
    },
    prog: {
        intro: "progIntro",
        verse: "progVerse",
        prechorus: "progVerse",
        chorus: "progChorus",
        solo: "progSolo",
        outro: "progOutro"
    },
    ballad: {
        intro: "balladVerse",
        verse: "balladVerse",
        prechorus: "balladVerse",
        chorus: "balladChorus",
        solo: "balladChorus",
        outro: "balladOutro"
    },
    ambient: {
        intro: "ambientIntro",
        verse: "ambientPad",
        prechorus: "ambientPad",
        chorus: "ambientIntro",
        solo: "ambientPad",
        outro: "ambientIntro"
    }
};

export function getPresetForGroove(grooveName, sectionName) {
    const family = grooveFamilies[grooveName] || "heavy";
    const sec = sectionName.toLowerCase();
    let secType = "verse";
    if (sec.includes("intro")) secType = "intro";
    else if (sec.includes("pre")) secType = "prechorus";
    else if (sec.includes("chorus")) secType = "chorus";
    else if (sec.includes("solo") || sec.includes("bridge")) secType = "solo";
    else if (sec.includes("outro")) secType = "outro";
    return familyPresetMap[family][secType];
}