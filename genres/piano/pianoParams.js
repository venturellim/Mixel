// pianoParams.js
console.log("pianoParams.js ver. 001 loaded");

export function buildPianoParams(rand, imageParams) {
    // 1. Tonalità (basata sul DNA)
    const TONICS = ["C", "D", "E", "F", "G", "A", "B"];
    const tonic = TONICS[Math.floor(rand() * TONICS.length)];
    
    // Il piano suona bene centrato sull'ottava 4
    const tonalCenter = tonic + "4";

    // 2. Scala: se la foto è "dark", usiamo la minore, se è "bright" la maggiore
    const scaleType = imageParams.brightness > 0.5 ? "major" : "naturalMinor";

    // 3. BPM: il piano solitamente è più lento del metal
    // Usiamo l'intensità della foto per decidere il tempo (da 60 a 120 BPM)
    const bpm = Math.floor(60 + (imageParams.energy * 60));

    // 4. Struttura: restituiamo l'ARRAY che mancava!
    const structure = [
        { name: "intro", measures: 2 },
        { name: "verse", measures: 4 },
        { name: "chorus", measures: 4 },
        { name: "outro", measures: 2 }
    ];

    return {
        tonalCenter,
        scaleType,
        bpm,
        structure,
        // Parametri specifici per l'espressività del Salamander
        lhIntensity: 0.8, // Forza della mano sinistra
        rhComplexity: imageParams.complexity, // Quanto è articolata la destra
        arpeggioSpeed: imageParams.texture > 0.5 ? "16n" : "8n"
    };
}
