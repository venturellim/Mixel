// funkyLeadEngine.js — ver. 001
import * as Tone from "https://esm.sh/tone";
import { funkyMelodicLibrary, funkyRhythmLibrary } from "./funkyMasks.js";
import { normalizeNote } from "./funkyInstruments.js";
import { applyLeadEnhancer, computeLeadVelocity } from "../../utils/leadEnhancers.js";

console.log("funkyLeadEngine.js ver. 001 loaded");

function getStrictScale(root, isMajor) {
    const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
    let cleanRoot = root.replace(/[0-9]/g, "").toUpperCase();
    const alt = { DB: "C#", EB: "D#", GB: "F#", AB: "G#", BB: "A#" };
    cleanRoot = alt[cleanRoot] || cleanRoot;
    let idx = allNotes.indexOf(cleanRoot);
    if (idx === -1) idx = 9;
    const intervals = isMajor ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
    return intervals.map(i => allNotes[(idx + i) % 12]);
}

function getMelodyFamily(isChorus, isSolo, style, energy, brightness) {
    if (isSolo) {
        if (style === "JazzFunk") return { name: "ACTIVE ⚡", data: funkyMelodicLibrary.active };
        if (style === "SoulFunk") return { name: "SOULFUL 💧", data: funkyMelodicLibrary.soulful };
        return { name: "EPIC 🏰", data: funkyMelodicLibrary.epic };
    }
    if (isChorus) {
        if (brightness > 0.6) return { name: "EPIC 🏰", data: funkyMelodicLibrary.epic };
        return { name: "SOULFUL 💧", data: funkyMelodicLibrary.soulful };
    }
    if (energy > 0.6) return { name: "STACCATO 🎹", data: funkyMelodicLibrary.staccato };
    return { name: "ARPEGGIO 🎸", data: funkyMelodicLibrary.arpeggio };
}

// Assegna strumenti fiati in base allo stile
const brassInstruments = {
    SoulFunk: (instr) => instr.saxAlto,     // sax più espressivo
    ClassicFunk: (instr) => instr.trumpet,   // tromba classica
    JazzFunk: (instr) => instr.saxAlto,      // sax per jazz
    PartyFunk: (instr) => instr.trumpet      // tromba brillante
};

export function scheduleFunkyLead(section, progression, instruments, params, rand, measureDur, score) {
    const style = params?.style || "ClassicFunk";
    const getBrass = brassInstruments[style] || brassInstruments.ClassicFunk;
    const brassLead = getBrass(instruments);
    
    if (!brassLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};
    const enhancerContext = { energy, brightness, complexity, texture: 0.5 };

    const tonalCenter = params?.tonalCenter || "C4";
    const scaleType = params?.scaleType || "major";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMajor = scaleType.includes("major");

    let sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : (isSolo ? "solo" : "verse")));
    
    // Pattern ritmico
    const getPattern = (type) => {
        const family = funkyRhythmLibrary[type] || funkyRhythmLibrary.verse;
        const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
        const index = Math.floor(Math.abs(dnaScore)) % family.length;
        return [...family[index]];
    };

    let currentPattern = getPattern(sectionType);
    let currentMelody;

    // Melodia base
    const mood = getMelodyFamily(isChorus, isSolo, style, energy, brightness);
    const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
    currentMelody = mood.data[melodyIndex];

    // Applica enhancer in chorus/solo
    if (!isIntro && (isChorus || isSolo)) {
        if (Math.random() < 0.4) {
            currentMelody = applyLeadEnhancer(currentMelody, "enhanceMelodyMicroVariation", enhancerContext);
        }
        if (Math.random() < 0.3 && style === "JazzFunk") {
            currentMelody = applyLeadEnhancer(currentMelody, "addTrills", enhancerContext);
        }
        if (Math.random() < 0.3 && style === "SoulFunk") {
            currentMelody = applyLeadEnhancer(currentMelody, "addEchoEffect", enhancerContext);
        }
    }

    // Assicura che pattern e melodia abbiano la stessa lunghezza
    while (currentPattern.length < currentMelody.length) {
        currentPattern = [...currentPattern, ...currentPattern];
    }
    currentPattern = currentPattern.slice(0, currentMelody.length);

    console.log(`🎺 ${section.name} | Stile: ${style} | Melodia: ${mood.name}`);

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + m * measureDur;
        const currentScale = getStrictScale(progression[m % progression.length] || rootNote, isMajor);
        
        for (let i = 0; i < currentPattern.length; i++) {
            const s = currentPattern[i];
            if (s === undefined || s === null) continue;
            
            const absoluteTime = measureStartTime + s * stepTime;
            const nextStep = currentPattern[i + 1] ?? 16;
            const duration = (nextStep - s) * stepTime;
            
            const noteIdxRaw = currentMelody[i % currentMelody.length];
            const noteIdx = ((noteIdxRaw % 7) + 7) % 7;
            
            // Ottava: sax/trumpet range
            let octave = 4;
            if (isChorus) octave = 5;
            if (isSolo && style === "JazzFunk") octave = 5;
            
            const pitch = currentScale[noteIdx];
            if (!pitch) continue;
            
            const rawNote = `${pitch}${octave}`;
            const instrumentType = style === "SoulFunk" ? "saxAlto" : "trumpet";
            const safeNote = normalizeNote(rawNote, instrumentType);
            
            const velocity = computeLeadVelocity(noteIdx, duration, isSolo, name.includes("bridge"));

            Tone.Transport.schedule(time => {
                brassLead.triggerAttackRelease(safeNote, duration, time, velocity);
                if (score) score.addNote("Lead", safeNote, section.name);
            }, absoluteTime);
        }
    }
}