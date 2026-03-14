// metalDrums.js — batteria sincronizzata con metalTimeline

import { drums, humanizeTime } from "./common.js";
import * as Tone from "https://esm.sh/tone";

export function createDrumEngine(analysis, params, timeline, riffData, rand) {

    const {
        stepsPerMeasure,
        totalSteps
    } = timeline;

    // ------------------------------------------------------------
    // FILL TRA SEZIONI
    // ------------------------------------------------------------

    function playFill(time, stepInMeasure) {

        if (stepInMeasure === stepsPerMeasure - 3)
            drums.player("tom1").start(
    humanizeTime(time, rand)
    );

        if (stepInMeasure === stepsPerMeasure - 2)
            drums.player("tom2").start(
    humanizeTime(time, rand)
    );

        if (stepInMeasure === stepsPerMeasure - 1) {

            drums.player("snare").start(
    humanizeTime(time, rand)
    );
            drums.player("crash1").start(
    humanizeTime(time, rand)
    );
        }

    }

    // ------------------------------------------------------------
    // KICK PATTERN
    // ------------------------------------------------------------

    function getKickPattern(section) {

        if (section === "intro")
            return [1,0,0,0,1,0,0,0];

        if (section === "verse")
            return [1,0,0,0,1,0,0,0];

        if (section === "chorus")
            return [1,0,1,0,1,0,1,0];

        if (section === "solo")
            return [1,0,1,1,1,0,1,1];

        if (section === "outro")
            return [1,0,0,0,0,0,0,0];

        return [1,0,0,0,1,0,0,0];

    }

    // ------------------------------------------------------------
    // SNARE
    // ------------------------------------------------------------

    function getSnarePattern() {

        return [4,12];

    }

    // ------------------------------------------------------------
    // CYMBAL
    // ------------------------------------------------------------

    function getCymbal(section) {

        if (section === "intro") return "ride";
        if (section === "verse") return "hihat";
        if (section === "chorus") return "openhat";
        if (section === "solo") return "ride";
        if (section === "outro") return "hihat";

        return "hihat";

    }

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------

    return function drumEngine(time, step) {

        const idx = step % totalSteps;

        const { stepInMeasure, section } =
            timeline.getStepData(step);
            const riffNote = riffData.fullRiff[idx];

        const nextSection =
            timeline.sectionTimeline[(idx + 1) % totalSteps];

        const kickPattern = getKickPattern(section);
        const snarePattern = getSnarePattern();
        const cymbal = getCymbal(section);

        const kickStep =
            stepInMeasure % kickPattern.length;

        // CYMBAL

        if (stepInMeasure % 2 === 0) {

           
drums.player(cymbal).start(
    humanizeTime(time, rand)
);
        }

        // KICK

        if (kickPattern[kickStep] || riffNote) {

    drums.player("kick").start(
    humanizeTime(time, rand)
);

}

        // SNARE

        if (snarePattern.includes(stepInMeasure)) {

    drums.player("snare").start(
        humanizeTime(time, rand)
    );

}

if (stepInMeasure === 0 && section === "chorus") {

    drums.player("crash1").start(
        humanizeTime(time, rand)
    );

}

        // FILL TRA SEZIONI

        if (nextSection !== section) {

            playFill(time, stepInMeasure);

        }

    };

}