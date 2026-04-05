// metalEngine.js — ver. 002 (STABLE)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalInstrumentMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 002 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    // 1. RESET TOTALE
    Tone.Transport.stop();
    Tone.Transport.cancel(0); // Pulisce tutto dalla posizione 0
    Tone.Transport.bpm.value = metalParams.bpm;

    const safeStructure = (params.structure && Array.isArray(params.structure)) 
        ? params.structure 
        : [{ name: "intro", measures: 4 }, { name: "verse", measures: 8 }, { name: "chorus", measures: 8 }];

    const structure = buildSongStructure(safeStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    
    // 2. SCHEDULING POSIZIONALE (usiamo i Beats per evitare gap)
    let currentBeat = 0;

    structure.sections.forEach(sec => {
        const info = progressions[sec.name];
        const degrees = (info && info.progression) ? info.progression : ["i"];
        const sectionRoot = info.root || metalParams.tonalCenter[0] || "A";
        const realNotes = degrees.map(d => degreeToRoot(d, sectionRoot));

        // Passiamo currentBeat al motore ritmico
        scheduleRhythm(sec, realNotes, metalInstruments, metalParams, rand, currentBeat);
        
        // Avanziamo esattamente del numero di battute * 4 quarti
        currentBeat += (sec.measures * 4);
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => {
            if (Tone.context.state !== 'running') Tone.context.resume();
            Tone.Transport.start(); // Parte solo al click
        },
        pause: () => Tone.Transport.pause(),
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.seconds = 0; 
        },
        seek: (s) => {
            Tone.Transport.seconds = s; // Ora la seekbar sposta la testina correttamente
        },
        mixerData: { 
            instruments: metalInstruments, 
            volumeMap: metalInstrumentMap 
        }
    };
}
