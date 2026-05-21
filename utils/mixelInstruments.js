// mixelInstruments.js — Unified Instrument Library (B2 Naming)
// Contiene SOLO strumenti, nessun routing, nessun bus, nessun EQ.
// Ogni genere importerà ciò che gli serve.

import * as Tone from "https://esm.sh/tone";
import { registerInstrumentLoaded } from "../common.js";

console.log("mixelInstruments.js — unified library loaded");

// Base URL
const BASE = "Samples/";

// ======================
// 🎸 GUITARS
// ======================

export const guitarPalm = new Tone.Sampler({
    urls: {
        C2: "GuitarPalm/C.mp3", D2: "GuitarPalm/D.mp3", E2: "GuitarPalm/E.mp3",
        F2: "GuitarPalm/F.mp3", G2: "GuitarPalm/G.mp3", A2: "GuitarPalm/A.mp3", B2: "GuitarPalm/B.mp3"
    },
    baseUrl: BASE,
    release: 0.6,
    onload: () => registerInstrumentLoaded("guitarPalm")
});

export const guitarOpen = new Tone.Sampler({
    urls: {
        C2: "GuitarOpen/C.mp3", D2: "GuitarOpen/D.mp3", E2: "GuitarOpen/E.mp3",
        F2: "GuitarOpen/F.mp3", G2: "GuitarOpen/G.mp3", A2: "GuitarOpen/A.mp3", B2: "GuitarOpen/B.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("guitarOpen")
});

export const guitarLead = new Tone.Sampler({
    urls: {
        C2:"Guitar/C2.mp3","C#2":"Guitar/Cs2.mp3",D2:"Guitar/D2.mp3","D#2":"Guitar/Ds2.mp3",
        E2:"Guitar/E2.mp3",F2:"Guitar/F2.mp3","F#2":"Guitar/Fs2.mp3",G2:"Guitar/G2.mp3",
        "G#2":"Guitar/Gs2.mp3",A2:"Guitar/A2.mp3","A#2":"Guitar/As2.mp3",B2:"Guitar/B2.mp3",
        C3:"Guitar/C3.mp3","C#3":"Guitar/Cs3.mp3",D3:"Guitar/D3.mp3","D#3":"Guitar/Ds3.mp3",
        E3:"Guitar/E3.mp3",F3:"Guitar/F3.mp3","F#3":"Guitar/Fs3.mp3",G3:"Guitar/G3.mp3",
        "G#3":"Guitar/Gs3.mp3",A3:"Guitar/A3.mp3","A#3":"Guitar/As3.mp3",B3:"Guitar/B3.mp3",
        C4:"Guitar/C4.mp3","C#4":"Guitar/Cs4.mp3",D4:"Guitar/D4.mp3","D#4":"Guitar/Ds4.mp3",
        E4:"Guitar/E4.mp3",F4:"Guitar/F4.mp3","F#4":"Guitar/Fs4.mp3",G4:"Guitar/G4.mp3",
        "G#4":"Guitar/Gs4.mp3",A4:"Guitar/A4.mp3","A#4":"Guitar/As4.mp3",B4:"Guitar/B4.mp3",
        C5:"Guitar/C5.mp3","C#5":"Guitar/Cs5.mp3",D5:"Guitar/D5.mp3","D#5":"Guitar/Ds5.mp3",
        E5:"Guitar/E5.mp3",F5:"Guitar/F5.mp3","F#5":"Guitar/Fs5.mp3",G5:"Guitar/G5.mp3",
        "G#5":"Guitar/Gs5.mp3",A5:"Guitar/A5.mp3","A#5":"Guitar/As5.mp3",B5:"Guitar/B5.mp3",
        C6:"Guitar/C6.mp3"
    },
    baseUrl: BASE,
    release: 0.8,
    onload: () => registerInstrumentLoaded("guitarLead")
});

export const guitarMute = new Tone.Sampler({
    urls: {
        C4:"GuitarMute/C4.mp3",D4:"GuitarMute/D4.mp3",D5:"GuitarMute/D5.mp3",
        E3:"GuitarMute/E3.mp3","F#3":"GuitarMute/Fs3.mp3",F5:"GuitarMute/F5.mp3",
        G3:"GuitarMute/G3.mp3",A3:"GuitarMute/A3.mp3","A#4":"GuitarMute/As4.mp3",
        "A#5":"GuitarMute/As5.mp3"
    },
    baseUrl: BASE,
    release: 0.3,
    onload: () => registerInstrumentLoaded("guitarMute")
});

export const guitarClean = new Tone.Sampler({
    urls: {
        C3:"GuitarClean/C3.mp3",C4:"GuitarClean/C4.mp3",C5:"GuitarClean/C5.mp3",C6:"GuitarClean/C6.mp3",
        "F#2":"GuitarClean/Fs2.mp3","F#3":"GuitarClean/Fs3.mp3","F#4":"GuitarClean/Fs4.mp3","F#5":"GuitarClean/Fs5.mp3"
    },
    baseUrl: BASE,
    release: 1.0,
    onload: () => registerInstrumentLoaded("guitarClean")
});

// ======================
// 🎚 BASS
// ======================

export const bassMetal = new Tone.Sampler({
    urls: {
        C1:"Bass/C1.mp3","C#1":"Bass/Cs1.mp3",D1:"Bass/D1.mp3","D#1":"Bass/Ds1.mp3",
        E1:"Bass/E1.mp3",F1:"Bass/F1.mp3","F#1":"Bass/Fs1.mp3",G1:"Bass/G1.mp3",
        "G#1":"Bass/Gs1.mp3",A1:"Bass/A1.mp3","A#1":"Bass/As1.mp3",B1:"Bass/B1.mp3",
        C2:"Bass/C2.mp3"
    },
    baseUrl: BASE,
    onload: () => registerInstrumentLoaded("bassMetal")
});

export const bassSlap = new Tone.Sampler({
    urls: {
        D1:"BassSlap/D1.mp3",D3:"BassSlap/D3.mp3",E0:"BassSlap/E0.mp3",
        E2:"BassSlap/E2.mp3",E4:"BassSlap/E4.mp3",F2:"BassSlap/F2.mp3",
        G0:"BassSlap/G0.mp3",G5:"BassSlap/G5.mp3",A1:"BassSlap/A1.mp3",
        A3:"BassSlap/A3.mp3",B1:"BassSlap/B1.mp3","F#1":"BassSlap/Fs1.mp3"
    },
    baseUrl: BASE,
    release: 0.5,
    onload: () => registerInstrumentLoaded("bassSlap")
});

export const bassSynth = new Tone.Sampler({
    urls: {
        C2:"Synth/Bass/C2.mp3",C3:"Synth/Bass/C3.mp3",
        E2:"Synth/Bass/E2.mp3","F#3":"Synth/Bass/Fs3.mp3"
    },
    baseUrl: BASE,
    release: 2,
    onload: () => registerInstrumentLoaded("bassSynth")
});

// Dance bass (Lately)
export const bassDance = new Tone.Sampler({
    urls: {
        C2:"Synth/Bass/C2.mp3",C3:"Synth/Bass/C3.mp3",
        E2:"Synth/Bass/E2.mp3","F#3":"Synth/Bass/Fs3.mp3"
    },
    baseUrl: BASE,
    release: 2,
    onload: () => registerInstrumentLoaded("bassDance")
});

// Sub + Attack (Dance)
export const subBass = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0.8, release: 0.2 }
});

