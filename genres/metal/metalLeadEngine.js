// metalLeadEngine.js — ver. 089 CLEAN

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

// Importiamo librerie e enhancer dal tuo utils
import {
    leadRhythmLibrary,
    leadMelodicLibrary
} from "../../utils/leadLibraries.js";

import {
    applyLeadEnhancer,
    computeLeadVelocity,
    shapeBridgeSolo
} from "../../utils/leadEnhancers.js";

console.log("metalLeadEngine.js ver. 089 loaded");

const AVAILABLE_GUITAR_NOTES = [
    "C2","D2","E2","F2","G#2","A2","B2",

    "C3","D3","E3","F3","G3","G#3","B3",

    "C#4","D4","E4","F4","G4","G#4","B4",

    "C5","D5","F5","G#5","A#5","B5",

    "C#6","D6"
];

let lastLeadSample = null;

function findNearestSample(note) {

    const targetMidi = Tone.Frequency(note).toMidi();

    let candidates = AVAILABLE_GUITAR_NOTES.map(n => {

        const midi = Tone.Frequency(n).toMidi();

        return {
            note: n,
            midi,
            distance: Math.abs(midi - targetMidi)
        };
    });

    // =====================================================
    // Preferisci note vicine al target
    // =====================================================

    candidates.sort((a, b) => a.distance - b.distance);

    // =====================================================
    // Mantieni coerenza melodica
    // =====================================================

    if (lastLeadSample) {

        const lastMidi = Tone.Frequency(lastLeadSample).toMidi();

        candidates = candidates.map(c => {

            const melodicDistance = Math.abs(c.midi - lastMidi);

            return {
                ...c,
                score:
                    c.distance * 2 +
                    melodicDistance * 0.7
            };
        });

        candidates.sort((a, b) => a.score - b.score);
    }

    // =====================================================
    // Evita pitch estremi
    // =====================================================

    let best = candidates[0];

    for (const c of candidates) {

        if (c.distance <= 2) {
            best = c;
            break;
        }
    }

    lastLeadSample = best.note;

    return best.note;
}

// ============================================================
// FLOYD ROSE (rimane locale al metal)
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
// SELEZIONE FAMIGLIA MELODICA PER L'ASSOLO
// (rimane identica, ma usa leadMelodicLibrary importata)
// ============================================================

function getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture) {
    if (!isSoloPt2) {
        if (brightness > 0.5) return { name: "SOLO EPIC 🏰", data: leadMelodicLibrary.epic };
        return { name: "SOLO EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
    } else {
        if (complexity > 0.6 || energy > 0.7) return { name: "SOLO ACTIVE ⚡", data: leadMelodicLibrary.active };
        return { name: "SOLO EVIL 😈", data: leadMelodicLibrary.evil };
    }
}

// ============================================================
// LEAD ENGINE (ripulito dagli enhancer locali)
// ============================================================
lastLeadSample = null;

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

        const getMelodyFamily = () => {
            if (isPreChorus) return { name: "PRE-CHORUS 📈", data: leadMelodicLibrary.prechorus };
            if (isChorus) {
                return brightness > 0.5
                    ? { name: "EPIC 🏰", data: leadMelodicLibrary.epic }
                    : { name: "EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
            }
            if (energy > 0.7 && texture > 0.6) return { name: "EVIL 😈", data: leadMelodicLibrary.evil };
            if (complexity > 0.7) return { name: "ACTIVE ⚡", data: leadMelodicLibrary.active };
            if (brightness < 0.4) return { name: "EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
            return { name: "EPIC 🏰", data: leadMelodicLibrary.epic };
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

                const soloFamily = getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture);
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

                const mood = getMelodyFamily();
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
                const octave = isChorus || isSolo ? 5 : 4;
                //const noteName = normalizeNote(currentScale[noteIdx % 7], "guitarLead") + octave;
                const rawNote =
    normalizeNote(currentScale[noteIdx % 7], "bass") + octave;

const noteName = findNearestSample(rawNote);
                Tone.Transport.schedule(time => {

                    const duration = (nextStep - s) * stepTime;
                    const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));
                    const microTiming = (Math.random() - 0.5) * 0.01;
const finalTime = time + microTiming;

const dynamicVelocity =
    velocity * (0.92 + Math.random() * 0.16);

                    //guitarLead.triggerAttackRelease(noteName, duration, time, velocity);
guitarLead.triggerAttackRelease(
    noteName,
    duration,
    finalTime,
    dynamicVelocity
);
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
