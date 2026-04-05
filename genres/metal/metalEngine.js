// metalEngine.js — ver. 005 (STABLE)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 005.2 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    // Il seed 'params.dna' ora guida TUTTO
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    // Struttura dinamica influenzata dal DNA
    const rawStructure = [
        { name: "Intro",     weight: 4 + (rand() * 4) },
        { name: "Verse",     weight: 8 + (rand() * 8) },
        { name: "Pre-Chorus", weight: rand() > 0.5 ? 4 : 0 },
        { name: "Chorus",    weight: 8 + (rand() * 8) },
        { name: "Solo",      weight: rand() > 0.6 ? 8 : 0 },
        { name: "Chorus",    weight: 4 },
        { name: "Outro",     weight: 4 }
    ];

    const finalStructure = rawStructure
        .map(s => ({ ...s, measures: Math.floor(s.weight) }))
        .filter(s => s.measures >= (s.name === "Pre-Chorus" ? 2 : 4));

    const structure = buildSongStructure(finalStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    const measureDur = (60 / metalParams.bpm) * 4;

    console.log(`%c 🤘 STARTING COMPOSITION [DNA: ${params.dna}] `, "background: #222; color: #f0f; font-weight: bold;");

    structure.sections.forEach((sec, index) => {
    const info = progressions[sec.name];
    
    // Troviamo la root della PROSSIMA sezione per la scala di congiunzione
    const nextSecName = structure.sections[index + 1]?.name;
    const nextInfo = nextSecName ? progressions[nextSecName] : null;
    
    const sectionRoot = info?.root || metalParams.tonalCenter[0] || "E";
    const nextSectionRoot = nextInfo?.root || sectionRoot; 

    const degrees = info?.progression || ["i"];
    const realNotes = degrees.map(d => degreeToRoot(d, sectionRoot));

        // LOG DI INIZIO SEZIONE
        Tone.Transport.schedule((time) => {
            console.log(`%c ▶ Entrata Sezione: ${sec.name.toUpperCase()} (${sec.measures} misure) `, "color: #0ff; font-weight: bold;");
        }, sec.startTime);

        // Se la sezione è >= 8, logghiamo la semizezione B a metà
        if (sec.measures >= 8) {
            Tone.Transport.schedule((time) => {
                console.log(`%c ⏩ Semi-sezione B di ${sec.name} `, "color: #0af;");
            }, sec.startTime + (sec.duration / 2));
        }

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
