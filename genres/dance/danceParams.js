// danceParams.js — ver. 002 CORRETTO
console.log("danceParams.js ver. 002 loaded");

export function buildDanceParams(rand, globalParams) {
    // Estrai parametri con valori di default validi
    const intensity = globalParams?.intensity ?? 0.5;
    const mood = globalParams?.mood ?? 0.5;
    const complexity = globalParams?.complexity ?? 0.5;
    const texture = globalParams?.texture ?? 0.5;
    
    // VALIDA che siano numeri validi
    const validIntensity = isNaN(intensity) ? 0.5 : Math.min(1, Math.max(0, intensity));
    const validMood = isNaN(mood) ? 0.5 : Math.min(1, Math.max(0, mood));
    const validComplexity = isNaN(complexity) ? 0.5 : Math.min(1, Math.max(0, complexity));
    const validTexture = isNaN(texture) ? 0.5 : Math.min(1, Math.max(0, texture));
    
    console.log("📊 buildDanceParams - intensity:", validIntensity, "mood:", validMood);
    
    // BPM: 125–145, guidato dall'intensità
    const bpm = Math.round(125 + validIntensity * 20);
    
    // Tonal center: preferenza E, F, G, A (classico dance)
    const TONICS = ["E", "F", "G", "A"];
    const tonic = TONICS[Math.floor(rand() * TONICS.length)];
    const octave = 4;
    const tonalCenter = `${tonic}${octave}`;
    
    // Scala: naturale o armonica in base all'intensità
    const scaleType = validIntensity > 0.65 ? "harmonicMinor" : "naturalMinor";
    
    // Macro "mood" dance
    let grooveMode = "standard";
    if (validIntensity < 0.35) grooveMode = "slow";
    else if (validIntensity > 0.75) grooveMode = "rave";
    
    // Calcola valori numerici validi
    const bassEnergy = 0.5 + validIntensity * 0.4;
    const leadDensity = 0.4 + validComplexity * 0.5;
    const padWidth = 0.4 + validMood * 0.4;
    const fxIntensity = 0.3 + validTexture * 0.5;
    
    const result = {
        bpm,
        tonalCenter,
        scaleType,
        grooveMode,
        bassEnergy,
        leadDensity,
        padWidth,
        fxIntensity
    };
    
    console.log("✅ danceParams generati:", result);
    return result;
}