// danceLeadEngine.js — Lead ritmici/melodici per Dance Engine (COMPLETA)
import * as Tone from "https://esm.sh/tone";

import { normalizeNote } from "./danceInstruments.js";

console.log("danceLeadEngine.js ver. 004 COMPLETA loaded");

// ------------------------------------------------------------
// FUNZIONI DI SICUREZZA
// ------------------------------------------------------------

function safeTrigger(instrument, note, duration, time, velocity = 0.5, name = "Lead") {
    if (!instrument) {
        return false;
    }
    
    if (typeof instrument.triggerAttackRelease !== 'function') {
        return false;
    }
    
    if (!note || typeof note !== 'string') {
        return false;
    }
    
    if (time === undefined || time === null || isNaN(time)) {
        return false;
    }
    
    try {
        instrument.triggerAttackRelease(note, duration, time, velocity);
        return true;
    } catch (e) {
        console.warn(`⚠️ ${name} failed for note ${note}:`, e.message);
        return false;
    }
}

// Mappa strumento → tipo per normalizeNote
function getInstrumentType(instrument, style) {
    if (instrument === piano) return "piano";
    
    const styleToType = {
        Gigi: "piano",
        Prezioso: "lead",
        Eiffel65: "lead",
        GabryPonte: "lead"
    };
    
    return styleToType[style] || "lead";
}

// Ottave sicure per ogni tipo di strumento
const SAFE_OCTAVES = {
    lead: [3, 4],
    piano: [3, 4, 5],
    pad: [2, 3, 4],
    bass: [2, 3],
    fx: [4]
};

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

// ------------------------------------------------------------
// FUNZIONE PRINCIPALE
// ------------------------------------------------------------

