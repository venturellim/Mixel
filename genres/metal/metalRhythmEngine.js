// metalRhythmEngine.js — ver. 016 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 016 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isIntro = section.name.toLowerCase().includes("intro");
    const isChorus = section.name.toLowerCase().includes("chorus");
    const stepTime = measureDur / 16;
    const energy = params.imageParams.energy;

    const RHYTHM_LIBRARY = {
        verse: [
            { kick: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], snare: [4, 12] },
            { kick: [0, 4, 8, 12], snare: [4, 12] }
        ],
        chorus: [{ kick: [0, 2, 4, 6, 8, 10, 12, 14], snare: [4, 12] }],
        intro: [{ kick: [0], snare: [12], type: "open" }]
    };

    const typePool = isIntro ? "intro" : (isChorus ? "chorus" : "verse");
    const sectionPattern = RHYTHM_LIBRARY[typePool][Math.floor(rand() * RHYTHM_LIBRARY[typePool].length)];

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isIntroFirstHalf = isIntro && (m < Math.floor(section.measures / 2));
        const isLastMeasure = (m === section.measures - 1);

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);

            // --- 1. PRE-CALCOLO FUORI DALLA CALLBACK ---
            // Decidiamo tutto QUI, non nel thread audio
            const kickHit = !isIntroFirstHalf && sectionPattern.kick.includes(s);
            const snareHit = !isIntroFirstHalf && sectionPattern.snare.includes(s);
            const cymbalType = isChorus ? "ride" : "hihat";
            const playCymbal = !isIntroFirstHalf && (s % 2 === 0);
            const playIntroHit = isIntroFirstHalf && (s === 0);

            // Chitarra e Basso
            let currentRoot = root;
            let playGuitar = kickHit;
            
            // Logica transizione (Spostata fuori)
            if (isLastMeasure && s >= 12 && nextSectionRoot && nextSectionRoot !== root) {
                const rootMidi = Tone.Frequency(root + "2").toMidi();
                const diff = Tone.Frequency(nextSectionRoot + "2").toMidi() > rootMidi ? 1 : -1;
                currentRoot = Tone.Frequency(rootMidi + (s === 12 ? diff : diff * 2), "midi").toNote();
                playGuitar = true;
            }

            const useOpen = (isIntro && sectionPattern.type === "open") || (isChorus && rand() > 0.3);
            const gNote = normalizeNote(currentRoot, useOpen ? "guitarOpen" : "guitarPalm") + "2";
            const bNote = normalizeNote(currentRoot, "bass") + "1";

            // --- 2. CALLBACK "STUPIDA" (Solo esecuzione) ---
            Tone.Transport.schedule(time => {
                // Batteria
                if (playIntroHit) {
                    drums.player("kick").start(time);
                    drums.player("crash1").start(time);
                } else {
                    if (kickHit) drums.player("kick").start(time);
                    if (snareHit) drums.player("snare").start(time);
                    if (playCymbal) drums.player(cymbalType).start(time);
                    if (s === 0 && (m === 0 || isLastMeasure)) drums.player("crash2").start(time);
                }

                // Chitarra e Basso (Muting + Attack)
                if (playGuitar) {
                    guitarOpen.releaseAll(time);
                    guitarPalm.releaseAll(time);
                    bass.releaseAll(time);

                    if (useOpen) {
                        guitarOpen.triggerAttack(gNote, time);
                        bass.triggerAttackRelease(bNote, "8n", time);
                    } else {
                        guitarPalm.triggerAttackRelease(gNote, "16n", time);
                        bass.triggerAttackRelease(bNote, "16n", time);
                    }
                }
            }, absoluteTime);
        }
    }
}
