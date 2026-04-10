// metalLeadEngine.js — ver. 066 (The Melodic Evolution)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 005 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, texture = 0.5, complexity = 0.5 } = params?.imageParams || {};

    // --- 🧬 LIBRERIA MASCHERE INTEGRALE ---
    const library = {
        intro: [
            [0, 1, 2, 3, 4, 8, 12], [0, 4, 8, 10, 11, 12, 13, 14], 
            [0, 2, 3, 4, 8, 10, 11, 12], [0, 3, 4, 7, 8, 11, 12, 15], 
            [0, 1, 2, 3, 4, 5, 6, 7, 8]
        ],
        verse: [
            [0, 8], [0, 4, 8, 12], [0, 6, 8, 14], 
            [0, 4, 10], [2, 6, 10, 14], [0, 2, 4, 8, 10, 12]
        ],
        prechorus: [
            [0, 4, 8, 12], [0, 2, 4, 6, 8, 10, 12, 14], 
            [0, 4, 7, 11, 12], [0, 8, 12, 14], [0, 2, 4, 8, 10, 12]
        ],
        chorus: [
            [0, 2, 4, 6, 8, 10, 12, 14], [0, 8, 12], 
            [0, 4, 8, 12], [0, 3, 8, 11], [0, 6, 7, 8, 14]
        ]
    };

    // --- 🧬 LIBRERIA MELODICA INTEGRALE (32 Combinazioni) ---
    const melodicLibrary = {
        epic: [
            [0, 4, 7, 4, 5, 4, 2, 0], [0, 0, 4, 4, 7, 7, 4, 4], [0, 4, 5, 7, 0, 4, 5, 7], 
            [7, 4, 0, 4, 7, 4, 0, 0], [0, 2, 4, 7, 5, 4, 2, 0], [0, 7, 4, 2, 0, 4, 2, 0],
            [4, 0, 4, 5, 7, 5, 4, 0], [0, 3, 5, 0, 3, 5, 7, 0]
        ],
        evil: [
            [0, 1, 0, 1, 4, 3, 1, 0], [0, 6, 5, 0, 6, 5, 1, 0], [0, 1, 4, 1, 0, 1, 4, 1],
            [0, 3, 4, 0, 3, 4, 6, 0], [1, 0, 1, 0, 3, 1, 0, 0], [0, 1, 3, 4, 6, 4, 3, 1],
            [0, 4, 3, 1, 0, 1, 3, 4], [6, 5, 4, 3, 2, 1, 0, 0]
        ],
        active: [
            [0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 4, 2, 3, 5, 7, 5], [0, 2, 0, 4, 0, 5, 0, 7],
            [4, 0, 5, 0, 7, 0, 5, 0], [0, 2, 4, 5, 7, 5, 4, 2], [0, 3, 2, 5, 4, 7, 6, 0],
            [7, 5, 4, 2, 7, 5, 4, 2], [0, 7, 6, 7, 0, 5, 4, 5]
        ],
        emotional: [
            [0, 6, 5, 4, 2, 3, 2, 0], [2, 3, 2, 0, 4, 5, 4, 2], [4, 2, 0, 6, 5, 4, 2, 2],
            [0, 4, 6, 7, 6, 4, 2, 0], [5, 4, 2, 0, 5, 4, 2, 0], [0, 2, 4, 6, 0, 2, 4, 6],
            [4, 5, 7, 4, 2, 3, 2, 0], [0, 0, 6, 6, 5, 5, 4, 4]
        ],
        prechorus: [
            [0, 2, 3, 4, 5, 6, 7, 7], [0, 0, 2, 2, 4, 4, 6, 6], 
            [0, 4, 0, 5, 0, 6, 0, 7], [4, 5, 4, 5, 6, 7, 7, 7]
        ]
    };

    const getPattern = (type) => {
        const family = library[type] || library.verse;
        let dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2) + (texture * 0.1);
        const finalScore = Math.floor(Math.abs(dnaScore) * (type === "chorus" ? 2.15 : 1.0));
        return family[finalScore % family.length] || family[0];
    };

    const getMelody = (type, secName) => {
        if (secName.includes("pre")) return melodicLibrary.prechorus[Math.floor(energy * melodicLibrary.prechorus.length) % melodicLibrary.prechorus.length];
        
        let family;
        if (secName.includes("chorus")) {
            family = brightness > 0.5 ? melodicLibrary.epic : melodicLibrary.emotional;
        } else {
            if (energy > 0.7 && texture > 0.6) family = melodicLibrary.evil;
            else if (complexity > 0.7) family = melodicLibrary.active;
            else if (brightness < 0.4) family = melodicLibrary.emotional;
            else family = melodicLibrary.epic;
        }
        return family[Math.floor(energy * family.length) % family.length] || family[0];
    };

    const getStrictScale = (root) => {
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
        let isMinor = root.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
        cleanRoot = cleanRoot.replace('m', '').toUpperCase();
        const altNames = { "DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#", "BB": "A#" };
        cleanRoot = altNames[cleanRoot] || cleanRoot;
        let rootIdx = allNotes.indexOf(cleanRoot);
        if (rootIdx === -1) rootIdx = 9;
        const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
        return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
    };

    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentScale = getStrictScale(progression[m % progression.length] || "A");
        const isTransitionMeasure = (m === section.measures - 1);

        if (!isSolo) {
            const type = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse"));
            const pattern = getPattern(type);
            const currentMelody = getMelody(type, name);
            
            pattern.forEach((s, i) => {
                if (isTransitionMeasure && s > 13 && energy > 0.6) return; // Stop per fill rullante

                const absoluteTime = measureStartTime + (s * stepTime);
                const nextStep = (i < pattern.length - 1) ? pattern[i + 1] : 16;
                const noteIdx = currentMelody[i % currentMelody.length];
                const octave = isChorus ? 5 : 4;
                const noteName = normalizeNote(currentScale[noteIdx % 7], "guitarLead") + octave;

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, (nextStep - s) * stepTime, time);
                }, absoluteTime);
            });
        } else {
            // Solo logic v0.58
            for (let block = 0; block < 4; block++) {
                const blockTime = measureStartTime + (block * 4 * stepTime);
                if (rand() > 0.4) {
                    for (let s = 0; s < 4; s++) {
                        const note = normalizeNote(currentScale[rand() > 0.5 ? 0 : 4], "guitarLead") + 5;
                        Tone.Transport.schedule(t => guitarLead.triggerAttackRelease(note, "16n", t), blockTime + (s * stepTime));
                    }
                } else {
                    const note = normalizeNote(currentScale[0], "guitarLead") + 5;
                    Tone.Transport.schedule(t => guitarLead.triggerAttackRelease(note, "2n", t), blockTime);
                }
            }
        }
    }
}
