// metalEngine.js — versione 012
// 011 + sezioni di transizione autonome

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

console.log("metalEngine.js ver. 012 loaded");

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
        { name: "intro",   measures: 8 },
        { name: "verse",   measures: 12 },
        { name: "chorus",  measures: 12 },
        { name: "solo",    measures: 16 },
        { name: "outro",   measures: 8 }
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
    const riff  = initRiffEngine(metalInstruments, metalParams, rand, { enableLog: true });

    const lead  = initLeadEngine(metalInstruments, metalParams, rand);
    const bass  = initBassEngine(metalInstruments, metalParams, rand);
    const drums = initDrumEngine(metalInstruments, metalParams, rand);
    const theme = initThemeEngine(metalInstruments, metalParams, rand);

    // ============================================================
    // PRIMA PASSATA: raccogliamo sezioni e transizioni
    // ============================================================

    const enrichedSections = [];

    structure.sections.forEach((section, index) => {

        const info = songProgressions[section.name];
        const progression = info.progression;
        const root = info.root;
        const sectionScale = buildScaleFromTonic(root, metalParams.scaleType);

        console.log(
            `%cSECTION ${section.name.toUpperCase()} — index ${index}`,
            "color:#00d1ff; font-weight:bold;"
        );

        const riffResult = riff.scheduleSection(section, sectionScale, progression);

        enrichedSections.push({
            type: "main",
            name: section.name,
            measures: section.measures,
            startTime: section.startTime,
            endTime: section.startTime + section.measures * (60 / metalParams.bpm) * 4,
            progression,
            sectionScale,
            riffResult
        });

        // Se esiste una transizione, la aggiungiamo come sezione autonoma
        if (riffResult.transition) {
            enrichedSections.push({
                type: "transition",
                name: `transition_${section.name}`,
                transition: riffResult.transition,
                // startTime e endTime verranno calcolati dopo
            });
        }
    });

    // ============================================================
    // SECONDA PASSATA: ricalcolo startTime / endTime
    // ============================================================

    let currentTime = 0;
    const secondsPerBeat = 60 / metalParams.bpm;

    enrichedSections.forEach(sec => {

        sec.startTime = currentTime;

        if (sec.type === "main") {
            sec.endTime = sec.startTime + sec.measures * 4 * secondsPerBeat;
        } else {
            // sezione di transizione
            sec.endTime = sec.startTime + sec.transition.durationBeats * secondsPerBeat;
        }

        currentTime = sec.endTime;
    });

    // ============================================================
    // TERZA PASSATA: schedulazione engine
    // ============================================================

    Tone.Transport.cancel(0);

    enrichedSections.forEach(sec => {

        if (sec.type === "main") {

            riff.scheduleSection(sec, sec.sectionScale, sec.progression);
            //bass.scheduleSection(sec, sec.sectionScale, sec.progression);
            //drums.scheduleSection(sec, sec.sectionScale, sec.progression);
            //theme.scheduleSection(sec, sec.sectionScale, sec.progression);
            //lead.scheduleSection(sec, sec.sectionScale, sec.progression);

        } else {

            // TRANSIZIONE: solo riff/bass/drums
            const t = sec.transition;

            t.events.forEach(ev => {
                const eventTime = sec.startTime + ev.beatOffset * secondsPerBeat;

                // Riff: suona la transizione
                Tone.Transport.schedule(time => {
                    metalInstruments.guitarPalm.triggerAttackRelease(
                        ev.note + "2",
                        "16n",
                        time
                    );
                }, eventTime);

                // Bass e drums seguiranno in futuro
            });
        }
    });

    // ============================================================
    // LOOP E DURATA
    // ============================================================

    Tone.Transport.loop = false;
    Tone.Transport.loopEnd = currentTime;

    // 6) Engine finale
    const engine = {
        totalDuration: currentTime,

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
