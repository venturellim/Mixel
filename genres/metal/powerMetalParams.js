//
// powerMetalParams.js
// Traduce i parametri universali in parametri specifici del power metal.
// Nessuna logica musicale diretta. Nessun riferimento agli strumenti.
// Solo definizione dello stile.
//

console.log("powerMetalParams.js loaded");

export function buildPowerMetalParams(rand) {

    // rand è una funzione: rand()

    const TONICS = ["C", "D", "E", "F", "G", "A", "B"];
    const tonic = TONICS[Math.floor(rand() * TONICS.length)];

    const OCTAVES = [3, 4, 5];
    const octave = OCTAVES[Math.floor(rand() * OCTAVES.length)];

    const tonalCenter = tonic + octave;

    const SCALE_TYPES = ["major", "naturalMinor", "harmonicMinor"];
    const scaleType = SCALE_TYPES[Math.floor(rand() * SCALE_TYPES.length)];

    const bpm = Math.floor(120 + rand() * 60);

    let compositionMode = "media";
    if (bpm < 130) compositionMode = "lenta";
    if (bpm > 160) compositionMode = "veloce";

    console.log("⚙️ Modalità:", compositionMode, "BPM:", bpm);
    console.log("🎯 tonalCenter scelto:", tonalCenter);
    console.log("🎯 scaleType scelto:", scaleType);

    return {
        tonalCenter,
        scaleType,
        bpm,
        compositionMode,
        riffDensity: 0.6,
        bassIntensity: 0.7,
        leadDensity: 0.8,
        intensity: 0.7,
        drumIntensity: 0.8,
        drumStyle: "doubleKick",
        themeStyle: "heroic"
    };
}
