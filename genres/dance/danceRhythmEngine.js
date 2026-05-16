// danceRhythmEngine.js — ver. 013 (COMPLETA - continuous 16th groove)
import * as Tone from "https://esm.sh/tone";
import { getDanceGroove, grooveCharacteristics } from "./danceGrooves.js";

console.log("danceRhythmEngine.js ver. 013 loaded");

// ------------------------------------------------------------
// UTILITY FUNCTIONS
// ------------------------------------------------------------
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

// ------------------------------------------------------------
// BASS PATTERNS (tutti su off-beat continuo)
// ------------------------------------------------------------
const bassPatterns = {
    Gigi: (s, isDrop) => s % 2 === 1,      // tutti gli off-beat
    Prezioso: (s, isDrop) => s % 2 === 1,  // tutti gli off-beat
    Eiffel65: (s, isDrop) => s % 2 === 1,  // tutti gli off-beat
    GabryPonte: (s, isDrop) => s % 2 === 1 // tutti gli off-beat
};

// ------------------------------------------------------------
// HAT DENSITY (continuo)
// ------------------------------------------------------------
const hatDensity = {
    Gigi: 1.0,
    Prezioso: 1.0,
    Eiffel65: 1.0,
    GabryPonte: 1.0
};

// ------------------------------------------------------------
// MAIN FUNCTION
// ------------------------------------------------------------
export function scheduleDanceRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
    const { percussion, bass, warmPad, wavePad, glassPad, bellsPad, StStringPad, organo, piano } = instruments;
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

    const sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : (isSolo ? "solo" : "verse")));
    const currentGroove = getDanceGroove(sectionType, energy, brightness, complexity);
    const groove = grooveCharacteristics[currentGroove];

    console.log(`🥁 ${section.name} | Stile: ${style} | Groove: ${currentGroove} | Drop: ${isDrop}`);

    // Pattern di base dal groove (usato solo per kick accent pattern)
    let basePattern = groove?.pattern || [0, 4, 8, 12];
    const bassShouldPlay = bassPatterns[style] || bassPatterns.Prezioso;
    const hatProb = hatDensity[style] || 1.0;

    // Selezione pad in base allo stile
    let selectedPad;
    let useOrgano = false;
    
    switch(style) {
        case "Gigi":
            selectedPad = warmPad;
            useOrgano = true;
            break;
        case "Eiffel65":
            selectedPad = glassPad;
            break;
        case "GabryPonte":
            selectedPad = bellsPad;
            break;
        default:
            selectedPad = wavePad;
    }

    // ------------------------------------------------------------
    // LOOP MISURE - PERCORRE TUTTI I 16 SEDICESIMI
    // ------------------------------------------------------------
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
            
            // --------------------------------------------------------
            // KICK - sui quarti (0,4,8,12) e talvolta extra in drop
            // --------------------------------------------------------
            let playKick = (s === 0 || s === 4 || s === 8 || s === 12);
            
            // In drop/chorus, kick extra sugli off-beat per più energia
            if (isDrop && (s === 2 || s === 6 || s === 10 || s === 14)) {
                playKick = true;
            }
            
            if (playKick) {
                Tone.Transport.schedule(t => {
                    percussion?.player("bassDrum")?.start(t);
                    if (score) score.addNote("Drums", "Kick", section.name);
                }, absoluteTime);
            }
            
            // --------------------------------------------------------
            // SNARE/CLAP - sul 2 e 4 (sedicesimi 4 e 12)
            // --------------------------------------------------------
            if (!isIntro && (s === 4 || s === 12)) {
                Tone.Transport.schedule(t => {
                    percussion?.player("handClap")?.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }
            
            // --------------------------------------------------------
            // HI-HAT - su OGNI sedicesimo (continuous 16th)
            // --------------------------------------------------------
            if (!isIntro || (isIntro && s % 4 === 0)) {
                // Alterna closed/open hat per movimento
                const useOpenHat = (isDrop && (s % 4 === 1 || s % 4 === 3)) || (Math.random() < 0.15);
                const hatSound = useOpenHat ? "openHat" : "closedHat";
                
                Tone.Transport.schedule(t => {
                    percussion?.player(hatSound)?.start(t);
                    if (score) score.addNote("Drums", hatSound === "openHat" ? "OpenHat" : "HiHat", section.name);
                }, absoluteTime);
            }
            
            // --------------------------------------------------------
            // RIDE - in drop/chorus per brillantezza
            // --------------------------------------------------------
            if (isDrop && (s === 0 || s === 8)) {
                Tone.Transport.schedule(t => {
                    percussion?.player("ride")?.start(t);
                    if (score) score.addNote("Drums", "Ride", section.name);
                }, absoluteTime);
            }
            
            // --------------------------------------------------------
            // BASSLINE - su OGNI off-beat (sedicesimi dispari: 1,3,5,7,9,11,13,15)
            // --------------------------------------------------------
            if (bassShouldPlay(s, isDrop) && bassNote) {
                Tone.Transport.schedule(t => {
                    bass.triggerAttackRelease(bassNote, "16n", t);
                    if (score) score.addNote("Bass", bassNote, section.name);
                }, absoluteTime);
            }
            
            // --------------------------------------------------------
            // CRASH - all'inizio della prima misura della sezione
            // --------------------------------------------------------
            if (s === 0 && m === 0 && !isIntro) {
                Tone.Transport.schedule(t => {
                    percussion?.player("crash")?.start(t);
                    if (score) score.addNote("Drums", "Crash", section.name);
                }, absoluteTime);
            }
        }
        
        // --------------------------------------------------------
        // ORGANO per stile Gigi
        // --------------------------------------------------------
        if (useOrgano && organo && !isIntro) {
            Tone.Transport.schedule(t => {
                organo.triggerAttackRelease(padRoot, measureDur * 0.9, t);
                if (score) score.addNote("Organo", padRoot, section.name);
            }, measureStartTime);
        }
        
        // --------------------------------------------------------
        // PAD principale (accordo sostenuto per tutta la misura)
        // --------------------------------------------------------
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
    }
}