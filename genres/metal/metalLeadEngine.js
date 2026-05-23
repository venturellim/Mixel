// metalLeadEngine.js — ver. 090 (con supporto nuovi sample guitarLead)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

import {
    leadRhythmLibrary,
    leadMelodicLibrary
} from "../../utils/leadLibraries.js";

import {
    applyLeadEnhancer,
    computeLeadVelocity,
    shapeBridgeSolo
} from "../../utils/leadEnhancers.js";

console.log("metalLeadEngine.js ver. 090 loaded");

// ============================================================
// NOTE DISPONIBILI PER GUITARLEAD (nuovi sample)
// ============================================================
// Sample disponibili: D2, F2, G#2, B2, D3, F3, G#3, B3, D4, F4, G#4, B4, D5, F5, G#5, B5, D6

const GUITAR_LEAD_NOTES = [
    "D2", "F2", "G#2", "B2",
    "D3", "F3", "G#3", "B3",
    "D4", "F4", "G#4", "B4",
    "D5", "F5", "G#5", "B5",
    "D6"
];

// Mappa le note della scala alle note disponibili più vicine
function mapToAvailableNotes(scaleNote, octave) {
    const targetNote = scaleNote + octave;
    
    // Se la nota esatta è disponibile, usala
    if (GUITAR_LEAD_NOTES.includes(targetNote)) {
        return targetNote;
    }
    
    // Trova la nota più vicina tra quelle disponibili
    let bestNote = GUITAR_LEAD_NOTES[0];
    let bestDist = Infinity;
    
    for (const available of GUITAR_LEAD_NOTES) {
        const targetMidi = Tone.Frequency(targetNote).toMidi();
        const availableMidi = Tone.Frequency(available).toMidi();
        const dist = Math.abs(availableMidi - targetMidi);
        if (dist < bestDist) {
            bestDist = dist;
            bestNote = available;
        }
    }
    
    return bestNote;
}

// ============================================================
// FLOYD ROSE (effetti chitarra)
// ============================================================

const LeadFloyd = {
    apply(guitarLead, time, type = "scoop") {
        if (!guitarLead || !guitarLead.playbackRate) return;
        const pr = guitarLead.playbackRate;

        if (type === "scoop") {
            pr.setValueAtTime(0.95, time);
            pr.linearRampToValueAtTime(1.0, time + 0.12);
        } else if (type === "dive") {
            pr.setValueAtTime(1.0, time);
            pr.exponentialRampToValueAtTime(0.7, time + 0.18);
            pr.linearRampToValueAtTime(1.0, time + 0.32);
        } else if (type === "vibrato") {
            for (let i = 0; i < 6; i++) {
                const t = time + i * 0.04;
                const val = i % 2 === 0 ? 0.98 : 1.02;
                pr.setValueAtTime(val, t);
            }
            pr.setValueAtTime(1.0, time + 0.25);
        }
    }
};

// ============================================================
// SELEZIONE FAMIGLIA MELODICA PER STILE
// ============================================================

