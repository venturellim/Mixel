// danceLeadEngine.js — ver. 011 (COMPLETO con enhancer)
import * as Tone from "https://esm.sh/tone";
import { danceMelodicLibrary, danceRhythmLibrary } from "./danceMasks.js";
import { applyLeadEnhancer, computeLeadVelocity, shapeBridgeSolo } from "../../utils/leadEnhancers.js";

console.log("danceLeadEngine.js ver. 011 loaded");

// ============================================================
// UTILITY FUNCTIONS
// ============================================================

function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

function getRootPitch(root) {
    if (!root || typeof root !== "string") return "C";
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    return match ? match[1] : "C";
}

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
// SELEZIONE FAMIGLIA MELODICA
// ============================================================

function getMelodyFamily(isPreChorus, isChorus, isSolo, style, energy, brightness, complexity) {
    if (isSolo) {
        if (style === "Gigi") return { name: "EMOTIONAL 💧", data: danceMelodicLibrary.emotional };
        if (style === "Eiffel65") return { name: "ACTIVE ⚡", data: danceMelodicLibrary.active };
        if (style === "GabryPonte") return { name: "EPIC 🏰", data: danceMelodicLibrary.epic };
        return { name: "STACCATO 🎹", data: danceMelodicLibrary.staccato };
    }
    if (isPreChorus) return { name: "PRE-CHORUS 📈", data: danceMelodicLibrary.prechorus };
    if (isChorus) {
        if (style === "Gigi") return { name: "ARPEGGIO 🎸", data: danceMelodicLibrary.arpeggio };
        if (style === "Eiffel65") return { name: "STACCATO 🎹", data: danceMelodicLibrary.staccato };
        if (style === "GabryPonte") return { name: "EPIC 🏰", data: danceMelodicLibrary.epic };
        return brightness > 0.5 
            ? { name: "EPIC 🏰", data: danceMelodicLibrary.epic }
            : { name: "EMOTIONAL 💧", data: danceMelodicLibrary.emotional };
    }
    if (energy > 0.7) return { name: "ACTIVE ⚡", data: danceMelodicLibrary.active };
    if (complexity > 0.6) return { name: "ARPEGGIO 🎸", data: danceMelodicLibrary.arpeggio };
    return { name: "STACCATO 🎹", data: danceMelodicLibrary.staccato };
}

// ============================================================
// SELEZIONE ENHANCER PER STILE
// ============================================================

function getEnhancersForStyle(style, energy, complexity, isSolo, isChorus, isDrop) {
    const enhancers = [];
    
    switch(style) {
        case "Gigi":
            // Gigi: variazioni morbide, arpeggi, echo
            enhancers.push("enhanceMelodyMicroVariation");
            if (isSolo) enhancers.push("addEchoEffect");
            if (energy > 0.4) enhancers.push("enhanceMelodyLine");
            if (isChorus) enhancers.push("addOctaveDoubling");
            break;
            
        case "Prezioso":
            // Prezioso: ritmiche syncopate, ghost steps
            enhancers.push("enhanceRhythmGhostSteps");
            enhancers.push("addGhostAccent");
            if (isChorus) enhancers.push("enhanceMelodyMicroVariation");
            if (complexity > 0.5) enhancers.push("addAnticipation");
            if (isDrop) enhancers.push("addPolyrhythmHint");
            break;
            
        case "Eiffel65":
            // Eiffel65: robotico, ottave, trills
            enhancers.push("addOctaveDoubling");
            enhancers.push("addTrills");
            if (complexity > 0.6) enhancers.push("addMirrorInversion");
            if (isSolo) enhancers.push("addScaleRunBetweenPeaks");
            if (energy > 0.7) enhancers.push("addGhostAccent");
            break;
            
        case "GabryPonte":
            // Gabry Ponte: anthem, slide, chromatic
            enhancers.push("addSlideEffect");
            enhancers.push("enhanceChromaticPassing");
            if (isChorus) enhancers.push("addEchoEffect");
            if (energy > 0.7) enhancers.push("addBendEffect");
            if (isDrop) enhancers.push("addOctaveDoubling");
            break;
            
        default:
            enhancers.push("enhanceMelodyMicroVariation");
            if (energy > 0.6) enhancers.push("addGhostAccent");
    }
    
    return enhancers;
}

// ============================================================
// SELEZIONE STRUMENTO LEAD
// ============================================================