export const bassAttack = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
});

// ======================
// 🎷 BRASS
// ======================

export const brassTrumpet = new Tone.Sampler({
    urls: {
        A2:"Trumpet/A2.mp3",F2:"Trumpet/F2.mp3",C3:"Trumpet/C3.mp3","D#3":"Trumpet/Ds3.mp3",
        G3:"Trumpet/G3.mp3","A#3":"Trumpet/As3.mp3",D4:"Trumpet/D4.mp3",
        F4:"Trumpet/F4.mp3",A4:"Trumpet/A4.mp3",C5:"Trumpet/C5.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("brassTrumpet")
});

export const brassTrombone = new Tone.Sampler({
    urls: {
        "A#0":"Trombone/As0.mp3","D#1":"Trombone/Ds1.mp3",F1:"Trombone/F1.mp3",
        "A#1":"Trombone/As1.mp3",D2:"Trombone/D2.mp3",F2:"Trombone/F2.mp3",
        C3:"Trombone/C3.mp3","C#3":"Trombone/Cs3.mp3","D#3":"Trombone/Ds3.mp3",
        F3:"Trombone/F3.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("brassTrombone")
});

export const brassSaxAlto = new Tone.Sampler({
    urls: {
        G2:"SaxAlto/G2.mp3",A2:"SaxAlto/A2.mp3",B2:"SaxAlto/B2.mp3",
        C3:"SaxAlto/C3.mp3",D3:"SaxAlto/D3.mp3",E3:"SaxAlto/E3.mp3",F3:"SaxAlto/F3.mp3",
        G3:"SaxAlto/G3.mp3",A3:"SaxAlto/A3.mp3",B3:"SaxAlto/B3.mp3",
        C4:"SaxAlto/C4.mp3",D4:"SaxAlto/D4.mp3",E4:"SaxAlto/E4.mp3",F4:"SaxAlto/F4.mp3",
        G4:"SaxAlto/G4.mp3",A4:"SaxAlto/A4.mp3",B4:"SaxAlto/B4.mp3",
        C5:"SaxAlto/C5.mp3",D5:"SaxAlto/D5.mp3",E5:"SaxAlto/E5.mp3",F5:"SaxAlto/F5.mp3",
        G5:"SaxAlto/G5.mp3",A5:"SaxAlto/A5.mp3",B5:"SaxAlto/B5.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("brassSaxAlto")
});

// ======================
// 🎹 KEYS
// ======================

export const keysClavinet = new Tone.Sampler({
    urls: {
        C3:"Clavinet/C3.mp3","C#3":"Clavinet/Cs3.mp3",D3:"Clavinet/D3.mp3","D#3":"Clavinet/Ds3.mp3",
        E3:"Clavinet/E3.mp3",F3:"Clavinet/F3.mp3","F#3":"Clavinet/Fs3.mp3",G3:"Clavinet/G3.mp3",
        "G#3":"Clavinet/Gs3.mp3",A3:"Clavinet/A3.mp3","A#3":"Clavinet/As3.mp3",B3:"Clavinet/B3.mp3",
        C4:"Clavinet/C4.mp3","C#4":"Clavinet/Cs4.mp3",D4:"Clavinet/D4.mp3","D#4":"Clavinet/Ds4.mp3",
        E4:"Clavinet/E4.mp3",F4:"Clavinet/F4.mp3","F#4":"Clavinet/Fs4.mp3",G4:"Clavinet/G4.mp3",
        "G#4":"Clavinet/Gs4.mp3",A4:"Clavinet/A4.mp3","A#4":"Clavinet/As4.mp3",B4:"Clavinet/B4.mp3",
        C5:"Clavinet/C5.mp3"
    },
    baseUrl: BASE,
    release: 0.8,
    onload: () => registerInstrumentLoaded("keysClavinet")
});

export const keysOrgan = new Tone.Sampler({
    urls: {
        "A#1":"Organo/As1.mp3","A#2":"Organo/As2.mp3",A1:"Organo/A1.mp3",A2:"Organo/A2.mp3",
        B1:"Organo/B1.mp3",B2:"Organo/B2.mp3","C#1":"Organo/Cs1.mp3","C#2":"Organo/Cs2.mp3",
        "C#3":"Organo/Cs3.mp3",C1:"Organo/C1.mp3",C2:"Organo/C2.mp3",C3:"Organo/C3.mp3",
        D1:"Organo/D1.mp3",D2:"Organo/D2.mp3",D3:"Organo/D3.mp3","D#1":"Organo/Ds1.mp3",
        "D#2":"Organo/Ds2.mp3","D#3":"Organo/Ds3.mp3",E1:"Organo/E1.mp3",E2:"Organo/E2.mp3",
        E3:"Organo/E3.mp3","F#1":"Organo/Fs1.mp3","F#2":"Organo/Fs2.mp3","F#3":"Organo/Fs3.mp3",
        F1:"Organo/F1.mp3",F2:"Organo/F2.mp3",F3:"Organo/F3.mp3","G#1":"Organo/Gs1.mp3",
        "G#2":"Organo/Gs2.mp3",G1:"Organo/G1.mp3",G2:"Organo/G2.mp3",G3:"Organo/G3.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("keysOrgan")
});

// ======================
// 🎼 PADS
// ======================

export const padBells = new Tone.Sampler({
    urls: { C2:"BellsPad/C2.mp3",C3:"BellsPad/C3.mp3",C4:"BellsPad/C4.mp3",C5:"BellsPad/C5.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padBells")
});

export const padGlass = new Tone.Sampler({
    urls: { C2:"GlassPad/C2.mp3",C3:"GlassPad/C3.mp3",C4:"GlassPad/C4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padGlass")
});

export const padWarm = new Tone.Sampler({
    urls: { C3:"WarmPad/C3.mp3","F#3":"WarmPad/Fs3.mp3",C4:"WarmPad/C4.mp3","F#4":"WarmPad/Fs4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padWarm")
});

export const padWave = new Tone.Sampler({
    urls: { C3:"WavePad/C3.mp3",E3:"WavePad/E3.mp3",C4:"WavePad/C4.mp3",E4:"WavePad/E4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padWave")
});

export const padShaku = new Tone.Sampler({
    urls: { C3:"ShakuPad/C3.mp3","F#3":"ShakuPad/Fs3.mp3",C4:"ShakuPad/C4.mp3","F#4":"ShakuPad/Fs4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padShaku")
});

export const padString = new Tone.Sampler({
    urls: { C2:"StStringPad/C2.mp3",C3:"StStringPad/C3.mp3",C4:"StStringPad/C4.mp3",C5:"StStringPad/C5.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padString")
});

// ======================
// 🎧 FX
// ======================

export const fxSweep = new Tone.Sampler({
    urls: { C4:"FxSweep/C4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxSweep")
});

export const fxNoise = new Tone.Sampler({
    urls: { C4:"FxNoise/C4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxNoise")
});

export const fxFantasy = new Tone.Sampler({
    urls: { C3:"FxFantasy/C3.mp3",C4:"FxFantasy/C4.mp3",C5:"FxFantasy/C5.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxFantasy")
});

export const fxHeaven = new Tone.Sampler({
    urls: { C3:"FxHeaven/C3.mp3",C4:"FxHeaven/C4.mp3",C5:"FxHeaven/C5.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxHeaven")
});

export const fxJump = new Tone.Sampler({
    urls: { C3:"FxJump/C3.mp3",C4:"FxJump/C4.mp3",C5:"FxJump/C5.mp3",E3:"FxJump/E3.mp3",E4:"FxJump/E4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxJump")
});

export const fxHardCore = new Tone.Sampler({
    urls: { C2:"FxHardFTCore/C2.mp3",C4:"FxHardFTCore/C4.mp3",C5:"FxHardFTCore/C5.mp3",E3:"FxHardFTCore/E3.mp3",E4:"FxHardFTCore/E4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxHardCore")
});

export const fxNoisy = new Tone.Players({
    urls: {
        A4:"Noisy/A4.mp3",A5:"Noisy/A5.mp3",C4:"Noisy/C4.mp3","C#5":"Noisy/Cs5.mp3",
        D6:"Noisy/D6.mp3",E4:"Noisy/E4.mp3","F#6":"Noisy/Fs6.mp3"
    },
    baseUrl: BASE,
    release: 0.5,
    onload: () => registerInstrumentLoaded("fxNoisy")
});

// ======================
// 🥁 DRUMS
// ======================

export const drumsMetal = new Tone.Players({
    urls: {
        kick:"Drums/kick.mp3",snare:"Drums/snare.mp3",ghost:"Drums/ghost.mp3",
        hihat:"Drums/hihatclosed.mp3",openhat:"Drums/hihatopen.mp3",
        crash1:"Drums/crash1.mp3",crash2:"Drums/crash2.mp3",
        tom1:"Drums/tom1.mp3",tom2:"Drums/tom2.mp3",tom3:"Drums/tom3.mp3",tom4:"Drums/tom4.mp3",
        ride:"Drums/ride.mp3",ridebell:"Drums/ridebell.mp3",china:"Drums/china.mp3"
    },
    baseUrl: BASE,
    onload: () => registerInstrumentLoaded("drumsMetal")
});

export const drumsFunky = new Tone.Players({
    urls: {
        kick:"DrumFunky/kick.mp3",snare:"DrumFunky/snare.mp3",
        hihatclose:"DrumFunky/hihatclose.mp3",hihatopen:"DrumFunky/hihatopen.mp3",
        crash:"DrumFunky/crash.mp3",splash:"DrumFunky/splash.mp3",
        ride:"DrumFunky/ride.mp3",flatride:"DrumFunky/flatride.mp3",
        floortom:"DrumFunky/floortom.mp3",racktom:"DrumFunky/racktom.mp3",
        xstick:"DrumFunky/xstick.mp3"
    },
    baseUrl: BASE,
    onload: () => registerInstrumentLoaded("drumsFunky")
});

export const drumsDance = new Tone.Players({
    urls: {
        bassDrum:"Percussion/BassDrum.mp3",kick:"Percussion/Kick.mp3",
        closedHat:"Percussion/ClosedHat.mp3",crash:"Percussion/Crash.mp3",
        handClap:"Percussion/HandClap.mp3",hiTom:"Percussion/HiTom.mp3",
        lowTom:"Percussion/LowTom.mp3",midTom:"Percussion/MidTom.mp3",
        openHat:"Percussion/OpenHat.mp3",ride:"Percussion/Ride.mp3",
        rimShot:"Percussion/RimShot.mp3",snareDrum:"Percussion/SnareDrum.mp3"
    },
    baseUrl: BASE,
    onload: () => registerInstrumentLoaded("drumsDance")
});

// Timpani (Orchestra)
export const timpani = new Tone.Players({
    urls: {
        timpano1:"Timpani/Timpani1.mp3",
        timpano2:"Timpani/Timpani2.mp3",
        timpano3:"Timpani/Timpani3.mp3",
        timpano4:"Timpani/Timpani4.mp3",
        timpano5:"Timpani/Timpani5.mp3",
        gong:"Timpani/Gong.mp3"
    },
    baseUrl: BASE,
    release: 3,
    onload: () => registerInstrumentLoaded("timpani")
});

// ======================
// 🎹 PIANO
// ======================

export const pianoSalamander = new Tone.Sampler({
    urls: {
        "A0":"Piano/A0.mp3", "C1":"Piano/C1.mp3", "D#1":"Piano/Ds1.mp3", "F#1":"Piano/Fs1.mp3",
        "A1":"Piano/A1.mp3", "C2":"Piano/C2.mp3", "D#2":"Piano/Ds2.mp3", "F#2":"Piano/Fs2.mp3",
        "A2":"Piano/A2.mp3", "C3":"Piano/C3.mp3", "D#3":"Piano/Ds3.mp3", "F#3":"Piano/Fs3.mp3",
        "A3":"Piano/A3.mp3", "C4":"Piano/C4.mp3", "D#4":"Piano/Ds4.mp3", "F#4":"Piano/Fs4.mp3",
        "A4":"Piano/A4.mp3", "C5":"Piano/C5.mp3", "D#5":"Piano/Ds5.mp3", "F#5":"Piano/Fs5.mp3",
        "A5":"Piano/A5.mp3", "C6":"Piano/C6.mp3", "D#6":"Piano/Ds6.mp3", "F#6":"Piano/Fs6.mp3",
        "A7":"Piano/A7.mp3", "C8":"Piano/C8.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("pianoSalamander")
});

// ============================================================================
// 🎵 MAPPA NOTE DISPONIBILI PER OGNI STRUMENTO (UNIVERSALE)
// ============================================================================

const availableNotesMap = {

    // 🎸 GUITARS
    guitarPalm: ["C2","D2","E2","F2","G2","A2","B2"],
    guitarOpen: ["C2","D2","E2","F2","G2","A2","B2"],
    guitarLead: [
        "C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2","A2","A#2","B2",
        "C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3",
        "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
        "C5","C#5","D5","D#5","E5","F5","F#5","G5","G#5","A5","A#5","B5",
        "C6"
    ],
    guitarMute: ["E3","F#3","G3","A3","C4","D4","A#4","D5","F5","A#5"],
    guitarClean: ["F#2","C3","F#3","C4","F#4","C5","F#5","C6"],

    // 🎚 BASS
    bassMetal: ["C1","C#1","D1","D#1","E1","F1","F#1","G1","G#1","A1","A#1","B1","C2"],
    bassSlap: ["E0","G0","D1","A1","B1","F#1","E2","F2","A3","D3","E4","G5"],
    bassSynth: ["C2","E2","C3","F#3"],
    bassDance: ["C2","E2","C3","F#3"],

    // Synth bass (sub/attack) → non ha note reali
    subBass: ["C"],
    bassAttack: ["C"],

    // 🎷 BRASS
    brassTrumpet: ["A2","F2","C3","D#3","G3","A#3","D4","F4","A4","C5"],
    brassTrombone: ["A#0","D#1","F1","A#1","D2","F2","C3","C#3","D#3","F3"],
    brassSaxAlto: [
        "G2","A2","B2",
        "C3","D3","E3","F3","G3","A3","B3",
        "C4","D4","E4","F4","G4","A4","B4",
        "C5","D5","E5","F5","G5","A5","B5"
    ],

    // 🎹 KEYS
    keysClavinet: [
        "C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3",
        "C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4",
        "C5"
    ],
    keysOrgan: [
        "A1","A#1","B1","C1","C#1","D1","D#1","E1","F1","F#1","G1","G#1",
        "A2","A#2","B2","C2","C#2","D2","D#2","E2","F2","F#2","G2","G#2",
        "C3","C#3","D3","D#3","E3","F3","F#3","G3"
    ],

    // 🎹 PIANO
    pianoSalamander: [
        "A0","C1","D#1","F#1",
        "A1","C2","D#2","F#2",
        "A2","C3","D#3","F#3",
        "A3","C4","D#4","F#4",
        "A4","C5","D#5","F#5",
        "A5","C6","D#6","F#6",
        "A7","C8"
    ],

    // 🎼 PADS
    padBells: ["C2","C3","C4","C5"],
    padGlass: ["C2","C3","C4"],
    padWarm: ["C3","F#3","C4","F#4"],
    padWave: ["C3","E3","C4","E4"],
    padShaku: ["C3","F#3","C4","F#4"],
    padString: ["C2","C3","C4","C5"],

    // 🎧 FX
    fxSweep: ["C4"],
    fxNoise: ["C4"],
    fxFantasy: ["C3","C4","C5"],
    fxHeaven: ["C3","C4","C5"],
    fxJump: ["C3","E3","C4","E4","C5"],
    fxHardCore: ["C2","E3","C4","E4","C5"],
    fxNoisy: ["C4","E4","A4","C#5","A5","D6","F#6"],

    // 🥁 DRUMS (percussioni → sempre C)
    drumsMetal: ["C"],
    drumsFunky: ["C"],
    drumsDance: ["C"],
    timpani: ["C"],

    // fallback
    default: ["C3"]
};

// ============================================================================
// 🎼 NORMALIZE NOTE UNIVERSALE
// ============================================================================

export function normalizeNote(note, instrumentName) {

    // Fallback sicuro
    if (!note || typeof note !== "string") return "C3";

    // Parsing nota richiesta
    const match = note.match(/^([A-G][#b]?)(\d+)?$/);
    if (!match) return "C3";

    const targetRoot = match[1];
    const targetOct = match[2] ? parseInt(match[2]) : 3;

    // Recupera note disponibili
    const available = availableNotesMap[instrumentName] || availableNotesMap.default;

    // Strumenti percussivi → sempre C
    if (available.length === 1 && available[0] === "C") return "C";

    // Converte target in MIDI
    let targetMidi;
    try {
        targetMidi = Tone.Frequency(`${targetRoot}${targetOct}`).toMidi();
    } catch {
        targetMidi = Tone.Frequency("C3").toMidi();
    }

    // Trova la nota più vicina
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
        } catch {
            console.warn(`Nota non valida: ${n} per ${instrumentName}`);
        }
    }

    return bestNote;
}
