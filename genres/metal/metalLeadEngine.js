// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 002.1 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;
    
    const scale = ["A", "B", "C", "D", "E", "F", "G#"];

    const buildNote = (rawRoot, octave) => {
        const cleanRoot = String(rawRoot || "A").replace(/[0-9]/g, ''); 
        return normalizeNote(cleanRoot, "guitarLead") + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";

        // --- 1. VERSE / CHORUS: IL FRASÉGGIO "CANTATO" ---
        if (!isSolo && !isIntro) {
            const steps = isChorus ? [0, 4, 8, 12] : [0, 8];
            
            steps.forEach((s) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const targetNote = buildNote(currentRoot, isChorus ? 5 : 4);

                // SIMULAZIONE VOCALE: Micro-frase prima della nota lunga
                // Suoniamo due note rapide di "approccio" (sedicesimi)
                [ -2, -1, 0 ].forEach((offset, i) => {
                    const noteIndex = (scale.indexOf(currentRoot.replace(/[0-9]/g, '')) + offset + 7) % 7;
                    const vNote = buildNote(scale[noteIndex], isChorus ? 5 : 4);
                    const vTime = absoluteTime + (i * (stepTime / 2));

                    Tone.Transport.schedule(time => {
                        try {
                            // Le prime due sono rapide (sillabe), l'ultima è tenuta (vocale)
                            const duration = (i === 2) ? "2n" : "16n";
                            guitarLead.triggerAttackRelease(vNote, duration, time);
                            if (isChorus && i === 2 && keyboardPad) {
                                keyboardPad.triggerAttackRelease(vNote, "2n", time, 0.3);
                            }
                        } catch(e) {}
                    }, vTime);
                });
            });
        } 

        // --- 2. INTRO: IDENTICO ALLA 44 (Funzionava bene) ---
        else if (isIntro) {
            [0, 8].forEach(s => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const noteName = buildNote(currentRoot, 4);
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "1n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "1n", time, 0.4);
                }, absoluteTime);
            });
        }

        // --- 3. SOLO: LOGICA NEOCLASSICA (Scale Direzionali) ---
        else if (isSolo) {
            // Decidiamo una direzione per l'intera misura per non fare "Metropolis"
            const direction = rand() > 0.5 ? 1 : -1;
            let currentScaleIndex = Math.floor(rand() * 7);

            for (let s = 0; s < 16; s++) {
                if (s % 2 === 0) { // Ottavi costanti
                    const absoluteTime = measureStartTime + (s * stepTime);
                    
                    // Muoviti nella scala di un passo alla volta (lineare)
                    currentScaleIndex = (currentScaleIndex + direction + 7) % 7;
                    const soloNote = buildNote(scale[currentScaleIndex], s > 8 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            guitarLead.triggerAttackRelease(soloNote, "8n", time);
                            if (keyboardLead) keyboardLead.triggerAttackRelease(soloNote, "8n", time, 0.3);
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
