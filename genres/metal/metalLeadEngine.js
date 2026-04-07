// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 002.5 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;

    // HELPER: Genera rigorosamente le 7 note ammesse per l'accordo corrente
    const getStrictScale = (root) => {
        const notes = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
        const cleanRoot = normalizeNote(root.replace(/[0-9]/g, ''), "guitarLead");
        let rootIdx = notes.indexOf(cleanRoot);
        if (rootIdx === -1) rootIdx = 9; // Default A

        // Determina se l'accordo è maggiore o minore
        // Se la stringa contiene 'm' o è minuscola è minore, altrimenti maggiore
        const isMinor = root.includes('m') || root !== root.toUpperCase();
        const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
        
        return intervals.map(interval => notes[(rootIdx + interval) % 12]);
    };

    const buildNote = (noteName, octave) => {
        return normalizeNote(noteName, "guitarLead") + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        
        // --- 🛡️ LA PROTEZIONE ARMONICA ---
        // Calcoliamo la scala permessa UNA VOLTA per questa misura
        const currentScale = getStrictScale(currentRoot);

        // --- 1. INTRO / OUTRO (Perfetta come prima) ---
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

        // --- 2. VERSE / CHORUS (Il Fraseggio Sicuro) ---
        else if (!isSolo) {
            // Note principali (0 e 8)
            [0, 8].forEach((s) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const mainNote = buildNote(currentScale[0], isChorus ? 5 : 4);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(mainNote, "2n", time);
                    if (isChorus && keyboardPad) keyboardPad.triggerAttackRelease(mainNote, "2n", time, 0.4);
                }, absoluteTime);

                // Note di collegamento: usiamo indici fissi della scala per evitare "Ab" su "A"
                // Usiamo la 3ª (indice 2) e la 5ª (indice 4)
                [4, 6, 12, 14].forEach((step, idx) => {
                    const linkTime = measureStartTime + (step * stepTime);
                    const scaleIndex = [2, 4, 0, 4][idx % 4]; 
                    const linkNote = buildNote(currentScale[scaleIndex], isChorus ? 5 : 4);
                    
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(linkNote, "4n", time, 0.2);
                    }, linkTime);
                });
            });
        }

        // --- 3. SOLO (Shredding Rigorosamente in Scala) ---
        else if (isSolo) {
            let scaleIdx = 0;
            for (let s = 0; s < 16; s++) {
                const isFastZone = (s > 4 && s < 12);
                if (isFastZone || s % 2 === 0) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    
                    // Incremento dell'indice invece di scelta casuale di note esterne
                    scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                    const soloNote = buildNote(currentScale[scaleIdx], s > 8 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            guitarLead.triggerAttackRelease(soloNote, isFastZone ? "16n" : "8n", time);
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
