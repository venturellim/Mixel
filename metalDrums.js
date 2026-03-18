// metalDrums.js — batteria evoluta con fill e transizioni

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

    let lastSection = null;

    return function drumEngine(time, step) {

        const idx = step % totalSteps;

        const riffNote =
            riffData.fullRiff[idx];

        const { stepInMeasure, section } =
            timeline.getStepData(step);

        const isNewSection = section !== lastSection;

        // ------------------------------------------------
        // 🎯 FILL CAMBIO SEZIONE
        // ------------------------------------------------

        if (isNewSection) {

            // crash + kick subito
            drums.player("crash1").start(time);
            drums.player("kick").start(time);

            // rullata veloce
            for (let i = 0; i < 4; i++) {
                drums.player("snare").start(
                    time + i * Tone.Time("16n").toSeconds()
                );
            }

            // tom fill (se esistono)
            const toms = ["tom1", "tom2", "tom3"];

            toms.forEach((tom, i) => {
                if (drums._players && drums._players.get(tom)) {
                    drums.player(tom).start(
                        time + (i + 4) * Tone.Time("16n").toSeconds()
                    );
                }
            });

            lastSection = section;
            return; // evita sovrapposizioni strane
        }

        // ------------------------------------------------
        // HIHAT
        // ------------------------------------------------

        if (section !== "solo") {

            const hatDensity =
                aggression > 0.6 ? 1 : 2;

            if (step % hatDensity === 0) {

                drums.player("hihat").start(
                    humanizeTime(time, rand)
                );
            }

            // apertura ogni tanto
            if (rand() < 0.05) {
                drums.player("hihat_open")?.start(
                    humanizeTime(time, rand)
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
            stepInMeasure ===
            Math.floor(stepsPerMeasure / 2)
        ) {

            drums.player("snare").start(
                humanizeTime(time, rand)
            );
        }

        // ghost notes
        if (rand() < 0.1 && section !== "intro") {

            drums.player("snare").start(
                humanizeTime(time, rand, 0.02),
                0,
                0.3
            );
        }

        // ------------------------------------------------
        // KICK (MIGLIORATO)
        // ------------------------------------------------

        if (section === "chorus") {

            if (riffNote) {

                // segue il riff (tight)
                drums.player("kick").start(
                    humanizeTime(time, rand)
                );
            }

            // doppia cassa ogni tanto
            if (rand() < 0.25) {
                drums.player("kick").start(
                    time + Tone.Time("16n").toSeconds()
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

            // variazione leggera
            if (rand() < 0.2) {
                drums.player("kick").start(
                    time + Tone.Time("16n").toSeconds()
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

        // ------------------------------------------------
        // MINI FILL FINE BATTUTA
        // ------------------------------------------------

        if (
            stepInMeasure === stepsPerMeasure - 2 &&
            rand() < 0.3
        ) {

            drums.player("snare").start(
                time,
            );

            drums.player("snare").start(
                time + Tone.Time("16n").toSeconds()
            );
        }
    };
}