
// metalRhythmEngine.js — ver. 012
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 012.1 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    const energy = params.imageParams.energy;
    
    // --- 1. SELEZIONE PATTERN BASATA SUL DNA ---
    // Usiamo il DNA per scegliere uno stile per l'intera sezione
    const dice = rand();
    let grooveType = "straight";

    if (isIntro) {
        grooveType = dice < 0.6 ? "stratovarius" : "epicHold";
    } else if (isChorus) {
        grooveType = energy > 0.6 ? "doubleKick" : "straight";
    } else { // Verse / Solo
        if (dice < 0.4) grooveType = "gallop";
        else if (dice < 0.7) grooveType = "straight";
        else grooveType = "stratovarius"; // Sì, funziona bene anche nei Verse!
    }

    console.log(`[ENGINE] Section: ${section.name} | Groove: ${grooveType}`);

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, inst = guitarPalm, sustain = false;

            // --- 2. LOGICA DEI PATTERN (MASCHERE) ---
            switch (grooveType) {
                case "stratovarius": // Mute-Mute-Open
                    if (s === 0 || s === 2) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; snare = true; sustain = true; }
                    if (s === 12) { snare = true; } // Rullante di chiusura
                    break;

                case "gallop": // 1 - & a 2 - & a (Saltiamo il secondo sedicesimo)
                    if (s % 4 !== 1) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) { snare = true; }
                    break;

                case "doubleKick": // Cassa a tappeto, chitarra aperta
                    kick = true;
                    if (s === 0 || s === 8) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 4 || s === 12) { snare = true; }
                    break;

                default: // Straight (classico metal anni '80)
                    if (s % 2 === 0) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) { snare = true; }
                    break;
            }

            // --- 3. ESECUZIONE CHITARRA/BASSO ---
            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(currentRoot, "bass") + "1";
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote, sustain ? "2n" : "16n", t);
                    bass.triggerAttackRelease(bNote, sustain ? "2n" : "16n", t);
                }, absoluteTime);
            }

            // --- 4. ESECUZIONE BATTERIA ---
            Tone.Transport.schedule(time => {
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                if (s % 2 === 0) {
                    const cym = isChorus ? "ride" : "hihat";
                    drums.player(cym).start(time, 0, {volume: -12});
                }
            }, absoluteTime);
        }
    }
}
