// metalRhythmEngine.js — ver. 005 (NO-GAP CORE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 005 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    
    // FIX: Usiamo includes per catturare "chorus", "chorus_final", ecc.
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
            const isDownbeat = s === 0; // Inizio misura

            // --- 1. LOGICA CHITARRE (FIX GUITAR OPEN) ---
            let playGuitar = false;
            let currentInst = isChorus ? guitarOpen : guitarPalm;
            let instName = isChorus ? "guitarOpen" : "guitarPalm";

            if (isIntro && !isSecondHalf) {
                // Solo accenti aperti nell'intro
                if (s === 0) {
                    const note = normalizeNote(root, "guitarOpen");
                    Tone.Transport.schedule(t => guitarOpen.triggerAttackRelease(note + "2", "1n", t), absoluteTime);
                }
            } else {
                // Gallop o Straight
                if (isChorus) {
                    if (isEighth) playGuitar = true;
                } else {
                    if (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) playGuitar = true;
                }

                if (playGuitar) {
                    const note = normalizeNote(root, instName);
                    Tone.Transport.schedule(t => currentInst.triggerAttackRelease(note + "2", "16n", t), absoluteTime);
                }
            }

            // --- 2. LOGICA BASSO (Sempre presente) ---
            if (!isIntro || isSecondHalf) {
                if (isChorus ? isEighth : (s % 4 === 0 || s % 4 === 2 || s % 4 === 3)) {
                    const bNote = normalizeNote(root, "bass");
                    Tone.Transport.schedule(t => bass.triggerAttackRelease(bNote + "1", "16n", t), absoluteTime);
                }
            }

            // --- 3. BATTERIA (FIX ACCENTI E FILL) ---
            Tone.Transport.schedule((time) => {
                
                // A) Gestione INTRO (Prima metà)
                if (isIntro && !isSecondHalf) {
                    if (s === 0) drums.player("crash1").start(time);
                    if (s % 6 === 0) drums.player("snare").start(time);
                    if (isEighth) drums.player("hihat").start(time);
                    return; // Qui il return ha senso perché è un'atmosfera diversa
                }

                // B) ACCENTO DI INIZIO SEZIONE/MISURA (Crash)
                if (isDownbeat && (isChorus || isTransitionMeasure)) {
                    drums.player("crash2").start(time);
                }

                // C) FILL DI TRANSIZIONE (Tom)
                // Rimosso il return: i tom suonano INSIEME alla cassa se necessario
                if (isTransitionMeasure && s >= 12) {
                    const tomIdx = (s - 12) + 1;
                    drums.player("tom" + tomIdx).start(time);
                }

                // D) RITMO STANDARD (Cassa, Rullante, Piatti)
                // Cassa: raddoppiata nel chorus (double kick)
                const kickHit = isChorus ? isEighth : (s % 4 === 0 || s % 4 === 2 || s % 4 === 3);
                if (kickHit) drums.player("kick").start(time);

                // Rullante: sempre sul 4 e 12 (backbeat)
                if (s === 4 || s === 12) drums.player("snare").start(time);

                // Piatti costanti
                if (isEighth) {
                    drums.player(isChorus ? "ride" : "hihat").start(time);
                }

            }, absoluteTime);
        }
    }
}
