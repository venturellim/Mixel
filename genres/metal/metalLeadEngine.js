// metalLeadEngine.js — ver. 001

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 001.2 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    // Destructuring con fallback per evitare TypeError se instruments è parziale
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return; // Se non c'è la lead, inutile procedere

    const isChorus = section?.name?.toLowerCase().includes("chorus") || false;
    const isSolo = section?.name?.toLowerCase().includes("solo") || section?.name?.toLowerCase().includes("bridge") || false;
    const stepTime = measureDur / 16;
    
    // Fallback sicuri per i parametri DNA
    const brightness = params?.imageParams?.brightness ?? 0.5;
    const complexity = params?.imageParams?.complexity ?? 0.5;
    
    const scale = ["A", "B", "C", "D", "E", "F", "G#"];

    const buildNote = (rawRoot, octave) => {
        if (!rawRoot) return "A" + octave;
        const cleanRoot = String(rawRoot).replace(/[0-9]/g, ''); 
        const normalized = normalizeNote(cleanRoot, "guitarLead");
        return normalized + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";

        if (!isSolo) {
            // --- 1. IL CANTO (Verse & Chorus) ---
            if (m % 2 === 0) {
                const melodyNote = buildNote(currentRoot, isChorus ? 5 : 4);
                
                Tone.Transport.schedule(time => {
                    try {
                        // Controllo esistenza prima del trigger
                        if (guitarLead) guitarLead.triggerAttackRelease(melodyNote, "1n", time);
                        
                        if ((isChorus || brightness > 0.6) && keyboardPad) {
                            keyboardPad.triggerAttackRelease(melodyNote, "1n", time, 0.4);
                        }
                    } catch(e) { /* Silenzioso per performance */ }
                }, measureStartTime);

                // Risposta melodica
                Tone.Transport.schedule(time => {
                    try {
                        const respBase = scale[rand() > 0.5 ? 2 : 4];
                        const responseNote = buildNote(respBase, isChorus ? 5 : 4);
                        if (guitarLead) guitarLead.triggerAttackRelease(responseNote, "2n", time);
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
                            if (guitarLead) guitarLead.triggerAttackRelease(soloNote, "16n", time);
                            if (complexity > 0.5 && keyboardLead) {
                                keyboardLead.triggerAttackRelease(soloNote, "16n", time, 0.3);
                            }
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
