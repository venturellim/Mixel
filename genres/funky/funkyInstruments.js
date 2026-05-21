// funkyInstruments.js — ver. 002 (solo routing e volumi)
import * as Tone from "https://esm.sh/tone";
import { masterEQ } from "../../common.js";
import { 
    trumpet, trombone, saxAlto,
    guitarMute, guitarClean,
    bassSlap, clavinet, noisy,
    drumFunky,
    normalizeNote
} from "../../utils/mixelInstruments.js";

console.log("funkyInstruments.js ver. 002 loaded");

// ============================================================
// BUS EFFETTI (FUNKY)
// ============================================================
export const brassBus = new Tone.Gain(1);
export const guitarBus = new Tone.Gain(1);
export const bassBus = new Tone.Gain(1);
export const keysBus = new Tone.Gain(1);
export const drumsBus = new Tone.Gain(1);
export const fxBus = new Tone.Gain(1);

// EQ
const brassEQ = new Tone.EQ3({ low: -2, mid: 3, high: 4 });
const guitarEQ = new Tone.EQ3({ low: -6, mid: 4, high: 2 });
const bassEQ = new Tone.EQ3({ low: 6, mid: -3, high: 4 });
const keysEQ = new Tone.EQ3({ low: -4, mid: 2, high: 5 });
const drumsEQ = new Tone.EQ3({ low: 4, mid: -2, high: 3 });

// EFFETTI
export const autoWah = new Tone.AutoWah({
    baseFrequency: 180, octaves: 6, sensitivity: -30, Q: 8, gain: 6
});
export const dottedDelay = new Tone.FeedbackDelay({
    delayTime: "8n.", feedback: 0.5, wet: 0.4
});
export const slapCompressor = new Tone.Compressor({
    threshold: -18, ratio: 6, attack: 0.002, release: 0.08
});
const guitarBoostEQ = new Tone.EQ3({ low: -3, mid: 6, high: 4 });

// ============================================================
// RICONNETTI STRUMENTI AI BUS FUNKY
// ============================================================
trumpet.disconnect().connect(brassBus);
trombone.disconnect().connect(brassBus);
saxAlto.disconnect().connect(brassBus);
guitarMute.disconnect().connect(guitarBus);
guitarClean.disconnect().connect(guitarBus);
bassSlap.disconnect().connect(bassBus);
clavinet.disconnect().connect(keysBus);
noisy.disconnect().connect(keysBus);
drumFunky.disconnect().connect(drumsBus);

// ============================================================
// ROUTING BUS → EQ → EFFETTI → MASTER
// ============================================================
brassBus.connect(brassEQ).connect(masterEQ);
guitarBus.connect(guitarEQ).connect(guitarBoostEQ).connect(autoWah).connect(dottedDelay).connect(masterEQ);
bassBus.connect(bassEQ).connect(slapCompressor).connect(masterEQ);
keysBus.connect(keysEQ).connect(masterEQ);
drumsBus.connect(drumsEQ).connect(masterEQ);

// ============================================================
// VOLUMI DI DEFAULT
// ============================================================
brassBus.gain.value = Tone.dbToGain(0);
guitarBus.gain.value = Tone.dbToGain(8);
bassBus.gain.value = Tone.dbToGain(6);
keysBus.gain.value = Tone.dbToGain(-2);
drumsBus.gain.value = Tone.dbToGain(0);

// ============================================================
// SET VOLUME
// ============================================================
export function setVolume(busName, dbValue) {
    const mixer = {
        trumpet: brassBus, trombone: brassBus, saxAlto: brassBus,
        guitarMute: guitarBus, guitarClean: guitarBus,
        bassSlap: bassBus, clavinet: keysBus, noisy: keysBus,
        drumFunky: drumsBus
    };
    const bus = mixer[busName];
    if (bus) bus.gain.value = Tone.dbToGain(dbValue);
}

// ============================================================
// ESPORTAZIONI (identiche a prima!)
// ============================================================
export const funkyInstruments = {
    trumpet, trombone, saxAlto,
    guitarMute, guitarClean,
    bassSlap, clavinet, noisy,
    drumFunky,
    brassBus, guitarBus, bassBus, keysBus, drumsBus,
    autoWah, dottedDelay, slapCompressor,
    setVolume
};

export const funkyVolumeMap = {
    trumpet: "Tromba",
    trombone: "Trombone",
    saxAlto: "Sax Alto",
    guitarMute: "Chitarra Mute",
    guitarClean: "Chitarra Clean",
    bassSlap: "Basso Slap",
    clavinet: "Clavinet",
    noisy: "Noisy",
    drumFunky: "Batteria"
};

export { normalizeNote };