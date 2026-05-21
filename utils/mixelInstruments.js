// mixelInstruments.js — Tutti gli strumenti centralizzati
import * as Tone from "https://esm.sh/tone";
import { registerInstrumentLoaded } from "./common.js";

console.log("mixelInstruments.js ver. 001 loaded");

// ============================================================
// BASE URL PER I CAMPIONI
// ============================================================
const BASE_URL = "Samples/";

// ============================================================
// 1. CHITARRE
// ============================================================
const GUITAR_BASE = BASE_URL + "Guitar/";

export const guitarPalm = new Tone.Sampler({
    urls: {
        C2: "Palm/C.mp3", D2: "Palm/D.mp3", E2: "Palm/E.mp3",
        F2: "Palm/F.mp3", G2: "Palm/G.mp3", A2: "Palm/A.mp3", B2: "Palm/B.mp3"
    },
    baseUrl: GUITAR_BASE,
    attack: 0.015, release: 0.6,
    onload: () => registerInstrumentLoaded("GuitarPalm")
});

export const guitarOpen = new Tone.Sampler({
    urls: {
        C2: "Open/C.mp3", D2: "Open/D.mp3", E2: "Open/E.mp3",
        F2: "Open/F.mp3", G2: "Open/G.mp3", A2: "Open/A.mp3", B2: "Open/B.mp3"
    },
    baseUrl: GUITAR_BASE,
    attack: 0.02, release: 1.2,
    onload: () => registerInstrumentLoaded("GuitarOpen")
});

export const guitarLead = new Tone.Sampler({
    urls: {
        D2: "Lead/D2.mp3",
        F2: "Lead/F2.mp3",
        "G#2": "Lead/Gs2.mp3",     
        B2: "Lead/B2.mp3",
        D3: "Lead/D3.mp3",
        F3: "Lead/F3.mp3",
        "G#3": "Lead/Gs3.mp3",     
        B3: "Lead/B3.mp3",
        D4: "Lead/D4.mp3",
        F4: "Lead/F4.mp3",
        "G#4": "Lead/Gs4.mp3",     
        B4: "Lead/B4.mp3",
        D5: "Lead/D5.mp3",
        F5: "Lead/F5.mp3",
        "G#5": "Lead/Gs5.mp3",     
        B5: "Lead/B5.mp3",
        D6: "Lead/D6.mp3"
    },
    baseUrl: GUITAR_BASE,
    attack: 0.02, release: 0.8,
    onload: () => registerInstrumentLoaded("GuitarLead")
});

export const guitarMute = new Tone.Sampler({
    urls: {
        C4: "Mute/C4.mp3", D4: "Mute/D4.mp3", D5: "Mute/D5.mp3",
        E3: "Mute/E3.mp3", F5: "Mute/F5.mp3", G3: "Mute/G3.mp3",
        A3: "Mute/A3.mp3", "A#4": "Mute/As4.mp3", "A#5": "Mute/As5.mp3",
        "F#3": "Mute/Fs3.mp3"
    },
    baseUrl: GUITAR_BASE,
    release: 0.3,
    onload: () => registerInstrumentLoaded("GuitarMute")
});

export const guitarClean = new Tone.Sampler({
    urls: {
        C3: "Clean/C3.mp3", C4: "Clean/C4.mp3", C5: "Clean/C5.mp3", C6: "Clean/C6.mp3",
        "F#2": "Clean/Fs2.mp3", "F#3": "Clean/Fs3.mp3", "F#4": "Clean/Fs4.mp3", "F#5": "Clean/Fs5.mp3"
    },
    baseUrl: GUITAR_BASE,
    release: 1.0,
    onload: () => registerInstrumentLoaded("GuitarClean")
});

// ============================================================
// 2. BASSI
// ============================================================
const BASS_BASE = BASE_URL + "Bass/";

