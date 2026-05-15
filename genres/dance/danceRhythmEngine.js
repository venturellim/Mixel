// danceRhythmEngine.js — ver. 009 (stile-specific patterns)
import * as Tone from "https://esm.sh/tone";
import { getDanceGroove, grooveCharacteristics } from "./danceGrooves.js";

console.log("danceRhythmEngine.js ver. 009 loaded");

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

// STILE-SPECIFIC BASS PATTERNS
const bassPatterns = {
    Gigi: (s, isDrop) => s === 0 || (isDrop && s % 8 === 0),
    Prezioso: (s, isDrop) => s === 0 || s === 4 || s === 8 || s === 12 || (isDrop && s % 2 === 0),
    Eiffel65: (s, isDrop) => s % 2 === 0,  // ogni 8th note
    GabryPonte: (s, isDrop) => s === 0 || s === 6 || s === 8 || s === 14
};

// STILE-SPECIFIC HAT DENSITY
const hatDensity = {
    Gigi: 0.3,      // hat leggeri
    Prezioso: 0.6,  // hat medi
    Eiffel65: 0.8,  // hat fitti (robotico)
    GabryPonte: 0.5 // hat melodici
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

    console.log(`🥁 ${section.name} | Stile: ${style} | Groove: ${currentGroove}`);

    let pattern = groove?.pattern || [0, 4, 8, 12];
    const bassCheck = bassPatterns[style] || bassPatterns.Prezioso;
    const hatProb = hatDensity[style] || 0.5;

    // SELEZIONE PAD IN BASE ALLO STILE
    let selectedPad;
    let useOrgano = false;
    
    switch(style) {
        case "Gigi":
            selectedPad = warmPad;  // warm pad per atmosfera dream
            useOrgano = true;       // Gigi usa anche organo
            break;
        case "Eiffel65":
            selectedPad = glassPad; // glass pad robotico
            break;
        case "GabryPonte":
            selectedPad = bellsPad; // bells pad anthem
            break;
        default: // Prezioso
            selectedPad = wavePad;  // wave pad ritmico
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
            
            // KICK
            Tone.Transport.schedule(t => {
                percussion?.player("bassDrum")?.start(t);
                if (score) score.addNote("Drums", "Kick", section.name);
            }, absoluteTime);
            
            // SNARE/CLAP (sul 2 e 4, tranne intro)
            if (!isIntro && (s === 4 || s === 12 || (pattern.length > 8 && s % 4 === 1))) {
                Tone.Transport.schedule(t => {
                    percussion?.player("handClap")?.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }
            
            // HI-HAT (densità in base allo stile)
            if (isDrop || isChorus || Math.random() < hatProb || s % 2 === 0) {
                Tone.Transport.schedule(t => {
                    percussion?.player("closedHat")?.start(t);
                    if (score) score.addNote("Drums", "HiHat", section.name);
                }, absoluteTime);
            }
            
            // BASSLINE (pattern specifico per stile)
            if (bassCheck(s, isDrop) && bassNote) {
                Tone.Transport.schedule(t => {
                    bass.triggerAttackRelease(bassNote, "8n", t);
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
        
        // ORGANO per stile Gigi (suona il pad)
        if (useOrgano && organo && !isIntro) {
            Tone.Transport.schedule(t => {
                organo.triggerAttackRelease(padRoot, measureDur * 0.9, t);
                if (score) score.addNote("Organo", padRoot, section.name);
            }, measureStartTime);
        }
        
        // PAD principale
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