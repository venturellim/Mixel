// metalRhythmEngine.js — ver. 071 (Full Score Integration)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 015.3 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
    const { drums, guitarPalm, guitarOpen, bass, AcousticGuitar, StStringPad } = instruments;
    if (!drums || !guitarPalm || !bass || !AcousticGuitar || !StStringPad) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") ||
name.includes("solo") && !name.includes("pre"); 
    const isPreChorus = name.includes("pre") ||
name.includes("bridge");
    const isIntro = name.includes("intro");
const isOutro = name.includes("outro");
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5, texture = 0.5 } = params?.imageParams || {};

    const grooves = {
    intro: [
  "intro_ambient",
  "intro_heavy_strikes",
  "stratovarius_intro",
  "doom_slow",
  "cinematic_buildup",
  "industrial_static",
  "stoner_doom",
  "power_ballad",
  "ballad_intro_arpeggio",
  "intro_epic_pad",
  "intro_epic_timpani"
],
    verse: ["gallop_classic", "gallop_triplet", "thrash_diamond", "palm_mute_chug", "motorhead_drive", "technical_sync", "meshuggah_ish", "breakdown_heavy", "jump_groove", "double_time_punk", "power_gallop", "groove_metal", "black_tremolo", "speed_metal", "death_roll", "thrash_skank", "ballad_verse_arpeggio", "ballad_verse_open"],
    prechorus: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension", "epic_buildup", "power_ballad", "ballad_pre_open"],
    bridge: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension", "epic_buildup", "power_ballad"],
    chorus: ["helloween_speed", "chorus_pure_sustain", "chorus_sustain_hit", "anthem_half_time", "power_ride_groove", "double_kick_wall", "blast_beat_light", "epic_waltz_feel", "symphonic_blast", "power_gallop", "speed_metal", "power_ballad", "ballad_chorus_strum"],
    outro: [
  "ballad_outro_open",
  "outro_sustain",
  "outro_timpani",
  "outro_final_hit",
  "outro_epic_hit",
  "outro_epic_roll",
  "outro_epic_finale"
]
};

