// metalInstruments.js — ver. 006 (solo routing e volumi)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";
import {
    guitarPalm, guitarOpen, guitarLead,
    bassMetal, drumMetal,
    normalizeNote
} from "../../utils/mixelInstruments.js";

console.log("metalInstruments.js ver. 006 loaded");

// ============================================================
// BUS SPECIFICI DEL METAL
// ============================================================
export const guitarBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const drumBus = new Tone.Gain(1);
export const leadBus = new Tone.Gain(1);

const guitarEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const bassEQ = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const drumEQ = new Tone.EQ3({ low: 2, mid: 1, high: 3 });
const leadEQ = new Tone.EQ3({ low: -3, mid: 2, high: 6 });

const drumComp = new Tone.Compressor({
    threshold: -18, ratio: 4, attack: 0.01, release: 0.2
});

// ============================================================
// EFFETTI METAL
// ============================================================
const guitarCabinet = new Tone.Filter({ type: "lowpass", frequency: 4200, rolloff: -24 });
const stereoDelay = new Tone.Delay(0.012);
const panL = new Tone.Panner(-0.3);
const panR = new Tone.Panner(0.3);
const guitarFX = new Tone.Gain();
guitarFX.connect(guitarCabinet);
guitarCabinet.connect(panL).connect(guitarBus);
guitarCabinet.connect(stereoDelay).connect(panR).connect(guitarBus);

const leadCabinet = new Tone.Filter({ type: "lowpass", frequency: 5200, rolloff: -24 }).connect(leadBus);
const leadDelay = new Tone.FeedbackDelay({ delayTime: "8n", feedback: 0.2, wet: 0.12 }).connect(leadCabinet);
const leadVibrato = new Tone.Vibrato({ frequency: 5, depth: 0.1 }).connect(leadDelay);

// ============================================================
// RICONNETTI STRUMENTI AI BUS METAL
// ============================================================
guitarPalm.disconnect().connect(guitarFX);
guitarOpen.disconnect().connect(guitarFX);
guitarLead.disconnect().connect(leadVibrato);
bassMetal.disconnect().connect(bassBus);
drumMetal.disconnect().connect(drumBus);

// ============================================================
// ROUTING BUS → EQ → MASTER
// ============================================================
guitarBus.connect(guitarEQ).connect(masterEQ);
bassBus.connect(bassEQ).connect(masterEQ);
drumBus.connect(drumEQ).connect(drumComp).connect(masterEQ);
leadBus.connect(leadEQ).connect(masterEQ);

// ============================================================
// VOLUMI DI DEFAULT
// ============================================================
guitarBus.gain.value = Tone.dbToGain(0);
bassBus.gain.value = Tone.dbToGain(2);
leadBus.gain.value = Tone.dbToGain(2);
drumBus.gain.value = Tone.dbToGain(-6);

// ============================================================
// SET VOLUME
// ============================================================
export function setVolume(busName, dbValue) {
    const mixer = { guitar: guitarBus, bass: bassBus, drums: drumBus, lead: leadBus };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// ============================================================
// ESPORTAZIONI
// ============================================================
export const metalInstruments = {
    guitarPalm, guitarOpen, guitarLead,
    bass: bassMetal,
    drums: drumMetal,
    guitarBus, bassBus, drumBus, leadBus,
    setVolume
};

export const metalVolumeMap = {
    guitar: "Chitarre",
    bass: "Basso",
    drums: "Batteria",
    lead: "Lead Solo"
};

export { normalizeNote };