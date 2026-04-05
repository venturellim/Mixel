// metalEngine.js — ver. 004 (STABLE)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 004 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    // --- LOGICA DELLE SEZIONI VARIABILI (TUE REGOLE) ---
    // Definiamo i pesi basati su energia e complessità della foto
    const rawStructure = [
        { name: "intro",     weight: 4 + (params.imageParams.complexity * 4) },
        { name: "verse",     weight: 8 + (params.imageParams.energy * 8) },
        { name: "prechorus", weight: params.imageParams.energy > 0.6 ? 4 : 0 },
        { name: "chorus",    weight: 8 + (params.imageParams.energy * 4) },
        { name: "solo",      weight: params.imageParams.complexity > 0.7 ? 8 : 0 },
        { name: "chorus",    weight: 4 }, // Chorus finale dimezzato
        { name: "outro",     weight: 4 }
    ];

    const finalStructure = rawStructure.map(s => {
        let m = Math.floor(s.weight);
        // Regola: minimo 4 misure per esistere (tranne pre-chorus che può essere 2)
        if (s.name !== "prechorus" && m > 0 && m < 4) m = 4;
        if (s.name === "prechorus" && m > 0 && m < 2) m = 2;
        return { name: s.name, measures: m };
    }).filter(s => s.measures > 0);

    const structure = buildSongStructure(finalStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    const measureDur = (60 / metalParams.bpm) * 4;

    structure.sections.forEach(sec => {
        const info = progressions[sec.name];
        const degrees = (info && info.progression) ? info.progression : ["i"];
        const sectionRoot = info.root || metalParams.tonalCenter[0] || "A";
        const realNotes = degrees.map(d => degreeToRoot(d, sectionRoot));

        scheduleRhythm(sec, realNotes, metalInstruments, metalParams, rand, measureDur);
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { 
            if (Tone.context.state !== 'running') Tone.context.resume(); 
            Tone.Transport.start("+0.1"); 
        },
        pause: () => Tone.Transport.pause(),
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.cancel(); 
            Tone.Transport.seconds = 0; 
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: metalInstruments, volumeMap: metalVolumeMap }
    };
}
