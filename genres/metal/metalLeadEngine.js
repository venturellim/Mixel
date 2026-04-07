// metalLeadEngine.js — ver. 002

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 003 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead, keyboardLead, keyboardPad } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;

    // --- 🧬 DNA DATABASE: Maschere Ritmiche Multiple ---
    const library = {
        intro: [
            [0, 4, 8, 12],          // Standard Eroico
            [0, 2, 4, 8, 10, 12],   // Incalzante
            [0, 6, 8, 14],          // Sincopato Power
            [0, 8]                  // Solenne (note lunghe)
        ],
        verse: [
            [0, 8],                 // Minimalista (lascia spazio alla voce)
            [0, 4, 8, 12],          // Battuto
            [0, 6, 10],             // Irregolare
            [2, 6, 10, 14]          // Off-beat (in levare)
        ],
        chorus: [
            [0, 2, 4, 6, 8, 10, 12, 14], // Cavalcata di ottavi
            [0, 3, 6, 8, 11, 14],        // Terzinato / Poliritmico
            [0, 4, 8, 12],               // Quarti granitici
            [0, 7, 8, 15]                // Sincopato epico
        ]
    };

    // --- 🧠 LOGICA DI SELEZIONE BASATA SULLA FOTO ---
    // Usiamo parametri diversi per mescolare le carte
    const brightness = params?.imageParams?.brightness ?? 0.5;
    const saturation = params?.imageParams?.saturation ?? 0.5;
    
    const getPattern = (type) => {
        const family = library[type];
        // La luminosità sceglie il pattern, la saturazione può influenzare altro
        const idx = Math.floor(brightness * family.length) % family.length;
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

    const buildNote = (noteName, octave) => normalizeNote(noteName, "guitarLead") + octave;

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentRoot = progression[m % progression.length] || "A";
        const currentScale = getStrictScale(currentRoot);

        // --- APPLICAZIONE MASCHERA DINAMICA ---
        if (!isSolo) {
            const type = isIntro ? "intro" : (isChorus ? "chorus" : "verse");
            const pattern = getPattern(type);

            pattern.forEach((s, i) => {
                const absoluteTime = measureStartTime + (s * stepTime);
                
                // Variazione Melodica: la saturazione decide se fare salti di ottava o note fisse
                const octave = (isChorus && saturation > 0.7 && i % 2 === 0) ? 6 : (isChorus ? 5 : 4);
                
                // Scelta della nota basata sull'indice del pattern per coerenza
                const noteIdx = [0, 2, 4, 0, 5, 4, 2, 0][i % 8];
                const noteName = buildNote(currentScale[noteIdx], octave);

                Tone.Transport.schedule(time => {
                    const dur = isChorus ? "4n" : "2n";
                    guitarLead.triggerAttackRelease(noteName, dur, time);
                    if ((isChorus || isIntro) && keyboardPad) {
                        keyboardPad.triggerAttackRelease(noteName, dur, time, 0.3);
                    }
                }, absoluteTime);
            });
        }

        // --- SOLO: VARIABILE PER NATURA ---
        else {
            let scaleIdx = Math.floor(rand() * 7);
            // La densità del solo dipende dalla saturazione della foto
            const density = 0.3 + (saturation * 0.4); 

            for (let s = 0; s < 16; s++) {
                const isDownbeat = s % 4 === 0;
                if (isDownbeat || rand() < density) {
                    const absoluteTime = measureStartTime + (s * stepTime);
                    scaleIdx = (scaleIdx + (rand() > 0.5 ? 1 : -1) + 7) % 7;
                    const soloNote = buildNote(currentScale[scaleIdx], s > 8 ? 5 : 4);

                    Tone.Transport.schedule(time => {
                        try {
                            const dur = isDownbeat ? "8n" : "16n";
                            guitarLead.triggerAttackRelease(soloNote, dur, time);
                            if (keyboardLead && s % 2 === 0) keyboardLead.triggerAttackRelease(soloNote, "8n", time, 0.2);
                        } catch(e) {}
                    }, absoluteTime);
                }
            }
        }
    }
}
