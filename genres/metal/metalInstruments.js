// metalInstruments.js — METAL ENGINE (nuova architettura B2)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";

// Import strumenti unificati
import {
    guitarPalm, guitarOpen, guitarLead,
    bassMetal,
    drumsMetal,
    normalizeNote
} from "../../utils/mixelInstruments.js";

console.log("metalInstruments.js — unified version loaded");

// ============================================================================
// 🎚 BUS METAL
// ============================================================================
export const guitarBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const drumsBus = new Tone.Gain(1);
export const leadBus = new Tone.Gain(1);

// ============================================================================
// 🎚 EQ METAL
// ============================================================================
const guitarEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const bassEQ   = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const drumsEQ  = new Tone.EQ3({ low: 2, mid: 1, high: 3 });
const leadEQ   = new Tone.EQ3({ low: -3, mid: 2, high: 6 });

const drumComp = new Tone.Compressor({
    threshold: -18,
    ratio: 4,
    attack: 0.01,
    release: 0.2
});

// ============================================================================
// 🎸 CHITARRE METAL — CABINET + HAAS STEREO
// ============================================================================
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

// ============================================================================
// 🎸 LEAD METAL — CABINET + DELAY + VIBRATO
// ============================================================================
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

// ============================================================================
// 🔌 ROUTING STRUMENTI → BUS
// ============================================================================

// Chitarre ritmiche
guitarPalm.disconnect().connect(guitarFX);
guitarOpen.disconnect().connect(guitarFX);

// Lead
guitarLead.disconnect().connect(leadVibrato);

// Basso
bassMetal.disconnect().connect(bassBus);

// Batteria
drumsMetal.disconnect().connect(drumsBus);

// ============================================================================
// 🔊 ROUTING BUS → EQ → MASTER
// ============================================================================
guitarBus.connect(guitarEQ).connect(masterEQ);
bassBus.connect(bassEQ).connect(masterEQ);
drumsBus.connect(drumsEQ).connect(drumComp).connect(masterEQ);
leadBus.connect(leadEQ).connect(masterEQ);

// ============================================================================
// 🎚 VOLUMI DI DEFAULT
// ============================================================================
guitarBus.gain.value = Tone.dbToGain(0);
bassBus.gain.value = Tone.dbToGain(2);
leadBus.gain.value = Tone.dbToGain(2);
drumsBus.gain.value = Tone.dbToGain(-6);

// ============================================================================
// 🎚 SET VOLUME (per UI)
// ============================================================================
export function setVolume(busName, dbValue) {
    const mixer = {
        guitarPalm: guitarBus,
        guitarOpen: guitarBus,
        guitarLead: leadBus,
        bassMetal: bassBus,
        drumsMetal: drumsBus
    };

    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// ============================================================================
// 📦 EXPORT
// ============================================================================
export const metalInstruments = {
    guitarPalm, guitarOpen, guitarLead,
    bassMetal,
    drumsMetal,
    guitarBus, bassBus, drumsBus, leadBus,
    setVolume
};

export const metalVolumeMap = {
    guitarPalm: "Palm Mute",
    guitarOpen: "Open Chords",
    guitarLead: "Lead Solo",
    bassMetal: "Basso",
    drumsMetal: "Batteria"
};

export { normalizeNote };
