// pianoLeadEngine.js — ver. 003 (Fix funzione getMelodyFamily mancante)

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

console.log("pianoLeadEngine.js ver. 003 loaded");

// ------------------------------------------------------------
// SCALA STRICT
// ------------------------------------------------------------
function getStrictScale(root, isMinor) {
    const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let cleanRoot = root.replace(/[0-9]/g, "").toUpperCase();
    const alt = { DB: "C#", EB: "D#", GB: "F#", AB: "G#", BB: "A#" };
    cleanRoot = alt[cleanRoot] || cleanRoot;
    let idx = allNotes.indexOf(cleanRoot);
    if (idx === -1) idx = 9;
    const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
    return intervals.map(i => allNotes[(idx + i) % 12]);
}

// ------------------------------------------------------------
// getMelodyFamily (Aggiunta!)
// ------------------------------------------------------------
function getMelodyFamily(isPreChorus, isChorus, energy, brightness, complexity, texture) {
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
}

// ------------------------------------------------------------
// getSoloMelodyFamily
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
// PIANO LEAD ENGINE
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
    const { piano, rhBus } = instruments;
    if (!piano) {
        console.warn("🎹 pianoLeadEngine: piano non disponibile");
        return;
    }

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

    // --------------------------------------------------------
    // PATTERN & MELODIA DI BASE
    // --------------------------------------------------------
    let currentPattern;
    let currentMelody;

    if (isSolo) {
        const basePattern = getPattern("chorus");
        let pattern = [...basePattern];

        pattern = applyLeadEnhancer(pattern, "enhanceRhythmPattern", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "enhanceRhythmGhostSteps", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addAnticipation", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addStrategicPause", enhancerContext);

        const soloFamily = getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture);
        const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
        let baseMelody = soloFamily.data[melodyIndex];

        baseMelody = applyLeadEnhancer(baseMelody, "enhanceMelodyLine", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "enhanceMelodyMicroVariation", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "addOctaveDoubling", enhancerContext);
        baseMelody = applyLeadEnhancer(baseMelody, "addScaleRunBetweenPeaks", enhancerContext);

        currentMelody = baseMelody;
        currentPattern = pattern;

    } else {
        // SEZIONI NORMALI: ora getMelodyFamily esiste!
        currentPattern = getPattern(sectionType);
        const mood = getMelodyFamily(isPreChorus, isChorus, energy, brightness, complexity, texture);
        const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
        currentMelody = [...mood.data[melodyIndex]];
    }

    // Enhancer leggeri per sezioni normali
    const softEnhancers = [
        "enhanceMelodyLine",
        "enhanceMelodyMicroVariation",
        "enhanceChromaticPassing"
    ];

    // --------------------------------------------------------
    // LOOP MISURE
    // --------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStartTime = section.startTime + m * measureDur;

        if (!isSolo && m % 2 === 0) {
            const enhCount = 1 + (rand() < 0.5 ? 0 : 1);
            for (let e = 0; e < enhCount; e++) {
                const enhName = softEnhancers[Math.floor(rand() * softEnhancers.length)];
                currentMelody = applyLeadEnhancer(currentMelody, enhName, enhancerContext);
            }
        }

        const currentScale = getStrictScale(progression[m % progression.length] || rootNote, isMinor);
        const isTransition = m === section.measures - 1;

        // DEBUG: controlla che currentPattern non sia vuoto
        if (!currentPattern || currentPattern.length === 0) {
            console.warn(`🎹 pattern vuoto per sezione ${section.name}, measure ${m}`);
            continue;
        }

        for (let i = 0; i < currentPattern.length; i++) {
            const s = currentPattern[i];
            
            if (isTransition && s > 13 && energy > 0.6) continue;

            const absoluteTime = measureStartTime + s * stepTime;
            const nextStep = currentPattern[i + 1] ?? 16;
            const duration = (nextStep - s) * stepTime;

            const noteIdx = currentMelody[i % currentMelody.length] % 7;
            const octave = (isChorus || isSolo) ? 5 : 4;
            const pitch = currentScale[Math.abs(noteIdx)];
            
            if (!pitch) {
                console.warn(`🎹 pitch null per noteIdx=${noteIdx}, scale=${currentScale}`);
                continue;
            }
            
            const noteName = `${pitch}${octave}`;

            Tone.Transport.schedule(time => {
                const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));
                piano.triggerAttackRelease(noteName, duration, time, velocity, rhBus);
                
                Tone.Draw.schedule(() => {
                    if (score) score.addNote("Lead", noteName, section.name);
                }, time);
            }, absoluteTime);
        }
    }
    
    console.log(`🎹 pianoLead: scheduled per ${section.name}, measures=${section.measures}, pattern length=${currentPattern?.length}`);
}