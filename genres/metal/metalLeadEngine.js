// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 002.3 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;
    
    // --- FIX ARMONICO: Recuperiamo la tonalità reale dal brano ---
    // Usiamo la prima nota della progressione della sezione come riferimento
    const sectionKey = progression[0] || "A";
    
    // Generiamo una scala minore naturale basata sulla tonica corrente
    // (A, B, C, D, E, F, G) invece di quella fissa col G#
    const baseScale = ["A", "B", "C", "D", "E", "F", "G"]; 
    
    // Funzione per trasporre la scala in base alla tonalità del brano
    const getDynamicScale = (root) => {
        const notes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
        let rootIdx = notes.indexOf(normalizeNote(root, "guitarLead"));
        if (rootIdx === -1) rootIdx = 9; // Default A
        
        // Intervalli scala minore: 0, 2, 3, 5, 7, 8, 10 semitoni
        return [0, 2, 3, 5, 7, 8, 10].map(interval => notes[(rootIdx + interval) % 12]);
    };

    const currentScale = getDynamicScale(sectionKey);

    const buildNote = (rawRoot, octave) => {
        const cleanRoot = String(rawRoot || "A").replace(/[0-9]/g, ''); 
        return normalizeNote(cleanRoot, "guitarLead") + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        
        // Aggiorniamo la scala per l'accordo specifico se siamo in Verse/Chorus
        const chordScale = getDynamicScale(currentRoot);

        // --- 1. INTRO / OUTRO: TEMA MELODICO (Ora in scala) ---
        if (isIntro) {
            [0, 4, 8, 12].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                // Prende note dalla scala dinamica invece che dall'array fisso
                const noteName = buildNote(i % 2 === 0 ? currentRoot : chordScale[2], 4);
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.3);
                }, absoluteTime);
            });
        }

        // --- 2. VERSE / CHORUS: MELODIA DOLCE (Senza note "sbagliate") ---
        else if (!isSolo) {
            [0, 8].forEach((s) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const noteName = buildNote(currentRoot, isChorus ? 5 : 4);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (isChorus && keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.4);
                }, absoluteTime);

                // Note di collegamento prese rigorosamente dalla scala dell'accordo
                [4, 6, 12, 14].forEach(step => {
                    const linkTime = measureStartTime + (step * stepTime);
                    const linkNote = buildNote(chordScale[Math.floor(rand()*7)], isChorus ? 5 : 4);
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(linkNote, "4n", time, 0.2);
                    }, linkTime);
                });
            });
        }

        // --- 3. SOLO: SHREDDING ARMONIZZATO ---
        else if (isSolo) {
            let scaleIdx = Math.floor(rand() * 7);
            for (let s = 0; s < 16; s++) {
                const isFastZone = (s > 4 && s < 12);
                if (isFastZone || s % 2 === 0) {
                    const absoluteTime = measureStartTime + (s * stepTime);
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
