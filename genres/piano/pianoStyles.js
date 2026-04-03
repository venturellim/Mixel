// pianoStyles.js

console.log("pianoStyles.js ver. 001 loaded");

export const pianoStyles = {
    // Corrispondenti ai nomi che usi in riffPatterns.js
    pm_sparse: {
        lh: [1, 0, 0, 0, 0, 0, 0, 0], // Solo sul primo battito
        rh: [1, 0, 0, 0, 0, 0, 0, 0],
        description: "Minimalista"
    },
    pm_groove: {
        lh: [1, 0, 0.8, 0, 1, 0, 0.8, 0], // Movimento costante di ottavi
        rh: [0, 0, 1, 0, 0, 0, 1, 0],    // Risponde sui levare
        description: "Andante"
    },
    open_epic: {
        lh: [1, 0, 0, 0, 1, 0, 0, 0],
        rh: [1, 0.6, 0.7, 0.6, 1, 0.6, 0.7, 0.6], // Arpeggio fluido in ottavi
        description: "Arpeggiato"
    },
    pedal: {
        lh: [1, 1, 1, 1, 1, 1, 1, 1], // Ottave ribattute (Tensione)
        rh: [1, 0, 0, 0, 1, 0, 0, 0],
        description: "Ostinato"
    }
};
