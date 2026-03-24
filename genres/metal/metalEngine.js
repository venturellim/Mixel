// metalEngine.js — versione 013
// Timeline robusta: nessuna schedulazione prima del ricalcolo

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

console.log("metalEngine.js ver. 014 loaded");

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

function chooseTransitionByDistance(fromNote, toNote, rand) {
    const letters = ["C","D","E","F","G","A","B"];

    const i1 = letters.indexOf(fromNote);
    const i2 = letters.indexOf(toNote);

    if (i1 === -1 || i2 === -1) {
        return {
            type: "syncopated_hits",
            durationBeats: 4,
            instrument: "palm"
        };
    }

    // distanza circolare
    let dist = Math.abs(i1 - i2);
    if (dist > 3) dist = 7 - dist;

    // -----------------------------
    // DISTANZA 0–1 → STATICA
    // -----------------------------
    if (dist <= 1) {
        const staticChoices = ["gallop_9", "tremolo_burst", "syncopated_hits", "open_hit"];
        return {
            type: staticChoices[Math.floor(rand() * staticChoices.length)],
            durationBeats: 4,   // 1 misura
            instrument: "palm"
        };
    }

    // -----------------------------
    // DISTANZA 2–3 → DINAMICA
    // -----------------------------
    if (dist <= 3) {
        const dynamicChoices = ["power_walk", "power_slide", "scale_up_short", "scale_down_short"];
        return {
            type: dynamicChoices[Math.floor(rand() * dynamicChoices.length)],
            durationBeats: 6,   // 1.5 misure
            instrument: "mixed"
        };
    }

    // -----------------------------
    // DISTANZA 4–6 → MELODICA
    // -----------------------------
    const melodicChoices = ["scale_up", "scale_down", "melodic_run"];
    return {
        type: melodicChoices[Math.floor(rand() * melodicChoices.length)],
        durationBeats: 8,       // 2 misure
        instrument: "lead"
    };
}

function buildTransitionEvents(fromNote, toNote, scale, transitionInfo, rand) {
    const { type, durationBeats, instrument } = transitionInfo;
    const events = [];

    // Utility per trovare indice nella scala
    const idx = scale.indexOf(fromNote);
    const idx2 = scale.indexOf(toNote);

    const safeIdx = idx === -1 ? 0 : idx;
    const safeIdx2 = idx2 === -1 ? 0 : idx2;

    // ---------------------------------------------------------
    // PATTERN: STATICA (gallop, tremolo, syncopated, open_hit)
    // ---------------------------------------------------------
    if (instrument === "palm") {
        if (type === "gallop_9") {
            // gallop classico: 0, 0.5, 0.75
            for (let b = 0; b < durationBeats; b += 1) {
                events.push({ beatOffset: b, note: fromNote });
                events.push({ beatOffset: b + 0.5, note: fromNote });
                events.push({ beatOffset: b + 0.75, note: fromNote });
            }
        }

        if (type === "tremolo_burst") {
            for (let b = 0; b < durationBeats; b += 0.25) {
                events.push({ beatOffset: b, note: fromNote });
            }
        }

        if (type === "syncopated_hits") {
            for (let b = 0; b < durationBeats; b += 1) {
                events.push({ beatOffset: b + 0.5, note: fromNote });
            }
        }

        if (type === "open_hit") {
            events.push({ beatOffset: 0, note: fromNote });
        }
    }

    // ---------------------------------------------------------
    // PATTERN: DINAMICA (power_walk, slide, scale_short)
    // ---------------------------------------------------------
    if (instrument === "mixed") {
        if (type === "power_walk") {
            // camminata: 1 nota per beat
            const step = safeIdx < safeIdx2 ? 1 : -1;
            let pos = safeIdx;

            for (let b = 0; b < durationBeats - 1; b++) {
                const note = scale[pos] || fromNote;
                events.push({ beatOffset: b, note });
                pos += step;
                if (pos < 0) pos = 0;
                if (pos >= scale.length) pos = scale.length - 1;
            }

            // open finale
            events.push({ beatOffset: durationBeats - 1, note: toNote });
        }

        if (type === "power_slide") {
            // slide: solo due note
            events.push({ beatOffset: 0, note: fromNote });
            events.push({ beatOffset: durationBeats - 1, note: toNote });
        }

        if (type === "scale_up_short" || type === "scale_down_short") {
            const step = safeIdx < safeIdx2 ? 1 : -1;
            let pos = safeIdx;

            for (let b = 0; b < durationBeats - 1; b += 0.5) {
                const note = scale[pos] || fromNote;
                events.push({ beatOffset: b, note });
                pos += step;
                if (pos < 0) pos = 0;
                if (pos >= scale.length) pos = scale.length - 1;
            }

            events.push({ beatOffset: durationBeats - 1, note: toNote });
        }
    }

    // ---------------------------------------------------------
    // PATTERN: MELODICA (scale_up, scale_down, melodic_run)
    // ---------------------------------------------------------
    if (instrument === "lead") {
        if (type === "scale_up" || type === "scale_down") {
            const step = safeIdx < safeIdx2 ? 1 : -1;
            let pos = safeIdx;

            for (let b = 0; b < durationBeats - 1; b += 0.5) {
                const note = scale[pos] || fromNote;
                events.push({ beatOffset: b, note });
                pos += step;
                if (pos < 0) pos = 0;
                if (pos >= scale.length) pos = scale.length - 1;
            }

            // open finale
            events.push({ beatOffset: durationBeats - 1, note: toNote });
        }

        if (type === "melodic_run") {
            for (let b = 0; b < durationBeats - 1; b += 0.25) {
                const pos = Math.floor(rand() * scale.length);
                events.push({ beatOffset: b, note: scale[pos] });
            }
            events.push({ beatOffset: durationBeats - 1, note: toNote });
        }
    }

    return {
        type,
        durationBeats,
        instrument,
        events
    };
}

