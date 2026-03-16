// metalDrums.js — batteria sincronizzata con metalTimeline

import { drums, humanizeTime } from "./common.js";
import * as Tone from "https://esm.sh/tone";

console.log("metalDrums.js loaded");

export function createDrumEngine(analysis, params, timeline, riffData, rand) {

    const brightness = analysis.brightness || 0.5;
    const complexity = analysis.complexity || 0.5;

    const aggression =
        (complexity * 0.6) +
        ((1 - brightness) * 0.4);

    const { stepsPerMeasure, totalSteps } = timeline;

    return function drumEngine(time, step) {

        const idx = step % totalSteps;

        const riffNote =
            riffData.fullRiff[idx];

        const { stepInMeasure, section } =
            timeline.getStepData(step);

        // ------------------------------------------------
        // HIHAT BASE
        // ------------------------------------------------

        if (section !== "solo") {

            const hatDensity =
                aggression > 0.6 ? 1 : 2;

            if (step % hatDensity === 0) {

                drums.player("hihat").start(
                    humanizeTime(time, rand)
                );

            }

        }

        // ------------------------------------------------
        // RIDE NEL SOLO
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
        // KICK
        // ------------------------------------------------

        if (section === "chorus") {

            if (
                riffNote &&
                rand() < (0.6 + aggression * 0.4)
            ) {

                drums.player("kick").start(
                    humanizeTime(time, rand)
                );

            }

        }

        else if (section === "verse") {

            if (
                stepInMeasure === 0 ||
                stepInMeasure === 4 ||
                stepInMeasure === 8
            ) {

                drums.player("kick").start(
                    humanizeTime(time, rand)
                );

            }

        }

        else if (section === "solo") {

            if (step % 2 === 0) {

                drums.player("kick").start(
                    humanizeTime(time, rand)
                );

            }

        }

        else if (section === "intro") {

            if (stepInMeasure === 0) {

                drums.player("kick").start(
                    humanizeTime(time, rand)
                );

            }

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