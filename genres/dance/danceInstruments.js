// danceInstruments.js — ver. 001 

import * as Tone from "https://esm.sh/tone";
import { masterEQ, registerInstrumentLoaded, logNote } from "../../common.js";

console.log("danceInstruments.js ver. 002.2 loaded");

// --- RIVERBERO ---
const hallReverb = new Tone.Reverb({
    decay: 2.8,
    preDelay: 0.01,
    wet: 0.35
}).toDestination();

export const leadBus = new Tone.Gain(1);
export const padBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const organoBus = new Tone.Gain(1);
export const pianoBus = new Tone.Gain(1);
export const fxBus = new Tone.Gain(1);
export const percussionBus = new Tone.Gain(1);

const leadEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const padEQ = new Tone.EQ3({ low: -2, mid: -1, high: 2 });
const bassEQ = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const organoEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const pianoEQ = new Tone.EQ3({ low: -4, mid: 2, high: 3 });
const fxEQ   = new Tone.EQ3({ low: 4, mid: -2, high: -4 });
const percussionEQ   = new Tone.EQ3({ low: 2, mid: 1, high: 3 });

// Routing bus → EQ → master
leadBus.connect(leadEQ).connect(hallReverb).connect(masterEQ);
padBus.connect(padEQ).connect(hallReverb).connect(masterEQ);
bassBus.connect(bassEQ).connect(hallReverb).connect(masterEQ);
organoBus.connect(organoEQ).connect(hallReverb).connect(masterEQ);
pianoBus.connect(pianoEQ).connect(hallReverb).connect(masterEQ);
fxBus.connect(fxEQ).connect(hallReverb).connect(masterEQ);
percussionBus.connect(percussionEQ).connect(hallReverb).connect(masterEQ);

// --- LEAD SAW ---
export const leadSaw = new Tone.Sampler({
    urls: { 
    C3: "Samples/Synth/LeadSaw/C3.mp3", 
    C4: "Samples/Synth/LeadSaw/C4.mp3",
    E3: "Samples/Synth/LeadSaw/E3.mp3", 
    E4: "Samples/Synth/LeadSaw/E4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Saw")
}).connect(leadBus);

// --- LEAD SYNTHBRASS 1 ---
export const leadSynthBrass1 = new Tone.Sampler({
    urls: { 
    C3: "Samples/Synth/LeadSynthBrass1/C3.mp3", 
    C4: "Samples/Synth/LeadSynthBrass1/C4.mp3",
    "F#3": "Samples/Synth/LeadSynthBrass1/F#3.mp3",
    "F#4": "Samples/Synth/LeadSynthBrass1/F#4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Synth Brass 1")
}).connect(leadBus);

// --- LEAD SYNTHBRASS 2 ---
export const leadSynthBrass2 = new Tone.Sampler({
    urls: { 
    C3: "Samples/Synth/LeadSynthBrass2/C3.mp3", 
    C4: "Samples/Synth/LeadSynthBrass2/C4.mp3",
    "F#3": "Samples/Synth/LeadSynthBrass2/F#3.mp3",
    "F#4": "Samples/Synth/LeadSynthBrass2/F#4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Synth Brass 2")
}).connect(leadBus);

// SWEET

export const fxSweep = new Tone.Sampler({
  urls: { C4: "Samples/Synth/FxSweep/C4.mp3" },
  release: 1.2,
  onload: () => registerInstrumentLoaded("Sweep")
}).connect(fxBus);

// NOISE

export const fxNoise = new Tone.Sampler({
  urls: { C4: "Samples/Synth/FxNoise/C4.mp3" },
  release: 1.2,
  onload: () => registerInstrumentLoaded("Noise")
}).connect(fxBus);


// FANTASY

export const fxFantasy = new Tone.Sampler({
    urls: { 
    C3: "Samples/Synth/FxFantasy/C3.mp3", 
    C4: "Samples/Synth/FxFantasy/C4.mp3",
    C5: "Samples/Synth/FxFantasy/C5.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Fantasia")
}).connect(fxBus);

// STACCATO HEAVEN 

export const fxHeaven = new Tone.Sampler({
    urls: { 
    C3: "Samples/Synth/FxHeaven/C3.mp3", 
    C4: "Samples/Synth/FxHeaven/C4.mp3",
    C5: "Samples/Synth/FxHeaven/C5.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Staccato Heaven")
}).connect(fxBus);

// JUMP

export const fxJump = new Tone.Sampler({
    urls: { 
    C3: "Samples/Synth/FxJump/C3.mp3", 
    C4: "Samples/Synth/FxJump/C4.mp3",
    C5: "Samples/Synth/FxJump/C5.mp3",
    E3: "Samples/Synth/FxJump/E3.mp3",
    E4: "Samples/Synth/FxJump/E4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Jump")
}).connect(fxBus);

// HARD FIR THE CORE

