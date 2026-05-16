// danceEngine.js — ver. 008 (architettura compatibile con metal/orchestra/piano)
import * as Tone from "https://esm.sh/tone";
import { buildDanceParams } from "./danceParams.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { generateSongProgressions, degreeToRoot } from "../../utils/musicTheory.js";
import { danceInstruments, danceVolumeMap } from "./danceInstruments.js";
import { scheduleDanceRhythm } from "./danceRhythmEngine.js";
import { scheduleDanceLead } from "./danceLeadEngine.js";
import { waitForInstruments } from "../../common.js";
import { scheduleDanceFx } from "./danceFxEngine.js";

console.log("danceEngine.js ver. 008 loaded");

export async function waitDanceInstruments() {
    await waitForInstruments(19, "Dance");
}

// danceEngine.js — usa stile da danceParams
export function createDanceEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    
    //params.global = { intensity: 0.3, mood: 0.5, complexity: 0.4 }; // → Gigi
    // params.global = { intensity: 0.7, mood: 0.5, complexity: 0.8 }; // → Eiffel65
    // params.global = { intensity: 0.7, mood: 0.7, complexity: 0.5 }; // → GabryPonte
    
    console.log("📊 params.global ricevuti:", params.global);
    console.log("📊 params.rhythm ricevuti:", params.rhythm); 
    
    const danceParams = buildDanceParams(rand, params.global, params.rhythm);
    
    // Lo stile è già in danceParams.style!
    const style = danceParams.style;
    
    console.log(`🎬 DANCE ENGINE | Stile: ${style} | BPM: ${danceParams.bpm}`);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = danceParams.bpm;

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

    const structure = buildSongStructure(finalStructure, danceParams.bpm);
    const progressions = generateSongProgressions(structure, params.imageParams, danceParams.tonalCenter, rand);

    // BRIDGE usa progressione del prechorus
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
            console.log("🌉 DANCE BRIDGE usa progressione del PRECHORUS →", preChorusProg.progression);
        }
    }

    // SOLO usa progressione del chorus
    if (soloSection && chorusSection) {
        const chorusProg = progressions["chorus"];
        if (chorusProg) {
            progressions["solo"] = {
                root: chorusProg.root,
                progression: chorusProg.progression
            };
            console.log("🎧 DANCE SOLO usa progressione del CHORUS →", chorusProg.progression);
        }
    }

    const measureDur = (60 / danceParams.bpm) * 4;

    const combinedParams = {
        ...danceParams,
        imageParams: params.imageParams
    };

    structure.sections.forEach((sec, index) => {
        const info = progressions[sec.name];
        const sectionRoot = info?.root || danceParams.tonalCenter[0] || "C";
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
            console.log(`%c ▶ DANCE ${sec.name.toUpperCase()}`, "color: #FF1493; font-weight: bold;");
        }, sec.startTime);

        scheduleDanceRhythm(sec, realNotes, danceInstruments, combinedParams, rand, measureDur, nextSectionRoot, score);
        scheduleDanceLead(sec, realNotes, danceInstruments, combinedParams, rand, measureDur, score);
        scheduleDanceFx(sec, danceInstruments, combinedParams, measureDur, score);
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