// danceParams.js — ver. 002 (compatibile con altri generi)
console.log("danceParams.js ver. 002 loaded");

export function buildDanceParams(rand) {
    // TONAL CENTER (come metal, ma range dance)
    const TONICS = ["C", "D", "E", "F", "G", "A"];
    const tonic = TONICS[Math.floor(rand() * TONICS.length)];
    const octave = 4;
    const tonalCenter = tonic + octave;

    // SCALE TYPE (stesse del metal)
    const SCALE_TYPES = ["major", "naturalMinor", "harmonicMinor"];
    const scaleType = SCALE_TYPES[Math.floor(rand() * SCALE_TYPES.length)];

    // BPM (dance range: 120-150)
    const bpm = Math.floor(120 + rand() * 30);

    let compositionMode = "dance";
    if (bpm < 128) compositionMode = "deep";
    if (bpm > 140) compositionMode = "techno";

    console.log("🎧 Modalità dance:", compositionMode, "BPM:", bpm);
    console.log("🎧 tonalCenter scelto:", tonalCenter);
    console.log("🎧 scaleType scelto:", scaleType);

    return {
        tonalCenter,
        scaleType,
        bpm,
        compositionMode,
        kickIntensity: 0.8,
        bassEnergy: 0.7,
        leadDensity: 0.6,
        fxIntensity: 0.5
    };
}