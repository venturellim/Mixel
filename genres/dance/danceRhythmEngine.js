// danceRhythmEngine.js — ver. 011 (più ritmico, meno "lento")
import * as Tone from "https://esm.sh/tone";
import { getDanceGroove, grooveCharacteristics } from "./danceGrooves.js";
import { duckEnv } from "./danceInstruments.js";


console.log("danceRhythmEngine.js ver. 011 loaded");

function getPreziosoVelocity(step, isDrop) {
    const base = {
        2: 0.90,
        6: 0.75,
        10: 0.85,
        14: 0.70
    }[step] ?? 0.7;

    return isDrop ? base + 0.05 : base;
}

function shouldPlayGhost(rand) {
    // 20% di probabilità
    return rand() < 0.20;
}

function getGhostVelocity() {
    return 0.20 + Math.random() * 0.15; // 0.20–0.35
}

function getGhostDuration() {
    return "16n"; // corta e non invadente
}

function chance(rand, p) {
    return rand() < p;
}

function swingOffset(s, stepTime, swingAmount = 0.0) {
    // swingAmount: 0 = dritto, 1 = molto swing
    if (s % 2 === 1) return 0; // swing solo sui sedicesimi pari
    return stepTime * 0.3 * swingAmount; 
}

function microTimingOffset(s, style, rand) {
    const early = [-0.005, -0.008, -0.010, -0.012];
    const late  = [0.005, 0.010, 0.012, 0.015];

    switch (style) {
        case "Prezioso":
            if (s === 4 || s === 12) return late[Math.floor(rand()*late.length)]; // clap late
            if (s % 2 === 1) return early[Math.floor(rand()*early.length)];       // hat early
            return 0;

        case "GabryPonte":
            if (s === 4 || s === 12) return 0.012; // clap fisso late
            if (s % 2 === 1) return early[Math.floor(rand()*early.length)];
            return 0;

        case "Gigi":
            return late[Math.floor(rand()*late.length)]; // dreamy → leggermente late

        case "Eiffel65":
            return 0; // robotico → niente microtiming

        default:
            return 0;
    }
}

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
            //const absoluteTime = measureStartTime + s * stepTime;
            //const absoluteTime = measureStartTime + s * stepTime + swingOffset(s, stepTime, params.swing || 0);
            const absoluteTime =
    measureStartTime +
    s * stepTime +
    swingOffset(s, stepTime, params.swing || 0) +
    microTimingOffset(s, style, rand);
            
            // KICK (più fitta in drop)
            let playKick = true;
            if (!isDrop && !isChorus && s % 4 !== 0) playKick = false;
            if (playKick) {
                Tone.Transport.schedule(t => {
    percussion?.player("kick")?.start(t);

    // SIDECHAIN DUCKING
    duckEnv.triggerAttackRelease("16n", t);

    if (score) score.addNote("Drums", "Kick", section.name);
}, absoluteTime);

            
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
                    let vel = 0.8;

// ACCENTI STILE PREZIOSO
if (style === "Prezioso") {
    vel = getPreziosoVelocity(s, isDrop);
}

//bass.triggerAttackRelease(bassNote, "8n", t, vel);
// MID-BASS (il tuo basso principale)
bass.triggerAttackRelease(bassNote, "8n", t, vel);

// SUB (un’ottava sotto)
const subNote = Tone.Frequency(bassNote).transpose(-12).toNote();
subBass.triggerAttackRelease(subNote, "8n", t, 0.6);

// ATTACK (transient)
bassAttack.triggerAttackRelease(bassNote, "32n", t, 0.4);

                    if (score) score.addNote("Bass", bassNote, section.name);
               }, absoluteTime);
            } else if ([1, 5, 9, 13].includes(s) && bassNote && shouldPlayGhost(rand)) {
// GHOST NOTES (solo se il basso NON suona qui)
    Tone.Transport.schedule(t => {
        const vel = getGhostVelocity();
        const dur = getGhostDuration();
        bass.triggerAttackRelease(bassNote, dur, t, vel);
        if (score) score.addNote("BassGhost", bassNote, section.name);
    }, absoluteTime - 0.015);
}
}
// ------------------------------------------------------------
// VARIAZIONI RANDOM CONTROLLATE
// ------------------------------------------------------------

// 1) HI-HAT EXTRA (15% probabilità)
if (chance(rand, 0.15) && !isIntro && s % 2 === 1) {
    Tone.Transport.schedule(t => {
        percussion?.player("closedHat")?.start(t);
        if (score) score.addNote("HiHatExtra", "Hat", section.name);
    }, absoluteTime + stepTime * 0.1);
}

// 2) CLAP ANTICIPATO (solo su 4, 10% probabilità)
if (s === 12 && chance(rand, 0.10) && !isIntro) {
    Tone.Transport.schedule(t => {
        percussion?.player("handClap")?.start(t);
        if (score) score.addNote("ClapEarly", "Snare", section.name);
    }, absoluteTime - stepTime * 0.2);
}

// 3) BASS DOUBLE HIT (solo nel drop, 20% probabilità)
// 3) BASS DOUBLE HIT (solo nel drop, 20% probabilità)
if (isDrop && bassShouldPlay(s, isDrop) && chance(rand, 0.20)) {
    Tone.Transport.schedule(t => {
        bass.triggerAttackRelease(bassNote, "32n", t, 0.5);
        if (score) score.addNote("BassDouble", bassNote, section.name);
    }, absoluteTime + stepTime * 0.25);
}


// 4) MINI FX FILL (ogni 4 misure)
if (m % 4 === 3 && s === 15 && chance(rand, 0.25) && fxNoise) {
    Tone.Transport.schedule(t => {
        fxNoise.triggerAttackRelease("C4", "16n", t, 0.4);
        if (score) score.addNote("FXFill", "Noise", section.name);
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