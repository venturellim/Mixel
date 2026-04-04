// metalEngine.js — ver. 024 (TOTAL SYNC)
import * as Tone from "https://esm.sh/tone";
import { buildPowerMetalParams } from "./powerMetalParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { metalInstruments, instrumentVolumeMap } from "./instruments.js";
import { initRiffEngine } from "./riffEngine.js";
import { initDrumEngine } from "./drumEngine.js";
import { generateSongProgressions } from "./metalTheory.js";
import { waitForInstruments } from "../../common.js";

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
    const progressions = generateSongProgressions(structure, params.imageParams, metalParams.tonalCenter, rand);
    
    const riffEngine = initRiffEngine(metalInstruments, metalParams, rand);
    const drumEngine = initDrumEngine(metalInstruments, metalParams, rand);

    structure.sections.forEach(sec => {
        const sectionProg = progressions[sec.name];
        
        // --- LA CHIAVE DELLA SINCRONIZZAZIONE ---
        // 1. Generiamo prima i dati del Riff
        const riffData = riffEngine.generateRiff(sec, null, sectionProg);

        // 2. Scheduliamo la chitarra
        riffEngine.scheduleRiff(sec, riffData.events);

        // 3. Passiamo gli stessi eventi alla batteria (e in futuro al basso)
        drumEngine.scheduleSection(sec, riffData.events);
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
