// metalRhythmEngine.js — ver. 007 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 007.2 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    
    // Groove unico basato sul DNA
    const sectionGroove = (rand() > 0.5) ? "gallop" : "straight";

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        
        const isLastMeasure = (m === section.measures - 1);
        const isHalfway = (m === Math.floor(section.measures / 2) - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;
            const isDownbeat = s === 0;

            let currentRoot = root;
            let isLeadIn = isLastMeasure && s >= 12;

            // SCALA DI CONGIUNZIONE (Chromatical walk-up/down)
            if (isLeadIn && nextSectionRoot && nextSectionRoot !== root) {
                const rootMidi = Tone.Frequency(root + "2").toMidi();
                const nextMidi = Tone.Frequency(nextSectionRoot + "2").toMidi();
                const stepsFromEnd = 16 - s;
                const diff = nextMidi > rootMidi ? 1 : -1;
                currentRoot = Tone.Frequency(nextMidi - (stepsFromEnd * diff), "midi").toNote();
            }

            // --- 1. STRUMENTI A CORDA ---
            let playGuitar = false;
            let inst = isChorus ? guitarOpen : guitarPalm;
            let dur = "16n";

            if (isIntro && m < section.measures / 2) {
                // INTRO 1: Accordi aperti potenti ogni 2 battiti
                if (s % 8 === 0) { playGuitar = true; inst = guitarOpen; dur = "1n"; }
            } else if (isChorus) {
                // CHORUS: Accordi aperti ogni quarto
                if (s % 4 === 0) { playGuitar = true; inst = guitarOpen; dur = "2n"; }
            } else {
                // VERSE / SOLO / INTRO 2: Gallop o Straight
                if (isLeadIn) { playGuitar = true; inst = guitarPalm; dur = "32n"; }
                else {
                    playGuitar = sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth;
                }
            }

            if (playGuitar) {
                const gNote = normalizeNote(currentRoot, inst === guitarOpen ? "guitarOpen" : "guitarPalm");
                const bNote = normalizeNote(currentRoot, "bass");
                Tone.Transport.schedule(t => {
                    inst.triggerAttackRelease(gNote + "2", dur, t);
                    bass.triggerAttackRelease(bNote + "1", "16n", t);
                }, absoluteTime);
            }

            // --- 2. BATTERIA ---
            Tone.Transport.schedule((time) => {
                // Intro virtuosistico (snare raddoppiato)
                if (isIntro && m < section.measures / 2) {
                    if (s === 0) drums.player("crash1").start(time);
                    if (s % 6 === 0) drums.player("snare").start(time);
                    if (isEighth) drums.player("hihat").start(time);
                    return;
                }

                // Accento Cambio Sezione
                if (isDownbeat && (m === 0 || isHalfway)) drums.player("crash2").start(time);

                // Cassa e Rullante
                const kickHit = (isChorus || isLeadIn) ? isEighth : (sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth);
                if (kickHit) drums.player("kick").start(time);
                
                if (s === 4 || s === 12 || (isLeadIn && s % 2 === 0)) drums.player("snare").start(time);

                // Piatti e Tom
                if (isEighth) drums.player(isChorus ? "ride" : "hihat").start(time);
                if ((isLastMeasure || isHalfway) && s >= 12) {
                    drums.player("tom" + (s - 11)).start(time);
                }
            }, absoluteTime);
        }
    }
}
