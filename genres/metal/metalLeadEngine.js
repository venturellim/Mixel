// metalLeadEngine.js — ver. 001

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 001.3 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const isChorus = section?.name?.toLowerCase().includes("chorus") || false;
    const isSolo = section?.name?.toLowerCase().includes("solo") || section?.name?.toLowerCase().includes("bridge") || false;
    const stepTime = measureDur / 16;
    
    const brightness = params?.imageParams?.brightness ?? 0.5;
    const scale = ["A", "B", "C", "D", "E", "F", "G#"]; // Minore Armonica

    const buildNote = (rawRoot, octave) => {
        const cleanRoot = String(rawRoot || "A").replace(/[0-9]/g, ''); 
        return normalizeNote(cleanRoot, "guitarLead") + octave;
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";

        // --- VERSE / CHORUS: IL FRASEGGIO "CANTATO" ---
        if (!isSolo) {
            // Suoniamo su step chiave per creare una melodia fluida (non solo 2 note!)
            // Pattern: 0, 4, 8, 12 (ogni quarto) + variazioni
            [0, 4, 6, 8, 12, 14].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                
                // Logica Saliscendi: 
                // La prima nota è la radice, le altre si muovono sulla scala
                let noteName;
                if (s === 0) noteName = buildNote(currentRoot, isChorus ? 5 : 4);
                else {
                    const stepInScale = (i % 2 === 0) ? 2 : 4; // Salto di terza o quinta
                    noteName = buildNote(scale[stepInScale], isChorus ? 5 : 4);
                }

                Tone.Transport.schedule(time => {
                    try {
                        // La chitarra "canta" con note più lunghe (4n = un quarto)
                        guitarLead.triggerAttackRelease(noteName, "4n", time);
                        
                        // KEYBOARD SEMPRE PRESENTE NEL CHORUS O SE BRIGHT > 0.4
                        if ((isChorus || brightness > 0.4) && keyboardPad) {
                            keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.3);
                        }
                    } catch(e) {}
                }, absoluteTime);
            });
        } 
        
        // --- ASSOLO: LO SHREDDING FLUIDO ---
        else {
            for (let s = 0; s < 16; s++) {
                // Aumentiamo la densità: suoniamo quasi sempre sugli ottavi (s % 2)
                // e aggiungiamo sedicesimi per le "accelerazioni"
                const isAcceleration = (s > 8 && rand() > 0.5);
                
                if (s % 2 === 0 || isAcceleration) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    const noteIndex = Math.floor(rand() * scale.length);
                    const soloNote = buildNote(scale[noteIndex], s > 10 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            // Note più lunghe (8n) anche se suonate velocemente per il sustain
                            guitarLead.triggerAttackRelease(soloNote, "8n", time);
                            
                            // UNISONO COSTANTE NELL'ASSOLO (Johansson style)
                            if (keyboardLead) {
                                keyboardLead.triggerAttackRelease(soloNote, "8n", time, 0.4);
                            }
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
