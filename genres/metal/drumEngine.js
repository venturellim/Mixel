//
// drumEngine.js
// Motore batteria power metal.
//

import * as Tone from "https://esm.sh/tone";

import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("drumEngine.js loaded");

export function initDrumEngine(instruments, params, rand, structure) {

    const { drums } = instruments;

    function play(sample, time) {
        drums.player(sample).start(time);
    }

    function chance(p) {
        return rand() < p;
    }

    // --------------------------------------------------------
    // Scheduling corretto (tutto sul Transport)
    // --------------------------------------------------------

    function scheduleKick(t) {
        Tone.Transport.schedule((time) => play("kick", time), t);
    }

    function scheduleSnare(t) {
        Tone.Transport.schedule((time) => play("snare", time), t);
    }

    function scheduleGhost(t) {
        Tone.Transport.schedule((time) => play("ghost", time), t);
    }

    function scheduleHiHat(t) {
        Tone.Transport.schedule((time) => play("hihat", time), t);
    }

    function scheduleOpenHat(t) {
        Tone.Transport.schedule((time) => play("openhat", time), t);
    }

    function scheduleCrash(t) {
        const sample = rand() < 0.5 ? "crash1" : "crash2";
        Tone.Transport.schedule((time) => play(sample, time), t);
    }

    function scheduleRide(t) {
        Tone.Transport.schedule((time) => play("ride", time), t);
    }

    function scheduleRideBell(t) {
        Tone.Transport.schedule((time) => play("ridebell", time), t);
    }

    function scheduleChina(t) {
        Tone.Transport.schedule((time) => play("china", time), t);
    }

    // --------------------------------------------------------
    // Double kick
    // --------------------------------------------------------

    function scheduleDoubleKick(section) {
        const timeline = buildSectionTimeline(section, "16n");

        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
        });
    }

    // --------------------------------------------------------
    // Groove standard
    // --------------------------------------------------------

    function scheduleGroove(section) {
        const timeline = buildSectionTimeline(section, "8n");

        timeline.forEach((t, i) => {

            if (i % 2 === 0) scheduleKick(t);
            if (i % 2 === 1) scheduleSnare(t);

            scheduleHiHat(t);

            if (chance(0.1 * params.drumIntensity)) {
                const ghostT = t + duration("16n");
                scheduleGhost(ghostT);
            }
        });
    }

    // --------------------------------------------------------
    // Chorus
    // --------------------------------------------------------

    function scheduleChorus(section) {
        const timeline = buildSectionTimeline(section, "4n");

        timeline.forEach((t, i) => {

            if (i === 0) scheduleCrash(t);

            scheduleRide(t);

            scheduleKick(t);
            scheduleKick(t + duration("16n"));
        });
    }

    // --------------------------------------------------------
    // Solo
    // --------------------------------------------------------

    function scheduleSolo(section) {
        const timeline = buildSectionTimeline(section, "8n");

        timeline.forEach((t, i) => {

            if (i % 2 === 0) scheduleKick(t);
            if (i % 2 === 1) scheduleSnare(t);

            scheduleRideBell(t);

            if (chance(0.2)) {
                scheduleGhost(t + duration("16n"));
            }
        });
    }

    // --------------------------------------------------------
    // Outro
    // --------------------------------------------------------

    function scheduleOutro(section) {
        const timeline = buildSectionTimeline(section, "4n");

        timeline.forEach((t, i) => {

            scheduleChina(t);

            if (chance(0.3)) {
                const tom = "tom" + (1 + Math.floor(rand() * 4));
                scheduleKick(t); // optional: keep kick
                Tone.Transport.schedule((time) => play(tom, time), t + duration("8n"));
            }
        });
    }

    // --------------------------------------------------------
    // Scheduling completo
    // --------------------------------------------------------

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

    return {
        schedule
    };
}
