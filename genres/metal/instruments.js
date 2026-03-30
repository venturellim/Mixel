//
// instruments.js
// Tutti gli strumenti, effetti e routing del genere metal.
// Nessuna logica musicale. Nessuna struttura. Nessun engine.
// Solo strumenti + effetti + routing.
//

import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded, logNote } from "../../common.js";

console.log("instruments.js ver. 005.3 loaded");

// ============================================================
// 🎚 BUS SPECIFICI DEL METAL
// ============================================================

export const guitarBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const drumBus = new Tone.Gain(1);
export const leadBus = new Tone.Gain(1);
export const padBus = new Tone.Gain(1);

// EQ specifici del metal
const guitarEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const bassEQ   = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const drumEQ   = new Tone.EQ3({ low: 2, mid: 1, high: 3 });
const leadEQ   = new Tone.EQ3({ low: -3, mid: 2, high: 6 });

const drumComp = new Tone.Compressor({
    threshold: -18,
    ratio: 4,
    attack: 0.01,
    release: 0.2
});

// ============================================================
// 🎚️ MIXER INTERNO — controllo volumi dei bus
// ============================================================

const mixer = {
    guitar: guitarBus,
    bass: bassBus,
    drums: drumBus,
    lead: leadBus,
    pad: padBus
};


// Valori di default (soundcheck iniziale)
guitarBus.gain.value = 0;   // 0 dB
bassBus.gain.value   = 0;   // 0 dB
drumBus.gain.value   = 0;  // 0 dB
leadBus.gain.value   = 0;   // 0 dB

export function setVolume(busName, dbValue) {
    const bus = mixer[busName];
    if (!bus) {
        console.warn("[MIXER] Bus inesistente:", busName);
        return;
    }
    bus.gain.value = Tone.dbToGain(dbValue);
    console.log(`[MIXER] ${busName} volume → ${dbValue} dB`);
}

setVolume("guitar", -4);
setVolume("bass", -2);
setVolume("drums", -14);
setVolume("lead", +3);
setVolume("pad", -16);


// Routing bus → EQ → master
guitarBus.connect(guitarEQ).connect(masterEQ);
bassBus.connect(bassEQ).connect(masterEQ);
drumBus.connect(drumEQ).connect(drumComp).connect(masterEQ);
leadBus.connect(leadEQ).connect(masterEQ);
padBus.connect(masterEQ);


// ============================================================
// 🎸 GUITAR PALM (C2–C3)
// ============================================================

const palmFilter = new Tone.Filter({
    type: "lowpass",
    frequency: 2500,
    Q: 1
});

const palmComp = new Tone.Compressor({
    threshold: -18,
    ratio: 4,
    attack: 0.003,
    release: 0.15
});

export const guitarPalm = new Tone.Sampler({
    urls: {
        C2: "Samples/GuitarPalm/C.mp3",
        D2: "Samples/GuitarPalm/D.mp3",
        E2: "Samples/GuitarPalm/E.mp3",
        F2: "Samples/GuitarPalm/F.mp3",
        G2: "Samples/GuitarPalm/G.mp3",
        A2: "Samples/GuitarPalm/A.mp3",
        B2: "Samples/GuitarPalm/B.mp3"
    },
    onload: () => registerInstrumentLoaded()
});

guitarPalm.set({
    envelope: {
        attack: 0.001,
        decay: 0.09,
        sustain: 0.15,
        release: 0.05
    }
});

// ============================================================
// 🎸 GUITAR OPEN (C2–C3)
// ============================================================

export const guitarOpen = new Tone.Sampler({
    urls: {
        C2: "Samples/GuitarOpen/C.mp3",
        D2: "Samples/GuitarOpen/D.mp3",
        E2: "Samples/GuitarOpen/E.mp3",
        F2: "Samples/GuitarOpen/F.mp3",
        G2: "Samples/GuitarOpen/G.mp3",
        A2: "Samples/GuitarOpen/A.mp3",
        B2: "Samples/GuitarOpen/B.mp3"
    },
    onload: () => registerInstrumentLoaded()
});

guitarOpen.set({
    envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.8,
        release: 0.4
    }
});

// ============================================================
// 🎸 GUITAR LEAD (C4–C6)
// ============================================================

