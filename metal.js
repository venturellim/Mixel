// metalSongEngine.js
// FILE PRINCIPALE — usa i tuoi moduli esistenti

import * as Tone from "https://esm.sh/tone";

import { chooseKey, chooseScale } from "./musicTheory.js";
import { detectMetalStyle, computeBPM } from "./metalTheory.js";
import { generateMetalRiff } from "./metalRiff.js";
import { generateMetalLead } from "./metalLead.js";
import { createMetalDrumEngine } from "./drumEngine.js";
import { createLeadEngine } from "./leadEngine.js";
import { guitarPalm, guitarOpen, guitarLead, drums, masterEQ } from "./common.js";


// ===============================
// UTILITÀ
// ===============================

function transposeKey(key, semitones) {
    const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const index = notes.indexOf(key);
    const newIndex = (index + semitones + 12) % 12;
    return notes[newIndex];
}

function createSeededRandom(seed) {
    return function() {
        seed = (seed * 1664525 + 1013904223) % 4294967296;
        return seed / 4294967296;
    };
}


// ===============================
// GENERATORE DI BRANO COMPLETO
// ===============================

export async function createMetalSongFromImage({
    dna,
    brightness,
    img
}) {

    await Tone.loaded();

    const rand = createSeededRandom(dna);

    // ===============================
    // DURATA TOTALE (3–5 minuti)
    // ===============================

    const totalDuration =
        180 + (dna % 60) + (brightness * 30); // secondi

    // ===============================
    // BPM
    // ===============================

    const bpm = computeBPM(brightness, dna);
    Tone.Transport.bpm.value = bpm;

    const measureDuration = (60 / bpm) * 4;

    // ===============================
    // DURATA SEZIONI
    // ===============================

    const introDur = totalDuration * 0.10;
    const verseDur = totalDuration * 0.20;
    const chorusDur = totalDuration * 0.20;
    const bridgeDur = totalDuration * 0.25;
    const finalChorusDur = totalDuration * 0.20;
    const outroDur = totalDuration * 0.05;

    // ===============================
    // TONALITÀ E MODULAZIONI
    // ===============================

    const keyIntro = chooseKey(dna);
    const keyVerse = transposeKey(keyIntro, -2);
    const keyChorus = transposeKey(keyVerse, +5);
    const keyBridge = transposeKey(keyChorus, +7);
    const keyFinalChorus = transposeKey(keyBridge, -5);
    const keyOutro = transposeKey(keyFinalChorus, -2);

    // ===============================
    // SCALE PER SEZIONE
    // ===============================

    const scaleIntro = chooseScale(dna, keyIntro);
    const scaleVerse = chooseScale(dna+1, keyVerse);
    const scaleChorus = chooseScale(dna+2, keyChorus);
    const scaleBridge = chooseScale(dna+3, keyBridge);
    const scaleFinalChorus = chooseScale(dna+4, keyFinalChorus);
    const scaleOutro = chooseScale(dna+5, keyOutro);

    // ===============================
    // STILE METAL BASE
    // ===============================

    const style = detectMetalStyle(brightness, dna);

    // ===============================
    // GENERAZIONE RIFF PER SEZIONE
    // ===============================

    const riffIntro = generateMetalRiff(dna, scaleIntro, style, rand);
    const riffVerse = generateMetalRiff(dna+1, scaleVerse, style, rand);
    const riffChorus = generateMetalRiff(dna+2, scaleChorus, style, rand);
    const riffBridge = generateMetalRiff(dna+3, scaleBridge, style, rand);
    const riffFinalChorus = generateMetalRiff(dna+4, scaleFinalChorus, style, rand);
    const riffOutro = generateMetalRiff(dna+5, scaleOutro, style, rand);

    // ===============================
    // GENERAZIONE LEAD PER SEZIONE
    // ===============================

    const leadIntro = generateMetalLead(dna, scaleIntro, style, rand);
    const leadVerse = generateMetalLead(dna+1, scaleVerse, style, rand);
    const leadChorus = generateMetalLead(dna+2, scaleChorus, style, rand);
    const leadBridge = generateMetalLead(dna+3, scaleBridge, style, rand);
    const leadFinalChorus = generateMetalLead(dna+4, scaleFinalChorus, style, rand);
    const leadOutro = generateMetalLead(dna+5, scaleOutro, style, rand);

    // ===============================
    // DRUM ENGINE PER SEZIONE
    // ===============================

    const drumsIntro = createMetalDrumEngine({ drums, style, brightness, dna, rand });
    const drumsVerse = createMetalDrumEngine({ drums, style, brightness: brightness*0.7, dna: dna+1, rand });
    const drumsChorus = createMetalDrumEngine({ drums, style, brightness: brightness*1.2, dna: dna+2, rand });
    const drumsBridge = createMetalDrumEngine({ drums, style, brightness, dna: dna+3, rand });
    const drumsFinalChorus = createMetalDrumEngine({ drums, style, brightness: brightness*1.3, dna: dna+4, rand });
    const drumsOutro = createMetalDrumEngine({ drums, style, brightness: brightness*0.5, dna: dna+5, rand });

    // ===============================
    // LEAD ENGINE PER SEZIONE
    // ===============================

    const leadEngineIntro = createLeadEngine({ sampler: guitarLead, lead: leadIntro, style, dna, rand, master: masterEQ });
    const leadEngineVerse = createLeadEngine({ sampler: guitarLead, lead: leadVerse, style, dna: dna+1, rand, master: masterEQ });
    const leadEngineChorus = createLeadEngine({ sampler: guitarLead, lead: leadChorus, style, dna: dna+2, rand, master: masterEQ });
    const leadEngineBridge = createLeadEngine({ sampler: guitarLead, lead: leadBridge, style, dna: dna+3, rand, master: masterEQ });
    const leadEngineFinalChorus = createLeadEngine({ sampler: guitarLead, lead: leadFinalChorus, style, dna: dna+4, rand, master: masterEQ });
    const leadEngineOutro = createLeadEngine({ sampler: guitarLead, lead: leadOutro, style, dna: dna+5, rand, master: masterEQ });

    // ===============================
    // SCHEDULING DELLE SEZIONI
    // ===============================

    let t = 0;

    function scheduleSection(riff, drumsEngine, leadEngine, duration) {
        Tone.Transport.schedule((time) => {
            drumsEngine.play(time);
        }, t);

        Tone.Transport.schedule((time) => {
            // riff player
            let step = 0;
            const loop = new Tone.Loop((time) => {
                const note = riff[step];
                guitarPalm.triggerAttackRelease(note + "2", "8n", time);
                step = (step + 1) % riff.length;
            }, "8n").start(t);

            Tone.Transport.scheduleOnce(() => loop.stop(), t + duration);
        }, t);

        t += duration;
    }

    scheduleSection(riffIntro, drumsIntro, leadEngineIntro, introDur);
    scheduleSection(riffVerse, drumsVerse, leadEngineVerse, verseDur);
    scheduleSection(riffChorus, drumsChorus, leadEngineChorus, chorusDur);
    scheduleSection(riffBridge, drumsBridge, leadEngineBridge, bridgeDur);
    scheduleSection(riffFinalChorus, drumsFinalChorus, leadEngineFinalChorus, finalChorusDur);
    scheduleSection(riffOutro, drumsOutro, leadEngineOutro, outroDur);

    // ===============================
    // AVVIO
    // ===============================

    Tone.Transport.start();

    return {
        totalDuration,
        bpm
    };
}
