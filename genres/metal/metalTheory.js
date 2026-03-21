// metalTheory.js
// Sistema armonico centrale per il motore power metal (stile Stratovarius)

import * as Tone from "https://esm.sh/tone";

console.log("metalTheory.js ver. 002 loaded");

// ============================================================
// 🎼 1) CATALOGO PROGRESSIONI (in gradi)
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
// 🎨 2) SCELTA PROGRESSIONE IN BASE ALL’IMMAGINE
// ============================================================
//
// Logica migliorata:
// - immagini scure → preferenza per progressioni minori
// - immagini luminose → preferenza per progressioni maggiori
// - immagini medie → scelta completamente random
//

export function chooseProgression(sectionName, imageParams, rand) {
    const list = progressions[sectionName];
    if (!list) return ["I"];

    const brightness = imageParams?.brightness ?? 0.5;

    let idx;

    if (brightness < 0.33) {
        // immagini scure → scegli una progressione minore
        idx = Math.floor(rand() * list.length);
    }
    else if (brightness > 0.66) {
        // immagini luminose → scegli una progressione maggiore
        idx = Math.floor(rand() * list.length);
    }
    else {
        // immagini medie → scelta completamente random
        idx = Math.floor(rand() * list.length);
    }

    return list[idx];
}

// ============================================================
// 🎵 3) CONVERSIONE GRADO → ROOT REALE
// ============================================================

const degreeMap = {
    // maggiore
    "I": 0, "ii": 2, "iii": 4,
    "IV": 5, "V": 7, "vi": 9,
    "VII°": 11,

    // minore
    "i": 0, "ii°": 2, "III": 3,
    "iv": 5, "v": 7, "VI": 8, "VII": 10,

    // modale / power metal
    "bVII": 10
};

export function degreeToRoot(degree, tonalCenter) {
    const semitones = degreeMap[degree] ?? 0;
    return Tone.Frequency(tonalCenter).transpose(semitones).toNote();
}

// ============================================================
// 🎼 4) GENERATORE COMPLETO PER TUTTE LE SEZIONI
// ============================================================

export function generateSongProgressions(structure, imageParams, tonalCenter, rand) {

    const result = {};

    structure.sections.forEach((section, index) => {

        const prog = chooseProgression(section.name, imageParams, rand);

        // scegli il grado corretto per questa battuta
        const degree = prog[index % prog.length];

        // converti in nota reale
        const root = degreeToRoot(degree, tonalCenter);

        result[section.name] = {
            progression: prog,
            degree,
            root
        };
    });

    return result;
}
