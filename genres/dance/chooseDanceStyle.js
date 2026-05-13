// chooseDanceStyle.js — ver. 001
console.log("chooseDanceStyle.js ver. 001 loaded");

export function chooseDanceStyle(dna, globalParams) {
    const { intensity = 0.5, mood = 0.5, complexity = 0.5 } = globalParams || {};

    // Seme semplice
    const seed = (dna % 1000) / 1000;

    // Cluster stile
    // Gigi: low intensity, low complexity
    // Prezioso: medium intensity, medium complexity
    // Eiffel: high complexity, medium/high intensity
    // Gabry: bright/mood alto, intensità medio-alta
    let style = "Prezioso";

    if (intensity < 0.4 && complexity < 0.5) {
        style = "Gigi";
    } else if (complexity > 0.65) {
        style = "Eiffel65";
    } else if (mood > 0.6 && intensity > 0.55) {
        style = "GabryPonte";
    }

    // Piccola variazione randomica controllata
    if (seed > 0.85) {
        if (style === "Gigi") style = "Prezioso";
        else if (style === "Prezioso") style = "GabryPonte";
        else if (style === "GabryPonte") style = "Eiffel65";
    }

    console.log("🎛 Dance style scelto:", style);
    return style;
}
