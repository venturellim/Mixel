// danceInstruments.js — ver. 002 (solo synth integrati)
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded } from "../../common.js";

console.log("danceInstruments.js ver. 002 loaded");

// ------------------------------------------------------------
// BUS PRINCIPALI
// ------------------------------------------------------------
export const danceBus = new Tone.Gain(1).connect(masterEQ);
export const drumsBus = new Tone.Gain(1).connect(danceBus);
export const bassBus = new Tone.Gain(1).connect(danceBus);
export const leadBus = new Tone.Gain(1).connect(danceBus);
export const padBus = new Tone.Gain(1).connect(danceBus);
export const fxBus = new Tone.Gain(1).connect(danceBus);

// ------------------------------------------------------------
// DRUMS (synth integrati, nessun sample esterno)
// ------------------------------------------------------------
export const danceKick = new Tone.MembraneSynth({
    pitchDecay: 0.02,
    octaves: 5,
    envelope: { attack: 0.001, decay: 0.2, sustain: 0 }
}).connect(drumsBus);

export const danceSnare = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.1, sustain: 0 }
}).connect(drumsBus);

export const danceHiHat = new Tone.MetalSynth({
    frequency: 8000,
    envelope: { attack: 0.001, decay: 0.05, sustain: 0 },
    harmonicity: 8.5,
    modulationIndex: 40,
    resonance: 800
}).connect(drumsBus);

export const danceClap = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 0.001, decay: 0.05, sustain: 0 }
}).connect(drumsBus);

export const danceCrash = new Tone.MetalSynth({
    frequency: 4000,
    envelope: { attack: 0.001, decay: 0.8, sustain: 0 },
    harmonicity: 5,
    modulationIndex: 20,
    resonance: 600
}).connect(drumsBus);

// ------------------------------------------------------------
// BASSO — Synth saw
// ------------------------------------------------------------
export const danceBass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { type: "lowpass", Q: 1 },
    filterEnvelope: { attack: 0.01, decay: 0.1, sustain: 0.2, release: 0.1, baseFrequency: 80, octaves: 2 },
    envelope: { attack: 0.005, decay: 0.1, sustain: 0.3, release: 0.1 }
}).connect(bassBus);

// ------------------------------------------------------------
// LEAD — Supersaw
// ------------------------------------------------------------
export const danceLead = new Tone.PolySynth(Tone.FatSynth, {
    oscillator: { type: "sawtooth" },
    count: 6,
    spread: 40,
    envelope: { attack: 0.01, decay: 0.2, sustain: 0.6, release: 0.3 }
}).connect(leadBus);

// ------------------------------------------------------------
// PAD
// ------------------------------------------------------------
export const dancePad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.3, decay: 0.4, sustain: 0.7, release: 1.2 }
}).connect(padBus);

// ------------------------------------------------------------
// FX
// ------------------------------------------------------------
export const danceRiser = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: { attack: 2, decay: 0.5, sustain: 0.5, release: 1 }
}).connect(fxBus);

export const danceDownlifter = new Tone.NoiseSynth({
    noise: { type: "pink" },
    envelope: { attack: 0.1, decay: 1.5, sustain: 0, release: 0.2 }
}).connect(fxBus);

// ------------------------------------------------------------
// REGISTRO CARICAMENTO
// ------------------------------------------------------------
[danceKick, danceSnare, danceHiHat, danceClap, danceCrash, danceBass, danceLead, dancePad].forEach(inst => {
    if (inst && inst.onload !== undefined) inst.onload = () => registerInstrumentLoaded();
    else registerInstrumentLoaded();
});

// ------------------------------------------------------------
// MIXER MAP
// ------------------------------------------------------------
export const danceInstruments = {
    kick: danceKick,
    snare: danceSnare,
    hihat: danceHiHat,
    clap: danceClap,
    crash: danceCrash,
    bass: danceBass,
    lead: danceLead,
    pad: dancePad,
    riser: danceRiser,
    downlifter: danceDownlifter
};

export const danceVolumeMap = {
    kick: "Kick",
    snare: "Snare",
    hihat: "HiHat",
    clap: "Clap",
    crash: "Crash",
    bass: "Bass",
    lead: "Lead",
    pad: "Pad",
    riser: "Riser",
    downlifter: "Downlifter"
};