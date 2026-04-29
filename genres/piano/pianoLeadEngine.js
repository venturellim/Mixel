// pianoLeadEngine.js — ver. 001 (Metal Lead Logic → Piano)
import * as Tone from "https://esm.sh/tone";

import {
    leadRhythmLibrary,
    leadMelodicLibrary
} from "../../utils/leadLibraries.js";

import {
    applyLeadEnhancer,
    computeLeadVelocity,
    shapeBridgeSolo
} from "../../utils/leadEnhancers.js";

console.log("pianoLeadEngine.js ver. 002.1 loaded");

// ------------------------------------------------------------
// SCALA STRICT (copiata dal metalLeadEngine)
// ------------------------------------------------------------
function getStrictScale(root, isMinor) {
    const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let cleanRoot = root.replace(/[0-9]/g, "").toUpperCase();
    const alt = { DB: "C#", EB: "D#", GB: "F#", AB: "G#", BB: "A#" };
    cleanRoot = alt[cleanRoot] || cleanRoot;
    let idx = allNotes.indexOf(cleanRoot);
    if (idx === -1) idx = 9; // fallback A
    const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    return intervals.map(i => allNotes[(idx + i) % 12]);
}

// ------------------------------------------------------------
// SELEZIONE FAMIGLIA MELODICA PER L'ASSOLO (identica al metal)
// ------------------------------------------------------------
function getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture) {
    if (!isSoloPt2) {
        if (brightness > 0.5) return { name: "SOLO EPIC 🏰", data: leadMelodicLibrary.epic };
        return { name: "SOLO EMOTIONAL 💧", data: leadMelodicLibrary.emotional };
    } else {
        if (complexity > 0.6 || energy > 0.7) return { name: "SOLO ACTIVE ⚡", data: leadMelodicLibrary.active };
        return { name: "SOLO EVIL 😈", data: leadMelodicLibrary.evil };
    }
}

// ------------------------------------------------------------
// PIANO LEAD ENGINE (versione monofonica, con enhancer ovunque)
// ------------------------------------------------------------
export function schedulePianoLead(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    score
) {
    const { piano } = instruments || {};
    if (!piano) return;

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

    const tonalCenter = params?.tonalCenter || params?.imageParams?.tonalCenter || "A4";
    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");
    const isHarmonic = scaleType === "harmonicMinor";

    let sectionType =
        isIntro ? "intro" :
        isPreChorus ? "prechorus" :
        isChorus ? "chorus" :
        "verse";

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

    // --------------------------------------------------------
    // PATTERN & MELODIA DI BASE (identici al metal)
    // --------------------------------------------------------
    let currentPattern;
    let currentMelody;

    if (isSolo) {
        // SOLO: come metal, tanti enhancer subito
        const basePattern = getPattern("chorus");
        let pattern = [...basePattern];

        pattern = applyLeadEnhancer(pattern, "enhanceRhythmPattern", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "enhanceRhythmGhostSteps", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addAnticipation", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addStrategicPause", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addPolyrhythmHint", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addGentleSwing", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addGhostAccent", enhancerContext);

        const soloFamily = getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture);
        const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
        let baseMelody = soloFamily.data[melodyIndex];

        baseMelody = applyLeadEnhancer(baseMelody, "enhanceMelodyLine", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "enhanceMelodyMicroVariation", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "enhanceChromaticPassing", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "addTrills", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "addOctaveDoubling", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "addMirrorInversion", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "addEchoEffect", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "addScaleRunBetweenPeaks", enhancerContext);

        if (name.includes("bridge")) {
            const shaped = shapeBridgeSolo(baseMelody, pattern);
            currentMelody = shaped.melody;
            currentPattern = shaped.pattern;
        } else {
            currentMelody = baseMelody;
            currentPattern = pattern;
        }

    } else {
        // SEZIONI NORMALI: stessa scelta del metal, ma poi enhancer ogni 2 misure
        currentPattern = getPattern(sectionType);

        const mood = getMelodyFamily();
        const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
        currentMelody = [...mood.data[melodyIndex]];
    }

    // Lista di enhancer "leggeri" da usare ogni 2 misure
    const softEnhancers = [
        "enhanceMelodyLine",
        "enhanceMelodyMicroVariation",
        "enhanceChromaticPassing",
        "addEchoEffect"
    ];

    // --------------------------------------------------------
    // LOOP MISURE
    // --------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStartTime = section.startTime + m * measureDur;

        // Ogni 2 misure, se NON siamo nel solo, applica 1–2 enhancer alla melodia
        if (!isSolo && m % 2 === 0) {
            const enhCount = 1 + (rand() < 0.5 ? 0 : 1);
            for (let e = 0; e < enhCount; e++) {
                const enhName = softEnhancers[(rand() * softEnhancers.length) | 0];
                currentMelody = applyLeadEnhancer(currentMelody, enhName, enhancerContext);
            }
        }

        const currentScale = getStrictScale(progression[m % progression.length] || rootNote, isMinor);
        const isTransition = m === section.measures - 1;

        currentPattern.forEach((s, i) => {

            if (isTransition && s > 13 && energy > 0.6) return;

            const absoluteTime = measureStartTime + s * stepTime;
            const nextStep = currentPattern[i + 1] ?? 16;

            const noteIdx = currentMelody[i % currentMelody.length];

            const octave = (isChorus || isSolo) ? 5 : 4;
            const pitch = currentScale[Math.abs(noteIdx) % 7];
            const noteName = `${pitch}${octave}`;

            Tone.Transport.schedule(time => {

                const duration = (nextStep - s) * stepTime;
                const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));

                //piano.triggerAttackRelease(noteName, duration, time, velocity);
                
piano.triggerAttackRelease(noteName, duration, time, velocity, rhBus);


                if (score) {
                    Tone.Draw.schedule(() => {
                        score.addNote("Lead", noteName, section.name);
                    }, time);
                }

            }, absoluteTime);
        });
    }
}
