// danceLeadEngine.js — Lead ritmici/melodici per Dance Engine
import * as Tone from "https://esm.sh/tone";

import { normalizeNote } from "./danceInstruments.js";

console.log("danceLeadEngine.js ver. 002 loaded");

// Mappa strumento → tipo per normalizeNote
function getInstrumentType(instrument, style) {
    if (instrument === piano) return "piano";
    
    // Mappa per stile (opzionale, ma utile)
    const styleToType = {
        Gigi: "piano",      // Gigi usa piano
        Prezioso: "lead",   // Prezioso usa leadSaw
        Eiffel65: "lead",   // Eiffel65 usa leadSynthBrass1
        GabryPonte: "lead"  // GabryPonte usa leadSynthBrass2
    };
    
    return styleToType[style] || "lead";
}

// Ottave sicure per ogni tipo di strumento
const SAFE_OCTAVES = {
    lead: [3, 4],      // lead ha solo C3, C4, E3, E4
    piano: [3, 4, 5],  // piano ha molte ottave
    pad: [2, 3, 4],    // pad hanno C2-C5
    bass: [2, 3],      // bass ha C2, C3, E2, F#3
    fx: [4]            // fx hanno principalmente C4
};

// Trova l'ottava più vicina a quella desiderata, compatibile con lo strumento
function findSafeOctave(desiredOctave, instrumentType) {
    const safeOctaves = SAFE_OCTAVES[instrumentType] || SAFE_OCTAVES.lead;
    
    let closest = safeOctaves[0];
    let minDist = Math.abs(desiredOctave - safeOctaves[0]);
    
    for (const oct of safeOctaves) {
        const dist = Math.abs(desiredOctave - oct);
        if (dist < minDist) {
            minDist = dist;
            closest = oct;
        }
    }
    
    return closest;
}

export function scheduleDanceLead(
    section,
    instruments,
    params,
    style,
    score,
    rand
) {
    const name = section.name.toLowerCase();
    const isIntro = name.includes("intro");
    const isBuild = name.includes("build");
    const isDrop  = name.includes("drop");
    const isBreak = name.includes("break");
    const isChorus = name.includes("chorus");

    // Lead disponibili
    const {
        leadSaw,
        leadSynthBrass1,
        leadSynthBrass2,
        piano
    } = instruments;

    // Sezione senza lead
    if (isIntro || isBreak) return;

    // BPM e timing
    const bpm = params.bpm;
    const measureDur = (60 / bpm) * 4;
    const eighth = measureDur / 8;

    // ------------------------------------------------------------
    // TONAL CENTER FIX (robusto e coerente)
    // ------------------------------------------------------------
    let tonal = params?.tonalCenter ?? params?.imageParams?.tonalCenter ?? "C4";

    if (typeof tonal !== "string" || tonal.length < 2) {
        tonal = "C4";
    }

    const match = tonal.match(/^([A-G][#b]?)(\d)$/);
    let rootNote = match ? match[1] : "C";
    let rootOct = match ? parseInt(match[2]) : 4;

    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";

    // Scala (semplice)
    const scales = {
        naturalMinor:  [0, 2, 3, 5, 7, 8, 10],
        harmonicMinor: [0, 2, 3, 5, 7, 8, 11]
    };
    const intervals = scales[scaleType] || scales.naturalMinor;

    // ------------------------------------------------------------
    // 1. PATTERN LEAD PER STILE
    // ------------------------------------------------------------
    const leadPatterns = {
        Gigi:      [0, 2, 4, 5, 4, 2, 0, null], // dream/piano
        Prezioso:  [0, null, 2, null, 4, null, 2, null], // sincopato
        Eiffel65:  [0, 0, 4, 4, 0, 0, 4, 4], // robotico ottave
        GabryPonte:[0, 3, 4, 2, 0, 5, 4, 3] // anthem
    };

    const pattern = leadPatterns[style] || leadPatterns.Prezioso;

    // ------------------------------------------------------------
    // 2. SCELTA STRUMENTO LEAD PER STILE
    // ------------------------------------------------------------
    const leadInstrument = {
        Gigi: piano,
        Prezioso: leadSaw,
        Eiffel65: leadSynthBrass1,
        GabryPonte: leadSynthBrass2
    }[style] || leadSaw;

    const instrumentType = getInstrumentType(leadInstrument, style);

    // ------------------------------------------------------------
    // 3. VOLUME LEAD PER SEZIONE
    // ------------------------------------------------------------
    let leadGain = 0.5;
    if (isBuild) leadGain = 0.3;
    if (isDrop)  leadGain = 0.9;
    if (isChorus) leadGain = 0.8;

    // ------------------------------------------------------------
    // 4. FUNZIONE PER GENERARE NOTE SICURE
    // ------------------------------------------------------------
    function getSafeNote(degree, desiredOctave) {
        // Calcola la nota grezza
        const baseMidi = Tone.Frequency(rootNote + desiredOctave).toMidi();
        const semi = intervals[degree % intervals.length];
        const rawMidi = baseMidi + semi;
        const rawNote = Tone.Frequency(rawMidi, "midi").toNote();
        
        // Estrai radice e ottava dalla nota grezza
        const noteMatch = rawNote.match(/^([A-G][#b]?)(\d+)$/);
        if (!noteMatch) return "C4";
        
        const noteRoot = noteMatch[1];
        const noteOctave = parseInt(noteMatch[2]);
        
        // Normalizza la radice per lo strumento
        const safeRoot = normalizeNote(noteRoot, instrumentType);
        
        // Trova l'ottava sicura più vicina
        const safeOctave = findSafeOctave(noteOctave, instrumentType);
        
        return safeRoot + safeOctave;
    }

    // ------------------------------------------------------------
    // 5. SCHEDULAZIONE LEAD
    // ------------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {
        const t0 = section.startTime + m * measureDur;

        pattern.forEach((degree, i) => {
            if (degree === null) return;

            const t = t0 + i * eighth;
            
            // Determina l'ottava desiderata (4 normale, 5 per drop)
            const desiredOctave = (isDrop && instrumentType !== "piano") ? 4 : 4;
            // Nota: i lead synth non hanno ottava 5, quindi forziamo a 4
            
            const safeNote = getSafeNote(degree, desiredOctave);

            Tone.Transport.schedule(time => {
                // Verifica che lo strumento sia pronto
                if (leadInstrument && typeof leadInstrument.triggerAttackRelease === 'function') {
                    leadInstrument.triggerAttackRelease(safeNote, "8n", time, leadGain);
                    if (score) score.addNote("Lead", safeNote, section.name);
                } else {
                    console.warn("⚠️ Lead instrument not ready for note:", safeNote);
                }
            }, t);
        });
    }
}