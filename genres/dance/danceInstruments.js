// danceInstruments.js — DANCE ENGINE (nuova architettura B2)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";

// Import strumenti unificati
import {
    leadSaw, leadSynthBrass1, leadSynthBrass2,
    padBells, padGlass, padWarm, padWave, padShaku, padString,
    keysOrgan, pianoSynth,
    bassSynth, subBass, bassAttack,
    fxSweep, fxNoise, fxFantasy, fxHeaven, fxJump, fxHardFTCore,
    drumsDance,
    normalizeNote
} from "../../utils/mixelInstruments.js";

console.log("danceInstruments.js — unified version loaded");

// ============================================================================
// 🎚 BUS DANCE
// ============================================================================
export const leadBus = new Tone.Gain(1);
export const padBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const organBus = new Tone.Gain(1);
export const pianoBus = new Tone.Gain(1);
export const fxBus = new Tone.Gain(1);
export const drumsBus = new Tone.Gain(1);

// ============================================================================
// 🎧 SIDECHAIN DUCKING
// ============================================================================
export const duckGain = new Tone.Gain(1).toDestination();
padBus.connect(duckGain);
bassBus.connect(duckGain);

export const duckEnv = new Tone.Envelope({
    attack: 0.001,
    decay: 0.12,
    sustain: 1,
    release: 0.1
});
duckEnv.connect(duckGain.gain);

// ============================================================================
// 🎚 EQ DANCE
// ============================================================================
const leadEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const padEQ = new Tone.EQ3({ low: -2, mid: -1, high: 2 });
const bassEQ = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const organEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const pianoEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const fxEQ = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const drumsEQ = new Tone.EQ3({ low: 2, mid: 1, high: 3 });

// ============================================================================
// 🎛 RIVERBERO DANCE
// ============================================================================
const hallReverb = new Tone.Reverb({
    decay: 2.8,
    preDelay: 0.01,
    wet: 0.35
}).toDestination();

// ============================================================================
// 🔌 ROUTING STRUMENTI → BUS
// ============================================================================

// Lead
leadSaw.disconnect().connect(leadBus);
leadSynthBrass1.disconnect().connect(leadBus);
leadSynthBrass2.disconnect().connect(leadBus);

// Pads
padBells.disconnect().connect(padBus);
padGlass.disconnect().connect(padBus);
padWarm.disconnect().connect(padBus);
padWave.disconnect().connect(padBus);
padShaku.disconnect().connect(padBus);
padString.disconnect().connect(padBus);

// Organo & Piano
keysOrgan.disconnect().connect(organBus);
pianoSynth.disconnect().connect(pianoBus);

// Bass
bassSynth.disconnect().connect(bassBus);
subBass.disconnect().connect(bassBus);
bassAttack.disconnect().connect(bassBus);

// FX
fxSweep.disconnect().connect(fxBus);
fxNoise.disconnect().connect(fxBus);
fxFantasy.disconnect().connect(fxBus);
fxHeaven.disconnect().connect(fxBus);
fxJump.disconnect().connect(fxBus);
fxHardFTCore.disconnect().connect(fxBus);

// Drums
drumsDance.disconnect().connect(drumsBus);

// ============================================================================
// 🔊 ROUTING BUS → EQ → REVERB → MASTER
// ============================================================================
leadBus.connect(leadEQ).connect(hallReverb).connect(masterEQ);
padBus.connect(padEQ).connect(hallReverb).connect(masterEQ);
bassBus.connect(bassEQ).connect(hallReverb).connect(masterEQ);
organBus.connect(organEQ).connect(hallReverb).connect(masterEQ);
pianoBus.connect(pianoEQ).connect(hallReverb).connect(masterEQ);
fxBus.connect(fxEQ).connect(hallReverb).connect(masterEQ);
drumsBus.connect(drumsEQ).connect(hallReverb).connect(masterEQ);

// ============================================================================
// 🎚 VOLUMI DI DEFAULT
// ============================================================================
bassBus.gain.value = Tone.dbToGain(8);
drumsBus.gain.value = Tone.dbToGain(10);
leadBus.gain.value = Tone.dbToGain(-2);
padBus.gain.value = Tone.dbToGain(-2);
fxBus.gain.value = Tone.dbToGain(-2);

// ============================================================================
// 🎚 SET VOLUME (per UI)
// ============================================================================
export function setVolume(busName, dbValue) {
    const mixer = {
        leadSaw: leadBus,
        leadSynthBrass1: leadBus,
        leadSynthBrass2: leadBus,

        padBells: padBus,
        padGlass: padBus,
        padWarm: padBus,
        padWave: padBus,
        padShaku: padBus,
        padString: padBus,

        keysOrgan: organBus,
        pianoSalamander: pianoBus,

        bassDance: bassBus,
        subBass: bassBus,
        bassAttack: bassBus,

        fxSweep: fxBus,
        fxNoise: fxBus,
        fxFantasy: fxBus,
        fxHeaven: fxBus,
        fxJump: fxBus,
        fxHardCore: fxBus,

        drumsDance: drumsBus
    };

    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// ============================================================================
// 📦 EXPORT
// ============================================================================
export const danceInstruments = {
    leadSaw, leadSynthBrass1, leadSynthBrass2,
    padBells, padGlass, padWarm, padWave, padShaku, padString,
    keysOrgan, pianoSalamander,
    bassDance, subBass, bassAttack,
    fxSweep, fxNoise, fxFantasy, fxHeaven, fxJump, fxHardCore,
    drumsDance,
    leadBus, padBus, bassBus, organBus, pianoBus, fxBus, drumsBus,
    duckEnv,
    setVolume
};

export const danceVolumeMap = {
    leadSaw: "Saw",
    leadSynthBrass1: "SynthBrass1",
    leadSynthBrass2: "SynthBrass2",

    padBells: "Bells",
    padGlass: "Glass",
    padWarm: "Warm",
    padWave: "Wave",
    padShaku: "Shaku",
    padString: "String",

    keysOrgan: "Organo",
    pianoSynth: "Piano",

    bassSynth: "Basso",
    subBass: "SubBass",
    bassAttack: "BassAttack",

    fxSweep: "Sweep",
    fxNoise: "Noise",
    fxFantasy: "Fantasy",
    fxHeaven: "Heaven",
    fxJump: "Jump",
    fxHardFTCore: "HardCore",

    drumsDance: "Percussioni"
};

export { hallReverb, normalizeNote };
