// metalRhythmEngine.js — ver. 007 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 007.1 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    const sectionGroove = rand() > 0.5 ? "gallop" : "straight";

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        
        // FIX: Assicuriamoci di avere una nota valida dalla progressione
        const root = progression[m % progression.length] || params.tonalCenter[0] || "E";
        
        const isSecondHalf = m >= (section.measures / 2);
        const isLastMeasure = (m === section.measures - 1);
        const isHalfway = (m === Math.floor(section.measures / 2) - 1);
        const isTransition = isLastMeasure || isHalfway;

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;
            
            let currentRoot = root;
            let isLeadIn = isLastMeasure && s >= 12;

            // LOGICA DI CONGIUNZIONE
            if (isLeadIn && nextSectionRoot) {
                const rootMidi = Tone.Frequency(root + "2").toMidi();
                const nextMidi = Tone.Frequency(nextSectionRoot + "2").toMidi();
                if (Math.abs(rootMidi - nextMidi) > 2) {
                    const diff = nextMidi > rootMidi ? 1 : -1;
                    const stepsFromEnd = 16 - s;
                    currentRoot = Tone.Frequency(nextMidi - (stepsFromEnd * diff), "midi").toNote();
                }
            }

            // --- 1. CHITARRA & BASSO (FIX INTRO) ---
            let playGuitar = false;
            let inst = isChorus ? guitarOpen : guitarPalm;
            let dur = "16n";

            if (isIntro && !isSecondHalf) {
                // INTRO ORA SUONA: Accordi aperti ogni 2 quarti per dare maestosità
                if (s % 8 === 0) {
                    playGuitar = true;
                    inst = guitarOpen;
                    dur = "2n";
                }
            } else if (isChorus) {
                if (s % 4 === 0) { playGuitar = true; inst = guitarOpen; dur = "2n"; }
            } else {
                if (isLeadIn) { playGuitar = true; inst = guitarPalm; dur = "32n"; }
                else {
                    const hit = sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth;
                    if (hit) playGuitar = true;
                }
            }

            if (playGuitar) {
                // Usiamo la nota corrente (che cambia durante la scala di congiunzione)
                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm");
                const bNote = normalizeNote(currentRoot, "bass");
                
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote + "2", dur, t);
                    bass.triggerAttackRelease(bNote + "1", "16n", t);
                }, absoluteTime);
            }

            // --- 2. BATTERIA (INVARIATA, FUNZIONANTE) ---
            Tone.Transport.schedule((time) => {
                if (isIntro && !isSecondHalf) {
                    if (s === 0) drums.player("crash1").start(time);
                    if (s % 6 === 0) drums.player("snare").start(time);
                    if (isEighth) drums.player("hihat").start(time);
                    return;
                }
                if (s === 0 && (m === 0 || isHalfway)) drums.player("crash2").start(time);
                const kickHit = isChorus ? isEighth : (sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth);
                if (kickHit || isLeadIn) drums.player("kick").start(time);
                if (s === 4 || s === 12 || (isTransition && s > 12)) drums.player("snare").start(time);
                if (isEighth) drums.player(isChorus ? "ride" : "hihat").start(time);
                if (isTransition && s >= 12) drums.player("tom" + (s - 11)).start(time);
            }, absoluteTime);
        }
    }
}