export const fxHardFTCore = new Tone.Sampler({
    urls: { 
    C2: "Samples/Synth/FxHardFTCore/C2.mp3", 
    C4: "Samples/Synth/FxHardFTCore/C4.mp3",
    C5: "Samples/Synth/FxHardFTCore/C5.mp3",
    E3: "Samples/Synth/FxHardFTCore/E3.mp3",
    E4: "Samples/Synth/FxHardFTCore/E4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Hard for the Core")
}).connect(fxBus);

// BELLS PAD 

export const bellsPad = new Tone.Sampler({
    urls: {  
    C2: "Samples/Synth/BellsPad/C2.mp3", 
    C3: "Samples/Synth/BellsPad/C3.mp3", 
    C4: "Samples/Synth/BellsPad/C4.mp3",
    C5: "Samples/Synth/BellsPad/C5.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Bells")
}).connect(padBus);

// GLASS PAD 

export const glassPad = new Tone.Sampler({
    urls: {  
    C2: "Samples/Synth/GlassPad/C2.mp3", 
    C3: "Samples/Synth/GlassPad/C3.mp3", 
    C4: "Samples/Synth/GlassPad/C4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Glass")
}).connect(padBus);

// SHAKU PAD 

export const shakuPad = new Tone.Sampler({
    urls: {  
    C3: "Samples/Synth/ShakuPad/C3.mp3", 
    "F#3": "Samples/Synth/ShakuPad/F#3.mp3", 
    C4: "Samples/Synth/ShakuPad/C4.mp3",
    "F#4": "Samples/Synth/ShakuPad/F#4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Shaku")
}).connect(padBus);

// SO TRUE STRING PAD 

