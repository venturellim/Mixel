
// drumEngine.js — versione 005 (autosufficiente come il basso)
// Batteria power metal: groove, double kick, sezioni differenziate.

import * as Tone from "https://esm.sh/tone";
import { analyzeRiff } from "../../analysis/riffAnalysis.js";

console.log("drumEngine.js ver. 005 loaded");

export function initDrumEngine(instruments, params, rand) {

    // Estrae SOLO la batteria, come fa il basso con instruments.bass
    const { drums } = instruments;

    // Calcolo interno, come nel basso
    const secondsPerBeat = 60 / params.bpm;
    const measureDuration = secondsPerBeat * 4;

    // Funzione autosufficiente, identica al basso
    function scheduleIfInSection(section, eventTime, cb) {
        const end = section.startTime + section.measures * measureDuration;
        if (eventTime >= end) return;
        Tone.Transport.schedule(cb, eventTime);
    }

    // ------------------------------------------------------------
    // KICK PATTERNS (identici alla tua versione precedente)
    // ------------------------------------------------------------

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

    // ------------------------------------------------------------
    // SNARE / HIHAT / CRASH (identici alla tua versione)
    // ------------------------------------------------------------

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
                const tom = ["tom1", "tom2", "tom3"][Math.floor(Math.random() * 3)];
                drums[tom](t);
            });
        }
    }

    // ------------------------------------------------------------
    // SEZIONE PRINCIPALE
    // ------------------------------------------------------------

    function scheduleSection(section, scale, progression, riffEvents) {

        const analysis = analyzeRiff(riffEvents);
        const { dominantPattern, palmRatio } = analysis;

        scheduleKick(section, riffEvents, dominantPattern, palmRatio);
        scheduleSnare(section, riffEvents, dominantPattern, palmRatio);
        scheduleHihat(section, riffEvents, dominantPattern, palmRatio);
        scheduleCrash(section, riffEvents, dominantPattern, palmRatio);

        scheduleFill(section, dominantPattern);
    }

    // ------------------------------------------------------------
    // TRANSIZIONI
    // ------------------------------------------------------------

    function scheduleTransition(section, transitionEvents) {
        if (transitionEvents.length > 0) {
            const t = section.startTime + transitionEvents[0].beatOffset * secondsPerBeat;
            drums.crash(t);
        }
    }

    // ------------------------------------------------------------
    // EXPORT (identico al basso)
    // ------------------------------------------------------------

    return {
        scheduleSection,
        scheduleTransition
    };
}
