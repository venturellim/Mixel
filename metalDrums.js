// metalDrums.js — batteria avanzata DNA-driven

import { drums, humanizeTime } from "./common.js";
import * as Tone from "https://esm.sh/tone";

console.log("metalDrums.js loaded");

export function createDrumEngine(analysis, params, timeline, riffData, rand) {

    const fullRiff = riffData.fullRiff;
    const totalSteps = riffData.totalSteps;

    const brightness = analysis.brightness || 0.5;
    const complexity = analysis.complexity || 0.5;

    const aggression =
        (complexity * 0.6) +
        ((1 - brightness) * 0.4);

    const { stepsPerMeasure } = timeline;

    // ------------------------------------------------------------
    // DNA RHYTHM PATTERN
    // ------------------------------------------------------------

    function generateRhythmPattern(dna, stepsPerMeasure) {

        const pattern = [];

        for (let i = 0; i < stepsPerMeasure; i++) {

            const bit = (dna >> i) & 1;
            pattern.push(bit === 1);

        }

        return pattern;
    }

    const groovePattern =
        generateRhythmPattern(
            analysis.dna || 123456,
            stepsPerMeasure
        );

    // ------------------------------------------------------------
    // FILL
    // ------------------------------------------------------------

    function playFill(time) {

        const hits =
            complexity > 0.7 ? 6 :
            complexity > 0.4 ? 4 :
            2;

        for (let i = 0; i < hits; i++) {

            const offset = i * 0.05;

            const drumType =
                rand() < 0.5 ? "snare" :
                rand() < 0.5 ? "tom1" : "tom2";

            const velocity =
                0.7 + rand() * 0.3;

            drums.player(drumType).start(
                humanizeTime(time + offset, rand),
                0,
                undefined,
                velocity
            );

        }
    }

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------

    return function drumEngine(time, step) {

        const idx = step % totalSteps;
        const riffNote = fullRiff[idx];

        const { stepInMeasure, section } =
            timeline.getStepData(step);

        // ------------------------------------------------
        // FILL LOGIC
        // ------------------------------------------------

        const isEndOfMeasure =
            stepInMeasure === stepsPerMeasure - 1;

        const nextStepData =
            timeline.getStepData(step + 1);

        const nextSection =
            nextStepData.section;

        if (
            isEndOfMeasure &&
            (
                section !== nextSection ||
                rand() < (0.2 + complexity * 0.3)
            )
        ) {

            playFill(time);
            return;

        }

        // ------------------------------------------------
        // HI-HAT INTELLIGENTE
        // ------------------------------------------------

        if (section !== "solo") {

            const isAccent =
                groovePattern[stepInMeasure];

            const hatChance =
                isAccent ? 1 : 0.6;

            if (rand() < hatChance) {

                const openHat =
                    (section === "chorus" && rand() < 0.3) ||
                    (aggression > 0.7 && rand() < 0.25);

                const hatType =
                    openHat ? "hihat_open" : "hihat";

                const velocity =
                    isAccent
                        ? 1.0
                        : 0.6 + rand() * 0.3;

                drums.player(hatType).start(
                    humanizeTime(time, rand),
                    0,
                    undefined,
                    velocity
                );

            }
        }

        // ------------------------------------------------
        // RIDE (SOLO)
        // ------------------------------------------------

        if (section === "solo") {

            if (step % 2 === 0) {

                drums.player("ride").start(
                    humanizeTime(time, rand)
                );

            }
        }

        // ------------------------------------------------
        // SNARE BACKBEAT
        // ------------------------------------------------

        if (
            stepInMeasure ===
            Math.floor(stepsPerMeasure / 2)
        ) {

            drums.player("snare").start(
                humanizeTime(time, rand)
            );

        }

        // ------------------------------------------------
        // KICK DNA GROOVE
        // ------------------------------------------------

        let kick = false;

        // groove DNA
        if (groovePattern[stepInMeasure]) {
            kick = true;
        }

        // segue riff (rafforza)
        if (riffNote && rand() < (0.5 + aggression * 0.3)) {
            kick = true;
        }

        // variazione umana
        if (rand() < (0.15 + aggression * 0.2)) {
            kick = true;
        }

        // rinforzi musicali

        if (section === "chorus") {
            kick = true;
        }

        if (section === "intro" && stepInMeasure === 0) {
            kick = true;
        }

        if (section === "solo" && step % 2 === 0) {
            kick = true;
        }

        // trigger
        if (kick) {

            drums.player("kick").start(
                humanizeTime(time, rand)
            );

        }

        // ------------------------------------------------
        // CRASH
        // ------------------------------------------------

        if (stepInMeasure === 0) {

            if (
                section === "chorus" ||
                section === "outro" ||
                (aggression > 0.7 && rand() < 0.3)
            ) {

                drums.player("crash1").start(
                    humanizeTime(time, rand)
                );

            }
        }

    };
}