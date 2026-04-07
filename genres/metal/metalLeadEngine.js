// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 002 loaded");

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

        // --- 1. INTRO/OUTRO: TEMA POTENTE (Power Chords/Ottave Basse) ---
        if (isIntro) {
            [0, 4, 8, 12].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                // Sfruttiamo le nuove ottave basse (3 e 4) per un tema maestoso
                const noteName = buildNote(currentRoot, 3); 
                const highNote = buildNote(currentRoot, 4);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    guitarLead.triggerAttackRelease(highNote, "2n", time, 0.6); // Raddoppio all'ottava
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.4);
                }, absoluteTime);
            });
        }

        // --- 2. VERSE: ARPEGGIATO PULITO (Registro Medio) ---
        else if (name.includes("verse")) {
            [0, 4, 8, 12].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                // Salto melodico tra ottava 3 e 4
                const noteName = buildNote(i % 2 === 0 ? currentRoot : scale[2], i % 2 === 0 ? 3 : 4);
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                }, absoluteTime);
            });
        }

        // --- 3. CHORUS: L'INNO (Registro Acuto C5-C6) ---
        else if (isChorus) {
            [0, 2, 4, 6, 8, 10, 12, 14].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                // Qui scateniamo l'ottava 5 e 6 per far "volare" la melodia
                const chorusMelody = [0, 2, 4, 5, 4, 2, 0, 1]; 
                const noteName = buildNote(scale[chorusMelody[i % chorusMelody.length]], 5);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "4n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "4n", time, 0.5);
                }, absoluteTime);
            });
        }

        // --- 4. SOLO: SHREDDING TOTALE (C3 -> C6) ---
        else if (isSolo) {
            for (let s = 0; s < 16; s++) {
                const absoluteTime = measureStartTime + (s * stepTime);
                const isTarget = s % 4 === 0;
                
                // Densità variabile per evitare confusione
                if (isTarget || rand() > 0.3) {
                    // L'assolo ora viaggia su 3 ottave diverse!
                    const oct = (s < 4) ? 3 : (s < 10) ? 4 : 5;
                    const noteName = buildNote(scale[Math.floor(rand() * 7)], oct);
                    
                    Tone.Transport.schedule(time => {
                        try {
                            guitarLead.triggerAttackRelease(noteName, isTarget ? "4n" : "16n", time);
                            // La tastiera fa l'unisono solo sulle note alte per non impastare
                            if (keyboardLead && oct >= 4 && s % 2 === 0) {
                                keyboardLead.triggerAttackRelease(noteName, "8n", time, 0.4);
                            }
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
