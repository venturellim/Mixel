// metal.js

import * as Tone from "https://esm.sh/tone";

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

import { chooseKey, chooseScale } from "./musicTheory.js";
import { detectMetalStyle, computeBPM } from "./metalTheory.js";
import { generateMetalRiff } from "./metalRiff.js";
import { generateMetalLead } from "./metalLead.js";
import { createMetalDrumEngine } from "./drumEngine.js";
import { createLeadEngine } from "./leadEngine.js";


// ======================================================
// 1) WRAPPER USATO DAL MAIN.JS
// ======================================================

export async function createMetalEngineFromImage(previewImage) {

    // Calcolo luminosità immagine
    const brightness = await analyzeImageBrightness(previewImage);

    // DNA deterministico
    const dna = Math.floor(brightness * 1000000);

    // Creo il vero engine
    const engine = await createMetalSongFromImage({
        dna,
        brightness,
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
        text.innerText = `Caricamento strumenti… ${percent}%`;
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

export async function createMetalSongFromImage({ dna, brightness, img }) {

    await Tone.loaded();

    const rand = createSeededRandom(dna);

    // Durata totale 3–5 minuti
    const totalDuration = 180 + (dna % 60) + (brightness * 30);

    // BPM
    const bpm = computeBPM(brightness, dna);
    Tone.Transport.bpm.value = bpm;

    // Durate sezioni
    const introDur = totalDuration * 0.10;
    const verseDur = totalDuration * 0.20;
    const chorusDur = totalDuration * 0.20;
    const bridgeDur = totalDuration * 0.25;
    const finalChorusDur = totalDuration * 0.20;
    const outroDur = totalDuration * 0.05;

    // Tonalità con modulazioni
    const keyIntro = chooseKey(dna);
    const keyVerse = transposeKey(keyIntro, -2);
    const keyChorus = transposeKey(keyVerse, +5);
    const keyBridge = transposeKey(keyChorus, +7);
    const keyFinalChorus = transposeKey(keyBridge, -5);
    const keyOutro = transposeKey(keyFinalChorus, -2);

    // Scale
    const scaleIntro = chooseScale(dna, keyIntro);
    const scaleVerse = chooseScale(dna+1, keyVerse);
    const scaleChorus = chooseScale(dna+2, keyChorus);
    const scaleBridge = chooseScale(dna+3, keyBridge);
    const scaleFinalChorus = chooseScale(dna+4, keyFinalChorus);
    const scaleOutro = chooseScale(dna+5, keyOutro);

    // Stile
    const style = detectMetalStyle(brightness, dna);

    // Riff
    const riffIntro = generateMetalRiff(dna,   scaleIntro,       style, rand);
    const riffVerse = generateMetalRiff(dna+1, scaleVerse,       style, rand);
    const riffChorus = generateMetalRiff(dna+2, scaleChorus,     style, rand);
    const riffBridge = generateMetalRiff(dna+3, scaleBridge,     style, rand);
    const riffFinalChorus = generateMetalRiff(dna+4, scaleFinalChorus, style, rand);
    const riffOutro = generateMetalRiff(dna+5, scaleOutro,       style, rand);

    // Lead
    const leadIntro = generateMetalLead(dna,   scaleIntro,       style, rand);
    const leadVerse = generateMetalLead(dna+1, scaleVerse,       style, rand);
    const leadChorus = generateMetalLead(dna+2, scaleChorus,     style, rand);
    const leadBridge = generateMetalLead(dna+3, scaleBridge,     style, rand);
    const leadFinalChorus = generateMetalLead(dna+4, scaleFinalChorus, style, rand);
    const leadOutro = generateMetalLead(dna+5, scaleOutro,       style, rand);

    // Drums
    const drumsIntro = createMetalDrumEngine({ drums, style, brightness,           dna,     rand });
    const drumsVerse = createMetalDrumEngine({ drums, style, brightness: brightness*0.7, dna: dna+1, rand });
    const drumsChorus = createMetalDrumEngine({ drums, style, brightness: brightness*1.2, dna: dna+2, rand });
    const drumsBridge = createMetalDrumEngine({ drums, style, brightness,           dna: dna+3, rand });
    const drumsFinalChorus = createMetalDrumEngine({ drums, style, brightness: brightness*1.3, dna: dna+4, rand });
    const drumsOutro = createMetalDrumEngine({ drums, style, brightness: brightness*0.5, dna: dna+5, rand });

    // Lead engine
    const leadEngineIntro = createLeadEngine({ sampler: guitarLead, lead: leadIntro,        style, dna,     rand, master: masterEQ });
    const leadEngineVerse = createLeadEngine({ sampler: guitarLead, lead: leadVerse,        style, dna: dna+1, rand, master: masterEQ });
    const leadEngineChorus = createLeadEngine({ sampler: guitarLead, lead: leadChorus,      style, dna: dna+2, rand, master: masterEQ });
    const leadEngineBridge = createLeadEngine({ sampler: guitarLead, lead: leadBridge,      style, dna: dna+3, rand, master: masterEQ });
    const leadEngineFinalChorus = createLeadEngine({ sampler: guitarLead, lead: leadFinalChorus, style, dna: dna+4, rand, master: masterEQ });
    const leadEngineOutro = createLeadEngine({ sampler: guitarLead, lead: leadOutro,        style, dna: dna+5, rand, master: masterEQ });

    // Scheduling
    let t = 0;

    function scheduleSection(riff, drumsEngine, leadEngine, duration) {

        Tone.Transport.schedule((time) => {
            drumsEngine?.play?.(time);
        }, t);

        Tone.Transport.schedule((time) => {

            let step = 0;

            const loop = new Tone.Loop((loopTime) => {
                const note = riff[step];
                if (note) {
                    try {
                        guitarPalm.triggerAttackRelease(note + "2", "8n", loopTime);
                    } catch(e) {
                        console.warn("Errore nota riff:", note, e);
                    }
                }
                step = (step + 1) % riff.length;
            }, "8n").start(t);

            Tone.Transport.scheduleOnce(() => loop.stop(), t + duration);

        }, t);

        leadEngine?.playSection?.(t, duration);

        t += duration;
    }

    scheduleSection(riffIntro,        drumsIntro,        leadEngineIntro,        introDur);
    scheduleSection(riffVerse,        drumsVerse,        leadEngineVerse,        verseDur);
    scheduleSection(riffChorus,       drumsChorus,       leadEngineChorus,       chorusDur);
    scheduleSection(riffBridge,       drumsBridge,       leadEngineBridge,       bridgeDur);
    scheduleSection(riffFinalChorus,  drumsFinalChorus,  leadEngineFinalChorus,  finalChorusDur);
    scheduleSection(riffOutro,        drumsOutro,        leadEngineOutro,        outroDur);

    // Metodi engine
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
        play,
        pause,
        stop,
        seek,
        totalDuration
    };
}

