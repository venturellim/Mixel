// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 003.1 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead } = instruments || {}; // Solo chitarra, tastiere rimosse
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;

    // --- 🧬 DNA DATABASE ---
    const library = {
        intro: [[0, 4, 8, 12], [0, 2, 4, 8, 10, 12], [0, 6, 8, 14]],
        verse: [[0, 8], [0, 4, 8, 12], [0, 6, 10]],
        chorus: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 4, 8, 12], [0, 7, 8, 15]]
    };

    const brightness = params?.imageParams?.brightness ?? 0.5;
    const saturation = params?.imageParams?.saturation ?? 0.5;
    
    const getPattern = (type) => {
        const family = library[type];
        const idx = Math.floor(brightness * family.length) % family.length;
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
                const octave = (isChorus && i % 4 === 0) ? 6 : (isChorus ? 5 : 4);
                const noteIdx = [0, 2, 4, 0, 5, 4, 2, 0][i % 8];
                const noteName = buildNote(currentScale[noteIdx], octave);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, isChorus ? "4n" : "2n", time);
                }, absoluteTime);
            });
        }

        // --- 🎸 NUOVO SOLO: FRASEGGI "ATTACCO E RILASCIO" ---
        else {
            let scaleIdx = 0;
            // Un solo metal è fatto di "momenti" (blocchi di 4 step)
            for (let block = 0; block < 4; block++) {
                const blockStartTime = measureStartTime + (block * 4 * stepTime);
                
                // Decidiamo se questo blocco è "veloce" o "melodico"
                const isFastBlock = rand() > 0.4; 

                if (isFastBlock) {
                    // Raffica di sedicesimi (Shredding)
                    for (let s = 0; s < 4; s++) {
                        const noteTime = blockStartTime + (s * stepTime);
                        scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                        const noteName = buildNote(currentScale[scaleIdx], 5);
                        Tone.Transport.schedule(time => {
                            guitarLead.triggerAttackRelease(noteName, "16n", time);
                        }, noteTime);
                    }
                } else {
                    // Nota lunga e vibrata (Melodico)
                    const noteName = buildNote(currentScale[0], 5);
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(noteName, "2n", time);
                    }, blockStartTime);
                }
            }
        }
    }
}
