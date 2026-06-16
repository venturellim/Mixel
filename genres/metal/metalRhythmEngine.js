// metalRhythmEngine.js — ver. 023 COMPLETO (Metal + Ballad)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";
import {
    leadPadRhythmLibrary,    
    leadPadMelodicLibrary 
} from "../../utils/leadLibraries.js";

console.log("metalRhythmEngine.js ver. 032 loaded");

// ============================================================
// FUNZIONI DI SUPPORTO PER LA BALLAD
// ============================================================

function cleanRoot(root) {
    return root.replace(/[0-9]/g, "").toUpperCase();
}

function buildThird(root) {
    const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const clean = cleanRoot(root);
    let idx = scale.indexOf(clean);
    if (idx === -1) idx = 0;
    return scale[(idx + 3) % 12];
}

function buildFifth(root) {
    const scale = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    const clean = cleanRoot(root);
    let idx = scale.indexOf(clean);
    if (idx === -1) idx = 0;
    return scale[(idx + 7) % 12];
}


// ============================================================
// PAD CHORD BUILDER (per epic metal)
// ============================================================
function buildPadChord(root, octave, type = "triad") {
    const intervals = {
        triad: [0, 4, 7],
        triad7: [0, 4, 7, 11],
        triad9: [0, 4, 7, 14],
        open9: [0, 7, 14],
        epicSpread: [0, 7, 12, 14, 19],
        cinematic: [0, 5, 12, 17]
    };
    const chosen = intervals[type] || intervals.triad;
    return chosen.map(semi => {
        const midi = Tone.Frequency(root + octave).toMidi() + semi;
        const note = Tone.Frequency(midi, "midi").toNote();
        return normalizeNote(note, "StStringPad");
    });
}

// ============================================================
// SCHEDULE PAD PER EPIC METAL
// ============================================================

