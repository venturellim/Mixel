// metalTheory.js
// Sistema armonico centrale per il motore power metal (stile Stratovarius)

import * as Tone from "https://esm.sh/tone";

console.log("metalTheory.js ver. 004 loaded");

// ============================================================
// 🎼 1) CATALOGO PROGRESSIONI (in gradi)
// ============================================================
// Tutte in stile power metal finlandese (Stratovarius / Sonata Arctica)

export const progressions = {

    intro: [
        ["I", "V", "vi", "IV"],      // luminoso, classico
        ["i", "VI", "III", "VII"],   // epico, drammatico
        ["i", "iv", "v", "i"],       // oscuro
    ],

    verse: [
        ["vi", "IV", "I", "V"],      // power metal standard
        ["i", "VII", "VI", "VII"],   // dark finlandese
        ["i", "v", "VI", "III"],     // epico
    ],

    prechorus: [
        ["iv", "V", "VI", "V"],      // build-up
        ["ii", "V", "iii", "VI"],    // tensione
        ["i", "III", "iv", "V"],     // drammatico
    ],

    chorus: [
        ["I", "V", "vi", "IV"],      // Stratovarius puro
        ["I", "III", "VI", "IV"],    // luminoso, aperto
        ["I", "bVII", "IV", "I"],    // eroico (Rhapsody-like)
    ],

    solo: [
        ["i", "VII", "VI", "VII"],   // neoclassico
        ["i", "v", "i", "v"],        // veloce
        ["i", "III", "VII", "VI"],   // melodico
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
// imageParams può contenere:
// - brightness
// - saturation
// - contrast
// - energy
// - warmness
// - complexity
//
// Per ora usiamo una logica semplice ma efficace:
// - immagini luminose → progressioni maggiori
// - immagini scure → progressioni minori
// - immagini molto colorate → progressioni più movimentate
// - immagini fredde → progressioni modali
//
// Puoi espandere questa logica quando vuoi.
//

export function chooseProgression(sectionName, imageParams, rand) {
    const list = progressions[sectionName];
    if (!list) return ["I"];

    // Esempio semplice: usa brightness per scegliere
    const brightness = imageParams?.brightness ?? 0.5;

    let idx = 0;

    if (brightness < 0.33) {
        // immagini scure → progressioni minori
        idx = 1 % list.length;
    } else if (brightness > 0.66) {
        // immagini luminose → progressioni maggiori
        idx = 0;
    } else {
        // immagini medie → progressioni intermedie
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
