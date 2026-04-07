// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 002.2 loaded");

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

        // --- 1. INTRO / OUTRO: TEMA MELODICO (4 note per misura) ---
        if (isIntro) {
            [0, 4, 8, 12].forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const noteName = buildNote(i % 2 === 0 ? currentRoot : scale[(i*2)%7], 4);
                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.3);
                }, absoluteTime);
            });
        }

        // --- 2. VERSE / CHORUS: MELODIA DOLCE E LEGATA ---
        else if (!isSolo) {
            // Note principali lunghe (come v0.44)
            const mainSteps = [0, 8]; 
            mainSteps.forEach((s) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                const noteName = buildNote(currentRoot, isChorus ? 5 : 4);

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, "2n", time);
                    if (isChorus && keyboardPad) keyboardPad.triggerAttackRelease(noteName, "2n", time, 0.4);
                }, absoluteTime);

                // UNIONE DOLCE: Scala lenta di collegamento tra le note principali
                // Inseriamo due note di passaggio tra un quarto e l'altro
                [4, 6, 12, 14].forEach(step => {
                    const linkTime = measureStartTime + (step * stepTime);
                    const linkNote = buildNote(scale[Math.floor(rand()*7)], isChorus ? 5 : 4);
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(linkNote, "4n", time, 0.2); // Velocity più bassa per dolcezza
                    }, linkTime);
                });
            });
        }

        // --- 3. SOLO: VELOCITÀ VARIABILE (Ritmica Dinamica) ---
        else if (isSolo) {
            let currentScaleIndex = Math.floor(rand() * 7);
            for (let s = 0; s < 16; s++) {
                // Alternanza di velocità: alcuni momenti lenti (8n), altri veloci (16n)
                const isFastZone = (s > 4 && s < 12);
                const shouldPlay = isFastZone ? true : (s % 2 === 0);

                if (shouldPlay) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    currentScaleIndex = (currentScaleIndex + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                    const soloNote = buildNote(scale[currentScaleIndex], s > 8 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            const dur = isFastZone ? "16n" : "8n";
                            guitarLead.triggerAttackRelease(soloNote, dur, time);
                            if (keyboardLead && s % 2 === 0) keyboardLead.triggerAttackRelease(soloNote, "8n", time, 0.3);
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
