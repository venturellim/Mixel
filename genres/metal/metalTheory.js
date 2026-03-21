// metalTheory.js — versione corretta

import * as Tone from "https://esm.sh/tone";

console.log("metalTheory.js ver. 003 loaded");

// ============================================================
// 1) PROGRESSIONI
// ============================================================

export const progressions = {
    intro: [
        ["I", "V", "vi", "IV"],
        ["i", "VI", "III", "VII"],
        ["i", "iv", "v", "i"],
    ],
    verse: [
        ["vi", "IV", "I", "V"],
        ["i", "VII", "VI", "VII"],
        ["i", "v", "VI", "III"],
    ],
    prechorus: [
        ["iv", "V", "VI", "V"],
        ["ii", "V", "iii", "VI"],
        ["i", "III", "iv", "V"],
    ],
    chorus: [
        ["I", "V", "vi", "IV"],
        ["I", "III", "VI", "IV"],
        ["I", "bVII", "IV", "I"],
    ],
    solo: [
        ["i", "VII", "VI", "VII"],
        ["i", "v", "i", "v"],
        ["i", "III", "VII", "VI"],
    ],
    outro: [
        ["I", "IV", "I", "V"],
        ["i", "iv", "i", "VII"],
        ["I", "V", "I", "V"],
    ]
};

// ============================================================
// 2) SCELTA PROGRESSIONE
// ============================================================

export function chooseProgression(sectionName, imageParams, rand) {
    const list = progressions[sectionName];
    if (!list) return ["I"];

    // Per ora: scelta completamente random
    const idx = Math.floor(rand() * list.length);

    return list[idx];
}

// ============================================================
// 3) GRADO → ROOT
// ============================================================

const degreeMap = {
    "I": 0, "ii": 2, "iii": 4,
    "IV": 5, "V": 7, "vi": 9,
    "VII°": 11,

    "i": 0, "ii°": 2, "III": 3,
    "iv": 5, "v": 7, "VI": 8, "VII": 10,

    "bVII": 10
};

export function degreeToRoot(degree, tonalCenter) {
    const semitones = degreeMap[degree] ?? 0;
    return Tone.Frequency(tonalCenter).transpose(semitones).toNote();
}

// ============================================================
// 4) GENERATORE COMPLETO
// ============================================================

export function generateSongProgressions(structure, imageParams, tonalCenter, rand) {

    const result = {};

    structure.sections.forEach((section) => {

        const prog = chooseProgression(section.name, imageParams, rand);

        // Ogni sezione usa il PRIMO grado della progressione
        const degree = prog[0];

        const root = degreeToRoot(degree, tonalCenter);

        result[section.name] = {
            progression: prog,
            degree,
            root
        };
    });

    return result;
}
