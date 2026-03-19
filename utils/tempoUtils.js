//
// tempoUtils.js
// Modulo universale per la gestione del tempo musicale.
// Contiene:
// - conversioni BPM ↔ durate
// - quantizzazione
// - swing
// - generazione pattern ritmici
// - utilità per timeline
//
// Nessuna logica di genere.
// Nessuna dipendenza da strumenti.
//

import * as Tone from "https://esm.sh/tone";

console.log("tempoUtils.js loaded");

// ============================================================
// 🎵 BPM → DURATE
// ============================================================
//
// Restituisce la durata in secondi di una divisione musicale.
// division può essere: "4n", "8n", "16n", "2n", "1m", ecc.
//

export function duration(division) {
    return Tone.Time(division).toSeconds();
}

// Durata di un quarto
export function quarter(bpm) {
    return 60 / bpm;
}

// Durata di un ottavo
export function eighth(bpm) {
    return (60 / bpm) / 2;
}

// Durata di un sedicesimo
export function sixteenth(bpm) {
    return (60 / bpm) / 4;
}

// Durata di una misura (4/4)
export function measure(bpm, beats = 4) {
    return (60 / bpm) * beats;
}


// ============================================================
// 🎚 QUANTIZZAZIONE
// ============================================================
//
// time: tempo in secondi
// division: "16n", "8n", ecc.
//

export function quantize(time, division) {
    const grid = duration(division);
    return Math.round(time / grid) * grid;
}

// Quantizzazione verso il basso
export function quantizeDown(time, division) {
    const grid = duration(division);
    return Math.floor(time / grid) * grid;
}

// Quantizzazione verso l’alto
export function quantizeUp(time, division) {
    const grid = duration(division);
    return Math.ceil(time / grid) * grid;
}


// ============================================================
// 🎷 SWING
// ============================================================
//
// amount: 0 = no swing, 1 = swing estremo
// division: "8n" o "16n"
//

export function applySwing(time, division, amount = 0.3) {
    const grid = duration(division);

    // Determina se siamo su un "colpo dispari"
    const index = Math.floor(time / grid);

    if (index % 2 === 1) {
        // Ritarda i colpi dispari
        return time + grid * amount;
    }

    return time;
}


// ============================================================
// 🥁 GENERAZIONE PATTERN RITMICI
// ============================================================
//
// pattern: array di 0/1 (es. [1,0,1,0,1,0,1,0])
// division: "16n"
// bpm: per calcolare la timeline
//

export function buildRhythmTimeline(pattern, division, bpm) {
    const events = [];
    const stepDur = duration(division);

    for (let i = 0; i < pattern.length; i++) {
        if (pattern[i] === 1) {
            events.push(i * stepDur);
        }
    }

    return events;
}


// ============================================================
// 🧱 TIMELINE GENERICA
// ============================================================
//
// Genera una timeline di N step con divisione fissa.
//

export function buildTimeline(steps, division) {
    const grid = duration(division);
    const times = [];

    for (let i = 0; i < steps; i++) {
        times.push(i * grid);
    }

    return times;
}


// ============================================================
// 🎶 GENERAZIONE DI GROOVE
// ============================================================
//
// groovePattern: array di valori (es. [1,0.8,1,0.7])
// division: "16n"
// bpm: per calcolare la timeline
//

export function buildGrooveTimeline(groovePattern, division, bpm) {
    const stepDur = duration(division);
    const events = [];

    for (let i = 0; i < groovePattern.length; i++) {
        const velocity = groovePattern[i];
        events.push({
            time: i * stepDur,
            velocity
        });
    }

    return events;
}
