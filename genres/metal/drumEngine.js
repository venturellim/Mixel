// drumEngine.js — versione compatibile con la nuova architettura
// Batteria power metal: groove, double kick, sezioni differenziate.

import * as Tone from "https://esm.sh/tone";

import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("drumEngine.js ver. 001 loaded");

export function initDrumEngine(instruments, params, rand) {

    const { drums } = instruments;

    // ------------------------------------------------------------
    // Play sicuro
    // ------------------------------------------------------------
    function play(sample, time) {
        if (!drums || !drums.player || !drums.player(sample)) return;
        drums.player(sample).start(time);
    }

    // ------------------------------------------------------------
    // Chance sicura
    // ------------------------------------------------------------
    function chance(p) {
        if (isNaN(p) || p <= 0) return false;
        if (p >= 1) return true;
        return rand() < p;
    }

    // ------------------------------------------------------------
    // Schedulers singoli
    // ------------------------------------------------------------
    const scheduleKick     = t => Tone.Transport.schedule(time => play("kick", time), t);
    const scheduleSnare    = t => Tone.Transport.schedule(time => play("snare", time), t);
    const scheduleGhost    = t => Tone.Transport.schedule(time => play("ghost", time), t);
    const scheduleHiHat    = t => Tone.Transport.schedule(time => play("hihat", time), t);
    const scheduleOpenHat  = t => Tone.Transport.schedule(time => play("openhat", time), t);
    const scheduleRide     = t => Tone.Transport.schedule(time => play("ride", time), t);
    const scheduleRideBell = t => Tone.Transport.schedule(time => play("ridebell", time), t);
    const scheduleChina    = t => Tone.Transport.schedule(time => play("china", time), t);

    function scheduleCrash(t) {
        const sample = rand() < 0.5 ? "crash1" : "crash2";
        Tone.Transport.schedule(time => play(sample, time), t);
    }

    // ------------------------------------------------------------
    // Pattern: Double Kick
    // ------------------------------------------------------------
    function patternDoubleKick(section) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
        });
    }

    // ------------------------------------------------------------
    // Pattern: Groove
    // ------------------------------------------------------------
    function patternGroove(section) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
            if (i % 2 === 1) scheduleSnare(t);

            scheduleHiHat(t);

            if (chance(0.1 * params.drumIntensity)) {
                scheduleGhost(t + duration("16n"));
            }
        });
    }

    // ------------------------------------------------------------
    // Pattern: Chorus
    // ------------------------------------------------------------
    function patternChorus(section) {
        const timeline = buildSectionTimeline(section, "4n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            if (i === 0) scheduleCrash(t);

            scheduleRide(t);

            scheduleKick(t);
            scheduleKick(t + duration("16n"));
        });
    }

    // ------------------------------------------------------------
    // Pattern: Solo
    // ------------------------------------------------------------
    function patternSolo(section) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline) return;

        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
            if (i % 2 === 1) scheduleSnare(t);

            scheduleRideBell(t);

            if (chance(0.2)) scheduleGhost(t + duration("16n"));
        });
    }

    // ------------------------------------------------------------
    // Pattern: Outro
    // ------------------------------------------------------------
    function patternOutro(section) {
        const timeline = buildSectionTimeline(section, "4n");
        if (!timeline) return;

        timeline.forEach(t => {
            scheduleChina(t);

            if (chance(0.3)) {
                const tom = "tom" + (1 + Math.floor(rand() * 4));
                Tone.Transport.schedule(time => play(tom, time), t + duration("8n"));
            }
        });
    }

    // ------------------------------------------------------------
    // Scheduling di una singola sezione
    // ------------------------------------------------------------
    function scheduleSection(section) {

        if (section.name === "intro")  return patternGroove(section);

        if (section.name === "verse") {
            if (params.drumStyle === "doubleKick") return patternDoubleKick(section);
            return patternGroove(section);
        }

        if (section.name === "chorus") return patternChorus(section);
        if (section.name === "solo")   return patternSolo(section);
        if (section.name === "outro")  return patternOutro(section);

        // fallback
        patternGroove(section);
    }

    // ------------------------------------------------------------
    // EXPORT
    // ------------------------------------------------------------
    return {
        scheduleSection
    };
}
