// -------------------------------------------------------------
// photoToMusicParams.js
// Converte i valori di analyzeImage() in parametri musicali
// -------------------------------------------------------------

export function photoToMusicParams(analysis) {


    const {
        brightness,
        energy,
        texture,
        entropy,
        edges,
        direction
    } = analysis;

    // ---------------------------------------------------------
    // Tempo (4/4 o 6/8)
    // ---------------------------------------------------------
    const timeSignature = (energy < 0.45) ? "6/8" : "4/4";

    // ---------------------------------------------------------
    // BPM (80–160)
    // ---------------------------------------------------------
    let bpm = 80;
    bpm += brightness * 20;
    bpm += energy * 40;
    bpm += entropy * 20;
    bpm += edges * 10;
    bpm = Math.max(80, Math.min(160, bpm));

    // ---------------------------------------------------------
    // Misure per sezione
    // ---------------------------------------------------------
    const introMeasures      = Math.round(4 + (1 - energy) * 8);     // 4–12
    const verseMeasures      = Math.round(8 + (1 - energy) * 16);    // 8–24
    const chorusMeasures     = Math.round(8 + brightness * 16);      // 8–24
    const soloMeasures       = Math.round(4 + entropy * 28);         // 4–32
    const outroMeasures      = Math.round(4 + (1 - entropy) * 4);    // 4–8

    // ---------------------------------------------------------
    // Lead "voce"
    // ---------------------------------------------------------
    const leadParams = {
        range: brightness,                     // 0 = basso, 1 = alto
        density: 0.3 + texture * 0.7,          // frasi lunghe → dense
        slope: (direction - 0.5) * 2,          // -1 discendente, +1 ascendente
        effects: {
            delay: entropy > 0.6,
            chorus: entropy > 0.6,
            wah: entropy > 0.75
        }
    };

    // ---------------------------------------------------------
    // Ritmica
    // ---------------------------------------------------------
    const rhythmParams = {
        palmMute: edges > 0.6,
        attack: edges * 0.5,
        sustain: 1 - edges
    };

    // ---------------------------------------------------------
    // Output finale
    // ---------------------------------------------------------
    return {
        timeSignature,
        bpm,

        measures: {
            intro: introMeasures,
            verse: verseMeasures,
            chorus: chorusMeasures,
            solo: soloMeasures,
            outro: outroMeasures
        },

        lead: leadParams,
        rhythm: rhythmParams,

        // Passiamo anche tonalità e scala, utili per l’harmony engine
        key: analysis.key,
        scale: analysis.scale
    };
}
