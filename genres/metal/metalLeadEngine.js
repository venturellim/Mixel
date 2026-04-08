// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 003.2 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;

    // --- 🧬 LIBRERIA MASCHERE ESTESA (Anti-Plagio) ---
    const library = {
        intro: [
            [0, 4, 8, 12],          // Standard Hero
            [0, 2, 4, 8, 10, 12],   // Fast March
            [0, 6, 8, 14],          // Sincopato
            [0, 3, 7, 8, 11, 15],   // Epic Waltz (sentore di terzine)
            [0, 8, 12, 14]          // Gallop Intro
        ],
        verse: [
            [0, 8],                 // Minimal (Voice focus)
            [0, 4, 8, 12],          // Steady
            [0, 6, 10],             // Delayed
            [4, 12],                // Answer style (suona solo sulla seconda metà)
            [0, 2, 8, 10],          // Nervous
            [0, 7, 8, 15]           // Wide leaps
        ],
        chorus: [
            [0, 2, 4, 6, 8, 10, 12, 14], // Power Drive (Ottavi)
            [0, 4, 8, 12],               // Anthemic (Note lunghe)
            [0, 3, 6, 8, 11, 14],        // Triple Feel
            [0, 1, 8, 9, 12],            // Staccato Drama
            [0, 4, 6, 8, 12, 14]         // Syncopated Anthem
        ]
    };

    // Estraiamo più dati dal DNA per incrociare le scelte
    const brightness = params?.imageParams?.brightness ?? 0.5;
    const saturation = params?.imageParams?.saturation ?? 0.5;
    const contrast = params?.imageParams?.contrast ?? 0.5; 
    
    const getPattern = (type) => {
        const family = library[type];
        // Usiamo il contrasto per scegliere il pattern, così è diverso dalla luminosità
        const idx = Math.floor(contrast * family.length) % family.length;
        return family[idx];
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

    const buildNote = (noteName, octave) => normalizeNote(noteName, "guitarLead") + octave;

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        const currentScale = getStrictScale(currentRoot);

        if (!isSolo) {
            const type = isIntro ? "intro" : (isChorus ? "chorus" : "verse");
            const pattern = getPattern(type);

            pattern.forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                
                // Variabilità dell'ottava basata sulla luminosità della foto
                let octave = isChorus ? 5 : 4;
                if (brightness > 0.7 && i % 3 === 0) octave++; // Picchi luminosi
                if (brightness < 0.3 && i % 4 === 0) octave--; // Toni cupi

                // Scelta del grado della scala basata sulla saturazione
                const degreeIdx = Math.floor(saturation * 7);
                const melodyMap = [0, 2, 4, 0, 5, 3, 6, 0];
                const noteIdx = (melodyMap[i % 8] + degreeIdx) % 7;
                
                const noteName = buildNote(currentScale[noteIdx], octave);

                Tone.Transport.schedule(time => {
                    // Durata dinamica: più contrasto = note più staccate e aggressive
                    const dur = contrast > 0.6 ? "8n" : (isChorus ? "4n" : "2n");
                    guitarLead.triggerAttackRelease(noteName, dur, time);
                }, absoluteTime);
            });
        }

        // --- SOLO: STRUTTURA A "DOMANDA E RISPOSTA" ---
        else {
            let scaleIdx = Math.floor(rand() * 7);
            for (let block = 0; block < 4; block++) {
                const blockStartTime = measureStartTime + (block * 4 * stepTime);
                
                // Se la foto è "energetica" (alta saturazione), più shredding
                const shredThreshold = 0.3 + (saturation * 0.4);
                const isFastBlock = rand() < shredThreshold; 

                if (isFastBlock) {
                    for (let s = 0; s < 4; s++) {
                        const noteTime = blockStartTime + (s * stepTime);
                        scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                        const noteName = buildNote(currentScale[scaleIdx], 5);
                        Tone.Transport.schedule(time => {
                            guitarLead.triggerAttackRelease(noteName, "16n", time);
                        }, noteTime);
                    }
                } else {
                    // Nota melodica basata sul contrasto (più alto = più acuta)
                    const soloOctave = contrast > 0.6 ? 6 : 5;
                    const noteName = buildNote(currentScale[block % 7], soloOctave);
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(noteName, "2n", time);
                    }, blockStartTime);
                }
            }
        }
    }
}
