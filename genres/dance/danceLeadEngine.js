// danceLeadEngine.js — ver. 009 (stile-specific instruments)
import * as Tone from "https://esm.sh/tone";
import { danceMelodicLibrary, danceRhythmLibrary } from "./danceMasks.js";
import { applyLeadEnhancer, computeLeadVelocity, shapeBridgeSolo } from "../../utils/leadEnhancers.js";

console.log("danceLeadEngine.js ver. 009 loaded");

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

function getMelodyFamily(isPreChorus, isChorus, isSolo, style, energy, brightness, complexity) {
    // STILE-SPECIFIC melody families
    if (style === "Gigi") {
        if (isSolo) return { name: "EMOTIONAL 💧", data: danceMelodicLibrary.emotional };
        return { name: "ARPEGGIO 🎸", data: danceMelodicLibrary.arpeggio };
    }
    if (style === "Eiffel65") {
        if (isChorus) return { name: "STACCATO 🎹", data: danceMelodicLibrary.staccato };
        return { name: "ACTIVE ⚡", data: danceMelodicLibrary.active };
    }
    if (style === "GabryPonte") {
        return { name: "EPIC 🏰", data: danceMelodicLibrary.epic };
    }
    // Prezioso (default)
    if (isSolo) {
        if (complexity > 0.6 || energy > 0.7) return { name: "ACTIVE ⚡", data: danceMelodicLibrary.active };
        return { name: "STACCATO 🎹", data: danceMelodicLibrary.staccato };
    }
    if (isPreChorus) return { name: "PRE-CHORUS 📈", data: danceMelodicLibrary.prechorus };
    if (isChorus) {
        return brightness > 0.5
            ? { name: "EPIC 🏰", data: danceMelodicLibrary.epic }
            : { name: "EMOTIONAL 💧", data: danceMelodicLibrary.emotional };
    }
    return { name: "ARPEGGIO 🎸", data: danceMelodicLibrary.arpeggio };
}

// STILE-SPECIFIC LEAD INSTRUMENTS
const leadInstruments = {
    Gigi: (instr) => instr.piano,           // Gigi usa piano
    Prezioso: (instr) => instr.leadSaw,     // Prezioso usa leadSaw
    Eiffel65: (instr) => instr.leadSynthBrass1, // Eiffel65 synth robotico
    GabryPonte: (instr) => instr.leadSynthBrass2 // Gabry synth anthem
};

// STILE-SPECIFIC OCTAVE
const leadOctave = {
    Gigi: 4,           // piano range medio
    Prezioso: 4,       // saw range medio
    Eiffel65: 5,       // robotico acuto
    GabryPonte: 5      // anthem acuto
};

export function scheduleDanceLead(section, progression, instruments, params, rand, measureDur, score) {
    const style = params?.style || "Prezioso";
    
    // Scegli lead instrument in base allo stile
    const getInstrument = leadInstruments[style] || leadInstruments.Prezioso;
    const leadInstrument = getInstrument(instruments);
    const defaultOctave = leadOctave[style] || 4;
    
    if (!leadInstrument) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};
    const enhancerContext = { energy, brightness, complexity };

    const tonalCenter = params?.tonalCenter || "C4";
    const scaleType = params?.scaleType || "naturalMinor";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");

    let sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : (isSolo ? "solo" : "verse")));
    
    const getPattern = (type) => {
        const family = danceRhythmLibrary[type] || danceRhythmLibrary.verse;
        const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
        const index = Math.floor(Math.abs(dnaScore)) % family.length;
        return [...family[index]];
    };

    let currentPattern;
    let currentMelody;

    if (isSolo) {
        let pattern = getPattern("solo");
        pattern = applyLeadEnhancer(pattern, "enhanceRhythmPattern", enhancerContext);
        
        const soloFamily = getMelodyFamily(false, false, true, style, energy, brightness, complexity);
        const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
        let baseMelody = soloFamily.data[melodyIndex];
        
        // Enhancer specifici per stile
        if (style === "Eiffel65") {
            baseMelody = applyLeadEnhancer(baseMelody, "addOctaveDoubling", enhancerContext);
        }
        if (style === "GabryPonte") {
            baseMelody = applyLeadEnhancer(baseMelody, "addEchoEffect", enhancerContext);
        }
        
        currentMelody = baseMelody;
        currentPattern = pattern;
    } else {
        currentPattern = getPattern(sectionType);
        const mood = getMelodyFamily(isPreChorus, isChorus, false, style, energy, brightness, complexity);
        const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
        currentMelody = mood.data[melodyIndex];
        
        if (!isIntro && energy > 0.5) {
            currentMelody = applyLeadEnhancer(currentMelody, "enhanceMelodyMicroVariation", enhancerContext);
        }
    }

    console.log(`🎹 ${section.name} | Stile: ${style} | Pattern: ${currentPattern.length} note | Melody: ${currentMelody.length} note`);

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + m * measureDur;
        const currentScale = getStrictScale(progression[m % progression.length] || rootNote, isMinor);

        for (let i = 0; i < currentPattern.length; i++) {
            const s = currentPattern[i];
            if (s === undefined || s === null) continue;
            
            const absoluteTime = measureStartTime + s * stepTime;
            const nextStep = currentPattern[i + 1] ?? 16;
            const duration = (nextStep - s) * stepTime;
            
            const noteIdxRaw = currentMelody[i % currentMelody.length];
            const noteIdx = ((noteIdxRaw % 7) + 7) % 7;
            
            // Ottava in base allo stile e sezione
            let octave = defaultOctave;
            if (isChorus && style !== "Gigi") octave++;
            if (isSolo && style === "GabryPonte") octave++;
            
            const pitch = currentScale[noteIdx];
            if (!pitch) continue;
            
            const noteName = `${pitch}${octave}`;
            const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));

            Tone.Transport.schedule(time => {
                leadInstrument.triggerAttackRelease(noteName, duration, time, velocity);
                if (score) score.addNote("Lead", noteName, section.name);
            }, absoluteTime);
        }
    }
}