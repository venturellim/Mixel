// metalInstruments.js — ver. 006
import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded, logNote } from "../../common.js";

console.log("metalInstruments.js ver. 006 loaded");

// ============================================================
// 🎚 BUS SPECIFICI DEL METAL
// ============================================================
export const guitarBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const drumBus = new Tone.Gain(1);
export const leadBus = new Tone.Gain(1);

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

// Routing bus → EQ → master
guitarBus.connect(guitarEQ).connect(masterEQ);
bassBus.connect(bassEQ).connect(masterEQ);
drumBus.connect(drumEQ).connect(drumComp).connect(masterEQ);
leadBus.connect(leadEQ).connect(masterEQ);

// ============================================================
// 🎸 FIX CHITARRE RITMICHE: CABINET & STEREO HAAS
// ============================================================
const guitarCabinet = new Tone.Filter({
    type: "lowpass",
    frequency: 4200, 
    rolloff: -24
});

const stereoDelay = new Tone.Delay(0.012); 
const panL = new Tone.Panner(-0.3);
const panR = new Tone.Panner(0.3);

const guitarFX = new Tone.Gain();
guitarFX.connect(guitarCabinet);
guitarCabinet.connect(panL).connect(guitarBus);
guitarCabinet.connect(stereoDelay).connect(panR).connect(guitarBus);

// ============================================================
// 🎸 FIX CHITARRA LEAD: CABINET, DELAY & VIBRATO
// ============================================================
const leadCabinet = new Tone.Filter({
    type: "lowpass",
    frequency: 5200, 
    rolloff: -24
}).connect(leadBus);

const leadDelay = new Tone.FeedbackDelay({
    delayTime: "8n",
    feedback: 0.2,
    wet: 0.12
}).connect(leadCabinet);

const leadVibrato = new Tone.Vibrato({
    frequency: 5,
    depth: 0.1
}).connect(leadDelay);

// ============================================================
// 📦 CONTEGGIO STRUMENTI (per il loader)
// ============================================================
// Ogni sampler chiamerà registerInstrumentLoaded() quando caricato
const TOTAL_INSTRUMENTS = 6; // guitarPalm, guitarOpen, guitarLead, bass, drums + 1 extra

// ============================================================
// 🎸 STRUMENTI (SAMPLERS)
// ============================================================

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
    attack: 0.015,
    release: 0.6,
    onload: () => registerInstrumentLoaded(" Chitarra Palm")
}).connect(guitarFX);

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
    attack: 0.02,
    release: 1.2,
    onload: () => registerInstrumentLoaded("Chitarra Open")
}).connect(guitarFX);

export const guitarLead = new Tone.Sampler({
    urls: {
        C2: "Samples/GuitarLead/C2.mp3", D2: "Samples/GuitarLead/D2.mp3",
        E2: "Samples/GuitarLead/E2.mp3", F2: "Samples/GuitarLead/F2.mp3",
        "G#2": "Samples/GuitarLead/Gs2.mp3", A2: "Samples/GuitarLead/A2.mp3", B2: "Samples/GuitarLead/B2.mp3",
        C3: "Samples/GuitarLead/C3.mp3", D3: "Samples/GuitarLead/D3.mp3",
         E3: "Samples/GuitarLead/E3.mp3", F3: "Samples/GuitarLead/F3.mp3",
        "G#3": "Samples/GuitarLead/Gs3.mp3", G3: "Samples/GuitarLead/G3.mp3", B3: "Samples/GuitarLead/B3.mp3",
        "C#4": "Samples/GuitarLead/Cs4.mp3", D4: "Samples/GuitarLead/D4.mp3",
         E4: "Samples/GuitarLead/E4.mp3", F4: "Samples/GuitarLead/F4.mp3",
        "G#4": "Samples/GuitarLead/Gs4.mp3", G4: "Samples/GuitarLead/G4.mp3", B4: "Samples/GuitarLead/B4.mp3",
        C5: "Samples/GuitarLead/C5.mp3", D5: "Samples/GuitarLead/D5.mp3",
         F5: "Samples/GuitarLead/F5.mp3",
        "G#5": "Samples/GuitarLead/Gs5.mp3", "A#5": "Samples/GuitarLead/As5.mp3",
         B5: "Samples/GuitarLead/B5.mp3",
        "C#6": "Samples/GuitarLead/Cs6.mp3", D6: "Samples/GuitarLead/D6.mp3",
    },
    attack: 0.02,
    release: 0.8,
    onload: () => registerInstrumentLoaded("Chitarra Lead")
}).connect(leadVibrato);