// Definizione dei groove con caratteristiche
const grooveCharacteristics = {
    // INTRO
    "intro_ambient": { energy: 0.2, brightness: 0.3, complexity: 0.2, tempo: "slow" },
    "intro_heavy_strikes": { energy: 0.6, brightness: 0.5, complexity: 0.3, tempo: "medium" },
    "stratovarius_intro": { energy: 0.7, brightness: 0.7, complexity: 0.4, tempo: "medium" },
    "cinematic_buildup": { energy: 0.4, brightness: 0.6, complexity: 0.3, tempo: "slow" },
    "industrial_static": { energy: 0.5, brightness: 0.3, complexity: 0.6, tempo: "medium" },
    "doom_slow": { energy: 0.3, brightness: 0.2, complexity: 0.2, tempo: "slow" },
    "stoner_doom": { energy: 0.3, brightness: 0.2, complexity: 0.3, tempo: "slow" },
    "power_ballad": { energy: 0.4, brightness: 0.6, complexity: 0.3, tempo: "slow" },
    
    // VERSE
    "gallop_classic": { energy: 0.7, brightness: 0.5, complexity: 0.5, tempo: "fast" },
    "gallop_triplet": { energy: 0.7, brightness: 0.5, complexity: 0.6, tempo: "fast" },
    "power_gallop": { energy: 0.8, brightness: 0.7, complexity: 0.5, tempo: "fast" },
    "thrash_diamond": { energy: 0.9, brightness: 0.4, complexity: 0.7, tempo: "very_fast" },
    "palm_mute_chug": { energy: 0.6, brightness: 0.3, complexity: 0.3, tempo: "medium" },
    "motorhead_drive": { energy: 0.8, brightness: 0.5, complexity: 0.4, tempo: "fast" },
    "technical_sync": { energy: 0.6, brightness: 0.5, complexity: 0.9, tempo: "medium" },
    "meshuggah_ish": { energy: 0.7, brightness: 0.3, complexity: 0.8, tempo: "medium" },
    "breakdown_heavy": { energy: 0.5, brightness: 0.2, complexity: 0.4, tempo: "slow" },
    "jump_groove": { energy: 0.7, brightness: 0.4, complexity: 0.5, tempo: "medium" },
    "double_time_punk": { energy: 0.8, brightness: 0.5, complexity: 0.4, tempo: "very_fast" },
    "groove_metal": { energy: 0.6, brightness: 0.3, complexity: 0.6, tempo: "medium" },
    "black_tremolo": { energy: 0.8, brightness: 0.2, complexity: 0.7, tempo: "very_fast" },
    "speed_metal": { energy: 0.9, brightness: 0.6, complexity: 0.6, tempo: "very_fast" },
    "death_roll": { energy: 0.9, brightness: 0.2, complexity: 0.7, tempo: "very_fast" },
    "thrash_skank": { energy: 0.9, brightness: 0.4, complexity: 0.6, tempo: "very_fast" },
    
    // PRECHORUS / BRIDGE
    "pre_build_up": { energy: 0.5, brightness: 0.5, complexity: 0.4, tempo: "medium" },
    "driving_eights": { energy: 0.7, brightness: 0.5, complexity: 0.3, tempo: "fast" },
    "march_to_war": { energy: 0.6, brightness: 0.4, complexity: 0.4, tempo: "medium" },
    "suspended_tension": { energy: 0.4, brightness: 0.5, complexity: 0.3, tempo: "slow" },
    "epic_buildup": { energy: 0.5, brightness: 0.7, complexity: 0.4, tempo: "slow" },
    "prog_odd": { energy: 0.6, brightness: 0.5, complexity: 0.9, tempo: "medium" },
    "metalcore_breakdown": { energy: 0.4, brightness: 0.3, complexity: 0.4, tempo: "slow" },
    
    // CHORUS
    "helloween_speed": { energy: 0.9, brightness: 0.7, complexity: 0.6, tempo: "fast" },
    "chorus_pure_sustain": { energy: 0.7, brightness: 0.7, complexity: 0.3, tempo: "medium" },
    "chorus_sustain_hit": { energy: 0.8, brightness: 0.7, complexity: 0.4, tempo: "medium" },
    "anthem_half_time": { energy: 0.7, brightness: 0.8, complexity: 0.3, tempo: "slow" },
    "power_ride_groove": { energy: 0.8, brightness: 0.6, complexity: 0.4, tempo: "fast" },
    "double_kick_wall": { energy: 0.9, brightness: 0.5, complexity: 0.5, tempo: "very_fast" },
    "blast_beat_light": { energy: 1.0, brightness: 0.3, complexity: 0.7, tempo: "very_fast" },
    "epic_waltz_feel": { energy: 0.6, brightness: 0.7, complexity: 0.4, tempo: "slow" },
    "symphonic_blast": { energy: 0.9, brightness: 0.8, complexity: 0.7, tempo: "very_fast" },
    "folk_hop": { energy: 0.7, brightness: 0.7, complexity: 0.5, tempo: "fast" },
    "djent": { energy: 0.6, brightness: 0.3, complexity: 0.9, tempo: "medium" },
     "ballad_intro_arpeggio": { energy: 0.15, brightness: 0.45, complexity: 0.3, tempo: "slow" },
"ballad_verse_arpeggio": { energy: 0.2, brightness: 0.5, complexity: 0.4, tempo: "slow" },
"ballad_verse_open":     { energy: 0.18, brightness: 0.45, complexity: 0.2, tempo: "slow" },
"ballad_pre_open":       { energy: 0.25, brightness: 0.55, complexity: 0.3, tempo: "slow" },
"ballad_chorus_strum":   { energy: 0.3, brightness: 0.6, complexity: 0.35, tempo: "slow" },
"ballad_outro_open":     { energy: 0.15, brightness: 0.4, complexity: 0.2, tempo: "slow" },
"intro_epic_pad":     { energy: 0.45, brightness: 0.55, complexity: 0.3, tempo: "slow" },
"intro_epic_timpani": { energy: 0.5,  brightness: 0.45, complexity: 0.4, tempo: "slow" },

"outro_sustain":      { energy: 0.3, brightness: 0.4, complexity: 0.2, tempo: "slow" },
"outro_timpani":      { energy: 0.35, brightness: 0.4, complexity: 0.3, tempo: "slow" },
"outro_final_hit":    { energy: 0.4, brightness: 0.5, complexity: 0.2, tempo: "slow" },

"outro_epic_hit":     { energy: 0.55, brightness: 0.6, complexity: 0.3, tempo: "slow" },
"outro_epic_roll":    { energy: 0.5,  brightness: 0.55, complexity: 0.4, tempo: "slow" },
"outro_epic_finale":  { energy: 0.6,  brightness: 0.65, complexity: 0.35, tempo: "slow" }
};

    const getGroove = (type, energy, brightness, complexity) => {
    const family = grooves[type] || grooves.verse;
    
    const scoredGrooves = family.map(groove => {
        const chars = grooveCharacteristics[groove];
        if (!chars) return { name: groove, score: 0 };
        
        const energyDiff = Math.abs(energy - chars.energy);
        const brightnessDiff = Math.abs(brightness - chars.brightness);
        const complexityDiff = Math.abs(complexity - chars.complexity);
        
        let score = 1 - (energyDiff * 0.5 + brightnessDiff * 0.3 + complexityDiff * 0.2);
        return { name: groove, score: score };
    });
    
    scoredGrooves.sort((a, b) => b.score - a.score);
    
    // SEMPRE il migliore (nessun random)
    return scoredGrooves[0].name;
};

    const currentGroove = getGroove(
    isIntro ? "intro" :
    isPreChorus ? "prechorus" :
    isChorus ? "chorus" :
    isOutro ? "outro" :
    "verse",
    energy,
    brightness,
    complexity
);
const isBalladGroove = currentGroove.startsWith("ballad_");
section.isBallad = isBalladGroove;


    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;
        const isLastMeasure = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, sustain = false, customNote = null;

