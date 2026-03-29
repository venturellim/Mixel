// drumEngine.js — versione 006.4 (transition fix definitivo)

import * as Tone from "https://esm.sh/tone";

console.log("drumEngine.js ver. 008.2 loaded");

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
    // 🎵 SCHEDULER (fixato per transizioni)
    // ============================================================

    function scheduleIfInSection(section, eventTime, cb, overrideDurationBeats = null) {

        const durationBeats =
            overrideDurationBeats != null
                ? overrideDurationBeats
                : section.measures * 4;

        const end = section.startTime + durationBeats * secondsPerBeat;

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
// 🥁 RIFINITURE
// ============================================================

// Humanization: leggero random su timing e volume
function humanizeTime(t) {
    return t + (rand() - 0.5) * 0.01; // ±10ms
}

function humanizeVolume(vol = 1) {
    return vol * (0.9 + rand() * 0.2); // ±10%
}

// Ghost snare (snare leggero)
function ghostSnare(t) {
    drums.player("snare").start(humanizeTime(t), 0, undefined, 0.3);
}

// Crash choke (crash + stop immediato)
function crashChoke(t) {
    const chosen = rand() < 0.5 ? "crash1" : "crash2";
    drums.player(chosen).start(t);
    drums.player(chosen).stop(t + 0.15); // soffocato
}

// Final fill avanzato (tom + snare + kick)
function finalFill(section, durationBeats) {
    const base = section.startTime + (durationBeats - 1) * secondsPerBeat;

    const fill = [
        t => tom3(t),
        t => snare(t),
        t => tom2(t),
        t => kick(t)
    ];

    fill.forEach((inst, i) => {
        const tFill = base + i * 0.25 * secondsPerBeat;
        scheduleIfInSection(section, tFill, inst, durationBeats);
    });
}

// ------------------------------------------------------------
// 🥁 MICRO-FILL DETERMINISTICI (M4 e M8)
// ------------------------------------------------------------

// Fill leggero alla fine della misura 4
function microFill_M4(section) {
    const beat = 4 * 4 - 0.25; // ultimo sedicesimo della misura 4
    const t = section.startTime + beat * secondsPerBeat;

    const r = rand(); // deterministico

    if (r < 0.33) {
        // tom-tom deterministico
        scheduleIfInSection(section, t, tt => tom2(humanizeTime(tt)));
        scheduleIfInSection(section, t + 0.125 * secondsPerBeat, tt => tom3(humanizeTime(tt)));
    }
    else if (r < 0.66) {
        // flam deterministico
        scheduleIfInSection(section, t - 0.03 * secondsPerBeat, tt => snare(humanizeTime(tt)));
        scheduleIfInSection(section, t, tt => snare(humanizeTime(tt)));
    }
    else {
        // crash deterministico
        scheduleIfInSection(section, t, tt => crash(humanizeTime(tt)));
    }
}

// Fill epico deterministico alla fine della misura 8
function microFill_M8(section) {
    const beat = 8 * 4 - 0.5; // ultimi due sedicesimi della misura 8
    const t = section.startTime + beat * secondsPerBeat;

    const r = rand(); // deterministico

    if (r < 0.33) {
        // tom run finale deterministico
        scheduleIfInSection(section, t, tt => tom2(humanizeTime(tt)));
        scheduleIfInSection(section, t + 0.125 * secondsPerBeat, tt => tom3(humanizeTime(tt)));
        scheduleIfInSection(section, t + 0.25 * secondsPerBeat, tt => tom4(humanizeTime(tt)));
    }
    else if (r < 0.66) {
        // snare accent + crash deterministico
        scheduleIfInSection(section, t, tt => snare(humanizeTime(tt)));
        scheduleIfInSection(section, t + 0.25 * secondsPerBeat, tt => crash(humanizeTime(tt)));
    }
    else {
        // china finale deterministica
        scheduleIfInSection(section, t + 0.25 * secondsPerBeat, tt => drums.player("china").start(humanizeTime(tt)));
    }
}

// ------------------------------------------------------------
// 🥁 ACCENTI DELLA LEAD (basati sul THEME) — deterministici
// ------------------------------------------------------------

function scheduleLeadAccents(section, themeEvents) {
    if (!themeEvents || themeEvents.length === 0) return;

    themeEvents.forEach(ev => {
        const beat = ev.beatOffset;
        const t = section.startTime + beat * secondsPerBeat;

        // criteri deterministici per accento
        const isAccent =
            ev.velocity > 0.9 ||
            ev.duration >= 1 ||
            beat % 1 === 0 ||
            Math.abs((beat % 4) - 3.5) < 0.01; // fine misura

        if (!isAccent) return;

        const r = rand(); // deterministico

        // Reazioni deterministiche
        if (r < 0.33) {
            // crash accent
            scheduleIfInSection(section, t, tt => crash(humanizeTime(tt)));
        }
        else if (r < 0.66) {
            // snare accent
            scheduleIfInSection(section, t, tt => snare(humanizeTime(tt)));
        }
        else {
            // tom accent
            const toms = [tom1, tom2, tom3, tom4];
            const idx = Math.floor(rand() * toms.length);
            scheduleIfInSection(section, t, tt => toms[idx](humanizeTime(tt)));
        }
    });
}

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
// micro-fill misura 4 e 8 (solo se la sezione è lunga almeno 8 misure)
        scheduleFill(section, dominantPattern);
        
        // accenti deterministici basati sul theme
scheduleLeadAccents(section, section.themeEvents);

if (section.measures >= 8) {
    microFill_M4(section);
    microFill_M8(section);
}

    }

    // ============================================================
    // 🥁 TRANSIZIONI (FIX DEFINITIVO)
    // ============================================================

    function scheduleTransition(section, transitionEvents, transitionInfo) {
    if (!transitionEvents || transitionEvents.length === 0) return;

    const durationBeats = transitionInfo.durationBeats;
    const start = section.startTime;
    const type = transitionInfo.type;

    // pm_burst_9 / pm_burst_12
    if (type === "pm_burst_9" || type === "pm_burst_12") {
        for (let b = 0; b < durationBeats; b++) {
            const base = start + b * secondsPerBeat;

            // Accento sul beat 1 e 3
            if (b % 2 === 0) {
                scheduleIfInSection(section, base, t => snare(humanizeTime(t)), durationBeats);
            }

            // burst base
            scheduleIfInSection(section, base, t => kick(humanizeTime(t)), durationBeats);
            scheduleIfInSection(section, base + 0.33 * secondsPerBeat, t => kick(humanizeTime(t)), durationBeats);
            scheduleIfInSection(section, base + 0.66 * secondsPerBeat, t => kick(humanizeTime(t)), durationBeats);

            // crescendo dal beat 2
            if (b >= 1) {
                scheduleIfInSection(section, base + 0.16 * secondsPerBeat, t => kick(humanizeTime(t)), durationBeats);
                scheduleIfInSection(section, base + 0.50 * secondsPerBeat, t => kick(humanizeTime(t)), durationBeats);
            }

            // snare accent ultimi 2 beat
            if (b >= durationBeats - 2) {
                scheduleIfInSection(section, base, t => snare(humanizeTime(t)), durationBeats);
            }

            // snare roll ultimo beat
            if (b === durationBeats - 1) {
                for (let r = 0; r < 1; r += 0.25) {
                    const tRoll = base + r * secondsPerBeat;
                    scheduleIfInSection(section, tRoll, t => snare(humanizeTime(t)), durationBeats);
                }
            }
        }
    }

    // gallop_9
    if (type === "gallop_9") {
        for (let b = 0; b < durationBeats; b++) {
            const base = start + b * secondsPerBeat;

            // Accento extra sul beat 3
            if (b === 2) {
                scheduleIfInSection(section, base, t => snare(humanizeTime(t)), durationBeats);
            }

            // kick gallop
            scheduleIfInSection(section, base, t => kick(humanizeTime(t)), durationBeats);
            scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => kick(humanizeTime(t)), durationBeats);
            scheduleIfInSection(section, base + 0.75 * secondsPerBeat, t => kick(humanizeTime(t)), durationBeats);

            // ride 8th
            scheduleIfInSection(section, base, t => ride(humanizeTime(t)), durationBeats);
            scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => ride(humanizeTime(t)), durationBeats);

            // snare accent beat 2 e 4
            if (b % 2 === 1) {
                scheduleIfInSection(section, base, t => snare(humanizeTime(t)), durationBeats);
            }
        }
    }

    // power_walk / power_slide
    if (type === "power_walk" || type === "power_slide") {
        for (let b = 0; b < durationBeats; b++) {
            const base = start + b * secondsPerBeat;

            // double kick 16th
            for (let s = 0; s < 1; s += 0.25) {
                const tKick = base + s * secondsPerBeat;
                scheduleIfInSection(section, tKick, t => kick(humanizeTime(t)), durationBeats);
            }

            // ride 8th
            scheduleIfInSection(section, base, t => ride(humanizeTime(t)), durationBeats);
            scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => ride(humanizeTime(t)), durationBeats);

            // ghost notes
            if (rand() < 0.25) {
                const tGhost = base + 0.25 * secondsPerBeat;
                scheduleIfInSection(section, tGhost, t => ghostSnare(t), durationBeats);
            }

            // snare accent beat 2 e 4
            if (b % 2 === 1) {
                scheduleIfInSection(section, base, t => snare(humanizeTime(t)), durationBeats);
            }

            // tom fill ultimi 2 beat
            if (b >= durationBeats - 2) {
                const toms = [tom1, tom2, tom3, tom4];
                const tomIndex = b % 4;
                scheduleIfInSection(section, base + 0.25 * secondsPerBeat, t => toms[tomIndex](t), durationBeats);
            }
        }
    }

    // scale_up / scale_down
    if (type === "scale_up" || type === "scale_down") {
        for (let b = 0; b < durationBeats; b++) {
            const base = start + b * secondsPerBeat;

            // kick 8th
            scheduleIfInSection(section, base, t => kick(humanizeTime(t)), durationBeats);
            scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => kick(humanizeTime(t)), durationBeats);

            // snare roll
            if (b === 0) {
                scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => snare(humanizeTime(t)), durationBeats);
            }
            if (b === 1) {
                scheduleIfInSection(section, base, t => snare(humanizeTime(t)), durationBeats);
                scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => snare(humanizeTime(t)), durationBeats);
            }
            if (b === 2 || b === durationBeats - 1) {
                for (let r = 0; r < 1; r += 0.25) {
                    const tRoll = base + r * secondsPerBeat;
                    scheduleIfInSection(section, tRoll, t => snare(humanizeTime(t)), durationBeats);
                }
            }

            // tom accents
            const tomIndex = type === "scale_up" ? b % 4 : (3 - (b % 4));
            const toms = [tom1, tom2, tom3, tom4];
            scheduleIfInSection(section, base, t => toms[tomIndex](t), durationBeats);
        }
    }

    // melodic_run
    if (type === "melodic_run") {
        const tomPattern = [tom1, tom3, tom2, tom4];

        for (let b = 0; b < durationBeats; b++) {
            const base = start + b * secondsPerBeat;

            const tomIndex = b % tomPattern.length;
            scheduleIfInSection(section, base, t => tomPattern[tomIndex](t), durationBeats);
            scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => tomPattern[(tomIndex + 1) % 4](t), durationBeats);

            // ride 8th
            scheduleIfInSection(section, base, t => ride(humanizeTime(t)), durationBeats);
            scheduleIfInSection(section, base + 0.5 * secondsPerBeat, t => ride(humanizeTime(t)), durationBeats);

            // ghost notes per beat
            if (rand() < 0.3) {
                const tGhost = base + 0.25 * secondsPerBeat;
                scheduleIfInSection(section, tGhost, t => ghostSnare(t), durationBeats);
            }
        }

        // kick follower
        transitionEvents.forEach(ev => {
            const tKick = start + ev.beatOffset * secondsPerBeat;
            scheduleIfInSection(section, tKick, t => kick(humanizeTime(t)), durationBeats);
        });

        // snare accent sugli accenti melodici
        transitionEvents.forEach(ev => {
            if (ev.isAccent) {
                const tSnare = start + ev.beatOffset * secondsPerBeat;
                scheduleIfInSection(section, tSnare, t => snare(humanizeTime(t)), durationBeats);
            }
        });
    }

    // finale: crash choke + fill
    const finalTime = start + (durationBeats - 0.25) * secondsPerBeat;
    scheduleIfInSection(section, finalTime, t => crashChoke(t), durationBeats);
    finalFill(section, durationBeats);
}

    // ============================================================
    // EXPORT
    // ============================================================

    return {
        scheduleSection,
        scheduleTransition
    };
}
