// footswitchPreset.js — Extreme FX Rack + Presets + Controller  (Petrucci Style)
// Versione con inizializzazione lazy per evitare problemi di caricamento

import * as Tone from "https://esm.sh/tone";

console.log("footswitchPreset.js ver. 007 loaded");

// ============================================================
// STATO INTERNO — INIZIALIZZAZIONE LAZY
// ============================================================

let fxRack = null;
let footswitchPresets = null;
let initialized = false;
let isPanelOpen = false;
let currentPresetName = null;
let currentPresetEffects = [];
let lfoAnimationId = null; 

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
    
    // ✅ Se non c'è guitarLead, resetta gli effetti correnti
    if (!guitarLead) {
        console.warn(`⚠️ applyPreset: guitarLead non disponibile per "${presetName}"`);
        currentPresetEffects = [];
        currentPresetName = null;
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
        currentPresetName = presetName;
        currentPresetEffects = footswitchPresets[presetName] || [];
        
        guitarLead.disconnect();
        const chain = currentPresetEffects
            .map(name => fxRack[name])
            .filter(fx => fx !== undefined && fx !== null);

        if (chain.length === 0) {
            guitarLead.connect(Tone.Destination);
            console.log(`🎛 Preset ${presetName}: clean (no FX)`);
            return;
        }

        guitarLead.chain(...chain, Tone.Destination);
        console.log(`🎛 Preset ${presetName}: ${chain.map(fx => fx.constructor?.name || 'FX').join(' → ')}`);
        
        if (isPanelOpen) {
            buildEffectControls();
        }
        
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
// 🎛️ UI — CREAZIONE PANNELLO CONTROLLI
// ============================================================

export function initFxController() {
    console.log("🎛️ Inizializzazione FX Controller...");
    
    // ✅ Rimuovi il pannello esistente se c'è
    const existingPanel = document.getElementById('fx-panel');
    if (existingPanel) {
        existingPanel.remove();
        console.log("🗑️ Pannello FX rimosso (ricreazione)");
    }
    
    // ✅ Rimuovi il pulsante esistente se c'è
    const existingBtn = document.getElementById('btnFxEffects');
    if (existingBtn) {
        existingBtn.remove();
        console.log("🗑️ Pulsante FX rimosso (ricreazione)");
    }
    
    // ✅ Ferma l'animazione LFO se attiva
    if (lfoAnimationId) {
        cancelAnimationFrame(lfoAnimationId);
        lfoAnimationId = null;
    }
    
    // Crea tutto da capo
    createFxButton();
    createUI();
    setupEventListeners();
    buildEffectControls();
    
    console.log("✅ FX Controller pronto!");
}

// ============================================================
// CREA PULSANTE FX (DOPO SPARTITO, STILE MIXER)
// ============================================================

function createFxButton() {
    const playerControls = document.querySelector('.player-controls');
    if (!playerControls) {
        console.warn("⚠️ .player-controls non trovato, riprovo tra 100ms");
        setTimeout(createFxButton, 100);
        return;
    }
    
    // ✅ Rimuovi eventuali duplicati
    const existingBtn = document.getElementById('btnFxEffects');
    if (existingBtn) {
        existingBtn.remove();
    }
    
    const btn = document.createElement('button');
    btn.id = 'btnFxEffects';
    btn.textContent = '🎚️ FX Control';
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
    
    const spartitoBtn = document.getElementById('btnSpartito');
    if (spartitoBtn && spartitoBtn.nextSibling) {
        playerControls.insertBefore(btn, spartitoBtn.nextSibling);
    } else if (spartitoBtn) {
        playerControls.appendChild(btn);
    } else {
        playerControls.appendChild(btn);
    }
    
    console.log("✅ Pulsante FX aggiunto dopo Spartito");
}

// ============================================================
// 🎵 LFO VISUALIZER — ANIMAZIONE IN TEMPO REALE
// ============================================================

function startLFOAnimation() {
    const canvas = document.getElementById('lfoCanvas');
    if (!canvas) {
        console.warn("⚠️ lfoCanvas non trovato");
        return;
    }
    
    // ✅ Assicura che il canvas abbia dimensioni corrette
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    
    // Imposta dimensioni corrette per il rendering (se necessario)
    if (canvas.width === 0 || canvas.height === 0) {
        canvas.width = canvas.clientWidth * dpr || 600;
        canvas.height = 60 * dpr || 60;
    }
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    let time = 0;
    let frameCount = 0;
    
    function drawLFO() {
        // ✅ Controlla se il canvas esiste ancora
        if (!document.getElementById('lfoCanvas')) {
            if (lfoAnimationId) {
                cancelAnimationFrame(lfoAnimationId);
                lfoAnimationId = null;
            }
            return;
        }
        
        // Ripulisci il canvas
        ctx.clearRect(0, 0, width, height);
        
        // Sfondo griglia
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let y = 0; y < height; y += height / 4) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }
        
        // Linea centrale (zero)
        ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        
        // Prepara i dati per il disegno
        const points = 200;
        const data = new Float32Array(points);
        
        // ✅ Cerca l'effetto attivo con LFO (con controllo sicurezza)
        const activeEffect = getActiveLFOEffect();
        
        // ✅ Aggiorna i label di riferimento
        const effectNameEl = document.getElementById('lfo-effect-name');
        const rateEl = document.getElementById('lfo-rate');
        const depthEl = document.getElementById('lfo-depth');
        
        if (activeEffect) {
            // Ottieni i parametri in tempo reale
            const rate = getEffectParam(activeEffect, 'frequency') || 5;
            const depth = getEffectParam(activeEffect, 'depth') || 0.5;
            
            // Aggiorna i label
            if (effectNameEl) effectNameEl.textContent = formatEffectName(activeEffect);
            if (rateEl) rateEl.textContent = `Rate: ${rate.toFixed(1)} Hz`;
            if (depthEl) depthEl.textContent = `Depth: ${depth.toFixed(2)}`;
            
            // Genera la forma d'onda
            for (let i = 0; i < points; i++) {
                const x = (i / points) * Math.PI * 2;
                // Forma d'onda mista (sin + cos per effetti diversi)
                const wave = Math.sin(x * rate * 1.5 + time) * depth;
                const wave2 = Math.cos(x * (rate * 0.7) + time * 0.8) * depth * 0.3;
                data[i] = (wave + wave2) * 0.6;
            }
        } else {
            // Nessun effetto LFO attivo
            if (effectNameEl) effectNameEl.textContent = 'Nessun LFO attivo';
            if (rateEl) rateEl.textContent = 'Rate: —';
            if (depthEl) depthEl.textContent = 'Depth: —';
            for (let i = 0; i < points; i++) {
                data[i] = 0;
            }
        }
        
        // Disegna la forma d'onda
        ctx.beginPath();
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 2;
        ctx.shadowColor = 'rgba(255,107,107,0.3)';
        ctx.shadowBlur = 10;
        
        for (let i = 0; i < points; i++) {
            const x = (i / points) * width;
            const y = (height / 2) - (data[i] * (height / 2) * 0.8);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Riempimento sotto la curva (gradiente)
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, 'rgba(255,107,107,0)');
        gradient.addColorStop(0.3, 'rgba(255,107,107,0.1)');
        gradient.addColorStop(0.5, 'rgba(255,107,107,0.05)');
        gradient.addColorStop(0.7, 'rgba(255,107,107,0.1)');
        gradient.addColorStop(1, 'rgba(255,107,107,0)');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        for (let i = 0; i < points; i++) {
            const x = (i / points) * width;
            const y = (height / 2) - (data[i] * (height / 2) * 0.8);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.lineTo(width, height / 2);
        ctx.lineTo(0, height / 2);
        ctx.closePath();
        ctx.fill();
        
        // Punti luminosi (effetto "glow" sui picchi)
        for (let i = 0; i < points; i += 10) {
            const x = (i / points) * width;
            const y = (height / 2) - (data[i] * (height / 2) * 0.8);
            const radius = Math.abs(data[i]) * 4 + 1;
            if (radius > 1) {
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,107,107,' + Math.min(radius / 8, 0.5)};
                ctx.fill();
        }
        
        // Avanza il tempo
        time += 0.02;
        frameCount++;
        
        // ✅ Continua l'animazione solo se il pannello è aperto
        if (isPanelOpen) {
            lfoAnimationId = requestAnimationFrame(drawLFO);
        } else {
            lfoAnimationId = null;
        }
    }
    
    // Avvia l'animazione
    if (lfoAnimationId) {
        cancelAnimationFrame(lfoAnimationId);
        lfoAnimationId = null;
    }
    drawLFO();
}

// ============================================================
// IDENTIFICA L'EFFETTO LFO ATTIVO
// ============================================================

function getActiveLFOEffecOld() {
    // Effetti che usano LFO (hanno frequency + depth)
    const lfoEffects = ['tremolo', 'vibrato', 'chorus', 'phaser', 'flanger', 'autowah'];
    
    // ✅ Controlla che fxRack esista
    if (!fxRack) return null;
    
    // Cerca nel preset corrente
    if (currentPresetEffects && currentPresetEffects.length > 0) {
        for (const name of currentPresetEffects) {
            if (lfoEffects.includes(name)) {
                // Verifica che l'effetto esista e abbia i parametri
                const params = getEffectParams(name);
                if (params && params.frequency) {
                    return name;
                }
            }
        }
    }
    
    // Se nessun effetto LFO nel preset, controlla se qualcuno è attivo globalmente
    for (const name of lfoEffects) {
        const effect = fxRack ? fxRack[name] : null;
        if (effect) {
            // Verifica se l'effetto è effettivamente in uso (wet > 0)
            const wet = getEffectParam(name, 'wet');
            if (wet !== null && wet > 0.01) {
                return name;
            }
        }
    }
    
    return null;
}

// ============================================================
// IDENTIFICA L'EFFETTO LFO ATTIVO
// ============================================================

function getActiveLFOEffect() {
    // Effetti che usano LFO (hanno frequency + depth)
    const lfoEffects = ['tremolo', 'vibrato', 'chorus', 'phaser', 'flanger', 'autowah'];
    
    // ✅ Controlla che fxRack esista
    if (!fxRack) return null;
    
    // ✅ CERCA SOLO NEL PRESET CORRENTE
    if (currentPresetEffects && currentPresetEffects.length > 0) {
        // Prima cerca effetti con parametri modificabili
        for (const name of currentPresetEffects) {
            if (lfoEffects.includes(name)) {
                const params = getEffectParams(name);
                if (params && params.frequency) {
                    return name;
                }
            }
        }
        
        // Se nessun effetto LFO con parametri, cerca qualsiasi effetto LFO nel preset
        for (const name of currentPresetEffects) {
            if (lfoEffects.includes(name)) {
                return name;  // Mostra l'LFO anche se non ha parametri (es. tremolo)
            }
        }
    }
    
    return null;
}

// ============================================================
// CREA UI DEL PANNELLO
// ============================================================

function createUI() {
    // ✅ Rimuovi pannello esistente
    const existingPanel = document.getElementById('fx-panel');
    if (existingPanel) {
        existingPanel.remove();
    }
    
    const panel = document.createElement('div');
    panel.id = 'fx-panel';
    panel.style.cssText = `
        position: fixed;
        top: -100%;
        left: 50%;
        transform: translateX(-50%);
        width: 97%;
        max-width: 1000px;
        background: rgba(10, 10, 20, 0.95);
        backdrop-filter: blur(20px);
        border-bottom-left-radius: 20px;
        border-bottom-right-radius: 20px;
        padding: 20px 10px;
        transition: top 0.4s cubic-bezier(0.22, 1, 0.36, 1);
        z-index: 99999;
        max-height: 80vh;
        overflow-y: auto;
        overflow-x: hidden;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
        color: #e0e0e0;
        font-family: 'Segoe UI', -apple-system, sans-serif;
    `;
    
    panel.innerHTML = `
        <div class="fx-header">
            <h3>🎛️ FX Controls</h3>
            <button id="fx-close">✕</button>
        </div>
        
        <!-- ✅ LFO VISUALIZER -->
        <div class="lfo-visualizer" style="
            background: rgba(0,0,0,0.3);
            border-radius: 8px;
            padding: 8px 12px;
            margin: 8px 4px 12px 4px;
            border: 1px solid rgba(255,255,255,0.05);
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:10px;color:#666;text-transform:uppercase;letter-spacing:1px;">🔊 LFO Visualizer</span>
                <span id="lfo-effect-name" style="font-size:10px;color:#ff6b6b;font-weight:600;">—</span>
            </div>
            <canvas id="lfoCanvas" width="600" height="60" style="
                width:100%;
                height:60px;
                border-radius:4px;
                background: rgba(0,0,0,0.3);
            "></canvas>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span id="lfo-rate" style="font-size:9px;color:#555;">Rate: —</span>
                <span id="lfo-depth" style="font-size:9px;color:#555;">Depth: —</span>
            </div>
        </div>
        
        <div class="fx-search">
            <input type="text" id="fx-search" placeholder="🔍 Cerca effetto...">
        </div>
        <div id="fx-content"></div>
        <div class="fx-footer">
            <button id="fx-reset">🔄 Reset All</button>
            <span id="fx-status">✅ Live</span>
        </div>
    `;
    
    document.body.appendChild(panel);
    
    // ✅ Avvia l'animazione LFO (con un piccolo ritardo per assicurarsi che il canvas sia pronto)
    setTimeout(() => {
        startLFOAnimation();
    }, 100);
}

// ============================================================
// EVENT LISTENERS
// ============================================================

function setupEventListeners() {
    const toggle = document.getElementById('btnFxEffects');
    const panel = document.getElementById('fx-panel');
    const close = document.getElementById('fx-close');
    const search = document.getElementById('fx-search');
    const reset = document.getElementById('fx-reset');
    
    // ✅ Se manca il toggle o il panel, riprova dopo un po'
    if (!toggle || !panel) {
        console.warn("⚠️ Elementi FX non trovati, riprovo...");
        setTimeout(setupEventListeners, 100);
        return;
    }
    
    // ✅ Rimuovi vecchi listener (clonando e sostituendo)
    const newToggle = toggle.cloneNode(true);
    toggle.parentNode.replaceChild(newToggle, toggle);
    
    // Ora usa il nuovo toggle
    const finalToggle = document.getElementById('btnFxEffects');
    const finalPanel = document.getElementById('fx-panel');
    const finalClose = document.getElementById('fx-close');
    const finalSearch = document.getElementById('fx-search');
    const finalReset = document.getElementById('fx-reset');
    
    if (finalToggle && finalPanel) {
        finalToggle.addEventListener('click', function fxToggleHandler() {
            isPanelOpen = !isPanelOpen;
            finalPanel.classList.toggle('show', isPanelOpen);
            
            if (isPanelOpen) {
                buildEffectControls();
                startLFOAnimation();
            } else {
                if (lfoAnimationId) {
                    cancelAnimationFrame(lfoAnimationId);
                    lfoAnimationId = null;
                }
            }
            
            finalToggle.style.background = isPanelOpen 
                ? 'rgba(255,107,107,0.3)' 
                : 'rgba(255,255,255,0.1)';
            finalToggle.style.borderColor = isPanelOpen 
                ? '#ff6b6b' 
                : 'rgba(255,255,255,0.2)';
        });
    }
    
    if (finalClose && finalPanel) {
        finalClose.addEventListener('click', function fxCloseHandler() {
            isPanelOpen = false;
            finalPanel.classList.remove('show');
            
            if (lfoAnimationId) {
                cancelAnimationFrame(lfoAnimationId);
                lfoAnimationId = null;
            }
            
            if (finalToggle) {
                finalToggle.style.background = 'rgba(255,255,255,0.1)';
                finalToggle.style.borderColor = 'rgba(255,255,255,0.2)';
            }
        });
    }
    
    if (finalSearch) {
        finalSearch.addEventListener('input', function searchHandler(e) {
            const query = e.target.value.toLowerCase();
            document.querySelectorAll('.fx-group').forEach(group => {
                const name = group.dataset.effect.toLowerCase();
                group.style.display = name.includes(query) ? 'block' : 'none';
            });
        });
    }
    
    if (finalReset) {
        finalReset.addEventListener('click', resetAllEffects);
    }
}

// ============================================================
// COSTRUISCI CONTROLLI EFFETTI
// ============================================================

function buildEffectControls() {
    const container = document.getElementById('fx-content');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!currentPresetEffects || currentPresetEffects.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;color:#555;padding:30px 0;">
                <div style="font-size:24px;margin-bottom:10px;">🔇</div>
                <div>Nessun effetto attivo</div>
                <div style="font-size:12px;color:#444;margin-top:5px;">Il preset corrente non ha effetti</div>
            </div>
        `;
        return;
    }
    
    if (currentPresetName) {
        const presetInfo = document.createElement('div');
        presetInfo.style.cssText = `
            text-align: center;
            font-size: 12px;
            color: #888;
            padding: 5px 0 15px 0;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            margin-bottom: 15px;
        `;
        presetInfo.innerHTML = `
            <span style="color:#666;">Preset attivo:</span>
            <span style="color:#ff6b6b;font-weight:600;">${formatEffectName(currentPresetName)}</span>
        `;
        container.appendChild(presetInfo);
    }
    
    const activeEffects = currentPresetEffects.filter(name => {
        return getEffectParams(name) !== null;
    });
    
    if (activeEffects.length === 0) {
        container.innerHTML = `
            <div style="text-align:center;color:#555;padding:30px 0;">
                <div style="font-size:24px;margin-bottom:10px;">🎛️</div>
                <div>Nessun parametro disponibile</div>
                <div style="font-size:12px;color:#444;margin-top:5px;">Gli effetti attivi non hanno parametri modificabili</div>
            </div>
        `;
        return;
    }
    
    activeEffects.forEach(effectName => {
        const params = getEffectParams(effectName);
        const group = createEffectGroup(effectName, params);
        container.appendChild(group);
    });
}

// ============================================================
// CREA GRUPPO EFFETTO
// ============================================================

function createEffectGroup(effectName, params) {
    const group = document.createElement('div');
    group.className = 'fx-group';
    group.dataset.effect = effectName;
    
    const header = document.createElement('div');
    header.className = 'fx-group-header';
    header.innerHTML = `
        <h4>${formatEffectName(effectName)}</h4>
        <button class="fx-group-toggle active">▼</button>
    `;
    
    const body = document.createElement('div');
    body.className = 'fx-group-body open';
    
    Object.entries(params).forEach(([paramName, paramConfig]) => {
        const paramDiv = document.createElement('div');
        paramDiv.className = 'param';
        paramDiv.style.cssText = `
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 3px 0;
            width: 100%;
            box-sizing: border-box;
        `;
        
        const currentValue = getEffectParam(effectName, paramName);
        const value = currentValue !== null ? currentValue : paramConfig.min;
        
        paramDiv.innerHTML = `
            <label style="
                font-size: 10px;
                color: #888;
                width: 45px;
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
                       min-width: 0;
                       height: 4px;
                       -webkit-appearance: none;
                       appearance: none;
                       background: linear-gradient(to right, #2a2a3a, #ff6b6b);
                       border-radius: 2px;
                       outline: none;
                       cursor: pointer;
                   ">
            <span class="value" style="
                font-size: 10px;
                color: #ff6b6b;
                min-width: 35px;
                text-align: right;
                font-family: monospace;
                flex-shrink: 0;
            ">${Number(value).toFixed(2)}</span>
            ${paramConfig.unit ? `<span style="font-size: 9px; color: #555; min-width: 18px; flex-shrink: 0;">${paramConfig.unit}</span>` : ''}
        `;
        
        const slider = paramDiv.querySelector('input[type="range"]');
        const valueDisplay = paramDiv.querySelector('.value');
        
        slider.addEventListener('input', () => {
            const val = parseFloat(slider.value);
            valueDisplay.textContent = val.toFixed(2);
            setEffectParam(effectName, paramName, val);
            
            const status = document.getElementById('fx-status');
            if (status) {
                status.textContent = '⚡ Live';
                status.className = '';
                setTimeout(() => {
                    status.textContent = '✅ Live';
                    status.className = '';
                }, 500);
            }
        });
        
        body.appendChild(paramDiv);
    });
    
    const toggleBtn = header.querySelector('.fx-group-toggle');
    toggleBtn.addEventListener('click', () => {
        body.classList.toggle('open');
        toggleBtn.classList.toggle('active');
    });
    
    group.appendChild(header);
    group.appendChild(body);
    return group;
}

// ============================================================
// RESET TUTTI GLI EFFETTI
// ============================================================

function resetAllEffects() {
    document.querySelectorAll('.fx-group .param input[type="range"]').forEach(slider => {
        const effectName = slider.dataset.effect;
        const paramName = slider.dataset.param;
        const defaultValue = parseFloat(slider.min);
        
        slider.value = defaultValue;
        const valueDisplay = slider.parentElement.querySelector('.value');
        if (valueDisplay) valueDisplay.textContent = defaultValue.toFixed(2);
        setEffectParam(effectName, paramName, defaultValue);
    });
    
    const status = document.getElementById('fx-status');
    if (status) {
        status.textContent = '🔄 Reset!';
        status.className = 'off';
        setTimeout(() => {
            status.textContent = '✅ Live';
            status.className = '';
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

export function getFxRackStatus() {
    return {
        initialized,
        effectsCount: fxRack ? Object.keys(fxRack).length : 0,
        presetsCount: footswitchPresets ? Object.keys(footswitchPresets).length : 0,
    };
}

export function toggleFxPanel() {
    const panel = document.getElementById('fx-panel');
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

export function isFxPanelOpen() {
    return isPanelOpen;
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