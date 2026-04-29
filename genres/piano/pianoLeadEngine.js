// pianoLeadEngine.js — ver. 007 (Convertito da metalLeadEngine, ottimizzato per piano)

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

console.log("pianoLeadEngine.js ver. 007 loaded");

// ============================================================
// SCALA STRICT
// ============================================================
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

// ============================================================
// SELEZIONE FAMIGLIE MELODICHE
// ============================================================
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
// ENHANCER PER PIANO (selezione ridotta e più melodica)
// ============================================================

// Enhancer di base per tutte le sezioni (2 fissi)
const BASE_ENHANCERS = [
    "enhanceMelodyLine",           // aggiunge passing tones
    "enhanceMelodyMicroVariation"  // piccole variazioni
];

// Enhancer rotanti (ogni 2 misure, sostituisci i base con 2 di questi)
const ROTATING_ENHANCERS = [
    "enhanceChromaticPassing",
    "addOctaveDoubling",
    "addEchoEffect",
    "addScaleRunBetweenPeaks",
    "addSlideEffect"
];

// Enhancer per l'assolo (meno del metal, più musicali)
const SOLO_ENHANCERS = [
    "enhanceMelodyLine",
    "enhanceMelodyMicroVariation",
    "enhanceChromaticPassing",
    "addOctaveDoubling",
    "addScaleRunBetweenPeaks",
    "addEchoEffect"
    // escludo: addTrills (troppo meccanico), addBendEffect (non da piano), 
    // addMirrorInversion (troppo artefatto), addSlideEffect (non serve)
];

// ============================================================
// PIANO LEAD ENGINE
// ============================================================
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

    let sectionType =
        isIntro ? "intro" :
        isPreChorus ? "prechorus" :
        isChorus ? "chorus" :
        "verse";

    const getPattern = (type) => {
        const family = leadRhythmLibrary[type] || leadRhythmLibrary.verse;
        const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
        const index = Math.floor(Math.abs(dnaScore)) % family.length;
        return [...family[index]]; // copia
    };

    // ============================================================
    // PATTERN & MELODIA DI BASE
    // ============================================================
    let currentPattern;
    let currentMelody;
    let currentEnhancers = [...BASE_ENHANCERS]; // inizia con i base

    if (isSolo) {
        // ASSOLO: pattern dal chorus potenziato
        let pattern = getPattern("chorus");
        
        // Solo 2 enhancer ritmici leggeri
        pattern = applyLeadEnhancer(pattern, "enhanceRhythmPattern", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addAnticipation", enhancerContext);
        
        currentPattern = pattern;

        const soloFamily = getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture);
        const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
        let baseMelody = soloFamily.data[melodyIndex];

        // Applica SOLO_ENHANCERS alla melodia
        for (let enh of SOLO_ENHANCERS) {
            if (Math.random() < 0.6) { // 60% di probabilità per ogni enhancer
                baseMelody = applyLeadEnhancer(baseMelody, enh, enhancerContext);
            }
        }
        
        currentMelody = baseMelody;

    } else {
        // SEZIONI NORMALI
        currentPattern = getPattern(sectionType);
        const mood = getMelodyFamily(isPreChorus, isChorus, energy, brightness, complexity, texture);
        const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
        currentMelody = [...mood.data[melodyIndex]];

        // Espandi pattern se troppo corto
        if (currentPattern.length < currentMelody.length && currentPattern.length > 0) {
            const originalPattern = [...currentPattern];
            while (currentPattern.length < currentMelody.length) {
                for (let step of originalPattern) {
                    currentPattern.push(step);
                    if (currentPattern.length >= currentMelody.length) break;
                }
            }
            currentPattern.sort((a, b) => a - b);
            currentPattern = currentPattern.filter((step, idx, arr) => idx === 0 || step !== arr[idx - 1]);
        }
    }

    // ============================================================
    // LOOP MISURE
    // ============================================================
    for (let m = 0; m < section.measures; m++) {

        const measureStartTime = section.startTime + m * measureDur;

        // Ogni 2 misure, RUOTA gli enhancer (solo per sezioni normali)
        if (!isSolo && m % 2 === 0 && m > 0) {
            // Sostituisci i 2 enhancer base con 2 nuovi dalla lista rotante
            const newEnhancers = [];
            const shuffled = [...ROTATING_ENHANCERS];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            for (let i = 0; i < Math.min(2, shuffled.length); i++) {
                newEnhancers.push(shuffled[i]);
            }
            currentEnhancers = newEnhancers;
            
            // Applica i nuovi enhancer alla melodia corrente
            for (let enh of currentEnhancers) {
                currentMelody = applyLeadEnhancer(currentMelody, enh, enhancerContext);
            }
        }

        const currentScale = getStrictScale(progression[m % progression.length] || rootNote, isMinor);
        const isTransition = m === section.measures - 1;

        for (let i = 0; i < currentPattern.length; i++) {
            const s = currentPattern[i];
            
            if (isTransition && s > 13 && energy > 0.6) continue;

            const absoluteTime = measureStartTime + s * stepTime;
            const nextStep = currentPattern[i + 1] ?? 16;
            const duration = (nextStep - s) * stepTime;

            const noteIdxRaw = currentMelody[i % currentMelody.length];
            const noteIdx = ((noteIdxRaw % 7) + 7) % 7;
            const octave = (isChorus || isSolo) ? 5 : 4;
            const pitch = currentScale[noteIdx];
            
            if (!pitch) {
                console.warn(`🎹 pitch null per noteIdx=${noteIdx}`);
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
    
    console.log(`🎹 pianoLead: ${section.name} | pattern len=${currentPattern.length} | melody len=${currentMelody.length}`);
}