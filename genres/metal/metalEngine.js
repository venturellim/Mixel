// metalEngine.js — versione 013
// Timeline robusta: transizioni integrate PRIMA della schedulazione

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

console.log("metalEngine.js ver. 013 loaded");

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

    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);

    Tone.Transport.bpm.value = metalParams.bpm;
    const secondsPerBeat = 60 / metalParams.bpm;

    // 1) Struttura originale
    const structurePreset = normalizeStructurePreset(params.structure);
    const structure = buildSongStructure(structurePreset, metalParams.bpm);

    // 2) Progressioni armoniche
    const songProgressions = generateSongProgressions(
        structure,
        params.imageParams,
        metalParams.tonalCenter,
        rand
    );

    // 3) Engine
    const riff  = initRiffEngine(metalInstruments, metalParams, rand, { enableLog: true });
    const lead  = initLeadEngine(metalInstruments, metalParams, rand);
    const bass  = initBassEngine(metalInstruments, metalParams, rand);
    const drums = initDrumEngine(metalInstruments, metalParams, rand);
    const theme = initThemeEngine(metalInstruments, metalParams, rand);

    // ============================================================
    // PRIMA PASSATA: costruiamo sezioni + transizioni (NO SCHEDULAZIONE)
    // ============================================================

    const enriched = [];

    structure.sections.forEach((section, index) => {

        const info = songProgressions[section.name];
        const progression = info.progression;
        const root = info.root;
        const scale = buildScaleFromTonic(root, metalParams.scaleType);
        
        console.log(
            `%cSECTION ${section.name.toUpperCase()} — index ${index}`,
            "color:#00d1ff; font-weight:bold;"
        );

        const riffResult = riff.scheduleSection(section, scale, progression);

        enriched.push({
            type: "main",
            name: section.name,
            measures: section.measures,
            progression,
            scale,
            riffResult
        });

        if (riffResult.transition) {
            enriched.push({
                type: "transition",
                name: `transition_${section.name}`,
                transition: riffResult.transition
            });
        }
    });

    // ============================================================
    // SECONDA PASSATA: ricalcolo startTime / endTime
    // ============================================================

    let currentTime = 0;

    enriched.forEach(sec => {

        sec.startTime = currentTime;

        if (sec.type === "main") {
            sec.endTime = sec.startTime + sec.measures * 4 * secondsPerBeat;
        } else {
            sec.endTime = sec.startTime + sec.transition.durationBeats * secondsPerBeat;
        }

        currentTime = sec.endTime;
    });

    // ============================================================
    // TERZA PASSATA: schedulazione engine
    // ============================================================

    Tone.Transport.cancel(0);

    enriched.forEach(sec => {

        if (sec.type === "main") {

            riff.scheduleSection(sec, sec.scale, sec.progression);
            // bass.scheduleSection(sec, sec.scale, sec.progression);
            // drums.scheduleSection(sec, sec.scale, sec.progression);
            // theme.scheduleSection(sec, sec.scale, sec.progression);
            // lead.scheduleSection(sec, sec.scale, sec.progression);

        } else {

            const t = sec.transition;

            t.events.forEach(ev => {
                const eventTime = sec.startTime + ev.beatOffset * secondsPerBeat;

                Tone.Transport.schedule(time => {
                    metalInstruments.guitarPalm.triggerAttackRelease(
                        ev.note + "2",
                        "16n",
                        time
                    );
                }, eventTime);
            });
        }
    });

    // ============================================================
    // LOOP E DURATA
    // ============================================================

    Tone.Transport.loop = false;
    Tone.Transport.loopEnd = currentTime;

    return {
        totalDuration: currentTime,
        play() { Tone.Transport.start("+0.1"); },
        pause() { Tone.Transport.pause(); },
        stop() { Tone.Transport.stop(); Tone.Transport.seconds = 0; },
        seek(s) { Tone.Transport.seconds = s; }
    };
}
