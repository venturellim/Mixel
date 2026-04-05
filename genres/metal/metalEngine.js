// metalEngine.js — ver. 008 (THE BEST OF BOTH WORLDS)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("metalRhythmEngine.js ver. 008 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    // 1. STRUTTURA (Logica 004 + DNA)
    const rawStructure = [
        { name: "intro",     weight: 4 + (rand() * 4) },
        { name: "verse",     weight: 8 + (rand() * 8) },
        { name: "prechorus", weight: params.imageParams.energy > 0.6 ? 4 : 0 },
        { name: "chorus",    weight: 8 + (rand() * 8) },
        { name: "solo",      weight: params.imageParams.complexity > 0.7 ? 8 : 0 },
        { name: "chorus",    weight: 4 },
        { name: "outro",     weight: 4 }
    ];

    const finalStructure = rawStructure.map(s => {
        let m = Math.floor(s.weight);
        if (s.name !== "prechorus" && m > 0 && m < 4) m = 4;
        if (s.name === "prechorus" && m > 0 && m < 2) m = 2;
        return { name: s.name, measures: m };
    }).filter(s => s.measures > 0);

    const structure = buildSongStructure(finalStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    const measureDur = (60 / metalParams.bpm) * 4;

    console.log(`%c 🤘 METAL ENGINE 008 [DNA: ${params.dna}] `, "color: #f0f; font-weight: bold;");

    // 2. SCHEDULING (Logica 004 + Transizioni 007)
    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        
        // RECUPERO NOTE (Metodo 004 - quello che funziona!)
        const sectionRoot = info?.root || metalParams.tonalCenter[0] || "E";
        const degrees = info?.progression || ["i"];
        const realNotes = degrees.map(d => degreeToRoot(d, sectionRoot));

        // IDENTIFICAZIONE PROSSIMA NOTA (Per la transizione nel RhythmEngine)
        const nextSec = structure.sections[index + 1];
        const nextInfo = nextSec ? progressions[nextSec.name] : null;
        const nextSectionRoot = nextInfo?.root || sectionRoot;

        // LOGGING (Il tuo piacere)
        Tone.Transport.schedule(() => {
            console.log(`%c ▶ Inizio: ${sec.name.toUpperCase()} [Root: ${sectionRoot}] `, "color: #0ff; font-weight: bold;");
        }, sec.startTime);

        if (sec.measures >= 8) {
            Tone.Transport.schedule(() => {
                console.log(`%c ⏩ Semi-sezione B di ${sec.name} `, "color: #0af;");
            }, sec.startTime + (sec.duration / 2));
        }

        // Passiamo tutto al RhythmEngine ver 007.2
        scheduleRhythm(sec, realNotes, metalInstruments, metalParams, rand, measureDur, nextSectionRoot);
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
