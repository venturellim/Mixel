// funkyLeadEngine.js — ver. 003 (con enhancer per solo e bridge)
import * as Tone from "https://esm.sh/tone";
import { funkyMelodicLibrary, funkyRhythmLibrary } from "./funkyMasks.js";
import { normalizeNote } from "./funkyInstruments.js";
import { applyLeadEnhancer, computeLeadVelocity } from "../../utils/leadEnhancers.js";

console.log("funkyLeadEngine.js ver. 003 loaded");

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
        if (style === "JazzFunk") return { name: "ACTIVE ⚡", data: funkyMelodicLibrary.active };
        if (brightness > 0.6) return { name: "EPIC 🏰", data: funkyMelodicLibrary.epic };
        return { name: "SOULFUL 💧", data: funkyMelodicLibrary.soulful };
    }
    if (energy > 0.6) return { name: "STACCATO 🎹", data: funkyMelodicLibrary.staccato };
    return { name: "ARPEGGIO 🎸", data: funkyMelodicLibrary.arpeggio };
}

// ============================================================
// ENHANCER SPECIFICI PER SOLO E BRIDGE
// ============================================================

function applySoloEnhancers(melody, pattern, style, energy, complexity) {
    let newMelody = [...melody];
    let newPattern = [...pattern];
    
    // 1. Allunga le note (più sustain)
    const enhancerContext = { energy, complexity, brightness: 0.7, texture: 0.6 };
    
    // 2. Aggiungi scale runs (virtuosismo)
    if (Math.random() < 0.6) {
        newMelody = applyLeadEnhancer(newMelody, "addScaleRunBetweenPeaks", enhancerContext);
        console.log("🎺 SOLO: aggiunte scale runs");
    }
    
    // 3. Aggiungi trilli (tipico del funky)
    if (Math.random() < 0.5 && style === "JazzFunk") {
        newMelody = applyLeadEnhancer(newMelody, "addTrills", enhancerContext);
        console.log("🎺 SOLO: aggiunti trilli");
    }
    
    // 4. Aggiungi ottave (più pieno)
    if (Math.random() < 0.4) {
        newMelody = applyLeadEnhancer(newMelody, "addOctaveDoubling", enhancerContext);
        console.log("🎺 SOLO: aggiunte ottave");
    }
    
    // 5. Raddoppia il pattern ritmico per più note
    if (energy > 0.6) {
        newPattern = [...pattern, ...pattern.map(s => s + 16)];
        console.log("🎺 SOLO: pattern raddoppiato");
    }
    
    // 6. Aggiungi echo per profondità
    if (style === "SoulFunk") {
        newMelody = applyLeadEnhancer(newMelody, "addEchoEffect", enhancerContext);
        console.log("🎺 SOLO: aggiunto echo");
    }
    
    // 7. Mirror inversion per contrasto
    if (complexity > 0.7) {
        newMelody = applyLeadEnhancer(newMelody, "addMirrorInversion", enhancerContext);
        console.log("🎺 SOLO: mirror inversion");
    }
    
    return { melody: newMelody, pattern: newPattern };
}

function applyBridgeEnhancers(melody, pattern, energy, texture) {
    let newMelody = [...melody];
    let newPattern = [...pattern];
    
    const enhancerContext = { energy, texture, brightness: 0.4, complexity: 0.5 };
    
    // 1. Bridge più atmosferico, meno note
    newPattern = newPattern.filter((_, i) => i % 2 === 0);
    
    // 2. Aggiungi chromatic passing per tensione
    if (Math.random() < 0.5) {
        newMelody = applyLeadEnhancer(newMelody, "enhanceChromaticPassing", enhancerContext);
        console.log("🎺 BRIDGE: chromatic passing");
    }
    
    // 3. Aggiungi slide per effetto "lamentoso"
    if (Math.random() < 0.4) {
        newMelody = applyLeadEnhancer(newMelody, "addSlideEffect", enhancerContext);
        console.log("🎺 BRIDGE: slide effect");
    }
    
    // 4. Aggiungi pause strategiche per respiro
    if (Math.random() < 0.4) {
        newPattern = applyLeadEnhancer(newPattern, "addStrategicPause", enhancerContext);
        console.log("🎺 BRIDGE: strategic pause");
    }
    
    return { melody: newMelody, pattern: newPattern };
}

