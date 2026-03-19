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
    const metalParams = buildPowerMetalParams(params);

    // --------------------------------------------------------
    // 2) Seed random deterministico
    // --------------------------------------------------------
    const rand = createSeededRandom(params.dna);

    // --------------------------------------------------------
    // 3) Costruzione struttura del brano
    // --------------------------------------------------------
    const structure = buildSongStructure(
        metalParams.structureProfile,
        metalParams.bpm
    );

    // --------------------------------------------------------
    // 4) Costruzione scala
    // --------------------------------------------------------
    const scale = buildScaleFromTonic(
        metalParams.tonalCenter,
        metalParams.scaleType
    );

    // --------------------------------------------------------
    // 5) Inizializzazione engine specifici
    // --------------------------------------------------------
    const riff = initRiffEngine(metalInstruments, metalParams, scale, rand, structure);
    const lead = initLeadEngine(metalInstruments, metalParams, scale, rand, structure);
    const bass = initBassEngine(metalInstruments, metalParams, scale, rand, structure);
    const drums = initDrumEngine(metalInstruments, metalParams, rand, structure);
    const theme = initThemeEngine(metalInstruments, metalParams, scale, rand, structure);

    // --------------------------------------------------------
    // 6) Programmazione timeline
    // --------------------------------------------------------
    Tone.Transport.cancel(0);

    riff.schedule();
    bass.schedule();
    drums.schedule();
    theme.schedule();
    lead.schedule();

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
