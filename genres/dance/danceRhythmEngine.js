// danceRhythmEngine.js — ver. 008 (groove-based, come metal)
import * as Tone from "https://esm.sh/tone";
import { getDanceGroove, grooveCharacteristics } from "./danceGrooves.js";

console.log("danceRhythmEngine.js ver. 008 loaded");

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

export function scheduleDanceRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot, score) {
    const { percussion, bass, warmPad, wavePad, bassBus } = instruments;
    if (!percussion || !bass) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre") || name.includes("bridge");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo");

    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};

    const sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : (isSolo ? "solo" : "verse")));
    const currentGroove = getDanceGroove(sectionType, energy, brightness, complexity);
    const groove = grooveCharacteristics[currentGroove];

    console.log(`🥁 ${section.name} → groove: ${currentGroove} | energy=${energy.toFixed(2)}`);

    // Pattern base dal groove
    let pattern = groove?.pattern || [0, 4, 8, 12];

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(currentRoot);
        
        // Nota basso (ottava 2)
        const bassNote = safeNote(pitchRoot, "2");
        
        // Accordo pad (basato sulla scala minore naturale)
        const padRoot = safeNote(pitchRoot, "3");
        const padThird = safeNote(Tone.Frequency(pitchRoot + "3").transpose(3).toNote(), "3");
        const padFifth = safeNote(Tone.Frequency(pitchRoot + "3").transpose(7).toNote(), "3");
        
        // Scegli pad in base al brightness
        const selectedPad = brightness > 0.5 ? wavePad : warmPad;
        
        let isBuildUp = currentGroove.includes("build") || currentGroove.includes("riser");
        let isDrop = currentGroove === "anthem_drop" || currentGroove === "full_power" || currentGroove === "big_room";

        for (let s of pattern) {
            const absoluteTime = measureStartTime + s * stepTime;
            
            // KICK (sempre sul pattern)
            Tone.Transport.schedule(t => {
                percussion?.player("bassDrum")?.start(t);
                if (score) score.addNote("Drums", "Kick", section.name);
            }, absoluteTime);
            
            // SNARE/CLAP (sul 2 e 4, ma solo se non è intro/build)
            if (!isIntro && !isBuildUp && (s === 4 || s === 12 || (pattern.length > 8 && s % 4 === 1))) {
                Tone.Transport.schedule(t => {
                    percussion?.player("handClap")?.start(t);
                    if (score) score.addNote("Drums", "Snare", section.name);
                }, absoluteTime);
            }
            
            // HI-HAT (pattern denso in drop/chorus)
            if (isDrop || isChorus || s % 2 === 0) {
                Tone.Transport.schedule(t => {
                    percussion?.player("closedHat")?.start(t);
                    if (score) score.addNote("Drums", "HiHat", section.name);
                }, absoluteTime);
            }
            
            // BASSLINE (sul primo beat o su pattern specifico)
            if (s === 0 || (isDrop && s % 4 === 0) || (energy > 0.7 && s % 2 === 0)) {
                Tone.Transport.schedule(t => {
                    if (bassNote) {
                        bass.triggerAttackRelease(bassNote, "8n", t);
                        if (score) score.addNote("Bass", bassNote, section.name);
                    }
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
        
        // PAD (accordi lunghi, una volta per misura)
        Tone.Transport.schedule(t => {
            if (selectedPad) {
                selectedPad.triggerAttackRelease([padRoot, padThird, padFifth], measureDur * 0.9, t);
                if (score) {
                    score.addNote("Pad", padRoot, section.name);
                    score.addNote("Pad", padThird, section.name);
                    score.addNote("Pad", padFifth, section.name);
                }
            }
        }, measureStartTime);
    }
}