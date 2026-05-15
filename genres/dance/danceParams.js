// danceParams.js — ver. FUZZY 1.0
console.log("danceParams.js ver. FUZZY 1.0 loaded");

export function buildDanceParams(rand, globalParams, rhythmParams) {
    const intensity  = globalParams?.intensity  ?? 0.5;
    const mood       = globalParams?.mood       ?? 0.5;
    const complexity = globalParams?.complexity ?? 0.5;

    // BPM dalla foto (range dance classico)
    const imageBpm = rhythmParams?.tempoProfile || 130;
    let bpm = Math.min(150, Math.max(130, imageBpm));

    // Tonalità e scala dalla foto
    const tonalCenter = rhythmParams?.tonalCenter || "C4";
    const scaleType   = rhythmParams?.scaleProfile || "naturalMinor";

    // ------------------------------------------------------------
    // ⭐ FUZZY SCORING — stile determinato dalla foto
    // ------------------------------------------------------------

    // GIGI: soft, dream, bassa intensità e bassa complessità
    const gigiScore =
        (1 - intensity)  * 0.6 +
        (1 - complexity) * 0.4;

    // EIFFEL65: robotico, complessità alta, energia media
    const eiffelScore =
        complexity * 0.7 +
        intensity  * 0.3;

    // GABRY PONTE: anthem, luminoso, energico
    const gabryScore =
        mood      * 0.5 +
        intensity * 0.5;

    // PREZIOSO: ritmico, sincopato, mid‑range
    const preziosoScore =
        0.5 + (0.5 - Math.abs(intensity - 0.5));

    const scores = {
        Gigi: gigiScore,
        Eiffel65: eiffelScore,
        GabryPonte: gabryScore,
        Prezioso: preziosoScore
    };

    const style = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];

    console.log("🎧 FUZZY STYLE SELECTION");
    console.log(`   - Gigi:       ${gigiScore.toFixed(3)}`);
    console.log(`   - Eiffel65:   ${eiffelScore.toFixed(3)}`);
    console.log(`   - GabryPonte: ${gabryScore.toFixed(3)}`);
    console.log(`   - Prezioso:   ${preziosoScore.toFixed(3)}`);
    console.log(`👉 Stile scelto: ${style}`);

    // ------------------------------------------------------------
    // PARAMETRI MUSICALI
    // ------------------------------------------------------------
    return {
        tonalCenter,
        scaleType,
        bpm,
        style,
        compositionMode: style,
        kickIntensity: 0.8,
        bassEnergy: 0.7 + intensity * 0.2,
        leadDensity: 0.5 + complexity * 0.3,
        fxIntensity: 0.3 + intensity * 0.4
    };
}
