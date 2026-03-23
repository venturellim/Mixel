//
// metalEngine.js — versione 011
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

console.log("metalEngine.js ver. 011 test loaded");

// ============================================================
// 🎧 LOADER STRUMENTI METAL
// ============================================================

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

function normalizeStructurePreset(preset) {

    if (Array.isArray(preset)) return preset;

    if (typeof preset === "object") {
        return Object.entries(preset).map(([name, measures]) => ({
            name,
            measures
        }));
    }

    const STRUCTURE_LIBRARY = {
        standard: [
            { name: "intro",   measures: 4 },
            { name: "verse",   measures: 8 },
            { name: "chorus",  measures: 8 },
            { name: "solo",    measures: 12 },
            { name: "outro",   measures: 4 }
        ]
    };

    return STRUCTURE_LIBRARY[preset] ?? STRUCTURE_LIBRARY.standard;
}

// ============================================================
// 🎼 CREAZIONE ENGINE METAL
// ============================================================

export async function createMetalEngine(params) {

    // 1) Parametri specifici del metal
    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);

    console.log("metalParams =", metalParams);

    // Imposta il BPM del Transport PRIMA di schedulare
    Tone.Transport.bpm.value = metalParams.bpm;

    // 2) Costruzione struttura del brano
    const structurePreset = normalizeStructurePreset(params.structure);

    const structure = buildSongStructure(
        structurePreset,
        metalParams.bpm
    );

    // 3) Generazione progressioni armoniche
    const songProgressions = generateSongProgressions(
        structure,
        params.imageParams,
        metalParams.tonalCenter,
        rand
    );

    // 4) Inizializzazione engine specifici
    const riff  = initRiffEngine(metalInstruments, metalParams, rand);
    const lead  = initLeadEngine(metalInstruments, metalParams, rand);
    const bass  = initBassEngine(metalInstruments, metalParams, rand);
    const drums = initDrumEngine(metalInstruments, metalParams, rand);
    const theme = initThemeEngine(metalInstruments, metalParams, rand);

    // 5) Programmazione timeline
    Tone.Transport.cancel(0);

    structure.sections.forEach((section, sectionIndex) => {

        const info = songProgressions[section.name];
        const progression = info.progression;
        const root = info.root;
        const sectionScale = buildScaleFromTonic(root, metalParams.scaleType);

        console.log(
            `%cSECTION ${section.name.toUpperCase()} — index ${sectionIndex}`,
            "color:#00d1ff; font-weight:bold;"
        );

        console.log("Progression:", progression);
        console.log("Degree:", info.degree);
        console.log("Root:", root);

        // SCHEDULAZIONE DIRETTA: gli engine usano section.startTime internamente
        const riffPatterns = riff.scheduleSection(section, sectionScale, progression);
        // bass.scheduleSection(section, sectionScale, progression, riffPatterns);
        // drums.scheduleSection(section, sectionScale, progression, riffPatterns);
        // theme.scheduleSection(section, sectionScale, progression, riffPatterns);
        // lead.scheduleSection(section, sectionScale, progression);
    });

    // Allinea il Transport alla durata del brano
    Tone.Transport.loop = false;
    Tone.Transport.loopEnd = structure.totalDuration;

    // 6) Engine finale
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
