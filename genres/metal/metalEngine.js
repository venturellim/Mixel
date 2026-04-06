// metalEngine.js — ver. 010 (STABLE PARAMETERS)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 010.1 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    // Creiamo i parametri musicali
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    // 1. STRUTTURA CON QUADRATURA
const rawStructure = [
    { name: "intro",     weight: 4 + (rand() * 4) }, 
    { name: "verse",     weight: 8 + (rand() * 8) },
    { name: "prechorus", weight: (params.imageParams.energy > 0.4 && rand() > 0.5) ? 4 : 0 },
    { name: "chorus",    weight: 8 + (rand() * 8) },
    { name: "solo",      weight: params.imageParams.complexity > 0.7 ? 8 : 0 },
    { name: "chorus",    weight: 8 },
    { name: "outro",     weight: 4 }
];


    const finalStructure = rawStructure.map(s => {
        let m = Math.floor(s.weight);
        if (["intro", "verse", "chorus", "solo"].includes(s.name) && m > 0) {
            m = Math.ceil(m / 4) * 4; 
        } else if (m > 0) {
            m = Math.ceil(m / 2) * 2;
        }
        return { name: s.name, measures: m };
    }).filter(s => s.measures > 0);

    const structure = buildSongStructure(finalStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    const measureDur = (60 / metalParams.bpm) * 4;

    // PREPARAZIONE PARAMETRI PER IL RHYTHM ENGINE
    // Uniamo i dati dell'immagine con i parametri musicali per non avere undefined
    const combinedParams = {
        ...metalParams,
        imageParams: params.imageParams 
    };

    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        const sectionRoot = info?.root || metalParams.tonalCenter[0] || "E";
        const degrees = info?.progression || ["i"];

        let fullProgression = [];
        while (fullProgression.length < sec.measures) {
            fullProgression = fullProgression.concat(degrees);
        }
        fullProgression = fullProgression.slice(0, sec.measures);

        const realNotes = fullProgression.map(d => degreeToRoot(d, sectionRoot));

        const nextSec = structure.sections[index + 1];
        const nextSectionRoot = nextSec ? (progressions[nextSec.name]?.root || sectionRoot) : sectionRoot;

        Tone.Transport.schedule(() => {
            console.log(`%c ▶ ${sec.name.toUpperCase()} (${sec.measures} measures) | Root: ${sectionRoot} `, "color: #0ff; font-weight: bold;");
        }, sec.startTime);

        // PASSIAMO combinedParams INVECE DI metalParams
        scheduleRhythm(sec, realNotes, metalInstruments, combinedParams, rand, measureDur, nextSectionRoot);
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { if (Tone.context.state !== 'running') Tone.context.resume(); Tone.Transport.start("+0.1"); },
        pause: () => Tone.Transport.pause(),
        stop: () => { Tone.Transport.stop(); Tone.Transport.cancel(); Tone.Transport.seconds = 0; },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: metalInstruments, volumeMap: metalVolumeMap }
    };
}