export const bass = new Tone.Sampler({
    urls: {
        C1: "Samples/Bass/C1.mp3", Db1: "Samples/Bass/Db1.mp3", D1: "Samples/Bass/D1.mp3",
        Eb1: "Samples/Bass/Eb1.mp3", E1: "Samples/Bass/E1.mp3", F1: "Samples/Bass/F1.mp3",
        Gb1: "Samples/Bass/Gb1.mp3", G1: "Samples/Bass/G1.mp3", Ab1: "Samples/Bass/Ab1.mp3",
        A1: "Samples/Bass/A1.mp3", Bb1: "Samples/Bass/Bb1.mp3", B1: "Samples/Bass/B1.mp3",
        C2: "Samples/Bass/C2.mp3"
    },
    onload: () => registerInstrumentLoaded("Basso")
}).connect(bassBus);

export const drums = new Tone.Players({
    urls: {
    kick: "Samples/Drums/kick.mp3", 
    snare: "Samples/Drums/snare.mp3",
    ghost: "Samples/Drums/ghost.mp3", 
    hihat: "Samples/Drums/hihatclosed.mp3",
    openhat: "Samples/Drums/hihatopen.mp3", 
    crash1: "Samples/Drums/crash1.mp3",
    crash2: "Samples/Drums/crash2.mp3", 
    tom1: "Samples/Drums/tom1.mp3",
    tom2: "Samples/Drums/tom2.mp3", 
    tom3: "Samples/Drums/tom3.mp3",
    tom4: "Samples/Drums/tom4.mp3", 
    ride: "Samples/Drums/ride.mp3",
    ridebell: "Samples/Drums/ridebell.mp3", 
    china: "Samples/Drums/china.mp3"
},
    onload: () => registerInstrumentLoaded("Batteria")
}).connect(drumBus);

// ============================================================
// 🎵 LOGGING & WRAPPING
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
    const p = drums.player(key);
    if (p) wrapPlayer("drums."+key, p);
});

// ============================================================
// ⚙️ FUNZIONI DI UTILITY
// ============================================================
export function setVolume(busName, dbValue) {
    const mixer = { guitar: guitarBus, bass: bassBus, drums: drumBus, lead: leadBus };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

//setVolume("guitar", -2);
//setVolume("bass", 0);
//setVolume("drums", -8);
//setVolume("lead", 0);

// ============================================================
// VOLUMI DI DEFAULT
// ============================================================

guitarBus.gain.value = Tone.dbToGain(4);  // Chitarra ritmica
bassBus.gain.value = Tone.dbToGain(4);    // Basso
leadBus.gain.value = Tone.dbToGain(0);   // Lead
drumBus.gain.value = Tone.dbToGain(-2);   // Batteria

export function normalizeNote(note, instrument) {
    if (!note || typeof note !== "string") return "A";
    const first = note[0].toUpperCase();
    const second = note[1];
    if (instrument === "guitarPalm" || instrument === "guitarOpen") return first; 
    if (instrument === "bass") {
        if (second === "b") return first + "b";
        if (second === "#") {
            const sharpToFlat = { "C#": "Db", "D#": "Eb", "F#": "Gb", "G#": "Ab", "A#": "Bb" };
     if (instrument === "guitarLead") {

    if (second === "#") return first + "#";

    return first;
}
            return sharpToFlat[first + "#"] ?? first;
        }
    }
    return first;
}

export const metalInstruments = {
    guitarPalm, guitarOpen, guitarLead, bass, drums,
    guitarBus, bassBus, drumBus, leadBus, setVolume
};

export const metalVolumeMap = {
    guitar: "Chitarre",
    bass: "Basso",
    drums: "Batteria",
    lead: "Lead Solo"
};