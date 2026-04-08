// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 003.3 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;

    // --- 🧬 LIBRERIA MASCHERE (Struttura ritmica stabile) ---
    const library = {
        intro: [[0, 4, 8, 12], [0, 2, 4, 8, 10, 12], [0, 6, 8, 14], [0, 8]],
        verse: [[0, 8], [0, 4, 8, 12], [0, 6, 10]],
        chorus: [[0, 2, 4, 6, 8, 10, 12, 14], [0, 4, 8, 12], [0, 7, 8, 15]]
    };

    const brightness = params?.imageParams?.brightness ?? 0.5;
    const contrast = params?.imageParams?.contrast ?? 0.5;

    const getPattern = (type) => {
        const family = library[type];
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
                
                // Ottava fissa per stabilità, con variazione solo in Chorus
                let octave = isChorus ? 5 : 4;
                if (brightness > 0.8 && i === 0) octave++; 

                // --- 🛡️ FIX ARMONICO: Mappa melodica basata sui gradi della scala ---
                // 0 = Tonica, 2 = Terza, 4 = Quinta (le note "sicure")
                const safeMelody = [0, 4, 2, 0, 4, 5, 2, 0];
                const noteIdx = safeMelody[i % safeMelody.length];
                const noteName = buildNote(currentScale[noteIdx], octave);

                Tone.Transport.schedule(time => {
                    // Se la nota cade sul battere (0 o 8), è più lunga
                    const isStrongBeat = (s % 8 === 0);
                    const dur = isStrongBeat ? "2n" : "4n";
                    guitarLead.triggerAttackRelease(noteName, dur, time);
                }, absoluteTime);
            });
        }

        else {
            // --- SOLO: CORRETTO CON ANCORAGGIO ALL'ACCORDO ---
            let scaleIdx = 0;
            for (let block = 0; block < 4; block++) {
                const blockStartTime = measureStartTime + (block * 4 * stepTime);
                const isFastBlock = rand() > 0.4; 

                if (isFastBlock) {
                    for (let s = 0; s < 4; s++) {
                        const noteTime = blockStartTime + (s * stepTime);
                        // Il primo sedicesimo del blocco è SEMPRE una nota della scala dell'accordo
                        if (s === 0) scaleIdx = (rand() > 0.5 ? 0 : 4); 
                        else scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                        
                        const noteName = buildNote(currentScale[scaleIdx], 5);
                        Tone.Transport.schedule(time => {
                            guitarLead.triggerAttackRelease(noteName, "16n", time);
                        }, noteTime);
                    }
                } else {
                    // Nota lunga: sempre la Fondamentale (grado 0)
                    const noteName = buildNote(currentScale[0], 5);
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(noteName, "2n", time);
                    }, blockStartTime);
                }
            }
        }
    }
}
