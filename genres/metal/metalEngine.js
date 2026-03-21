//
// metalEngine.js — versione corretta e definitiva
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

import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 004 loaded");

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
    // 3) Scala globale (solo per debug, NON usata dagli engine)
    // --------------------------------------------------------
    const scale = buildScaleFromTonic(
        metalParams.tonalCenter,
        metalParams.scaleType
    );
    console.log("🎼 Scala generata:", scale);

    // --------------------------------------------------------
    // 4) PROGRESSIONE ARMONICA RELATIVA ALLA TONALITÀ
    // --------------------------------------------------------

    // Progressioni espresse in gradi
    const sectionProgressions = {
        intro:  ["I", "V", "vi", "IV"],
        verse:  ["vi", "IV", "I", "V"],
        chorus: ["I", "V", "vi", "VII°"],
        solo:   ["iii", "vi", "IV", "V"],
        outro:  ["I", "IV", "I", "V"]
    };

    // Mappa gradi → semitoni
    const degreeMap = {
        "I":    0,
        "ii":   2,
        "iii":  4,
        "IV":   5,
        "V":    7,
        "vi":   9,
        "VII°": 11
    };

    // Trasposizione dei gradi nella tonalità del brano
    function getSectionRoot(section, index, tonalCenter) {
        const prog = sectionProgressions[section.name] || ["I"];
        const degree = prog[index % prog.length];
        const semitones = degreeMap[degree] ?? 0;

        return Tone.Frequency(tonalCenter).transpose(semitones).toNote();
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

        console.log("SECTION:", section.name, "INDEX:", sectionIndex);

        // 1) Root armonico della sezione (trasposto)
        const root = getSectionRoot(section, sectionIndex, metalParams.tonalCenter);

        // 2) Scala della sezione
        const sectionScale = buildScaleFromTonic(root, metalParams.scaleType);

        // 3) Scheduling engine
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
