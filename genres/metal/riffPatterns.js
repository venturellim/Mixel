// riffPatterns.js — versione 002
// Pattern power metal musicali, meno densi, più ariosi

console.log("riffPatterns.js ver. 003 loaded");

export const riffPatterns = {

    // ============================================================
    // INTRO — epica, ariosa, spazio per lead
    // ============================================================
    intro: [
        "open_strike_quarter",
        "open_half_time",
        "open_epic",
        "pm_sparse"
    ],

    // ============================================================
    // VERSE — groove, palm mute lenti, spazio per voce
    // ============================================================
    verse: [
        "pm_groove",
        "pm_half_time",
        "pm_sparse"
    ],

    // ============================================================
    // PRE-CHORUS — build-up, tensione
    // ============================================================
    prechorus: [
        "open_strike_eighth",
        "pedal",
        "pedal_syncopated",
        "pm_groove"
    ],

    // ============================================================
    // CHORUS — aperto, epico, power metal
    // ============================================================
    chorus: [
        "open_strike_quarter",
        "open_epic",
        "open_drive",
        "open_sustain"
    ],

    // ============================================================
    // SOLO — melodico, 8n, niente mitragliatrice
    // ============================================================
    solo: [
        "melodic_8n",
        "melodic_open",
        "pm_support"
    ],

    // ============================================================
    // OUTRO — rilassato, half-time
    // ============================================================
    outro: [
        "open_strike_quarter",
        "open_half_time",
        "pm_half_time",
        "gallop_light"
    ]
};

// ============================================================
// 🎨 Scelta pattern basata sull’immagine
// (stessa logica, ma con pattern nuovi)
// ============================================================

export function chooseRiffPattern(sectionName, imageParams, rand) {
    const list = riffPatterns[sectionName];
    if (!list) return "pm_half_time";

    const brightness = imageParams?.brightness ?? 0.5;
    const energy = imageParams?.energy ?? 0.5;
    const complexity = imageParams?.complexity ?? 0.5;

    if (sectionName === "chorus") {
        if (brightness > 0.6) return "open_epic";
        if (complexity > 0.6) return "open_drive";
        return "open_sustain";
    }

    if (sectionName === "verse") {
        if (energy > 0.6) return "pm_groove";
        if (brightness < 0.3) return "pm_half_time";
        return "pm_sparse";
    }

    if (sectionName === "intro") {
        if (brightness > 0.6) return "open_epic";
        return "open_half_time";
    }

    if (sectionName === "solo") {
        if (complexity > 0.6) return "melodic_8n";
        return "melodic_open";
    }

    return list[Math.floor(rand() * list.length)];
}
