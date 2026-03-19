//
// drumEngine.js
// Motore batteria power metal.
// Nessuna logica di routing. Nessuna logica di strumenti.
// Solo scheduling di sample + groove + double kick.
//

import * as Tone from "https://esm.sh/tone";

import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("drumEngine.js loaded");

// ============================================================
// 🎧 INIZIALIZZAZIONE
// ============================================================

export function initDrumEngine(instruments, params, rand, structure) {

    const { drums } = instruments;

    // --------------------------------------------------------
    // 1) Funzioni di utilità
    // --------------------------------------------------------

    function play(sample, time) {
        drums.player(sample).start(time);
    }

    function chance(p) {
        return rand() < p;
    }

    // --------------------------------------------------------
    // 2) Pattern base
    // --------------------------------------------------------

    function scheduleKick(t) {
        play("kick", t);
    }

    function scheduleSnare(t) {
        play("snare", t);
    }

    function scheduleGhost(t) {
        play("ghost", t);
    }

    function scheduleHiHat(t) {
        play("hihat", t);
    }

    function scheduleOpenHat(t) {
        play("openhat", t);
    }

    function scheduleCrash(t) {
        play(rand() < 0.5 ? "crash1" : "crash2", t);
    }

    function scheduleRide(t) {
        play("ride", t);
    }

    function scheduleRideBell(t) {
        play("ridebell", t);
    }

    function scheduleChina(t) {
        play("china", t);
    }

    // --------------------------------------------------------
    // 3) Double kick (power metal)
    // --------------------------------------------------------

    function scheduleDoubleKick(section) {
        const timeline = buildSectionTimeline(section, "16n");

        timeline.forEach((t, i) => {
            if (i % 2 === 0) {
                scheduleKick(t);
            }
        });
    }

    // --------------------------------------------------------
    // 4) Groove standard (kick + snare + hihat)
    // --------------------------------------------------------

    function scheduleGroove(section) {
        const timeline = buildSectionTimeline(section, "8n");

        timeline.forEach((t, i) => {

            // Kick on 1 and 3
            if (i % 2 === 0) scheduleKick(t);

            // Snare on 2 and 4
            if (i % 2 === 1) scheduleSnare(t);

            // Hi-hat every 8th
            scheduleHiHat(t);

            // Ghost notes occasionali
            if (chance(0.1 * params.drumIntensity)) {
                scheduleGhost(t + duration("16n"));
            }
        });
    }

    // --------------------------------------------------------
    // 5) Chorus: crash + ride
    // --------------------------------------------------------

    function scheduleChorus(section) {
        const timeline = buildSectionTimeline(section, "4n");

        timeline.forEach((t, i) => {

            // Crash all'inizio
            if (i === 0) scheduleCrash(t);

            // Ride su ogni quarto
            scheduleRide(t);

            // Kick doppia cassa
            scheduleKick(t);
            scheduleKick(t + duration("16n"));
        });
    }

    // --------------------------------------------------------
    // 6) Solo: groove leggero + ride bell
    // --------------------------------------------------------

    function scheduleSolo(section) {
        const timeline = buildSectionTimeline(section, "8n");

        timeline.forEach((t, i) => {

            // Kick semplice
            if (i % 2 === 0) scheduleKick(t);

            // Snare leggero
            if (i % 2 === 1) scheduleSnare(t);

            // Ride bell
            scheduleRideBell(t);

            // Ghost notes
            if (chance(0.2)) scheduleGhost(t + duration("16n"));
        });
    }

    // --------------------------------------------------------
    // 7) Outro: china + tom fill
    // --------------------------------------------------------

    function scheduleOutro(section) {
        const timeline = buildSectionTimeline(section, "4n");

        timeline.forEach((t, i) => {

            // China su ogni battuta
            scheduleChina(t);

            // Fill di tom occasionali
            if (chance(0.3)) {
                const tom = "tom" + (1 + Math.floor(rand() * 4));
                play(tom, t + duration("8n"));
            }
        });
    }

    // ============================================================
    // 🎵 SCHEDULING COMPLETO
    // ============================================================

    function schedule() {

        structure.sections.forEach(section => {

            if (section.name === "intro") {
                scheduleGroove(section);
                return;
            }

            if (section.name === "verse") {
                if (params.drumStyle === "doubleKick") {
                    scheduleDoubleKick(section);
                } else {
                    scheduleGroove(section);
                }
                return;
            }

            if (section.name === "chorus") {
                scheduleChorus(section);
                return;
            }

            if (section.name === "solo") {
                scheduleSolo(section);
                return;
            }

            if (section.name === "outro") {
                scheduleOutro(section);
                return;
            }
        });
    }

    // ============================================================
    // EXPORT ENGINE
    // ============================================================

    return {
        schedule
    };
}
