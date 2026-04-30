// danceInstruments.js — ver. 001 (Eurodance 1995–2005)
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded } from "../../common.js";

console.log("danceInstruments.js ver. 001 loaded");

// ------------------------------------------------------------
// BUS PRINCIPALI
// ------------------------------------------------------------
export const danceBus = new Tone.Gain(1).connect(masterEQ);

export const drumsBus = new Tone.Gain(1).connect(danceBus);
export const bassBus  = new Tone.Gain(1).connect(danceBus);
export const leadBus  = new Tone.Gain(1).connect(danceBus);
export const padBus   = new Tone.Gain(1).connect(danceBus);
export const fxBus    = new Tone.Gain(1).connect(danceBus);

// ------------------------------------------------------------
// DRUM KIT 909 (Gabry Ponte / Prezioso / Gigi D’Agostino)
// ------------------------------------------------------------
export const danceDrums = {
    kick: new Tone.Player("Samples/909/kick.wav").connect(drumsBus),
    clap: new Tone.Player("Samples/909/clap.wav").connect(drumsBus),
    snare: new Tone.Player("Samples/909/snare.wav").connect(drumsBus),
    hat: new Tone.Player("Samples/909/hihat.wav").connect(drumsBus),
    openhat: new Tone.Player("Samples/909/openhat.wav").connect(drumsBus),
    crash: new Tone.Player("Samples/909/crash.wav").connect(drumsBus)
};

Object.values(danceDrums).forEach(p => {
    p.onstop = () => registerInstrumentLoaded();
});

// ------------------------------------------------------------
// BASSO — MonoSynth Saw (Gigi D’Agostino / Gabry Ponte)
// ------------------------------------------------------------
export const danceBass = new Tone.MonoSynth({
    oscillator: { type: "sawtooth" },
    filter: { type: "lowpass", Q: 1 },
    filterEnvelope: {
        attack: 0.01,
        decay: 0.1,
        sustain: 0.2,
        release: 0.1,
        baseFrequency: 80,
        octaves: 2
    },
    envelope: {
        attack: 0.005,
        decay: 0.1,
        sustain: 0.3,
        release: 0.1
    }
}).connect(bassBus);

// ------------------------------------------------------------
// LEAD — Supersaw (Eiffel 65 / Gabry Ponte)
// ------------------------------------------------------------
export const danceLead = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
        type: "sawtooth",
        count: 6,
        spread: 40
    },
    envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.6,
        release: 0.3
    }
})
    .connect(new Tone.Chorus(4, 2.5, 0.5).start())
    .connect(new Tone.Reverb(2))
    .connect(leadBus);

// ------------------------------------------------------------
// PAD — PolySynth morbido (Eurodance chords)
// ------------------------------------------------------------
export const dancePad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: {
        attack: 0.3,
        decay: 0.4,
        sustain: 0.7,
        release: 1.2
    }
})
    .connect(new Tone.Reverb(3))
    .connect(padBus);

// ------------------------------------------------------------
// PLUCK — Tone.PluckSynth (Gigi D’Agostino style)
// ------------------------------------------------------------
export const dancePluck = new Tone.PluckSynth({
    attackNoise: 1,
    dampening: 4000,
    resonance: 0.9
}).connect(leadBus);

// ------------------------------------------------------------
// FX — Noise riser + downlifter
// ------------------------------------------------------------
export const danceFX = {
    riser: new Tone.NoiseSynth({
        noise: { type: "white" },
        envelope: { attack: 2, decay: 0.5, sustain: 0.5, release: 1 }
    }).connect(fxBus),

    down: new Tone.NoiseSynth({
        noise: { type: "pink" },
        envelope: { attack: 0.1, decay: 1.5, sustain: 0, release: 0.2 }
    }).connect(fxBus)
};

// ------------------------------------------------------------
// MIXER MAP
// ------------------------------------------------------------
export const danceInstruments = {
    drums: danceDrums,
    bass: danceBass,
    lead: danceLead,
    pad: dancePad,
    pluck: dancePluck,
    fx: danceFX
};

export const danceVolumeMap = {
    drums: "Dance Drums",
    bass: "Dance Bass",
    lead: "Dance Lead",
    pad: "Dance Pad",
    pluck: "Dance Pluck",
    fx: "Dance FX"
};