// Regola di default
let inst = guitarPalm;

if (isBalladGroove) {
    inst = AcousticGuitar;
}
if (isChorus && !isBalladGroove) {
    inst = (rand() < 0.85) ? guitarOpen : guitarPalm;
}


            // --- LOGICA GROOVE (Rimane invariata) ---
                switch (currentGroove) {
    // ========== INTRO ==========
    case "intro_ambient":
        if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
        break;
    case "intro_heavy_strikes":
        if ([0, 4, 8, 12].includes(s)) { playGuitar = true; inst = guitarOpen; kick = true; snare = (s === 4 || s === 12); }
        break;
    case "stratovarius_intro":
        if (s === 0 || s === 2) { playGuitar = true; inst = guitarPalm; kick = true; }
        if (s === 4) { playGuitar = true; inst = guitarOpen; snare = true; sustain = true; }
        if (s === 12) snare = true;
        break;
    case "cinematic_buildup":
        kick = true;
        if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
        break;
    case "industrial_static":
        if (s % 4 === 0) { playGuitar = true; inst = guitarPalm; kick = true; }
        if (s === 6 || s === 14) snare = true;
        if (s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; }
        break;
    case "doom_slow":
        if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = (s === 8); }
        break;

    // ========== VERSE ==========
    case "gallop":
    case "gallop_classic":
        if (s % 4 !== 1) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
        if (s === 4 || s === 12) snare = true;
        break;
    case "gallop_triplet":
        const tripletBeat = Math.floor(s / 2.666);
        if (tripletBeat % 3 !== 0) { playGuitar = true; inst = guitarPalm; }
        kick = (tripletBeat % 3 === 0);
        if (tripletBeat === 4 || tripletBeat === 10) snare = true;
        break;
    case "palm_mute_chug":
        playGuitar = true;
        inst = guitarPalm;
        kick = (s % 2 === 0);
        if (s === 4 || s === 12) snare = true;
        break;
    case "motorhead_drive":
        playGuitar = true;
        inst = guitarPalm;
        kick = (s % 2 === 0);
        snare = (s === 4 || s === 12);
        if (s === 0 || s === 8) inst = guitarOpen;
        break;
    case "technical_sync":
        playGuitar = ([0, 3, 5, 8, 11, 13].includes(s));
        kick = ([0, 4, 8, 12].includes(s)) || (s === 3 || s === 11);
        snare = (s === 4 || s === 12);
        if (playGuitar) inst = guitarPalm;
        break;
    case "thrash_diamond":
        if ([0, 2, 6].includes(s)) { playGuitar = true; inst = guitarPalm; kick = true; }
        if (s === 4) { playGuitar = true; inst = guitarOpen; sustain = true; snare = true; }
        if (s === 12) snare = true;
        break;
    case "meshuggah_ish":
        if ([0, 3, 6, 8, 11, 14].includes(s)) { playGuitar = true; kick = true; }
        if (s === 4 || s === 12) snare = true;
        break;
    case "breakdown_heavy":
        if ([0, 8, 14].includes(s)) { playGuitar = true; inst = guitarOpen; kick = true; sustain = true; }
        if (s === 4 || s === 12) snare = true;
        break;
    case "jump_groove":
        if ([0, 3, 8, 11].includes(s)) { playGuitar = true; kick = true; }
        if (s === 4 || s === 12) snare = true;
        break;
    case "double_time_punk":
        kick = (s % 4 === 0 || s % 4 === 1);
        snare = (s % 4 === 2);
        playGuitar = (s % 2 === 0);
        break;

    // ========== PRECHORUS ==========
    case "pre_build_up":
        kick = (s % 4 === 0);
        snare = (s === 12);
        playGuitar = (s % 2 === 0);
        break;
    case "driving_eights":
        kick = (s % 2 === 0);
        snare = (s === 4 || s === 12);
        playGuitar = true;
        break;
    case "march_to_war":
        kick = ([0, 4, 8, 12].includes(s));
        snare = (s === 4 || s === 12);
        playGuitar = ([0, 2, 4, 6, 8, 10, 12, 14].includes(s));
        if (playGuitar) inst = guitarPalm;
        if (s === 0 || s === 8) inst = guitarOpen;
        break;
    case "suspended_tension":
        if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
        if (s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; }
        if (s === 12) snare = true;
        break;

    // ========== CHORUS ==========
    case "helloween":
    case "helloween_speed":
        kick = true;
        if (s % 4 === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
        if (s === 4 || s === 12) snare = true;
        break;
    case "chorus_pure_sustain":
        if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
        if (s === 8) kick = true;
        if (s === 4 || s === 12) snare = true;
        break;
    case "chorus_sustain_hit":
        if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
        if (s === 14) { playGuitar = true; inst = guitarOpen; kick = true; }
        if (s === 4 || s === 12) snare = true;
        break;
    case "anthem_half_time":
        if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; if (s === 8) snare = true; }
        break;
    case "power_ride_groove":
        playGuitar = true;
        inst = guitarOpen;
        kick = (s % 4 === 0);
        snare = (s === 4 || s === 12);
        break;
    case "double_kick_wall":
        kick = true;
        playGuitar = true;
        if (s === 4 || s === 12) snare = true;
        break;
    case "blast_beat_light":
        kick = true;
        snare = (s % 2 !== 0);
        playGuitar = true;
        break;
    case "epic_waltz_feel":
        if (s % 3 === 0) { playGuitar = true; inst = guitarOpen; kick = true; }
        if (s === 6 || s === 12) snare = true;
        break;
        // ========== NUOVI GROOVE DA AGGIUNGERE ==========

