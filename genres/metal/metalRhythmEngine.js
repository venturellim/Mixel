// metalRhythmEngine.js — ver. 002 (NO-GAP CORE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 002.1 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, startBeat) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const bpm = params.bpm;
    const secondsPerBeat = 60 / bpm; // Durata di un quarto in secondi

    const isChorus = section.name === "chorus";
    const grooveType = isChorus ? "double_kick" : (rand() > 0.5 ? "gallop" : "straight");

    progression.forEach((root, measureIdx) => {
        const measureStartBeat = startBeat + (measureIdx * 4);
        
        for (let step = 0; step < 16; step++) {
            // Calcolo manuale del tempo in secondi dallo zero del Transport
            // (BeatCorrente * secondiPerBeat)
            const time = (measureStartBeat + (step * 0.25)) * secondsPerBeat;

            if (isNaN(time)) return; // Sicurezza extra

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

            // --- BATTERIA & BASSO ---
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
