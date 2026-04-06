// metalRhythmEngine.js — ver. 014 (THE GENOME UPDATE)
import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalRhythmEngine.js ver. 014 loaded");

// --- LIBRERIA DI PATTERN RITMICI (Il nostro "Libretto di Istruzioni") ---
const RHYTHM_LIBRARY = {
    verse: [
        { name: "classic_gallop", kick: [0, 2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15], snare: [4, 12] },
        { name: "power_straight", kick: [0, 2, 4, 6, 8, 10, 12, 14], snare: [4, 12] },
        { name: "tech_death", kick: [0, 1, 2, 3, 8, 9, 10, 11], snare: [4, 12] },
        { name: "tribal_groove", kick: [0, 3, 6, 8, 11, 14], snare: [4, 12] },
        { name: "syncopated", kick: [0, 3, 4, 7, 8, 11, 12, 15], snare: [4, 12] }
    ],
    chorus: [
        { name: "double_blast", kick: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15], snare: [4, 12] },
        { name: "anthem_half", kick: [0, 8], snare: [4, 12] },
        { name: "driving_power", kick: [0, 2, 4, 6, 8, 10, 12, 14], snare: [4, 12] }
    ],
    intro: [
        { name: "stratovarius", kick: [0], snare: [12], type: "open" },
        { name: "march", kick: [0, 4, 8, 12], snare: [4, 12], type: "palm" },
        { name: "fast_start", kick: [0, 2, 4, 6], snare: [4, 12], type: "open" }
    ]
};

export function scheduleRhythm(section, progression, instruments, params, rand, measureDur, nextSectionRoot) {
    const { drums, guitarPalm, guitarOpen, bass } = instruments;
    const isIntro = section.name.toLowerCase().includes("intro");
    const isChorus = section.name.toLowerCase().includes("chorus");
    
    // PUNTO CHIAVE: Scegliamo un pattern per la sezione basandoci sul DNA
    const typePool = isIntro ? "intro" : (isChorus ? "chorus" : "verse");
    const sectionPattern = RHYTHM_LIBRARY[typePool][Math.floor(rand() * RHYTHM_LIBRARY[typePool].length)];

    const stepTime = measureDur / 16;

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const root = progression[m % progression.length];
        const isIntroFirstHalf = isIntro && (m < Math.floor(section.measures / 2));
        
        // Evoluzione: Ogni 2 misure, c'è una chance di aggiungere un colpo di cassa extra (Ghost note)
        const ghostChance = (m % 2 === 0) ? 0 : 0.2;

        for (let s = 0; s < 16; s++) {
            const absoluteTime = measureStartTime + (s * stepTime);
            
            // 1. Logica Batteria da Pattern
            const kickHit = sectionPattern.kick.includes(s) || (rand() < ghostChance && s % 2 !== 0);
            const snareHit = sectionPattern.snare.includes(s);

            // 2. Logica Chitarra (Segue la cassa per il 90% del tempo)
            let playGuitar = kickHit; 
            let useOpen = (isIntro && sectionPattern.type === "open") || (isChorus && rand() > 0.3);

            // PUNTO 5 del messaggio precedente: Chiusura su Open
            if (!isIntro && s === 15 && rand() > 0.7) {
                playGuitar = true;
                useOpen = true;
            }

            if (playGuitar) {
                const gNote = normalizeNote(root, useOpen ? "guitarOpen" : "guitarPalm");
                
                Tone.Transport.schedule(t => {
                    // MUTING LOGIC (Stoppa tutto prima di suonare)
                    guitarOpen.releaseAll(t);
                    guitarPalm.releaseAll(t);
                    bass.releaseAll(t);

                    if (useOpen) {
                        guitarOpen.triggerAttack(gNote + "2", t);
                    } else {
                        guitarPalm.triggerAttackRelease(gNote + "2", "16n", t);
                    }
                    bass.triggerAttackRelease(normalizeNote(root, "bass") + "1", useOpen ? "8n" : "16n", t);
                }, absoluteTime);
            }

            // 3. Scheduling Batteria
            Tone.Transport.schedule(t => {
                // Se siamo nell'intro "vuoto", suoniamo solo i piatti e la cassa su 0
                if (isIntroFirstHalf) {
                    if (s === 0) {
                        drums.player("kick").start(t);
                        drums.player("crash1").start(t);
                    }
                    return;
                }

                if (kickHit) drums.player("kick").start(t);
                if (snareHit) drums.player("snare").start(t);
                
                // Piatti: Variano in base alla sezione
                if (s % 2 === 0) {
                    const cymbal = isChorus ? "ride" : "hihat";
                    drums.player(cymbal).start(t, 0, { volume: isChorus ? 0 : -6 });
                }
            }, absoluteTime);
        }
    }
}
