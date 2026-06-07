// funkyInstruments.js — ver. 001 (bozza)
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded } from "../../common.js";

console.log("funkyInstruments.js ver. 001 loaded");

// ============================================================
// BUS EFFETTI (FUNKY)
// ============================================================

export const brassBus = new Tone.Gain(1);     // Fiati
export const guitarBus = new Tone.Gain(1);    // Chitarre
export const bassBus = new Tone.Gain(1);      // Basso
export const keysBus = new Tone.Gain(1);      // Clavinet + Korg
export const drumsBus = new Tone.Gain(1);     // Batteria
export const fxBus = new Tone.Gain(1);        // Effetti

// EQ per fiati (presenza media, brillante)
const brassEQ = new Tone.EQ3({ low: -2, mid: 3, high: 4 });

// EQ per chitarra funk (taglio bassi, boost medi)
const guitarEQ = new Tone.EQ3({ low: -6, mid: 4, high: 2 });

// EQ per basso slap (boost bassi e alti, taglio medio)
const bassEQ = new Tone.EQ3({ low: 6, mid: -3, high: 4 });

// EQ per clavinet (percusso, brillante)
const keysEQ = new Tone.EQ3({ low: -4, mid: 2, high: 5 });

// EQ per batteria (compatta)
const drumsEQ = new Tone.EQ3({ low: 4, mid: -2, high: 3 });

// ============================================================
// EFFETTI FUNKY (CORRETTA)
// ============================================================

// AutoWah per chitarra funk
export const autoWah = new Tone.AutoWah({
    baseFrequency: 180,
    octaves: 6,
    sensitivity: -30,
    Q: 8,
    gain: 6
});

// Delay con ottavo puntato
export const dottedDelay = new Tone.FeedbackDelay({
    delayTime: "8n.",
    feedback: 0.5,
    wet: 0.4
});

// Compressore per basso slap
export const slapCompressor = new Tone.Compressor({
    threshold: -18,
    ratio: 6,
    attack: 0.002,
    release: 0.08
});

// EQ boost per chitarra (PRIMA del routing)
const guitarBoostEQ = new Tone.EQ3({ low: -3, mid: 6, high: 4 });

// ============================================================
// ROUTING BUS → EQ → EFFETTI → MASTER
// ============================================================

brassBus.connect(brassEQ).connect(masterEQ);
guitarBus.connect(guitarEQ).connect(guitarBoostEQ).connect(autoWah).connect(dottedDelay).connect(masterEQ);
bassBus.connect(bassEQ).connect(slapCompressor).connect(masterEQ);
keysBus.connect(keysEQ).connect(masterEQ);
drumsBus.connect(drumsEQ).connect(masterEQ);

// ============================================================
// 1. FIATI
// ============================================================

// TROMBA (sustain) - note disponibili
export function createTrumpet() {

    const sampler = new Tone.Sampler({
        urls: {
            C3: "Samples/Trumpet/C3.mp3",
            C5: "Samples/Trumpet/C5.mp3",
            "D#3": "Samples/Trumpet/Ds3.mp3",
            D4: "Samples/Trumpet/D4.mp3",
            G3: "Samples/Trumpet/G3.mp3",
            "A#3": "Samples/Trumpet/As3.mp3",
            A2: "Samples/Trumpet/A2.mp3",
            A4: "Samples/Trumpet/A4.mp3",
            F2: "Samples/Trumpet/F2.mp3",
            F4: "Samples/Trumpet/F4.mp3"
        },
        release: 1.2,
        onload: () => registerInstrumentLoaded("Tromba")
    }).connect(brassBus);

    return sampler;
}

// TROMBONE (sustain) - nota più grave della tromba
export function createTrombone() {

    const sampler = new Tone.Sampler({
        urls: {
            C3: "Samples/Trombone/C3.mp3",
            "C#3": "Samples/Trombone/Cs3.mp3",
            F1: "Samples/Trombone/F1.mp3",
            F2: "Samples/Trombone/F2.mp3",
            F3: "Samples/Trombone/F3.mp3",
            D2: "Samples/Trombone/D2.mp3",
            "D#1": "Samples/Trombone/Ds1.mp3",
            "D#3": "Samples/Trombone/Ds3.mp3",
            "A#0": "Samples/Trombone/As0.mp3",
            "A#1": "Samples/Trombone/As1.mp3"
        },
        release: 1.2,
        onload: () => registerInstrumentLoaded("Trombone")
    }).connect(brassBus);

    return sampler;
}