export const guitarLead = new Tone.Sampler({
    urls: {
        C4: "Samples/Guitar/C4.mp3",
        Db4: "Samples/Guitar/Db4.mp3",
        D4: "Samples/Guitar/D4.mp3",
        Eb4: "Samples/Guitar/Eb4.mp3",
        E4: "Samples/Guitar/E4.mp3",
        F4: "Samples/Guitar/F4.mp3",
        Gb4: "Samples/Guitar/Gb4.mp3",
        G4: "Samples/Guitar/G4.mp3",
        Ab4: "Samples/Guitar/Ab4.mp3",
        A4: "Samples/Guitar/A4.mp3",
        Bb4: "Samples/Guitar/Bb4.mp3",
        B4: "Samples/Guitar/B4.mp3",
        C5: "Samples/Guitar/C5.mp3",
        Db5: "Samples/Guitar/Db5.mp3",
        D5: "Samples/Guitar/D5.mp3",
        Eb5: "Samples/Guitar/Eb5.mp3",
        E5: "Samples/Guitar/E5.mp3",
        F5: "Samples/Guitar/F5.mp3",
        Gb5: "Samples/Guitar/Gb5.mp3",
        G5: "Samples/Guitar/G5.mp3",
        Ab5: "Samples/Guitar/Ab5.mp3",
        A5: "Samples/Guitar/A5.mp3",
        Bb5: "Samples/Guitar/Bb5.mp3",
        B5: "Samples/Guitar/B5.mp3",
        C6: "Samples/Guitar/C6.mp3"
    },
    onload: () => registerInstrumentLoaded()
}).connect(leadBus);

guitarLead.set({
    envelope: {
        attack: 0.005,
        decay: 0.15,
        sustain: 0.6,
        release: 0.25
    }
});

// Lead FX
export const leadChorus = new Tone.Chorus({
    frequency: 4,
    delayTime: 2.5,
    depth: 0.3,
    spread: 180
}).start();

export const leadDelay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.4
});

export const leadReverb = new Tone.Reverb({
    decay: 3,
    wet: 0.18
});

leadChorus.set({ depth: 0.2 });
leadReverb.set({ wet: 0.2 });
leadDelay.set({ feedback: 0.25 });

leadBus.chain(leadChorus, leadDelay, leadReverb);

// ============================================================
// 🎸 CHITARRE: FX COMUNI + PSEUDO STEREO
// ============================================================

const guitarDelay = new Tone.FeedbackDelay(0.03, 0.2);
export const guitarRiffReverb = new Tone.Reverb({
    decay: 4,
    preDelay: 0.01,
    wet: 0.25
});

const guitarFX = new Tone.Gain();

guitarPalm.chain(palmFilter, palmComp, guitarDelay, guitarRiffReverb, guitarFX);
guitarOpen.chain(guitarDelay, guitarRiffReverb, guitarFX);

// Pseudo stereo
const detuneL = new Tone.PitchShift({ pitch: -0.05 });
const detuneR = new Tone.PitchShift({ pitch: 0.05 });

const panL = new Tone.Panner(-0.2);
const panR = new Tone.Panner(0.2);

guitarFX.connect(detuneL).connect(panL).connect(guitarBus);
guitarFX.connect(detuneR).connect(panR).connect(guitarBus);

// ============================================================
// 🎸 BASS (C1–C2)
// ============================================================

export const bass = new Tone.Sampler({
    urls: {
        C1: "Samples/Bass/C1.mp3",
        Db1: "Samples/Bass/Db1.mp3",
        D1: "Samples/Bass/D1.mp3",
        Eb1: "Samples/Bass/Eb1.mp3",
        E1: "Samples/Bass/E1.mp3",
        F1: "Samples/Bass/F1.mp3",
        Gb1: "Samples/Bass/Gb1.mp3",
        G1: "Samples/Bass/G1.mp3",
        Ab1: "Samples/Bass/Ab1.mp3",
        A1: "Samples/Bass/A1.mp3",
        Bb1: "Samples/Bass/Bb1.mp3",
        B1: "Samples/Bass/B1.mp3",
        C2: "Samples/Bass/C2.mp3"
    },
    onload: () => registerInstrumentLoaded()
}).connect(bassBus);

// ============================================================
// 🥁 DRUMS
// ============================================================

export const drums = new Tone.Players({
    kick: "Samples/Drums/kick.mp3",
    snare: "Samples/Drums/snare.mp3",
    ghost: "Samples/Drums/ghost.mp3",
    hihat: "Samples/Drums/hihat_closed.mp3",
    openhat: "Samples/Drums/hihat_open.mp3",
    crash1: "Samples/Drums/crash_1.mp3",
    crash2: "Samples/Drums/crash_2.mp3",
    tom1: "Samples/Drums/tom_1.mp3",
    tom2: "Samples/Drums/tom_2.mp3",
    tom3: "Samples/Drums/tom_3.mp3",
    tom4: "Samples/Drums/tom_4.mp3",
    ride: "Samples/Drums/ride.mp3",
    ridebell: "Samples/Drums/ride_bell.mp3",
    china: "Samples/Drums/china.mp3"
}).connect(drumBus);

// ============================================================
// 🎹 AMBIENT PAD (ex orchestraPad)
// ============================================================

