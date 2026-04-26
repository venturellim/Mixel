// metalEngine.js — ver. 013 (Score Integrated)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { scheduleLead } from "./metalLeadEngine.js"; 
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 014 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

/**
 * @param {Object} params - Parametri estratti dall'immagine
 * @param {Object} score - Istanza della classe score (scorrUI.js)
 */
export function createMetalEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    // 1. 🧬 STRUTTURA INTELLIGENTE (DNA DRIVEN)
    const hasPreChorus = params.imageParams.energy > 0.3; 
    const preChorusWeight = hasPreChorus ? 4 : 0;

    const rawStructure = [
        { name: "intro",     weight: 4 + (rand() * 4) }, 
        { name: "verse",     weight: 8 },
        { name: "prechorus", weight: preChorusWeight },
        { name: "chorus",    weight: 8 },
        { name: "verse",     weight: 4 },
        { name: "chorus",    weight: 4 },
        { name: "solo",      weight: params.imageParams.complexity > 0.6 ? 16 : 0 },
        { name: "bridge", weight: preChorusWeight },
        { name: "chorus",    weight: 8 },
        { name: "outro",     weight: 4 }
    ];

    // 2. QUADRATURA MUSICALE
    const finalStructure = rawStructure.map(s => {
        let m = Math.floor(s.weight);
        if (m > 0) {
            if (["intro", "verse", "chorus", "solo"].includes(s.name)) {
                m = Math.ceil(m / 4) * 4; 
            } else {
                m = Math.ceil(m / 2) * 2;
            }
        }
        return { name: s.name, measures: m };
    }).filter(s => s.measures > 0);

    const structure = buildSongStructure(finalStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    const measureDur = (60 / metalParams.bpm) * 4;

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

        // Visual feedback e aggiornamento Sezione nello spartito
        Tone.Transport.schedule(() => {
            console.log(`%c ▶ ${sec.name.toUpperCase()} | Mood: ${currentDnaMood(params.imageParams)}`, "color: #191970; font-weight: bold;");
        }, sec.startTime);

        // SCHEDULAZIONE MOTORI (Passiamo 'score' come ultimo parametro)
        // Nota: Assicurati di aggiornare anche le firme di queste funzioni nei file lead/rhythm engine
        scheduleRhythm(sec, realNotes, metalInstruments, combinedParams, rand, measureDur, nextSectionRoot, score);
        scheduleLead(sec, realNotes, metalInstruments, combinedParams, rand, measureDur, score); 
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

function currentDnaMood(p) {
    if (p.energy > 0.7) return "AGGRESSIVE";
    if (p.brightness > 0.7) return "EPIC";
    if (p.complexity > 0.7) return "TECHNICAL";
    return "ATMOSPHERIC";
}
