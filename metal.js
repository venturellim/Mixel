// metal.js

console.log("METAL.JS CARICATO");

//import * as Tone from "https://cdn.jsdelivr.net/npm/tone@14.7.77/build/Tone.js";

import {
    guitarPalm,
    guitarOpen,
    guitarLead,
    bass,
    drums,
    masterEQ,
    createSeededRandom,
    analyzeImageBrightness
} from "./common.js";

import { analyzeImage } from "./analyzeImage.js";
import { chooseKey, chooseScale } from "./musicTheory.js";
import { detectMetalStyle, computeBPM } from "./metalTheory.js";
import { generateMetalRiff } from "./metalRiff.js";
import { generateMetalLead } from "./metalLead.js";
import { createDrumEngine } from "./metalDrums.js";
import { createLeadEngine } from "./leadEngine.js";


// ======================================================
// 1) WRAPPER USATO DAL MAIN.JS
// ======================================================

export async function createMetalEngineFromImage(previewImage) {

    const brightness = await analyzeImageBrightness(previewImage);

    const dna = Math.floor(brightness * 1000000);

    const engine = await createMetalSongFromImage({
        dna: dna,
        brightness: brightness,
        img: previewImage
    });

    return engine;
}



// ======================================================
// 2) LOADER CON BARRA DI PROGRESSO
// ======================================================

export async function waitInstrumentsWithProgress() {

    const overlay = document.getElementById("loadingOverlay");
    const bar = document.getElementById("loadingBar");
    const text = document.getElementById("loadingText");

    if (!overlay || !bar || !text) {
        console.warn("Loader non trovato nel DOM");
        return;
    }

    overlay.style.display = "flex";

    const instruments = [
        guitarPalm.loaded,
        guitarOpen.loaded,
        guitarLead.loaded,
        drums.loaded,
        bass.loaded
    ];

    let loaded = 0;
    const total = instruments.length;

    for (const inst of instruments) {
        await inst;
        loaded++;
        const percent = Math.floor((loaded / total) * 100);
        bar.style.width = percent + "%";
        text.innerText = "Caricamento strumenti… " + percent + "%";
    }

    overlay.style.display = "none";
}



// ======================================================
// 3) FUNZIONI DI SUPPORTO
// ======================================================

function transposeKey(key, semitones) {
    const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const index = notes.indexOf(key);
    const newIndex = (index + semitones + 12) % 12;
    return notes[newIndex];
}



// ======================================================
// 4) GENERATORE DEL BRANO COMPLETO
// ======================================================

