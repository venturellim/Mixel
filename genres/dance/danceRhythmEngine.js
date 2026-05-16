// danceRhythmEngine.js — ver. 011 (più ritmico, meno "lento")
import * as Tone from "https://esm.sh/tone";
import { getDanceGroove, grooveCharacteristics } from "./danceGrooves.js";

console.log("danceRhythmEngine.js ver. 011 loaded");

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

const bassPatterns = {
    Gigi: (s, isDrop) => isDrop ? [4,6,12,14].includes(s) : [4,12].includes(s),
    Prezioso: (s, isDrop) => isDrop ? [2,4,6,10,12,14].includes(s) : [2,4,6,10,12,14].includes(s),
    Eiffel65: (s, isDrop) => s % 2 === 1,
    GabryPonte: (s, isDrop) => isDrop ? [4,6,12,14].includes(s) : [4,12].includes(s)
};

const hatDensity = {
    Gigi: 0.6,      // aumentato
    Prezioso: 0.8,  // aumentato
    Eiffel65: 0.9,  // aumentato
    GabryPonte: 0.7 // aumentato
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

    let pattern = groove?.pattern || [0,4,8,12];
    const bassShouldPlay = bassPatterns[style] || bassPatterns.Prezioso;
    const hatProb = hatDensity[style] || 0.7;

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

        for (let s of pattern) {
            const absoluteTime = measureStartTime + s * stepTime;
            
            // KICK (più fitta in drop)
            let playKick = true;
            if (!isDrop && !isChorus && s % 4 !== 0) playKick = false;
            if (playKick) {
                Tone.Transport.schedule(t => {
                    percussion?.player("kick")?.start(t);
                    if (score) score.addNote("Drums", "Kick", section.name);
                }, absoluteTime);
            }
            
            // SNARE/CLAP
            if (!isIntro && (s === 4 || s === 12)) {
                Tone.Transport.schedule(t => {
                    percussion?.player("handClap")?.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }
            
            // HI-HAT (molto più fitto)
            if (isDrop || isChorus || Math.random() < hatProb || s % 2 === 0) {
                // Alterna closed e open hat per più movimento
                const useOpenHat = (isDrop && s % 4 === 2) || (Math.random() < 0.2);
                const hatSound = useOpenHat ? "openHat" : "closedHat";
                Tone.Transport.schedule(t => {
                    percussion?.player(hatSound)?.start(t);
                    if (score) score.addNote("Drums", hatSound === "openHat" ? "OpenHat" : "HiHat", section.name);
                }, absoluteTime);
            }
            
            // RIDE aggiuntivo in drop per più brillantezza
            if (isDrop && (s === 0 || s === 8)) {
                Tone.Transport.schedule(t => {
                    percussion?.player("ride")?.start(t);
                    if (score) score.addNote("Drums", "Ride", section.name);
                }, absoluteTime);
            }
            
            // BASSLINE
            if (bassShouldPlay(s, isDrop) && bassNote) {
                Tone.Transport.schedule(t => {
                    bass.triggerAttackRelease(bassNote, "16n", t);
                    if (score) score.addNote("Bass", bassNote, section.name);
                }, absoluteTime);
            }
            
            // CRASH
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