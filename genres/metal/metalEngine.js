// metalEngine.js — versione 018
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

import 
{ generateSongProgressions } from "./metalTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("metalEngine.js ver. 023.1 loaded");

// ============================================================
// 🎧 LOADER STRUMENTI METAL
// ============================================================

export async function waitMetalInstruments() {
    await waitForInstruments(4);
}

export function normalizeNote(note, instrument) {
    if (!note || typeof note !== "string") return "A";

    const first = note[0].toUpperCase();
    const second = note[1];

    // ---------------------------------------------------------
    // 1) CHITARRE RITMICHE (solo naturali)
    // ---------------------------------------------------------
    if (instrument === "guitarPalm" || instrument === "guitarOpen") {
        return first; // ignoriamo # e b
    }

    // ---------------------------------------------------------
    // 2) LEAD E BASSO (naturali + bemolle, NO diesis)
    // ---------------------------------------------------------
    if (instrument === "guitarLead" || instrument === "bass") {

        // caso bemolle → ok
        if (second === "b") return first + "b";

        // caso diesis → convertiamo in bemolle
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

        // caso naturale
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
    const bass = initBassEngine(metalInstruments, params, rand);
    const drums = initDrumEngine(metalInstruments, metalParams, rand);
    const theme = initThemeEngine(metalParams, params.imageParams, rand);
    const keyboard = initKeyboardEngine(metalInstruments, metalParams, rand, params.imageParams);

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
    subsections: (section.measures >= 8)
        ? [
            { start: 0, measures: section.measures / 2 },
            { start: section.measures / 2, measures: section.measures / 2 }
          ]
        : [
            { start: 0, measures: section.measures }
          ],

   // Riff mute: solo intro e verse, probabilità 50%
   riffMute: (section.name === "intro" || section.name === "verse")
       ? (rand() < 0.5 ? 1 : 0)
       : 0,

    progression,
    scale,
    riffResult
});



        // ------------------------------------------------------------
        // CALCOLO DELLA TRANSIZIONE
        // ------------------------------------------------------------

        function toLetter(n) {
            return typeof n === "string" ? n[0] : null;
        }

        // 1) Nota finale della sezione corrente
        const fromNote = toLetter(riffResult.lastNote);   

        // 2) Nota iniziale della prossima sezione (se esiste)
        const nextSection = structure.sections[structure.sections.indexOf(section) + 1];

        if (nextSection) {
            const nextInfo = songProgressions[nextSection.name];
            const nextRoot = nextInfo.root;
            const nextScale = buildScaleFromTonic(nextRoot, metalParams.scaleType);

            // prima nota della prossima sezione = root della prossima sezione
            const toNote   = toLetter(nextRoot);

            // 3) Scegliamo la transizione in base alla distanza
            
            console.log(
                "%c[TRANSITION DEBUG] from → to:", 
                "color:#00aaff; font-weight:bold;", 
                fromNote, "→", toNote
            );

            const transitionModule = pickTransition(fromNote, toNote, nextScale, params.imageParams, rand);

            console.log(
                "%c[TRANSITION DEBUG] chosen:", 
                "color:#00aaff; font-weight:bold;", 
                transitionModule
            );

            // 4) Costruiamo gli eventi della transizione
            const transition = transitionModule.generate(fromNote, toNote, nextScale, rand);

            // 5) Aggiungiamo la transizione alla timeline
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
    
    function shouldKeyboardPlay(section, imageParams) {
        const energy = imageParams?.energy ?? 0.5;
        const darkness = imageParams?.texture ?? 0.5;
        const complexity = imageParams?.complexity ?? 0.5;

        // Sempre nel solo
        if (section.name === "solo") return true;

        // Intro/outro → tastiera se non c’è theme
        if ((section.name === "intro" || section.name === "outro") && complexity > 0.4) {
            return true;
        }

        // Verse/chorus → tastiera se foto lo suggerisce
        if (energy > 0.7 || complexity > 0.7) return true;

        // Foto molto luminosa → tastiera melodica
        if (darkness < 0.3) return true;

        return false;
    }

function pickKeyboardPatternForSubsection(sectionName, index, imageParams, rand) {

    // pattern base della sezione
    const base = pickKeyboardPattern(sectionName, imageParams, rand);

    // prima metà → pattern base
    if (index === 0) return base;

    // seconda metà → 30% stesso pattern, 70% diverso
    if (rand() < 0.3) return base;

    const allPatterns = ["arp_up", "arp_down", "scale_run", "fanfare", "cluster"];
    const alternatives = allPatterns.filter(p => p !== base);

    return alternatives[Math.floor(rand() * alternatives.length)];
}


    function pickTransitionDrumPattern(instrument, imageParams, rand) {

        const energy = imageParams?.energy ?? 0.5;
        const complexity = imageParams?.complexity ?? 0.5;

        // 1) Transizioni keyboard → Tom Run
        if (instrument === "keyboard") return "tom_run";

        // 2) Transizioni lead → Blast Fill
        if (instrument === "lead") return "blast_fill";

        // 3) Palm/Mixed → Double Kick o Accent
        if (instrument === "palm" || instrument === "mixed") {
            return rand() > 0.4 ? "double_kick" : "double_kick_accent";
        }

        // 4) Bass → Ride Power
        if (instrument === "bass") return "ride_power";

        // 5) Drums → usa il pattern nativo
        if (instrument === "drums") return "native";

        // Default
        return "double_kick";
    }

    // ============================================================
    // TERZA PASSATA: schedulazione engine (ORA È SICURA)
    // ============================================================

    Tone.Transport.cancel(0);

    enriched.forEach(sec => {

        if (sec.type === "main") {

            if (sec.riffMute === 0) {
    riff.scheduleSection(sec, sec.scale, sec.progression);
}
            
   const riffPattern = sec.riffResult?.dominantPattern;
const bassPattern = bass.pickBassPatternForSubsection(riffPattern, sec.riffMute);
const pureScaleBass = sec.scale.map(n => normalizeNote(n, "bass"));

bass.scheduleBassSubsection(
    sec,
    pureScaleBass,
    sec.riffResult.events,
    themeEvents,
    subStart,
    sub.measures,
    bassPattern
);


if (bassPattern === "followRiff") {

    bass.scheduleSection(
        sec,
        sec.scale,
        sec.progression,
        sec.riffResult.events.map(ev => ({
            ...ev,
            note: normalizeNote(ev.note, "bass")
        }))
    );

} else {

    const events = bass.generateIndependentBass(
        bassPattern,
        sec.scale,
        sec.measures,
        rand
    );

    bass.scheduleIndependent(sec, events);
}


            // THEME ENGINE (solo intro/outro)
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
                        try {
                            console.log(
                                "%c[THEME PLAY] lead →",
                                "color:#ff8800; font-weight:bold;",
                                ev.note,
                                "@",
                                eventTime,
                                "dur:",
                                ev.duration,
                                "vel:",
                                ev.velocity
                            );

                            // ❗ Filtro anti-note invalide
                            if (
                                !ev.note ||
                                typeof ev.note !== "string" ||
                                !/^[A-G](b)?4$/.test(ev.note)
                            ) {
                                console.warn("[THEME WARNING] nota invalida, skip:", ev);
                                return;
                            }

                            metalInstruments.guitarLead.triggerAttackRelease(
                                normalizeNote(ev.note, "guitarLead") + "4",
                                ev.duration,
                                time,
                                ev.velocity
                            );

                        } catch (e) {
                            console.error("🔥 THEME ERROR in callback:", e, "event:", ev);
                        }
                    }, eventTime);
                });
            }

            const riffAnalysis = {
                dominantPattern: sec.riffResult.dominantPattern ?? "pedal_8n",
                palmRatio: sec.riffResult.palmRatio ?? 0.5
            };

            // KEYBOARD ENGINE (foto-driven)
            if (shouldKeyboardPlay(sec, params.imageParams)) {

   sec.subsections.forEach((sub, i) => {

       const subStart = sec.startTime + sub.start * 4 * secondsPerBeat;

       const pattern = pickKeyboardPatternForSubsection(
           sec.name,
           i,
           params.imageParams,
           rand
       );

       const pureScale = sec.scale.map(n => normalizeNote(n, "keyboardLead"));

const riffPattern = sec.riffResult?.dominantPattern;
const kbPattern = keyboard.pickKeyboardPatternForSubsection(riffPattern);

       keyboard.scheduleKeyboardSubsection(
           sec,
           pureScale,
           sec.riffResult.events,
           themeEvents,
           subStart,
           sub.measures,
           kbPattern
       );
   });
}
            drums.scheduleSection(
                sec,
                sec.scale,
                sec.progression,
                sec.riffResult.events,
                themeEvents
            );
   
            // lead.scheduleSection(sec, sec.scale, sec.progression);

        } 
        // ==========================================================
        // TRANSIZIONI
        // ==========================================================
        else {

            const t = sec.transition;
            const instrument = sec.instrument;

            // ---------------------------------------------------------
            // 1) GENERAZIONE PATTERN TASTIERA (UNA VOLTA SOLA)
            // ---------------------------------------------------------
            const kbPattern = pickKeyboardPattern(instrument, params.imageParams, rand);
            const pureScale = sec.scale.map(n => normalizeNote(n, "keyboardLead"));
            const kbLayer = generateKeyboardEvents(kbPattern, pureScale, t.durationBeats, rand);

            // ---------------------------------------------------------
            // 2) GENERAZIONE PATTERN BATTERIA (UNA VOLTA SOLA)
            // ---------------------------------------------------------
            const drumPattern = pickDrumPattern(instrument, params.imageParams, rand);
            const drumLayer = generateDrumEvents(drumPattern, t.durationBeats, rand);

            // ---------------------------------------------------------
            // 3) SCHEDULAZIONE EVENTI PRINCIPALI DELLA TRANSIZIONE
            // ---------------------------------------------------------
            t.events.forEach(ev => {
                const eventTime = sec.startTime + ev.beatOffset * secondsPerBeat;

                Tone.Transport.schedule(time => {

                    // STRUMENTO PRINCIPALE DELLA TRANSIZIONE

                    // DRUMS (transizione drums)
                    if (instrument === "drums" && ev.drum) {
                        metalInstruments.drums.player(ev.drum).start(time);
                    }

                    // BASS (transizione bass)
                    if (instrument === "bass" && ev.note) {
                        metalInstruments.bass.triggerAttackRelease(
                            normalizeNote(ev.note, "bass") + "2",
                            "16n",
                            time
                        );
                    }

                    // PALM / MIXED (chitarra ritmica)
                    if ((instrument === "palm" || instrument === "mixed") && ev.note) {
                        metalInstruments.guitarPalm.triggerAttackRelease(
                            normalizeNote(ev.note, "guitarPalm") + "2",
                            "16n",
                            time
                        );
                    }

                    // LEAD → NON SUONA MAI NELLE TRANSIZIONI

                    // FULL BAND: BASSO SOTTO TUTTO
                    if (ev.note && instrument !== "bass") {
                        metalInstruments.bass.triggerAttackRelease(
                            normalizeNote(ev.note, "bass") + "2",
                            "16n",
                            time
                        );
                    }

                }, eventTime);
            });

            // ---------------------------------------------------------
            // 4) SCHEDULAZIONE LAYER TASTIERA (Transition Keyboard Engine)
            // ---------------------------------------------------------
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

            // ---------------------------------------------------------
            // 5) SCHEDULAZIONE LAYER BATTERIA (Transition Drum Engine)
            // ---------------------------------------------------------
            drumLayer.events.forEach(d => {
                const drumTime = sec.startTime + d.beatOffset * secondsPerBeat;

                Tone.Transport.schedule(time => {
                    metalInstruments.drums.player(d.drum).start(time);
                }, drumTime);
            });

            // ---------------------------------------------------------
            // 6) OPEN CHORD FINALE (solo per mixed e lead)
            // ---------------------------------------------------------
            if (instrument === "mixed" || instrument === "lead") {

                const finalEventTime =
                    sec.startTime + (t.durationBeats - 0.5) * secondsPerBeat;

                Tone.Transport.schedule(time => {
                    metalInstruments.guitarOpen.triggerAttackRelease(
                        normalizeNote(t.events[t.events.length - 1].note, "guitarOpen") + "2",
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
            // Riattiva il padBus
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