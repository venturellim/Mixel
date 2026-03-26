
// drumEngine.js — versione compatibile con la nuova architettura
// Batteria power metal: groove, double kick, sezioni differenziate.

import * as Tone from "https://esm.sh/tone";

import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";
import { analyzeRiff } from "../../analysis/riffAnalysis.js"; // IMPORTANTE

console.log("drumEngine.js ver. 002 loaded");

// ============================================================
// PATTERN KICK
// ============================================================

function scheduleKickDoubleBass(section) {
    const beats = section.measures * 4;
    for (let b = 0; b < beats; b += 0.25) {
        const time = section.startTime + b * secondsPerBeat;
        scheduleIfInSection(section, time, t => drums.kick(t));
    }
}

function scheduleKickGallop(section) {
    const beats = section.measures * 4;
    for (let b = 0; b < beats; b++) {
        const base = section.startTime + b * secondsPerBeat;
        scheduleIfInSection(section, base, t => drums.kick(t));
        scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => drums.kick(t));
        scheduleIfInSection(section, base + 0.75 * secondsPerBeat, t => drums.kick(t));
    }
}

function scheduleKickBurst(section) {
    const beats = section.measures * 4;
    for (let b = 0; b < beats; b++) {
        const base = section.startTime + b * secondsPerBeat;
        scheduleIfInSection(section, base, t => drums.kick(t));
        scheduleIfInSection(section, base + 0.33 * secondsPerBeat, t => drums.kick(t));
        scheduleIfInSection(section, base + 0.66 * secondsPerBeat, t => drums.kick(t));
    }
}

function scheduleKickSyncopated(section, riffEvents) {
    riffEvents.forEach(ev => {
        if (ev.beatOffset % 1 === 0.5) {
            const time = section.startTime + ev.beatOffset * secondsPerBeat;
            scheduleIfInSection(section, time, t => drums.kick(t));
        }
    });
}

function scheduleKickOpen(section) {
    const beats = section.measures * 4;
    for (let b = 0; b < beats; b += 2) {
        const time = section.startTime + b * secondsPerBeat;
        scheduleIfInSection(section, time, t => drums.kick(t));
    }
}

function scheduleKickHalfTime(section) {
    const beats = section.measures * 4;
    for (let b = 0; b < beats; b += 2) {
        const time = section.startTime + b * secondsPerBeat;
        scheduleIfInSection(section, time, t => drums.kick(t));
    }
}

function scheduleKickFollower(section, riffEvents) {
    riffEvents.forEach(ev => {
        const time = section.startTime + ev.beatOffset * secondsPerBeat;
        scheduleIfInSection(section, time, t => drums.kick(t));
    });
}

// ============================================================
// DRUMS ENGINE – STRUTTURA BASE (firma corretta)
// ============================================================

function scheduleDrumsSection(section, scale, progression, riffEvents) {

    // Analisi del riff (come il basso)
    const analysis = analyzeRiff(riffEvents);
    const { dominantPattern, palmRatio } = analysis;

    // Kick, snare, hihat, crash
    scheduleKick(section, riffEvents, dominantPattern, palmRatio);
    scheduleSnare(section, riffEvents, dominantPattern, palmRatio);
    scheduleHihat(section, riffEvents, dominantPattern, palmRatio);
    scheduleCrash(section, riffEvents, dominantPattern, palmRatio);

    // Fill automatico a fine sezione
    scheduleFill(section, dominantPattern);
}

function scheduleDrumsTransition(section, transitionEvents) {
    if (transitionEvents.length > 0) {
        const t = section.startTime + transitionEvents[0].beatOffset * secondsPerBeat;
        drums.crash(t);
    }
}

// ============================================================
// PATTERN BASE
// ============================================================

function scheduleKick(section, riffEvents, dominantPattern, palmRatio) {

    if (palmRatio > 0.7) {
        scheduleKickDoubleBass(section);
        return;
    }

    if (dominantPattern.includes("gallop")) {
        scheduleKickGallop(section);
        return;
    }

    if (dominantPattern.includes("burst")) {
        scheduleKickBurst(section);
        return;
    }

    if (dominantPattern.includes("syncopated")) {
        scheduleKickSyncopated(section, riffEvents);
        return;
    }

    if (dominantPattern.includes("open")) {
        scheduleKickOpen(section);
        return;
    }

    if (dominantPattern.includes("half_time")) {
        scheduleKickHalfTime(section);
        return;
    }

    scheduleKickFollower(section, riffEvents);
}

function scheduleSnare(section, riffEvents, dominantPattern, palmRatio) {

    const beats = section.measures * 4;

    if (dominantPattern.includes("half_time") || dominantPattern.includes("open_half_time")) {
        for (let b = 0; b < beats; b++) {
            if (b % 4 === 2) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, t => drums.snare(t));
            }
        }
        return;
    }

    for (let b = 0; b < beats; b++) {
        if (b % 4 === 1 || b % 4 === 3) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => drums.snare(t));
        }
    }
}

function scheduleHihat(section, riffEvents, dominantPattern, palmRatio) {

    const beats = section.measures * 4;

    if (palmRatio > 0.7) {
        for (let b = 0; b < beats; b += 0.25) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => drums.hihatClosed(t));
        }
        return;
    }

    if (dominantPattern.includes("open")) {
        for (let b = 0; b < beats; b += 0.5) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => drums.ride(t));
        }
        return;
    }

    for (let b = 0; b < beats; b += 0.5) {
        const time = section.startTime + b * secondsPerBeat;
        scheduleIfInSection(section, time, t => drums.hihatClosed(t));
    }
}

function scheduleCrash(section, riffEvents, dominantPattern, palmRatio) {

    const startTime = section.startTime;
    scheduleIfInSection(section, startTime, t => drums.crash(t));

    if (dominantPattern.includes("open")) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b += 4) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => drums.crash(t));
        }
    }
}

function scheduleFill(section, dominantPattern) {

    const totalBeats = section.measures * 4;
    const fillStartBeat = totalBeats - 1;

    for (let b = fillStartBeat; b < totalBeats; b += 0.25) {
        const time = section.startTime + b * secondsPerBeat;

        scheduleIfInSection(section, time, t => {
            const tom = pickRandomTom();
            drums[tom](t);
        });
    }
}

function pickRandomTom() {
    const toms = ["tom1", "tom2", "tom3"];
    return toms[Math.floor(Math.random() * toms.length)];
}

// ============================================================
// EXPORT
// ============================================================

return {
    scheduleDrumsSection,
    scheduleDrumsTransition
};