case "power_gallop":
    // Gallop potenziato con accenti aperti (es. Blind Guardian, Gamma Ray)
    if (s % 4 !== 1) { 
        playGuitar = true; 
        inst = (s % 8 === 0 || s % 8 === 4) ? guitarOpen : guitarPalm;
        kick = (s % 4 === 0); 
    }
    if (s === 4 || s === 12) snare = true;
    if (s === 8) kick = true;
    break;

case "symphonic_blast":
    // Stile symphonic metal (es. Epica, Nightwish - veloce)
    kick = true;
    snare = (s % 2 !== 0);
    playGuitar = (s % 4 === 0);
    if (playGuitar) { inst = guitarOpen; sustain = true; }
    break;

case "groove_metal":
    // Groove metal pesante (es. Pantera, Lamb of God)
    playGuitar = ([0, 3, 5, 8, 10, 13].includes(s));
    kick = ([0, 3, 5, 8, 10, 13].includes(s));
    snare = (s === 6 || s === 14);
    if (playGuitar) inst = guitarPalm;
    break;

case "black_tremolo":
    // Black metal: tremolo picking costante
    playGuitar = true;
    inst = guitarPalm;
    kick = (s % 4 === 0 || s % 4 === 2);
    snare = (s === 4 || s === 12);
    break;

