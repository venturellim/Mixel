// metalLeadEngine.js — ver. 066 (The Melodic Evolution)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 006.1 loaded");

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isChorus = name.includes("chorus") && !name.includes("pre");
    const isPreChorus = name.includes("pre");
    const isIntro = name.includes("intro") || name.includes("outro");
    const isSolo = name.includes("solo") || name.includes("bridge");
    const stepTime = measureDur / 16;
    const { energy = 0.5, brightness = 0.5, texture = 0.5, complexity = 0.5 } = params?.imageParams || {};

    // --- 🧬 LIBRERIA MASCHERE RITMICHE (Quando suonare) ---
    const library = {
        intro: [
            [0, 1, 2, 3, 4, 8, 12],
            [0, 4, 8, 10, 11, 12, 13, 14],
            [0, 2, 3, 4, 8, 10, 11, 12],
            [0, 3, 4, 7, 8, 11, 12, 15],
            [0, 1, 2, 3, 4, 5, 6, 7, 8]
        ],
        verse: [
            [0, 8],
            [0, 4, 8, 12],
            [0, 6, 8, 14],
            [0, 4, 10],
            [2, 6, 10, 14],
            [0, 2, 4, 8, 10, 12]
        ],
        prechorus: [
            [0, 4, 8, 12],
            [0, 2, 4, 6, 8, 10, 12, 14],
            [0, 4, 7, 11, 12],
            [0, 8, 12, 14],
            [0, 2, 4, 8, 10, 12]
        ],
        chorus: [
            [0, 2, 4, 6, 8, 10, 12, 14],
            [0, 8, 12],
            [0, 4, 8, 12],
            [0, 3, 8, 11],
            [0, 6, 7, 8, 14]
        ]
    };

    // --- 🧬 LIBRERIA MELODICA (Cosa suonare - 32 combinazioni) ---
    const melodicLibrary = {
        epic: [
            [0, 4, 7, 4, 5, 4, 2, 0], [0, 0, 4, 4, 7, 7, 4, 4], 
            [0, 4, 5, 7, 0, 4, 5, 7], [7, 4, 0, 4, 7, 4, 0, 0], 
            [0, 2, 4, 7, 5, 4, 2, 0], [0, 7, 4, 2, 0, 4, 2, 0],
            [4, 0, 4, 5, 7, 5, 4, 0], [0, 3, 5, 0, 3, 5, 7, 0]
        ],
        evil: [
            [0, 1, 0, 1, 4, 3, 1, 0], [0, 6, 5, 0, 6, 5, 1, 0], 
            [0, 1, 4, 1, 0, 1, 4, 1], [0, 3, 4, 0, 3, 4, 6, 0], 
            [1, 0, 1, 0, 3, 1, 0, 0], [0, 1, 3, 4, 6, 4, 3, 1],
            [0, 4, 3, 1, 0, 1, 3, 4], [6, 5, 4, 3, 2, 1, 0, 0]
        ],
        active: [
            [0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 4, 2, 3, 5, 7, 5], 
            [0, 2, 0, 4, 0, 5, 0, 7], [4, 0, 5, 0, 7, 0, 5, 0], 
            [0, 2, 4, 5, 7, 5, 4, 2], [0, 3, 2, 5, 4, 7, 6, 0],
            [7, 5, 4, 2, 7, 5, 4, 2], [0, 7, 6, 7, 0, 5, 4, 5]
        ],
        emotional: [
            [0, 6, 5, 4, 2, 3, 2, 0], [2, 3, 2, 0, 4, 5, 4, 2], 
            [4, 2, 0, 6, 5, 4, 2, 2], [0, 4, 6, 7, 6, 4, 2, 0], 
            [5, 4, 2, 0, 5, 4, 2, 0], [0, 2, 4, 6, 0, 2, 4, 6],
            [4, 5, 7, 4, 2, 3, 2, 0], [0, 0, 6, 6, 5, 5, 4, 4]
        ],
        prechorus: [
            [0, 2, 3, 4, 5, 6, 7, 7], [0, 0, 2, 2, 4, 4, 6, 6], 
            [0, 4, 0, 5, 0, 6, 0, 7], [4, 5, 4, 5, 6, 7, 7, 7]
        ]
    };

    // --- ⚙️ SELEZIONE LOGICA BASATA SUI PARAMETRI ---
    const getPattern = (type) => {
        const family = library[type] || library.verse;
        const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
        const index = Math.floor(Math.abs(dnaScore)) % family.length;
        return family[index];
    };

    const getMelodyFamily = () => {
        if (isPreChorus) return { name: "PRE-CHORUS 📈", data: melodicLibrary.prechorus };
        if (isChorus) {
            return brightness > 0.5 
                ? { name: "EPIC 🏰", data: melodicLibrary.epic } 
                : { name: "EMOTIONAL 💧", data: melodicLibrary.emotional };
        }
        if (energy > 0.7 && texture > 0.6) return { name: "EVIL 😈", data: melodicLibrary.evil };
        if (complexity > 0.7) return { name: "ACTIVE ⚡", data: melodicLibrary.active };
        if (brightness < 0.4) return { name: "EMOTIONAL 💧", data: melodicLibrary.emotional };
        return { name: "EPIC 🏰", data: melodicLibrary.epic };
    };

    const sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse"));
    const currentPattern = getPattern(sectionType);
    const mood = getMelodyFamily();
    const currentMelody = mood.data[Math.floor(energy * mood.data.length) % mood.data.length];

    // --- 📊 DEBUG LOG ---
    if (!isSolo) {
        console.log(
            `%c 🎸 LEAD DNA EXECUTION \n` +
            `%c > Section: ${name.toUpperCase()} \n` +
            `%c > Mood: ${mood.name} \n` +
            `%c > Rhythm Mask: [${currentPattern.join(" - ")}] \n` +
            `%c > Melody Steps: [${currentMelody.join(", ")}]`,
            "color: #191970; font-weight: bold; font-size: 12px;",
            "color: #191970;",
            "color: #eee; font-weight: bold;",
            "color: #191970;",
            "color: #191970;"
        );
    }

    // --- 🎼 SCALA MUSICALE ---
    const getStrictScale = (root) => {
        const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
        let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
        let isMinor = root.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
        cleanRoot = cleanRoot.toUpperCase();
        const altNames = { "DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#", "BB": "A#" };
        cleanRoot = altNames[cleanRoot] || cleanRoot;
        let rootIdx = allNotes.indexOf(cleanRoot);
        if (rootIdx === -1) rootIdx = 9; // Default A
        const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
        return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
    };

    // --- 🚀 SCHEDULAZIONE NOTE ---
    for (let m = 0; m < section.measures; m++) {
        const measureStartTime = section.startTime + (m * measureDur);
        const currentScale = getStrictScale(progression[m % progression.length] || "A");
        const isTransitionMeasure = (m === section.measures - 1);

        if (!isSolo) {
            currentPattern.forEach((s, i) => {
                // Transizione intelligente: stop della chitarra per fill di rullante
                if (isTransitionMeasure && s > 13 && energy > 0.6) return;

                const absoluteTime = measureStartTime + (s * stepTime);
                const nextStep = (i < currentPattern.length - 1) ? currentPattern[i + 1] : 16;
                const noteIdx = currentMelody[i % currentMelody.length];
                const octave = isChorus ? 5 : 4;
                const noteName = normalizeNote(currentScale[noteIdx % 7], "guitarLead") + octave;

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, (nextStep - s) * stepTime, time);
                    
                // Visivo (Score)
                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", noteName, section.name);
                    }, time);
                }, absoluteTime);
            });
        } else {
    // --- 🎸 ASSOLO VERO (melodico + tecnico) ---
    const soloPatterns = [
        // Scala ascendente
        [0, 2, 3, 5, 7, 8, 10, 12],
        // Scala discendente
        [12, 10, 8, 7, 5, 3, 2, 0],
        // Arpeggio triadico
        [0, 4, 7, 12, 7, 4, 0, 12],
        // Pattern "power metal"
        [0, 7, 4, 9, 7, 12, 9, 14],
        // Frase melodica
        [0, 2, 4, 7, 5, 4, 2, 0]
    ];

    const solo = soloPatterns[Math.floor(rand() * soloPatterns.length)];

    for (let i = 0; i < solo.length; i++) {
        const s = i * 2; // 8th notes
        const absoluteTime = measureStartTime + (s * stepTime);
        const idx = solo[i] % currentScale.length;
        const note = normalizeNote(currentScale[idx], "guitarLead") + 5;

        Tone.Transport.schedule(time => {
            guitarLead.triggerAttackRelease(note, "8n", time);

            Tone.Draw.schedule(() => {
                if (score) score.addNote("Lead", note, section.name + " SOLO");
            }, time);
        }, absoluteTime);
    }
}

    }
}
