// metalRhythmEngine.js — ver. 006 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 006 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;

    // Groove fissato dal DNA per questa sezione
    const sectionGroove = rand() > 0.5 ? "gallop" : "straight";

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        
        const isSecondHalf = m >= (section.measures / 2);
        // Misura di transizione (l'ultima prima del cambio)
        const isTransitionMeasure = (m === Math.floor(section.measures / 2) - 1) || (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;

            // --- 1. CHITARRA & BASSO ---
            if (isIntro && !isSecondHalf) {
                if (m % 2 === 0 && s === 0) {
                    const note = normalizeNote(root, "guitarOpen");
                    Tone.Transport.schedule(t => guitarOpen.triggerAttackRelease(note + "2", "1n", t), absoluteTime);
                    Tone.Transport.schedule(t => bass.triggerAttackRelease(normalizeNote(root, "bass") + "1", "1n", t), absoluteTime);
                }
            } else {
                let playGuitar = false;
                if (isChorus) {
                    if (s % 4 === 0) playGuitar = true;
                } else {
                    const hit = sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : (isEighth);
                    if (hit) playGuitar = true;
                }

                if (playGuitar) {
                    const inst = isChorus ? guitarOpen : guitarPalm;
                    const dur = isChorus ? "2n" : "16n";
                    const note = normalizeNote(root, isChorus ? "guitarOpen" : "guitarPalm");
                    Tone.Transport.schedule(t => inst.triggerAttackRelease(note + "2", dur, t), absoluteTime);
                    Tone.Transport.schedule(t => bass.triggerAttackRelease(normalizeNote(root, "bass") + "1", "16n", t), absoluteTime);
                }
            }

            // --- 2. BATTERIA (Con Transizioni) ---
            Tone.Transport.schedule((time) => {
                if (isIntro && !isSecondHalf) {
                    if (s === 0) drums.player("crash1").start(time);
                    if (s % 6 === 0) drums.player("snare").start(time);
                    if (isEighth) drums.player("hihat").start(time);
                    return;
                }

                // Accento d'inizio sezione o semi-sezione
                if (s === 0 && (m === 0 || m === Math.floor(section.measures / 2))) {
                    drums.player("crash2").start(time);
                }

                // LOGICA TRANSIZIONE: Se è l'ultima misura, carica i Tom
                if (isTransitionMeasure && s >= 12) {
                    drums.player("tom" + (s - 11)).start(time);
                } else {
                    // Ritmo Standard
                    const kickHit = isChorus ? isEighth : (sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth);
                    if (kickHit) drums.player("kick").start(time);
                    if (s === 4 || s === 12) drums.player("snare").start(time);
                    if (isEighth) drums.player(isChorus ? "ride" : "hihat").start(time);
                }
            }, absoluteTime);
        }
    }
}
