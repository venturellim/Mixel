// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 002.7 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;

    // SCALA INTELLIGENTE: Risolve il conflitto A / Db
    const getStrictScale = (root) => {
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        
        // Pulizia profonda della root
        let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
        let isMinor = cleanRoot.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
        cleanRoot = cleanRoot.replace('m', '').toUpperCase();

        // Mapping per trovare l'indice corretto
        const altNames = { "DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#", "BB": "A#" };
        if (altNames[cleanRoot]) cleanRoot = altNames[cleanRoot];

        let rootIdx = allNotes.indexOf(cleanRoot);
        if (rootIdx === -1) rootIdx = 9; // Default A

        // Intervalli puri (Power Metal standard)
        const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
        return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
    };

    const buildNote = (noteName, octave) => {
        // Forza la normalizzazione prima di aggiungere l'ottava
        const norm = normalizeNote(noteName, "guitarLead");
        return norm + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        const currentScale = getStrictScale(currentRoot);

        // --- 1. INTRO / OUTRO (Stabile) ---
        if (isIntro) {
            [0, 4, 8, 12].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const noteName = buildNote(i % 2 === 0 ? currentScale[0] : currentScale[4], 4);
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.3);
                }, absoluteTime);
            });
        }

        // --- 2. VERSE / CHORUS (Melodia Vocale) ---
        else if (!isSolo) {
            [0, 8].forEach((s) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                // Usiamo la fondamentale per la nota lunga (sicurezza 100%)
                const mainNote = buildNote(currentScale[0], isChorus ? 5 : 4);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(mainNote, "2n", time);
                    if (isChorus && keyboardPad) keyboardPad.triggerAttackRelease(mainNote, "2n", time, 0.4);
                }, absoluteTime);

                // Note di collegamento: usiamo gradi che non creano mai attrito (1, 3, 5)
                [4, 6, 12, 14].forEach((step, idx) => {
                    const linkTime = measureStartTime + (step * stepTime);
                    // Forza l'uso di note della scala corrente
                    const safeIdx = [2, 4, 0, 4][idx % 4]; 
                    const linkNote = buildNote(currentScale[safeIdx], isChorus ? 5 : 4);
                    
                    Tone.Transport.schedule(time => {
                        // Ridotta velocity per le note di passaggio per ammorbidire il tono
                        guitarLead.triggerAttackRelease(linkNote, "4n", time, 0.25);
                    }, linkTime);
                });
            });
        }

        // --- 3. SOLO (Velocità Variabile e Armonica) ---
        else if (isSolo) {
            let scaleIdx = 0;
            for (let s = 0; s < 16; s++) {
                const isFast = (s > 4 && s < 12);
                if (isFast || s % 2 === 0) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    // Movimento per gradi congiunti nella scala dell'accordo
                    scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                    const soloNote = buildNote(currentScale[scaleIdx], s > 8 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            guitarLead.triggerAttackRelease(soloNote, isFast ? "16n" : "8n", time);
                            if (keyboardLead && s % 2 === 0) {
                                keyboardLead.triggerAttackRelease(soloNote, "8n", time, 0.3);
                            }
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
