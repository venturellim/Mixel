// pianoEngine.js - Versione Deterministica

export async function createPianoEngine(params, analysis) {
    const dna = params.dna; // L'hash univoco della foto
    const intensity = params.global.intensity;
    const complexity = params.global.complexity;
    
    // 1. Generiamo una "tavolozza" di note basata sulla scala scelta
    const tonalCenter = params.harmony.tonalCenter;
    const scaleNotes = getScale(tonalCenter, params.harmony.scaleProfile);

    // 2. Funzione per estrarre un valore deterministico dal DNA
    // Questo ci permette di avere la stessa melodia per la stessa foto
    const getDnaValue = (offset) => {
        return (dna >> (offset % 24)) & 0xFF; // Estrae un byte dall'hash
    };

    // 3. Creazione della progressione armonica basata sulla foto
    const progression = [
        getDnaValue(0) % scaleNotes.length,
        getDnaValue(8) % scaleNotes.length,
        getDnaValue(16) % scaleNotes.length,
        getDnaValue(24) % scaleNotes.length
    ];

    let step = 0;
    const loop = new Tone.Loop((time) => {
        if (!isLoaded) return;

        const measure = Math.floor(step / 16);
        const currentChordIndex = progression[measure % progression.length];
        
        // Velocity basata sull'intensità dell'immagine + una piccola variazione deterministica
        const baseVel = 0.3 + (intensity * 0.5);
        const dynamicVel = baseVel + ((getDnaValue(step) / 255) * 0.2);

        // LOGICA MELODICA DETERMINISTICA
        // Usiamo la 'complexity' per decidere quante note suonare
        if (step % 4 === 0 || (complexity > 0.5 && step % 2 === 0)) {
            
            // Scegliamo la nota basandoci sul DNA e sulla direzione dell'immagine
            const noteOffset = getDnaValue(step + 10) % 7;
            const octave = 3 + Math.floor(analysis.brightness * 3); // Brightness guida l'altezza
            
            const note = scaleNotes[noteOffset] + octave;
            
            piano.triggerAttackRelease(note, "8n", time, dynamicVel);
        }

        // Accompagnamento (Bassi) basato sulla texture
        if (step % 16 === 0 && analysis.texture > 0.3) {
            const bassNote = scaleNotes[currentChordIndex] + "2";
            piano.triggerAttackRelease(bassNote, "2n", time, baseVel * 0.8);
        }

        step++;
    }, "16n"); // Usiamo i sedicesimi per più dettaglio

    // ... resto dell'engine (play, stop, pause)
}

    return {
        play: () => { loop.start(0); Tone.Transport.start(); },
        pause: () => Tone.Transport.pause(),
        stop: () => { loop.stop(); Tone.Transport.stop(); step = 0; },
        totalDuration: 32 * 4 * (60 / params.bpm)
    };
}
