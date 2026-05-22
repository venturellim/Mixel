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
    baseUrl: BASE,
    attack: 0.02,
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
// 🎻 STRINGS (ORCHESTRA)
// ======================

export const violin = new Tone.Sampler({
    urls: { 
        A2: "Violin/A2.mp3", 
        A3: "Violin/A3.mp3",
        B2: "Violin/B2.mp3", 
        B4: "Violin/B4.mp3",
        C4: "Violin/C4.mp3", 
        D3: "Violin/D3.mp3",
        D5: "Violin/D5.mp3", 
        E4: "Violin/E4.mp3",
        "F#3": "Violin/Fs3.mp3",
        G2: "Violin/G2.mp3", 
        G4: "Violin/G4.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("violin")
});

export const viola = new Tone.Sampler({
    urls: {  
        A3: "Viola/A3.mp3",
        B2: "Viola/B2.mp3", 
        C2: "Viola/C2.mp3",
        C4: "Viola/C4.mp3", 
        D2: "Viola/D2.mp3",
        D3: "Viola/D3.mp3",
        D5: "Viola/D5.mp3",
        E2: "Viola/E2.mp3",
        E4: "Viola/E4.mp3",
        G2: "Viola/G2.mp3", 
        G4: "Viola/G4.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("viola")
});

export const cello = new Tone.Sampler({
    urls: { 
        A2: "Cello/A2.mp3",
        B1: "Cello/B1.mp3",
        B3: "Cello/B3.mp3",
        C1: "Cello/C1.mp3",
        C3: "Cello/C3.mp3",
        D2: "Cello/D2.mp3",
        D4: "Cello/D4.mp3",
        E1: "Cello/E1.mp3",
        E3: "Cello/E3.mp3",
        F2: "Cello/F2.mp3",
        F4: "Cello/F4.mp3",
        G1: "Cello/G1.mp3",
        G3: "Cello/G3.mp3"
    },
    baseUrl: BASE,
    release: 1.5,
    onload: () => registerInstrumentLoaded("cello")
});

export const doubleBass = new Tone.Sampler({
    urls: { 
        "A#0": "DoubleBass/As0.mp3",
        A1: "DoubleBass/A1.mp3",
        B2: "DoubleBass/B2.mp3",
        "C#2": "DoubleBass/Cs2.mp3",
        C1: "DoubleBass/C1.mp3",
        D1: "DoubleBass/D1.mp3",
        E1: "DoubleBass/E1.mp3",
        E2: "DoubleBass/E2.mp3",
        "F#0": "DoubleBass/Fs0.mp3",
        "F#1": "DoubleBass/Fs1.mp3",
        "G#1": "DoubleBass/Gs1.mp3",
        "G#2": "DoubleBass/Gs2.mp3",
        G0: "DoubleBass/G0.mp3"
    },
    baseUrl: BASE,
    release: 2,
    onload: () => registerInstrumentLoaded("doubleBass")
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
// 🎹 LEADS (DANCE)
// ======================

export const leadSaw = new Tone.Sampler({
    urls: { 
        C3: "Synth/LeadSaw/C3.mp3", 
        C4: "Synth/LeadSaw/C4.mp3",
        E3: "Synth/LeadSaw/E3.mp3", 
        E4: "Synth/LeadSaw/E4.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("leadSaw")
});

export const leadSynthBrass1 = new Tone.Sampler({
    urls: { 
        C3: "Synth/LeadSynthBrass1/C3.mp3", 
        C4: "Synth/LeadSynthBrass1/C4.mp3",
        "F#3": "Synth/LeadSynthBrass1/Fs3.mp3",
        "F#4": "Synth/LeadSynthBrass1/Fs4.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("leadSynthBrass1")
});

export const leadSynthBrass2 = new Tone.Sampler({
    urls: { 
        C3: "Synth/LeadSynthBrass2/C3.mp3", 
        C4: "Synth/LeadSynthBrass2/C4.mp3",
        "F#3": "Synth/LeadSynthBrass2/Fs3.mp3",
        "F#4": "Synth/LeadSynthBrass2/Fs4.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("leadSynthBrass2")
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
        "A#1":"Synth/Organo/As1.mp3","A#2":"Synth/Organo/As2.mp3",A1:"Synth/Organo/A1.mp3",A2:"Synth/Organo/A2.mp3",
        B1:"Synth/Organo/B1.mp3",B2:"Synth/Organo/B2.mp3","C#1":"Synth/Organo/Cs1.mp3","C#2":"Synth/Organo/Cs2.mp3",
        "C#3":"Synth/Organo/Cs3.mp3",C1:"Synth/Organo/C1.mp3",C2:"Synth/Organo/C2.mp3",C3:"Synth/Organo/C3.mp3",
        D1:"Synth/Organo/D1.mp3",D2:"Synth/Organo/D2.mp3",D3:"Synth/Organo/D3.mp3","D#1":"Synth/Organo/Ds1.mp3",
        "D#2":"Synth/Organo/Ds2.mp3","D#3":"Synth/Organo/Ds3.mp3",E1:"Synth/Organo/E1.mp3",E2:"Synth/Organo/E2.mp3",
        E3:"Synth/Organo/E3.mp3","F#1":"Synth/Organo/Fs1.mp3","F#2":"Synth/Organo/Fs2.mp3","F#3":"Synth/Organo/Fs3.mp3",
        F1:"Synth/Organo/F1.mp3",F2:"Synth/Organo/F2.mp3",F3:"Synth/Organo/F3.mp3","G#1":"Synth/Organo/Gs1.mp3",
        "G#2":"Synth/Organo/Gs2.mp3",G1:"Synth/Organo/G1.mp3",G2:"Synth/Organo/G2.mp3",G3:"Synth/Organo/G3.mp3"
    },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("keysOrgan")
});

// ======================
// 🎼 PADS
// ======================

export const padBells = new Tone.Sampler({
    urls: { C2:"Synth/BellsPad/C2.mp3",C3:"Synth/BellsPad/C3.mp3",C4:"Synth/BellsPad/C4.mp3",C5:"Synth/BellsPad/C5.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padBells")
});

export const padGlass = new Tone.Sampler({
    urls: { C2:"Synth/GlassPad/C2.mp3",C3:"Synth/GlassPad/C3.mp3",C4:"Synth/GlassPad/C4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padGlass")
});

export const padWarm = new Tone.Sampler({
    urls: { C3:"Synth/WarmPad/C3.mp3","F#3":"Synth/WarmPad/Fs3.mp3",C4:"Synth/WarmPad/C4.mp3","F#4":"Synth/WarmPad/Fs4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padWarm")
});

export const padWave = new Tone.Sampler({
    urls: { C3:"Synth/WavePad/C3.mp3",E3:"Synth/WavePad/E3.mp3",C4:"Synth/WavePad/C4.mp3",E4:"Synth/WavePad/E4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padWave")
});

export const padShaku = new Tone.Sampler({
    urls: { C3:"Synth/ShakuPad/C3.mp3","F#3":"Synth/ShakuPad/Fs3.mp3",C4:"Synth/ShakuPad/C4.mp3","F#4":"Synth/ShakuPad/Fs4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padShaku")
});

export const padString = new Tone.Sampler({
    urls: { C2:"Synth/StStringPad/C2.mp3",C3:"Synth/StStringPad/C3.mp3",C4:"Synth/StStringPad/C4.mp3",C5:"Synth/StStringPad/C5.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("padString")
});

// ======================
// 🎧 FX
// ======================

export const fxSweep = new Tone.Sampler({
    urls: { C4:"Synth/FxSweep/C4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxSweep")
});

export const fxNoise = new Tone.Sampler({
    urls: { C4:"Synth/FxNoise/C4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxNoise")
});

export const fxFantasy = new Tone.Sampler({
    urls: { C3:"Synth/FxFantasy/C3.mp3",C4:"Synth/FxFantasy/C4.mp3",C5:"Synth/FxFantasy/C5.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxFantasy")
});

export const fxHeaven = new Tone.Sampler({
    urls: { C3:"Synth/FxHeaven/C3.mp3",C4:"Synth/FxHeaven/C4.mp3",C5:"Synth/FxHeaven/C5.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxHeaven")
});

export const fxJump = new Tone.Sampler({
    urls: { C3:"Synth/FxJump/C3.mp3",C4:"Synth/FxJump/C4.mp3",C5:"Synth/FxJump/C5.mp3",E3:"Synth/FxJump/E3.mp3",E4:"Synth/FxJump/E4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxJump")
});

export const fxHardFTCore = new Tone.Sampler({
    urls: { C2:"Synth/FxHardFTCore/C2.mp3",C4:"Synth/FxHardFTCore/C4.mp3",C5:"Synth/FxHardFTCore/C5.mp3",E3:"Synth/FxHardFTCore/E3.mp3",E4:"Synth/FxHardFTCore/E4.mp3" },
    baseUrl: BASE,
    release: 1.2,
    onload: () => registerInstrumentLoaded("fxHardCore")
});

export const fxNoisy = new Tone.Sampler({
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
        bassDrum:"Synth/Percussion/BassDrum.mp3",kick:"Synth/Percussion/Kick.mp3",
        closedHat:"Synth/Percussion/ClosedHat.mp3",crash:"Synth/Percussion/Crash.mp3",
        handClap:"Synth/Percussion/HandClap.mp3",hiTom:"Synth/Percussion/HiTom.mp3",
        lowTom:"Synth/Percussion/LowTom.mp3",midTom:"Synth/Percussion/MidTom.mp3",
        openHat:"Synth/Percussion/OpenHat.mp3",ride:"Synth/Percussion/Ride.mp3",
        rimShot:"Synth/Percussion/RimShot.mp3",snareDrum:"Synth/Percussion/SnareDrum.mp3"
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

export const grandPiano = new Tone.Sampler({
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

export const pianoSynth = new Tone.Sampler({
    urls: { 
    C0: "Samples/Synth/Piano/C0.mp3",
    C1: "Samples/Synth/Piano/C1.mp3",
   C2: "Samples/Synth/Piano/C2.mp3",
    C3: "Samples/Synth/Piano/C3.mp3", 
    C4: "Samples/Synth/Piano/C4.mp3",
    C5: "Samples/Synth/Piano/C5.mp3", 
    C6: "Samples/Synth/Piano/C6.mp3",
    C7: "Samples/Synth/Piano/C7.mp3", 
    "F#0": "Samples/Synth/Piano/Fs0.mp3",
    "F#1": "Samples/Synth/Piano/Fs1.mp3",
    "F#2": "Samples/Synth/Piano/Fs2.mp3",
    "F#3": "Samples/Synth/Piano/Fs3.mp3",
    "F#4": "Samples/Synth/Piano/Fs4.mp3",
    "F#5": "Samples/Synth/Piano/Fs5.mp3",
    "F#6": "Samples/Synth/Piano/Fs6.mp3",
    "F#7": "Samples/Synth/Piano/Fs7.mp3"
    },
    release: 1.5,
onload: () => registerInstrumentLoaded("Piano")
});

// ============================================================================
// 🎵 MAPPA NOTE DISPONIBILI PER OGNI STRUMENTO (UNIVERSALE)
// ============================================================================

const availableNotesMap = {

    // 🎸 GUITARS
    guitarPalm: ["C2","D2","E2","F2","G2","A2","B2"],
    guitarOpen: ["C2","D2","E2","F2","G2","A2","B2"],
    guitarLead: [
    "D2","F2","G#2","B2",
    "D3","F3","G#3","B3",
    "D4","F4","G#4","B4",
    "D5","F5","G#5","B5",
    "D6"
],
    guitarMute: ["E3","F#3","G3","A3","C4","D4","A#4","D5","F5","A#5"],
    guitarClean: ["F#2","C3","F#3","C4","F#4","C5","F#5","C6"],
    // 🎻 STRINGS 
    violin: ["A2","A3","B2","B4","C4","D3","D5","E4","F#3","G2","G4"
],
viola: ["A3","B2","C2","C4","D2","D3","D5","E2","E4","G2","G4"
],
cello: ["A2","B1","B3","C1","C3","D2","D4","E1","E3","F2","F4","G1","G3"
],
doubleBass: ["A#0","A1","B2","C#2","C1","D1","E1","E2","F#0","F#1","G#1","G#2","G0"
],
    // 🎚 BASS
    bassMetal: ["C1","C#1","D1","D#1","E1","F1","F#1","G1","G#1","A1","A#1","B1","C2"],
    bassSlap: ["E0","G0","D1","A1","B1","F#1","E2","F2","A3","D3","E4","G5"],
    bassSynth: ["C2","E2","C3","F#3"],

    // Synth bass (sub/attack) → non ha note reali
    subBass: ["C"],
    bassAttack: ["C"],
    // 🎹 LEADS
leadSaw: ["C3","C4","E3","E4"],
leadSynthBrass1: ["C3","C4","F#3","F#4"],
leadSynthBrass2: ["C3","C4","F#3","F#4"],

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
    grandPiano: [
        "A0","C1","D#1","F#1",
        "A1","C2","D#2","F#2",
        "A2","C3","D#3","F#3",
        "A3","C4","D#4","F#4",
        "A4","C5","D#5","F#5",
        "A5","C6","D#6","F#6",
        "A7","C8"
    ],

    pianoSynth: ["C0","C1","C2","C3","C4","C5", "C6", "C7","F#0","F#1","F#2","F#3","F#4","F#5", "F#6", "F#7"
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
    fxHardFTCore: ["C2","E3","C4","E4","C5"],
    fxNoisy: ["C4","E4","A4","C#5","A5","D6","F#6"],

    // fallback
    default: ["C3"]
};

// ============================================================================
// 🎼 NORMALIZE NOTE UNIVERSALE
// ============================================================================

export function normalizeNote(note, instrumentName) {

    // Fallback sicuro
    if (!note || typeof note !== "string") return "C3";

    // Estrai root + ottava
    const match = note.match(/^([A-G][#b]?)(\d+)?$/);
    const targetRoot = match ? match[1] : "C";
    const targetOct = match && match[2] ? parseInt(match[2]) : 3;

    // ---------------------------------------------------------
    // 1) ROOT-ONLY → strumenti che storicamente ignoravano l’ottava
    // ---------------------------------------------------------
    const rootOnly = {
        guitarPalm: true,
        guitarOpen: true,
        leadSaw: true,
        bassDance: true,
        fxSweep: true,
        fxNoise: true,
        fxFantasy: true,
        fxHeaven: true,
        fxJump: true,
        fxHardFTCore: true
    };

    if (rootOnly[instrumentName]) {
        return targetRoot + "3"; // root-only con ottava sicura
    }

    // ---------------------------------------------------------
    // 2) METAL-FLAT → SOLO bassMetal (# → b)
    // ---------------------------------------------------------
    const metalFlatMap = {
        "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb"
    };

    if (instrumentName === "bassMetal") {
        if (targetRoot.endsWith("#")) {
            const flat = metalFlatMap[targetRoot];
            if (flat) return flat + targetOct;
        }
        return targetRoot + targetOct;
    }

    // ---------------------------------------------------------
    // 3) MIDI DISTANCE → tutti gli altri strumenti melodici
    // ---------------------------------------------------------
    const available = availableNotesMap[instrumentName] || availableNotesMap.default;

    let targetMidi;
    try {
        targetMidi = Tone.Frequency(`${targetRoot}${targetOct}`).toMidi();
    } catch {
        targetMidi = Tone.Frequency("C3").toMidi();
    }

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
        } catch {}
    }

    // ---------------------------------------------------------
    // 4) Se la nota non ha ottava → aggiungi "3"
    // ---------------------------------------------------------
    if (!/\d$/.test(bestNote)) {
        return bestNote + "3";
    }

    return bestNote;
}
