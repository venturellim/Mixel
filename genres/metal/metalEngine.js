// metalEngine.js — ver. 009 (THE BEST OF BOTH WORLDS)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("metalRhythmEngine.js ver. 009 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    // 1. STRUTTURA CON QUADRATURA (Multipli di 4 o 2)
    const rawStructure = [
        { name: "intro",     weight: 4 + (rand() * 4) }, // Sarà 4 o 8
        { name: "verse",     weight: 8 + (rand() * 8) }, // Sarà 8, 12 o 16
        { name: "prechorus", weight: params.imageParams.energy > 0.6 ? 4 : 0 },
        { name: "chorus",    weight: 8 + (rand() * 8) },
        { name: "solo",      weight: params.imageParams.complexity > 0.7 ? 8 : 0 },
        { name: "chorus",    weight: 8 },
        { name: "outro",     weight: 4 }
    ];

    const finalStructure = rawStructure.map(s => {
        let m = Math.floor(s.weight);
        // FORZATURA QUADRATURA: 
        // Intro, Verse, Chorus e Solo devono essere multipli di 4 per non sembrare tagliati
        if (["intro", "verse", "chorus", "solo"].includes(s.name) && m > 0) {
            m = Math.ceil(m / 4) * 4; 
        } else if (m > 0) {
            // Pre-chorus o Outro possono essere multipli di 2
            m = Math.ceil(m / 2) * 2;
        }
        return { name: s.name, measures: m };
    }).filter(s => s.measures > 0);

    const structure = buildSongStructure(finalStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    const measureDur = (60 / metalParams.bpm) * 4;

    console.log(`%c 🤘 ENGINE 009: Squared Structure Generated `, "color: #f0f; font-weight: bold;");

    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        const sectionRoot = info?.root || metalParams.tonalCenter[0] || "E";
        const degrees = info?.progression || ["i"];

        // ADATTAMENTO PROGRESSIONE: 
        // Se abbiamo 4 note ma la sezione è da 8, le ripetiamo. 
        // Se la sezione è da 6 (pre-chorus), ne usiamo 6 coerenti.
        let fullProgression = [];
        while (fullProgression.length < sec.measures) {
            fullProgression = fullProgression.concat(degrees);
        }
        fullProgression = fullProgression.slice(0, sec.measures);

        const realNotes = fullProgression.map(d => degreeToRoot(d, sectionRoot));

        const nextSec = structure.sections[index + 1];
        const nextSectionRoot = nextSec ? (progressions[nextSec.name]?.root || sectionRoot) : sectionRoot;

        Tone.Transport.schedule(() => {
            console.log(`%c ▶ ${sec.name.toUpperCase()} (${sec.measures} measures) | Root: ${sectionRoot} `, "color: #0ff;");
        }, sec.startTime);

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
