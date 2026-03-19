//
// powerMetalParams.js
// Traduce i parametri universali in parametri specifici del power metal.
// Nessuna logica musicale diretta. Nessun riferimento agli strumenti.
// Solo definizione dello stile.
//

console.log("powerMetalParams.js loaded");

// ============================================================
// 🎼 COSTRUZIONE PARAMETRI POWER METAL
// ============================================================

export function buildPowerMetalParams(universal) {

    // --------------------------------------------------------
    // 1) BPM — power metal = veloce
    // --------------------------------------------------------
    const bpm = Math.floor(
        140 + universal.energy * 40   // 140–180
    );

    // --------------------------------------------------------
    // 2) Scala — power metal usa spesso minore naturale o armonica
    // --------------------------------------------------------
    const scaleType =
        universal.colorTemperature > 0.5
            ? "harmonicMinor"
            : "naturalMinor";

    // --------------------------------------------------------
    // 3) Tonalità — già scelta da photoToMusicParams
    // --------------------------------------------------------
    const tonalCenter = universal.tonalCenter;

    // --------------------------------------------------------
    // 4) Struttura del brano — power metal = ricca
    // --------------------------------------------------------
    const structureProfile = {
        intro:  universal.intensity < 0.4 ? 2 : 4,
        verse:  8,
        chorus: 8,
        solo:   universal.complexity > 0.5 ? 12 : 8,
        outro:  4
    };

    // --------------------------------------------------------
    // 5) Densità strumenti
    // --------------------------------------------------------
    const riffDensity = 0.6 + universal.energy * 0.4;   // 0.6–1.0
    const leadDensity = 0.4 + universal.complexity * 0.6;
    const drumIntensity = 0.5 + universal.energy * 0.5;
    const bassIntensity = 0.4 + universal.texture * 0.6;

    // --------------------------------------------------------
    // 6) Stile strumenti
    // --------------------------------------------------------
    const drumStyle = universal.energy > 0.6 ? "doubleKick" : "standard";
    const bassStyle = universal.texture > 0.5 ? "gallop" : "straight";
    const themeStyle = universal.brightness > 0.5 ? "heroic" : "dark";

    // --------------------------------------------------------
    // 7) Seed random
    // --------------------------------------------------------
    const seed = universal.dna;

    // --------------------------------------------------------
    // 8) Output finale
    // --------------------------------------------------------
    return {
        bpm,
        tonalCenter,
        scaleType,
        structureProfile,

        intensity: universal.intensity,
        riffDensity,
        leadDensity,
        drumIntensity,
        bassIntensity,

        drumStyle,
        bassStyle,
        themeStyle,

        seed
    };
}