export const bassMetal = new Tone.Sampler({
    urls: {
        C1: "Metal/C1.mp3", Db1: "Metal/Db1.mp3", D1: "Metal/D1.mp3",
        Eb1: "Metal/Eb1.mp3", E1: "Metal/E1.mp3", F1: "Metal/F1.mp3",
        Gb1: "Metal/Gb1.mp3", G1: "Metal/G1.mp3", Ab1: "Metal/Ab1.mp3",
        A1: "Metal/A1.mp3", Bb1: "Metal/Bb1.mp3", B1: "Metal/B1.mp3",
        C2: "Metal/C2.mp3"
    },
    baseUrl: BASS_BASE,
    onload: () => registerInstrumentLoaded("BassMetal")
});

export const bassSlap = new Tone.Sampler({
    urls: {
        D1: "Slap/D1.mp3", D3: "Slap/D3.mp3", E0: "Slap/E0.mp3",
        E2: "Slap/E2.mp3", E4: "Slap/E4.mp3", F2: "Slap/F2.mp3",
        G0: "Slap/G0.mp3", G5: "Slap/G5.mp3", A1: "Slap/A1.mp3",
        A3: "Slap/A3.mp3", B1: "Slap/B1.mp3", "F#1": "Slap/Fs1.mp3"
    },
    baseUrl: BASS_BASE,
    release: 0.5,
    onload: () => registerInstrumentLoaded("BassSlap")
});

export const bassSynth = new Tone.Sampler({
    urls: {
        C2: "Synth/C2.mp3", C3: "Synth/C3.mp3", E2: "Synth/E2.mp3", "F#3": "Synth/Fs3.mp3"
    },
    baseUrl: BASE_URL + "Synth/Bass/",
    release: 2,
    onload: () => registerInstrumentLoaded("BassSynth")
});

// ============================================================
// 3. BATTERIE
// ============================================================
const DRUM_BASE = BASE_URL + "Drums/";

export const drumMetal = new Tone.Players({
    urls: {
        kick: "Metal/kick.mp3", snare: "Metal/snare.mp3", ghost: "Metal/ghost.mp3",
        hihat: "Metal/hihat_closed.mp3", openhat: "Metal/hihat_open.mp3",
        crash1: "Metal/crash_1.mp3", crash2: "Metal/crash_2.mp3",
        tom1: "Metal/tom_1.mp3", tom2: "Metal/tom_2.mp3", tom3: "Metal/tom_3.mp3",
        tom4: "Metal/tom_4.mp3", ride: "Metal/ride.mp3", ridebell: "Metal/ride_bell.mp3",
        china: "Metal/china.mp3"
    },
    baseUrl: DRUM_BASE,
    onload: () => registerInstrumentLoaded("DrumMetal")
});

export const drumFunky = new Tone.Players({
    urls: {
        kick: "Funky/kick.mp3", snare: "Funky/snare.mp3",
        hihatclose: "Funky/hihatclose.mp3", hihatopen: "Funky/hihatopen.mp3",
        crash: "Funky/crash.mp3", splash: "Funky/splash.mp3",
        ride: "Funky/ride.mp3", flatride: "Funky/flatride.mp3",
        floortom: "Funky/floortom.mp3", racktom: "Funky/racktom.mp3",
        xstick: "Funky/xstick.mp3"
    },
    baseUrl: DRUM_BASE,
    onload: () => registerInstrumentLoaded("DrumFunky")
});

export const percussion = new Tone.Players({
    urls: {
        timpano1: "Timpani/Timpani1.mp3", timpano2: "Timpani/Timpani2.mp3",
        timpano3: "Timpani/Timpani3.mp3", timpano4: "Timpani/Timpani4.mp3",
        timpano5: "Timpani/Timpani5.mp3", gong: "Timpani/Gong.mp3"
    },
    baseUrl: BASE_URL,
    release: 3,
    onload: () => registerInstrumentLoaded("Timpani")
});

