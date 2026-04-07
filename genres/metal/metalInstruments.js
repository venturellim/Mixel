//
// instruments.js
// Tutti gli strumenti, effetti e routing del genere metal.
// Nessuna logica musicale. Nessuna struttura. Nessun engine.
// Solo strumenti + effetti + routing.
//

import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded, logNote } from "../../common.js";

console.log("metalInstruments.js ver. 001 loaded");

// ============================================================
// 🎚 BUS SPECIFICI DEL METAL
// ============================================================

export const guitarBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const drumBus = new Tone.Gain(1);
export const leadBus = new Tone.Gain(1);
export const keyboardBus = new Tone.Gain(1);

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
    keyboard: keyboardBus
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
setVolume("drums", -10);
setVolume("lead", +3);
setVolume("keyboard", -16);


// Routing bus → EQ → master
guitarBus.connect(guitarEQ).connect(masterEQ);
bassBus.connect(bassEQ).connect(masterEQ);
drumBus.connect(drumEQ).connect(drumComp).connect(masterEQ);
leadBus.connect(leadEQ).connect(masterEQ);
keyboardBus.connect(masterEQ);


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
// 🎸 GUITAR LEAD (C2–C6)
// ============================================================

export const guitarLead = new Tone.Sampler({
    urls: {
    C2: "Samples/Guitar/C2.mp3",
    Db2: "Samples/Guitar/Db2.mp3",
    D2: "Samples/Guitar/D2.mp3",
    Eb2: "Samples/Guitar/Eb2.mp3",
    E2: "Samples/Guitar/E2.mp3",
    F2: "Samples/Guitar/F2.mp3",
    Gb2: "Samples/Guitar/Gb2.mp3",
    G2: "Samples/Guitar/G2.mp3",
    Ab2: "Samples/Guitar/Ab2.mp3",
    A2: "Samples/Guitar/A2.mp3",
    Bb2: "Samples/Guitar/Bb2.mp3",
    B2: "Samples/Guitar/B2.mp3",
    C3: "Samples/Guitar/C3.mp3",
    Db3: "Samples/Guitar/Db3.mp3",
    D3: "Samples/Guitar/D3.mp3",
    Eb3: "Samples/Guitar/Eb3.mp3",
    E3: "Samples/Guitar/E3.mp3",
    F3: "Samples/Guitar/F3.mp3",
    Gb3: "Samples/Guitar/Gb3.mp3",
    G3: "Samples/Guitar/G3.mp3",
    Ab3: "Samples/Guitar/Ab3.mp3",
    A3: "Samples/Guitar/A3.mp3",
    Bb3: "Samples/Guitar/Bb3.mp3",
    B3: "Samples/Guitar/B3.mp3",
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
// 🎹 KEYBOARD LEAD (Power Metal Synth)
// ============================================================

export const keyboardLead = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 8,
    oscillator: {
        type: "sawtooth"
    },
    envelope: {
        attack: 0.01,
        decay: 0.2,
        sustain: 0.7,
        release: 0.3
    }
}).connect(keyboardBus);

export const keyboardPad = new Tone.PolySynth(Tone.Synth, {
    maxPolyphony: 16,
    oscillator: {
        type: "sawtooth"
    },
    envelope: {
        attack: 0.05,
        decay: 0.2,
        sustain: 0.8,
        release: 0.4
    }
}).connect(keyboardBus);

const kbChorus = new Tone.Chorus({
    frequency: 3,
    delayTime: 2.5,
    depth: 0.3,
    spread: 180
}).start();

const kbDelay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.35
});

const kbReverb = new Tone.Reverb({
    decay: 3.5,
    wet: 0.25
});

keyboardBus.chain(kbChorus, kbDelay, kbReverb);


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
wrapSampler("keyboardLead", keyboardLead);


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

export function normalizeNote(note, instrument) {
    if (!note || typeof note !== "string") return "A";
    const first = note[0].toUpperCase();
    const second = note[1];

    if (instrument === "guitarPalm" || instrument === "guitarOpen") {
        return first; 
    }
    if (instrument === "guitarLead" || instrument === "bass") {
        if (second === "b") return first + "b";
        if (second === "#") {
            const sharpToFlat = { "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb" };
            return sharpToFlat[first + "#"] ?? first;
        }
        return first;
    }
    return first;
}

export const metalInstruments = {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums,
    keyboardLead,

    guitarBus,
    bassBus,
    drumBus,
    leadBus,
    keyboardBus,

    setVolume
};

export const metalVolumeMap = {
    guitar: "Chitarre",
    bass: "Basso",
    drums: "Batteria",
    lead: "Lead",
    keyboard: "keyboard"
};
