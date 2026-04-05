// metalRhythmEngine.js — ver. 002 (NO-GAP CORE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 002 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, startBeat) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name === "chorus";
    const grooveType = isChorus ? "double_kick" : (rand() > 0.5 ? "gallop" : "straight");

    progression.forEach((root, measureIdx) => {
        // Ogni misura inizia a (startBeat + misura * 4) quarti
        const measureStartBeat = startBeat + (measureIdx * 4);
        
        for (let step = 0; step < 16; step++) {
            // Ogni step è 1/4 di un quarto (un 16esimo)
            const exactBeat = measureStartBeat + (step * 0.25);
            
            // Convertiamo i Beat in tempo musicale leggibile da Tone.Transport
            const time = Tone.Time(exactBeat, "n").toSeconds();

            const isEighth = step % 2 === 0;

            // --- CHITARRA ---
            let playGuitar = false;
            let instName = "guitarPalm";
            
            if (isChorus) {
                if (isEighth) { playGuitar = true; instName = "guitarOpen"; }
            } else {
                if (grooveType === "gallop") {
                    if (step % 4 === 0 || step % 4 === 2 || step % 4 === 3) playGuitar = true;
                } else if (isEighth) {
                    playGuitar = true;
                }
            }

            if (playGuitar) {
                const note = normalizeNote(root, instName);
                instruments[instName].triggerAttackRelease(note + "2", "16n", time);
            }

            // --- BATTERIA & BASSO (Sempre a tempo di beat) ---
            if (isChorus || playGuitar) {
                drums.player("kick").start(time);
                const bNote = normalizeNote(root, "bass");
                bass.triggerAttackRelease(bNote + "1", "16n", time);
            }

            if (step === 4 || step === 12) drums.player("snare").start(time);
            if (isEighth) drums.player(isChorus ? "ride" : "hihat").start(time);
        }
    });
}
