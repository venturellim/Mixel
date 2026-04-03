// pianoParams.js — ver. 002
console.log("pianoParams.js ver. 002 loaded");

export function buildPianoParams(rand, imageParams) {
    const TONICS = ["C", "D", "E", "F", "G", "A", "B"];
    const tonic = TONICS[Math.floor(rand() * TONICS.length)] || "C";
    const tonalCenter = tonic + "4";

    const scaleType = (imageParams && imageParams.brightness > 0.5) ? "major" : "naturalMinor";

    // BPM di sicurezza
    const energy = imageParams?.energy || 0.5;
    const bpm = Math.floor(70 + (energy * 40));

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
        intensity: energy,
        texture: imageParams?.texture || 0.5,
        useArpeggio: (imageParams?.texture || 0.5) > 0.5,
        velocityBase: 0.4 + (energy * 0.2)
    };
}