// ============================================================
// 🎼 CREAZIONE ENGINE METAL
// ============================================================

export async function createMetalEngine(params) {

    // Forziamo struttura power metal lunga
    params.structure = "standard";

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

    structure.sections.forEach(section => {

        const info = songProgressions[section.name];
        const progression = info.progression;
        const root = info.root;
        const scale = buildScaleFromTonic(root, metalParams.scaleType);
        
        
        // IMPORTANTE: qui NON scheduliamo nulla
        const riffResult = riff.scheduleSection(section, scale, progression);

// Aggiungiamo la sezione principale
enriched.push({
    type: "main",
    name: section.name,
    measures: section.measures,
    progression,
    scale,
    riffResult
});

// ------------------------------------------------------------
// CALCOLO DELLA TRANSIZIONE
// ------------------------------------------------------------

// 1) Nota finale della sezione corrente
const fromNote = riffResult.lastNote;

// 2) Nota iniziale della prossima sezione (se esiste)
const nextSection = structure.sections[structure.sections.indexOf(section) + 1];

if (nextSection) {
    const nextInfo = songProgressions[nextSection.name];
    const nextRoot = nextInfo.root;
    const nextScale = buildScaleFromTonic(nextRoot, metalParams.scaleType);

    // prima nota della prossima sezione = root della prossima sezione
    const toNote = nextRoot;

    // 3) Scegliamo la transizione in base alla distanza
    const transitionInfo = chooseTransitionByDistance(fromNote, toNote, rand);

    // 4) Costruiamo gli eventi della transizione
    const transition = buildTransitionEvents(
        fromNote,
        toNote,
        nextScale,
        transitionInfo,
        rand
    );

    // 5) Aggiungiamo la transizione alla timeline
    enriched.push({
        type: "transition",
        name: `transition_${section.name}`,
        transition
    });
}

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
    // TERZA PASSATA: schedulazione engine (ORA È SICURA)
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

            // STRUMENTO DELLA TRANSIZIONE
            if (t.instrument === "palm") {
                metalInstruments.guitarPalm.triggerAttackRelease(
                    ev.note + "2",
                    "16n",
                    time
                );
            }

            if (t.instrument === "mixed") {
                metalInstruments.guitarPalm.triggerAttackRelease(
                    ev.note + "2",
                    "16n",
                    time
                );
            }

            if (t.instrument === "lead") {
                metalInstruments.lead.triggerAttackRelease(
                    ev.note + "4",
                    "16n",
                    time
                );
            }

        }, eventTime);
    });

    // ---------------------------------------------------------
    // OPEN CHORD FINALE (solo per mixed e lead)
    // ---------------------------------------------------------
    if (t.instrument === "mixed" || t.instrument === "lead") {
        const finalEventTime = sec.startTime + (t.durationBeats - 0.5) * secondsPerBeat;

        Tone.Transport.schedule(time => {
            metalInstruments.guitarOpen.triggerAttackRelease(
                t.events[t.events.length - 1].note + "2",
                "1n",
                time
            );
        }, finalEventTime);
    }
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
