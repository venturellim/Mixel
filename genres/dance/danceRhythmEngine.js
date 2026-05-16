// danceRhythmEngine.js — ver. 014 (BILANCIATA - come la dance vera)
import * as Tone from "https://esm.sh/tone";
import { getDanceGroove, grooveCharacteristics } from "./danceGrooves.js";

console.log("danceRhythmEngine.js ver. 014 loaded");

function safeNote(note, defaultOctave = "2") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

function getRootPitch(root) {
    if (!root || typeof root !== "string") return "C";
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    return match ? match[1] : "C";
}

// BASSO: solo sui controbeat (1e2e3e4e)
const bassPatterns = {
    Gigi: (s) => s % 2 === 1,
    Prezioso: (s) => s % 2 === 1,
    Eiffel65: (s) => s % 2 === 1,
    GabryPonte: (s) => s % 2 === 1
};

// HI-HAT: ogni 8th (non ogni 16th!)
const hatDensity = {
    Gigi: 0.5,      // solo sui quarti
    Prezioso: 0.6,  // un po' più fitto
    Eiffel65: 0.7,
    GabryPonte: 0.6
};

export function scheduleDanceRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
    const { percussion, bass, warmPad, wavePad, glassPad, bellsPad, organo } = instruments;
    if (!percussion || !bass) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo");

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};
    const style = params?.style || "Prezioso";
    const isDrop = isChorus || isSolo;

    const bassShouldPlay = bassPatterns[style] || bassPatterns.Prezioso;
    const hatProb = hatDensity[style] || 0.6;

    // Selezione pad
    let selectedPad;
    let useOrgano = false;
    
    switch(style) {
        case "Gigi": selectedPad = warmPad; useOrgano = true; break;
        case "Eiffel65": selectedPad = glassPad; break;
        case "GabryPonte": selectedPad = bellsPad; break;
        default: selectedPad = wavePad;
    }

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(currentRoot);
        
        const bassNote = safeNote(pitchRoot, "2");
        const padRoot = safeNote(pitchRoot, "3");
        const padThird = safeNote(Tone.Frequency(pitchRoot + "3").transpose(3).toNote(), "3");
        const padFifth = safeNote(Tone.Frequency(pitchRoot + "3").transpose(7).toNote(), "3");

        // PERCORRE TUTTI I 16 SEDICESIMI
        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + s * stepTime;
            const isQuarter = (s === 0 || s === 4 || s === 8 || s === 12);
            const isEighth = (s % 2 === 0);
            const isOffBeat = (s % 2 === 1);
            
            // KICK: solo sui quarti (1,2,3,4)
            if (isQuarter) {
                Tone.Transport.schedule(t => {
                    percussion?.player("kick")?.start(t);
                    if (score) score.addNote("Drums", "Kick", section.name);
                }, absoluteTime);
            }
            
            // SNARE: sul 2 e 4 (sedicesimi 4 e 12)
            if (!isIntro && (s === 4 || s === 12)) {
                Tone.Transport.schedule(t => {
                    percussion?.player("handClap")?.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }
            
            // HI-HAT: ogni 8th (sui quarti e mezzi)
            if (isEighth && (isDrop || Math.random() < hatProb)) {
                Tone.Transport.schedule(t => {
                    percussion?.player("closedHat")?.start(t);
                    if (score) score.addNote("Drums", "HiHat", section.name);
                }, absoluteTime);
            }
            
            // BASSO: su OGNI controbeat (e, e, e, e)
            if (isOffBeat && bassNote) {
                Tone.Transport.schedule(t => {
                    bass.triggerAttackRelease(bassNote, "16n", t);
                    if (score) score.addNote("Bass", bassNote, section.name);
                }, absoluteTime);
            }
            
            // CRASH all'inizio
            if (s === 0 && m === 0 && !isIntro) {
                Tone.Transport.schedule(t => {
                    percussion?.player("crash")?.start(t);
                    if (score) score.addNote("Drums", "Crash", section.name);
                }, absoluteTime);
            }
        }
        
        // PAD
        if (selectedPad) {
            Tone.Transport.schedule(t => {
                selectedPad.triggerAttackRelease([padRoot, padThird, padFifth], measureDur * 0.9, t);
                if (score) {
                    score.addNote("Pad", padRoot, section.name);
                    score.addNote("Pad", padThird, section.name);
                    score.addNote("Pad", padFifth, section.name);
                }
            }, measureStartTime);
        }
        
        // ORGANO per Gigi
        if (useOrgano && organo && !isIntro) {
            Tone.Transport.schedule(t => {
                organo.triggerAttackRelease(padRoot, measureDur * 0.9, t);
                if (score) score.addNote("Organo", padRoot, section.name);
            }, measureStartTime);
        }
    }
}