// SAX ALTO (sustain) - nota media
export function createSaxAlto() {

    const sampler = new Tone.Sampler({
        urls: {
            C3: "Samples/SaxAlto/C3.mp3",
            C4: "Samples/SaxAlto/C4.mp3",
            C5: "Samples/SaxAlto/C5.mp3",
            D3: "Samples/SaxAlto/D3.mp3",
            D4: "Samples/SaxAlto/D4.mp3",
            D5: "Samples/SaxAlto/D5.mp3",
            E3: "Samples/SaxAlto/E3.mp3",
            E4: "Samples/SaxAlto/E4.mp3",
            E5: "Samples/SaxAlto/E5.mp3",
            F3: "Samples/SaxAlto/F3.mp3",
            F4: "Samples/SaxAlto/F4.mp3",
            F5: "Samples/SaxAlto/F5.mp3",
            G2: "Samples/SaxAlto/G2.mp3",
            G3: "Samples/SaxAlto/G3.mp3",
            G4: "Samples/SaxAlto/G4.mp3",
            G5: "Samples/SaxAlto/G5.mp3",
            A2: "Samples/SaxAlto/A2.mp3",
            A3: "Samples/SaxAlto/A3.mp3",
            A4: "Samples/SaxAlto/A4.mp3",
            A5: "Samples/SaxAlto/A5.mp3",
            B2: "Samples/SaxAlto/B2.mp3",
            B3: "Samples/SaxAlto/B3.mp3",
            B4: "Samples/SaxAlto/B4.mp3",
            B5: "Samples/SaxAlto/B5.mp3"
        },
        release: 1.2,
        onload: () => registerInstrumentLoaded("SaxAlto")
    }).connect(brassBus);

    return sampler;
}

// ============================================================
// 2. TASTIERE
// ============================================================

// CLAVINET (suono percussivo tipico funk)
export function createClavinet() {

    const sampler = new Tone.Sampler({
        urls: {
            C3: "Samples/Clavinet/C3.mp3",
            D3: "Samples/Clavinet/D3.mp3",
            "D#3": "Samples/Clavinet/Ds3.mp3",
            E3: "Samples/Clavinet/E3.mp3",
            F3: "Samples/Clavinet/F3.mp3",
            "F#3": "Samples/Clavinet/Fs3.mp3",
            G3: "Samples/Clavinet/G3.mp3",
            "G#3": "Samples/Clavinet/Gs3.mp3",
            A3: "Samples/Clavinet/A3.mp3",
            "A#3": "Samples/Clavinet/As3.mp3",
            B3: "Samples/Clavinet/B3.mp3",
            C4: "Samples/Clavinet/C4.mp3",
            "C#4": "Samples/Clavinet/Cs4.mp3",
            D4: "Samples/Clavinet/D4.mp3",
            "D#4": "Samples/Clavinet/Ds4.mp3",
            E4: "Samples/Clavinet/E4.mp3",
            F4: "Samples/Clavinet/F4.mp3",
            "F#4": "Samples/Clavinet/Fs4.mp3",
            G4: "Samples/Clavinet/G4.mp3",
            "G#4": "Samples/Clavinet/Gs4.mp3",
            "A#4": "Samples/Clavinet/As4.mp3",
            B4: "Samples/Clavinet/B4.mp3",
            C5: "Samples/Clavinet/C5.mp3"
        },
        release: 0.8,
        onload: () => registerInstrumentLoaded("Clavinet")
    }).connect(keysBus);

    return sampler;
}

// KORG NOISE FUNKY (percussioni aggiuntive)
export function createNoisy() {

    const sampler = new Tone.Sampler({
        urls: {
            A4: "Samples/Noisy/A4.mp3",
            A5: "Samples/Noisy/A5.mp3",
            C4: "Samples/Noisy/C4.mp3",
            "C#5": "Samples/Noisy/Cs5.mp3",
            D6: "Samples/Noisy/D6.mp3",
            E4: "Samples/Noisy/E4.mp3",
            "F#6": "Samples/Noisy/Fs6.mp3"
        },
        release: 0.5,
        onload: () => registerInstrumentLoaded("Noisy")
    }).connect(keysBus);

    return sampler;
}

// ============================================================
// 3. CHITARRE
// ============================================================