export async function createMetalSongFromImage(obj) {

    const dna = obj.dna;
    const brightness = obj.brightness;
    const img = obj.img;

    await Tone.loaded();

    const rand = createSeededRandom(dna);

    const baseParams = analyzeImage(img);

    const style = detectMetalStyle(baseParams.brightness, baseParams.dna);

    const totalDuration = 180 + (dna % 60) + (brightness * 30);

    const bpm = computeBPM(brightness, dna);
    Tone.Transport.bpm.value = bpm;

    const introDur = totalDuration * 0.10;
    const verseDur = totalDuration * 0.20;
    const chorusDur = totalDuration * 0.20;
    const bridgeDur = totalDuration * 0.25;
    const finalChorusDur = totalDuration * 0.20;
    const outroDur = totalDuration * 0.05;

    const keyIntro = chooseKey(dna);
    const keyVerse = transposeKey(keyIntro, -2);
    const keyChorus = transposeKey(keyVerse, 5);
    const keyBridge = transposeKey(keyChorus, 7);
    const keyFinalChorus = transposeKey(keyBridge, -5);
    const keyOutro = transposeKey(keyFinalChorus, -2);

    const scaleIntro = chooseScale(dna, keyIntro);
    const scaleVerse = chooseScale(dna + 1, keyVerse);
    const scaleChorus = chooseScale(dna + 2, keyChorus);
    const scaleBridge = chooseScale(dna + 3, keyBridge);
    const scaleFinalChorus = chooseScale(dna + 4, keyFinalChorus);
    const scaleOutro = chooseScale(dna + 5, keyOutro);

    const riffIntro = generateMetalRiff(dna, scaleIntro, style, rand);
    const riffVerse = generateMetalRiff(dna + 1, scaleVerse, style, rand);
    const riffChorus = generateMetalRiff(dna + 2, scaleChorus, style, rand);
    const riffBridge = generateMetalRiff(dna + 3, scaleBridge, style, rand);
    const riffFinalChorus = generateMetalRiff(dna + 4, scaleFinalChorus, style, rand);
    const riffOutro = generateMetalRiff(dna + 5, scaleOutro, style, rand);

    const leadIntro = generateMetalLead(dna, scaleIntro, style, rand);
    const leadVerse = generateMetalLead(dna + 1, scaleVerse, style, rand);
    const leadChorus = generateMetalLead(dna + 2, scaleChorus, style, rand);
    const leadBridge = generateMetalLead(dna + 3, scaleBridge, style, rand);
    const leadFinalChorus = generateMetalLead(dna + 4, scaleFinalChorus, style, rand);
    const leadOutro = generateMetalLead(dna + 5, scaleOutro, style, rand);

    function cloneParams(obj) {
        return {
            brightness: obj.brightness,
            dna: obj.dna,
            energy: obj.energy,
            texture: obj.texture,
            complexity: obj.complexity,
            direction: obj.direction
        };
    }

    const introParams = cloneParams(baseParams);
    introParams.brightness = introParams.brightness * 1.0;
    introParams.dna = introParams.dna + 0;
    const drumsIntro = createDrumEngine(style, introParams);

    const verseParams = cloneParams(baseParams);
    verseParams.brightness = verseParams.brightness * 0.7;
    verseParams.dna = verseParams.dna + 1;
    const drumsVerse = createDrumEngine(style, verseParams);

    const chorusParams = cloneParams(baseParams);
    chorusParams.brightness = chorusParams.brightness * 1.2;
    chorusParams.dna = chorusParams.dna + 2;
    const drumsChorus = createDrumEngine(style, chorusParams);

    const bridgeParams = cloneParams(baseParams);
    bridgeParams.brightness = bridgeParams.brightness * 1.0;
    bridgeParams.dna = bridgeParams.dna + 3;
    const drumsBridge = createDrumEngine(style, bridgeParams);

    const finalChorusParams = cloneParams(baseParams);
    finalChorusParams.brightness = finalChorusParams.brightness * 1.3;
    finalChorusParams.dna = finalChorusParams.dna + 4;
    const drumsFinalChorus = createDrumEngine(style, finalChorusParams);

    const outroParams = cloneParams(baseParams);
    outroParams.brightness = outroParams.brightness * 0.5;
    outroParams.dna = outroParams.dna + 5;
    const drumsOutro = createDrumEngine(style, outroParams);

    const leadEngineIntro = createLeadEngine({ sampler: guitarLead, lead: leadIntro, style: style, dna: dna, rand: rand, master: masterEQ });
    const leadEngineVerse = createLeadEngine({ sampler: guitarLead, lead: leadVerse, style: style, dna: dna + 1, rand: rand, master: masterEQ });
    const leadEngineChorus = createLeadEngine({ sampler: guitarLead, lead: leadChorus, style: style, dna: dna + 2, rand: rand, master: masterEQ });
    const leadEngineBridge = createLeadEngine({ sampler: guitarLead, lead: leadBridge, style: style, dna: dna + 3, rand: rand, master: masterEQ });
    const leadEngineFinalChorus = createLeadEngine({ sampler: guitarLead, lead: leadFinalChorus, style: style, dna: dna + 4, rand: rand, master: masterEQ });
    const leadEngineOutro = createLeadEngine({ sampler: guitarLead, lead: leadOutro, style: style, dna: dna + 5, rand: rand, master: masterEQ });

    let t = 0;

    function scheduleSection(riff, drumsEngine, leadEngine, duration) {

        Tone.Transport.schedule(function(time) {
            if (drumsEngine && typeof drumsEngine.playSection === "function") {
                drumsEngine.playSection(time, duration);
            }
        }, t);

        Tone.Transport.schedule(function(time) {

            let step = 0;

            const loop = new Tone.Loop(function(loopTime) {
                const note = riff[step];

                if (note) {
                    try {
                        guitarPalm.triggerAttackRelease(note + "2", "8n", loopTime);
                    } catch (e) {
                        console.warn("Errore nota riff:", note, e);
                    }
                }

                step = (step + 1) % riff.length;

            }, "8n").start(t);

            Tone.Transport.scheduleOnce(function() {
                loop.stop();
            }, t + duration);

        }, t);

        if (leadEngine && typeof leadEngine.playSection === "function") {
            Tone.Transport.schedule(function(time) {
                leadEngine.playSection(time, duration);
            }, t);
        }

        t = t + duration;
    }

    scheduleSection(riffIntro, drumsIntro, leadEngineIntro, introDur);
    scheduleSection(riffVerse, drumsVerse, leadEngineVerse, verseDur);
    scheduleSection(riffChorus, drumsChorus, leadEngineChorus, chorusDur);
    scheduleSection(riffBridge, drumsBridge, leadEngineBridge, bridgeDur);
    scheduleSection(riffFinalChorus, drumsFinalChorus, leadEngineFinalChorus, finalChorusDur);
    scheduleSection(riffOutro, drumsOutro, leadEngineOutro, outroDur);

    function play() {
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
        Tone.Transport.stop();
        Tone.Transport.position = 0;
    }

    function seek(seconds) {
        Tone.Transport.seconds = seconds;
    }

    return {
        play: play,
        pause: pause,
        stop: stop,
        seek: seek,
        totalDuration: totalDuration
    };
}
