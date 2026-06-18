// footswitchPreset.js — Extreme FX Rack + Presets (Petrucci Style)
// Tutti gli effetti definiti qui dentro, pronti per routing dinamico

import * as Tone from "https://esm.sh/tone";

console.log("footswitchPreset.js ver. 001 loaded");


// ============================================================
// 🎛 FX RACK — TUTTI GLI EFFETTI DISPONIBILI
// (anche quelli non usati ora, per future catene)
// ============================================================

export const fxRack = {

    // ===== MODULAZIONI =====
    chorus: new Tone.Chorus(0.25, 4, 0.6).start(),
    flanger: new Tone.FeedbackDelay("16n", 0.5),
    phaser: new Tone.Phaser({ frequency: 0.5, octaves: 3, baseFrequency: 350 }),
    tremolo: new Tone.Tremolo(9, 0.6).start(),
    vibrato: new Tone.Vibrato(5, 0.3),

    // ===== DELAY =====
    delay8: new Tone.FeedbackDelay("8n", 0.35),
    delay8d: new Tone.FeedbackDelay("8n.", 0.40), // dotted eighth
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
    rotary: new Tone.Rotary({ frequency: 1.2, depth: 0.8 }),

    // ===== DISTORSIONI (non usate ora, ma pronte) =====
    distortion: new Tone.Distortion(0.6),
    overdrive: new Tone.Distortion(0.3),
    bitcrusher: new Tone.BitCrusher(4),
};

// ============================================================
// 🎚 PRESET — SOLO QUELLI CHE SUONANO BENE NEI TUOI STILI
// (Heavy, Epic, Prog, Ballad, Ambient)
// ============================================================

export const footswitchPresets = {

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

    // ===== PROG METAL (Petrucci) =====
    progIntro: ["phaser", "eq"],
    progVerse: ["eq"],
    progChorus: ["widener", "delayQuarter"],
    progSolo: ["delay8d", "reverbPlate", "harmonizer5", "widener"],
    progOutro: ["rotary", "reverbHall"],

    // ===== BALLAD =====
    balladVerse: ["chorus", "delay8d"],
    balladChorus: ["chorus", "delay8d", "shimmerPitch", "reverbShimmer"],
    balladOutro: ["chorus", "reverbHall"],

    // ===== AMBIENT =====
    ambientIntro: ["chorus", "delay8d", "shimmerPitch", "reverbShimmer"],
    ambientPad: ["shimmerPitch", "shimmerPitch2", "reverbShimmer"],
};

// ============================================================
// CLASSIFICAZIONE GROOVE → FAMIGLIA
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

    const family = grooveFamilies[grooveName] || "heavy"; // fallback

    const sec = sectionName.toLowerCase();

    let secType = "verse";
    if (sec.includes("intro")) secType = "intro";
    else if (sec.includes("pre")) secType = "prechorus";
    else if (sec.includes("chorus")) secType = "chorus";
    else if (sec.includes("solo") || sec.includes("bridge")) secType = "solo";
    else if (sec.includes("outro")) secType = "outro";

    const preset = familyPresetMap[family][secType];

    return preset;
}


// ============================================================
// 🔥 FUNZIONE DI ROUTING — CAMBIA CATENA EFFETTI AL VOLO
// ============================================================

export function applyPreset(guitarLead, presetName) {
    if (!guitarLead || !footswitchPresets[presetName]) return;

    // Scollega tutto
    guitarLead.disconnect();

    // Costruisci la catena
    const chain = footswitchPresets[presetName].map(name => fxRack[name]);

    // Applica routing
    guitarLead.chain(...chain, Tone.Destination);

    console.log("🎛 Footswitch preset attivato:", presetName);
}


