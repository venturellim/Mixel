// funkyInstruments.js — FUNKY ENGINE (nuova architettura B2)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";

// Import strumenti unificati
import {
    brassTrumpet, brassTrombone, brassSaxAlto,
    guitarMute, guitarClean,
    bassSlap,
    keysClavinet, fxNoisy,
    drumsFunky,
    normalizeNote
} from "../../utils/mixelInstruments.js";

console.log("funkyInstruments.js — unified version loaded");

// ============================================================================
// 🎚 BUS FUNKY
// ============================================================================
export const brassBus = new Tone.Gain(1);
export const guitarBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const keysBus = new Tone.Gain(1);
export const drumsBus = new Tone.Gain(1);
export const fxBus = new Tone.Gain(1);

// ============================================================================
// 🎚 EQ FUNKY
// ============================================================================
const brassEQ = new Tone.EQ3({ low: -2, mid: 3, high: 4 });
const guitarEQ = new Tone.EQ3({ low: -6, mid: 4, high: 2 });
const bassEQ = new Tone.EQ3({ low: 6, mid: -3, high: 4 });
const keysEQ = new Tone.EQ3({ low: -4, mid: 2, high: 5 });
const drumsEQ = new Tone.EQ3({ low: 4, mid: -2, high: 3 });

// ============================================================================
// 🎛 EFFETTI FUNKY
// ============================================================================
export const autoWah = new Tone.AutoWah({
    baseFrequency: 180,
    octaves: 6,
    sensitivity: -30,
    Q: 8,
    gain: 6
});

export const dottedDelay = new Tone.FeedbackDelay({
    delayTime: "8n.",
    feedback: 0.5,
    wet: 0.4
});

export const slapCompressor = new Tone.Compressor({
    threshold: -18,
    ratio: 6,
    attack: 0.002,
    release: 0.08
});

const guitarBoostEQ = new Tone.EQ3({ low: -3, mid: 6, high: 4 });

// ============================================================================
// 🔌 ROUTING STRUMENTI → BUS
// ============================================================================

// Brass
brassTrumpet.disconnect().connect(brassBus);
brassTrombone.disconnect().connect(brassBus);
brassSaxAlto.disconnect().connect(brassBus);

// Guitars
guitarMute.disconnect().connect(guitarBus);
guitarClean.disconnect().connect(guitarBus);

// Bass
bassSlap.disconnect().connect(bassBus);

// Keys
keysClavinet.disconnect().connect(keysBus);
fxNoisy.disconnect().connect(fxBus);

// Drums
drumsFunky.disconnect().connect(drumsBus);

// ============================================================================
// 🔊 ROUTING BUS → EQ → FX → MASTER
// ============================================================================
brassBus.connect(brassEQ).connect(masterEQ);

guitarBus
    .connect(guitarEQ)
    .connect(guitarBoostEQ)
    .connect(autoWah)
    .connect(dottedDelay)
    .connect(masterEQ);

bassBus.connect(bassEQ).connect(slapCompressor).connect(masterEQ);

keysBus.connect(keysEQ).connect(masterEQ);

drumsBus.connect(drumsEQ).connect(masterEQ);

fxBus.connect(masterEQ);

// ============================================================================
// 🎚 VOLUMI DI DEFAULT
// ============================================================================
brassBus.gain.value = Tone.dbToGain(0);
guitarBus.gain.value = Tone.dbToGain(8);
bassBus.gain.value = Tone.dbToGain(6);
keysBus.gain.value = Tone.dbToGain(-2);
drumsBus.gain.value = Tone.dbToGain(0);
fxBus.gain.value = Tone.dbToGain(-2);

// ============================================================================
// 🎚 SET VOLUME (per UI)
// ============================================================================
export function setVolume(busName, dbValue) {
    const mixer = {
        brassTrumpet: brassBus,
        brassTrombone: brassBus,
        brassSaxAlto: brassBus,

        guitarMute: guitarBus,
        guitarClean: guitarBus,

        bassSlap: bassBus,

        keysClavinet: keysBus,
        fxNoisy: fxBus,

        drumsFunky: drumsBus
    };

    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// ============================================================================
// 📦 EXPORT
// ============================================================================
export const funkyInstruments = {
    brassTrumpet, brassTrombone, brassSaxAlto,
    guitarMute, guitarClean,
    bassSlap,
    keysClavinet, fxNoisy,
    drumsFunky,
    brassBus, guitarBus, bassBus, keysBus, drumsBus, fxBus,
    autoWah, dottedDelay, slapCompressor,
    setVolume
};

export const funkyVolumeMap = {
    brassTrumpet: "Tromba",
    brassTrombone: "Trombone",
    brassSaxAlto: "Sax Alto",

    guitarMute: "Chitarra Mute",
    guitarClean: "Chitarra Clean",

    bassSlap: "Basso Slap",

    keysClavinet: "Clavinet",
    fxNoisy: "Noisy",

    drumsFunky: "Batteria"
};

export { normalizeNote };
