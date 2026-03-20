//
// powerMetalParams.js
// Traduce i parametri universali in parametri specifici del power metal.
// Nessuna logica musicale diretta. Nessun riferimento agli strumenti.
// Solo definizione dello stile.
//

console.log("powerMetalParams.js loaded");

export function buildPowerMetalParams(rand) {

    // Se rand è un oggetto, lo trasformiamo in funzione
    const rnd = (typeof rand === "function")
        ? rand
        : () => rand.next();   // oppure rand.random(), dipende dal tuo random

    // 1) Tonal center sicuro
    const TONICS = ["C", "D", "E", "F", "G", "A", "B"];
    const tonic = TONICS[Math.floor(rnd() * TONICS.length)] || "E";

    // 2) Ottava sicura
    const OCTAVES = [3, 4, 5];
    const octave = OCTAVES[Math.floor(rnd() * OCTAVES.length)] || 4;

    const tonalCenter = tonic + octave;

    // 3) Tipo di scala sicuro
    const SCALE_TYPES = ["major", "naturalMinor", "harmonicMinor"];
    const scaleType = SCALE_TYPES[Math.floor(rnd() * SCALE_TYPES.length)] || "naturalMinor";

    // 4) BPM sicuro
    const bpm = Math.floor(120 + rnd() * 60); // 120–180

    // 5) Modalità composizione
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

        // parametri musicali
        riffDensity: 0.6,
        bassIntensity: 0.7,
        leadDensity: 0.8,
        intensity: 0.7,
        drumIntensity: 0.8,
        drumStyle: "doubleKick",
        themeStyle: "heroic"
    };
}
