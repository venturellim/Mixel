// danceLeadEngine.js — ver. 005 COMPLETA E CORRETTA
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./danceInstruments.js";

console.log("danceLeadEngine.js ver. 005 COMPLETA loaded");

// ------------------------------------------------------------
// SAFE TRIGGER
// ------------------------------------------------------------
function safeTrigger(instrument, note, duration, time, velocity = 0.5, name = "Lead") {
    if (!instrument) return false;
    if (typeof instrument.triggerAttackRelease !== 'function') return false;
    if (!note || typeof note !== 'string') return false;
    if (time === undefined || time === null || isNaN(time)) return false;
    
    try {
        instrument.triggerAttackRelease(note, duration, time, velocity);
        return true;
    } catch (e) {
        console.warn(`⚠️ ${name} failed:`, e.message);
        return false;
    }
}

// ------------------------------------------------------------
// FUNZIONE PRINCIPALE
// ------------------------------------------------------------
export function scheduleDanceLead(section, instruments, params, style, score, rand) {
    try {
        const name = section.name.toLowerCase();
        const isIntro = name.includes("intro");
        const isBuild = name.includes("build");
        const isDrop = name.includes("drop");
        const isBreak = name.includes("break");
        const isChorus = name.includes("chorus");

        // Lead disponibili
        const { leadSaw, leadSynthBrass1, leadSynthBrass2, piano } = instruments;

        // Sezione senza lead
        if (isIntro || isBreak) {
            console.log(`🎵 No lead per sezione: ${section.name}`);
            return;
        }

        // BPM e timing
        const bpm = params.bpm;
        if (!bpm || isNaN(bpm)) {
            console.warn("⚠️ Invalid BPM in danceLeadEngine:", bpm);
            return;
        }
        
        const measureDur = (60 / bpm) * 4;
        const eighth = measureDur / 8;
        const sixteenth = measureDur / 16;
        
        console.log(`🎵 Lead timing: bpm=${bpm}, measureDur=${measureDur}, eighth=${eighth}`);

        // TONAL CENTER
        let tonal = params?.tonalCenter ?? "C4";
        if (typeof tonal !== "string" || tonal.length < 2) {
            tonal = "C4";
        }

        const match = tonal.match(/^([A-G][#b]?)(\d)$/);
        let rootNoteRaw = match ? match[1] : "C";
        
        console.log(`🎵 Tonal center: ${tonal}, root: ${rootNoteRaw}`);

        const scaleType = params?.scaleType || "naturalMinor";

        // Scale disponibili
        const scales = {
            naturalMinor: [0, 2, 3, 5, 7, 8, 10],
            harmonicMinor: [0, 2, 3, 5, 7, 8, 11]
        };
        const intervals = scales[scaleType] || scales.naturalMinor;
        
        console.log(`🎵 Scale: ${scaleType}, intervals: ${intervals}`);

        // PATTERN LEAD PER STILE
        const leadPatterns = {
            Gigi: [0, 2, 4, 5, 4, 2, 0, null],
            Prezioso: [0, null, 2, null, 4, null, 2, null],
            Eiffel65: [0, 0, 4, 4, 0, 0, 4, 4],
            GabryPonte: [0, 3, 4, 2, 0, 5, 4, 3]
        };

        let pattern = leadPatterns[style] || leadPatterns.Prezioso;
        
        // Pattern più lungo per drop
        if (isDrop) {
            pattern = [...pattern, ...pattern];
        }

        // SCELTA STRUMENTO LEAD
        const leadInstrument = {
            Gigi: piano,
            Prezioso: leadSaw,
            Eiffel65: leadSynthBrass1,
            GabryPonte: leadSynthBrass2
        }[style] || leadSaw;
        
        console.log(`🎹 Lead instrument: ${style} → ${leadInstrument ? "OK" : "MISSING"}`);

        // VOLUME LEAD
        let leadGain = 0.5;
        if (isBuild) leadGain = 0.3;
        if (isDrop) leadGain = 0.85;
        if (isChorus) leadGain = 0.75;

        // FUNZIONE PER NOTE SICURE
        function getScaleNote(degree, octave = 4) {
            try {
                const base = Tone.Frequency(rootNoteRaw + octave).toMidi();
                const semi = intervals[degree % intervals.length];
                const midiNote = base + semi;
                let rawNote = Tone.Frequency(midiNote, "midi").toNote();
                
                // Normalizza la nota
                const noteMatch = rawNote.match(/^([A-G][#b]?)(\d+)$/);
                if (!noteMatch) return rootNoteRaw + octave;
                
                const noteRoot = noteMatch[1];
                const safeRoot = normalizeNote(noteRoot, "lead");
                
                return safeRoot + octave;
            } catch (e) {
                console.warn("⚠️ getScaleNote failed:", e.message);
                return rootNoteRaw + octave;
            }
        }

        // SCHEDULAZIONE LEAD
        for (let m = 0; m < section.measures; m++) {
            const t0 = section.startTime + m * measureDur;
            
            pattern.forEach((degree, i) => {
                if (degree === null) return;
                
                const t = t0 + i * eighth;
                // Usa ottava 4 per lead (sicura)
                const note = getScaleNote(degree, 4);
                
                Tone.Transport.schedule(time => {
                    safeTrigger(leadInstrument, note, "8n", time, leadGain, "Lead");
                    if (score) score.addNote("Lead", note, section.name);
                }, t);
            });
        }
        
        console.log(`✅ Lead scheduled per ${section.name}`);
        
    } catch (error) {
        console.error("❌ FATAL ERROR in scheduleDanceLead:", error);
        console.trace();
    }
}