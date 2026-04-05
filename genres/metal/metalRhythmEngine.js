// metalRhythmEngine.js — ver. 007 (SUSTAINED & FULL LOGIC)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 007 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isIntro = section.name.toLowerCase().includes("intro");
    const stepTime = measureDur / 16;
    const sectionGroove = rand() > 0.5 ? "gallop" : "straight";

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isLastMeasure = (m === section.measures - 1);
        const isHalfway = (m === Math.floor(section.measures / 2) - 1);
        const isTransition = isLastMeasure || isHalfway;

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isEighth = s % 2 === 0;
            
            // --- LOGICA DI CONGIUNZIONE (Ultimi 4 step della sezione) ---
            let currentRoot = root;
            let isLeadIn = isLastMeasure && s >= 12 && nextSectionRoot;

            if (isLeadIn) {
                // Se la nota successiva è lontana, creiamo una rampa
                const rootMidi = Tone.Frequency(root + "2").toMidi();
                const nextMidi = Tone.Frequency(nextSectionRoot + "2").toMidi();
                if (Math.abs(rootMidi - nextMidi) > 2) {
                    // Scala cromatica di avvicinamento
                    const diff = nextMidi > rootMidi ? 1 : -1;
                    const stepsFromEnd = 16 - s;
                    currentRoot = Tone.Frequency(nextMidi - (stepsFromEnd * diff), "midi").toNote();
                }
            }

            // --- 1. CHITARRA & BASSO ---
            if (!(isIntro && m < section.measures/2)) {
                let playGuitar = false;
                let inst = isChorus ? guitarOpen : guitarPalm;
                
                // Se siamo nel lead-in finale, colpi serrati su ogni step per caricare
                if (isLeadIn) {
                    playGuitar = true;
                    inst = guitarPalm; 
                } else if (isChorus) {
                    if (s % 4 === 0) playGuitar = true;
                } else {
                    const hit = sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth;
                    if (hit) playGuitar = true;
                }

                if (playGuitar) {
                    const note = normalizeNote(currentRoot, isChorus && !isLeadIn ? "guitarOpen" : "guitarPalm");
                    Tone.Transport.schedule(t => {
                        inst.triggerAttackRelease(note + "2", isLeadIn ? "32n" : (isChorus ? "2n" : "16n"), t);
                        bass.triggerAttackRelease(normalizeNote(currentRoot, "bass") + "1", "16n", t);
                    }, absoluteTime);
                }
            }

            // --- 2. BATTERIA (SENZA BUCHI) ---
            Tone.Transport.schedule((time) => {
                // Accento d'inizio
                if (s === 0 && (m === 0 || isHalfway)) drums.player("crash2").start(time);

                // Ritmo Base (sempre attivo anche durante i fill!)
                const kickHit = isChorus ? isEighth : (sectionGroove === "gallop" ? (s % 4 === 0 || s % 4 === 2 || s % 4 === 3) : isEighth);
                if (kickHit || isLeadIn) drums.player("kick").start(time);

                // Snare standard + raddoppio nei fill
                if (s === 4 || s === 12 || (isTransition && s > 12)) {
                    drums.player("snare").start(time);
                }

                // Piatti (Ride nel chorus, HiHat nel verse)
                if (isEighth) drums.player(isChorus ? "ride" : "hihat").start(time);

                // Tom Fill (si sovrappone, non sostituisce)
                if (isTransition && s >= 12) {
                    drums.player("tom" + (s - 11)).start(time);
                }
            }, absoluteTime);
        }
    }
}