const leadInstruments = {
    Gigi:       (instr) => instr.piano,
    Prezioso:   (instr) => instr.leadSaw,
    Eiffel65:   (instr) => instr.leadSynthBrass1,
    GabryPonte: (instr) => instr.leadSynthBrass2,
    Molella:    (instr) => instr.leadSaw // saw morbido, trancey
};


const leadOctave = {
    Gigi: 4,
    Prezioso: 4,
    Eiffel65: 5,
    GabryPonte: 5,
    Molella: 4
};


// ============================================================
// PATTERN RITMICO
// ============================================================

function getPattern(sectionType, energy, brightness, complexity) {
    const family = danceRhythmLibrary[sectionType] || danceRhythmLibrary.verse;
    const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
    const index = Math.floor(Math.abs(dnaScore)) % family.length;
    return [...family[index]];
}

function generateEiffelArpeggio(root, third, fifth, octave) {
    return [
        `${root}${octave+1}`,
        `${third}${octave}`,
        `${fifth}${octave+1}`,
        `${third}${octave}`
    ];
}

// ============================================================
// MAIN SCHEDULE FUNCTION
// ============================================================

export function scheduleDanceLead(section, progression, instruments, params, rand, measureDur, score) {
    const style = params?.style || "Prezioso";
    const getInstrument = leadInstruments[style] || leadInstruments.Prezioso;
    const leadInstrument = getInstrument(instruments);
    const defaultOctave = leadOctave[style] || 4;
    
    if (!leadInstrument) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const isDrop = isChorus || isSolo;

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};
    const texture = params?.imageParams?.texture || 0.5;
    const enhancerContext = { energy, brightness, complexity, texture };

    const tonalCenter = params?.tonalCenter || "C4";
    const scaleType = params?.scaleType || "naturalMinor";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");

    let sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : (isSolo ? "solo" : "verse")));
    
    // ============================================================
    // PATTERN E MELODIA BASE
    // ============================================================
    let currentPattern = getPattern(sectionType, energy, brightness, complexity);
    let currentMelody;
    
    if (isSolo) {
        const soloFamily = getMelodyFamily(false, false, true, style, energy, brightness, complexity);
        const melodyIndex = Math.floor(energy * soloFamily.data.length) % soloFamily.data.length;
        currentMelody = soloFamily.data[melodyIndex];
        
        // Enhancer per solo
        const soloEnhancers = getEnhancersForStyle(style, energy, complexity, true, isChorus, isDrop);
        for (let enh of soloEnhancers) {
            if (Math.random() < 0.6) {
                currentPattern = applyLeadEnhancer(currentPattern, enh, enhancerContext);
                currentMelody = applyLeadEnhancer(currentMelody, enh, enhancerContext);
            }
        }
    } else {
        const mood = getMelodyFamily(isPreChorus, isChorus, false, style, energy, brightness, complexity);
        const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
        currentMelody = mood.data[melodyIndex];
        
        // Enhancer per sezioni normali
        if (!isIntro) {
            const enhancers = getEnhancersForStyle(style, energy, complexity, false, isChorus, isDrop);
            for (let enh of enhancers) {
                if (Math.random() < 0.4) {
                    currentPattern = applyLeadEnhancer(currentPattern, enh, enhancerContext);
                    currentMelody = applyLeadEnhancer(currentMelody, enh, enhancerContext);
                }
            }
        }
    }
    // ============================================================
// ARPEGGIATORE EIFFEL65 (solo in chorus/solo)
// ============================================================
if (style === "Eiffel65" && (isChorus || isSolo)) {

    const root = getRootPitch(progression[0]);
    const third = getRootPitch(progression[0]) + "#";   // semplice terza maggiore
    const fifth = getRootPitch(progression[0]) + "5";   // quinta

    currentMelody = generateEiffelArpeggio(root, third, fifth, defaultOctave);

    // pattern 16-step robotico
    currentPattern = [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15];

    console.log("🤖 ARP EIFFEL65 ATTIVO →", currentMelody);
}

    // Assicura che pattern e melodia abbiano la stessa lunghezza approssimativa
    while (currentPattern.length < currentMelody.length) {
        currentPattern = [...currentPattern, ...currentPattern];
    }
    currentPattern = currentPattern.slice(0, currentMelody.length);
    
    console.log(`🎹 ${section.name} | Stile: ${style} | Enhancers: ${getEnhancersForStyle(style, energy, complexity, isSolo, isChorus, isDrop).join(", ")}`);
    
    // ============================================================
    // SCHEDULAZIONE LOOP
    // ============================================================
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