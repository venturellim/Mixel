// metalEngine.js — ver. 003 (STABLE)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 003 loaded");


export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    // Reset rigoroso come nel piano
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    const safeStructure = (params.structure && Array.isArray(params.structure)) 
        ? params.structure 
        : [{ name: "intro", measures: 4 }, { name: "verse", measures: 8 }, { name: "chorus", measures: 8 }];

    const structure = buildSongStructure(safeStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    
    // Durata di una misura (4 quarti) in secondi
    const measureDur = (60 / metalParams.bpm) * 4;

    structure.sections.forEach(sec => {
        const info = progressions[sec.name];
        const degrees = (info && info.progression) ? info.progression : ["i"];
        const sectionRoot = info.root || metalParams.tonalCenter[0] || "A";
        const realNotes = degrees.map(d => degreeToRoot(d, sectionRoot));

        // Passiamo i parametri per lo scheduling interno
        scheduleRhythm(sec, realNotes, metalInstruments, metalParams, rand, measureDur);
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => {
            if (Tone.context.state !== 'running') Tone.context.resume();
            // Start ritardato di 0.1 per stabilità
            Tone.Transport.start("+0.1");
        },
        pause: () => Tone.Transport.pause(),
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.cancel(); // Pulisce lo schedule
            Tone.Transport.seconds = 0; 
        },
        seek: (s) => {
            Tone.Transport.seconds = s;
        },
        mixerData: { 
            instruments: metalInstruments, 
            volumeMap: metalVolumeMap 
        }
    };
}