// ============================================================
// 4. TASTIERE
// ============================================================
const KEYS_BASE = BASE_URL + "Keys/";

export const piano = new Tone.Sampler({
    urls: {
        A0: "Piano/A0.mp3", C1: "Piano/C1.mp3", "D#1": "Piano/Ds1.mp3", "F#1": "Piano/Fs1.mp3",
        A1: "Piano/A1.mp3", C2: "Piano/C2.mp3", "D#2": "Piano/Ds2.mp3", "F#2": "Piano/Fs2.mp3",
        A2: "Piano/A2.mp3", C3: "Piano/C3.mp3", "D#3": "Piano/Ds3.mp3", "F#3": "Piano/Fs3.mp3",
        A3: "Piano/A3.mp3", C4: "Piano/C4.mp3", "D#4": "Piano/Ds4.mp3", "F#4": "Piano/Fs4.mp3",
        A4: "Piano/A4.mp3", C5: "Piano/C5.mp3", "D#5": "Piano/Ds5.mp3", "F#5": "Piano/Fs5.mp3",
        A5: "Piano/A5.mp3", C6: "Piano/C6.mp3", "D#6": "Piano/Ds6.mp3", "F#6": "Piano/Fs6.mp3",
        A7: "Piano/A7.mp3", C8: "Piano/C8.mp3"
    },
    baseUrl: KEYS_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("Piano")
});

export const clavinet = new Tone.Sampler({
    urls: {
        C3: "Clavinet/C3.mp3", "C#3": "Clavinet/Cs3.mp3", D3: "Clavinet/D3.mp3", "D#3": "Clavinet/Ds3.mp3",
        E3: "Clavinet/E3.mp3", F3: "Clavinet/F3.mp3", "F#3": "Clavinet/Fs3.mp3", G3: "Clavinet/G3.mp3",
        "G#3": "Clavinet/Gs3.mp3", A3: "Clavinet/A3.mp3", "A#3": "Clavinet/As3.mp3", B3: "Clavinet/B3.mp3",
        C4: "Clavinet/C4.mp3", "C#4": "Clavinet/Cs4.mp3", D4: "Clavinet/D4.mp3", "D#4": "Clavinet/Ds4.mp3",
        E4: "Clavinet/E4.mp3", F4: "Clavinet/F4.mp3", "F#4": "Clavinet/Fs4.mp3", G4: "Clavinet/G4.mp3",
        "G#4": "Clavinet/Gs4.mp3", A4: "Clavinet/A4.mp3", "A#4": "Clavinet/As4.mp3", B4: "Clavinet/B4.mp3",
        C5: "Clavinet/C5.mp3"
    },
    baseUrl: KEYS_BASE,
    release: 0.8,
    onload: () => registerInstrumentLoaded("Clavinet")
});

export const organo = new Tone.Sampler({
    urls: {
        "A#1": "Organo/As1.mp3", "A#2": "Organo/As2.mp3", A1: "Organo/A1.mp3", A2: "Organo/A2.mp3",
        B1: "Organo/B1.mp3", B2: "Organo/B2.mp3", "C#1": "Organo/Cs1.mp3", "C#2": "Organo/Cs2.mp3",
        "C#3": "Organo/Cs3.mp3", C1: "Organo/C1.mp3", C2: "Organo/C2.mp3", C3: "Organo/C3.mp3",
        D1: "Organo/D1.mp3", D2: "Organo/D2.mp3", D3: "Organo/D3.mp3", "D#1": "Organo/Ds1.mp3",
        "D#2": "Organo/Ds2.mp3", "D#3": "Organo/Ds3.mp3", E1: "Organo/E1.mp3", E2: "Organo/E2.mp3",
        E3: "Organo/E3.mp3", "F#1": "Organo/Fs1.mp3", "F#2": "Organo/Fs2.mp3", "F#3": "Organo/Fs3.mp3",
        F1: "Organo/F1.mp3", F2: "Organo/F2.mp3", F3: "Organo/F3.mp3", "G#1": "Organo/Gs1.mp3",
        "G#2": "Organo/Gs2.mp3", G1: "Organo/G1.mp3", G2: "Organo/G2.mp3", G3: "Organo/G3.mp3"
    },
    baseUrl: KEYS_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("Organo")
});