case "stoner_doom":
    // Stoner/Doom: lento e pesante (es. Sleep, Electric Wizard)
    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
    if (s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = true; }
    if (s === 4 || s === 12) snare = true;
    break;

case "prog_odd":
    // Progressive metal in 7/8 o 5/4 (pattern asimmetrico)
    const oddPattern = [0, 2, 4, 6, 9, 11, 13];
    playGuitar = oddPattern.includes(s);
    kick = oddPattern.includes(s);
    snare = (s === 6 || s === 13);
    if (playGuitar) inst = guitarPalm;
    break;

case "folk_hop":
    // Folk metal con influssi dance (es. Korpiklaani, Finntroll)
    playGuitar = ([0, 4, 8, 12].includes(s));
    kick = ([0, 3, 6, 8, 11, 14].includes(s));
    snare = (s === 4 || s === 12);
    if (playGuitar) inst = guitarOpen;
    break;

case "metalcore_breakdown":
    // Breakdown metalcore lento e pesante
    if (s === 0 || s === 4 || s === 8 || s === 12) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }
    if (s === 6 || s === 14) snare = true;
    break;

case "speed_metal":
    // Speed metal puro (es. early Helloween, Running Wild)
    kick = true;
    playGuitar = true;
    inst = guitarPalm;
    snare = (s === 4 || s === 12);
    if (s % 4 === 0) inst = guitarOpen;
    break;

case "epic_buildup":
    // Crescendo epico per bridge o pre-chorus (es. Manowar, Rhapsody)
    const buildupIntensity = Math.floor(s / 4);
    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
    if (buildupIntensity > 1 && s % 4 === 0) { 
        playGuitar = true; 
        inst = guitarOpen; 
        sustain = true; 
        kick = true; 
    }
    if (buildupIntensity > 2 && s === 14) snare = true;
    if (buildupIntensity > 3) kick = true;
    break;

case "death_roll":
    // Stile death metal con doppio pedale continuo (es. Death, Carcass)
    kick = (s % 2 === 0);
    snare = (s % 4 === 1 || s % 4 === 3);
    playGuitar = (s % 2 === 0);
    inst = guitarPalm;
    if (s % 8 === 0) inst = guitarOpen;
    break;

case "power_ballad":
    // Power ballad: lenta, emotiva, accordi aperti
    if (s === 0 || s === 8) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }
    if (s === 4 || s === 12) snare = true;
    break;

case "thrash_skank":
    // Skank beat thrash metal (es. Anthrax, Slayer)
    playGuitar = true;
    inst = guitarPalm;
    kick = (s % 4 === 0 || s % 4 === 2);
    snare = (s % 4 === 1 || s % 4 === 3);
    if (s % 8 === 0) inst = guitarOpen;
    break;

case "djent":
    // Djent moderno: sincopi pesanti, palm mute (es. Meshuggah, Periphery)
    playGuitar = ([0, 3, 5, 8, 11, 13].includes(s));
    kick = ([0, 3, 5, 8, 11, 13].includes(s));
    snare = (s === 6 || s === 14);
    inst = guitarPalm;
    if (s === 0 || s === 8) inst = guitarOpen;
    break;
    
    case "ballad_intro_arpeggio":
    if ([0, 4, 8, 12].includes(s)) {
        playGuitar = true;
        inst = AcousticGuitar;
        sustain = false;
    }

    // Pad armonico
    if (s === 0 && StStringPad) {
        StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
    }

    // Batteria soft
    if (s % 4 === 0) {
        try { drums.player("hihat").start(absoluteTime); } catch(e){}
    }
break;