function schedulePadInRhythm(section, progression, instruments, params, rand) {
    const pad = instruments.StStringPad;
    if (!pad || !pad.loaded) return;
    
    const name = section.name?.toLowerCase() || "";
    let rhythmLib = null, melodicLib = null, chordType = "epicSpread";
    
    // SELEZIONE LIBRERIA IN BASE ALLA SEZIONE
    if (name.includes("verse")) {
        rhythmLib = leadPadRhythmLibrary.static;
        chordType = "triad";
    } else if (name.includes("pre")) {
        rhythmLib = leadPadRhythmLibrary.motion;
        chordType = "triad9";
    } else if (name.includes("chorus")) {
        rhythmLib = leadPadRhythmLibrary.octaveSpread;
        chordType = "epicSpread";
    } else {
        rhythmLib = leadPadRhythmLibrary.static;
        chordType = "cinematic";
    }
    
    // Scegli un pattern random dalla libreria
    const pattern = rhythmLib[Math.floor(rand() * rhythmLib.length)];
    if (!pattern) return;
    
    const chordSymbol = progression[0] || "C";
    const rootMatch = chordSymbol.match(/[A-G][b#]?/i);
    const root = rootMatch ? rootMatch[0].toUpperCase() : "C";
    const octave = 3;
    const baseChord = buildPadChord(root, octave, chordType);
    
    const measureDur = Tone.Time("1m").toSeconds();
    const stepDur = measureDur / 16;
    
    pattern.forEach(step => {
        const time = section.startTime + step * stepDur;
        pad.triggerAttackRelease(baseChord, stepDur * 2, time, 0.7);
    });
}

// ============================================================
// FUNZIONE PRINCIPALE
// ============================================================

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
console.log("🔍 instruments disponibili:", Object.keys(instruments));
    console.log("🔍 scheduleRhythm - instruments keys:", Object.keys(instruments));
    console.log("🔍 acousticChordMajor:", instruments.acousticChordMajor ? "esiste" : "NULL");
    console.log("🔍 acousticChordMinor:", instruments.acousticChordMinor ? "esiste" : "NULL");
    
    const { drums, guitarPalm, guitarOpen, bass, acousticChordMajor, acousticChordMinor, StStringPad } = instruments;
    
    if (!drums || !guitarPalm || !bass) return;

    const hasAcoustic = !!(acousticChordMajor || acousticChordMinor);
    
    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") || (name.includes("solo") && !name.includes("pre"));
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro");
    const isOutro = name.includes("outro");
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5, texture = 0.5 } = params?.imageParams || {};
    
// ============================================================
    // METAL MODE NORMALE (groove completo)
    // ============================================================

    const grooves = {
    intro: ["intro_ambient", "intro_heavy_strikes", "stratovarius_intro", "doom_slow", "cinematic_buildup", "industrial_static", "stoner_doom", "power_ballad",
        "ballad_intro_strum", "ballad_intro_slow"],
    verse: ["gallop_classic", "gallop_triplet", "thrash_diamond", "palm_mute_chug", "motorhead_drive", "technical_sync", "meshuggah_ish", "breakdown_heavy", "jump_groove", "double_time_punk", "power_gallop", "groove_metal", "black_tremolo", "speed_metal", "death_roll", "thrash_skank",
        "epic_verse_open", "epic_verse_ride", "epic_verse_pad",
        "ballad_verse_simple", "ballad_verse_strum"],
    prechorus: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension", "epic_buildup", "power_ballad",
        "epic_pre_timpani", "epic_pre_build", "epic_pre_sustain",
        "ballad_pre_build"],
    bridge: ["pre_build_up", "driving_eights", "march_to_war", "suspended_tension", "epic_buildup", "power_ballad"],
    chorus: ["helloween_speed", "chorus_pure_sustain", "chorus_sustain_hit", "anthem_half_time", "power_ride_groove", "double_kick_wall", "blast_beat_light", "epic_waltz_feel", "symphonic_blast", "power_gallop", "speed_metal", "power_ballad", "epic_chorus_anthem",
        "epic_chorus_sustain", "epic_chorus_double",
        "ballad_chorus_full", "ballad_chorus_simple"]
};

    const grooveCharacteristics = {
        "intro_ambient": { energy: 0.2, brightness: 0.3, complexity: 0.2 },
        "intro_heavy_strikes": { energy: 0.6, brightness: 0.5, complexity: 0.3 },
        "stratovarius_intro": { energy: 0.7, brightness: 0.7, complexity: 0.4 },
        "cinematic_buildup": { energy: 0.4, brightness: 0.6, complexity: 0.3 },
        "industrial_static": { energy: 0.5, brightness: 0.3, complexity: 0.6 },
        "doom_slow": { energy: 0.3, brightness: 0.2, complexity: 0.2 },
        "stoner_doom": { energy: 0.3, brightness: 0.2, complexity: 0.3 },
        "power_ballad": { energy: 0.4, brightness: 0.6, complexity: 0.3 },
        "gallop_classic": { energy: 0.7, brightness: 0.5, complexity: 0.5 },
        "gallop_triplet": { energy: 0.7, brightness: 0.5, complexity: 0.6 },
        "power_gallop": { energy: 0.8, brightness: 0.7, complexity: 0.5 },
        "thrash_diamond": { energy: 0.9, brightness: 0.4, complexity: 0.7 },
        "palm_mute_chug": { energy: 0.6, brightness: 0.3, complexity: 0.3 },
        "motorhead_drive": { energy: 0.8, brightness: 0.5, complexity: 0.4 },
        "technical_sync": { energy: 0.6, brightness: 0.5, complexity: 0.9 },
        "meshuggah_ish": { energy: 0.7, brightness: 0.3, complexity: 0.8 },
        "breakdown_heavy": { energy: 0.5, brightness: 0.2, complexity: 0.4 },
        "jump_groove": { energy: 0.7, brightness: 0.4, complexity: 0.5 },
        "double_time_punk": { energy: 0.8, brightness: 0.5, complexity: 0.4 },
        "groove_metal": { energy: 0.6, brightness: 0.3, complexity: 0.6 },
        "black_tremolo": { energy: 0.8, brightness: 0.2, complexity: 0.7 },
        "speed_metal": { energy: 0.9, brightness: 0.6, complexity: 0.6 },
        "death_roll": { energy: 0.9, brightness: 0.2, complexity: 0.7 },
        "thrash_skank": { energy: 0.9, brightness: 0.4, complexity: 0.6 },
        "pre_build_up": { energy: 0.5, brightness: 0.5, complexity: 0.4 },
        "driving_eights": { energy: 0.7, brightness: 0.5, complexity: 0.3 },
        "march_to_war": { energy: 0.6, brightness: 0.4, complexity: 0.4 },
        "suspended_tension": { energy: 0.4, brightness: 0.5, complexity: 0.3 },
        "epic_buildup": { energy: 0.5, brightness: 0.7, complexity: 0.4 },
        "prog_odd": { energy: 0.6, brightness: 0.5, complexity: 0.9 },
        "metalcore_breakdown": { energy: 0.4, brightness: 0.3, complexity: 0.4 },
        "helloween_speed": { energy: 0.9, brightness: 0.7, complexity: 0.6 },
        "chorus_pure_sustain": { energy: 0.7, brightness: 0.7, complexity: 0.3 },
        "chorus_sustain_hit": { energy: 0.8, brightness: 0.7, complexity: 0.4 },
        "anthem_half_time": { energy: 0.7, brightness: 0.8, complexity: 0.3 },
        "power_ride_groove": { energy: 0.8, brightness: 0.6, complexity: 0.4 },
        "double_kick_wall": { energy: 0.9, brightness: 0.5, complexity: 0.5 },
        "blast_beat_light": { energy: 1.0, brightness: 0.3, complexity: 0.7 },
        "epic_waltz_feel": { energy: 0.6, brightness: 0.7, complexity: 0.4 },
        "symphonic_blast": { energy: 0.9, brightness: 0.8, complexity: 0.7 },
        "folk_hop": { energy: 0.7, brightness: 0.7, complexity: 0.5 },
        "djent": { energy: 0.6, brightness: 0.3, complexity: 0.9 },
        // ===== EPIC VERSE =====
"epic_verse_open":   { energy: 0.5, brightness: 0.7, complexity: 0.3, tempo: "slow" },
"epic_verse_ride":   { energy: 0.6, brightness: 0.7, complexity: 0.4, tempo: "medium" },
"epic_verse_pad":    { energy: 0.4, brightness: 0.8, complexity: 0.3, tempo: "slow" },

// ===== EPIC PRECHORUS =====
"epic_pre_timpani":  { energy: 0.5, brightness: 0.6, complexity: 0.4, tempo: "slow" },
"epic_pre_build":    { energy: 0.6, brightness: 0.7, complexity: 0.5, tempo: "medium" },
"epic_pre_sustain":  { energy: 0.4, brightness: 0.8, complexity: 0.3, tempo: "slow" },

// ===== EPIC CHORUS =====
"epic_chorus_anthem": { energy: 0.8, brightness: 0.9, complexity: 0.4, tempo: "medium" },
"epic_chorus_sustain":{ energy: 0.7, brightness: 0.9, complexity: 0.3, tempo: "slow" },
"epic_chorus_double": { energy: 0.9, brightness: 0.8, complexity: 0.5, tempo: "fast" },
// ===== BALLAD GROOVES =====
"ballad_intro_strum": { 
    energy: 0.22, brightness: 0.3, complexity: 0.2, 
    pattern: [0, 4, 8, 12],
    acoustic: true,
    duration: "16n"
},
"ballad_intro_slow": { 
    energy: 0.2, brightness: 0.3, complexity: 0.18, 
    pattern: [0, 8],
    acoustic: true,
    duration: "8n"
},
"ballad_verse_simple": { 
    energy: 0.28, brightness: 0.32, complexity: 0.22, 
    pattern: [0, 6, 12],
    acoustic: true,
    duration: "16n"
},
"ballad_verse_strum": { 
    energy: 0.3, brightness: 0.35, complexity: 0.25, 
    pattern: [0, 4, 8, 12],
    acoustic: true,
    duration: "16n"
},
"ballad_pre_build": { 
    energy: 0.35, brightness: 0.38, complexity: 0.3, 
    pattern: [0, 4, 7, 11, 12],
    acoustic: true,
    duration: "16n"
},
"ballad_chorus_full": { 
    energy: 0.4, brightness: 0.42, complexity: 0.35, 
    pattern: [0, 2, 4, 6, 8, 10, 12, 14],
    acoustic: true,
    duration: "16n"
},
"ballad_chorus_simple": { 
    energy: 0.35, brightness: 0.4, complexity: 0.3, 
    pattern: [0, 8],
    acoustic: true,
    duration: "8n"
}
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
        return scoredGrooves[0].name;
    };

    const currentGroove = getGroove(
        isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse")),
        energy, brightness, complexity
    );
    
    // Determina se la scala è minore (per gli accordi acustici)
