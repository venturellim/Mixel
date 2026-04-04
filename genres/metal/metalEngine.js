// metalEngine.js — ver. 025 (REBOOT)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { instruments, volumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { generateSongProgressions } from "../../utils/musicTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 001.1 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    // --- FIX ERRORE MAP: Protezione Structure ---
    // Se params.structure non è un array valido, creiamo noi una struttura standard
    const safeStructure = (params.structure && Array.isArray(params.structure)) 
        ? params.structure 
        : [
            { name: "intro", measures: 4 },
            { name: "verse", measures: 8 },
            { name: "chorus", measures: 8 },
            { name: "bridge", measures: 4 },
            { name: "chorus", measures: 8 },
            { name: "outro", measures: 4 }
          ];

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = metalParams.bpm;

    // Ora usiamo safeStructure invece di params.structure
    const structure = buildSongStructure(safeStructure, metalParams.bpm);
    
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    
    structure.sections.forEach(sec => {
        const sectionProg = progressions[sec.name];
        // Nota: Assicurati che metalInstruments sia importato correttamente
        scheduleRhythm(sec, sectionProg, metalInstruments, metalParams, rand);
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => Tone.Transport.start("+0.1"),
        pause: () => Tone.Transport.pause(),
        stop: () => { Tone.Transport.stop(); Tone.Transport.seconds = 0; },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: metalInstruments, volumeMap: instrumentVolumeMap }
    };
}

