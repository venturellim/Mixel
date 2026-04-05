// metalRhythmEngine.js — ver. 005 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 005 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        
        const isSecondHalf = m >= (section.measures / 2);
        const isTransitionMeasure = (m === Math.floor(section.measures / 2) - 1) || (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;
            const isDownbeat = s === 0;

            // --- 1. LOGICA CHITARRE (FIX SUSTAIN) ---
            if (isIntro && !isSecondHalf) {
                if (m % 2 === 0 && s === 0) {
                    const note = normalizeNote(root, "guitarOpen");
                    Tone.Transport.schedule(t => guitarOpen.triggerAttackRelease(note + "2", "1n", t), absoluteTime);
                }
            } else if (isChorus) {
                // Ogni quarto (s=0, 4, 8, 12) per lasciar vibrare il campione
                if (s % 4 === 0) {
                    const note = normalizeNote(root, "guitarOpen");
                    Tone.Transport.schedule(t => guitarOpen.triggerAttackRelease(note + "2", "2n", t), absoluteTime);
                }
            } else {
                // Verse: Gallop serrato
                if (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) {
                    const note = normalizeNote(root, "guitarPalm");
                    Tone.Transport.schedule(t => guitarPalm.triggerAttackRelease(note + "2", "16n", t), absoluteTime);
                }
            }

            // --- 2. LOGICA BASSO (Sempre a martello per il muro di suono) ---
            if (!isIntro || isSecondHalf) {
                const bassHit = isChorus ? isEighth : (s % 4 === 0 || s % 4 === 2 || s % 4 === 3);
                if (bassHit) {
                    const bNote = normalizeNote(root, "bass");
                    Tone.Transport.schedule(t => bass.triggerAttackRelease(bNote + "1", "16n", t), absoluteTime);
                }
            }

            // --- 3. BATTERIA (Virtuosismi, Fill e Ritmo) ---
            Tone.Transport.schedule((time) => {
                
                // A) Gestione INTRO (Virtuosismo prima metà)
                if (isIntro && !isSecondHalf) {
                    if (s === 0) drums.player("crash1").start(time);
                    if (s % 6 === 0) drums.player("snare").start(time);
                    if (isEighth) drums.player("hihat").start(time);
                    return; 
                }

                // B) ACCENTO DI INIZIO (Crash)
                if (isDownbeat && (isChorus || isTransitionMeasure)) {
                    drums.player("crash2").start(time);
                }

                // C) FILL DI TRANSIZIONE (Giro di Tom)
                if (isTransitionMeasure && s >= 12) {
                    const tomIdx = (s - 12) + 1;
                    drums.player("tom" + tomIdx).start(time);
                }

                // D) RITMO STANDARD
                const kickHit = isChorus ? isEighth : (s % 4 === 0 || s % 4 === 2 || s % 4 === 3);
                if (kickHit) drums.player("kick").start(time);

                if (s === 4 || s === 12) drums.player("snare").start(time);

                if (isEighth) {
                    drums.player(isChorus ? "ride" : "hihat").start(time);
                }

            }, absoluteTime);
        }
    }
}
