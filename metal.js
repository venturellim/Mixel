// metal.js — versione moderna, modulare, compatibile con Tone.js 15

import * as Tone from "https://esm.sh/tone";

import {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums,
    masterEQ,
    createSeededRandom,
    leadChorus,
    leadDelay,
    leadReverb,
    guitarRiffReverb
} from "./common.js";

import { analyzeImage } from "./imageAnalysis.js";
import { photoToMusicParams } from "./photoToMusicParams.js";
import { generateMetalRiff } from "./metalRiff.js";
import { createBassEngine } from "./metalBass.js";
import { createLeadEngine } from "./metalLead.js";
import { createDrumEngine } from "./metalDrums.js";
import { detectMetalStyle } from "./metalTheory.js";


// ======================================================
// AUTOMAZIONI MIX
// ======================================================

function applyMixAutomation(section) {

    // Lead
    if (section === "intro")  guitarLead.volume.value = +2;
    if (section === "verse")  guitarLead.volume.value = +4;
    if (section === "chorus") guitarLead.volume.value = +6;
    if (section === "solo")   guitarLead.volume.value = +8;
    if (section === "outro")  guitarLead.volume.value = +2;

    // Riff (open + palm)
    if (section === "intro")  { guitarOpen.volume.value = -5; guitarPalm.volume.value = -6; }
    if (section === "verse")  { guitarOpen.volume.value = -4; guitarPalm.volume.value = -5; }
    if (section === "chorus") { guitarOpen.volume.value = -3; guitarPalm.volume.value = -4; }
    if (section === "solo")   { guitarOpen.volume.value = -6; guitarPalm.volume.value = -7; }
    if (section === "outro")  { guitarOpen.volume.value = -5; guitarPalm.volume.value = -6; }

    // Batteria
    if (section === "intro")  drums.volume.value = -12;
    if (section === "verse")  drums.volume.value = -10;
    if (section === "chorus") drums.volume.value = -9;
    if (section === "solo")   drums.volume.value = -9;
    if (section === "outro")  drums.volume.value = -12;

    // Basso
    if (section === "intro")  bass.volume.value = -5;
    if (section === "verse")  bass.volume.value = -4;
    if (section === "chorus") bass.volume.value = -3;
    if (section === "solo")   bass.volume.value = -4;
    if (section === "outro")  bass.volume.value = -5;
}


// ======================================================
// AUTOMAZIONI FX (corrette)
// ======================================================

function applyFXAutomation(section) {

    // LEAD FX - CORRETTO
    if (section === "intro") {
        leadChorus.set({ depth: 0.35 });                    // invece di leadChorus.depth = 0.35
        leadChorus.frequency.value = 3;                      // .value è ok per frequency
        leadDelay.set({ wet: 0.15 });                        // invece di leadDelay.wet = 0.15
        leadReverb.set({ wet: 0.35 });                       // invece di leadReverb.wet = 0.35
    }

    if (section === "verse") {
        leadChorus.set({ depth: 0.20 });
        leadChorus.frequency.value = 4;
        leadDelay.set({ wet: 0.10 });
        leadReverb.set({ wet: 0.20 });
    }

    if (section === "chorus") {
        leadChorus.set({ depth: 0.30 });
        leadChorus.frequency.value = 5;
        leadDelay.set({ wet: 0.25 });
        leadReverb.set({ wet: 0.25 });
    }

    if (section === "solo") {
        leadChorus.set({ depth: 0.40 });
        leadChorus.frequency.value = 4;
        leadDelay.set({ wet: 0.35 });
        leadReverb.set({ wet: 0.30 });
    }

    if (section === "outro") {
        leadChorus.set({ depth: 0.35 });
        leadChorus.frequency.value = 3;
        leadDelay.set({ wet: 0.15 });
        leadReverb.set({ wet: 0.35 });
    }

    // RITMICA - CORRETTO
    if (section === "intro")  guitarRiffReverb.set({ wet: 0.30 });
    if (section === "verse")  guitarRiffReverb.set({ wet: 0.20 });
    if (section === "chorus") guitarRiffReverb.set({ wet: 0.25 });
    if (section === "solo")   guitarRiffReverb.set({ wet: 0.15 });
    if (section === "outro")  guitarRiffReverb.set({ wet: 0.30 });

    // BATTERIA - usa .value (che esiste)
    if (section === "intro") {
        drums.player("crash1").volume.value = -6;
        drums.player("ride").volume.value = -6;
    }

    if (section === "verse") {
        drums.player("crash1").volume.value = -4;
        drums.player("ride").volume.value = -4;
    }

    if (section === "chorus") {
        drums.player("crash1").volume.value = -2;
        drums.player("ride").volume.value = -2;
    }

    if (section === "solo") {
        drums.player("crash1").volume.value = -3;
        drums.player("ride").volume.value = -3;
    }

    if (section === "outro") {
        drums.player("crash1").volume.value = -6;
        drums.player("ride").volume.value = -6;
    }
}



// ======================================================
// ENTRY POINT
// ======================================================

export async function createMetalEngineFromImage(previewImage) {

    const analysis = await analyzeImage(previewImage);
    const params = photoToMusicParams(analysis);

    const style = detectMetalStyle(analysis.brightness, analysis.entropy);
    analysis.style = style;

    const dna = Math.floor(analysis.brightness * 1000000);
    const rand = createSeededRandom(dna);

    const engine = await createMetalSongFromAnalysis(analysis, params, rand);
    return engine;
}



// ======================================================
// LOADER STRUMENTI
// ======================================================

export async function waitInstrumentsWithProgress() {

    const overlay = document.getElementById("loadingOverlay");
    const bar = document.getElementById("loadingBar");
    const text = document.getElementById("loadingText");

    overlay.style.display = "flex";

    const total = 4;

    while (window.__samplerLoadedCount < total) {
        const percent = Math.floor((window.__samplerLoadedCount / total) * 100);
        bar.style.width = percent + "%";
        text.innerText = "Caricamento strumenti… " + percent + "%";
        await new Promise(res => setTimeout(res, 100));
    }

    overlay.style.display = "none";
}



// ======================================================
// ENGINE COMPLETO
// ======================================================

export async function createMetalSongFromAnalysis(analysis, params, rand) {

    await Tone.loaded();

    Tone.Transport.bpm.value = params.bpm;

    const totalMeasures =
        params.measures.intro +
        params.measures.verse +
        params.measures.chorus +
        params.measures.solo +
        params.measures.outro;

    const beatsPerMeasure = (params.timeSignature === "6/8") ? 6 : 4;

    const totalDuration = (totalMeasures * beatsPerMeasure) * (60 / params.bpm);

    // ENGINE MODULARI
    const riff = generateMetalRiff(analysis, params, rand);
    const riffEngine = riff.engine;
    const riffData = riff.data;

    const bassEngine = createBassEngine(analysis, params, riffData, rand);
    const leadEngine = createLeadEngine(analysis, params, riffData, rand);
    const drumEngine = createDrumEngine(analysis, params, riffData, rand);

    // LOOP
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

    // AUTOMAZIONI QUI
    const drumLoop = new Tone.Loop((time) => {

        const section = riffData.sectionTimeline[drumStep % riffData.totalSteps];

        applyMixAutomation(section);
        applyFXAutomation(section);

        drumEngine(time, drumStep++);

    }, "16n");

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
