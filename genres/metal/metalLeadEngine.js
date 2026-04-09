// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 003.4 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const stepTime = measureDur / 16;
    const name = section?.name?.toLowerCase() || "";
    const isSolo = name.includes("solo") || name.includes("bridge");

    // --- 🧬 LIBRERIA MASCHERE PROFESSIONALE ---
const library = {
    // 🎸 INTRO/SOLO: Alta densità, shredding, passaggi stretti (anche 1 step di distanza)
    intro: [
        [0, 1, 2, 3, 4, 8, 12],          // Raffica iniziale poi dritto
        [0, 4, 8, 10, 11, 12, 13, 14],   // Scalata cromatica finale
        [0, 2, 3, 4, 8, 10, 11, 12],     // Gallop accelerato
        [0, 1, 2, 3, 8, 9, 10, 11],      // Blocchi di sedicesimi alternati
        [0, 4, 5, 6, 7, 8, 12],          // "The Machine Gun"
        [0, 3, 4, 7, 8, 11, 12, 15],     // Terzinato tecnico
        [0, 1, 2, 3, 4, 5, 6, 7, 8],     // Scala ultra-veloce (metà battuta)
        [0, 2, 4, 5, 6, 8, 10, 12, 13, 14] // Articolazione complessa
    ],

    // 🎤 VERSE/CHORUS: Cantabili, almeno 2 step di distanza (tranne rari casi armonici)
    verse: [
        [0, 8],                          // Super aperto (Inno)
        [0, 4, 8, 12],                   // Il classico quarto
        [0, 6, 8, 14],                   // Sincopato largo
        [0, 4, 10],                      // Sospeso
        [2, 6, 10, 14],                  // Tutto in levare
        [0, 8, 10, 12],                  // Chiusura di misura veloce
        [0, 4, 6, 12],                   // Salto ritmico
        [0, 2, 4, 8, 10, 12]             // Ottavi costanti (cantabile)
    ],

    // 🏛️ CHORUS: Epico, note lunghe, grandi distanze per far risaltare il riverbero
    chorus: [
        [0, 2, 4, 6, 8, 10, 12, 14],    // Power ottavi (Classic Helloween)
        [0, 8, 12],                      // Molto solenne
        [0, 4, 8, 12],                   // Anthem dritto
        [0, 6, 12],                      // Sincopato epico
        [0, 3, 8, 11],                   // Feeling terzinato largo
        [0, 10, 14],                     // Rilascio lento
        [0, 4, 6, 8, 14],                // Melodia saltellante
        [0, 2, 8, 10, 14]                // Doppia risposta
    ]
};

// --- 🧠 LOGICA DI SELEZIONE AUTOMATICA ---
const getPattern = (type) => {
    const family = library[type];
    // Usiamo il contrasto della foto per scorrere la lista
    // Una foto molto contrastata sceglierà i pattern alla fine della lista (più complessi)
    const selector = params?.imageParams?.contrast ?? 0.5;
    const idx = Math.floor(selector * family.length) % family.length;
    return family[idx];
};

    const getStrictScale = (root) => {
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
        let isMinor = cleanRoot.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
        cleanRoot = cleanRoot.replace('m', '').toUpperCase();
        const altNames = { "DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#", "BB": "A#" };
        if (altNames[cleanRoot]) cleanRoot = altNames[cleanRoot];
        let rootIdx = allNotes.indexOf(cleanRoot);
        if (rootIdx === -1) rootIdx = 9;
        const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
        return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        const currentScale = getStrictScale(currentRoot);

        if (!isSolo) {
            const type = name.includes("intro") ? "intro" : (name.includes("chorus") ? "chorus" : "verse");
            const pattern = getPattern(type);

            pattern.forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                
                // --- 🚀 CALCOLO AUTOMATICO DEL SUSTAIN ---
                let durationSteps;
                if (i < pattern.length - 1) {
                    // La durata è la distanza dalla nota successiva
                    durationSteps = pattern[i + 1] - s;
                } else {
                    // L'ultima nota dura fino alla fine della battuta (step 16)
                    durationSteps = 16 - s;
                }
                const autoDuration = durationSteps * stepTime;

                // Melodia sicura
                const safeMelody = [0, 4, 2, 0, 4, 5, 2, 0];
                const noteName = normalizeNote(currentScale[safeMelody[i % 8]], "guitarLead") + (name.includes("chorus") ? 5 : 4);

                Tone.Transport.schedule(time => {
                    // Applichiamo la durata calcolata (in secondi)
                    guitarLead.triggerAttackRelease(noteName, autoDuration, time);
                }, absoluteTime);
            });
        } 
       else {
            // --- SOLO: CORRETTO CON ANCORAGGIO ALL'ACCORDO ---
            let scaleIdx = 0;
            for (let block = 0; block < 4; block++) {
                const blockStartTime = measureStartTime + (block * 4 * stepTime);
                const isFastBlock = rand() > 0.4; 

                if (isFastBlock) {
                    for (let s = 0; s < 4; s++) {
                        const noteTime = blockStartTime + (s * stepTime);
                        // Il primo sedicesimo del blocco è SEMPRE una nota della scala dell'accordo
                        if (s === 0) scaleIdx = (rand() > 0.5 ? 0 : 4); 
                        else scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                        
                        const noteName = buildNote(currentScale[scaleIdx], 5);
                        Tone.Transport.schedule(time => {
                            guitarLead.triggerAttackRelease(noteName, "16n", time);
                        }, noteTime);
                    }
                } else {
                    // Nota lunga: sempre la Fondamentale (grado 0)
                    const noteName = buildNote(currentScale[0], 5);
                    Tone.Transport.schedule(time => {
                        guitarLead.triggerAttackRelease(noteName, "2n", time);
                    }, blockStartTime);
                }
            }
        }
    }
}
