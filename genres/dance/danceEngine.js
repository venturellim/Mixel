// danceEngine.js — versione corretta
import * as Tone from "https://esm.sh/tone";

import { chooseDanceStyle } from "./chooseDanceStyle.js";
import { buildDanceParams } from "./danceParams.js";
import { danceInstruments, danceVolumeMap } from "./danceInstruments.js";
import { scheduleDanceRhythm } from "./danceRhythmEngine.js";
import { scheduleDanceLead } from "./danceLeadEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("danceEngine.js ver. 002 FIXED loaded");

export async function waitDanceInstruments() {
    const total = Object.keys(danceInstruments).length;
    await waitForInstruments(total, "Dance");
}

function createSeededRandom(seed) {
    return function () {
        seed = (seed * 16807) % 2147483647;
        return (seed - 1) / 2147483646;
    };
}

export function createDanceEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const style = chooseDanceStyle(params.dna, params.global);
    const danceParams = buildDanceParams(rand, params.global);

    // RESET COMPLETO del Transport
    Tone.Transport.stop();
    Tone.Transport.cancel(0);  // ← cancella TUTTO
    Tone.Transport.bpm.value = danceParams.bpm;
    
    // IMPORTANTE: resetta i parametri interni
    Tone.Transport.seconds = 0;
    
    const structure = [
        { name: "intro",  measures: 4 },
        { name: "build",  measures: 4 },
        { name: "drop",   measures: 8 },
        { name: "break",  measures: 4 },
        { name: "chorus", measures: 8 },
        { name: "outro",  measures: 4 }
    ];

    let currentTime = 0;
    const measureDur = (60 / danceParams.bpm) * 4;

    structure.forEach(sec => {
        sec.startTime = currentTime;
        currentTime += sec.measures * measureDur;
    });

    // Verifica che gli strumenti siano pronti PRIMA di schedulare
    const allInstrumentsReady = () => {
        const instruments = [
            danceInstruments.percussion,
            danceInstruments.bass,
            danceInstruments.leadSaw,
            danceInstruments.leadSynthBrass1,
            danceInstruments.leadSynthBrass2,
            danceInstruments.piano
        ];
        
        for (const inst of instruments) {
            if (!inst) {
                console.warn("⚠️ Instrument not ready:", inst);
                return false;
            }
            // Per i sampler, controlla se hanno loaded
            if (inst.loaded === false) {
                console.warn("⚠️ Sampler not loaded yet");
                return false;
            }
        }
        return true;
    };
    
    if (!allInstrumentsReady()) {
        console.warn("⚠️ Not all instruments ready, scheduling might fail");
    }

    structure.forEach(sec => {
        Tone.Transport.schedule(() => {
            console.log(`%c ▶ DANCE | ${sec.name.toUpperCase()} | STYLE: ${style}`, "color:#ff1493; font-weight:bold;");
        }, sec.startTime);

        scheduleDanceRhythm(sec, danceInstruments, danceParams, style, score, rand);
        scheduleDanceLead(sec, danceInstruments, danceParams, style, score, rand);
    });

    return {
        totalDuration: currentTime,

        play: async () => {
            // Attendi che il contesto sia attivo
            if (Tone.context.state !== "running") {
                console.log("🎵 Avvio contesto audio...");
                await Tone.context.resume();
            }
            
            // Piccolo delay per garantire che tutto sia pronto
            await new Promise(r => setTimeout(r, 50));
            
            // Avvia il transport
            Tone.Transport.start("+0.1");
            console.log("🎵 Transport avviato");
        },

        pause: () => {
            Tone.Transport.pause();
        },

        stop: () => {
            Tone.Transport.stop();
            Tone.Transport.cancel(0);
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