// ============================================================
// 5. FIATI (Brass & Woodwinds)
// ============================================================
const BRASS_BASE = BASE_URL + "Brass/";

export const trumpet = new Tone.Sampler({
    urls: {
        A2: "Trumpet/A2.mp3", F2: "Trumpet/F2.mp3", C3: "Trumpet/C3.mp3", "D#3": "Trumpet/Ds3.mp3",
        G3: "Trumpet/G3.mp3", "A#3": "Trumpet/As3.mp3", D4: "Trumpet/D4.mp3", F4: "Trumpet/F4.mp3",
        A4: "Trumpet/A4.mp3", C5: "Trumpet/C5.mp3"
    },
    baseUrl: BRASS_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("Trumpet")
});

export const trombone = new Tone.Sampler({
    urls: {
        "A#0": "Trombone/As0.mp3", "D#1": "Trombone/Ds1.mp3", F1: "Trombone/F1.mp3", "A#1": "Trombone/As1.mp3",
        D2: "Trombone/D2.mp3", F2: "Trombone/F2.mp3", C3: "Trombone/C3.mp3", "C#3": "Trombone/Cs3.mp3",
        "D#3": "Trombone/Ds3.mp3", F3: "Trombone/F3.mp3"
    },
    baseUrl: BRASS_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("Trombone")
});

export const saxAlto = new Tone.Sampler({
    urls: {
        G2: "SaxAlto/G2.mp3", A2: "SaxAlto/A2.mp3", B2: "SaxAlto/B2.mp3",
        C3: "SaxAlto/C3.mp3", D3: "SaxAlto/D3.mp3", E3: "SaxAlto/E3.mp3", F3: "SaxAlto/F3.mp3",
        G3: "SaxAlto/G3.mp3", A3: "SaxAlto/A3.mp3", B3: "SaxAlto/B3.mp3",
        C4: "SaxAlto/C4.mp3", D4: "SaxAlto/D4.mp3", E4: "SaxAlto/E4.mp3", F4: "SaxAlto/F4.mp3",
        G4: "SaxAlto/G4.mp3", A4: "SaxAlto/A4.mp3", B4: "SaxAlto/B4.mp3",
        C5: "SaxAlto/C5.mp3", D5: "SaxAlto/D5.mp3", E5: "SaxAlto/E5.mp3", F5: "SaxAlto/F5.mp3",
        G5: "SaxAlto/G5.mp3", A5: "SaxAlto/A5.mp3", B5: "SaxAlto/B5.mp3"
    },
    baseUrl: BRASS_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("SaxAlto")
});

// ============================================================
// 6. ARCHI
// ============================================================
const STRINGS_BASE = BASE_URL + "Strings/";

export const violin = new Tone.Sampler({
    urls: {
        G2: "Violin/G2.mp3", A2: "Violin/A2.mp3", B2: "Violin/B2.mp3", C3: "Violin/C3.mp3",
        D3: "Violin/D3.mp3", E3: "Violin/E3.mp3", "F#3": "Violin/Fs3.mp3", G3: "Violin/G3.mp3",
        A3: "Violin/A3.mp3", B3: "Violin/B3.mp3", C4: "Violin/C4.mp3", D4: "Violin/D4.mp3",
        E4: "Violin/E4.mp3", "F#4": "Violin/Fs4.mp3", G4: "Violin/G4.mp3", A4: "Violin/A4.mp3",
        B4: "Violin/B4.mp3", C5: "Violin/C5.mp3", D5: "Violin/D5.mp3"
    },
    baseUrl: STRINGS_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("Violin")
});

