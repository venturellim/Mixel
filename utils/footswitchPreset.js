// footswitchPreset.js — Extreme FX Rack + Presets (Petrucci Style)
// Versione con inizializzazione lazy per evitare problemi di caricamento

import * as Tone from "https://esm.sh/tone";

console.log("footswitchPreset.js ver. 003.2 loaded");

// ============================================================
// STATO INTERNO — INIZIALIZZAZIONE LAZY
// ============================================================

let fxRack = null;
let footswitchPresets = null;
let initialized = false;

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
        // Crea oggetti vuoti per evitare crash
        fxRack = {};
        footswitchPresets = {};
        initialized = true;
    }
}

// ============================================================
// 🔥 FUNZIONE DI ROUTING — CAMBIA CATENA EFFETTI AL VOLO
// ============================================================

export function applyPreset(guitarLead, presetName) {
    // Inizializza solo quando serve
    initFxRack();
    
    if (!guitarLead) {
        console.warn(`⚠️ applyPreset: guitarLead non disponibile per "${presetName}"`);
        return;
    }
    
    if (!footswitchPresets || !footswitchPresets[presetName]) {
        console.warn(`⚠️ applyPreset: preset "${presetName}" non trovato`);
        // Se non c'è preset, collega diretto
        try {
            guitarLead.disconnect();
            guitarLead.connect(Tone.Destination);
        } catch(e) {}
        return;
    }

    try {
        // Scollega tutto
        guitarLead.disconnect();

        // Costruisci la catena
        const chain = footswitchPresets[presetName]
            .map(name => fxRack[name])
            .filter(fx => fx !== undefined && fx !== null);

        if (chain.length === 0) {
            // Se la catena è vuota, collega diretto
            guitarLead.connect(Tone.Destination);
            console.log(`🎛 Preset ${presetName}: clean (no FX)`);
            return;
        }

        // Applica routing
        guitarLead.chain(...chain, Tone.Destination);
        console.log(`🎛 Preset ${presetName}: ${chain.map(fx => fx.constructor?.name || 'FX').join(' → ')}`);
        
    } catch(error) {
        console.error(`❌ Errore applicazione preset ${presetName}:`, error);
        // Fallback: collega diretto
        try {
            guitarLead.disconnect();
            guitarLead.connect(Tone.Destination);
        } catch(e) {}
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
// CLASSIFICAZIONE GROOVE → FAMIGLIA (opzionale)
// ============================================================

export const grooveFamilies = {
    // HEAVY METAL
    gallop_classic: "heavy",
    gallop_triplet: "heavy",
    thrash_diamond: "heavy",
    palm_mute_chug: "heavy",
    motorhead_drive: "heavy",
    speed_metal: "heavy",
    death_roll: "heavy",
    thrash_skank: "heavy",
    groove_metal: "heavy",

    // EPIC METAL
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

    // PROG METAL
    technical_sync: "prog",
    meshuggah_ish: "prog",
    prog_odd: "prog",
    djent: "prog",

    // BALLAD
    ballad_intro_strum: "ballad",
    ballad_intro_slow: "ballad",
    ballad_verse_simple: "ballad",
    ballad_verse_strum: "ballad",
    ballad_pre_build: "ballad",
    ballad_chorus_full: "ballad",
    ballad_chorus_simple: "ballad",

    // AMBIENT / CLEAN
    intro_ambient: "ambient",
    stoner_doom: "ambient",
    doom_slow: "ambient"
};

// ============================================================
// MAPPATURA FAMIGLIA + SEZIONE → PRESET
// ============================================================

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

// ============================================================
// FUNZIONE AUTOMATICA: GROOVE → PRESET
// ============================================================

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

// ============================================================
// 🎛️ CONTROLLO PARAMETRI IN TEMPO REALE
// ============================================================

/**
 * Ottiene i parametri modificabili per un effetto
 */
export function getEffectParams(effectName) {
    initFxRack();
    
    const effect = fxRack[effectName];
    if (!effect) return null;
    
    // Mappa dei parametri modificabili per ogni effetto
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

/**
 * Imposta un parametro di un effetto in tempo reale
 */
export function setEffectParam(effectName, paramName, value) {
    initFxRack();
    
    const effect = fxRack[effectName];
    if (!effect) {
        console.warn(`⚠️ Effetto "${effectName}" non trovato`);
        return false;
    }
    
    try {
        // Per parametri che sono AudioParam
        if (effect[paramName] && typeof effect[paramName].value !== 'undefined') {
            effect[paramName].value = value;
            return true;
        }
        // Per parametri che sono metodi
        else if (typeof effect[paramName] === 'function') {
            effect[paramName](value);
            return true;
        }
        // Per parametri annidati (es. effect.wet.value)
        else if (paramName.includes('.')) {
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

/**
 * Ottiene il valore corrente di un parametro
 */
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

/**
 * Ottiene tutti gli effetti disponibili
 */
export function getAvailableEffects() {
    initFxRack();
    return Object.keys(fxRack || {});
}