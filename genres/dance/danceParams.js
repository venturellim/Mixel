// danceParams.js — ver. 014 (BPM più estremi)
console.log("danceParams.js ver. 014 loaded");

export function buildDanceParams(rand, globalParams, rhythmParams) {
    let intensity = parseFloat(globalParams?.intensity);
    let mood = parseFloat(globalParams?.mood);
    let complexity = parseFloat(globalParams?.complexity);
    let texture = parseFloat(globalParams?.texture);
    
    if (isNaN(intensity)) intensity = 0.5;
    if (isNaN(mood)) mood = 0.5;
    if (isNaN(complexity)) complexity = 0.5;
    if (isNaN(texture)) texture = 0.5;
    
    // BPM dalla foto (90-160)
    const rawBpm = rhythmParams?.tempoProfile || 130;
    const bpmNormalized = (rawBpm - 90) / 70;
    const bpmClamped = Math.min(1, Math.max(0, bpmNormalized));
    
    // ✅ NUOVO: BPM dance con range più ampio
    let bpm;
    if (rawBpm <= 110) bpm = 120;      // Lento
    else if (rawBpm <= 130) bpm = 135; // Medio-lento
    else if (rawBpm <= 150) bpm = 150; // Medio-veloce
    else bpm = 165;                     // Veloce
    
    console.log(`🔍 BPM originale: ${rawBpm} → Dance BPM: ${bpm}`);
    
    // Calcola punteggi
    let scores = {
        Gigi: 0,
        Prezioso: 0,
        Eiffel65: 0,
        GabryPonte: 0
    };
    
    // GIGI: lento, scuro, calmo
    scores.Gigi = (1 - intensity) * 0.3 + (1 - mood) * 0.25 + (1 - texture) * 0.25 + (1 - bpmClamped) * 0.2;
    
    // PREZIOSO: medio
    const midIntensity = 1 - Math.abs(intensity - 0.5) * 2;
    const midMood = 1 - Math.abs(mood - 0.5) * 2;
    const midComplexity = 1 - Math.abs(complexity - 0.5) * 2;
    const midBpm = 1 - Math.abs(bpmClamped - 0.5) * 2;
    scores.Prezioso = midIntensity * 0.3 + midMood * 0.25 + midComplexity * 0.25 + midBpm * 0.2;
    
    // EIFFEL65: complesso, texture, veloce
    scores.Eiffel65 = complexity * 0.35 + texture * 0.35 + bpmClamped * 0.3;
    
    // GABRY PONTE: energico, luminoso, veloce
    scores.GabryPonte = intensity * 0.35 + mood * 0.35 + bpmClamped * 0.3;
    
    console.log("🎧 Punteggi:", {
        Gigi: scores.Gigi.toFixed(3),
        Prezioso: scores.Prezioso.toFixed(3),
        Eiffel65: scores.Eiffel65.toFixed(3),
        GabryPonte: scores.GabryPonte.toFixed(3)
    });
    
    let style = "Prezioso";
    let maxScore = scores.Prezioso;
    if (scores.Gigi > maxScore) { style = "Gigi"; maxScore = scores.Gigi; }
    if (scores.Eiffel65 > maxScore) { style = "Eiffel65"; maxScore = scores.Eiffel65; }
    if (scores.GabryPonte > maxScore) { style = "GabryPonte"; maxScore = scores.GabryPonte; }
    
    const tonalCenter = rhythmParams?.tonalCenter || "C4";
    const scaleType = rhythmParams?.scaleProfile || "naturalMinor";
    
    let compositionMode = { Gigi: "dream", Prezioso: "rhythmic", Eiffel65: "robotic", GabryPonte: "anthem" }[style];
    
    console.log(`🎧 STILE: ${style} | BPM: ${bpm} | originale: ${rawBpm}`);
    
    return {
        tonalCenter,
        scaleType,
        bpm,
        compositionMode,
        style,
        kickIntensity: 0.8,
        bassEnergy: 0.7,
        leadDensity: 0.6,
        fxIntensity: 0.5,
        swing: 0.15 + complexity * 0.35

    };
}