// CHITARRA MUTE (ritmica funky in 16th)
export function createGuitarMute() {

    const sampler = new Tone.Sampler({
        urls: {
            C4: "Samples/GuitarMute/C4.mp3",
            D4: "Samples/GuitarMute/D4.mp3",
            D5: "Samples/GuitarMute/D5.mp3",
            E3: "Samples/GuitarMute/E3.mp3",
            "F#3": "Samples/GuitarMute/Fs3.mp3",
            F5: "Samples/GuitarMute/F5.mp3",
            G3: "Samples/GuitarMute/G3.mp3",
            A3: "Samples/GuitarMute/A3.mp3",
            "A#4": "Samples/GuitarMute/As4.mp3",
            "A#5": "Samples/GuitarMute/As5.mp3"
        },
        release: 0.3,
        onload: () => registerInstrumentLoaded("GuitarMute")
    }).connect(guitarBus);

    return sampler;
}

// CHITARRA CLEAN (lead, fills, arpeggi)
export function createGuitarClean() {

    const sampler = new Tone.Sampler({
        urls: {
            C3: "Samples/GuitarClean/C3.mp3",
            C4: "Samples/GuitarClean/C4.mp3",
            C5: "Samples/GuitarClean/C5.mp3",
            C6: "Samples/GuitarClean/C6.mp3",
            "F#2": "Samples/GuitarClean/Fs2.mp3",
            "F#3": "Samples/GuitarClean/Fs3.mp3",
            "F#4": "Samples/GuitarClean/Fs4.mp3",
            "F#5": "Samples/GuitarClean/Fs5.mp3"
        },
        release: 1.0,
        onload: () => registerInstrumentLoaded("GuitarClean")
    }).connect(guitarBus);

    return sampler;
}

// ============================================================
// 4. BASSO SLAP
// ============================================================

export function createBassSlap() {

    const sampler = new Tone.Sampler({
        urls: {
            D1: "Samples/BassSlap/D1.mp3",
            D3: "Samples/BassSlap/D3.mp3",
            E0: "Samples/BassSlap/E0.mp3",
            E2: "Samples/BassSlap/E2.mp3",
            E4: "Samples/BassSlap/E4.mp3",
            F2: "Samples/BassSlap/F2.mp3",
            G0: "Samples/BassSlap/G0.mp3",
            G5: "Samples/BassSlap/G5.mp3",
            A1: "Samples/BassSlap/A1.mp3",
            A3: "Samples/BassSlap/A3.mp3",
            B1: "Samples/BassSlap/B1.mp3",
            "F#1": "Samples/BassSlap/Fs1.mp3"
        },
        release: 0.5,
        onload: () => registerInstrumentLoaded("BassSlap")
    }).connect(bassBus);

    return sampler;
}

// ============================================================
// 5. BATTERIA (dai campioni metal)
// ============================================================

export function createDrumFunky() {

    const players = new Tone.Players({
        urls: {
            kick: "Samples/DrumFunky/kick.mp3",
            snare: "Samples/DrumFunky/snare.mp3",
            hihatclose: "Samples/DrumFunky/hihatclose.mp3",
            hihatopen: "Samples/DrumFunky/hihatopen.mp3",
            crash: "Samples/DrumFunky/crash.mp3",
            splash: "Samples/DrumFunky/splash.mp3",
            ride: "Samples/DrumFunky/ride.mp3",
            flatride: "Samples/DrumFunky/flatride.mp3",
            floortom: "Samples/DrumFunky/floortom.mp3",
            racktom: "Samples/DrumFunky/racktom.mp3",
            xstick: "Samples/DrumFunky/xstick.mp3"
        },
        onload: () => registerInstrumentLoaded("DrumFunky")
    }).connect(drumsBus);

    return players;
}

// ============================================================
// VOLUMI DI DEFAULT
// ============================================================

brassBus.gain.value = Tone.dbToGain(0);   // Fiati presenti
guitarBus.gain.value = Tone.dbToGain(8);  // Chitarra ritmica
bassBus.gain.value = Tone.dbToGain(6);    // Basso protagonista
keysBus.gain.value = Tone.dbToGain(-2);   // Clavinet in sottofondo
drumsBus.gain.value = Tone.dbToGain(0);   // Batteria

// normalizeNote VERSIONE DEFINITIVA con campioni reali

