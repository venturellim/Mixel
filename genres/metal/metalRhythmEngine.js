
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

    const pickGroove = (isChorusPart, isIntroPart) => {
        const dice = rand();
        if (isIntroPart) {
            if (dice < 0.3) return "stratovarius";
            if (dice < 0.5) return "intro_ambient"; // Novità: Atmosferica
            if (dice < 0.7) return "intro_heavy_strikes"; // Novità: Colpi dritti
            if (brightness > 0.6) return "helloween";
            return "straight";
        }
        if (isChorusPart) {
            if (energy > 0.8) return "chorus_sustain_hit";
            if (energy > 0.4) return "chorus_pure_sustain";
            return "helloween";
        }
        if (dice < 0.25) return "gallop";
        if (dice < 0.50) return "thrash_diamond";
        if (dice < 0.75) return "blind_guardian";
        return "straight";
    };

    let currentGroove = pickGroove(isChorus, isIntro);

    for (let m = 0; m < section.measures; m++) {
        if (m === Math.floor(section.measures / 2) && rand() < 0.6) {
            currentGroove = pickGroove(isChorus, isIntro);
        }

        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];
        const nextRoot = progression[(m + 1) % progression.length] || nextSectionRoot;
        const isLastMeasureOfPart = (m === section.measures - 1 || m === Math.floor(section.measures / 2) - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            let kick = false, snare = false, playGuitar = false, inst = guitarPalm, sustain = false, customNote = null;

            // --- LIBRERIA MASCHERE ---
            switch (currentGroove) {
                case "intro_ambient": // Solo rintocchi e piatti
                    if (s === 0) { playGuitar = true; inst = guitarOpen; sustain = true; kick = true; }
                    break;
                case "intro_heavy_strikes": // Colpi brutali all'unisono
                    if ([0, 4, 8, 12].includes(s)) { playGuitar = true; inst = guitarOpen; kick = true; snare = (s===4||s===12); }
                    break;
                case "stratovarius":
                    if (s === 0 || s === 2) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; snare = true; sustain = true; }
                    if (s === 12) snare = true;
                    break;
                case "thrash_diamond":
                    if ([0, 2, 6].includes(s)) { playGuitar = true; inst = guitarPalm; kick = true; }
                    if (s === 4) { playGuitar = true; inst = guitarOpen; sustain = true; snare = true; }
                    if (s === 12) snare = true;
                    break;
                case "gallop":
                    if (s % 4 !== 1) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
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
                    if (s === 4 || s === 12) snare = true;
                    break;
                default:
                    if (s % 2 === 0) { playGuitar = true; inst = guitarPalm; kick = (s % 4 === 0); }
                    if (s === 4 || s === 12) snare = true;
                    break;
            }

            // --- LOGICA FILL: SCALA ASCENDENTE/DISCENDENTE ---
            const isFillZone = isLastMeasureOfPart && s >= 12;
            if (isFillZone && complexity > 0.4) {
                playGuitar = true; inst = guitarPalm; sustain = false;
                kick = true; snare = (s % 2 === 0);
                
                // Calcolo della scala verso la prossima nota
                const currMidi = Tone.Frequency(currentRoot + "2").toMidi();
                const nextMidi = Tone.Frequency((nextRoot || currentRoot) + "2").toMidi();
                const diff = nextMidi - currMidi;
                const stepScale = Math.round((diff / 4) * (s - 11)); // Divide la distanza in 4 step
                customNote = Tone.Frequency(currMidi + stepScale, "midi").toNote();
            }

            // --- ESECUZIONE ---
            if (playGuitar) {
                const rootToUse = customNote || currentRoot;
                const gNote = normalizeNote(rootToUse, inst === guitarOpen ? "guitarOpen" : "guitarPalm") + "2";
                const bNote = normalizeNote(rootToUse, "bass") + "1";
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote, sustain ? "1n" : "16n", t);
                    bass.triggerAttackRelease(bNote, sustain ? "1n" : "16n", t);
                }, absoluteTime);
            }

            Tone.Transport.schedule(time => {
                if (kick) drums.player("kick").start(time);
                if (snare) drums.player("snare").start(time);
                
                // Piatti (si fermano durante il fill per enfasi)
                if (s % 2 === 0 && !isFillZone) {
                    try {
                        const cym = drums.player((isChorus || energy > 0.7) ? "ride" : "hihat");
                        cym.volume.value = -15;
                        cym.start(time);
                    } catch(e) {}
                }

                if (isFillZone) {
                    try { drums.player("tom" + (s-11)).start(time); } catch(e) {}
                }
                
                if (s === 0 && (m === 0 || (m === Math.floor(section.measures/2) && !isIntro))) {
                    try { drums.player("crash1").start(time); } catch(e) {}
                }
            }, absoluteTime);
        }
    }
}
