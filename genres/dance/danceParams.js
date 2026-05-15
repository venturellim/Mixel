// danceParams.js — ver. 005 (compositionMode guida lo stile)
console.log("danceParams.js ver. 005 loaded");

export function buildDanceParams(rand, globalParams, rhythmParams) {
    const intensity = globalParams?.intensity ?? 0.5;
    const mood = globalParams?.mood ?? 0.5;
    const complexity = globalParams?.complexity ?? 0.5;
    
    // BPM dalla foto (normalizzato)
    const imageBpm = rhythmParams?.tempoProfile || 130;
    let bpm;
    if (imageBpm <= 130) bpm = 130;
    else if (imageBpm >= 150) bpm = 150;
    else bpm = 140;
    
    // Tonal center e scala
    const tonalCenter = rhythmParams?.tonalCenter || "C4";
    const scaleType = rhythmParams?.scaleProfile || "naturalMinor";
    
    // DETERMINA LO STILE DANCE IN BASE AI PARAMETRI DELLA FOTO
    let compositionMode;
    let style;
    
    // GIGI D'AGOSTINO (dream/piano, emotive, bassa intensità)
    if (intensity < 0.45 && complexity < 0.55) {
    style = "Gigi";
}
else if (complexity > 0.6) {
    style = "Eiffel65";
}
else if (mood > 0.55 && intensity > 0.5) {
    style = "GabryPonte";
}
else {
    style = "Prezioso";
}

    
    console.log("🎧 Dance style dalla foto:");
    console.log(`   - Stile: ${style} (${compositionMode})`);
    console.log(`   - BPM: ${bpm} (originale: ${imageBpm})`);
    console.log(`   - Tonal center: ${tonalCenter}`);
    console.log(`   - Scala: ${scaleType}`);
    console.log(`   - Intensity: ${intensity.toFixed(2)}, Mood: ${mood.toFixed(2)}, Complexity: ${complexity.toFixed(2)}`);
    
    return {
        tonalCenter,
        scaleType,
        bpm,
        compositionMode,
        style,  // ← ora lo stile è determinato dai parametri della foto!
        kickIntensity: 0.8,
        bassEnergy: 0.7 + intensity * 0.2,
        leadDensity: 0.5 + complexity * 0.3,
        fxIntensity: 0.3 + intensity * 0.4
    };
}