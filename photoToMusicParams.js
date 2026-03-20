// ============================================================
// photoToMusicParams.js
// ------------------------------------------------------------
// Questo modulo è il "cervello emotivo" del sistema.
// NON genera musica. NON è legato a un genere specifico.
// Produce parametri emotivi e musicali astratti che ogni
// genere interpreterà a modo suo (power metal, piano, ambient…).
// ============================================================


// ------------------------------------------------------------
// 1. PARAMETRI EMOTIVI (continui, universali)
// ------------------------------------------------------------

// Intensità generale del brano (0–1)
// Combina luminosità, contrasto, complessità e texture.
// È il parametro più importante: guida BPM, densità, energia.
function computeIntensity(analysis) {
    const { brightness, energy, entropy, edges } = analysis;

    // Formula bilanciata (Stratovarius-friendly)
    let intensity =
        0.35 * brightness +
        0.35 * energy +
        0.20 * entropy +
        0.10 * edges;

    return Math.min(1, Math.max(0, intensity));
}


// Mood (0 = dark, 1 = bright)
// Serve per generi futuri (piano, ambient, synthwave…)
function computeMood(analysis) {
    return analysis.brightness; // semplice ma efficace
}


// Complessità (0 = semplice, 1 = complesso)
// Deriva dall'entropia dell'immagine
function computeComplexity(analysis) {
    return analysis.entropy;
}


// Texture (0 = smooth, 1 = rough)
// Deriva dalla quantità di edges
function computeTexture(analysis) {
    return analysis.edges;
}


// Motion (-1 = discendente, 0 = neutro, +1 = ascendente)
// Deriva dalla direzione visiva dell'immagine
function computeMotion(analysis) {
    return analysis.direction; // già normalizzato
}


// Temperatura colore (0 = warm, 1 = cold)
function computeColorTemperature(analysis) {
    return analysis.colorTemperature ?? 0.5;
}



// ------------------------------------------------------------
// 2. PARAMETRI MUSICALI ASTRATTI (universali)
// ------------------------------------------------------------

// Tonalità minori naturali compatibili con i tuoi sample
const VALID_TONICS = ["C", "D", "E", "F", "G", "A"];

// Mappa note → semitoni per calcolare la vicinanza
const NOTE_TO_SEMITONE = {
    "C": 0, "C#": 1, "Db": 1,
    "D": 2, "D#": 3, "Eb": 3,
    "E": 4,
    "F": 5, "F#": 6, "Gb": 6,
    "G": 7, "G#": 8, "Ab": 8,
    "A": 9, "A#": 10, "Bb": 10,
    "B": 11
};

// Trova la nota naturale più vicina alla tonalità dell'immagine
function computeTonalCenter(analysis, intensity) {
    const imageKey = analysis.key || "E"; // fallback

    const semitone = NOTE_TO_SEMITONE[imageKey] ?? 4; // fallback E

    // Cluster per intensità
    let cluster;
    if (intensity < 0.33) cluster = ["C", "D"];
    else if (intensity < 0.66) cluster = ["E", "F"];
    else cluster = ["G", "A"];

    // Trova la nota del cluster più vicina alla tonalità dell'immagine
    let best = cluster[0];
    let bestDist = Infinity;

    for (const note of cluster) {
        const dist = Math.abs(NOTE_TO_SEMITONE[note] - semitone);
        if (dist < bestDist) {
            bestDist = dist;
            best = note;
        }
    }

    return best; // sempre naturale, sempre compatibile
}


// Profilo scala (minore naturale o armonica)
function computeScaleProfile(intensity) {
    if (intensity > 0.66) return "harmonicMinor";
    return "naturalMinor";
}


// Profilo tempo (range BPM)
function computeTempoProfile(intensity) {
    // 90–160 BPM
    const bpm = 90 + intensity * 70;
    return Math.round(bpm);
}


// Time signature
function computeTimeSignature(intensity) {
    return intensity < 0.33 ? "6/8" : "4/4";
}


// Profilo struttura (lunghezza sezioni)
function computeStructureProfile(intensity) {
    return {
        intro: intensity < 0.33 ? 8 : intensity < 0.66 ? 4 : 2,
        verse: intensity < 0.33 ? 16 : intensity < 0.66 ? 8 : 6,
        chorus: intensity < 0.33 ? 8 : intensity < 0.66 ? 8 : 6,
        solo: intensity < 0.33 ? 4 : intensity < 0.66 ? 8 : 12,
        outro: intensity < 0.33 ? 8 : intensity < 0.66 ? 4 : 2
    };
}



// ------------------------------------------------------------
// 3. FUNZIONE PRINCIPALE
// ------------------------------------------------------------

export function photoToMusicParams(analysis) {

    // --- Parametri emotivi ---
    const intensity = computeIntensity(analysis);
    const mood = computeMood(analysis);
    const complexity = computeComplexity(analysis);
    const texture = computeTexture(analysis);
    const motion = computeMotion(analysis);
    const colorTemperature = computeColorTemperature(analysis);

    // --- Parametri musicali astratti ---
    const tonalCenter = computeTonalCenter(analysis, intensity);
    const scaleProfile = computeScaleProfile(intensity);
    const tempoProfile = computeTempoProfile(intensity);
    const timeSignature = computeTimeSignature(intensity);
    const structureProfile = computeStructureProfile(intensity);

    // --- DNA deterministico ---
    const dna = hashStringToNumber(JSON.stringify(analysis));

    return {
        dna,   // <<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<< AGGIUNTO QUI

        global: {
            intensity,
            mood,
            complexity,
            texture,
            motion,
            colorTemperature
        },
        harmony: {
            tonalCenter,
            scaleProfile
        },
        rhythm: {
            tempoProfile,
            timeSignature
        },
        structure: structureProfile,

        genreParams: {}
    };
}

function hashStringToNumber(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) {
        h = (h * 31 + str.charCodeAt(i)) >>> 0;
    }
    return h;
}


