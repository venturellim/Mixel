// metalEngine.js — ver. 026 (FINAL REBOOT)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";

// Importiamo dal nuovo file rinominato e spostato nelle utils
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";

// Importiamo gli strumenti dal tuo nuovo file metalInstruments.js
import { metalInstruments, metalVolumeMap } from "./metalInstruments.js";

// Il motore ritmico Stratovarius
import { scheduleRhythm } from "./metalRhythmEngine.js";

import { waitForInstruments } from "../../common.js";

export async function waitMetalInstruments() {
    // Aspettiamo che i campioni siano caricati
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    // 1. Protezione Structure (Fix errore .map)
    const safeStructure = (params.structure && Array.isArray(params.structure)) 
        ? params.structure 
        : [
            { name: "intro", measures: 4 },
            { name: "verse", measures: 8 },
            { name: "chorus", measures: 8 },
            { name: "outro", measures: 4 }
          ];

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = metalParams.bpm;

    // 2. Generazione Struttura e Progressioni
    const structure = buildSongStructure(safeStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    
    // 3. Scheduling delle sezioni
    structure.sections.forEach(sec => {
        const info = progressions[sec.name];
        
        // Estraiamo i gradi (es. ["i", "VI", "VII"])
        const degrees = (info && info.progression) ? info.progression : ["i"];
        
        // Estraiamo la tonica della sezione (es. "A")
        const sectionRoot = info.root || metalParams.tonalCenter[0] || "A";

        // Convertiamo i gradi in note reali (es. "i" -> "A", "VI" -> "F")
        // così il RhythmEngine riceve note vere da normalizzare
        const realNotes = degrees.map(d => degreeToRoot(d, sectionRoot));

        // Passiamo tutto al motore ritmico
        scheduleRhythm(sec, realNotes, metalInstruments, metalParams, rand);
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => Tone.Transport.start("+0.1"),
        pause: () => Tone.Transport.pause(),
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.seconds = 0; 
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { 
            instruments: metalInstruments, 
            volumeMap: metalVolumeMap 
        }
    };
}
