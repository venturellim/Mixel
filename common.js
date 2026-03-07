// common.js

import * as Tone from "https://esm.sh/tone";

// ==============================
// MASTER BUS
// ==============================

export const masterEQ = new Tone.EQ3({
    low: 0,
    mid: 0,
    high: 0
}).toDestination();


// ==============================
// LEAD FX CHAIN
// ==============================

export const leadEQ = new Tone.EQ3({
    low: -2,
    mid: 1,
    high: 3
});

export const leadChorus = new Tone.Chorus(4, 2.5, 0.4).start();

export const leadDelay = new Tone.FeedbackDelay("8n", 0.35);

export const leadReverb = new Tone.Reverb({
    decay: 3,
    wet: 0.3
});

leadEQ.chain(leadChorus, leadDelay, leadReverb, masterEQ);


// ==============================
// GUITAR URL MAP
// ==============================

const guitarUrls = {
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
    C6: "Samples/Guitar/C6.mp3",
    Db6: "Samples/Guitar/Db6.mp3",
    D6: "Samples/Guitar/D6.mp3",
    Eb6: "Samples/Guitar/Eb6.mp3",
    E6: "Samples/Guitar/E6.mp3",
};


// ==============================
// 🎸 GUITAR PALM (Envelope + Filtro + Comp)
// ==============================

const palmFilter = new Tone.Filter({
    type: "lowpass",
    frequency: 750,
    Q: 1
});

const palmComp = new Tone.Compressor({
    threshold: -18,
    ratio: 4,
    attack: 0.003,
    release: 0.15
});

export const guitarPalm = new Tone.Sampler({
    urls: guitarUrls,
    release: 1,
    baseUrl: ""
});

guitarPalm.set({
    envelope: {
        attack: 0.001,
        decay: 0.09,
        sustain: 0.15,
        release: 0.05
    }
});

guitarPalm.chain(palmFilter, palmComp, masterEQ);


// ==============================
// 🎸 GUITAR OPEN
// ==============================

export const guitarOpen = new Tone.Sampler({
    urls: guitarUrls
});

guitarOpen.set({
    envelope: {
        attack: 0.01,
        decay: 0.3,
        sustain: 0.8,
        release: 0.4
    }
});

guitarOpen.connect(masterEQ);


// ==============================
// 🎸 GUITAR LEAD
// ==============================

export const guitarLead = new Tone.Sampler({
    urls: guitarUrls
});

guitarLead.connect(leadEQ);


// ==============================
// 🎸 BASS
// ==============================

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
    C2: "Samples/Bass/C2.mp3",
    Db2: "Samples/Bass/Db2.mp3",
    D2: "Samples/Bass/D2.mp3",
    Eb2: "Samples/Bass/Eb2.mp3",
    E2: "Samples/Bass/E2.mp3",
    F2: "Samples/Bass/F2.mp3",
    Gb2: "Samples/Bass/Gb2.mp3",
    G2: "Samples/Bass/G2.mp3",
    Ab2: "Samples/Bass/Ab2.mp3",
    A2: "Samples/Bass/A2.mp3",
    Bb2: "Samples/Bass/Bb2.mp3",
    B2: "Samples/Bass/B2.mp3",
    C3: "Samples/Bass/C3.mp3"
    }
}).connect(masterEQ);


// ==============================
// 🥁 DRUMS
// ==============================

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

}).connect(masterEQ);

guitarPalm.volume.value = -6;
guitarOpen.volume.value = -6;
guitarLead.volume.value = -12;
bass.volume.value = -3;
drums.volume.value = 0;


export function analyzeImageBrightness(img) {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
if (!ctx) return 0.5;

    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);

    const imageData = ctx.getImageData(0, 0, 64, 64);
    const data = imageData.data;

    let total = 0;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const brightness = 0.299*r + 0.587*g + 0.114*b;
        total += brightness;
    }

    const avg = total / (data.length / 4);

    return avg / 255;
}

export function createSeededRandom(seed) {
    return function() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}