export const viola = new Tone.Sampler({
    urls: {
        C2: "Viola/C2.mp3", D2: "Viola/D2.mp3", E2: "Viola/E2.mp3", F2: "Viola/F2.mp3",
        G2: "Viola/G2.mp3", A2: "Viola/A2.mp3", B2: "Viola/B2.mp3", C3: "Viola/C3.mp3",
        D3: "Viola/D3.mp3", E3: "Viola/E3.mp3", F3: "Viola/F3.mp3", G3: "Viola/G3.mp3",
        A3: "Viola/A3.mp3", B3: "Viola/B3.mp3", C4: "Viola/C4.mp3", D4: "Viola/D4.mp3",
        E4: "Viola/E4.mp3", F4: "Viola/F4.mp3", G4: "Viola/G4.mp3", A4: "Viola/A4.mp3",
        B4: "Viola/B4.mp3", C5: "Viola/C5.mp3", D5: "Viola/D5.mp3"
    },
    baseUrl: STRINGS_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("Viola")
});

export const cello = new Tone.Sampler({
    urls: {
        C1: "Cello/C1.mp3", D1: "Cello/D1.mp3", E1: "Cello/E1.mp3", F1: "Cello/F1.mp3",
        G1: "Cello/G1.mp3", A1: "Cello/A1.mp3", B1: "Cello/B1.mp3", C2: "Cello/C2.mp3",
        D2: "Cello/D2.mp3", E2: "Cello/E2.mp3", F2: "Cello/F2.mp3", G2: "Cello/G2.mp3",
        A2: "Cello/A2.mp3", B2: "Cello/B2.mp3", C3: "Cello/C3.mp3", D3: "Cello/D3.mp3",
        E3: "Cello/E3.mp3", F3: "Cello/F3.mp3", G3: "Cello/G3.mp3", A3: "Cello/A3.mp3",
        B3: "Cello/B3.mp3", C4: "Cello/C4.mp3", D4: "Cello/D4.mp3", E4: "Cello/E4.mp3",
        F4: "Cello/F4.mp3", G4: "Cello/G4.mp3", A4: "Cello/A4.mp3"
    },
    baseUrl: STRINGS_BASE,
    release: 1.5,
    onload: () => registerInstrumentLoaded("Cello")
});

export const doubleBass = new Tone.Sampler({
    urls: {
        E0: "DoubleBass/E0.mp3", F0: "DoubleBass/F0.mp3", "F#0": "DoubleBass/Fs0.mp3", G0: "DoubleBass/G0.mp3",
        "G#0": "DoubleBass/Gs0.mp3", A0: "DoubleBass/A0.mp3", "A#0": "DoubleBass/As0.mp3", B0: "DoubleBass/B0.mp3",
        C1: "DoubleBass/C1.mp3", "C#1": "DoubleBass/Cs1.mp3", D1: "DoubleBass/D1.mp3", "D#1": "DoubleBass/Ds1.mp3",
        E1: "DoubleBass/E1.mp3", F1: "DoubleBass/F1.mp3", "F#1": "DoubleBass/Fs1.mp3", G1: "DoubleBass/G1.mp3",
        "G#1": "DoubleBass/Gs1.mp3", A1: "DoubleBass/A1.mp3", "A#1": "DoubleBass/As1.mp3", B1: "DoubleBass/B1.mp3"
    },
    baseUrl: STRINGS_BASE,
    release: 2,
    onload: () => registerInstrumentLoaded("DoubleBass")
});

// ============================================================
// 7. SYNTH & FX
// ============================================================
const SYNTH_BASE = BASE_URL + "Synth/";

export const leadSaw = new Tone.Sampler({
    urls: { C3: "LeadSaw/C3.mp3", C4: "LeadSaw/C4.mp3", E3: "LeadSaw/E3.mp3", E4: "LeadSaw/E4.mp3" },
    baseUrl: SYNTH_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("LeadSaw")
});

