// danceParams.js — ver. 001
console.log("danceParams.js ver. 001 loaded");

export function buildDanceParams(rand, globalParams) {
    const { intensity, mood, complexity, texture } = globalParams || {};

    // BPM: 125–145, guidato dall’intensità
    const bpm = Math.round(125 + (intensity ?? 0.5) * 20);

    // Tonal center: preferenza E, F, G, A (classico dance)
    const TONICS = ["E", "F", "G", "A"];
    const tonic = TONICS[Math.floor(rand() * TONICS.length)];
    const octave = 4;
    const tonalCenter = `${tonic}${octave}`;

    // Scala: naturale o armonica in base all’intensità
    const scaleType = (intensity ?? 0.5) > 0.65 ? "harmonicMinor" : "naturalMinor";

    // Macro “mood” dance
    let grooveMode = "standard";
    if (intensity < 0.35) grooveMode = "slow";
    else if (intensity > 0.75) grooveMode = "rave";

    return {
        bpm,
        tonalCenter,
        scaleType,
        grooveMode,
        // parametri che useranno gli engine
        bassEnergy: 0.5 + (intensity ?? 0.5) * 0.4,
        leadDensity: 0.4 + (complexity ?? 0.5) * 0.5,
        padWidth: 0.4 + (mood ?? 0.5) * 0.4,
        fxIntensity: 0.3 + (texture ?? 0.5) * 0.5
    };
}
