// metalTheory.js — ver. 004
// Sistema armonico centrale, vincolo: SOLO note naturali C2–B2

import * as Tone from "https://esm.sh/tone";

console.log("metalTheory.js ver. 004 loaded");

// ============================================================
// 1) PROGRESSIONI (in gradi)
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
// 2) SCELTA PROGRESSIONE (influenzata da brightness)
// ============================================================

export function chooseProgression(sectionName, imageParams, rand) {
    const list = progressions[sectionName];
    if (!list) return ["I"];

    const brightness = imageParams?.brightness ?? 0.5;

    const major = list.filter(p => p[0] === "I");
    const minor = list.filter(p => p[0] === "i");

    let pool;

    if (brightness < 0.33) {
        // immagini scure → preferenza minore
        pool = minor.length > 0 ? minor : list;
    } else if (brightness > 0.66) {
        // immagini luminose → preferenza maggiore
        pool = major.length > 0 ? major : list;
    } else {
        // immagini medie → tutte
        pool = list;
    }

    const idx = Math.floor(rand() * pool.length);
    return pool[idx];
}

// ============================================================
// 3) GRADO → ROOT (SOLO C2–B2 naturali)
// ============================================================
//
// Ignoriamo alterazioni teoriche e mappiamo i gradi
// su un set fisso di note naturali C2–B2.
//

const degreeToNoteMap = {
    // maggiore (centrato su C)
    "I":   "C2",
    "ii":  "D2",
    "iii": "E2",
    "IV":  "F2",
    "V":   "G2",
    "vi":  "A2",
    "VII°":"B2",

    // minore (centrato su A)
    "i":   "A2",
    "ii°": "B2",
    "III":"C2",
    "iv": "D2",
    "v":  "E2",
    "VI": "F2",
    "VII":"G2",

    // bVII: niente bemolle → usiamo G2 come colore "eroico"
    "bVII":"G2"
};

export function degreeToRoot(degree, tonalCenter) {
    // tonalCenter non viene usato perché i sample sono fissi C2–B2
    return degreeToNoteMap[degree] ?? "C2";
}

// ============================================================
// 4) GENERATORE COMPLETO PER TUTTE LE SEZIONI
// ============================================================

export function generateSongProgressions(structure, imageParams, tonalCenter, rand) {

    const result = {};

    structure.sections.forEach((section) => {

        const prog = chooseProgression(section.name, imageParams, rand);

        // per il riff usiamo il PRIMO grado come root della sezione
        const degree = prog[0];
        const root = degreeToRoot(degree, tonalCenter);

        result[section.name] = {
            progression: prog,
            degree,
            root
        };
    });
    
    console.log("[HARMONY]", songProgressions);

    return result;
}
