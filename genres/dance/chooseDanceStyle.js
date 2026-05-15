// chooseDanceStyle.js — ver. 002 (legge lo stile da danceParams)
console.log("chooseDanceStyle.js ver. 002 loaded");

export function chooseDanceStyle(dna, globalParams, danceParams) {
    // Se danceParams ha già uno stile, usalo
    if (danceParams?.style) {
        console.log(`🎛 Dance style da danceParams: ${danceParams.style}`);
        return danceParams.style;
    }
    
    // Fallback: usa i parametri globali come prima
    const { intensity = 0.5, mood = 0.5, complexity = 0.5 } = globalParams || {};
    const seed = (dna % 1000) / 1000;
    
    let style = "Prezioso";
    if (intensity < 0.4 && complexity < 0.5) style = "Gigi";
    else if (complexity > 0.65) style = "Eiffel65";
    else if (mood > 0.6 && intensity > 0.55) style = "GabryPonte";
    
    if (seed > 0.85) {
        if (style === "Gigi") style = "Prezioso";
        else if (style === "Prezioso") style = "GabryPonte";
        else if (style === "GabryPonte") style = "Eiffel65";
    }
    
    console.log(`🎛 Dance style scelto (fallback): ${style}`);
    return style;
}