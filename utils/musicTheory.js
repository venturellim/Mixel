// musicTheory.js — ver. 002 (DYNAMIC PROGRESSIONS & MULTI-LENGTH)
import * as Tone from "https://esm.sh/tone";

console.log("musicTheory.js ver. 002 loaded - Dynamic Harmony Active");

// ============================================================
// 1) DATABASE PROGRESSIONI (Gradi: I-VII Maggiore, i-vii Minore)
// ============================================================
export const progressions = {
    intro: [
        ["i", "VI", "III", "VII"],          // Classic Power 4
        ["i", "iv", "v"],                   // Folk/Prog 3
        ["i", "VI", "VII"],                 // Epic 3
        ["i", "VI", "III", "VII", "i", "iv", "v", "v"], // Long Epic 8
        ["I", "V", "vi", "IV"]              // Bright Intro 4
    ],
    verse: [
        ["i", "VII"],                       // Minimal 2
        ["i", "VII", "VI", "VII"],          // Maiden Style 4
        ["i", "v", "VI", "III"],            // Melodic 4
        ["i", "iv", "i", "v", "i", "VI", "VII", "v"], // Complex Verse 8
        ["vi", "IV", "I", "V"]              // Pop-Metal 4
    ],
    prechorus: [
        ["iv", "V"],                        // Tension 2
        ["i", "III", "iv", "V"],            // Build-up 4
        ["VI", "VII", "i"],                 // Ascending 3
        ["iv", "V", "VI", "v", "iv", "V"]   // Long Pre 6
    ],
    chorus: [
        ["I", "V", "vi", "IV"],             // Anthem 4
        ["I", "III", "VI", "IV"],           // Romantic 4
        ["i", "VI", "III", "VII"],          // Minor Anthem 4
        ["I", "V", "vi", "IV", "I", "V", "IV", "V"], // Grand Chorus 8
        ["I", "bVII", "IV"]                 // Rock feel 3
    ],
    solo: [
        ["i", "VII", "VI", "VII"],          // Shred Loop 4
        ["i", "v"],                         // Dark Loop 2
        ["i", "III", "VII", "VI"],          // Neo-classical 4
        ["i", "iv", "v", "VI", "VII", "i"]  // Scale climb 6
    ],
    outro: [
        ["i", "iv", "i", "VII"],            // Melancholy 4
        ["I", "IV"],                        // Bright Fade 2
        ["i", "VI", "VII", "i"]             // Finality 4
    ]
};

// ============================================================
// 2) MAPPA GRADI → NOTE NATURALI (C2-B2)
// ============================================================
const degreeToNoteMap = {
    "I": "C2", "ii": "D2", "iii": "E2", "IV": "F2", "V": "G2", "vi": "A2", "VII°": "B2", // Maggiori
    "i": "A2", "ii°": "B2", "III": "C2", "iv": "D2", "v": "E2", "VI": "F2", "VII": "G2", // Minori
    "bVII": "G2"
};

export function degreeToRoot(degree) {
    return degreeToNoteMap[degree] ?? "C2";
}

// ============================================================
// 3) SCELTA PROGRESSIONE (Basata su Brightness e Complexity)
// ============================================================
export function chooseProgression(sectionName, imageParams, rand) {
    const list = progressions[sectionName] || [["i"]];
    const brightness = imageParams?.brightness ?? 0.5;
    const complexity = imageParams?.complexity ?? 0.5;

    // Filtriamo per "Mood" (Maggiore/Minore) usando il primo grado
    const major = list.filter(p => p[0].toUpperCase() === p[0] && p[0] !== "i");
    const minor = list.filter(p => p[0].toLowerCase() === p[0] || p[0] === "i");

    let moodPool;
    if (brightness < 0.35) moodPool = minor.length > 0 ? minor : list;
    else if (brightness > 0.65) moodPool = major.length > 0 ? major : list;
    else moodPool = list;

    // Filtriamo per "Lunghezza" (Complexity)
    // Se complexity è bassa (<0.4), preferiamo giri da 2 o 3 note.
    // Se complexity è alta (>0.7), preferiamo giri da 6 o 8 note.
    let finalPool;
    if (complexity < 0.4) {
        finalPool = moodPool.filter(p => p.length <= 4);
    } else if (complexity > 0.7) {
        finalPool = moodPool.filter(p => p.length >= 4);
    } else {
        finalPool = moodPool;
    }

    // Fallback se i filtri svuotano il pool
    if (finalPool.length === 0) finalPool = moodPool;

    return finalPool[Math.floor(rand() * finalPool.length)];
}

// ============================================================
// 4) GENERATORE COMPLETO
// ============================================================
export function generateSongProgressions(structure, imageParams, tonalCenter, rand) {
    const result = {};

    structure.sections.forEach((section) => {
        const prog = chooseProgression(section.name, imageParams, rand);
        
        // Root della sezione basata sul primo accordo
        const degree = prog[0];
        const root = degreeToRoot(degree);

        result[section.name] = {
            progression: prog, // L'intero array (2, 3, 4, 6 o 8 note)
            degree,
            root: root[0] // Restituiamo solo la lettera (es. "A") per il RhythmEngine
        };
    });
    
    console.log("[HARMONY] Progressions Generated:", result);
    return result;
}
