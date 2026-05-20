// funkyParams.js — ver. 001
console.log("funkyParams.js ver. 001.1 loaded");

export function buildFunkyParams(rand, globalParams, rhythmParams) {
    let intensity = parseFloat(globalParams?.intensity);
    let mood = parseFloat(globalParams?.mood);
    let complexity = parseFloat(globalParams?.complexity);
    
    if (isNaN(intensity)) intensity = 0.5;
    if (isNaN(mood)) mood = 0.5;
    if (isNaN(complexity)) complexity = 0.5;
    
    // BPM funky: 90-120 (il groove è più importante della velocità)
    const imageBpm = rhythmParams?.tempoProfile || 100;
    let bpm;
    if (imageBpm <= 95) bpm = 90;      // Slow funk
    else if (imageBpm <= 110) bpm = 105; // Classic funk
    else bpm = 120;                      // Up-tempo funk
    
    const tonalCenter = rhythmParams?.tonalCenter || "C4";
    const scaleType = rhythmParams?.scaleProfile || "major"; // Funky preferisce maggiore
    
    // Stili funk in base ai parametri
    let style;
    let compositionMode;
    
    console.log(`🔍 Funky params: intensity=${intensity.toFixed(3)}, mood=${mood.toFixed(3)}, complexity=${complexity.toFixed(3)}`);
    
    // Funky styles
    if (mood < 0.35) {
        style = "SoulFunk";      // Darker, emotional
        compositionMode = "soul";
    } else if (complexity > 0.7) {
        style = "JazzFunk";      // Complex, improvisational
        compositionMode = "jazz";
    } else if (intensity > 0.65 && mood > 0.6) {
        style = "PartyFunk";     // Energetic, bright
        compositionMode = "party";
    } else {
        style = "ClassicFunk";   // Standard funk
        compositionMode = "classic";
    }
    
    console.log(`🎧 STILE FUNKY: ${style} (${compositionMode}) | BPM: ${bpm}`);
    
    return {
        tonalCenter,
        scaleType,
        bpm,
        compositionMode,
        style,
        bassEnergy: 0.6 + intensity * 0.3,
        brassDensity: 0.4 + complexity * 0.4,
        guitarDensity: 0.5 + (intensity + mood) / 2 * 0.3
    };
}