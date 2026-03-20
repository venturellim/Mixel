//
// drumEngine.js
// Batteria power metal: groove, double kick, sezioni differenziate.
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

    function scheduleKick(t) {
        Tone.Transport.schedule(time => play("kick", time), t);
    }

    function scheduleSnare(t) {
        Tone.Transport.schedule(time => play("snare", time), t);
    }

    function scheduleGhost(t) {
        Tone.Transport.schedule(time => play("ghost", time), t);
    }

    function scheduleHiHat(t) {
        Tone.Transport.schedule(time => play("hihat", time), t);
    }

    function scheduleOpenHat(t) {
        Tone.Transport.schedule(time => play("openhat", time), t);
    }

    function scheduleCrash(t) {
        const sample = rand() < 0.5 ? "crash1" : "crash2";
        Tone.Transport.schedule(time => play(sample, time), t);
    }

    function scheduleRide(t) {
        Tone.Transport.schedule(time => play("ride", time), t);
    }

    function scheduleRideBell(t) {
        Tone.Transport.schedule(time => play("ridebell", time), t);
    }

    function scheduleChina(t) {
        Tone.Transport.schedule(time => play("china", time), t);
    }

    function scheduleDoubleKick(section) {
        const timeline = buildSectionTimeline(section, "16n");
        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
        });
    }

    function scheduleGroove(section) {
        const timeline = buildSectionTimeline(section, "8n");

        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
            if (i % 2 === 1) scheduleSnare(t);

            scheduleHiHat(t);

            if (chance(0.1 * params.drumIntensity)) {
                scheduleGhost(t + duration("16n"));
            }
        });
    }

    function scheduleChorus(section) {
        const timeline = buildSectionTimeline(section, "4n");

        timeline.forEach((t, i) => {
            if (i === 0) scheduleCrash(t);

            scheduleRide(t);

            scheduleKick(t);
            scheduleKick(t + duration("16n"));
        });
    }

    function scheduleSolo(section) {
        const timeline = buildSectionTimeline(section, "8n");

        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
            if (i % 2 === 1) scheduleSnare(t);

            scheduleRideBell(t);

            if (chance(0.2)) scheduleGhost(t + duration("16n"));
        });
    }

    function scheduleOutro(section) {
        const timeline = buildSectionTimeline(section, "4n");

        timeline.forEach(t => {
            scheduleChina(t);

            if (chance(0.3)) {
                const tom = "tom" + (1 + Math.floor(rand() * 4));
                Tone.Transport.schedule(time => play(tom, time), t + duration("8n"));
            }
        });
    }

    function schedule() {
        structure.sections.forEach(section => {
            if (section.name === "intro")  return scheduleGroove(section);
            if (section.name === "verse") {
                if (params.drumStyle === "doubleKick") return scheduleDoubleKick(section);
                return scheduleGroove(section);
            }
            if (section.name === "chorus") return scheduleChorus(section);
            if (section.name === "solo")   return scheduleSolo(section);
            if (section.name === "outro")  return scheduleOutro(section);
        });
    }

    return { schedule };
}
