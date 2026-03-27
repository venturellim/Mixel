// drumEngine.js — versione 006.2 (autosufficiente + Tone.Players fix)
// Batteria power metal: groove, double kick, sezioni differenziate.

import * as Tone from "https://esm.sh/tone";

console.log("drumEngine.js ver. 006.2 loaded");

export function initDrumEngine(instruments, params, rand) {

    // Estrae SOLO la batteria
    const { drums } = instruments;

    // Calcolo interno
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

    // Kick aliases
    const kick      = K("kick");
    const snare     = K("snare");
    const hihat     = K("hihat");
    const openhat   = K("openhat");
    const ride      = K("ride");
    const crash1    = K("crash1");
    const crash2    = K("crash2");
    const tom1      = K("tom1");
    const tom2      = K("tom2");
    const tom3      = K("tom3");
    const tom4      = K("tom4");

    // Crash generico
    const crash = t => {
        // alterna crash1 / crash2
        if (rand() < 0.5) crash1(t);
        else crash2(t);
    };

    // Tom random
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
            scheduleIfInSection(section, time, kick);
        }
    }

    function scheduleKickGallop(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b++) {
            const base = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, base, kick);
            scheduleIfInSection(section, base + 0.5 * secondsPerBeat, kick);
            scheduleIfInSection(section, base + 0.75 * secondsPerBeat, kick);
        }
    }

    function scheduleKickBurst(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b++) {
            const base = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, base, kick);
            scheduleIfInSection(section, base + 0.33 * secondsPerBeat, kick);
            scheduleIfInSection(section, base + 0.66 * secondsPerBeat, kick);
        }
    }

    function scheduleKickSyncopated(section, riffEvents) {
        riffEvents.forEach(ev => {
            if (ev.beatOffset % 1 === 0.5) {
                const time = section.startTime + ev.beatOffset * secondsPerBeat;
                scheduleIfInSection(section, time, kick);
            }
        });
    }

    function scheduleKickOpen(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b += 2) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, kick);
        }
    }

    function scheduleKickHalfTime(section) {
        const beats = section.measures * 4;
        for (let b = 0; b < beats; b += 2) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, kick);
        }
    }

    function scheduleKickFollower(section, riffEvents) {
        riffEvents.forEach(ev => {
            const time = section.startTime + ev.beatOffset * secondsPerBeat;
            scheduleIfInSection(section, time, kick);
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
                    scheduleIfInSection(section, time, snare);
                }
            }
            return;
        }

        for (let b = 0; b < beats; b++) {
            if (b % 4 === 1 || b % 4 === 3) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, snare);
            }
        }
    }

    function scheduleHihat(section, riffEvents, dominantPattern, palmRatio) {
        const beats = section.measures * 4;

        if (palmRatio > 0.7) {
            for (let b = 0; b < beats; b += 0.25) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, hihat);
            }
            return;
        }

        if (dominantPattern.includes("open")) {
            for (let b = 0; b < beats; b += 0.5) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, ride);
            }
            return;
        }

        for (let b = 0; b < beats; b += 0.5) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, hihat);
        }
    }

    function scheduleCrash(section, riffEvents, dominantPattern, palmRatio) {
        const startTime = section.startTime;
        scheduleIfInSection(section, startTime, crash);

        if (dominantPattern.includes("open")) {
            const beats = section.measures * 4;
            for (let b = 0; b < beats; b += 4) {
                const time = section.startTime + b * secondsPerBeat;
                scheduleIfInSection(section, time, crash);
            }
        }
    }

    function scheduleFill(section, dominantPattern) {
        const totalBeats = section.measures * 4;
        const fillStartBeat = totalBeats - 1;

        for (let b = fillStartBeat; b < totalBeats; b += 0.25) {
            const time = section.startTime + b * secondsPerBeat;
            scheduleIfInSection(section, time, randomTom);
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
    // 🥁 TRANSIZIONI
    // ============================================================

    function scheduleTransition(section, transitionEvents) {
        if (transitionEvents.length > 0) {
            const t = section.startTime + transitionEvents[0].beatOffset * secondsPerBeat;
            crash(t);
        }
    }

    // ============================================================
    // EXPORT
    // ============================================================

    return {
        scheduleSection,
        scheduleTransition
    };
}
