// metalDrums.js — batteria avanzata DNA-driven + build-up

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
            complexity > 0.4 ? 4 : 2;

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

        const nextStepData =
            timeline.getStepData(step + 1);

        const nextSection =
            nextStepData.section;

        // ------------------------------------------------
        // PRE-CHORUS BUILD-UP 🔥
        // ------------------------------------------------

        const isPreChorus =
            section !== "chorus" &&
            nextSection === "chorus";

        if (isPreChorus) {

            // ultimi 4 step → rullata crescente
            if (stepInMeasure >= stepsPerMeasure - 4) {

                const speed =
                    stepInMeasure === stepsPerMeasure - 1 ? 4 :
                    stepInMeasure === stepsPerMeasure - 2 ? 3 :
                    stepInMeasure === stepsPerMeasure - 3 ? 2 :
                    1;

                for (let i = 0; i < speed; i++) {

                    const offset = i * 0.03;

                    drums.player("snare").start(
                        humanizeTime(time + offset, rand),
                        0,
                        undefined,
                        0.7 + i * 0.1
                    );
                }

                // colpo finale kick
                if (stepInMeasure === stepsPerMeasure - 1) {
                    drums.player("kick").start(
                        humanizeTime(time, rand)
                    );
                }

                return; // IMPORTANTISSIMO
            }
        }

        // ------------------------------------------------
        // FILL LOGIC (NON interferisce col build-up)
        // ------------------------------------------------

        const isEndOfMeasure =
            stepInMeasure === stepsPerMeasure - 1;

        if (
            !isPreChorus &&
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
        // HI-HAT
        // ------------------------------------------------

        if (section !== "solo") {

            const isAccent =
                groovePattern[stepInMeasure];

            const hatChance =
                section === "chorus"
                    ? 1
                    : (isAccent ? 1 : 0.6);

            if (rand() < hatChance) {

                const openHat =
                    section === "chorus"
                        ? rand() < 0.5
                        : (aggression > 0.7 && rand() < 0.25);

                const hatType =
                    openHat ? "openhat" : "hihat";

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
        // SNARE
        // ------------------------------------------------

        if (
            stepInMeasure === Math.floor(stepsPerMeasure / 2) ||
            (section === "chorus" &&
             stepInMeasure === Math.floor(stepsPerMeasure * 0.75))
        ) {

            drums.player("snare").start(
                humanizeTime(time, rand)
            );
        }

        // ------------------------------------------------
        // KICK
        // ------------------------------------------------

        let kick = false;

        // base groove
        if (groovePattern[stepInMeasure]) {
            kick = true;
        }

        if (riffNote && rand() < (0.5 + aggression * 0.3)) {
            kick = true;
        }

        if (rand() < (0.15 + aggression * 0.2)) {
            kick = true;
        }

        // 🔥 CHORUS POWER MODE
        if (section === "chorus") {

            if (step % 2 === 0) {
                kick = true;
            }

            if (groovePattern[stepInMeasure]) {
                kick = true;
            }

            if (rand() < (0.3 + aggression * 0.4)) {
                kick = true;
            }
        }

        if (section === "intro" && stepInMeasure === 0) {
            kick = true;
        }

        if (section === "solo" && step % 2 === 0) {
            kick = true;
        }

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