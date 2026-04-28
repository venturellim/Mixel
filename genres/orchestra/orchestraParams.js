//
// orchestraParams.js
// Traduce i parametri universali in parametri specifici dell’orchestra.
// Nessuna logica musicale diretta. Nessun riferimento agli strumenti.
// Solo definizione dello stile.
//

console.log("orchestraParams.js ver. 001 loaded");

export function buildOrchestraParams(rand) {

    // TONAL CENTER (più basso rispetto al metal)
    const TONICS = ["C", "D", "E", "F", "G", "A"];
    const tonic = TONICS[Math.floor(rand() * TONICS.length)];

    const OCTAVES = [2, 3, 4];
    const octave = OCTAVES[Math.floor(rand() * OCTAVES.length)];

    const tonalCenter = tonic + octave;

    // SCALE TYPE (stesse del metal)
    const SCALE_TYPES = ["major", "naturalMinor", "harmonicMinor"];
    const scaleType = SCALE_TYPES[Math.floor(rand() * SCALE_TYPES.length)];

    // BPM (orchestra più lenta del metal)
    const bpm = Math.floor(80 + rand() * 60); // 80–140

    let compositionMode = "moderato";
    if (bpm < 95) compositionMode = "largo";
    if (bpm > 120) compositionMode = "allegro";

    console.log("🎼 Modalità orchestrale:", compositionMode, "BPM:", bpm);
    console.log("🎻 tonalCenter scelto:", tonalCenter);
    console.log("🎻 scaleType scelto:", scaleType);

    return {
        tonalCenter,
        scaleType,
        bpm,
        compositionMode,

        // PARAMETRI STILISTICI ORCHESTRALI
        stringDensity: 0.5,        // quante note suonano gli archi
        bowIntensity: 0.6,         // forza dell’arco
        legatoAmount: 0.8,         // quanto legato
        accentIntensity: 0.5,      // forza dei timpani e accenti viola
        orchestralBrightness: 0.4, // EQ naturale
        themeStyle: "cinematic"    // epic, cinematic, baroque, romantic
    };
}
