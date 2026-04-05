// metalRhythmEngine.js — ver. 003 (NO-GAP CORE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 003 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name === "chorus";
    const grooveType = isChorus ? "double_kick" : (rand() > 0.5 ? "gallop" : "straight");

    // Definiamo la durata di un 16esimo
    const stepTime = measureDur / 16;

    for (let m = 0; m < section.measures; m++) {
        // Tempo di inizio della misura corrente
        const measureStartTime = section.startTime + (m * measureDur);
        
        // Scegliamo la nota dalla progressione (loop se la sezione è più lunga della progressione)
        const root = progression[m % progression.length];

        for (let s = 0; s < 16; s++) {
            const timeOffset = s * stepTime;
            const absoluteTime = measureStartTime + timeOffset;

            const isEighth = s % 2 === 0;

            // Logica Ritmica (immutata per mantenere il "Muro")
            let playGuitar = false;
            let inst = guitarPalm;
            
            if (isChorus) {
                if (isEighth) { playGuitar = true; inst = guitarOpen; }
            } else {
                if (grooveType === "gallop") {
                    if (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) playGuitar = true;
                } else if (isEighth) {
                    playGuitar = true;
                }
            }

            // SCHEDULING REALE (Stile Piano)
            if (playGuitar) {
                const note = normalizeNote(root, inst === guitarPalm ? "guitarPalm" : "guitarOpen");
                Tone.Transport.schedule((time) => {
                    inst.triggerAttackRelease(note + "2", "16n", time);
                }, absoluteTime);
            }

            if (isChorus || playGuitar) {
                Tone.Transport.schedule((time) => {
                    drums.player("kick").start(time);
                    const bNote = normalizeNote(root, "bass");
                    bass.triggerAttackRelease(bNote + "1", "16n", time);
                }, absoluteTime);
            }

            if (s === 4 || s === 12) {
                Tone.Transport.schedule((time) => {
                    drums.player("snare").start(time);
                }, absoluteTime);
            }

            if (isEighth) {
                const cymbal = isChorus ? "ride" : "hihat";
                Tone.Transport.schedule((time) => {
                    drums.player(cymbal).start(time);
                }, absoluteTime);
            }
        }
    }
}
