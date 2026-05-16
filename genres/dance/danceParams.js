// danceParams.js — ver. 007 (debug estremo)
console.log("danceParams.js ver. 007 loaded");

export function buildDanceParams(rand, globalParams, rhythmParams) {
    // DEBUG: stampa TUTTO quello che ricevi
    console.log("🔍🔍🔍 DANCE PARAMS RAW INPUT:");
    console.log("   globalParams:", JSON.stringify(globalParams));
    console.log("   rhythmParams:", JSON.stringify(rhythmParams));
    
    // ESTRAI PARAMETRI - usa valori di default SOLO se undefined
    let intensity = globalParams?.intensity;
    let mood = globalParams?.mood;
    let complexity = globalParams?.complexity;
    
    // Se sono undefined, usa 0.5, ma se sono NaN, usa 0.5
    if (intensity === undefined || isNaN(intensity)) intensity = 0.5;
    if (mood === undefined || isNaN(mood)) mood = 0.5;
    if (complexity === undefined || isNaN(complexity)) complexity = 0.5;
    
    console.log(`🔍 Valori estratti: intensity=${intensity}, mood=${mood}, complexity=${complexity}`);
    
    // BPM
    const imageBpm = rhythmParams?.tempoProfile || 130;
    let bpm;
    if (imageBpm <= 130) bpm = 130;
    else if (imageBpm >= 150) bpm = 150;
    else bpm = 140;
    
    const tonalCenter = rhythmParams?.tonalCenter || "C4";
    const scaleType = rhythmParams?.scaleProfile || "naturalMinor";
    
    // DETERMINA LO STILE (soglie diverse per test)
    let style;
    let compositionMode;
    
    console.log(`🔍 Test condizioni: intensity<0.4? ${intensity < 0.4}, complexity<0.5? ${complexity < 0.5}`);
    console.log(`🔍 Test condizioni: complexity>0.65? ${complexity > 0.65}`);
    console.log(`🔍 Test condizioni: mood>0.6 && intensity>0.55? ${mood > 0.6 && intensity > 0.55}`);
    
    // GIGI
    if (intensity < 0.4 && complexity < 0.5) {
        style = "Gigi";
        compositionMode = "dream";
    }
    // EIFFEL65
    else if (complexity > 0.65) {
        style = "Eiffel65";
        compositionMode = "robotic";
    }
    // GABRY PONTE
    else if (mood > 0.6 && intensity > 0.55) {
        style = "GabryPonte";
        compositionMode = "anthem";
    }
    // PREZIOSO
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