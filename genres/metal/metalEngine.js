// metalEngine.js — versione 022
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
import { initKeyboardEngine } from "./keyboardEngine.js";
import { pickTransition } from "./transitionEngine.js";
import { pickDrumPattern, generateDrumEvents } from "./transitionDrumEngine.js";
import { pickKeyboardPattern, generateKeyboardEvents } from "./transitionKeyboardEngine.js";

import { generateSongProgressions } from "./metalTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 022 loaded");

// ============================================================
// 🎧 LOADER STRUMENTI METAL
// ============================================================

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

// ============================================================
// 🎼 NORMALIZZAZIONE NOTE PER STRUMENTO
// ============================================================

export function normalizeNote(note, instrument) {
    if (!note || typeof note !== "string") return "A";

    const first = note[0].toUpperCase();
    const second = note[1];

    // ---------------------------------------------------------
    // 1) CHITARRE RITMICHE (solo naturali)
    // ---------------------------------------------------------
    if (instrument === "guitarPalm" || instrument === "guitarOpen") {
        return first;
    }

    // ---------------------------------------------------------
    // 2) LEAD E BASSO (naturali + bemolle, NO diesis)
    // ---------------------------------------------------------
    if (instrument === "guitarLead" || instrument === "bass") {

        if (second === "b") return first + "b";

        if (second === "#") {
            const sharpToFlat = {
                "C#": "Db",
                "D#": "Eb",
                "F#": "Gb",
                "G#": "Ab",
                "A#": "Bb"
            };
            return sharpToFlat[first + "#"] ?? first;
        }

        return first;
    }

    // ---------------------------------------------------------
    // 3) SYNTH / TASTIERE (accettano tutto)
    // ---------------------------------------------------------
    if (second === "#" || second === "b") {
        return first + second;
    }

    return first;
}

