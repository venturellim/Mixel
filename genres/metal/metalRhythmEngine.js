
// metalRhythmEngine.js — ver. 012
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 012.4 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params.imageParams;

    // Funzione interna per scegliere il groove (riutilizzabile per le semi-sezioni)
    const pickGroove = (isChorusPart, isIntroPart) => {
        const dice = rand();
        if (isIntroPart) {
            if (complexity > 0.6) return "stratovarius";
            if (brightness > 0.6) return "helloween";
            return "straight";
        }
        if (isChorusPart) {
            if (energy > 0.8) return "chorus_sustain_hit";
            if (energy > 0.4) return "chorus_pure_sustain";
            return "helloween";
        }
        // Verse/Solo
        if (dice < 0.25) return "gallop";
        if (dice < 0.50) return "thrash_diamond";
        if (dice < 0.75) return "blind_guardian";
        return "straight";
    };

    let currentGroove = pickGroove(isChorus, isIntro);

    for (let m = 0; m < section.measures; m++) {
        // --- LOGICA SEMI-SEZIONI (60% Probabilità di cambio) ---
        if (m === Math.floor(section.measures / 2) && rand() < 0.6) {
            currentGroove = pickGroove(isChorus, isIntro);
        }

        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const isLastMeasureOfSection = (m === section.measures - 1);
        const isLastMeasureOfHalf = (m === Math.floor(section.measures / 2) - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, inst = guitarPalm, sustain = false;

            // --- LIBRERIA MASCHERE ---
            switch (currentGroove) {
                case "stratovarius":
                    if (s === 0 || s === 2) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; snare = true; sustain = true; }
                    if (s === 12) snare = true;
                    break;
                case "gallop":
                    if (s % 4 !== 1) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "thrash_diamond": // M-M-O-M
                    if ([0, 2, 6].includes(s)) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; sustain = true; snare = true; }
                    if (s === 12) snare = true;
                    break;
                case "blind_guardian":
                    if ([0, 3, 6, 8, 11].includes(s)) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 14) { playGuitar = true; inst = guitarOpen; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "helloween":
                    kick = true;
                    if (s % 4 === 0) { playGuitar = true; inst = guitarOpen; sustain = true; }
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "chorus_pure_sustain":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 8) kick = true;
                    if (s === 4 || s === 12) snare = true;
                    break;
                case "chorus_sustain_hit":
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    if (s === 14) { playGuitar = true; inst = guitarOpen; kick = true; }
                    if (s === 8) kick = true;
                    if (s === 4 || s === 12) snare = true;
                    break;
                default: // Straight
                    if (s % 2 === 0) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
            }

            // --- LOGICA FILL (Fine sezione o fine semi-sezione) ---
            const isFillTime = (isLastMeasureOfSection || isLastMeasureOfHalf) && s >= 12;
            if (isFillTime) {
                kick = true;
                snare = (s % 2 === 0); // Rullata veloce
                playGuitar = true;
                inst = guitarPalm;
                sustain = false;
            }

            // --- ESECUZIONE ---
            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(currentRoot, "bass") + "1";
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote, sustain ? "1n" : "16n", t);
                    bass.triggerAttackRelease(bNote, sustain ? "1n" : "16n", t);
                }, absoluteTime);
            }

            Tone.Transport.schedule(time => {
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                // Piatti Safe
                if (s % 2 === 0) {
                    try {
                        const cym = drums.player((isChorus || energy > 0.7) ? "ride" : "hihat");
                        cym.volume.value = -15;
                        cym.start(time);
                    } catch(e) {}
                }

                // Fill Tom
                if (isFillTime && s % 2 !== 0) {
                    try { drums.player("tom" + (s === 13 ? "1" : "3")).start(time); } catch(e) {}
                }
                
                // Crash all'inizio di ogni cambio
                if (s === 0 && (m === 0 || m === Math.floor(section.measures/2))) {
                    try { drums.player("crash1").start(time); } catch(e) {}
                }
            }, absoluteTime);
        }
    }
}
