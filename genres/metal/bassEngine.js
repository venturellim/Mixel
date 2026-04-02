// bassEngine.js — ver. 3.0
// Power Metal Bass Engine
// Pattern-driven + followRiff + riffMute + riffPattern mapping
// Struttura identica al keyboardEngine per compatibilità totale

import * as Tone from "https://esm.sh/tone";

console.log("bassEngine.js ver. 003 loaded");

export function initBassEngine(instruments, metalParams, rand) {

    // ============================================================
    // UTILITIES
    // ============================================================

    function normalizeBassNote(note) {
        const letter = note.replace(/[0-9]/g, "");
        return letter + "2";
    }

    // ============================================================
    // 🎸 BASS PATTERN LIBRARY
    // ============================================================

    const bassPatterns = {

        walking: {
            generate(scale, durationBeats, rand) {
                const events = [];
                for (let i = 0; i < durationBeats; i++) {
                    events.push({
                        beatOffset: i,
                        note: normalizeBassNote(scale[i % scale.length]),
                        duration: "4n",
                        velocity: 0.9
                    });
                }
                return { events };
            }
        },

        gallop: {
            generate(scale, durationBeats, rand) {
                const events = [];
                for (let i = 0; i < durationBeats; i++) {
                    const root = normalizeBassNote(scale[i % scale.length]);

                    events.push({ beatOffset: i,       note: root, duration: "8n",  velocity: 0.95 });
                    events.push({ beatOffset: i + 0.5, note: root, duration: "16n", velocity: 0.85 });
                    events.push({ beatOffset: i + 0.75,note: root, duration: "16n", velocity: 0.85 });
                }
                return { events };
            }
        },

        pedal: {
            generate(scale, durationBeats, rand) {
                const events = [];
                const root = normalizeBassNote(scale[0]);
                for (let i = 0; i < durationBeats; i++) {
                    events.push({
                        beatOffset: i,
                        note: root,
                        duration: "4n",
                        velocity: 0.9
                    });
                }
                return { events };
            }
        },

        octaveJump: {
            generate(scale, durationBeats, rand) {
                const events = [];
                for (let i = 0; i < durationBeats; i++) {
                    const root = normalizeBassNote(scale[i % scale.length]);
                    events.push({ beatOffset: i,       note: root,       duration: "8n", velocity: 0.9 });
                    events.push({ beatOffset: i + 0.5, note: root.replace("2","3"), duration: "8n", velocity: 0.85 });
                }
                return { events };
            }
        },

        powerChug: {
            generate(scale, durationBeats, rand) {
                const events = [];
                const root = normalizeBassNote(scale[0]);
                for (let i = 0; i < durationBeats * 2; i++) {
                    events.push({
                        beatOffset: i * 0.5,
                        note: root,
                        duration: "8n",
                        velocity: 0.9
                    });
                }
                return { events };
            }
        },

        heroicRun: {
            generate(scale, durationBeats, rand) {
                const events = [];
                const total = durationBeats * 4;
                for (let i = 0; i < total; i++) {
                    const note = normalizeBassNote(scale[i % scale.length]);
                    events.push({
                        beatOffset: i * 0.25,
                        note,
                        duration: "16n",
                        velocity: 0.8
                    });
                }
                return { events };
            }
        }
    };

    // ============================================================
    // 🎯 PATTERN PICKER (coerente col riff)
    // ============================================================

    function pickBassPatternForSubsection(riffPattern, riffMute) {

        const original = riffPattern;
        if (!riffPattern) riffPattern = "unknown";

        if (riffMute === 0) return "followRiff";

        riffPattern = riffPattern.toLowerCase();

        let bp = "walking";

        if (riffPattern.includes("gallop")) bp = "gallop";
        else if (riffPattern.includes("reverse")) bp = "gallop";
        else if (riffPattern.includes("pedal")) bp = "pedal";
        else if (riffPattern.includes("syncopated")) bp = "powerChug";
        else if (riffPattern.includes("open_epic")) bp = "heroicRun";
        else if (riffPattern.includes("open_drive")) bp = "gallop";
        else if (riffPattern.includes("open_half_time")) bp = "walking";

        console.log(
            `%c[BASS] Riff → Bass`,
            "color:#00ffaa; font-weight:bold;",
            `riffPattern="${original}" → bassPattern="${bp}"`
        );

        return bp;
    }

    // ============================================================
    // 🎸 SCHEDULAZIONE PER SOTTOSEZIONE
    // ============================================================

    function scheduleBassSubsection(
    section,
    scale,
    riffEvents,
    themeEvents,
    startTime,
    measures,
    patternName
) {
    const secondsPerBeat = 60 / section.bpm;
    const durationBeats = measures * 4;

    // ============================================================
    // FOLLOW RIFF (eventi già normalizzati dal metalEngine)
    // ============================================================
    if (patternName === "followRiff") {

        riffEvents.forEach(ev => {
            const eventTime = startTime + ev.beatOffset * secondsPerBeat;

            Tone.Transport.schedule(time => {
                instruments.bass.triggerAttackRelease(
                    ev.note,                // già normalizzata dal metalEngine
                    ev.duration ?? "16n",
                    time,
                    ev.velocity ?? 0.9
                );
            }, eventTime);
        });

        return;
    }

    // ============================================================
    // PATTERN INDIPENDENTE
    // ============================================================

    const pattern = bassPatterns[patternName];
    if (!pattern) {
        console.warn("[BASS] Pattern non trovato:", patternName);
        return;
    }

    console.log(
        `%c[BASS] Subsection`,
        "color:#33ddff; font-weight:bold;",
        `section="${section.name}", measures=${measures}, pattern="${patternName}"`
    );

    const events = pattern.generate(scale, durationBeats, rand).events;

    events.forEach(ev => {
        const eventTime = startTime + ev.beatOffset * secondsPerBeat;

        Tone.Transport.schedule(time => {
            instruments.bass.triggerAttackRelease(
                ev.note,
                ev.duration,
                time,
                ev.velocity
            );
        }, eventTime);
    });
}

    // ============================================================
    // 🎸 SCHEDULAZIONE STANDARD (followRiff)
    // ============================================================

    function scheduleBassSection(section, scale, progression, riffEvents) {
    const secondsPerBeat = 60 / section.bpm;

    riffEvents.forEach(ev => {
        const eventTime = section.startTime + ev.beatOffset * secondsPerBeat;

        Tone.Transport.schedule(time => {
            instruments.bass.triggerAttackRelease(
                ev.note,            // già normalizzata dal metalEngine
                ev.duration ?? "16n",
                time,
                ev.velocity ?? 0.9
            );
        }, eventTime);
    });
}

    // ============================================================
    // EXPORT (identico al keyboardEngine)
    // ============================================================

    return {
        pickBassPatternForSubsection,
        scheduleBassSubsection,
        scheduleBassSection
    };
}
