// metalLeadEngine.js — ver. 001

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 001.1 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments;
    const isChorus = section.name.toLowerCase().includes("chorus");
    const isSolo = section.name.toLowerCase().includes("solo") || section.name.toLowerCase().includes("bridge");
    const stepTime = measureDur / 16;
    
    const { brightness = 0.5, complexity = 0.5 } = params.imageParams;
    const scale = ["A", "B", "C", "D", "E", "F", "G#"];

    // Utility interna per costruire note sicure
    const buildNote = (rawRoot, octave) => {
        const cleanRoot = rawRoot.replace(/[0-9]/g, ''); // Rimuove numeri (es. C2 -> C)
        const normalized = normalizeNote(cleanRoot, "guitarLead");
        return normalized + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length];

        if (!isSolo) {
            // --- 1. IL CANTO (Verse & Chorus) ---
            if (m % 2 === 0) {
                const melodyNote = buildNote(currentRoot, isChorus ? 5 : 4);
                
                Tone.Transport.schedule(time => {
                    try {
                        guitarLead.triggerAttackRelease(melodyNote, "1n", time);
                        if (isChorus || brightness > 0.6) {
                            keyboardPad.triggerAttackRelease(melodyNote, "1n", time, 0.4);
                        }
                    } catch(e) { console.error("Lead Error:", e); }
                }, measureStartTime);

                // Risposta melodica a metà misura (mantiene il feeling di Kotipelto)
                Tone.Transport.schedule(time => {
                    try {
                        const respBase = scale[rand() > 0.5 ? 2 : 4];
                        const responseNote = buildNote(respBase, isChorus ? 5 : 4);
                        guitarLead.triggerAttackRelease(responseNote, "2n", time);
                    } catch(e) {}
                }, measureStartTime + (measureDur / 2));
            }
        } 
        else {
            // --- 2. L'ASSOLO (The Shredder) ---
            for (let s = 0; s < 16; s++) {
                if (s % 2 === 0 && rand() < 0.7) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    const noteIndex = Math.floor(rand() * scale.length);
                    const soloNote = buildNote(scale[noteIndex], s > 8 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            guitarLead.triggerAttackRelease(soloNote, "16n", time);
                            if (complexity > 0.5) {
                                keyboardLead.triggerAttackRelease(soloNote, "16n", time, 0.3);
                            }
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
