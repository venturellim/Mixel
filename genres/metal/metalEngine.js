// metalEngine.js — ver. 025 (REBOOT)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { instruments, volumeMap } from "./metalInstruments.js";
import { scheduleRhythm } from "./metalRhythmEngine.js";
import { generateSongProgressions } from "../../utils/musicTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 001 loaded");

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function createMetalEngine(params) {
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = metalParams.bpm;

    const structure = buildSongStructure(params.structure, metalParams.bpm);
    // Usiamo le tue progressioni (es. ["i", "VI", "III", "VII"])
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    
    structure.sections.forEach(sec => {
        const sectionProg = progressions[sec.name]; // Un array di gradi
        // Chiamiamo il nuovo motore unico
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
