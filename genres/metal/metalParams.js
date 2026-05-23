// metalParams.js — ver. 002 (stili dinamici)
console.log("metalParams.js ver. 002 loaded");

export function buildMetalParams(rand, globalParams, rhythmParams) {
    let intensity = parseFloat(globalParams?.intensity);
    let mood = parseFloat(globalParams?.mood);
    let complexity = parseFloat(globalParams?.complexity);
    
    if (isNaN(intensity)) intensity = 0.5;
    if (isNaN(mood)) mood = 0.5;
    if (isNaN(complexity)) complexity = 0.5;
    
    // BPM metal: 120-200
    const imageBpm = rhythmParams?.tempoProfile || 140;
    let bpm;
    if (imageBpm <= 130) bpm = 120 + rand() * 20;      // 120-140
    else if (imageBpm <= 160) bpm = 140 + rand() * 20; // 140-160
    else bpm = 160 + rand() * 30;                      // 160-190
    
    // Tonal center (range metal classico)
    const TONICS = ["E", "F", "G", "A", "B", "C", "D"];
    const tonic = TONICS[Math.floor(rand() * TONICS.length)];
    const tonalCenter = tonic + "3";
    
    // ============================================================
    // STILI METAL
    // ============================================================
    let style;
    let compositionMode;
    let scaleType;
    
    console.log(`🔍 Metal params: intensity=${intensity.toFixed(3)}, mood=${mood.toFixed(3)}, complexity=${complexity.toFixed(3)}`);
    
    // POWER METAL (epico, veloce, brillante)
    if (intensity > 0.65 && mood > 0.55) {
        style = "PowerMetal";
        compositionMode = "epic";
        scaleType = "major";
        console.log("⚡ STILE: POWER METAL (epico, veloce, brillante)");
    }
    // THRASH METAL (aggressivo, veloce, complesso)
    else if (intensity > 0.7 && complexity > 0.6) {
        style = "ThrashMetal";
        compositionMode = "aggressive";
        scaleType = "naturalMinor";
        console.log("🤘 STILE: THRASH METAL (aggressivo, veloce)");
    }
    // DOOM METAL (lento, pesante, scuro)
    else if (intensity < 0.4 && mood < 0.4) {
        style = "DoomMetal";
        compositionMode = "heavy";
        scaleType = "naturalMinor";
        console.log("🖤 STILE: DOOM METAL (lento, pesante, scuro)");
    }
    // PROGRESSIVE METAL (complesso, tecnico, variazione)
    else if (complexity > 0.7) {
        style = "ProgressiveMetal";
        compositionMode = "complex";
        scaleType = "harmonicMinor";
        console.log("🌀 STILE: PROGRESSIVE METAL (complesso, tecnico)");
    }
    // MELODIC DEATH METAL (melodico, aggressivo)
    else if (intensity > 0.6 && mood > 0.4 && mood < 0.7) {
        style = "MelodicDeath";
        compositionMode = "melodic";
        scaleType = "harmonicMinor";
        console.log("💀 STILE: MELODIC DEATH METAL (melodico, aggressivo)");
    }
    // Default: Heavy Metal classico
    else {
        style = "HeavyMetal";
        compositionMode = "classic";
        scaleType = "naturalMinor";
        console.log("🎸 STILE: HEAVY METAL (classico)");
    }
    
    console.log(`🎸 METAL ENGINE | Stile: ${style} | BPM: ${Math.round(bpm)} | Scala: ${scaleType}`);
    
    return {
        tonalCenter,
        scaleType,
        bpm: Math.round(bpm),
        compositionMode,
        style,
        riffDensity: 0.6 + intensity * 0.3,
        bassIntensity: 0.5 + intensity * 0.4,
        leadDensity: 0.5 + complexity * 0.4,
        drumIntensity: 0.6 + intensity * 0.4,
        drumStyle: intensity > 0.7 ? "doubleKick" : "singleKick",
        themeStyle: style
    };
}