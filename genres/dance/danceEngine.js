// danceEngine.js — ver. 002
import * as Tone from "https://esm.sh/tone";
import { buildDanceParams } from "./danceParams.js";
import { danceInstruments, danceVolumeMap } from "./danceInstruments.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { scheduleDanceRhythm } from "./danceRhythmEngine.js";
import { scheduleDanceBass } from "./danceBassEngine.js";
import { scheduleDanceLead } from "./danceLeadEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("danceEngine.js ver. 002 loaded");

export async function waitDanceInstruments() {
    await waitForInstruments(5, "Dance");
}

export function createDanceEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const danceParams = buildDanceParams(rand);
    
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = danceParams.bpm;

    // Struttura
    const rawStructure = [
        { name: "intro", weight: 4 },
        { name: "verse", weight: 8 },
        { name: "prechorus", weight: 4 },
        { name: "chorus", weight: 8 },
        { name: "verse", weight: 8 },
        { name: "chorus", weight: 8 },
        { name: "break", weight: 4 },
        { name: "chorus", weight: 8 },
        { name: "outro", weight: 4 }
    ];

    const finalStructure = rawStructure
        .map(s => ({ name: s.name, measures: Math.max(0, Math.ceil(s.weight / 2) * 2) }))
        .filter(s => s.measures > 0);

    const structure = buildSongStructure(finalStructure, danceParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, danceParams.tonalCenter, rand);
    const measureDur = (60 / danceParams.bpm) * 4;

    const combinedParams = { ...danceParams, imageParams: params.imageParams };

    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        const sectionRoot = info?.root || danceParams.tonalCenter[0] || "C";
        const degrees = info?.progression || ["I"];

        let fullProgression = [];
        while (fullProgression.length < sec.measures) fullProgression = fullProgression.concat(degrees);
        fullProgression = fullProgression.slice(0, sec.measures);
        const realNotes = fullProgression.map(d => degreeToRoot(d, sectionRoot));

        Tone.Transport.schedule(() => {
            console.log(`%c 🎧 DANCE ${sec.name.toUpperCase()}`, "color: #FF00AA; font-weight: bold;");
        }, sec.startTime);

        scheduleDanceRhythm(sec, realNotes, danceInstruments, combinedParams, rand, measureDur, score);
        scheduleDanceBass(sec, realNotes, danceInstruments, combinedParams, rand, measureDur, score);
        scheduleDanceLead(sec, realNotes, danceInstruments, combinedParams, rand, measureDur, score);
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
        mixerData: { instruments: danceInstruments, volumeMap: danceVolumeMap }
    };
}