export const ambientPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 1.2, decay: 0.5, sustain: 0.8, release: 3 }
});

export const ambientFilter = new Tone.Filter({ type: "lowpass", frequency: 2200 });
export const ambientReverb = new Tone.Reverb({ decay: 7, wet: 0.65 });

ambientPad.chain(ambientFilter, ambientReverb, padBus);


// ============================================================
// 🎹 HARMONIC PAD
// ============================================================

export const harmonicPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "triangle" },
    envelope: { attack: 0.35, decay: 0.25, sustain: 0.7, release: 1.4 }
});

export const harmonicFilter = new Tone.Filter({ type: "lowpass", frequency: 4200 });
export const harmonicReverb = new Tone.Reverb({ decay: 3.5, wet: 0.28 });

harmonicPad.chain(harmonicFilter, harmonicReverb, padBus);

// ============================================================
// 🎹 BREATHING PAD (LFO pulsante)
// ============================================================

export const breathingPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sine" },
    envelope: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 0.8 }
});

export const breathingFilter = new Tone.Filter({ type: "lowpass", frequency: 1800 });
const breathingLFO = new Tone.LFO("4n", 350, 1800).start();

breathingLFO.connect(breathingFilter.frequency);

breathingPad.chain(breathingFilter, padBus);

Tone.Transport.on("stop", () => { try { breathingLFO.stop(); } catch(e) {} });
Tone.Transport.on("start", () => { try { breathingLFO.start(); } catch(e) {} });

// ============================================================
// 🎹 CHOIR PAD
// ============================================================

export const choirPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: { attack: 0.8, decay: 0.4, sustain: 0.9, release: 2.5 }
});

export const choirFilter = new Tone.Filter({ type: "bandpass", frequency: 1100, Q: 1 });
export const choirReverb = new Tone.Reverb({ decay: 8, wet: 0.75 });

choirPad.chain(choirFilter, choirReverb, padBus);

// ============================================================
// 🎹 COUNTER PAD
// ============================================================

export const counterPad = new Tone.PolySynth(Tone.Synth, {
    oscillator: { type: "sawtooth" },
    envelope: {
        attack: 0.02,
        decay: 0.15,
        sustain: 0.4,
        release: 0.3
    },
    filterEnvelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.5,
        release: 0.2,
        baseFrequency: 400,
        octaves: 2.5
    }
});

export const counterFilter = new Tone.Filter({ type: "lowpass", frequency: 3500 });
export const counterReverb = new Tone.Reverb({ decay: 2.5, wet: 0.35 });

counterPad.chain(counterFilter, counterReverb, padBus);

const padEQ = new Tone.EQ3({
    low: -2,
    mid: -1,
    high: +1
});

const padGlue = new Tone.Compressor({
    threshold: -18,
    ratio: 3,
    attack: 0.01,
    release: 0.2
});

const padSpace = new Tone.Reverb({
    decay: 2,
    wet: 0.15
});

padBus.chain(padEQ, padGlue, padSpace, Tone.Destination);


// ============================================================
// 🎵 LOGGING (wrapping)
// ============================================================

function wrapSampler(name, sampler) {
    const orig = sampler.triggerAttackRelease.bind(sampler);
    sampler.triggerAttackRelease = (note, dur, time) => {
        logNote(name, note, time);
        return orig(note, dur, time);
    };
}

wrapSampler("guitarPalm", guitarPalm);
wrapSampler("guitarOpen", guitarOpen);
wrapSampler("guitarLead", guitarLead);
wrapSampler("bass", bass);
wrapSampler("ambientPad", ambientPad);
wrapSampler("harmonicPad", harmonicPad);
wrapSampler("breathingPad", breathingPad);
wrapSampler("choirPad", choirPad);

function wrapPlayer(name, player) {
    const orig = player.start.bind(player);
    player.start = (time, offset, dur) => {
        logNote(name, "(sample)", time);
        return orig(time, offset, dur);
    };
}

[
    "kick","snare","ghost","hihat","openhat",
    "crash1","crash2","tom1","tom2","tom3","tom4",
    "ride","ridebell","china"
].forEach(key => {
    wrapPlayer("drums."+key, drums.player(key));
});

export const metalInstruments = {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums,

    ambientPad,
    harmonicPad,
    breathingPad,
    choirPad,

    // FX pad
    ambientFilter,
    harmonicFilter,
    breathingFilter,
    choirFilter,
    choirReverb,
    counterFilter,
    counterReverb,

    guitarBus,
    bassBus,
    drumBus,
    leadBus,
    padBus,

    setVolume
};

export const instrumentVolumeMap = {
    guitar: "Chitarre",
    bass: "Basso",
    drums: "Batteria",
    lead: "Lead",
    pad: "Pad / Orchestra"
};

