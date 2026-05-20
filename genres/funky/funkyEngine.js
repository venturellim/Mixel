// funkyEngine.js — ver. 001
import * as Tone from "https://esm.sh/tone";
import { buildFunkyParams } from "./funkyParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { funkyInstruments, funkyVolumeMap } from "./funkyInstruments.js";
import { scheduleFunkyRhythm } from "./funkyRhythmEngine.js";
import { scheduleFunkyLead } from "./funkyLeadEngine.js";
import { waitForInstruments } from "../../common.js";

console.log("funkyEngine.js ver. 001 loaded");

export async function waitFunkyInstruments() {
    const total = Object.keys(funkyInstruments).length;
    await waitForInstruments(total, "Funky");
}

export function createFunkyEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const funkyParams = buildFunkyParams(rand, params.global, params.rhythm);
    const style = funkyParams.style;
    
    console.log(`🎸 FUNKY ENGINE | Stile: ${style} | BPM: ${funkyParams.bpm}`);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = funkyParams.bpm;

    const hasPreChorus = params.imageParams.energy > 0.3;
    const preChorusWeight = hasPreChorus ? 4 : 0;
    const hasBridge = params.imageParams.complexity > 0.4;
    const hasSolo = params.imageParams.complexity > 0.6;

    const rawStructure = [
        { name: "intro",     weight: 4 + (rand() * 4) },
        { name: "verse",     weight: 8 },
        { name: "prechorus", weight: preChorusWeight },
        { name: "chorus",    weight: 8 },
        { name: "verse",     weight: 4 },
        { name: "chorus",    weight: 4 },
        { name: "solo",      weight: hasSolo ? 8 : 0 },
        { name: "bridge",    weight: hasBridge ? preChorusWeight : 0 },
        { name: "chorus",    weight: 8 },
        { name: "outro",     weight: 4 }
    ];

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

    const structure = buildSongStructure(finalStructure, funkyParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, funkyParams.tonalCenter, rand);

    const preChorusSection = structure.sections.find(s => s.name === "prechorus");
    const bridgeSection = structure.sections.find(s => s.name === "bridge");
    const chorusSection = structure.sections.find(s => s.name === "chorus");
    const soloSection = structure.sections.find(s => s.name === "solo");

    if (bridgeSection && preChorusSection) {
        const preChorusProg = progressions["prechorus"];
        if (preChorusProg) {
            progressions["bridge"] = {
                root: preChorusProg.root,
                progression: preChorusProg.progression
            };
        }
    }

    if (soloSection && chorusSection) {
        const chorusProg = progressions["chorus"];
        if (chorusProg) {
            progressions["solo"] = {
                root: chorusProg.root,
                progression: chorusProg.progression
            };
        }
    }

    const measureDur = (60 / funkyParams.bpm) * 4;

    const combinedParams = {
        ...funkyParams,
        imageParams: params.imageParams
    };

    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        const sectionRoot = info?.root || funkyParams.tonalCenter[0] || "C";
        const degrees = info?.progression || ["I"];

        let fullProgression = [];
        while (fullProgression.length < sec.measures) {
            fullProgression = fullProgression.concat(degrees);
        }
        fullProgression = fullProgression.slice(0, sec.measures);

        const realNotes = fullProgression.map(d => degreeToRoot(d, sectionRoot));

        const nextSec = structure.sections[index + 1];
        const nextSectionRoot = nextSec ? (progressions[nextSec.name]?.root || sectionRoot) : sectionRoot;

        Tone.Transport.schedule(() => {
            console.log(`%c ▶ FUNKY ${sec.name.toUpperCase()} | ${style}`, "color: #FF8C00; font-weight: bold;");
        }, sec.startTime);

        scheduleFunkyRhythm(sec, realNotes, funkyInstruments, combinedParams, rand, measureDur, nextSectionRoot, score);
        scheduleFunkyLead(sec, realNotes, funkyInstruments, combinedParams, rand, measureDur, score);
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
        mixerData: { instruments: funkyInstruments, volumeMap: funkyVolumeMap }
    };
}