const isMinor = (params?.imageParams?.mood < 0.5) || params?.scaleType?.includes("minor");

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;
        const isLastMeasure = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, sustain = false, customNote = null;
            let inst = guitarPalm;

            if (isChorus) {
                inst = (rand() < 0.85) ? guitarOpen : guitarPalm;
            }
            
            // Verifica se il groove corrente è acustico (ballad)
const currentGrooveData = grooveCharacteristics[currentGroove];
const isAcousticGroove = currentGrooveData?.acoustic === true;

            // LOGICA GROOVE
            switch (currentGroove) {
            case "ballad_intro_strum":
case "ballad_intro_slow":
case "ballad_verse_simple":
case "ballad_verse_strum":
case "ballad_pre_build":
case "ballad_chorus_full":
case "ballad_chorus_simple":

    // ============================================================
    // BALLAD GROOVE - usa il pattern dal grooveCharacteristics
    // ============================================================
    
    // 1. CHITARRA ACUSTICA (o elettrica clean)
    const pattern = currentGrooveData.pattern;
    if (pattern.includes(s)) {
        playGuitar = true;
        inst = isMinor ? acousticChordMinor : acousticChordMajor;
        sustain = true;
    }
    
    // 2. BASSO - sul kick (inizio misura)
    if (s === 0 && bass) {
        const bassNote = normalizeNote(currentRoot, "bass") + "1";
        Tone.Transport.schedule(t => {
            bass.triggerAttackRelease(bassNote, "2n", t, 0.5);
            if (score) score.addNote("Bass", bassNote, section.name);
        }, absoluteTime);
    }
    
    // 3. BATTERIA - soft
    // Kick all'inizio misura
    if (s === 0) {
        kick = true;
    }
    
    // Ride ogni 2 misure (sul beat 8, che è metà misura)
    if (s === 8 && m % 2 === 0) {
        Tone.Transport.schedule(t => {
            try { drums.player("ride").start(t); } catch(e){}
            if (score) score.addNote("Drums", "Ride", section.name);
        }, absoluteTime);
    }
    
    // Snare leggera ogni 2 misure (sul beat 4 e 12)
    if ((s === 4 || s === 12) && m % 2 === 0) {
        snare = true;
    }
    
    // 4. FILL ZONE PER BALLAD (rullata sul ride)
    const isBalladFill = isLastMeasure && s >= 12 && complexity > 0.3;
    
    if (isBalladFill) {
        // Rullata di ride invece del kick
        // Ogni 2 sedicesimi (12, 14)
        if (s === 12 || s === 14) {
            Tone.Transport.schedule(t => {
                try { drums.player("ride").start(t); } catch(e){}
                if (score) score.addNote("Drums", "RideFill", section.name);
            }, absoluteTime);
        }
        
        // Un colpo di snare o tom leggero alla fine
        if (s === 15) {
            Tone.Transport.schedule(t => {
                try { drums.player("snare").start(t, 0, 0.3); } catch(e){}  // velocity 0.3 = soft
                if (score) score.addNote("Drums", "SnareFill", section.name);
            }, absoluteTime);
        }
    }
    break;
    
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
                    playGuitar = true; inst = guitarPalm; kick = (s % 2 === 0);
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "motorhead_drive":
                    playGuitar = true; inst = guitarPalm; kick = (s % 2 === 0); snare = (s === 4 || s === 12);
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
                    kick = (s % 4 === 0 || s % 4 === 1); snare = (s % 4 === 2); playGuitar = (s % 2 === 0);
                    break;
                case "pre_build_up":
                    kick = (s % 4 === 0); snare = (s === 12); playGuitar = (s % 2 === 0);
                    break;
                case "driving_eights":
                    kick = (s % 2 === 0); snare = (s === 4 || s === 12); playGuitar = true;
                    break;
                case "march_to_war":
                    kick = ([0, 4, 8, 12].includes(s)); snare = (s === 4 || s === 12);
                    playGuitar = ([0, 2, 4, 6, 8, 10, 12, 14].includes(s));
                    if (playGuitar) inst = guitarPalm;
                    if (s === 0 || s === 8) inst = guitarOpen;
                    break;
                case "suspended_tension":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 12) snare = true;
                    break;
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
                    playGuitar = true; inst = guitarOpen; kick = (s % 4 === 0); snare = (s === 4 || s === 12);
                    break;
                case "double_kick_wall":
                    kick = true; playGuitar = true; if (s === 4 || s === 12) snare = true;
                    break;
                case "blast_beat_light":
                    kick = true; snare = (s % 2 !== 0); playGuitar = true;
                    break;
                case "epic_waltz_feel":
                    if (s % 3 === 0) { playGuitar = true; inst = guitarOpen; kick = true; }
                    if (s === 6 || s === 12) snare = true;
                    break;
                case "power_gallop":
                    if (s % 4 !== 1) { 
                        playGuitar = true; 
                        inst = (s % 8 === 0 || s % 8 === 4) ? guitarOpen : guitarPalm;
                        kick = (s % 4 === 0); 
                    }
                    if (s === 4 || s === 12) snare = true;
                    if (s === 8) kick = true;
                    break;
                case "symphonic_blast":
                    kick = true; snare = (s % 2 !== 0); playGuitar = (s % 4 === 0);
                    if (playGuitar) { inst = guitarOpen; sustain = true; }
                    break;
                case "groove_metal":
                    playGuitar = ([0, 3, 5, 8, 10, 13].includes(s));
                    kick = ([0, 3, 5, 8, 10, 13].includes(s));
                    snare = (s === 6 || s === 14);
                    if (playGuitar) inst = guitarPalm;
                    break;
                case "black_tremolo":
                    playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0 || s % 4 === 2); snare = (s === 4 || s === 12);
                    break;
                case "stoner_doom":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; snare = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "prog_odd":
                    const oddPattern = [0, 2, 4, 6, 9, 11, 13];
                    playGuitar = oddPattern.includes(s); kick = oddPattern.includes(s); snare = (s === 6 || s === 13);
                    if (playGuitar) inst = guitarPalm;
                    break;
                case "folk_hop":
                    playGuitar = ([0, 4, 8, 12].includes(s)); kick = ([0, 3, 6, 8, 11, 14].includes(s)); snare = (s === 4 || s === 12);
                    if (playGuitar) inst = guitarOpen;
                    break;
                case "metalcore_breakdown":
                    if (s === 0 || s === 4 || s === 8 || s === 12) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 6 || s === 14) snare = true;
                    break;
                case "speed_metal":
                    kick = true; playGuitar = true; inst = guitarPalm; snare = (s === 4 || s === 12);
                    if (s % 4 === 0) inst = guitarOpen;
                    break;
                case "epic_buildup":
                    const buildupIntensity = Math.floor(s / 4);
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (buildupIntensity > 1 && s % 4 === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (buildupIntensity > 2 && s === 14) snare = true;
                    if (buildupIntensity > 3) kick = true;
                    break;
                case "death_roll":
                    kick = (s % 2 === 0); snare = (s % 4 === 1 || s % 4 === 3); playGuitar = (s % 2 === 0); inst = guitarPalm;
                    if (s % 8 === 0) inst = guitarOpen;
                    break;
                case "power_ballad":
                    if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "thrash_skank":
                    playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0 || s % 4 === 2); snare = (s % 4 === 1 || s % 4 === 3);
                    if (s % 8 === 0) inst = guitarOpen;
                    break;
                case "djent":
                    playGuitar = ([0, 3, 5, 8, 11, 13].includes(s));
                    kick = ([0, 3, 5, 8, 11, 13].includes(s));
                    snare = (s === 6 || s === 14);
                    inst = guitarPalm;
                    if (s === 0 || s === 8) inst = guitarOpen;
                    break;
                    case "epic_verse_open":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }
    if (s % 4 === 0) snare = true;

