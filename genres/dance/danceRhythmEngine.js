// danceRhythmEngine.js — ver. 010 (bass patterns funzionanti)
import * as Tone from "https://esm.sh/tone";
import { getDanceGroove, grooveCharacteristics } from "./danceGrooves.js";

console.log("danceRhythmEngine.js ver. 010 loaded");

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

// STILE-SPECIFIC BASS PATTERNS (pattern su 16ths, 0-15)
const bassPatterns = {
    // Gigi: basso sulla 2 e 4 (controtempo)
    Gigi: (s, isDrop) => {
        if (isDrop) return s === 4 || s === 12 || s === 6 || s === 14;
        return s === 4 || s === 12;
    },
    
    // Prezioso: basso syncopato
    Prezioso: (s, isDrop) => {
        if (isDrop) return s % 2 === 0 && s !== 0 && s !== 8;
        return s === 2 || s === 4 || s === 6 || s === 10 || s === 14;
    },
    
    // Eiffel65: basso robotico su ogni off-beat
    Eiffel65: (s, isDrop) => {
        return s % 2 === 1;  // off-beat: 1,3,5,7,9,11,13,15
    },
    
    // Gabry Ponte: basso melodico sul 2 e 4
    GabryPonte: (s, isDrop) => {
        if (isDrop) return s === 4 || s === 12 || s === 6 || s === 14;
        return s === 4 || s === 12;
    }
};

// STILE-SPECIFIC HAT DENSITY
const hatDensity = {
    Gigi: 0.3,
    Prezioso: 0.6,
    Eiffel65: 0.8,
    GabryPonte: 0.5
};

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

    console.log(`🥁 ${section.name} | Stile: ${style} | Groove: ${currentGroove} | isDrop: ${isDrop}`);

    let pattern = groove?.pattern || [0, 4, 8, 12];
    
    // Prendi la funzione del basso per questo stile
    const bassShouldPlay = bassPatterns[style] || bassPatterns.Prezioso;
    const hatProb = hatDensity[style] || 0.5;

    // SELEZIONE PAD IN BASE ALLO STILE
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

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(currentRoot);
        
        const bassNote = safeNote(pitchRoot, "2");
        const padRoot = safeNote(pitchRoot, "3");
        const padThird = safeNote(Tone.Frequency(pitchRoot + "3").transpose(3).toNote(), "3");
        const padFifth = safeNote(Tone.Frequency(pitchRoot + "3").transpose(7).toNote(), "3");

        for (let s of pattern) {
            const absoluteTime = measureStartTime + s * stepTime;
            
            // KICK (sempre sul pattern)
            Tone.Transport.schedule(t => {
                percussion?.player("bassDrum")?.start(t);
                if (score) score.addNote("Drums", "Kick", section.name);
            }, absoluteTime);
            
            // SNARE/CLAP (sul 2 e 4)
            if (!isIntro && (s === 4 || s === 12)) {
                Tone.Transport.schedule(t => {
                    percussion?.player("handClap")?.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }
            
            // HI-HAT
            if (isDrop || isChorus || Math.random() < hatProb || s % 2 === 0) {
                Tone.Transport.schedule(t => {
                    percussion?.player("closedHat")?.start(t);
                    if (score) score.addNote("Drums", "HiHat", section.name);
                }, absoluteTime);
            }
            
            // BASSLINE (USA LA FUNZIONE CORRETTA!)
            if (bassShouldPlay(s, isDrop) && bassNote) {
                Tone.Transport.schedule(t => {
                    bass.triggerAttackRelease(bassNote, "8n", t);
                    if (bassShouldPlay(s, isDrop) && bassNote) {
    console.log(`🎸 BASS at step ${s}, isDrop=${isDrop}, style=${style}`);
 
                    if (score) score.addNote("Bass", bassNote, section.name);
                }, absoluteTime);
            }
            
            // CRASH all'inizio sezione
            if (s === 0 && m === 0) {
                Tone.Transport.schedule(t => {
                    percussion?.player("crash")?.start(t);
                    if (score) score.addNote("Drums", "Crash", section.name);
                }, absoluteTime);
            }
        }
        
        // ORGANO per Gigi
        if (useOrgano && organo && !isIntro) {
            Tone.Transport.schedule(t => {
                organo.triggerAttackRelease(padRoot, measureDur * 0.9, t);
                if (score) score.addNote("Organo", padRoot, section.name);
            }, measureStartTime);
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
    }
}