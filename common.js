//
// common.js — versione universale per tutti i generi
// Contiene SOLO:
// - master bus
// - EQ/mastering
// - utilities generiche
// - sistema di caricamento strumenti (generico)
// - logging note
//
// Nessun sampler, nessun effetto, nessuna logica metal.
// Tutto ciò che è strumento → va nella cartella del genere.
//

import * as Tone from "https://esm.sh/tone";

console.log("common.js loaded");

// ======================================================
// 🎚 MASTER BUS & MASTERING
// ======================================================

// EQ principale
export const masterEQ = new Tone.EQ3({
    low: 0,
    mid: 0,
    high: 0
});

// Limiter globale (ultimo anello della catena)
export const masterLimiter = new Tone.Limiter(-1);

// Catena corretta: EQ → Limiter → Destination
masterEQ.chain(masterLimiter, Tone.Destination);


// ======================================================
// 🎵 LOGGING UNIVERSALE
// ======================================================

export function logNote(instrumentName, note, time) {
    console.log(
        `%c🎵 ${instrumentName} → ${note} @ ${time}`,
        "color:#4CAF50; font-weight:bold;"
    );
}


// ======================================================
// 📦 SISTEMA DI CARICAMENTO STRUMENTI (GENERICA)
// ======================================================
//
// Ogni sampler/strumento deve chiamare:
//     registerInstrumentLoaded()
//
// Il genere deve chiamare:
//     await waitForInstruments(total)
//

let __loadedCount = 0;

export function registerInstrumentLoaded() {
    __loadedCount++;
}

export async function waitForInstruments(total) {
    const overlay = document.getElementById("loadingOverlay");
    const bar = document.getElementById("loadingBar");
    const text = document.getElementById("loadingText");

    overlay.style.display = "flex";

    function update() {
        const percent = Math.floor((__loadedCount / total) * 100);
        bar.style.width = percent + "%";
        text.innerText = "Caricamento strumenti… " + percent + "%";
    }

    while (__loadedCount < total) {
        update();
        await new Promise(res => setTimeout(res, 100));
    }

    overlay.style.display = "none";
    __loadedCount = 0; // reset per futuri caricamenti
}


// ======================================================
// 🧰 UTILITIES GENERICHE
// ======================================================

// Clamp MIDI note range
export function clampNote(note, minMidi, maxMidi) {
    const midi = Tone.Frequency(note).toMidi();
    if (midi < minMidi || midi > maxMidi) return null;
    return note;
}

// Prende un elemento da una scala ciclicamente
export function pickFromScale(scale, step) {
    return scale[step % scale.length];
}

// Random deterministico
export function createSeededRandom(seed) {
    return function () {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

// Humanizzazione temporale
export function humanizeTime(time, rand, amount = 0.008) {
    const offset = (rand() - 0.5) * amount;
    return time + offset;
}

// Humanizzazione velocity
export function humanizeVelocity(rand, base = 1) {
    const variation = 0.85 + rand() * 0.3;
    return base * variation;
}