// ============================================================
// NORMALIZZAZIONE STRUTTURA
// ============================================================

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

    params.structure = "standard";

    const rand = createSeededRandom(params.dna);
    const metalParams = buildPowerMetalParams(rand);

    Tone.Transport.bpm.value = metalParams.bpm;
    const secondsPerBeat = 60 / metalParams.bpm;

    const structurePreset = normalizeStructurePreset(params.structure);
    const structure = buildSongStructure(structurePreset, metalParams.bpm);

    const songProgressions = generateSongProgressions(
        structure,
        params.imageParams,
        metalParams.tonalCenter,
        rand
    );

    const riff  = initRiffEngine(metalInstruments, metalParams, rand, { enableLog: true });
    const lead  = initLeadEngine(metalInstruments, metalParams, rand);
    const bass  = initBassEngine(metalInstruments, metalParams, rand);
    const drums = initDrumEngine(metalInstruments, metalParams, rand);
    const theme = initThemeEngine(metalParams, params.imageParams, rand);
    const keyboard = initKeyboardEngine(metalInstruments, metalParams, rand, params.imageParams);

    // ============================================================
    // PRIMA PASSATA: costruzione sezioni + transizioni
    // ============================================================

    const enriched = [];

    structure.sections.forEach(section => {

        const info = songProgressions[section.name];
        const progression = info.progression;
        const root = info.root;
        const scale = buildScaleFromTonic(root, metalParams.scaleType);

        const riffResult = riff.scheduleSection(section, scale, progression);

        enriched.push({
            type: "main",
            name: section.name,
            measures: section.measures,
            progression,
            scale,
            riffResult
        });

        function toLetter(n) {
            return typeof n === "string" ? n[0] : null;
        }

        const fromNote = toLetter(riffResult.lastNote);
        const nextSection = structure.sections[structure.sections.indexOf(section) + 1];

        if (nextSection) {
            const nextInfo = songProgressions[nextSection.name];
            const nextRoot = nextInfo.root;
            const nextScale = buildScaleFromTonic(nextRoot, metalParams.scaleType);

            const toNote = toLetter(nextRoot);

            const transitionModule = pickTransition(
                fromNote,
                toNote,
                nextScale,
                params.imageParams,
                rand
            );

            const transition = transitionModule.generate(
                fromNote,
                toNote,
                nextScale,
                rand
            );

            enriched.push({
                type: "transition",
                name: `transition_${section.name}`,
                transition,
                instrument: transitionModule.instrument,
                scale: nextScale,
                progression: [nextRoot]
            });
        }
    });

    // ============================================================
    // SECONDA PASSATA: startTime / endTime
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
    // TERZA PASSATA: SCHEDULAZIONE
    // ============================================================

    Tone.Transport.cancel(0);

    enriched.forEach(sec => {

        // ============================================================
        // SEZIONI PRINCIPALI
        // ============================================================
        if (sec.type === "main") {

            riff.scheduleSection(sec, sec.scale, sec.progression);

            const normalizedRiffEvents = sec.riffResult.events.map(ev => ({
                ...ev,
                note: normalizeNote(ev.note, "bass")
            }));

            bass.scheduleSection(sec, sec.scale, sec.progression, normalizedRiffEvents);

            // THEME ENGINE
            let themeEvents = null;

            if (sec.name === "intro" || sec.name === "outro") {

                themeEvents = theme.generateTheme(
                    sec,
                    sec.scale,
                    sec.progression
                );

                themeEvents.forEach(ev => {

                    const riffStart = sec.riffResult.startTimeReal ?? sec.startTime;
                    const eventTime = riffStart + ev.beatOffset * secondsPerBeat;

                    Tone.Transport.schedule(time => {

                        const ln = normalizeNote(ev.note, "guitarLead");

                        metalInstruments.guitarLead.triggerAttackRelease(
                            ln + "4",
                            ev.duration,
                            time,
                            ev.velocity
                        );

                    }, eventTime);
                });
            }

            // KEYBOARD ENGINE
            const pureScaleMain = sec.scale.map(n => normalizeNote(n, "keyboardLead"));

            keyboard.scheduleKeyboard(
                sec,
                pureScaleMain,
                sec.riffResult.events,
                themeEvents
            );

            // DRUMS
            drums.scheduleSection(
                sec,
                sec.scale,
                sec.progression,
                sec.riffResult.events,
                themeEvents
            );

        }

        // ============================================================
        // TRANSIZIONI
        // ============================================================
        else {

            const t = sec.transition;
            const instrument = sec.instrument;

            // 1) Tastiera transizione
            const kbPattern = pickKeyboardPattern(instrument, params.imageParams, rand);
            const pureScale = sec.scale.map(n => normalizeNote(n, "keyboardLead"));
            const kbLayer = generateKeyboardEvents(kbPattern, pureScale, t.durationBeats, rand);

            // 2) Batteria transizione
            const drumPattern = pickDrumPattern(instrument, params.imageParams, rand);
            const drumLayer = generateDrumEvents(drumPattern, t.durationBeats, rand);

            // 3) Eventi principali
            t.events.forEach(ev => {

                const eventTime = sec.startTime + ev.beatOffset * secondsPerBeat;

                Tone.Transport.schedule(time => {

                    if (instrument === "drums" && ev.drum) {
                        metalInstruments.drums.player(ev.drum).start(time);
                    }

                    if (instrument === "bass" && ev.note) {
                        const n = normalizeNote(ev.note, "bass");
                        metalInstruments.bass.triggerAttackRelease(n + "2", "16n", time);
                    }

                    if ((instrument === "palm" || instrument === "mixed") && ev.note) {
                        const n = normalizeNote(ev.note, "guitarPalm");
                        metalInstruments.guitarPalm.triggerAttackRelease(n + "2", "16n", time);
                    }

                    if (ev.note && instrument !== "bass") {
                        const nb = normalizeNote(ev.note, "bass");
                        metalInstruments.bass.triggerAttackRelease(nb + "2", "16n", time);
                    }

                }, eventTime);
            });

            // 4) Layer tastiera
            kbLayer.events.forEach(e => {
                const kbTime = sec.startTime + e.beatOffset * secondsPerBeat;

                Tone.Transport.schedule(time => {
                    metalInstruments.keyboardLead.triggerAttackRelease(
                        e.note,
                        "16n",
                        time,
                        e.velocity
                    );
                }, kbTime);
            });

            // 5) Layer batteria
            drumLayer.events.forEach(d => {
                const drumTime = sec.startTime + d.beatOffset * secondsPerBeat;

                Tone.Transport.schedule(time => {
                    metalInstruments.drums.player(d.drum).start(time);
                }, drumTime);
            });

            // 6) Open chord finale
            if (instrument === "mixed" || instrument === "lead") {

                const finalEventTime =
                    sec.startTime + (t.durationBeats - 0.5) * secondsPerBeat;

                const finalNote = normalizeNote(
                    t.events[t.events.length - 1].note,
                    "guitarOpen"
                );

                Tone.Transport.schedule(time => {
                    metalInstruments.guitarOpen.triggerAttackRelease(
                        finalNote + "2",
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

        seek(s) {
            Tone.Transport.seconds = s;
        }
    };
}