function getMelodyFamilyByStyle(style, sectionType, energy, brightness, complexity, isSolo, isSoloPt2) {
    if (isSolo) {
        if (style === "PowerMetal") return { name: "SOLO EPIC 🏰", data: leadMelodicLibrary.epic };
        if (style === "ThrashMetal") return { name: "SOLO ACTIVE ⚡", data: leadMelodicLibrary.active };
        if (style === "DoomMetal") return { name: "SOLO EVIL 😈", data: leadMelodicLibrary.evil };
        if (style === "ProgressiveMetal") return { name: "SOLO ACTIVE ⚡", data: leadMelodicLibrary.active };
        if (style === "MelodicDeath") return { name: "SOLO EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
        return { name: "SOLO EPIC 🏰", data: leadMelodicLibrary.epic };
    }
    
    if (sectionType === "prechorus") return { name: "PRE-CHORUS 📈", data: leadMelodicLibrary.prechorus };
    if (sectionType === "chorus") {
        if (style === "PowerMetal" || style === "HeavyMetal") return { name: "EPIC 🏰", data: leadMelodicLibrary.epic };
        if (style === "ThrashMetal") return { name: "ACTIVE ⚡", data: leadMelodicLibrary.active };
        if (style === "DoomMetal") return { name: "EVIL 😈", data: leadMelodicLibrary.evil };
        if (brightness > 0.5) return { name: "EPIC 🏰", data: leadMelodicLibrary.epic };
        return { name: "EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
    }
    
    if (energy > 0.7 && complexity > 0.6) return { name: "ACTIVE ⚡", data: leadMelodicLibrary.active };
    if (complexity > 0.7) return { name: "ACTIVE ⚡", data: leadMelodicLibrary.active };
    if (brightness < 0.4) return { name: "EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
    return { name: "EPIC 🏰", data: leadMelodicLibrary.epic };
}

// ============================================================
// LEAD ENGINE
// ============================================================

const LeadLegacy = {
    schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score) {

        const { guitarLead } = instruments || {};
        if (!guitarLead) return;

        const name = section?.name?.toLowerCase() || "";
        const isChorus = name.includes("chorus") && !name.includes("pre");
        const isPreChorus = name.includes("pre");
        const isIntro = name.includes("intro") || name.includes("outro");
        const isSolo = name.includes("solo") || name.includes("bridge");
        const isSoloPt2 = name.includes("solopt2");
        const style = params?.style || "HeavyMetal";

        const stepTime = measureDur / 16;

        const {
            energy = 0.5,
            brightness = 0.5,
            texture = 0.5,
            complexity = 0.5
        } = params?.imageParams || {};

        const enhancerContext = { energy, brightness, texture, complexity };

        const isHarmonic = scaleType === "harmonicMinor";

        const getPattern = (type) => {
            const family = leadRhythmLibrary[type] || leadRhythmLibrary.verse;
            const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
            const index = Math.floor(Math.abs(dnaScore)) % family.length;
            return family[index];
        };

        let sectionType =
            isIntro ? "intro" :
            isPreChorus ? "prechorus" :
            isChorus ? "chorus" :
            "verse";

        const getStrictScale = (root) => {
            const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            let cleanRoot = root.replace(/[0-9]/g, "").toUpperCase();
            const alt = { DB: "C#", EB: "D#", GB: "F#", AB: "G#", BB: "A#" };
            cleanRoot = alt[cleanRoot] || cleanRoot;
            let idx = allNotes.indexOf(cleanRoot);
            if (idx === -1) idx = 9;
            const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
            return intervals.map(i => allNotes[(idx + i) % 12]);
        };

        for (let m = 0; m < section.measures; m++) {

            const measureStartTime = section.startTime + m * measureDur;

            let currentPattern;
            let currentMelody;
            let moodName;

            if (isSolo) {

                const basePattern = getPattern("chorus");

                currentPattern = applyLeadEnhancer(basePattern, "enhanceRhythmPattern", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "enhanceRhythmGhostSteps", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addAnticipation", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addStrategicPause", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addPolyrhythmHint", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addGentleSwing", enhancerContext);
                currentPattern = applyLeadEnhancer(currentPattern, "addGhostAccent", enhancerContext);

                const soloFamily = getMelodyFamilyByStyle(style, "solo", energy, brightness, complexity, true, isSoloPt2);
                const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
                const baseMelody = soloFamily.data[melodyIndex];

                currentMelody = applyLeadEnhancer(baseMelody, "enhanceMelodyLine", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "enhanceMelodyMicroVariation", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "enhanceChromaticPassing", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addTrills", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addBendEffect", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addSlideEffect", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addOctaveDoubling", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addMirrorInversion", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addEchoEffect", enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, "addScaleRunBetweenPeaks", enhancerContext);

                if (name.includes("bridge")) {
                    const shaped = shapeBridgeSolo(currentMelody, currentPattern);
                    currentMelody = shaped.melody;
                    currentPattern = shaped.pattern;
                }

                moodName = soloFamily.name + (isHarmonic ? " (HARMONIC)" : "");

            } else {

                currentPattern = getPattern(sectionType);
                const mood = getMelodyFamilyByStyle(style, sectionType, energy, brightness, complexity, false, false);
                const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
                currentMelody = mood.data[melodyIndex];
                moodName = mood.name;
            }

            const currentScale = getStrictScale(progression[m % progression.length] || "A");
            const isTransition = m === section.measures - 1;

            currentPattern.forEach((s, i) => {

                if (isTransition && s > 13 && energy > 0.6) return;

                const absoluteTime = measureStartTime + s * stepTime;
                const nextStep = currentPattern[i + 1] ?? 16;

                const noteIdx = currentMelody[i % currentMelody.length];
                const scaleNote = currentScale[noteIdx % 7];
                
                // Ottava in base alla sezione e stile
                let octave = 4;
                if (isChorus || isSolo) octave = 5;
                if (style === "PowerMetal" && isChorus) octave = 5;
                if (style === "DoomMetal") octave = 4;
                
                // Mappa la nota della scala alla nota disponibile più vicina
                const targetNote = scaleNote + octave;
                const noteName = mapToAvailableNotes(scaleNote, octave);

                Tone.Transport.schedule(time => {

                    const duration = (nextStep - s) * stepTime;
                    const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));

                    guitarLead.triggerAttackRelease(noteName, duration, time, velocity);

                    // Applica effetti Floyd Rose in base allo stile
                    if (style === "PowerMetal" && isChorus && Math.random() < 0.3) {
                        LeadFloyd.apply(guitarLead, time, "scoop");
                    } else if (style === "ThrashMetal" && Math.random() < 0.2) {
                        LeadFloyd.apply(guitarLead, time, "dive");
                    } else if (isSolo && !isSoloPt2 && Math.random() < 0.4) {
                        LeadFloyd.apply(guitarLead, time, "vibrato");
                    }

                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", noteName, section.name);
                    }, time);

                }, absoluteTime);
            });
        }
    }
};

// ============================================================
// API PUBBLICA
// ============================================================

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {

    const tonalCenter = params?.tonalCenter || params?.imageParams?.tonalCenter || "A4";
    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";

    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");

    LeadLegacy.schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score);
}