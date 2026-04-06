// metalRhythmEngine.js — ver. 017 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 017 loaded");

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isIntro = section.name.toLowerCase().includes("intro");
    const isChorus = section.name.toLowerCase().includes("chorus");
    const stepTime = measureDur / 16;
    const energy = params.imageParams.energy;

    // Aumentiamo i pattern per evitare la noia
    const RHYTHM_LIBRARY = {
        verse: [
            { k: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], s: [4, 12] }, // Gallop
            { k: [0, 1, 2, 3, 8, 9, 10, 11], s: [4, 12] },               // Double Blast
            { k: [0, 4, 8, 12], s: [4, 12] },                            // Straight
            { k: [0, 3, 6, 8, 11, 14], s: [4, 12] }                      // Syncopated
        ],
        chorus: [
            { k: [0, 2, 4, 6, 8, 10, 12, 14], s: [4, 12] },              // Power
            { k: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], s: [4, 12] } // Full Double
        ],
        intro: [{ k: [0], s: [12], type: "open" }]
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        
        // --- DINAMICA DI MISURA ---
        // Scegliamo il pattern QUI (cambia ogni misura o ogni 2 se vuoi più coerenza)
        const typePool = isIntro ? "intro" : (isChorus ? "chorus" : "verse");
        const patterns = RHYTHM_LIBRARY[typePool];
        const pattern = patterns[Math.floor(rand() * patterns.length)];
        
        // Decidiamo lo stile della chitarra per QUESTA misura
        // Se è chorus, 90% Open. Se è Verse, 10% Open (solo accento sul primo colpo)
        const measureStyle = isChorus ? (rand() > 0.2 ? "open" : "palm") : (rand() > 0.9 ? "open" : "palm");

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            const isIntroFirstHalf = isIntro && (m < Math.floor(section.measures / 2));
            
            // 1. Logica Colpi
            const kickHit = !isIntroFirstHalf && pattern.k.includes(s);
            const snareHit = !isIntroFirstHalf && pattern.s.includes(s);
            
            // 2. Logica Chitarra (Risolviamo il conflitto Open/Palm)
            let playGuitar = kickHit;
            let currentInst = (measureStyle === "open") ? "guitarOpen" : "guitarPalm";

            // Accento "Open" forzato sul primo colpo della misura se l'energia è alta
            if (s === 0 && energy > 0.7 && !isIntroFirstHalf) {
                playGuitar = true;
                currentInst = "guitarOpen";
            }

            // 3. Transizione finale (Sempre Palm per precisione)
            let currentRoot = root;
            if (m === section.measures - 1 && s >= 12 && nextSectionRoot && nextSectionRoot !== root) {
                const diff = Tone.Frequency(nextSectionRoot + "2").toMidi() > Tone.Frequency(root + "2").toMidi() ? 1 : -1;
                currentRoot = Tone.Frequency(Tone.Frequency(root + "2").toMidi() + (s === 12 ? diff : diff * 2), "midi").toNote();
                playGuitar = true;
                currentInst = "guitarPalm"; 
            }

            // Pre-calcolo note stringhe
            const gNote = normalizeNote(currentRoot, currentInst) + "2";
            const bNote = normalizeNote(currentRoot, "bass") + "1";
            const isOpen = (currentInst === "guitarOpen");

            // --- CALLBACK DI ESECUZIONE ---
            Tone.Transport.schedule(time => {
                // Batteria
                if (isIntroFirstHalf && s === 0) {
                    drums.player("kick").start(time);
                    drums.player("crash1").start(time);
                } else if (!isIntroFirstHalf) {
                    if (kickHit) drums.player("kick").start(time);
                    if (snareHit) drums.player("snare").start(time);
                    if (s % 2 === 0) drums.player(isChorus ? "ride" : "hihat").start(time);
                }

                // Chitarra/Basso con Muting rigoroso
                if (playGuitar) {
                    guitarOpen.releaseAll(time);
                    guitarPalm.releaseAll(time);
                    bass.releaseAll(time);

                    if (isOpen) {
                        guitarOpen.triggerAttack(gNote, time);
                        bass.triggerAttackRelease(bNote, "4n", time);
                    } else {
                        guitarPalm.triggerAttackRelease(gNote, "16n", time);
                        bass.triggerAttackRelease(bNote, "16n", time);
                    }
                }
            }, absoluteTime);
        }
    }
}
