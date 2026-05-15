// danceParams.js — ver. FUZZY 1.0
console.log("danceParams.js Ver. 002 loaded");

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
// ⭐ FUZZY SCORING — stile determinato dalla foto (v2)
// ------------------------------------------------------------

// GIGI: soft, dream, bassa intensità e bassa complessità
const gigiScore =
    (1 - intensity)  * 0.4 +
    (1 - complexity) * 0.3 +
    (1 - mood)       * 0.3;

// EIFFEL65: robotico, complessità alta, energia medio‑alta
const eiffelScore =
    complexity * 0.6 +
    intensity  * 0.2 +
    (1 - mood) * 0.2;

// GABRY PONTE: anthem, luminoso, energico
const gabryScore =
    mood      * 0.6 +
    intensity * 0.3 +
    complexity* 0.1;

// PREZIOSO: centro, mid‑range, default ritmico
const preziosoScore =
    0.3 +                      // bias di base
    (0.4 - Math.abs(intensity  - 0.5)) +   // ama intensità medie
    (0.3 - Math.abs(complexity - 0.5));    // ama complessità medie

// piccoli bias per evitare dominanze
const scores = {
    Gigi:       gigiScore      - 0.05,
    Eiffel65:   eiffelScore,
    GabryPonte: gabryScore     + 0.02,
    Prezioso:   preziosoScore  + 0.03
};

const style = Object.entries(scores).sort((a,b)=>b[1]-a[1])[0][0];

console.log("🎧 FUZZY STYLE SELECTION v2");
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
