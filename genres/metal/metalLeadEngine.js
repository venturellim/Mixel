// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 002.4 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;
    
    // Funzione evoluta: genera scala Maggiore o Minore in base all'accordo
    const getSmartScale = (root) => {
        const notes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
        const cleanRoot = normalizeNote(root.replace(/[0-9]/g, ''), "guitarLead");
        let rootIdx = notes.indexOf(cleanRoot);
        if (rootIdx === -1) rootIdx = 0;

        // RILEVAZIONE MODO: Se l'accordo è scritto in MAIUSCOLO (es. "G") è Maggiore.
        // Se è minuscolo (es. "a" o "i") è Minore.
        const isMajor = root === root.toUpperCase() && root.length <= 2; 
        
        // Intervalli: Maggiore [0,2,4,5,7,9,11] | Minore [0,2,3,5,7,8,10]
        const intervals = isMajor ? [0, 2, 4, 5, 7, 9, 11] : [0, 2, 3, 5, 7, 8, 10];
        
        return intervals.map(interval => notes[(rootIdx + interval) % 12]);
    };

    const buildNote = (rawRoot, octave) => {
        const cleanRoot = String(rawRoot || "A").replace(/[0-9]/g, ''); 
        return normalizeNote(cleanRoot, "guitarLead") + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        
        // SCALA DINAMICA PER QUESTA MISURA
        const chordScale = getSmartScale(currentRoot);

        // --- 1. INTRO / OUTRO (Melodico e Consonante) ---
        if (isIntro) {
            [0, 4, 8, 12].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                // Usa la 1a o la 5a della scala (sempre sicure)
                const noteName = buildNote(i % 2 === 0 ? chordScale[0] : chordScale[4], 4);
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.3);
                }, absoluteTime);
            });
        }

        // --- 2. VERSE / CHORUS (Il "Cantante" che non stona) ---
        else if (!isSolo) {
            [0, 8].forEach((s) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const noteName = buildNote(chordScale[0], isChorus ? 5 : 4);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (isChorus && keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.4);
                }, absoluteTime);

                // Note di collegamento: usiamo solo note "sicure" della scala corrente (1, 3, 5)
                [4, 6, 12, 14].forEach((step, idx) => {
                    const linkTime = measureStartTime + (step * stepTime);
                    const safeSteps = [0, 2, 4, 6]; // Gradi della scala
                    const linkNote = buildNote(chordScale[safeSteps[idx % 4]], isChorus ? 5 : 4);
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(linkNote, "4n", time, 0.2);
                    }, linkTime);
                });
            });
        }

        // --- 3. SOLO (Shredding coerente) ---
        else if (isSolo) {
            let scaleIdx = 0;
            for (let s = 0; s < 16; s++) {
                const isFastZone = (s > 4 && s < 12);
                if (isFastZone || s % 2 === 0) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    // Movimento lineare nella scala dell'accordo
                    scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                    const soloNote = buildNote(chordScale[scaleIdx], s > 8 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            guitarLead.triggerAttackRelease(soloNote, isFastZone ? "16n" : "8n", time);
                            if (keyboardLead && s % 2 === 0) keyboardLead.triggerAttackRelease(soloNote, "8n", time, 0.3);
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
