// funkyLeadEngine.js — ver. 004 (con soloPt1 e soloPt2)
import * as Tone from "https://esm.sh/tone";
import { funkyMelodicLibrary, funkyRhythmLibrary } from "./funkyMasks.js";
import { normalizeNote } from "./funkyInstruments.js";
import { applyLeadEnhancer, computeLeadVelocity } from "../../utils/leadEnhancers.js";

console.log("funkyLeadEngine.js ver. 004 loaded");

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

function getMelodyFamily(isChorus, isSolo, style, energy, brightness, isSoloPt2) {
    if (isSolo) {
        if (isSoloPt2) {
            // Seconda parte dell'assolo: più intensa e complessa
            if (style === "JazzFunk") return { name: "SOLO ACTIVE ⚡⚡", data: funkyMelodicLibrary.active };
            if (style === "SoulFunk") return { name: "SOLO EPIC 🏰", data: funkyMelodicLibrary.epic };
            return { name: "SOLO ACTIVE ⚡⚡", data: funkyMelodicLibrary.active };
        } else {
            // Prima parte dell'assolo
            if (style === "JazzFunk") return { name: "SOLO JAZZ 🎺", data: funkyMelodicLibrary.active };
            if (style === "SoulFunk") return { name: "SOLO SOUL 💧", data: funkyMelodicLibrary.soulful };
            return { name: "SOLO EPIC 🏰", data: funkyMelodicLibrary.epic };
        }
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
// ENHANCER PER SOLO PT1 (introduzione assolo)
// ============================================================
function applySoloPt1Enhancers(melody, pattern, style, energy, complexity) {
    let newMelody = [...melody];
    let newPattern = [...pattern];
    
    const enhancerContext = { energy, complexity, brightness: 0.6, texture: 0.5 };
    
    console.log("🎺 SOLO PT1: enhancer introduttivi");
    
    // 1. Micro variazioni per interesse
    if (Math.random() < 0.6) {
        newMelody = applyLeadEnhancer(newMelody, "enhanceMelodyMicroVariation", enhancerContext);
    }
    
    // 2. Aggiungi anticipazioni
    if (Math.random() < 0.5) {
        newPattern = applyLeadEnhancer(newPattern, "addAnticipation", enhancerContext);
    }
    
    // 3. Slide effect per carattere funky
    if (Math.random() < 0.4 && style !== "JazzFunk") {
        newMelody = applyLeadEnhancer(newMelody, "addSlideEffect", enhancerContext);
    }
    
    // 4. Ottave occasionali
    if (Math.random() < 0.3) {
        newMelody = applyLeadEnhancer(newMelody, "addOctaveDoubling", enhancerContext);
    }
    
    return { melody: newMelody, pattern: newPattern };
}

// ============================================================
// ENHANCER PER SOLO PT2 (virtuosismo, picco dell'assolo)
// ============================================================
function applySoloPt2Enhancers(melody, pattern, style, energy, complexity) {
    let newMelody = [...melody];
    let newPattern = [...pattern];
    
    const enhancerContext = { energy, complexity, brightness: 0.8, texture: 0.7 };
    
    console.log("🎺 SOLO PT2: enhancer virtuosistici!");
    
    // 1. Scale runs (virtuosismo)
    if (Math.random() < 0.7) {
        newMelody = applyLeadEnhancer(newMelody, "addScaleRunBetweenPeaks", enhancerContext);
    }
    
    // 2. Trilli intensi
    if (Math.random() < 0.6) {
        newMelody = applyLeadEnhancer(newMelody, "addTrills", enhancerContext);
    }
    
    // 3. Raddoppio ottave
    if (Math.random() < 0.5) {
        newMelody = applyLeadEnhancer(newMelody, "addOctaveDoubling", enhancerContext);
    }
    
    // 4. Mirror inversion per contrasto
    if (Math.random() < 0.4 && complexity > 0.6) {
        newMelody = applyLeadEnhancer(newMelody, "addMirrorInversion", enhancerContext);
    }
    
    // 5. Echo per profondità
    if (Math.random() < 0.4) {
        newMelody = applyLeadEnhancer(newMelody, "addEchoEffect", enhancerContext);
    }
    
    // 6. Pattern più denso
    if (energy > 0.6) {
        newPattern = [...pattern, ...pattern.map(s => s + 16)];
    }
    
    // 7. Ghost accents per groove
    if (Math.random() < 0.5) {
        newPattern = applyLeadEnhancer(newPattern, "addGhostAccent", enhancerContext);
    }
    
    return { melody: newMelody, pattern: newPattern };
}

// ============================================================
// ENHANCER PER BRIDGE
// ============================================================
function applyBridgeEnhancers(melody, pattern, energy, texture) {
    let newMelody = [...melody];
    let newPattern = [...pattern];
    
    const enhancerContext = { energy, texture, brightness: 0.4, complexity: 0.5 };
    
    console.log("🌉 BRIDGE: enhancer atmosferici");
    
    // 1. Bridge più atmosferico, meno note
    newPattern = newPattern.filter((_, i) => i % 2 === 0);
    
    // 2. Aggiungi chromatic passing per tensione
    if (Math.random() < 0.5) {
        newMelody = applyLeadEnhancer(newMelody, "enhanceChromaticPassing", enhancerContext);
    }
    
    // 3. Aggiungi slide per effetto "lamentoso"
    if (Math.random() < 0.4) {
        newMelody = applyLeadEnhancer(newMelody, "addSlideEffect", enhancerContext);
    }
    
    // 4. Aggiungi pause strategiche per respiro
    if (Math.random() < 0.4) {
        newPattern = applyLeadEnhancer(newPattern, "addStrategicPause", enhancerContext);
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
    const isSoloPt1 = name.includes("solopt1");
    const isSoloPt2 = name.includes("solopt2");
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

    // Melodia base in base alla sezione
    const mood = getMelodyFamily(isChorus, isSolo, style, energy, brightness, isSoloPt2);
    const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
    currentMelody = mood.data[melodyIndex];
    
    console.log(`🎺 ${section.name} | Stile: ${style} | Melodia: ${mood.name}`);

    // ============================================================
    // APPLICA ENHANCER IN BASE ALLA SEZIONE
    // ============================================================
    if (isSoloPt1) {
        const enhanced = applySoloPt1Enhancers(currentMelody, currentPattern, style, energy, complexity);
        currentMelody = enhanced.melody;
        currentPattern = enhanced.pattern;
        console.log(`🎸 SOLO PT1 - introduzione`);
    }
    
    if (isSoloPt2) {
        const enhanced = applySoloPt2Enhancers(currentMelody, currentPattern, style, energy, complexity);
        currentMelody = enhanced.melody;
        currentPattern = enhanced.pattern;
        console.log(`🎸 SOLO PT2 - climax!`);
    }
    
    if (isBridge) {
        const enhanced = applyBridgeEnhancers(currentMelody, currentPattern, energy, texture);
        currentMelody = enhanced.melody;
        currentPattern = enhanced.pattern;
        console.log(`🌉 BRIDGE - tensione`);
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
            
            // Ottava in base alla sezione
            let octave = 4;
            if (isChorus) octave = 5;
            if (isSoloPt2) octave = 5;      // Pt2 più acuta
            if (isSoloPt1) octave = 4;      // Pt1 media
            if (isBridge) octave = 4;
            
            const pitch = currentScale[noteIdx];
            if (!pitch) continue;
            
            const rawNote = `${pitch}${octave}`;
            const instrumentType = (style === "SoulFunk" || style === "JazzFunk") ? "saxAlto" : "trumpet";
            const safeNote = normalizeNote(rawNote, instrumentType);
            
            // Velocity in base alla sezione
            let velocity = computeLeadVelocity(noteIdx, duration, isSolo, isBridge);
            if (isSoloPt2) velocity = Math.min(1, velocity * 1.3);  // Pt2 più forte
            if (isSoloPt1) velocity = Math.min(1, velocity * 1.1);  // Pt1 leggermente più forte
            
            Tone.Transport.schedule(time => {
                brassLead.triggerAttackRelease(safeNote, duration, time, velocity);
                if (score) score.addNote("Lead", safeNote, section.name);
            }, absoluteTime);
        }
    }
}