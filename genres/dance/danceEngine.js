// danceEngine.js — ver. 001 (complete)
import * as Tone from "https://esm.sh/tone";

import { chooseDanceStyle } from "./chooseDanceStyle.js";
import { buildDanceParams } from "./danceParams.js";

import { danceInstruments, danceVolumeMap } from "./danceInstruments.js";
import { scheduleDanceRhythm } from "./danceRhythmEngine.js";
import { scheduleDanceLead } from "./danceLeadEngine.js";

import { waitForInstruments } from "../../common.js";

console.log("danceEngine.js ver. 001 loaded");

// ------------------------------------------------------------
//  WAIT FOR INSTRUMENTS
// ------------------------------------------------------------
export async function waitDanceInstruments() {
    const total = Object.keys(danceInstruments).length;
    await waitForInstruments(total, "Dance");
}

// ------------------------------------------------------------
//  SEED RANDOM (deterministico, come nel metal)
// ------------------------------------------------------------
function createSeededRandom(seed) {
    return function () {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

// ------------------------------------------------------------
//  MAIN ENGINE
// ------------------------------------------------------------
export function createDanceEngine(params, score) {
console.log("Tonal center:", params.harmony.tonalCenter);

    // Random deterministico
    const rand = createSeededRandom(params.dna);

    // Stile dance (Gigi / Prezioso / Eiffel65 / GabryPonte)
    const style = chooseDanceStyle(params.dna, params.global);

    // Parametri dance (BPM, tonalità, scala, densità…)
    const danceParams = buildDanceParams(rand, params.global);

    // Reset transport
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = danceParams.bpm;

    // ------------------------------------------------------------
    //  STRUTTURA DEL BRANO (intro → build → drop → break → chorus → outro)
    // ------------------------------------------------------------
    const structure = [
        { name: "intro",  measures: 4 },
        { name: "build",  measures: 4 },
        { name: "drop",   measures: 8 },
        { name: "break",  measures: 4 },
        { name: "chorus", measures: 8 },
        { name: "outro",  measures: 4 }
    ];

    // Calcolo startTime per ogni sezione
    let currentTime = 0;
    const measureDur = (60 / danceParams.bpm) * 4;

    structure.forEach(sec => {
        sec.startTime = currentTime;
        currentTime += sec.measures * measureDur;
    });

    // ------------------------------------------------------------
    //  SCHEDULAZIONE SEZIONI
    // ------------------------------------------------------------
    structure.forEach(sec => {

        // Log visivo (come nel metal)
        Tone.Transport.schedule(() => {
            console.log(
                `%c ▶ DANCE | ${sec.name.toUpperCase()} | STYLE: ${style}`,
                "color:#ff1493; font-weight:bold;"
            );
        }, sec.startTime);

        // Ritmica (kick, clap, hat, bassline, pad, FX)
        scheduleDanceRhythm(
            sec,
            danceInstruments,
            danceParams,
            style,
            score,
            rand
        );

        // Lead melodici/ritmici
        scheduleDanceLead(
            sec,
            danceInstruments,
            danceParams,
            style,
            score,
            rand
        );
    });

    // ------------------------------------------------------------
    //  API PUBBLICA (identica al metalEngine)
    // ------------------------------------------------------------
    return {
        totalDuration: currentTime,

        play: () => {
            if (Tone.context.state !== "running") Tone.context.resume();
            Tone.Transport.start("+0.1");
        },

        pause: () => Tone.Transport.pause(),

        stop: () => {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            Tone.Transport.seconds = 0;
        },

        seek: s => {
            Tone.Transport.seconds = s;
        },

        mixerData: {
            instruments: danceInstruments,
            volumeMap: danceVolumeMap
        }
    };
}