export const leadSynthBrass1 = new Tone.Sampler({
    urls: { C3: "LeadSynthBrass1/C3.mp3", C4: "LeadSynthBrass1/C4.mp3", "F#3": "LeadSynthBrass1/Fs3.mp3", "F#4": "LeadSynthBrass1/Fs4.mp3" },
    baseUrl: SYNTH_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("LeadSynthBrass1")
});

export const leadSynthBrass2 = new Tone.Sampler({
    urls: { C3: "LeadSynthBrass2/C3.mp3", C4: "LeadSynthBrass2/C4.mp3", "F#3": "LeadSynthBrass2/Fs3.mp3", "F#4": "LeadSynthBrass2/Fs4.mp3" },
    baseUrl: SYNTH_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("LeadSynthBrass2")
});

export const subBass = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.15, sustain: 0.8, release: 0.2 }
});

export const bassAttack = new Tone.Synth({
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.05 }
});

// ============================================================
// 8. PADS
// ============================================================
const PAD_BASE = SYNTH_BASE;

export const bellsPad = new Tone.Sampler({
    urls: { C2: "BellsPad/C2.mp3", C3: "BellsPad/C3.mp3", C4: "BellsPad/C4.mp3", C5: "BellsPad/C5.mp3" },
    baseUrl: PAD_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("BellsPad")
});

export const glassPad = new Tone.Sampler({
    urls: { C2: "GlassPad/C2.mp3", C3: "GlassPad/C3.mp3", C4: "GlassPad/C4.mp3" },
    baseUrl: PAD_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("GlassPad")
});

export const warmPad = new Tone.Sampler({
    urls: { C3: "WarmPad/C3.mp3", "F#3": "WarmPad/Fs3.mp3", C4: "WarmPad/C4.mp3", "F#4": "WarmPad/Fs4.mp3" },
    baseUrl: PAD_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("WarmPad")
});

export const wavePad = new Tone.Sampler({
    urls: { C3: "WavePad/C3.mp3", E3: "WavePad/E3.mp3", C4: "WavePad/C4.mp3", E4: "WavePad/E4.mp3" },
    baseUrl: PAD_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("WavePad")
});

export const StStringPad = new Tone.Sampler({
    urls: { C2: "StStringPad/C2.mp3", C3: "StStringPad/C3.mp3", C4: "StStringPad/C4.mp3", C5: "StStringPad/C5.mp3" },
    baseUrl: PAD_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("StStringPad")
});

// ============================================================
// 9. FX
// ============================================================
const FX_BASE = SYNTH_BASE;

export const fxSweep = new Tone.Sampler({
    urls: { C4: "FxSweep/C4.mp3" },
    baseUrl: FX_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("FxSweep")
});

export const fxNoise = new Tone.Sampler({
    urls: { C4: "FxNoise/C4.mp3" },
    baseUrl: FX_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("FxNoise")
});

export const fxFantasy = new Tone.Sampler({
    urls: { C3: "FxFantasy/C3.mp3", C4: "FxFantasy/C4.mp3", C5: "FxFantasy/C5.mp3" },
    baseUrl: FX_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("FxFantasy")
});

export const fxHeaven = new Tone.Sampler({
    urls: { C3: "FxHeaven/C3.mp3", C4: "FxHeaven/C4.mp3", C5: "FxHeaven/C5.mp3" },
    baseUrl: FX_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("FxHeaven")
});

export const fxJump = new Tone.Sampler({
    urls: { C3: "FxJump/C3.mp3", C4: "FxJump/C4.mp3", C5: "FxJump/C5.mp3", E3: "FxJump/E3.mp3", E4: "FxJump/E4.mp3" },
    baseUrl: FX_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("FxJump")
});

export const fxHardFTCore = new Tone.Sampler({
    urls: { C2: "FxHardFTCore/C2.mp3", C4: "FxHardFTCore/C4.mp3", C5: "FxHardFTCore/C5.mp3", E3: "FxHardFTCore/E3.mp3", E4: "FxHardFTCore/E4.mp3" },
    baseUrl: FX_BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("FxHardFTCore")
});

