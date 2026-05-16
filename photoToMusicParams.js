// photoToMusicParams.js — ver. 002 (con validazione robusta)
console.log("photoToMusicParams.js ver. 002 loaded");

function computeIntensity(analysis) {
    const brightness = analysis.brightness ?? 0.5;
    const energy = analysis.energy ?? 0.5;
    const entropy = analysis.entropy ?? 0.5;
    const edges = analysis.edges ?? 0.5;

    let intensity = 0.35 * brightness + 0.35 * energy + 0.20 * entropy + 0.10 * edges;
    
    // Assicura che sia un numero valido
    if (isNaN(intensity)) intensity = 0.5;
    
    return Math.min(1, Math.max(0, intensity));
}

function computeMood(analysis) {
    const brightness = analysis.brightness ?? 0.5;
    return isNaN(brightness) ? 0.5 : brightness;
}

function computeComplexity(analysis) {
    const entropy = analysis.entropy ?? 0.5;
    return isNaN(entropy) ? 0.5 : entropy;
}

function computeTexture(analysis) {
    const edges = analysis.edges ?? 0.5;
    return isNaN(edges) ? 0.5 : edges;
}

function computeMotion(analysis) {
    const direction = analysis.direction ?? 0;
    return isNaN(direction) ? 0 : direction;
}

function computeColorTemperature(analysis) {
    const ct = analysis.colorTemperature ?? 0.5;
    return isNaN(ct) ? 0.5 : ct;
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

export function photoToMusicParams(analysis) {
    console.log("🔍 photoToMusicParams - analysis ricevuta:", analysis);

    // --- Parametri emotivi (già validati dalle funzioni) ---
    const intensity = computeIntensity(analysis);
    const mood = computeMood(analysis);
    const complexity = computeComplexity(analysis);
    const texture = computeTexture(analysis);
    const motion = computeMotion(analysis);
    const colorTemperature = computeColorTemperature(analysis);

    console.log("📊 photoToMusicParams - valori calcolati:", {
        intensity, mood, complexity, texture, motion, colorTemperature
    });

    // --- Parametri musicali astratti ---
    const tonalCenter = computeTonalCenter(analysis, intensity);
    const scaleProfile = computeScaleProfile(intensity);
    const tempoProfile = computeTempoProfile(intensity);
    const timeSignature = computeTimeSignature(intensity);
    const structureProfile = computeStructureProfile(intensity);

    // --- DNA deterministico ---
    const dna = hashStringToNumber(JSON.stringify(analysis));
    
    const imageParams = {
        brightness: analysis.brightness ?? 0.5,
        energy: analysis.energy ?? 0.5,
        texture: analysis.texture ?? 0.5,
        complexity: analysis.complexity ?? 0.5,
        direction: analysis.direction ?? 0,
        colorTemperature: analysis.colorTemperature ?? 0.5
    };

    return {
        dna,   
        imageParams,
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