if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}


break;
case "epic_verse_ride":
    if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}

    playGuitar = (s % 4 === 0);
    inst = guitarOpen;
    sustain = true;

    kick = (s % 4 === 0);
    snare = (s === 4 || s === 12);

    try { drums.player("ride").start(absoluteTime); } catch(e){}
break;
case "epic_verse_pad":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }

    if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}

    if (s === 4 || s === 12) snare = true;
break;
case "epic_pre_timpani":
    if (s % 2 === 0) kick = true;

    if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}

break;
case "epic_pre_build":
    if (s % 4 === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }

    if (s === 14) snare = true;

    if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}

break;
case "epic_pre_sustain":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }

    if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}

    if (s === 8) snare = true;
break;
case "epic_chorus_anthem":
    if (s % 4 === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }
    if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}

    if (s === 4 || s === 12) snare = true;

    try { drums.player("crash1").start(absoluteTime); } catch(e){}
break;
case "epic_chorus_sustain":
    if (s === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
        kick = true;
    }
    if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}

    if (s === 8) snare = true;

    try { drums.player("crash1").start(absoluteTime); } catch(e){}
break;
case "epic_chorus_double":
    kick = true;
    if (s === 0) {
    schedulePadInRhythm(section, progression, instruments, params, rand);}

    if (s % 4 === 0) {
        playGuitar = true;
        inst = guitarOpen;
        sustain = true;
    }

    if (s === 4 || s === 12) snare = true;

    try { drums.player("crash2").start(absoluteTime); } catch(e){}
