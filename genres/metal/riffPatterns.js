// riffPatterns.js
// Pattern ritmici power metal (stile Stratovarius)

console.log("riffPatterns.js ver. 001 loaded");

export const riffPatterns = {

    intro: [
        "pm_continuous",
        "gallop",
        "pedal"
    ],

    verse: [
        "gallop",
        "pm_continuous",
        "syncopated_pm"
    ],

    prechorus: [
        "pedal",
        "pedal_syncopated",
        "pm_build"
    ],

    chorus: [
        "open_sustain",
        "open_accent",
        "open_syncopated"
    ],

    solo: [
        "melodic_open",
        "melodic_fast",
        "pm_support"
    ],

    outro: [
        "pm_simple",
        "gallop_light"
    ]
};

// ============================================================
// 🎨 Scelta pattern basata sull’immagine
// ============================================================
//
// imageParams:
// - brightness
// - saturation
// - contrast
// - energy
// - warmness
// - complexity
//
// Logica semplice ma efficace:
// - immagini luminose → pattern più aperti
// - immagini scure → più palm mute
// - immagini energiche → gallop
// - immagini complesse → pattern sincopati
//

export function chooseRiffPattern(sectionName, imageParams, rand) {
    const list = riffPatterns[sectionName];
    if (!list) return "pm_continuous";

    const brightness = imageParams?.brightness ?? 0.5;
    const energy = imageParams?.energy ?? 0.5;
    const complexity = imageParams?.complexity ?? 0.5;

    // Esempio di logica:
    if (sectionName === "chorus") {
        if (brightness > 0.6) return "open_sustain";
        if (complexity > 0.6) return "open_syncopated";
        return "open_accent";
    }

    if (sectionName === "verse") {
        if (energy > 0.6) return "gallop";
        if (brightness < 0.3) return "pm_continuous";
        return "syncopated_pm";
    }

    if (sectionName === "prechorus") {
        if (complexity > 0.6) return "pedal_syncopated";
        return "pedal";
    }

    // fallback generico
    return list[Math.floor(rand() * list.length)];
}
