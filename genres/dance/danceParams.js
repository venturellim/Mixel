// danceParams.js — ver. 010 (soglie per foto reali)
console.log("danceParams.js ver. 010 loaded");

export function buildDanceParams(rand, globalParams, rhythmParams) {
    let intensity = parseFloat(globalParams?.intensity);
    let mood = parseFloat(globalParams?.mood);
    let complexity = parseFloat(globalParams?.complexity);
    
    if (isNaN(intensity)) intensity = 0.5;
    if (isNaN(mood)) mood = 0.5;
    if (isNaN(complexity)) complexity = 0.5;
    
    const imageBpm = rhythmParams?.tempoProfile || 130;
    let bpm;
    if (imageBpm <= 130) bpm = 130;
    else if (imageBpm >= 150) bpm = 150;
    else bpm = 140;
    
    const tonalCenter = rhythmParams?.tonalCenter || "C4";
    const scaleType = rhythmParams?.scaleProfile || "naturalMinor";
    
    let style;
    let compositionMode;
    
    console.log(`🔍 Valori: intensity=${intensity.toFixed(3)}, mood=${mood.toFixed(3)}, complexity=${complexity.toFixed(3)}`);
    
    // GIGI: mood basso (foto scure)
    if (mood < 0.35) {
        style = "Gigi";
        compositionMode = "dream";
    }
    // EIFFEL65: alta complessità
    else if (complexity > 0.65) {
        style = "Eiffel65";
        compositionMode = "robotic";
    }
    // GABRY PONTE: mood alto (foto luminose)
    else if (mood > 0.55) {
        style = "GabryPonte";
        compositionMode = "anthem";
    }
    // PREZIOSO: default
    else {
        style = "Prezioso";
        compositionMode = "rhythmic";
    }
    
    console.log(`🎧 STILE SCELTO: ${style} (${compositionMode})`);
    
    return {
        tonalCenter,
        scaleType,
        bpm,
        compositionMode,
        style,
        kickIntensity: 0.8,
        bassEnergy: 0.7,
        leadDensity: 0.6,
        fxIntensity: 0.5
    };
}