// metalRhythmEngine.js — ver. 004 (NO-GAP CORE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 004 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.includes("chorus");
    const isIntro = section.name === "intro";
    const stepTime = measureDur / 16;

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        
        // Identifichiamo se siamo nella prima o seconda metà della sezione
        const isSecondHalf = m >= (section.measures / 2);
        // Misura di transizione: l'ultima della prima metà o l'ultima della sezione
        const isTransitionMeasure = (m === Math.floor(section.measures / 2) - 1) || (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;

            // 1. CHITARRA E BASSO
            if (isIntro && !isSecondHalf) {
                // Intro 1a metà: Solo un colpo d'impatto all'inizio di ogni cambio accordo
                if (m % 2 === 0 && s === 0) {
                    Tone.Transport.schedule(t => {
                        const note = normalizeNote(root, "guitarOpen");
                        guitarOpen.triggerAttackRelease(note + "2", "1n", t);
                        bass.triggerAttackRelease(normalizeNote(root, "bass") + "1", "1n", t);
                    }, absoluteTime);
                }
            } else {
                // Ritmo Standard
                let playGuitar = false;
                let inst = isChorus ? guitarOpen : guitarPalm;
                
                if (isChorus) {
                    if (isEighth) playGuitar = true;
                } else if (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) {
                    playGuitar = true; // Gallop
                }

                if (playGuitar) {
                    const note = normalizeNote(root, isChorus ? "guitarOpen" : "guitarPalm");
                    Tone.Transport.schedule(t => {
                        inst.triggerAttackRelease(note + "2", "16n", t);
                        bass.triggerAttackRelease(normalizeNote(root, "bass") + "1", "16n", t);
                    }, absoluteTime);
                }
            }

            // 2. BATTERIA (Virtuosismi e Fill)
            Tone.Transport.schedule((time) => {
                // INTRO 1a METÀ: Solo rullante e piatti (Virtuosismo)
                if (isIntro && !isSecondHalf) {
                    if (s % 6 === 0) drums.player("snare").start(time);
                    if (s === 0) drums.player(m % 2 === 0 ? "crash1" : "crash2").start(time);
                    if (s % 2 === 0) drums.player("hihat").start(time);
                    return;
                }

                // FILL DI TRANSIZIONE: Giro di Tom negli ultimi 4 sedicesimi della misura
                if (isTransitionMeasure && s >= 12) {
                    const tomIndex = (s - 12) + 1; // Tom1, Tom2, Tom3, Tom4
                    drums.player("tom" + tomIndex).start(time);
                    return;
                }

                // RITMO STANDARD
                if (isChorus || (s % 4 === 0 || s % 4 === 2 || s % 4 === 3)) {
                    drums.player("kick").start(time);
                }
                if (s === 4 || s === 12) drums.player("snare").start(time);
                if (isEighth) drums.player(isChorus ? "ride" : "hihat").start(time);
            }, absoluteTime);
        }
    }
}