case "ballad_verse_arpeggio":
    if ([0, 4, 8, 12].includes(s)) {
        playGuitar = true;
        inst = AcousticGuitar;
        sustain = false;
    }

    if (s === 0 && StStringPad) {
        StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
    }

    if (s % 4 === 0) {
        try { drums.player("hihat").start(absoluteTime); } catch(e){}
    }
break;

case "ballad_verse_open":
    if (s === 0) {
        playGuitar = true;
        inst = AcousticGuitar;
        sustain = true;

        const gNote = normalizeNote(currentRoot, "guitarLead") + "3";
        inst.triggerAttackRelease(gNote, "1n", absoluteTime);

        if (StStringPad) {
            StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
        }
    }
break;

case "ballad_pre_open":
    if (s === 0) {
        playGuitar = true;
        inst = AcousticGuitar;
        sustain = true;

        const gNote = normalizeNote(currentRoot, "guitarLead") + "4";
        inst.triggerAttackRelease(gNote, "1n", absoluteTime);

        if (StStringPad) {
            StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
        }
    }

    if (s % 4 === 0) {
        try { drums.player("hihat").start(absoluteTime); } catch(e){}
    }
break;

case "ballad_chorus_strum":
    if (s === 0) {
        inst = AcousticGuitar;
        sustain = true;

        const root = normalizeNote(currentRoot, "guitarLead");
        const fifth = Tone.Frequency(root + "3").transpose(7).toNote();
        const octave = Tone.Frequency(root + "3").transpose(12).toNote();

        Tone.Transport.schedule(t => {
            inst.triggerAttackRelease(root + "3", "1n", t);
            inst.triggerAttackRelease(fifth, "1n", t + 0.03);
            inst.triggerAttackRelease(octave, "1n", t + 0.06);
        }, absoluteTime);

        if (StStringPad) {
            StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
        }

        try { drums.player("crash1").start(absoluteTime); } catch(e){}
    }
break;

case "ballad_outro_open":
    if (s === 0) {
        inst = AcousticGuitar;
        sustain = true;

        const gNote = normalizeNote(currentRoot, "guitarLead") + "3";
        inst.triggerAttackRelease(gNote, "2n", absoluteTime);

        if (StStringPad) {
            StStringPad.triggerAttackRelease(currentRoot + "3", "2n", absoluteTime);
        }

        try { drums.player("crash1").start(absoluteTime); } catch(e){}
    }
break;

case "intro_epic_pad":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }
    if (s === 0 && StStringPad) {
        StStringPad.triggerAttackRelease(currentRoot + "3", "2n", absoluteTime);
    }
break;

case "intro_epic_timpani":
    if (s % 2 === 0) kick = true;
    if (s === 0 && StStringPad) {
        StStringPad.triggerAttackRelease(currentRoot + "3", "1n", absoluteTime);
    }
break;

case "outro_sustain":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }
    if (s === 0 && StStringPad) {
        StStringPad.triggerAttackRelease(currentRoot + "3", "2n", absoluteTime);
    }
break;

case "outro_timpani":
    if (s % 4 === 0) kick = true;
    if (s === 0 && StStringPad) {
        StStringPad.triggerAttackRelease(currentRoot + "3", "2n", absoluteTime);
    }
break;

case "outro_final_hit":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
        snare = true;
        try { drums.player("crash1").start(absoluteTime); } catch(e){}
    }
break;

case "outro_epic_hit":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
        snare = true;
        try { drums.player("crash2").start(absoluteTime); } catch(e){}
    }
break;

case "outro_epic_roll":
    if (s % 2 === 0) kick = true;
    try { drums.player("tom1").start(absoluteTime); } catch(e){}
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
    }
break;

case "outro_epic_finale":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
        snare = true;
        try { drums.player("crash2").start(absoluteTime); } catch(e){}
    }
    if (s === 8) {
        kick = true;
        snare = true;
    }
