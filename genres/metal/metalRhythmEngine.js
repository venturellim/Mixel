// metalRhythmEngine.js — ver. 001 (STRATOVARIUS CORE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";;

console.log("metalRhythmEngine.js ver. 001 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const bpm = params.bpm;
    const secondsPerBeat = 60 / bpm;

    const isChorus = section.name === "chorus";
    // Determiniamo il groove una volta per sezione
    const grooveType = isChorus ? "double_kick" : (rand() > 0.5 ? "gallop" : "straight");

    progression.forEach((rootDegree, measureIdx) => {
        const measureStart = section.startTime + (measureIdx * 4 * secondsPerBeat);
        
        // rootDegree è la nota base (es. "A", "G", "F")
        const root = rootDegree; 

        for (let step = 0; step < 16; step++) {
            const time = measureStart + (step * 0.25 * secondsPerBeat);
            const isDownbeat = step % 4 === 0;
            const isEighth = step % 2 === 0;

            // --- 1. CHITARRA RITMICA ---
            let playGuitar = false;
            let inst = guitarPalm;
            
            if (isChorus) {
                if (isEighth) { playGuitar = true; inst = guitarOpen; }
            } else {
                if (grooveType === "gallop") {
                    if (step % 4 === 0 || step % 4 === 2 || step % 4 === 3) playGuitar = true;
                } else {
                    if (isEighth) playGuitar = true;
                }
            }

            if (playGuitar) {
                const note = normalizeNote(root, inst === guitarPalm ? "guitarPalm" : "guitarOpen");
                inst.triggerAttackRelease(note + "2", "16n", time);
            }

            // --- 2. BATTERIA ---
            // Cassa
            if (isChorus) {
                drums.player("kick").start(time); 
            } else if (playGuitar) {
                drums.player("kick").start(time); 
            }

            // Rullante sul 2 e sul 4
            if (step === 4 || step === 12) {
                drums.player("snare").start(time);
            }

            // Piatti
            if (isEighth) {
                const cymbal = isChorus ? "ride" : "hihat";
                drums.player(cymbal).start(time);
            }

            // --- 3. BASSO ---
            if (isChorus || playGuitar) {
                const bassNote = normalizeNote(root, "bass");
                bass.triggerAttackRelease(bassNote + "1", "16n", time);
            }
        }
    });
}
