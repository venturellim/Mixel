// metal.js — versione con timeline unificata

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums,
    masterEQ,
    createSeededRandom
} from "./common.js";

import { analyzeImage } from "./imageAnalysis.js";
import { photoToMusicParams } from "./photoToMusicParams.js";
import { generateMetalRiff } from "./metalRiff.js";
import { createBassEngine } from "./metalBass.js";
import { createLeadEngine } from "./metalLead.js";
import { createDrumEngine } from "./metalDrums.js";
import { detectMetalStyle } from "./metalTheory.js";
import { createMetalTimeline } from "./metalTimeline.js";


// ======================================================
// ENTRY POINT
// ======================================================

export async function createMetalEngineFromImage(previewImage) {

    const analysis = await analyzeImage(previewImage);
    console.log("ANALYSIS:", analysis);

    const params = photoToMusicParams(analysis);
    console.log("MUSIC PARAMS:", params);

    const style = detectMetalStyle(analysis.brightness, analysis.entropy);
    analysis.style = style;

    const dna = Math.floor(analysis.brightness * 1000000);
    const rand = createSeededRandom(dna);

    const engine = await createMetalSongFromAnalysis(analysis, params, rand);

    return engine;
}


// ======================================================
// ENGINE PRINCIPALE
// ======================================================

export async function createMetalSongFromAnalysis(analysis, params, rand) {

    await Tone.loaded();

    Tone.Transport.bpm.value = params.bpm;

    // 🎛️ NUOVA TIMELINE CENTRALE
    const timeline = createMetalTimeline(params);

    const beatsPerMeasure = timeline.beatsPerMeasure;
    const totalMeasures = timeline.totalMeasures;

    const totalDuration =
        (totalMeasures * beatsPerMeasure) * (60 / params.bpm);

    // --------------------------------------------------
    // Generazione moduli musicali
    // --------------------------------------------------

const riff = generateMetalRiff(analysis, params, timeline, rand);
const riffEngine = riff.engine;
const riffData = riff.data;

const bassEngine = createBassEngine(
    analysis,
    params,
    timeline,
    riffData,
    rand
);

const leadEngine = createLeadEngine(
    analysis,
    params,
    timeline,
    riffData,
    rand
);

const drumEngine = createDrumEngine(
    analysis,
    params,
    timeline,
    riffData,
    rand
);

    // --------------------------------------------------
    // LOOP ENGINE
    // --------------------------------------------------

    let riffStep = 0;
    let bassStep = 0;
    let leadStep = 0;
    let drumStep = 0;

    const riffLoop = new Tone.Loop((time) => {
        riffEngine(time, riffStep++);
    }, "8n");

    const bassLoop = new Tone.Loop((time) => {
        bassEngine(time, bassStep++);
    }, "8n");

    const leadLoop = new Tone.Loop((time) => {
        leadEngine(time, leadStep++);
    }, "8n");

    const drumLoop = new Tone.Loop((time) => {
        drumEngine(time, drumStep++);
    }, "16n");


    // --------------------------------------------------
    // CONTROLLI PLAYER
    // --------------------------------------------------

    function play() {

        riffLoop.start(0);
        bassLoop.start(0);
        leadLoop.start(0);
        drumLoop.start(0);

        if (Tone.Transport.state !== "started") {
            Tone.Transport.start();
        }
    }

    function pause() {
        if (Tone.Transport.state === "started") {
            Tone.Transport.pause();
        }
    }

    function stop() {

        riffLoop.stop();
        bassLoop.stop();
        leadLoop.stop();
        drumLoop.stop();

        Tone.Transport.stop();
        Tone.Transport.position = 0;
    }

    function seek(seconds) {
        Tone.Transport.seconds = seconds;
    }

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration
    };
}