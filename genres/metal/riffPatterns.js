// riffPatterns.js — versione 002
// Pattern power metal musicali, meno densi, più ariosi

console.log("riffPatterns.js ver. 005 loaded");

export const riffPatterns = {

    // ============================================================
    // INTRO — epica, ariosa, spazio per lead
    // ============================================================
    intro: [
        "open_strike_quarter",
        "intro_stratovarius",
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
        "intro_stratovarius",
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

    // Normalizziamo i parametri immagine in modo morbido
    const brightness = imageParams?.brightness ?? 0.5;
    const energy     = imageParams?.energy     ?? 0.5;
    const complexity = imageParams?.complexity ?? 0.5;

    // Funzione di utilità: scelta pesata
    function weightedChoice(options) {
        const total = options.reduce((s, o) => s + o.weight, 0);
        let r = rand() * total;
        for (const o of options) {
            if (r < o.weight) return o.value;
            r -= o.weight;
        }
        return options[options.length - 1].value;
    }

    // ============================================================
    // INTRO — ariosa, ma influenzata dall'immagine
    // ============================================================
    if (sectionName === "intro") {
        return weightedChoice([
            { value: "open_epic",          weight: brightness * 1.5 },
            { value: "open_half_time",     weight: 1.0 },
            { value: "intro_stratovarius", weight: complexity * 1.2 },
            { value: "pm_sparse",          weight: (1 - brightness) * 0.8 }
        ]);
    }

    // ============================================================
    // VERSE — groove, ma dinamico
    // ============================================================
    if (sectionName === "verse") {
        return weightedChoice([
            { value: "pm_groove",      weight: energy * 1.5 },
            { value: "pm_half_time",   weight: (1 - brightness) * 1.2 },
            { value: "pm_sparse",      weight: 1.0 },
            { value: "pedal",          weight: complexity * 0.8 }
        ]);
    }

    // ============================================================
    // PRE-CHORUS — build-up
    // ============================================================
    if (sectionName === "prechorus") {
        return weightedChoice([
            { value: "pedal",             weight: energy * 1.3 },
            { value: "pedal_syncopated",  weight: complexity * 1.4 },
            { value: "pm_groove",         weight: brightness * 0.8 },
            { value: "open_strike_eighth",weight: 1.0 }
        ]);
    }

    // ============================================================
    // CHORUS — aperto, epico
    // ============================================================
    if (sectionName === "chorus") {
        return weightedChoice([
            { value: "open_epic",        weight: brightness * 1.8 },
            { value: "open_drive",       weight: complexity * 1.4 },
            { value: "open_sustain",     weight: 1.0 },
            { value: "open_strike_quarter", weight: energy * 0.8 }
        ]);
    }

    // ============================================================
    // SOLO — melodico
    // ============================================================
    if (sectionName === "solo") {
        return weightedChoice([
            { value: "melodic_8n",   weight: complexity * 1.6 },
            { value: "melodic_open", weight: brightness * 1.2 },
            { value: "pm_support",   weight: (1 - energy) * 0.8 }
        ]);
    }

    // ============================================================
    // OUTRO — rilassato
    // ============================================================
    if (sectionName === "outro") {
        return weightedChoice([
            { value: "open_half_time",     weight: 1.2 },
            { value: "pm_half_time",       weight: (1 - brightness) * 1.4 },
            { value: "gallop_light",       weight: energy * 1.0 },
            { value: "intro_stratovarius", weight: complexity * 0.8 }
        ]);
    }

    // fallback
    return list[Math.floor(rand() * list.length)];
}
