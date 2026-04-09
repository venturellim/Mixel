// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 003.8 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;

    // --- 🧬 LIBRERIA MASCHERE (La tua selezione filtrata) ---
    const library = {
        intro: [
            [0, 1, 2, 3, 4, 8, 12], [0, 4, 8, 10, 11, 12, 13, 14], 
            [0, 2, 3, 4, 8, 10, 11, 12], [0, 3, 4, 7, 8, 11, 12, 15], 
            [0, 1, 2, 3, 4, 5, 6, 7, 8]
        ],
        verse: [
            [0, 8], [0, 4, 8, 12], [0, 6, 8, 14], 
            [0, 4, 10], [2, 6, 10, 14], [0, 2, 4, 8, 10, 12]
        ],
        chorus: [
            [0, 2, 4, 6, 8, 10, 12, 14], [0, 8, 12], 
            [0, 4, 8, 12], [0, 3, 8, 11], [0, 6, 7, 8, 14]
        ]
    };

    // --- 🧬 IL TUO MOTORE DI PESATURA DNA ---
        const getPattern = (type) => {
        const family = library[type] || library.verse;
        
        const energy = params?.imageParams?.energy ?? 0.5;
        const brightness = params?.imageParams?.brightness ?? 0.5;
        const complexity = params?.imageParams?.complexity ?? 0.5;
        const texture = params?.imageParams?.texture ?? 0.5;
        
        let dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2) + (texture * 0.1);
        
        const sectionMultipliers = { intro: 1.33, verse: 0.77, chorus: 2.15 };
        const finalScore = dnaScore * (sectionMultipliers[type] || 1.0);
        
        const idx = Math.floor(Math.abs(finalScore)) % family.length;
        return family[idx] || family[0];
    };

    const getStrictScale = (root) => {
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
        let isMinor = cleanRoot.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
        cleanRoot = cleanRoot.replace('m', '').toUpperCase();
        const altNames = { "DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#", "BB": "A#" };
        if (altNames[cleanRoot]) cleanRoot = altNames[cleanRoot];
        let rootIdx = allNotes.indexOf(cleanRoot);
        if (rootIdx === -1) rootIdx = 9;
        const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
        return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        const currentScale = getStrictScale(currentRoot);

        if (!isSolo) {
            const type = isIntro ? "intro" : (isChorus ? "chorus" : "verse");
            const pattern = getPattern(type);
            
            pattern.forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const nextStep = (i < pattern.length - 1) ? pattern[i + 1] : 16;
                const duration = (nextStep - s) * stepTime;

                // Melodia sicura: Fondamentale, Quinta, Terza
                const safeMelody = [0, 4, 2, 0, 4, 5, 2, 0];
                const octave = name.includes("chorus") ? 5 : 4;
                const noteName = normalizeNote(currentScale[safeMelody[i % 8]], "guitarLead") + octave;

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, duration, time);
                }, absoluteTime);
            });
        } else {
            // Logica Solo (Blocchi domanda/risposta)
            for (let block = 0; block < 4; block++) {
                const blockStartTime = measureStartTime + (block * 4 * stepTime);
                const isFast = rand() > 0.4;
                if (isFast) {
                    for (let s = 0; s < 4; s++) {
                        const noteName = normalizeNote(currentScale[rand() > 0.5 ? 0 : 4], "guitarLead") + 5;
                        Tone.Transport.schedule(time => {
                            guitarLead.triggerAttackRelease(noteName, "16n", time);
                        }, blockStartTime + (s * stepTime));
                    }
                } else {
                    const noteName = normalizeNote(currentScale[0], "guitarLead") + 5;
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(noteName, "2n", time);
                    }, blockStartTime);
                }
            }
        }
    }
}
