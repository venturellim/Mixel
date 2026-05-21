// orchestraInstruments.js — ver. 003 (solo routing e volumi)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";
import {
    violin, viola, cello, doubleBass,
    percussion,
    normalizeNote
} from "../../utils/mixelInstruments.js";

console.log("orchestraInstruments.js ver. 003 loaded");

// ============================================================
// BUS ORCHESTRA
// ============================================================
export const violinBus = new Tone.Gain(1);
export const violaBus = new Tone.Gain(1);
export const celloBus = new Tone.Gain(1);
export const doubleBassBus = new Tone.Gain(1);
export const percussionBus = new Tone.Gain(1);

const hallReverb = new Tone.Reverb({
    decay: 2.8, preDelay: 0.01, wet: 0.35
}).toDestination();

const violinEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const violaEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const celloEQ = new Tone.EQ3({ low: -3, mid: 2, high: 6 });
const doubleBassEQ = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const percussionEQ = new Tone.EQ3({ low: 2, mid: 1, high: 3 });

// ============================================================
// RICONNETTI STRUMENTI AI BUS ORCHESTRA
// ============================================================
violin.disconnect().connect(violinBus);
viola.disconnect().connect(violaBus);
cello.disconnect().connect(celloBus);
doubleBass.disconnect().connect(doubleBassBus);
percussion.disconnect().connect(percussionBus);

// ============================================================
// ROUTING BUS → EQ → MASTER
// ============================================================
violinBus.connect(violinEQ).connect(hallReverb).connect(masterEQ);
violaBus.connect(violaEQ).connect(hallReverb).connect(masterEQ);
celloBus.connect(celloEQ).connect(hallReverb).connect(masterEQ);
doubleBassBus.connect(doubleBassEQ).connect(hallReverb).connect(masterEQ);
percussionBus.connect(percussionEQ).connect(hallReverb).connect(masterEQ);

// ============================================================
// VOLUMI DI DEFAULT
// ============================================================
violinBus.gain.value = Tone.dbToGain(8);
violaBus.gain.value = Tone.dbToGain(2);
celloBus.gain.value = Tone.dbToGain(-6);
doubleBassBus.gain.value = Tone.dbToGain(2);
percussionBus.gain.value = Tone.dbToGain(6);

// ============================================================
// SET VOLUME
// ============================================================
export function setVolume(busName, dbValue) {
    const mixer = {
        violin: violinBus, viola: violaBus, cello: celloBus,
        doubleBass: doubleBassBus, percussion: percussionBus
    };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// ============================================================
// ESPORTAZIONI
// ============================================================
export const orchestraInstruments = {
    violin, viola, cello, doubleBass,
    percussion,
    violinBus, violaBus, celloBus, doubleBassBus, percussionBus,
    setVolume
};

export const orchestraVolumeMap = {
    violin: "Violino",
    viola: "Viola",
    cello: "Violoncello",
    doubleBass: "Contrabbasso",
    percussion: "Percussioni"
};

export { hallReverb, normalizeNote };