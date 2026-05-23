// pianoEngine.js — ver. 001 (parallel engine to metal/orchestra)
import * as Tone from "https://esm.sh/tone";
import { buildPianoParams } from "./pianoParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { 
    grandPiano, 
    lhBus, 
    rhBus, 
    pianoInstruments, 
    pianoVolumeMap 
} from "./pianoInstruments.js";
import { schedulePianoRhythm } from "./pianoRhythmEngine.js";
import { schedulePianoLead } from "./pianoLeadEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 001.2 loaded");

export async function waitPianoInstruments() {
    await waitForInstruments(1, "Piano"); // solo piano
}

export function createPianoEngine(params, score) {
console.log(">>> VERSIONE CORRETTA DEL PIANO ENGINE CARICATA <<<");

    const rand = createSeededRandom(params.dna);
    const pianoParams = buildPianoParams(rand);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = pianoParams.bpm;

    // Struttura dinamica (come orchestra)
    const rawStructure = [
        { name: "intro",     weight: 4 },
        { name: "verse",     weight: 8 },
        { name: "prechorus", weight: params.imageParams.energy > 0.3 ? 4 : 0 },
        { name: "chorus",    weight: 8 },
        { name: "solo",      weight: params.imageParams.complexity > 0.5 ? 8 : 0 },
        { name: "bridge",    weight: params.imageParams.texture > 0.4 ? 4 : 0 },
        { name: "chorus",    weight: 6 },
        { name: "outro",     weight: 4 }
    ];

    const finalStructure = rawStructure
        .map(s => ({
            name: s.name,
            measures: Math.max(0, Math.ceil(s.weight / 2) * 2)
        }))
        .filter(s => s.measures > 0);

    const structure = buildSongStructure(finalStructure, pianoParams.bpm);

    const progressions = generateSongProgressions(
        structure,
        params.imageParams,
        pianoParams.tonalCenter,
        rand
    );

    const measureDur = (60 / pianoParams.bpm) * 4;

    const combinedParams = {
        ...pianoParams,
        imageParams: params.imageParams
    };

    structure.sections.forEach((sec, index) => {

        const info = progressions[sec.name];
        const sectionRoot = info?.root || pianoParams.tonalCenter[0] || "A";
        const degrees = info?.progression || ["i"];

        let fullProgression = [];
        while (fullProgression.length < sec.measures) {
            fullProgression = fullProgression.concat(degrees);
        }
        fullProgression = fullProgression.slice(0, sec.measures);

        const realNotes = fullProgression.map(d => degreeToRoot(d, sectionRoot));

        const nextSec = structure.sections[index + 1];
        const nextSectionRoot = nextSec
            ? (progressions[nextSec.name]?.root || sectionRoot)
            : null;

        Tone.Transport.schedule(() => {
            console.log(`%c 🎹 PIANO ${sec.name.toUpperCase()}`, "color: #0088FF; font-weight: bold;");
        }, sec.startTime);

        // Tre motori paralleli come orchestra/metal
        schedulePianoRhythm(
    sec, 
    realNotes, 
    { grandPiano, lhBus, rhBus }, 
    combinedParams, 
    rand, 
    measureDur, 
    nextSectionRoot, 
    score
);

schedulePianoLead(
    sec, 
    realNotes, 
    { grandPiano, lhBus, rhBus }, 
    combinedParams, 
    rand, 
    measureDur, 
    score
);
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
        mixerData: { instruments: pianoInstruments, volumeMap: pianoVolumeMap }
    };
}
