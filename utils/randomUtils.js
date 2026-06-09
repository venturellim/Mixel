//
// randomUtils.js
// Modulo universale per la gestione della casualità musicale.
// Contiene:
// - random deterministico (seeded)
// - random pesato
// - scelta casuale da array
// - shuffle
// - estrazione pattern
// - variazioni controllate
//
// Nessuna logica di genere.
// Nessuna dipendenza da strumenti.
//

console.log("randomUtils.js Ver 002 loaded");

// ============================================================
// 🎯 RANDOM DETERMINISTICO (SEED)
// ============================================================
//
// Usa un LCG (Linear Congruential Generator) per generare
// numeri pseudo-casuali riproducibili.
//

export function createSeededRandom(seed) {
    return function () {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}


// ============================================================
// 🎲 RANDOM PESATO
// ============================================================
//
// items: ["kick","snare","hihat"]
// weights: [0.6, 0.3, 0.1]
//
// rand: funzione random deterministica
//

export function weightedRandom(items, weights, rand = Math.random) {
    const total = weights.reduce((a, b) => a + b, 0);
    const r = rand() * total;

    let acc = 0;
    for (let i = 0; i < items.length; i++) {
        acc += weights[i];
        if (r <= acc) return items[i];
    }

    return items[items.length - 1];
}


// ============================================================
// 🎵 SCELTA CASUALE DA ARRAY
// ============================================================

export function choose(array, rand = Math.random) {
    if (!array.length) return null;
    const idx = Math.floor(rand() * array.length);
    return array[idx];
}


// ============================================================
// 🔀 SHUFFLE (Fisher–Yates)
// ============================================================

export function shuffle(array, rand = Math.random) {
    const arr = [...array];

    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }

    return arr;
}


// ============================================================
// 🎼 ESTRAZIONE DI PATTERN
// ============================================================
//
// pattern: array di valori (es. [1,0,1,0,1,0])
// length: lunghezza desiderata
//

export function extractPattern(pattern, length) {
    const out = [];
    for (let i = 0; i < length; i++) {
        out.push(pattern[i % pattern.length]);
    }
    return out;
}


// ============================================================
// 🎶 VARIAZIONI CONTROLLATE
// ============================================================
//
// amount: 0 = nessuna variazione, 1 = variazione massima
//

export function vary(value, amount, rand = Math.random) {
    const delta = (rand() - 0.5) * 2 * amount;
    return value + delta;
}


// ============================================================
// 🧱 RANDOM BOOLEANO
// ============================================================
//
// prob: probabilità (0–1)
//

export function chance(prob, rand = Math.random) {
    return rand() < prob;
}

// ============================================================
// WRAPPER PER RAND (pick e range)
// ============================================================
export function wrapRand(rand) {
    return {
        next: () => rand(),
        range: (min, max) => min + rand() * (max - min),
        pick: (arr) => {
            if (!arr || arr.length === 0) return null;
            return arr[Math.floor(rand() * arr.length)];
        }
    };
}
