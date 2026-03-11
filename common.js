// common.js — versione moderna per Tone.js 15
import * as Tone from "https://esm.sh/tone@15.1.22";

// ======================================================
// CONTATORE GLOBALE PER IL CARICAMENTO
// ======================================================

window.__samplerLoadedCount = 0;
window.__samplerLoaded = function(name) {
    console.log(name.toUpperCase(), "LOADED");
    window.__samplerLoadedCount++;
};


// LOGGER UNIVERSALE PER TONE.JS

function logNote(instrumentName, note, time) {
    console.log(
        `%c🎵 ${instrumentName} → ${note} @ ${time}`,
        "color:#4CAF50; font-weight:bold;"
    );
}


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

export const leadChorus = new Tone.Chorus({
    frequency: 4,
    delayTime: 2.5,
    depth: 0.4,
    spread: 180
}).start();

export const leadDelay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.35
});

export const leadReverb = new Tone.Reverb({
    decay: 3,
    wet: 0.3
});

leadEQ.chain(leadChorus, leadDelay, leadReverb, masterEQ);

// ==============================
// GUITAR URL MAP (C2–E6)
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
    E6: "Samples/Guitar/E6.mp3"
};

// ==============================
// 🎸 GUITAR PALM (C2–C3)
// ==============================

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
    urls: guitarUrls,
    release: 1,
    baseUrl: "",
    onload: () => window.__samplerLoaded("palm")
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
// 🎸 GUITAR OPEN (C2–C3)
// ==============================

export const guitarOpen = new Tone.Sampler({
    urls: guitarUrls,
    baseUrl: "",
    onload: () => window.__samplerLoaded("open")
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
// 🎸 GUITAR LEAD (C2–E6)
// ==============================

export const guitarLead = new Tone.Sampler({
    urls: guitarUrls,
    baseUrl: "",
    onload: () => window.__samplerLoaded("lead")
});

guitarLead.connect(leadEQ);

// Effetti per Palm e Open

const guitarDelay = new Tone.FeedbackDelay(0.03, 0.2).toDestination();
guitarPalm.connect(guitarDelay);
guitarOpen.connect(guitarDelay);

// 🎸 Riverbero per la chitarra ritmica (Palm + Open)
export const guitarRiffReverb = new Tone.Reverb({
    decay: 4,        // sustain lungo
    preDelay: 0.01,  // attacco immediato
    wet: 0.25        // mix 25% = Stratovarius style
}).toDestination();

guitarPalm.connect(guitarRiffReverb);
guitarOpen.connect(guitarRiffReverb);


// ==============================
// 🎸 BASS (C1–C3)
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
    },
    onload: () => window.__samplerLoaded("bass")
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

// ==============================
// VOLUMI
// ==============================

guitarPalm.volume.value = -3;
guitarOpen.volume.value = -3;

bass.volume.value = -3;

guitarLead.volume.value = 0;

drums.volume.value = -6;



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

function wrapPlayer(name, player) {
    const orig = player.start.bind(player);
    player.start = (time, offset, dur) => {
        logNote(name, "(sample)", time);
        return orig(time, offset, dur);
    };
}

Object.keys(drums._players).forEach(key => {
    wrapPlayer("drums." + key, drums.player(key));
});


// ==============================
// UTILITIES
// ==============================

export function clampNote(note, minMidi, maxMidi) {
    const midi = Tone.Frequency(note).toMidi();
    if (midi < minMidi || midi > maxMidi) return null;
    return note;
}

export function pickFromScale(scale, step) {
    return scale[step % scale.length];
}

export function createSeededRandom(seed) {
    return function () {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}

export async function waitDownloadInstrumentsWithProgress() {

    const overlay = document.getElementById("loadingOverlay");
    const bar = document.getElementById("loadingBar");
    const text = document.getElementById("loadingText");

    overlay.style.display = "flex";

    const total = 4; // palm, open, lead, bass
    let loaded = 0;

    function checkLoaded() {
        loaded = window.__samplerLoadedCount;
        const percent = Math.floor((loaded / total) * 100);
        bar.style.width = percent + "%";
        text.innerText = "Caricamento strumenti… " + percent + "%";
    }

    // Aggiorna ogni 100ms
    while (loaded < total) {
        checkLoaded();
        await new Promise(res => setTimeout(res, 100));
    }

    overlay.style.display = "none";
}

