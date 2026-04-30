// pianoLeadEngine.js — ver. 011 (Fix verse: espansione pattern)

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

console.log("pianoLeadEngine.js ver. 011 loaded");

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
// FUNZIONE PER ESPANDERE IL PATTERN ALLA LUNGHEZZA DELLA MELODIA
// ============================================================
function expandPatternToMatchMelody(pattern, melodyLength) {
    if (!pattern || pattern.length === 0) return [0, 4, 8, 12];
    if (pattern.length >= melodyLength) return pattern;
    
    const originalPattern = [...pattern];
    const expanded = [...originalPattern];
    
    while (expanded.length < melodyLength) {
        for (let step of originalPattern) {
            expanded.push(step);
            if (expanded.length >= melodyLength) break;
        }
    }
    
    // Ordina e rimuovi duplicati consecutivi
    expanded.sort((a, b) => a - b);
    return expanded.filter((step, idx, arr) => idx === 0 || step !== arr[idx - 1]);
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
// ENHANCER PER PIANO
// ============================================================

const LIGHT_ENHANCERS = [
    "enhanceMelodyMicroVariation",
    "enhanceMelodyLine"
];

const MEDIUM_ENHANCERS = [
    "enhanceChromaticPassing",
    "addEchoEffect"
];

const HEAVY_ENHANCERS = [
    "addOctaveDoubling",
    "addScaleRunBetweenPeaks"
];

function getEnhancersForEnergy(energy) {
    const enhancers = [];
    
    if (energy < 0.3) {
        return enhancers;
    } else if (energy < 0.5) {
        enhancers.push(LIGHT_ENHANCERS[0]);
    } else if (energy < 0.7) {
        enhancers.push(...LIGHT_ENHANCERS);
    } else if (energy < 0.9) {
        enhancers.push(...LIGHT_ENHANCERS);
        enhancers.push(MEDIUM_ENHANCERS[Math.floor(Math.random() * MEDIUM_ENHANCERS.length)]);
    } else {
        enhancers.push(...LIGHT_ENHANCERS);
        enhancers.push(MEDIUM_ENHANCERS[Math.floor(Math.random() * MEDIUM_ENHANCERS.length)]);
        enhancers.push(HEAVY_ENHANCERS[Math.floor(Math.random() * HEAVY_ENHANCERS.length)]);
    }
    
    return enhancers;
}

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
        return [...family[index]];
    };

    // ============================================================
    // PATTERN & MELODIA DI BASE
    // ============================================================
    let currentPattern;
    let currentMelody;

    if (isSolo) {
        // ASSOLO: pattern potenziato
        let pattern = getPattern("chorus");
        pattern = applyLeadEnhancer(pattern, "enhanceRhythmPattern", enhancerContext);
        pattern = applyLeadEnhancer(pattern, "addAnticipation", enhancerContext);
        
        const soloFamily = getSoloMelodyFamily(isSoloPt2, energy, brightness, complexity, texture);
        const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
        let baseMelody = soloFamily.data[melodyIndex];

        const soloEnhancers = [...LIGHT_ENHANCERS, ...MEDIUM_ENHANCERS, ...HEAVY_ENHANCERS];
        for (let enh of soloEnhancers) {
            if (Math.random() < 0.5) {
                baseMelody = applyLeadEnhancer(baseMelody, enh, enhancerContext);
            }
        }
        
        currentMelody = baseMelody;
        currentPattern = expandPatternToMatchMelody(pattern, currentMelody.length);

    } else {
        // SEZIONI NORMALI
        currentPattern = getPattern(sectionType);
        const mood = getMelodyFamily(isPreChorus, isChorus, energy, brightness, complexity, texture);
        const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
        let baseMelody = mood.data[melodyIndex];

        // Applica enhancer in base all'energia
        const enhancersToApply = getEnhancersForEnergy(energy);
        for (let enh of enhancersToApply) {
            baseMelody = applyLeadEnhancer(baseMelody, enh, enhancerContext);
        }
        
        currentMelody = baseMelody;
        
        // **FIX CRITICO**: espandi il pattern alla lunghezza della melodia
        currentPattern = expandPatternToMatchMelody(currentPattern, currentMelody.length);
    }

    // ============================================================
    // LOOP MISURE
    // ============================================================
    for (let m = 0; m < section.measures; m++) {

        const measureStartTime = section.startTime + m * measureDur;

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
    
    const enhancerCount = isSolo ? "solo" : getEnhancersForEnergy(energy).length;
    console.log(`🎹 pianoLead: ${section.name} | energy=${energy.toFixed(2)} | enhancers=${enhancerCount} | pattern=${currentPattern.length} | melody=${currentMelody.length}`);
}