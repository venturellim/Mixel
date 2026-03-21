//
// metalEngine.js
// Entry point del genere metal.
// Riceve i parametri universali (photoToMusicParams),
// inizializza strumenti, struttura, scale, seed,
// e orchestra tutti gli engine del metal.
//

import * as Tone from "https://esm.sh/tone";

import { metalInstruments } from "./instruments.js";
import { buildPowerMetalParams } from "./powerMetalParams.js";

import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic } from "../../utils/scaleUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { duration } from "../../utils/tempoUtils.js";

import { initRiffEngine } from "./riffEngine.js";
import { initLeadEngine } from "./leadEngine.js";
import { initBassEngine } from "./bassEngine.js";
import { initDrumEngine } from "./drumEngine.js";
import { initThemeEngine } from "./themeEngine.js";

import { waitForInstruments } from "../../common.js";


console.log("metalEngine.js loaded");

// ============================================================
// 🎧 LOADER STRUMENTI METAL
// ============================================================
//
// Questa funzione aspetta che i 4 sampler del metal
// (palm, open, lead, bass) siano completamente caricati.
// Viene chiamata da Main.js PRIMA di aprire il player.
//
export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

// ============================================================
// 🎼 CREAZIONE ENGINE METAL
// ============================================================

export async function createMetalEngine(params) {

    // --------------------------------------------------------
    // 1) Parametri specifici del metal
    // --------------------------------------------------------
    // --------------------------------------------------------
    // 2) Seed random deterministico
    // --------------------------------------------------------
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);


    // --------------------------------------------------------
    // 3) Costruzione struttura del brano
    // --------------------------------------------------------
    //const structure = buildSongStructure(
        //metalParams.structureProfile,
        //metalParams.bpm
    //);
    console.log("metalParams =", metalParams);


const structure = buildSongStructure(
    params.structure,
    metalParams.bpm
);


    // --------------------------------------------------------
    // 4) Costruzione scala
    // --------------------------------------------------------
    const scale = buildScaleFromTonic(
        metalParams.tonalCenter,
        metalParams.scaleType
    );
    console.log("🎼 Scala generata:", scale);

// --------------------------------------------------------
// PROGRESSIONE ARMONICA PER SEZIONE
// --------------------------------------------------------
const sectionProgressions = {
    intro:  ["C", "G", "Am", "F"],
    verse:  ["Am", "F", "C", "G"],
    chorus: ["C", "G", "Am", "Bdim"],
    solo:   ["Em", "Am", "F", "G"],
    outro:  ["C", "F", "C", "G"]
};

function getSectionRoot(section, index) {
    const prog = sectionProgressions[section.name] || ["C"];
    return prog[index % prog.length];
}



    // --------------------------------------------------------
    // 5) Inizializzazione engine specifici
    // --------------------------------------------------------
    const riff  = initRiffEngine(metalInstruments, metalParams, rand);
const lead  = initLeadEngine(metalInstruments, metalParams, rand);
const bass  = initBassEngine(metalInstruments, metalParams, rand);
const drums = initDrumEngine(metalInstruments, metalParams, rand);
const theme = initThemeEngine(metalInstruments, metalParams, rand);


    // --------------------------------------------------------
    // 6) Programmazione timeline
    // --------------------------------------------------------
    Tone.Transport.cancel(0);

    structure.sections.forEach((section, sectionIndex) => {

    // 1) Root armonico della sezione
    const root = getSectionRoot(section, sectionIndex);

    // 2) Scala della sezione
    const sectionScale = buildScaleFromTonic(root, metalParams.scaleType);

    // 3) Passiamo root e scala ai singoli engine
    riff.scheduleSection(section, sectionScale, root);
    bass.scheduleSection(section, sectionScale, root);
    drums.scheduleSection(section, sectionScale, root);
    theme.scheduleSection(section, sectionScale, root);
    lead.scheduleSection(section, sectionScale, root);
});


    // --------------------------------------------------------
    // 7) Engine finale
    // --------------------------------------------------------
    const engine = {
        totalDuration: structure.totalDuration,

        play() {
            Tone.Transport.start("+0.1");
        },

        pause() {
            Tone.Transport.pause();
        },

        stop() {
            Tone.Transport.stop();
            Tone.Transport.seconds = 0;
        },

        seek(seconds) {
            Tone.Transport.seconds = seconds;
        }
    };

    return engine;
}
