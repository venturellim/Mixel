
// metalRhythmEngine.js — ver. 012
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 012.2 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    const energy = params.imageParams.energy;
    
    // SELEZIONE GROOVE
    const dice = rand();
    let grooveType = "straight";
    if (isIntro) grooveType = dice < 0.7 ? "stratovarius" : "straight";
    else if (isChorus) grooveType = energy > 0.6 ? "doubleKick" : "straight";
    else grooveType = dice < 0.4 ? "gallop" : "straight";

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, inst = guitarPalm, sustain = false;

            // MASCHERE RITMICHE
            switch (grooveType) {
                case "stratovarius":
                    if (s === 0 || s === 2) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; snare = true; sustain = true; }
                    if (s === 12) snare = true;
                    break;
                case "gallop":
                    if (s % 4 !== 1) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "doubleKick":
                    kick = true;
                    if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                default:
                    if (s % 2 === 0) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
            }

            // ESECUZIONE STRUMENTI
            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(currentRoot, "bass") + "1";
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote, sustain ? "2n" : "16n", t);
                    bass.triggerAttackRelease(bNote, sustain ? "2n" : "16n", t);
                }, absoluteTime);
            }

            // ESECUZIONE BATTERIA (Fix critico anti-crash)
            Tone.Transport.schedule(time => {
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                // USIAMO ._player.start() per bypassare il wrapper di log sull'hihat/ride
                if (s % 2 === 0) {
                    const cymName = isChorus ? "ride" : "hihat";
                    try {
                        const cym = drums.player(cymName);
                        // Bypasso il log se possibile o silenziatore di errori
                        cym.volume.value = -15;
                        cym.start(time);
                    } catch(e) {} 
                }
            }, absoluteTime);
        }
    }
}
