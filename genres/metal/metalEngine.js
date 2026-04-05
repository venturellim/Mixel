// metalEngine.js — ver. 005 (STABLE)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 005.3 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    // Creazione struttura dinamica
    const rawStructure = [
        { name: "Intro",     weight: 4 + (rand() * 4) },
        { name: "Verse",     weight: 8 + (rand() * 8) },
        { name: "Pre-Chorus", weight: rand() > 0.6 ? 4 : 0 },
        { name: "Chorus",    weight: 8 + (rand() * 4) },
        { name: "Solo",      weight: rand() > 0.7 ? 8 : 0 },
        { name: "Chorus",    weight: 4 },
        { name: "Outro",     weight: 4 }
    ];

    const finalStructure = rawStructure
        .map(s => ({ ...s, measures: Math.floor(s.weight) }))
        .filter(s => s.measures >= (s.name === "Pre-Chorus" ? 2 : 4));

    const structure = buildSongStructure(finalStructure, metalParams.bpm);
    // IMPORTANTE: Passiamo il tonalCenter corretto
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    const measureDur = (60 / metalParams.bpm) * 4;

    console.log(`%c 🤘 COMPOSING: ${metalParams.tonalCenter} ${metalParams.scaleType} [DNA: ${params.dna}] `, "color: #f0f; font-weight: bold;");

    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        
        // Fix Root: Se info.root manca, usiamo il centro tonale della foto
        const sectionRoot = (info && info.root) ? info.root : (metalParams.tonalCenter ? metalParams.tonalCenter[0] : "E");
        
        // Troviamo la root della sezione successiva per la scala di congiunzione
        const nextSec = structure.sections[index + 1];
        const nextInfo = nextSec ? progressions[nextSec.name] : null;
        const nextSectionRoot = (nextInfo && nextInfo.root) ? nextInfo.root : sectionRoot;

        const degrees = (info && info.progression) ? info.progression : ["i"];
        const realNotes = degrees.map(d => degreeToRoot(d, sectionRoot));

        // Log di navigazione
        Tone.Transport.schedule(() => {
            console.log(`%c ▶ ${sec.name.toUpperCase()} (Root: ${sectionRoot}) `, "color: #0ff;");
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