break;


    // ========== DEFAULT ==========
    default:
        if (s % 2 === 0) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
        if (s === 4 || s === 12) snare = true;
        break;
}

            const isFillZone = isLastMeasure && s >= 12;
            if (isFillZone && complexity > 0.4) {
                playGuitar = true; inst = guitarPalm; sustain = false; kick = true; snare = (s % 2 === 0 || s > 14);
                const currMidi = Tone.Frequency(currentRoot + "2").toMidi();
                const nextMidi = Tone.Frequency((nextRoot || currentRoot) + "2").toMidi();
                const stepScale = Math.round(((nextMidi - currMidi) / 4) * (s - 11));
                customNote = Tone.Frequency(currMidi + stepScale, "midi").toNote();
            }

            // --- 1. SCHEDULAZIONE CHITARRA E BASSO ---
            if (playGuitar) {
                const rootToUse = customNote || currentRoot;
                let gNote;
if (isBalladGroove) {
    gNote = normalizeNote(rootToUse, "guitarLead") + "3"; // acustica suona più alta
} else {
    gNote = normalizeNote(rootToUse, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
}
                const bNote = normalizeNote(rootToUse, "bass") + "1";
                const palmLen = texture < 0.3 ? "8n" : "16n";

                Tone.Transport.schedule(t => {
                
// STOP PRECEDENTE NOTA (solo per guitarOpen)
if (inst === guitarOpen) {
    // Fermiamo la nota precedente 2 ms dopo l'attacco della nuova
    Tone.Transport.schedule((stopTime) => {
        try { inst.triggerRelease(stopTime); } catch(e) {}
    }, t + 0.002);
}

// Suona la nuova nota
inst.triggerAttackRelease(
    gNote,
    sustain ? "1n" : palmLen,
    t
);

                    //inst.triggerAttackRelease(gNote, sustain ? "1n" : palmLen, t);

if (!isBalladGroove) {
    bass.triggerAttackRelease(bNote, sustain ? "1n" : "16n", t);
}


                    Tone.Draw.schedule(() => {
                        if (score) {
                            score.addNote("Rhythm", gNote, section.name);
                            if (!isBalladGroove) {
    score.addNote("Bass", bNote, section.name);
}

                        }
                    }, t);
                }, absoluteTime);
            }

            // --- 2. SCHEDULAZIONE BATTERIA (DRUMS) ---
            if (isBalladGroove) {
    // niente snare
    snare = false;

    // kick solo sul primo step
    if (s !== 0) kick = false;

    // hi-hat morbido ogni 4 step
    if (s % 4 === 0) {
        try { drums.player("hihat").start(absoluteTime); } catch(e){}
    }

    // niente tom nei fill
    //return;
    continue;
}

Tone.Transport.schedule(time => {
                let playedHiHat = false;
                let playedRide = false;
                let playedCrash = false;

                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                // Piatti (Hihat / Ride)
                if (s % 2 === 0 && !isLastMeasure) {
                    try { 
                        const cymbal = (isChorus || energy > 0.7) ? "ride" : "hihat";
                        drums.player(cymbal).start(time); 
                        if (cymbal === "ride") playedRide = true; else playedHiHat = true;
                    } catch(e) {}
                }
                
                // Crash iniziale di sezione
                if (s === 0 && m === 0) { 
                    try { drums.player("crash1").start(time); playedCrash = true; } catch(e) {} 
                }

                // Tom del Fill
                if (isFillZone) { 
                    try { drums.player("tom" + (s - 11)).start(time); } catch(e) {} 
                }

                // --- AGGIORNAMENTO VISIVO BATTERIA (MAPPATURA CORRETTA) ---
                Tone.Draw.schedule(() => {
                    if (score) {
                        // Usiamo i nomi esatti che scoreUI ver. 006 riconosce
                        if (kick) score.addNote("Drums", "Kick", section.name);
                        if (snare) score.addNote("Drums", "Snare", section.name);
                        
                        // Aggiungiamo i piatti per vedere le "X" in alto
                        if (playedHiHat) score.addNote("Drums", "HiHat", section.name);
                        if (playedRide)  score.addNote("Drums", "HiHat", section.name); // Ride usa stessa altezza HH o simile
                        if (playedCrash) score.addNote("Drums", "Crash", section.name);
                        
                        // I Tom li mappiamo come Snare o una via di mezzo per ora
                        if (isFillZone) score.addNote("Drums", "Snare", section.name);
                    }
                }, time);

            }, absoluteTime);
        }
    }
}
