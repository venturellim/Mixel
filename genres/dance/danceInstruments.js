// danceInstruments.js — ver. 005 (solo routing e volumi)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";
import {
    leadSaw, leadSynthBrass1, leadSynthBrass2,
    bellsPad, glassPad, warmPad, wavePad, StStringPad,
    organo, piano, bassSynth,
    percussion, subBass, bassAttack,
    fxSweep, fxNoise, fxFantasy, fxHeaven, fxJump, fxHardFTCore,
    normalizeNote
} from "../../utils/mixelInstruments.js";

console.log("danceInstruments.js ver. 005 loaded");

// ============================================================
// BUS EFFETTI (DANCE)
// ============================================================
export const leadBus = new Tone.Gain(1);
export const padBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const organoBus = new Tone.Gain(1);
export const pianoBus = new Tone.Gain(1);
export const fxBus = new Tone.Gain(1);
export const percussionBus = new Tone.Gain(1);

// SIDECHAIN DUCKING
export const duckGain = new Tone.Gain(1).toDestination();
padBus.connect(duckGain);
bassBus.connect(duckGain);
export const duckEnv = new Tone.Envelope({
    attack: 0.001, decay: 0.12, sustain: 1, release: 0.1
});
duckEnv.connect(duckGain.gain);

// EQ
const leadEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const padEQ = new Tone.EQ3({ low: -2, mid: -1, high: 2 });
const bassEQ = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const organoEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const pianoEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const fxEQ = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const percussionEQ = new Tone.EQ3({ low: 2, mid: 1, high: 3 });

// Riverbero dance
const hallReverb = new Tone.Reverb({
    decay: 2.8, preDelay: 0.01, wet: 0.35
}).toDestination();

// ============================================================
// RICONNETTI STRUMENTI AI BUS DANCE
// ============================================================
leadSaw.disconnect().connect(leadBus);
leadSynthBrass1.disconnect().connect(leadBus);
leadSynthBrass2.disconnect().connect(leadBus);
bellsPad.disconnect().connect(padBus);
glassPad.disconnect().connect(padBus);
warmPad.disconnect().connect(padBus);
wavePad.disconnect().connect(padBus);
StStringPad.disconnect().connect(padBus);
organo.disconnect().connect(organoBus);
piano.disconnect().connect(pianoBus);
bassSynth.disconnect().connect(bassBus);
subBass.disconnect().connect(bassBus);
bassAttack.disconnect().connect(bassBus);
percussion.disconnect().connect(percussionBus);
fxSweep.disconnect().connect(fxBus);
fxNoise.disconnect().connect(fxBus);
fxFantasy.disconnect().connect(fxBus);
fxHeaven.disconnect().connect(fxBus);
fxJump.disconnect().connect(fxBus);
fxHardFTCore.disconnect().connect(fxBus);

// ============================================================
// ROUTING BUS → EQ → MASTER
// ============================================================
leadBus.connect(leadEQ).connect(hallReverb).connect(masterEQ);
padBus.connect(padEQ).connect(hallReverb).connect(masterEQ);
bassBus.connect(bassEQ).connect(hallReverb).connect(masterEQ);
organoBus.connect(organoEQ).connect(hallReverb).connect(masterEQ);
pianoBus.connect(pianoEQ).connect(hallReverb).connect(masterEQ);
fxBus.connect(fxEQ).connect(hallReverb).connect(masterEQ);
percussionBus.connect(percussionEQ).connect(hallReverb).connect(masterEQ);

// ============================================================
// VOLUMI DI DEFAULT
// ============================================================
bassBus.gain.value = Tone.dbToGain(8);
percussionBus.gain.value = Tone.dbToGain(10);
leadBus.gain.value = Tone.dbToGain(-2);
padBus.gain.value = Tone.dbToGain(-2);
fxBus.gain.value = Tone.dbToGain(-2);

// ============================================================
// SET VOLUME
// ============================================================
export function setVolume(busName, dbValue) {
    const mixer = {
        leadSaw: leadBus, leadSynthBrass1: leadBus, leadSynthBrass2: leadBus,
        bellsPad: padBus, glassPad: padBus, warmPad: padBus, wavePad: padBus, StStringPad: padBus,
        organo: organoBus, piano: pianoBus,
        bass: bassBus,
        percussion: percussionBus,
        fxSweep: fxBus, fxNoise: fxBus, fxFantasy: fxBus, fxHeaven: fxBus, fxJump: fxBus, fxHardFTCore: fxBus
    };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// ============================================================
// ESPORTAZIONI (identiche a prima!)
// ============================================================
export const danceInstruments = {
    leadSaw, leadSynthBrass1, leadSynthBrass2,
    bellsPad, glassPad, warmPad, wavePad, StStringPad,
    organo, piano,
    bass: bassSynth,
    percussion,
    subBass, bassAttack,
    fxSweep, fxNoise, fxFantasy, fxHeaven, fxJump, fxHardFTCore,
    leadBus, padBus, fxBus, bassBus, organoBus, pianoBus, percussionBus,
    duckEnv,
    setVolume
};

export const danceVolumeMap = {
    leadSaw: "Saw",
    leadSynthBrass1: "SynthBrass1",
    leadSynthBrass2: "SynthBrass2",
    bellsPad: "Bells",
    glassPad: "Glass",
    warmPad: "Warm",
    wavePad: "Wave",
    StStringPad: "SoTrueString",
    organo: "Organo",
    piano: "Piano",
    bass: "Basso",
    percussion: "Percussioni",
    fxSweep: "Sweep",
    fxNoise: "Noise",
    fxFantasy: "Fantasy",
    fxHeaven: "Heaven",
    fxJump: "Jump",
    fxHardFTCore: "HardForTheCore"
};

export { hallReverb, normalizeNote };