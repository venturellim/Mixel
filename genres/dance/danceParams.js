// danceParams.js — ver. 012 (usa tutti i parametri)
console.log("danceParams.js ver. 012 loaded");

export function buildDanceParams(rand, globalParams, rhythmParams) {
    let intensity = parseFloat(globalParams?.intensity);
    let mood = parseFloat(globalParams?.mood);
    let complexity = parseFloat(globalParams?.complexity);
    let texture = parseFloat(globalParams?.texture);
    
    if (isNaN(intensity)) intensity = 0.5;
    if (isNaN(mood)) mood = 0.5;
    if (isNaN(complexity)) complexity = 0.5;
    if (isNaN(texture)) texture = 0.5;
    
    // Calcola un punteggio per ogni stile
    let scores = {
        Gigi: 0,
        Prezioso: 0,
        Eiffel65: 0,
        GabryPonte: 0
    };
    
    // GIGI: bassa intensità, mood basso, texture bassa
    scores.Gigi = (1 - intensity) * 0.4 + (1 - mood) * 0.3 + (1 - texture) * 0.3;
    
    // PREZIOSO: valori medi (equilibrio)
    const midIntensity = 1 - Math.abs(intensity - 0.5) * 2;
    const midMood = 1 - Math.abs(mood - 0.5) * 2;
    const midComplexity = 1 - Math.abs(complexity - 0.5) * 2;
    scores.Prezioso = midIntensity * 0.4 + midMood * 0.3 + midComplexity * 0.3;
    
    // EIFFEL65: alta complessità, alta texture
    scores.Eiffel65 = complexity * 0.5 + texture * 0.5;
    
    // GABRY PONTE: alta intensità, mood alto
    scores.GabryPonte = intensity * 0.5 + mood * 0.5;
    
    console.log("🎧 Punteggi stili:", {
        Gigi: scores.Gigi.toFixed(3),
        Prezioso: scores.Prezioso.toFixed(3),
        Eiffel65: scores.Eiffel65.toFixed(3),
        GabryPonte: scores.GabryPonte.toFixed(3)
    });
    
    // Trova il massimo
    let style = "Prezioso";
    let maxScore = scores.Prezioso;
    
    if (scores.Gigi > maxScore) {
        style = "Gigi";
        maxScore = scores.Gigi;
    }
    if (scores.Eiffel65 > maxScore) {
        style = "Eiffel65";
        maxScore = scores.Eiffel65;
    }
    if (scores.GabryPonte > maxScore) {
        style = "GabryPonte";
        maxScore = scores.GabryPonte;
    }
    
    const bpmRaw = rhythmParams?.tempoProfile || 130;
    let bpm;
    if (bpmRaw <= 130) bpm = 130;
    else if (bpmRaw >= 150) bpm = 150;
    else bpm = 140;
    
    const tonalCenter = rhythmParams?.tonalCenter || "C4";
    const scaleType = rhythmParams?.scaleProfile || "naturalMinor";
    
    let compositionMode = {
        Gigi: "dream",
        Prezioso: "rhythmic",
        Eiffel65: "robotic",
        GabryPonte: "anthem"
    }[style];
    
    console.log(`🎧 STILE SCELTO: ${style} (score: ${maxScore.toFixed(3)})`);
    
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