// Assegna strumenti fiati in base allo stile
const brassInstruments = {
    SoulFunk: (instr) => instr.saxAlto,
    ClassicFunk: (instr) => instr.trumpet,
    JazzFunk: (instr) => instr.saxAlto,
    PartyFunk: (instr) => instr.trumpet
};

export function scheduleFunkyLead(section, progression, instruments, params, rand, measureDur, score) {
    const style = params?.style || "ClassicFunk";
    const getBrass = brassInstruments[style] || brassInstruments.ClassicFunk;
    const brassLead = getBrass(instruments);
    
    if (!brassLead) {
        console.warn("⚠️ Nessuno strumento fiati trovato per lo stile:", style);
        return;
    }

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo");
    const isBridge = name.includes("bridge");

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5, texture = 0.5 } = params?.imageParams || {};
    const enhancerContext = { energy, brightness, complexity, texture };

    const tonalCenter = params?.tonalCenter || "C4";
    const scaleType = params?.scaleType || "major";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMajor = scaleType.includes("major");

    let sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : (isSolo ? "solo" : "verse")));
    
    // Pattern ritmico base
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
    
    console.log(`🎺 ${section.name} | Stile: ${style} | Melodia: ${mood.name}`);

    // ============================================================
    // APPLICA ENHANCER PER SOLO E BRIDGE
    // ============================================================
    if (isSolo && !isBridge) {
        const enhanced = applySoloEnhancers(currentMelody, currentPattern, style, energy, complexity);
        currentMelody = enhanced.melody;
        currentPattern = enhanced.pattern;
        console.log(`🎸 SOLO ENHANCER applicati a ${section.name}`);
    }
    
    if (isBridge) {
        const enhanced = applyBridgeEnhancers(currentMelody, currentPattern, energy, texture);
        currentMelody = enhanced.melody;
        currentPattern = enhanced.pattern;
        console.log(`🌉 BRIDGE ENHANCER applicati a ${section.name}`);
    }
    
    // Enhancer standard per chorus
    if (!isIntro && isChorus && !isSolo) {
        if (Math.random() < 0.4) {
            currentMelody = applyLeadEnhancer(currentMelody, "enhanceMelodyMicroVariation", enhancerContext);
        }
        if (Math.random() < 0.3 && style === "JazzFunk") {
            currentMelody = applyLeadEnhancer(currentMelody, "addGhostAccent", enhancerContext);
        }
    }

    // Assicura che pattern e melodia abbiano la stessa lunghezza
    while (currentPattern.length < currentMelody.length) {
        currentPattern = [...currentPattern, ...currentPattern];
    }
    currentPattern = currentPattern.slice(0, currentMelody.length);
    
    console.log(`🎵 pattern: ${currentPattern.length} steps | melody: ${currentMelody.length} note`);

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + m * measureDur;
        const chordRoot = progression[m % progression.length] || rootNote;
        const currentScale = getStrictScale(chordRoot, isMajor);
        
        for (let i = 0; i < currentPattern.length; i++) {
            const s = currentPattern[i];
            if (s === undefined || s === null) continue;
            
            const absoluteTime = measureStartTime + s * stepTime;
            const nextStep = currentPattern[i + 1] ?? 16;
            const duration = (nextStep - s) * stepTime;
            
            const noteIdxRaw = currentMelody[i % currentMelody.length];
            const noteIdx = ((noteIdxRaw % 7) + 7) % 7;
            
            // Ottava: più alta per solo
            let octave = 4;
            if (isChorus) octave = 5;
            if (isSolo && !isBridge) octave = 5;
            if (isBridge) octave = 4;
            
            const pitch = currentScale[noteIdx];
            if (!pitch) continue;
            
            const rawNote = `${pitch}${octave}`;
            const instrumentType = (style === "SoulFunk" || style === "JazzFunk") ? "saxAlto" : "trumpet";
            const safeNote = normalizeNote(rawNote, instrumentType);
            
            // Velocity più alta per solo
            let velocity = computeLeadVelocity(noteIdx, duration, isSolo, isBridge);
            if (isSolo && !isBridge) velocity = Math.min(1, velocity * 1.2);
            
            Tone.Transport.schedule(time => {
                brassLead.triggerAttackRelease(safeNote, duration, time, velocity);
                if (score) score.addNote("Lead", safeNote, section.name);
            }, absoluteTime);
        }
    }
}