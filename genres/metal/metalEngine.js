// metalEngine.js — ver. 001 (FINAL REBOOT)
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

console.log("metalEngine.js ver. 001 loaded");

export async function waitMetalInstruments() {
    // Aspettiamo che i campioni siano caricati
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    // Fermiamo tutto prima di riprogrammare
    Tone.Transport.stop();
    Tone.Transport.cancel(); 
    Tone.Transport.bpm.value = metalParams.bpm;

    const safeStructure = (params.structure && Array.isArray(params.structure)) 
        ? params.structure 
        : [{ name: "intro", measures: 4 }, { name: "verse", measures: 8 }];

    const structure = buildSongStructure(safeStructure, metalParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    
    // RESETTIAMO IL TEMPO DI PARTENZA
    let accumulatedTime = 0;

    structure.sections.forEach(sec => {
        const info = progressions[sec.name];
        const degrees = (info && info.progression) ? info.progression : ["i"];
        const sectionRoot = info.root || metalParams.tonalCenter[0] || "A";
        const realNotes = degrees.map(d => degreeToRoot(d, sectionRoot));

        // AGGIORNIAMO IL SEC.STARTTIME PER EVITARE IL SILENZIO
        sec.startTime = accumulatedTime; 
        
        scheduleRhythm(sec, realNotes, metalInstruments, metalParams, rand);
        
        // Sommiamo la durata esatta della sezione per la successiva
        accumulatedTime += sec.duration;
    });

    return {
        totalDuration: structure.totalDuration,
        // RIMOSSO IL START AUTOMATICO: ora aspetta il click dell'utente
        play: () => {
            if (Tone.context.state !== 'running') Tone.context.resume();
            Tone.Transport.start();
        },
        pause: () => Tone.Transport.pause(),
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.seconds = 0; 
        },
        seek: (s) => {
            Tone.Transport.seconds = s;
        },
        mixerData: { instruments: metalInstruments, volumeMap: metalVolumeMap }
    };
}
