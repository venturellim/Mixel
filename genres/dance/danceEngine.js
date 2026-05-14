// danceRhythmEngine.js — ver. 007 FINALE
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./danceInstruments.js";

console.log("danceRhythmEngine.js ver. 007 FINALE loaded");

// ------------------------------------------------------------
// SAFE TRIGGER
// ------------------------------------------------------------
function safeTrigger(instrument, note, duration, time, velocity = 0.5, name = "unknown") {
    if (!instrument) return false;
    if (typeof instrument.triggerAttackRelease !== 'function') return false;
    if (!note || typeof note !== 'string') return false;
    if (time === undefined || time === null || isNaN(time)) return false;
    
    // Validazione duration
    let safeDuration = duration;
    if (duration === undefined || duration === null || isNaN(duration)) {
        safeDuration = "8n";
    }
    
    try {
        instrument.triggerAttackRelease(note, safeDuration, time, velocity);
        return true;
    } catch (e) {
        console.warn(`⚠️ ${name} failed:`, e.message);
        return false;
    }
}

function safePercussion(perc, sound, time, score, section) {
    if (!perc || !perc.player) return;
    const player = perc.player(sound);
    if (!player) return;
    if (time === undefined || isNaN(time)) return;
    
    try {
        player.start(time);
        if (score) score.addNote("Drums", sound, section);
    } catch (e) {}
}

// ------------------------------------------------------------
// BASSLINE
// ------------------------------------------------------------
function getBassOctave(root) {
    const octave2 = ["C", "E"];
    const octave3 = ["C", "F#"];
    if (octave2.includes(root)) return "2";
    if (octave3.includes(root)) return "3";
    return "2";
}

function bassPrezioso(root, t0, eighth, bass, score, section) {
    const note = root + getBassOctave(root);
    for (let i = 0; i < 8; i++) {
        const t = t0 + i * eighth;
        Tone.Transport.schedule(time => {
            safeTrigger(bass, note, "16n", time, 0.6, "Bass");
            if (score) score.addNote("Bass", note, section);
        }, t);
    }
}

const styleBass = { Prezioso: bassPrezioso, Gigi: bassPrezioso, Eiffel65: bassPrezioso, GabryPonte: bassPrezioso };

// ------------------------------------------------------------
// MAIN
// ------------------------------------------------------------
export function scheduleDanceRhythm(section, instruments, params, style, score, rand) {
    try {
        const { percussion, bass, warmPad, wavePad, glassPad, bellsPad, StStringPad, fxSweep, fxNoise, fxJump, fxFantasy, fxHardFTCore } = instruments;
        
        if (!percussion || !bass) return;
        
        const bpm = params.bpm;
        if (!bpm || isNaN(bpm)) return;
        
        const measureDur = (60 / bpm) * 4;
        const step = measureDur / 4;
        const eighth = measureDur / 8;
        const sixteenth = measureDur / 16;
        
        const isBuild = section.name.includes("build");
        const isDrop = section.name.includes("drop");
        const isBreak = section.name.includes("break");
        const isIntro = section.name.includes("intro");
        
        // Tonal center
        let tonal = params?.tonalCenter ?? "C4";
        const match = tonal.match(/^([A-G][#b]?)/);
        const rootRaw = match ? match[1] : "C";
        const safeRoot = normalizeNote(rootRaw, "bass");
        
        // Pad setup
        const padA = { inst: warmPad, name: "warmPad" };
        const padB = { inst: wavePad, name: "wavePad" };
        
        let padGain = 0.4;
        if (isIntro) padGain = 0.2;
        if (isBuild) padGain = 0.15;
        if (isDrop) padGain = 0.7;
        if (isBreak) padGain = 0.1;
        
        // FX
        if (isBuild && fxSweep) {
            Tone.Transport.schedule(time => {
                safeTrigger(fxSweep, "C4", measureDur * section.measures, time, 0.5, "Sweep");
            }, section.startTime);
        }
        
        if (isDrop && fxHardFTCore) {
            Tone.Transport.schedule(time => {
                safeTrigger(fxHardFTCore, "C4", "2n", time, 0.8, "Impact");
            }, section.startTime);
        }
        
        // Loop misure
        for (let m = 0; m < section.measures; m++) {
            const t0 = section.startTime + m * measureDur;
            
            // Crash
            if (m === 0) {
                Tone.Transport.schedule(time => safePercussion(percussion, "crash", time, score, section.name), t0);
            }
            
            // Kick
            for (let i = 0; i < 4; i++) {
                if (isBreak && i !== 0) continue;
                Tone.Transport.schedule(time => safePercussion(percussion, "bassDrum", time, score, section.name), t0 + i * step);
            }
            
            // Clap
            if (!isIntro) {
                [1, 3].forEach(i => {
                    Tone.Transport.schedule(time => safePercussion(percussion, "handClap", time, score, section.name), t0 + i * step);
                });
            }
            
            // Hi-hat
            for (let i = 0; i < 8; i++) {
                if (isBuild || isDrop || i % 2 === 0) {
                    Tone.Transport.schedule(time => safePercussion(percussion, "closedHat", time, score, section.name), t0 + i * eighth);
                }
            }
            
            // Pad
            const chordNote = safeRoot + "3";
            Tone.Transport.schedule(time => {
                if (padA.inst) safeTrigger(padA.inst, chordNote, measureDur * 0.95, time, padGain, padA.name);
                if (padB.inst) safeTrigger(padB.inst, chordNote, measureDur * 0.95, time, padGain * 0.8, padB.name);
                if (score) score.addNote("Pad", chordNote, section.name);
            }, t0);
            
            // Bass
            const bassFn = styleBass[style] || bassPrezioso;
            bassFn(safeRoot, t0, sixteenth, bass, score, section.name);
        }
    } catch (e) {
        console.error("❌ scheduleDanceRhythm error:", e);
    }
}