// orchestraEngine.js — ver. 001 (parallel engine to metalEngine)
import * as Tone from "https://esm.sh/tone";
import { buildOrchestraParams } from "./orchestraParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { scheduleOrchestraRhythm } from "./orchestraRhythmEngine.js";
import { scheduleOrchestraLead } from "./orchestraLeadEngine.js";

console.log("orchestraEngine.js ver. 001.1 loaded");

export function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const orchParams = buildOrchestraParams(rand);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = orchParams.bpm;

    const hasPreChorus = params.imageParams.energy > 0.3;
    const preChorusWeight = hasPreChorus ? 4 : 0;
    const hasBridge = params.imageParams.complexity > 0.4;

    const rawStructure = [
        { name: "intro",     weight: 4 + (rand() * 4) },
        { name: "verse",     weight: 8 },
        { name: "prechorus", weight: preChorusWeight },
        { name: "chorus",    weight: 8 },
        { name: "verse",     weight: 4 },
        { name: "chorus",    weight: 4 },
        { name: "soloPt1",   weight: params.imageParams.complexity > 0.6 ? 8 : 0 },
        { name: "soloPt2",   weight: params.imageParams.complexity > 0.6 ? 8 : 0 },
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

    const structure = buildSongStructure(finalStructure, orchParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, orchParams.tonalCenter, rand);

    // BRIDGE usa progressione del PRECHORUS
    const preChorusSection = structure.sections.find(s => s.name === "prechorus");
    const bridgeSection = structure.sections.find(s => s.name === "bridge");
    const chorusSection = structure.sections.find(s => s.name === "chorus");
    const soloPt1Section = structure.sections.find(s => s.name === "soloPt1");
    const soloPt2Section = structure.sections.find(s => s.name === "soloPt2");

    if (bridgeSection && preChorusSection) {
        const preChorusProg = progressions["prechorus"];
        if (preChorusProg) {
            progressions["bridge"] = {
                root: preChorusProg.root,
                progression: preChorusProg.progression
            };
            console.log("🌉 ORCHESTRA BRIDGE usa progressione del PRECHORUS →", preChorusProg.progression);
        }
    }

    // SOLO Pt1/Pt2 usa progressione del CHORUS
    if (soloPt1Section && chorusSection) {
        const chorusProg = progressions["chorus"];
        if (chorusProg) {
            progressions["soloPt1"] = {
                root: chorusProg.root,
                progression: chorusProg.progression
            };
            progressions["soloPt2"] = {
                root: chorusProg.root,
                progression: chorusProg.progression
            };
            console.log("🎻 ORCHESTRA SOLO Pt1/Pt2 usa progressione del CHORUS →", chorusProg.progression);
        }
    }

    const measureDur = (60 / orchParams.bpm) * 4;

    const combinedParams = {
        ...orchParams,
        imageParams: params.imageParams
    };

    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        const sectionRoot = info?.root || orchParams.tonalCenter[0] || "A";
        const degrees = info?.progression || ["i"];

        let fullProgression = [];
        while (fullProgression.length < sec.measures) {
            fullProgression = fullProgression.concat(degrees);
        }
        fullProgression = fullProgression.slice(0, sec.measures);

        const realNotes = fullProgression.map(d => degreeToRoot(d, sectionRoot));

        const nextSec = structure.sections[index + 1];
        const nextSectionRoot = nextSec ? (progressions[nextSec.name]?.root || sectionRoot) : sectionRoot;

        Tone.Transport.schedule(() => {
            console.log(`%c ▶ ORCHESTRA ${sec.name.toUpperCase()}`, "color: #4B0082; font-weight: bold;");
        }, sec.startTime);

        scheduleOrchestraRhythm(sec, realNotes, orchestraInstruments, combinedParams, rand, measureDur, nextSectionRoot, score);
        scheduleOrchestraLead(sec, realNotes, orchestraInstruments, combinedParams, rand, measureDur, score);
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
        mixerData: { instruments: orchestraInstruments, volumeMap: orchestraVolumeMap }
    };
}
