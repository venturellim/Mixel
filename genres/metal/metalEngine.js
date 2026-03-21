//
// metalEngine.js — versione corretta e definitiva (ver. 006)
//

import * as Tone from "https://esm.sh/tone";

import { metalInstruments } from "./instruments.js";
import { buildPowerMetalParams } from "./powerMetalParams.js";

import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic } from "../../utils/scaleUtils.js";
import { createSeededRandom } from "../../utils/randomUtils.js";

import { initRiffEngine } from "./riffEngine.js";
import { initLeadEngine } from "./leadEngine.js";
import { initBassEngine } from "./bassEngine.js";
import { initDrumEngine } from "./drumEngine.js";
import { initThemeEngine } from "./themeEngine.js";

import { generateSongProgressions } from "./metalTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 006 loaded");

// ============================================================
// 🎧 LOADER STRUMENTI METAL
// ============================================================

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
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);

    console.log("metalParams =", metalParams);

    // --------------------------------------------------------
    // 2) Costruzione struttura del brano
    // --------------------------------------------------------
    const structure = buildSongStructure(
        params.structure,
        metalParams.bpm
    );

    // --------------------------------------------------------
    // 3) Generazione progressioni armoniche
    // --------------------------------------------------------
    const songProgressions = generateSongProgressions(
        structure,
        params.imageParams,
        metalParams.tonalCenter,
        rand
    );

    // --------------------------------------------------------
    // 4) Inizializzazione engine specifici
    // --------------------------------------------------------
    const riff  = initRiffEngine(metalInstruments, metalParams, rand);
    const lead  = initLeadEngine(metalInstruments, metalParams, rand);
    const bass  = initBassEngine(metalInstruments, metalParams, rand);
    const drums = initDrumEngine(metalInstruments, metalParams, rand);
    const theme = initThemeEngine(metalInstruments, metalParams, rand);

    // --------------------------------------------------------
    // 5) Programmazione timeline
    // --------------------------------------------------------
    Tone.Transport.cancel(0);

    structure.sections.forEach((section, sectionIndex) => {

    const info = songProgressions[section.name];
    const root = info.root;
    const sectionScale = buildScaleFromTonic(root, metalParams.scaleType);

    console.log(
        `%cSECTION ${section.name.toUpperCase()} — index ${sectionIndex}`,
        "color:#00d1ff; font-weight:bold;"
    );

    console.log("Progression:", info.progression);
    console.log("Degree:", info.degree);
    console.log("Root:", root);

    const pattern = riff.scheduleSection(section, sectionScale, root);

//bass.scheduleSection(section, sectionScale, root, pattern);
//drums.scheduleSection(section, sectionScale, root, pattern);
//theme.scheduleSection(section, sectionScale, root, pattern);
//lead.scheduleSection(section, sectionScale, root); // lead non usa pattern

});


    // --------------------------------------------------------
    // 6) Engine finale
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
