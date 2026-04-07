// metalLeadEngine.js — ver. 001

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 001.4 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;
    
    const scale = ["A", "B", "C", "D", "E", "F", "G#"];

    // Utility per mappare le note in base all'ottava corretta
    const buildNote = (rawRoot, octave) => {
        const cleanRoot = String(rawRoot || "A").replace(/[0-9]/g, ''); 
        return normalizeNote(cleanRoot, "guitarLead") + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";

        // --- 1. INTRO / OUTRO: IL TEMA CELEBRATIVO ---
        if (isIntro) {
            // Pattern ritmico solenne (Quarti e Ottavi)
            [0, 4, 8, 10, 12, 14].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const themePicks = [currentRoot, scale[2], scale[4], scale[5], scale[4], scale[3]];
                const noteName = buildNote(themePicks[i % themePicks.length], 5);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.3);
                }, absoluteTime);
            });
        }

        // --- 2. VERSE: ARPEGGIATO / BASSO (Atmosferico) ---
        else if (name.includes("verse")) {
            // Qui usiamo l'ottava 3 o 4 (in attesa dei tuoi campioni C2-C3)
            [0, 6, 8, 14].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const noteName = buildNote(i % 2 === 0 ? currentRoot : scale[2], 4);
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                }, absoluteTime);
            });
        }

        // --- 3. CHORUS: L'INNO (Saliscendi Stratovarius) ---
        else if (isChorus) {
            // Pattern sincopato per dare spinta
            [0, 2, 4, 8, 10, 12].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                // Melodia che "risponde" all'accordo
                const melSteps = [0, 2, 4, 6, 5, 4]; // Gradi della scala
                const noteName = buildNote(scale[melSteps[i % melSteps.length]], 5);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "4n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "4n", time, 0.5);
                }, absoluteTime);
            });
        }

        // --- 4. SOLO: SHREDDING CON LOGICA ---
        else if (isSolo) {
            for (let s = 0; s < 16; s++) {
                const absoluteTime = measureStartTime + (s * stepTime);
                const isDownbeat = s % 4 === 0; // Inizio del quarto
                
                // Suoniamo sedicesimi ma con una "linea guida"
                if (isDownbeat || rand() > 0.4) {
                    const noteName = isDownbeat ? buildNote(currentRoot, 5) : buildNote(scale[Math.floor(rand()*7)], 4);
                    
                    Tone.Transport.schedule(time => {
                        try {
                            // Note lunghe sui quarti, veloci nel mezzo
                            guitarLead.triggerAttackRelease(noteName, isDownbeat ? "4n" : "16n", time);
                            if (keyboardLead && s % 2 === 0) {
                                keyboardLead.triggerAttackRelease(noteName, "8n", time, 0.3);
                            }
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
