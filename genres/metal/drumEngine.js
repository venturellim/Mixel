//
// drumEngine.js — versione corretta e robusta
// Batteria power metal: groove, double kick, sezioni differenziate.
//

import * as Tone from "https://esm.sh/tone";

import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("drumEngine.js loaded");

export function initDrumEngine(instruments, params, rand, structure) {

    const { drums } = instruments;

    // ------------------------------------------------------------
    // 1) Play sicuro: sample sempre valido
    // ------------------------------------------------------------
    function play(sample, time) {
        if (!drums || !drums.player || !drums.player(sample)) return;
        drums.player(sample).start(time);
    }

    // ------------------------------------------------------------
    // 2) Chance sicura
    // ------------------------------------------------------------
    function chance(p) {
        if (isNaN(p) || p <= 0) return false;
        if (p >= 1) return true;
        return rand() < p;
    }

    // ------------------------------------------------------------
    // 3) Schedulers singoli
    // ------------------------------------------------------------
    function scheduleKick(t)     { Tone.Transport.schedule(time => play("kick", time), t); }
    function scheduleSnare(t)    { Tone.Transport.schedule(time => play("snare", time), t); }
    function scheduleGhost(t)    { Tone.Transport.schedule(time => play("ghost", time), t); }
    function scheduleHiHat(t)    { Tone.Transport.schedule(time => play("hihat", time), t); }
    function scheduleOpenHat(t)  { Tone.Transport.schedule(time => play("openhat", time), t); }
    function scheduleRide(t)     { Tone.Transport.schedule(time => play("ride", time), t); }
    function scheduleRideBell(t) { Tone.Transport.schedule(time => play("ridebell", time), t); }
    function scheduleChina(t)    { Tone.Transport.schedule(time => play("china", time), t); }

    function scheduleCrash(t) {
        const sample = rand() < 0.5 ? "crash1" : "crash2";
        Tone.Transport.schedule(time => play(sample, time), t);
    }

    // ------------------------------------------------------------
    // 4) Pattern: Double Kick
    // ------------------------------------------------------------
    function scheduleDoubleKick(section) {
        const timeline = buildSectionTimeline(section, "16n");
        if (!timeline || timeline.length === 0) return;

        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
        });
    }

    // ------------------------------------------------------------
    // 5) Pattern: Groove
    // ------------------------------------------------------------
    function scheduleGroove(section) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline || timeline.length === 0) return;

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
    // 6) Pattern: Chorus
    // ------------------------------------------------------------
    function scheduleChorus(section) {
        const timeline = buildSectionTimeline(section, "4n");
        if (!timeline || timeline.length === 0) return;

        timeline.forEach((t, i) => {
            if (i === 0) scheduleCrash(t);

            scheduleRide(t);

            scheduleKick(t);
            scheduleKick(t + duration("16n"));
        });
    }

    // ------------------------------------------------------------
    // 7) Pattern: Solo
    // ------------------------------------------------------------
    function scheduleSolo(section) {
        const timeline = buildSectionTimeline(section, "8n");
        if (!timeline || timeline.length === 0) return;

        timeline.forEach((t, i) => {
            if (i % 2 === 0) scheduleKick(t);
            if (i % 2 === 1) scheduleSnare(t);

            scheduleRideBell(t);

            if (chance(0.2)) scheduleGhost(t + duration("16n"));
        });
    }

    // ------------------------------------------------------------
    // 8) Pattern: Outro
    // ------------------------------------------------------------
    function scheduleOutro(section) {
        const timeline = buildSectionTimeline(section, "4n");
        if (!timeline || timeline.length === 0) return;

        timeline.forEach(t => {
            scheduleChina(t);

            if (chance(0.3)) {
                const tom = "tom" + (1 + Math.floor(rand() * 4));
                Tone.Transport.schedule(time => play(tom, time), t + duration("8n"));
            }
        });
    }

    // ------------------------------------------------------------
    // 9) Scheduling globale
    // ------------------------------------------------------------
    function schedule() {
        if (!structure || !structure.sections) return;

        structure.sections.forEach(section => {
            if (section.name === "intro")  return scheduleGroove(section);

            if (section.name === "verse") {
                if (params.drumStyle === "doubleKick") return scheduleDoubleKick(section);
                return scheduleGroove(section);
            }

            if (section.name === "chorus") return scheduleChorus(section);
            if (section.name === "solo")   return scheduleSolo(section);
            if (section.name === "outro")  return scheduleOutro(section);

            // fallback sicuro
            scheduleGroove(section);
        });
    }

    return { schedule };
}