export function normalizeNote(note, instrument) {
    if (!note || typeof note !== "string") return "C3";

    // Estrae root + ottava (es: "F#4")
    const match = note.match(/^([A-G][#b]?)(\d+)?$/);
    if (!match) return "C3";

    const targetRoot = match[1];
    const targetOct = match[2] ? parseInt(match[2]) : 3;

    // Mappa completa delle note disponibili per ogni strumento (CON OTTAVE)
    const availableNotesMap = {
        trumpet: ["A2", "F2", "C3", "D#3", "G3", "A#3", "D4", "F4", "A4", "C5"],
        trombone: ["A#0", "D#1", "F1", "D2", "F2", "A#1", "C3", "C#3", "D#3", "F3"],
        saxAlto: [
            "G2", "A2", "B2",
            "C3", "D3", "E3", "F3", "G3", "A3", "B3",
            "C4", "D4", "E4", "F4", "G4", "A4", "B4",
            "C5", "D5", "E5", "F5", "G5", "A5", "B5"
        ],
        clavinet: [
            "C3", "C#3", "D3", "D#3", "E3", "F3", "F#3", "G3", "G#3", "A3", "A#3", "B3",
            "C4", "C#4", "D4", "D#4", "E4", "F4", "F#4", "G4", "G#4", "A4", "A#4", "B4",
            "C5"
        ],
        guitarMute: ["E3", "F#3", "G3", "A3", "C4", "D4", "A#4", "D5", "F5", "A#5"],
        guitarClean: ["F#2", "C3", "F#3", "C4", "F#4", "C5", "F#5", "C6"],
        bassSlap: ["E0", "G0", "D1", "A1", "B1", "F#1", "E2", "F2", "A3", "D3", "E4", "G5"],
        noisy: [
    "C4", "E4", "A4", "C#5", "A5", "D6", "F#6"]
    };

    const available = availableNotesMap[instrument];
    if (!available) return note; // fallback

    // Converte la nota target in MIDI
    let targetMidi;
    try {
        targetMidi = Tone.Frequency(`${targetRoot}${targetOct}`).toMidi();
    } catch(e) {
        // Se la nota non esiste, usa C3 come fallback
        targetMidi = Tone.Frequency("C3").toMidi();
    }

    // Trova la nota disponibile più vicina in MIDI
    let bestNote = available[0];
    let bestDist = Infinity;

    for (const n of available) {
        try {
            const midi = Tone.Frequency(n).toMidi();
            const dist = Math.abs(midi - targetMidi);
            if (dist < bestDist) {
                bestDist = dist;
                bestNote = n;
            }
        } catch(e) {
            console.warn(`Nota non valida: ${n} per ${instrument}`);
        }
    }

    return bestNote;
}

// ============================================================
// ESPORTAZIONI
// ============================================================

export async function loadFunkyPack() {

    return {
        // 🎺 Fiati
        trumpet: createTrumpet(),
        trombone: createTrombone(),
        saxAlto: createSaxAlto(),

        // 🎹 Tastiere
        clavinet: createClavinet(),
        noisy: createNoisy(),

        // 🎸 Chitarre
        guitarMute: createGuitarMute(),
        guitarClean: createGuitarClean(),

        // 🎵 Basso
        bassSlap: createBassSlap(),

        // 🥁 Batteria
        drumFunky: createDrumFunky(),

        // 🎚 Bus
        brassBus,
        guitarBus,
        bassBus,
        keysBus,
        drumsBus,

        // 🎛 Effetti
        autoWah,
        dottedDelay,
        slapCompressor,

        // 🎚 Mixer dinamico
        setVolume: (busName, dbValue) => {
            const mixer = {
                trumpet: brassBus,
                trombone: brassBus,
                saxAlto: brassBus,
                clavinet: keysBus,
                noisy: keysBus,
                guitarMute: guitarBus,
                guitarClean: guitarBus,
                bassSlap: bassBus,
                drumFunky: drumsBus
            };
            const bus = mixer[busName];
            if (bus) bus.gain.value = Tone.dbToGain(dbValue);
        }
    };
}

export const funkyVolumeMap = {
    trumpet: "Tromba",
    trombone: "Trombone",
    saxAlto: "Sax Alto",
    clavinet: "Clavinet",
    noisy: "Noisy",
    guitarMute: "Chitarra Mute",
    guitarClean: "Chitarra Clean",
    bassSlap: "Basso Slap",
     drumFunky: "Batteria"
};