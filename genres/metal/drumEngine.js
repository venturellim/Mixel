// drumEngine.js — versione 006.3 (autosufficiente + Tone.Players fix + transition fix)

import * as Tone from "https://esm.sh/tone";

console.log("drumEngine.js ver. 006.3 loaded");

export function initDrumEngine(instruments, params, rand) {

    const { drums } = instruments;

    const secondsPerBeat = 60 / params.bpm;
    const measureDuration = secondsPerBeat * 4;

    // ============================================================
    // 🎵 ANALISI RIFF
    // ============================================================

    function analyzeRiff(riffEvents) {
        if (!riffEvents || riffEvents.length === 0) {
            return { dominantPattern: "pedal_8n", palmRatio: 0 };
        }

        const patterns = riffEvents.map(ev => ev.pattern);
        const types = riffEvents.map(ev => ev.type);

        const count = arr =>
            arr.reduce((m, x) => (m[x] = (m[x] || 0) + 1, m), {});

        const patternCount = count(patterns);
        const typeCount = count(types);

        const dominantPattern = Object.entries(patternCount)
            .sort((a, b) => b[1] - a[1])[0][0];

        const palmRatio = (typeCount["palm"] || 0) / riffEvents.length;

        return { dominantPattern, palmRatio };
    }

    // ============================================================
    // 🎵 SCHEDULER
    // ============================================================

    function scheduleIfInSection(section, eventTime, cb) {
        const end = section.startTime + section.measures * measureDuration;
        if (eventTime >= end) return;
        Tone.Transport.schedule(cb, eventTime);
    }

    // ============================================================
    // 🥁 HELPERS PER TONE.PLAYERS
    // ============================================================

    const K = name => t => drums.player(name).start(t);

    const kick    = K("kick");
    const snare   = K("snare");
    const hihat   = K("hihat");
    const openhat = K("openhat");
    const ride    = K("ride");
    const crash1  = K("crash1");
    const crash2  = K("crash2");
    const tom1    = K("tom1");
    const tom2    = K("tom2");
    const tom3    = K("tom3");
    const tom4    = K("tom4");

    const crash = t => (rand() < 0.5 ? crash1(t) : crash2(t));

    const randomTom = t => {
        const r = rand();
        if (r < 0.33) tom1(t);
        else if (r < 0.66) tom2(t);
        else tom3(t);
    };

    // ============================================================
    // 🥁 KICK PATTERNS
    // ============================================================

    function scheduleKickDoubleBass(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b += 0.25) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => kick(t));
        }
    }

    function scheduleKickGallop(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b++) {
            const base = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, base, t => kick(t));
            scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => kick(t));
            scheduleIfInSection(section, base + 0.75 * secondsPerBeat, t => kick(t));
        }
    }

    function scheduleKickBurst(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b++) {
            const base = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, base, t => kick(t));
            scheduleIfInSection(section, base + 0.33 * secondsPerBeat, t => kick(t));
            scheduleIfInSection(section, base + 0.66 * secondsPerBeat, t => kick(t));
        }
    }

    function scheduleKickSyncopated(section, riffEvents) {
        riffEvents.forEach(ev => {
            if (ev.beatOffset % 1 === 0.5) {
                const time = section.startTime + ev.beatOffset * secondsPerBeat;
                scheduleIfInSection(section, time, t => kick(t));
            }
        });
    }

    function scheduleKickOpen(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b += 2) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => kick(t));
        }
    }

    function scheduleKickHalfTime(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b += 2) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => kick(t));
        }
    }

    function scheduleKickFollower(section, riffEvents) {
        riffEvents.forEach(ev => {
            const time = section.startTime + ev.beatOffset * secondsPerBeat;
            scheduleIfInSection(section, time, t => kick(t));
        });
    }

    function scheduleKick(section, riffEvents, dominantPattern, palmRatio) {
        if (palmRatio > 0.7) return scheduleKickDoubleBass(section);
        if (dominantPattern.includes("gallop")) return scheduleKickGallop(section);
        if (dominantPattern.includes("burst")) return scheduleKickBurst(section);
        if (dominantPattern.includes("syncopated")) return scheduleKickSyncopated(section, riffEvents);
        if (dominantPattern.includes("open")) return scheduleKickOpen(section);
        if (dominantPattern.includes("half_time")) return scheduleKickHalfTime(section);
        scheduleKickFollower(section, riffEvents);
    }

    // ============================================================
    // 🥁 SNARE / HIHAT / CRASH
    // ============================================================

    function scheduleSnare(section, riffEvents, dominantPattern, palmRatio) {
        const beats = section.measures * 4;

        if (dominantPattern.includes("half_time") || dominantPattern.includes("open_half_time")) {
            for (let b = 0; b < beats; b++) {
                if (b % 4 === 2) {
                    const time = section.startTime + b * secondsPerBeat;
                    scheduleIfInSection(section, time, t => snare(t));
                }
            }
            return;
        }

        for (let b = 0; b < beats; b++) {
            if (b % 4 === 1 || b % 4 === 3) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, t => snare(t));
            }
        }
    }

    function scheduleHihat(section, riffEvents, dominantPattern, palmRatio) {
        const beats = section.measures * 4;

        if (palmRatio > 0.7) {
            for (let b = 0; b < beats; b += 0.25) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, t => hihat(t));
            }
            return;
        }

        if (dominantPattern.includes("open")) {
            for (let b = 0; b < beats; b += 0.5) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, t => ride(t));
            }
            return;
        }

        for (let b = 0; b < beats; b += 0.5) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => hihat(t));
        }
    }

    function scheduleCrash(section, riffEvents, dominantPattern, palmRatio) {
        const startTime = section.startTime;
        scheduleIfInSection(section, startTime, t => crash(t));

        if (dominantPattern.includes("open")) {
            const beats = section.measures * 4;
            for (let b = 0; b < beats; b += 4) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, t => crash(t));
            }
        }
    }

    function scheduleFill(section, dominantPattern) {
        const totalBeats = section.measures * 4;
        const fillStartBeat = totalBeats - 1;

        for (let b = fillStartBeat; b < totalBeats; b += 0.25) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, t => randomTom(t));
        }
    }

    // ============================================================
    // 🥁 SEZIONE PRINCIPALE
    // ============================================================

    function scheduleSection(section, scale, progression, riffEvents) {

        const analysis = analyzeRiff(riffEvents);
        const { dominantPattern, palmRatio } = analysis;

        scheduleKick(section, riffEvents, dominantPattern, palmRatio);
        scheduleSnare(section, riffEvents, dominantPattern, palmRatio);
        scheduleHihat(section, riffEvents, dominantPattern, palmRatio);
        scheduleCrash(section, riffEvents, dominantPattern, palmRatio);

        scheduleFill(section, dominantPattern);
    }

    // ============================================================
    // 🥁 TRANSIZIONI (FIX DEFINITIVO)
    // ============================================================

    function scheduleTransition(section, transitionEvents) {
        if (!transitionEvents || transitionEvents.length === 0) return;

        const eventTime = section.startTime + transitionEvents[0].beatOffset * secondsPerBeat;

        // SCHEDULAZIONE CORRETTA (non crash(t) diretto!)
        scheduleIfInSection(section, eventTime, t => crash(t));
    }

    // ============================================================
    // EXPORT
    // ============================================================

    return {
        scheduleSection,
        scheduleTransition
    };
}