// ============================================================
// NORMALIZE NOTE CENTRALIZZATA (con note reali)
// ============================================================
export function normalizeNote(note, instrumentName) {
    if (!note || typeof note !== "string") return "C3";

    const match = note.match(/^([A-G][#b]?)(\d+)?$/);
    if (!match) return "C3";

    const targetRoot = match[1];
    const targetOct = match[2] ? parseInt(match[2]) : 3;

    const availableNotesMap = {
        // Chitarre
        guitarMute: ["E3", "F#3", "G3", "A3", "C4", "D4", "A#4", "D5", "F5", "A#5"],
        guitarClean: ["F#2", "C3", "F#3", "C4", "F#4", "C5", "F#5", "C6"],
        guitarPalm: ["C", "D", "E", "F", "G", "A", "B"],
        guitarOpen: ["C", "D", "E", "F", "G", "A", "B"],
        guitarLead: ["D2", "F2", "G#2", "B2", "D3", "F3", "G#3", "B3", "D4", "F4", "G#4", "B4", "D5", "F5", "G#5", "B5", "D6"],
        
        // Bassi
        bassMetal: ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
        bassSlap: ["E0", "G0", "D1", "A1", "B1", "F#1", "E2", "F2", "A3", "D3", "E4", "G5"],
        bassSynth: ["A", "A#", "C", "D#", "E", "F", "F#", "G"],
        
        // Fiati
        trumpet: ["A2", "F2", "C3", "D#3", "G3", "A#3", "D4", "F4", "A4", "C5"],
        trombone: ["A#0", "D#1", "F1", "D2", "F2", "A#1", "C3", "C#3", "D#3", "F3"],
        saxAlto: ["G2","A2","B2","C3","D3","E3","F3","G3","A3","B3","C4","D4","E4","F4","G4","A4","B4","C5","D5","E5","F5","G5","A5","B5"],
        
        // Tastiere
        clavinet: ["C3","C#3","D3","D#3","E3","F3","F#3","G3","G#3","A3","A#3","B3","C4","C#4","D4","D#4","E4","F4","F#4","G4","G#4","A4","A#4","B4","C5"],
        piano: ["C","F#"],
        organo: ["A","A#","B","C","C#","D","D#","E","F","F#","G","G#"],
        
        // Synth
        leadSaw: ["C", "E"],
        leadSynthBrass1: ["C", "F#"],
        leadSynthBrass2: ["C", "F#"],
        
        // Pad
        bellsPad: ["C"],
        glassPad: ["C"],
        warmPad: ["C", "F#"],
        wavePad: ["C", "E"],
        StStringPad: ["C"],
        
        // Default
        default: ["C", "D", "E", "F", "G", "A", "B"]
    };

    const available = availableNotesMap[instrumentName] || availableNotesMap.default;
    
    let targetMidi;
    try {
        targetMidi = Tone.Frequency(`${targetRoot}${targetOct}`).toMidi();
    } catch(e) {
        targetMidi = Tone.Frequency("C3").toMidi();
    }

    // ============================================================
// NORMALIZE NOTE CENTRALIZZATA (con note reali) - PARTE FINALE
// ============================================================

    let bestNote = available[0];
    let bestDist = Infinity;

    for (const n of available) {
        try {
            const noteWithOctave = /\d/.test(n) ? n : n + targetOct;
            const midi = Tone.Frequency(noteWithOctave).toMidi();
            const dist = Math.abs(midi - targetMidi);
            if (dist < bestDist) {
                bestDist = dist;
                bestNote = n;
            }
        } catch(e) {
            console.warn(`Nota non valida: ${n} per ${instrumentName}`);
        }
    }

    return bestNote;
    
    console.log("✅ mixelInstruments.js caricato completamente");
}