export const StStringPad = new Tone.Sampler({
    urls: {  
    C2: "Samples/Synth/StStringPad/C2.mp3", 
    C3: "Samples/Synth/StStringPad/C3.mp3", 
    C4: "Samples/Synth/StStringPad/C4.mp3",
    C5: "Samples/Synth/StStringPad/C5.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("So true String")
}).connect(padBus);

// WARM PAD 

export const warmPad = new Tone.Sampler({
    urls: {  
    C3: "Samples/Synth/WarmPad/C3.mp3", 
    "F#3": "Samples/Synth/WarmPad/F#3.mp3", 
    C4: "Samples/Synth/WarmPad/C4.mp3",
    "F#4": "Samples/Synth/WarmPad/F#4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Warm")
}).connect(padBus);

// WAVE PAD 

export const wavePad = new Tone.Sampler({
    urls: {  
    C3: "Samples/Synth/WavePad/C2.mp3", 
    E3: "Samples/Synth/WavePad/E3.mp3", 
    C4: "Samples/Synth/WavePad/C4.mp3",
    E4: "Samples/Synth/WavePad/E4.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Wave")
}).connect(padBus);

// --- ORGANO 2 ---
export const organo = new Tone.Sampler({
    urls: {  
    "A#1": "Samples/Synth/Organo/A#1.mp3",
    "A#2": "Samples/Synth/Organo/A#2.mp3", 
    A1: "Samples/Synth/Organo/A1.mp3",
    A2: "Samples/Synth/Organo/A2.mp3", 
    B1: "Samples/Synth/Organo/B1.mp3",
    B2: "Samples/Synth/Organo/B2.mp3",
    "C#1": "Samples/Synth/Organo/C#1.mp3",
    "C#2": "Samples/Synth/Organo/C#2.mp3",
    "C#3": "Samples/Synth/Organo/C#3.mp3",
    C1: "Samples/Synth/Organo/C1.mp3", 
    C2: "Samples/Synth/Organo/C2.mp3",
    C3: "Samples/Synth/Organo/C3.mp3", 
    D1: "Samples/Synth/Organo/D1.mp3",
    D2: "Samples/Synth/Organo/D2.mp3", 
    D3: "Samples/Synth/Organo/D3.mp3",
    "D#1": "Samples/Synth/Organo/D#1.mp3",
    "D#2": "Samples/Synth/Organo/D#2.mp3", 
    "D#3": "Samples/Synth/Organo/D#3.mp3",
    E1: "Samples/Synth/Organo/E1.mp3",
    E2: "Samples/Synth/Organo/E2.mp3", 
    E3: "Samples/Synth/Organo/E3.mp3",
    "F#1": "Samples/Synth/Organo/F#1.mp3",
    "F#2": "Samples/Synth/Organo/F#2.mp3", 
    "F#3": "Samples/Synth/Organo/F#3.mp3",
    F1: "Samples/Synth/Organo/F1.mp3",
    F2: "Samples/Synth/Organo/F2.mp3", 
    F3: "Samples/Synth/Organo/F3.mp3",
    "G#1": "Samples/Synth/Organo/G#1.mp3",
    "G#2": "Samples/Synth/Organo/G#2.mp3", 
    G1: "Samples/Synth/Organo/G1.mp3",
    G2: "Samples/Synth/Organo/G2.mp3", 
    G3: "Samples/Synth/Organo/G3.mp3"
    },
    release: 1.2,
    onload: () => registerInstrumentLoaded("Organo")
}).connect(organoBus);

// --- PIANO 16 ---
export const piano = new Tone.Sampler({
    urls: { 
    C0: "Samples/Synth/Piano/C0.mp3",
    C1: "Samples/Synth/Piano/C1.mp3",
   C2: "Samples/Synth/Piano/C2.mp3",
    C3: "Samples/Synth/Piano/C3.mp3", 
    C4: "Samples/Synth/Piano/C4.mp3",
    C5: "Samples/Synth/Piano/C5.mp3", 
    C6: "Samples/Synth/Piano/C6.mp3",
    C7: "Samples/Synth/Piano/C7.mp3", 
    "F#0": "Samples/Synth/Piano/F#0.mp3",
    "F#1": "Samples/Synth/Piano/F#1.mp3",
    "F#2": "Samples/Synth/Piano/F#2.mp3",
    "F#3": "Samples/Synth/Piano/F#3.mp3",
    "F#4": "Samples/Synth/Piano/F#4.mp3",
    "F#5": "Samples/Synth/Piano/F#5.mp3",
    "F#6": "Samples/Synth/Piano/F#6.mp3",
    "F#7": "Samples/Synth/Piano/F#7.mp3"
    },
    release: 1.5,
onload: () => registerInstrumentLoaded("Piano")
}).connect(pianoBus);

// --- BASS LATELY ---
export const bass = new Tone.Sampler({
    urls: { 
    C2: "Samples/Synth/Bass/C2.mp3",
    C3: "Samples/Synth/Bass/C3.mp3",
    E2: "Samples/Synth/Bass/E2.mp3",
    "F#3": "Samples/Synth/Bass/F#3.mp3"
    },
    release: 2,
onload: () => registerInstrumentLoaded("Basso")
}).connect(bassBus);

// --- 909 ---
export const percussion = new Tone.Players({
    urls: { 
         bassDrum: "Samples/Synth/Percussion/BassDrum.mp3", 
         closedHat: "Samples/Synth/Percussion/ClosedHat.mp3",
         crash: "Samples/Synth/Percussion/Crash.mp3",
         handClap: "Samples/Synth/Percussion/HandClap.mp3",
         hiTom: "Samples/Synth/Percussion/HiTom.mp3",
         lowTom: "Samples/Synth/Percussion/LowTom.mp3",
         midTom: "Samples/Synth/Percussion/MidTom.mp3", 
         openHat: "Samples/Synth/Percussion/OpenHat.mp3",
         ride: "Samples/Synth/Percussion/Ride.mp3",
         rimShot: "Samples/Synth/Percussion/RimShot.mp3",
         snareDrum: "Samples/Synth/Percussion/SnareDrum.mp3"
    },
    release: 3,
    onload: () => registerInstrumentLoaded("Percussioni")
}).connect(percussionBus);

export function setVolume(busName, dbValue) {
    const mixer = { leadSaw: leadBus, leadSynthBrass1: leadBus, leadSynthBrass2: leadBus, fxFantasy: fxBus, fxHeaven: fxBus, fxJump: fxBus, bass: bassBus, fxHardFTCore: fxBus, organo: organoBus, percussion: percussionBus, piano: pianoBus};
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

setVolume("leadSaw", +6);
setVolume("leadSynthBrass1", +6);
setVolume("leadSynthBrass2", +6);
setVolume("fxFantasy", +4);
setVolume("fxHeaven", +4);
setVolume("fxJump", +4);
setVolume("fxHardFTCore", +4);
setVolume("piano", +2);
setVolume("organo", +2);
setVolume("bass", +4);
setVolume("percussion", +6);

export const danceInstruments = {
    leadSaw,
    leadSynthBrass1,
    leadSynthBrass2,
    fxSweep,
    fxNoise,
    fxFantasy,
    fxHeaven,
    fxJump,
    fxHardFTCore,
    bellsPad,
    glassPad,
    shakuPad,
    StStringPad,
    warmPad,
    wavePad,
    organo,
    piano,
    bass,
    percussion,
    leadBus,
    padBus,
    fxBus,
    bassBus,
    organoBus,
    pianoBus,
    percussionBus,
    setVolume
};

export const danceVolumeMap = {
    leadSaw: "Saw", 
    leadSynthBrass1: "SynthBrass1", 
    leadSynthBrass2: "SynthBrass2", 
    fxSweep: "Sweep",
    fxNoise: "Noise",
    fxFantasy: "Fantasy", 
    fxHeaven: "Heaven", 
    fxJump: "Jump", 
    fxHardFTCore: "HardForTheCore",
    bellsPad: "Bells",
    glassPad: "Glass",
    shakuPad: "Shaku",
    StStringPad: "SoTrueString",
    warmPad: "Warm",
    wavePad: "Wave",
    bass: "Basso", 
     organo: "Organo", 
     piano: "Piano",
     percussion: "Percussioni"
};

export { hallReverb };