export function scheduleDanceLead(
    section,
    instruments,
    params,
    style,
    score,
    rand
) {
    try {
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
        if (!bpm || isNaN(bpm)) {
            console.warn("⚠️ Invalid BPM in danceLeadEngine");
            return;
        }
        
        const measureDur = (60 / bpm) * 4;
        const eighth = measureDur / 8;
        const sixteenth = measureDur / 16;
        const quarterNote = measureDur / 4;

        // ------------------------------------------------------------
        // TONAL CENTER
        // ------------------------------------------------------------
        let tonal = params?.tonalCenter ?? params?.imageParams?.tonalCenter ?? "C4";

        if (typeof tonal !== "string" || tonal.length < 2) {
            tonal = "C4";
        }

        const match = tonal.match(/^([A-G][#b]?)(\d)$/);
        let rootNoteRaw = match ? match[1] : "C";
        let rootOct = match ? parseInt(match[2]) : 4;

        const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";

        // Scale disponibili
        const scales = {
            naturalMinor:  [0, 2, 3, 5, 7, 8, 10],
            harmonicMinor: [0, 2, 3, 5, 7, 8, 11],
            major:         [0, 2, 4, 5, 7, 9, 11]
        };
        const intervals = scales[scaleType] || scales.naturalMinor;

        // ------------------------------------------------------------
        // 1. PATTERN LEAD PER STILE (più ricchi)
        // ------------------------------------------------------------
        const leadPatterns = {
            Gigi:      [0, 2, 4, 5, 4, 2, 0, null, 0, 2, 4, 5, 4, 2, 0, null], // 16 beat
            Prezioso:  [0, null, 2, null, 4, null, 2, null, 0, null, 3, null, 5, null, 4, null],
            Eiffel65:  [0, 0, 4, 4, 0, 0, 4, 4, 5, 5, 7, 7, 5, 5, 4, 4],
            GabryPonte:[0, 3, 4, 2, 0, 5, 4, 3, 0, 3, 4, 2, 0, 5, 7, 5]
        };

        let pattern = leadPatterns[style] || leadPatterns.Prezioso;
        
        // Pattern più lunghi per sezioni drop
        if (isDrop && pattern.length < 16) {
            pattern = [...pattern, ...pattern]; // raddoppia
        }

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
        if (isBuild) leadGain = 0.25;
        if (isDrop)  leadGain = 0.85;
        if (isChorus) leadGain = 0.75;

        // Durata nota (staccato vs legato)
        let noteDuration = "8n";
        if (style === "Eiffel65") noteDuration = "4n";
        if (isChorus) noteDuration = "4n";

        // ------------------------------------------------------------
        // 4. FUNZIONE PER GENERARE NOTE SICURE
        // ------------------------------------------------------------
        function getSafeNote(degree, desiredOctave) {
            try {
                // Calcola la nota grezza
                const baseMidi = Tone.Frequency(rootNoteRaw + desiredOctave).toMidi();
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
            } catch (e) {
                console.warn("⚠️ getSafeNote failed:", e.message);
                return rootNoteRaw + "4";
            }
        }

        // ------------------------------------------------------------
        // 5. PATTERN RITMICI AVANZATI
        // ------------------------------------------------------------
        
        // Pattern ritmici per ogni stile (dove suonare)
        const rhythmPatterns = {
            Gigi:      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
            Prezioso:  [1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1, 1, 0, 0, 1],
            Eiffel65:  [1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 1],
            GabryPonte:[1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1]
        };
        
        let rhythmPattern = rhythmPatterns[style] || rhythmPatterns.Prezioso;
        
        // In drop, pattern più denso
        if (isDrop) {
            rhythmPattern = rhythmPattern.map(r => r === 1 ? 1 : (Math.random() > 0.5 ? 1 : 0));
        }
        
        // In build, pattern più sparso
        if (isBuild) {
            rhythmPattern = rhythmPattern.map(r => r === 1 ? (Math.random() > 0.7 ? 1 : 0) : 0);
        }

        // ------------------------------------------------------------
        // 6. SCHEDULAZIONE LEAD
        // ------------------------------------------------------------
        for (let m = 0; m < section.measures; m++) {
            const t0 = section.startTime + m * measureDur;
            
            // Lead principale (pattern melodico)
            for (let i = 0; i < pattern.length; i++) {
                const degree = pattern[i];
                if (degree === null) continue;
                
                // Applica pattern ritmico
                const rhythmIndex = i % rhythmPattern.length;
                if (rhythmPattern[rhythmIndex] === 0) continue;
                
                const t = t0 + i * sixteenth;
                
                // Ottava: drop usa ottava più alta, ma sicura
                let desiredOctave = 4;
                if (isDrop && instrumentType === "piano") desiredOctave = 5;
                if (isDrop && instrumentType === "lead") desiredOctave = 4; // lead non ha ottava 5
                if (isChorus) desiredOctave = 4;
                
                const safeNote = getSafeNote(degree, desiredOctave);
                
                Tone.Transport.schedule(time => {
                    const success = safeTrigger(leadInstrument, safeNote, noteDuration, time, leadGain, "Lead");
                    if (success && score) {
                        score.addNote("Lead", safeNote, section.name);
                    }
                }, t);
            }
            
            // ------------------------------------------------------------
            // 7. RIEMPITIVI (fill) in drop e chorus
            // ------------------------------------------------------------
            if (isDrop || isChorus) {
                // Fill alla fine di ogni 2 misure
                if (m % 2 === 1) {
                    const fillStart = t0 + measureDur - eighth;
                    
                    // Breve scala ascendente
                    for (let f = 0; f < 4; f++) {
                        const tFill = fillStart + f * sixteenth;
                        const fillDegree = [0, 2, 4, 5][f];
                        const fillNote = getSafeNote(fillDegree, 5);
                        
                        Tone.Transport.schedule(time => {
                            safeTrigger(leadInstrument, fillNote, "16n", time, leadGain * 0.6, "LeadFill");
                        }, tFill);
                    }
                }
            }
            
            // ------------------------------------------------------------
            // 8. ACCENTI (note lunghe) in chorus
            // ------------------------------------------------------------
            if (isChorus && m % 2 === 0) {
                const accentTime = t0 + measureDur - quarterNote;
                const accentNote = getSafeNote(0, 4);
                
                Tone.Transport.schedule(time => {
                    safeTrigger(leadInstrument, accentNote, "2n", time, leadGain * 1.2, "LeadAccent");
                }, accentTime);
            }
        }
        
    } catch (outerError) {
        console.error("❌ FATAL ERROR in scheduleDanceLead:", outerError);
        console.trace();
    }
}