// footswitchPreset.js — Extreme FX Rack + Presets (Petrucci Style)
// Versione con inizializzazione lazy per evitare problemi di caricamento

import * as Tone from "https://esm.sh/tone";

console.log("footswitchPreset.js ver. 003 loaded");

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
            leslie: {
                vibrato: new Tone.Vibrato(6.5, 0.4),  // Velocità alta per modalità Fast
                tremolo: new Tone.Tremolo(6.5, 0.7),  // Sincronizzato con vibrato
            },
            leslieSlow: {
                vibrato: new Tone.Vibrato(0.8, 0.35),  // Velocità bassa per modalità Slow
                tremolo: new Tone.Tremolo(0.8, 0.6),
            },

            // ===== DISTORSIONI =====
            distortion: new Tone.Distortion(0.6),
            overdrive: new Tone.Distortion(0.3),
            bitcrusher: new Tone.BitCrusher(4),
        };

        // Avvia gli effetti che necessitano di start()
        if (fxRack.chorus) fxRack.chorus.start();
        if (fxRack.tremolo) fxRack.tremolo.start();
        if (fxRack.leslie?.vibrato) fxRack.leslie.vibrato.start();
        if (fxRack.leslie?.tremolo) fxRack.leslie.tremolo.start();
        if (fxRack.leslieSlow?.vibrato) fxRack.leslieSlow.vibrato.start();
        if (fxRack.leslieSlow?.tremolo) fxRack.leslieSlow.tremolo.start();

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
            progOutro: ["leslie", "reverbHall"],

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