break;
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

            // SCHEDULAZIONE CHITARRA E BASSO
            if (playGuitar) {
                const rootToUse = customNote || currentRoot;
                const gNote = normalizeNote(rootToUse, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(rootToUse, "bass") + "1";
                const palmLen = texture < 0.3 ? "8n" : "16n";

                Tone.Transport.schedule(t => {
                    if (inst === guitarOpen) {
                        Tone.Transport.schedule((stopTime) => { try { inst.triggerRelease(stopTime); } catch(e) {} }, t + 0.002);
                    }
                    inst.triggerAttackRelease(gNote, sustain ? "1n" : palmLen, t);
                    bass.triggerAttackRelease(bNote, sustain ? "1n" : "16n", t);
                    Tone.Draw.schedule(() => {
                        if (score) {
                            score.addNote("Rhythm", gNote, section.name);
                            score.addNote("Bass", bNote, section.name);
                        }
                    }, t);
                }, absoluteTime);
            }

            // SCHEDULAZIONE BATTERIA
            Tone.Transport.schedule(time => {
                let playedHiHat = false;
                let playedRide = false;
                let playedCrash = false;

                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                if (s % 2 === 0 && !isLastMeasure) {
                    try { 
                        const cymbal = (isChorus || energy > 0.7) ? "ride" : "hihat";
                        drums.player(cymbal).start(time); 
                        if (cymbal === "ride") playedRide = true; else playedHiHat = true;
                    } catch(e) {}
                }
                
                if (s === 0 && m === 0) { 
                    try { drums.player("crash1").start(time); playedCrash = true; } catch(e) {} 
                }

                if (isFillZone) { 
                    try { drums.player("tom" + (s - 11)).start(time); } catch(e) {} 
                }

                Tone.Draw.schedule(() => {
                    if (score) {
                        if (kick) score.addNote("Drums", "Kick", section.name);
                        if (snare) score.addNote("Drums", "Snare", section.name);
                        if (playedHiHat || playedRide) score.addNote("Drums", "HiHat", section.name);
                        if (playedCrash) score.addNote("Drums", "Crash", section.name);
                        if (isFillZone) score.addNote("Drums", "Snare", section.name);
                    }
                }, time);
            }, absoluteTime);
        }
    }
}