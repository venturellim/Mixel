// keyboardEngine.js — ver. 1.1
// Power Metal Keyboardist Lead Engine
// Frasi shred, melodiche, arpeggi, armonizzazioni, call & response
// Foto-driven, sezione-driven, tonalità-driven

import * as Tone from "https://esm.sh/tone";

console.log("keyboardEngine.js ver. 001.3 loaded");

export function initKeyboardEngine(instruments, metalParams, rand, imageParams) {

    const { keyboardLead: soloLead } = instruments;

    // ============================================================
    // 🎹 KEYBOARD PATTERN LIBRARY (per sezioni spezzate)
    // ============================================================

    const keyboardPatterns = {

        // Arpeggio ascendente
        arp_up: {
            generate(scale, durationBeats, rand) {
                const events = [];
                for (let i = 0; i < durationBeats * 2; i++) {
                    const note = scale[i % scale.length] + "5";
                    events.push({
                        beatOffset: i * 0.5,
                        note,
                        duration: "8n",
                        velocity: 0.8
                    });
                }
                return { events };
            }
        },

        // Arpeggio discendente
        arp_down: {
            generate(scale, durationBeats, rand) {
                const events = [];
                for (let i = 0; i < durationBeats * 2; i++) {
                    const note = scale[(scale.length - 1 - (i % scale.length))] + "5";
                    events.push({
                        beatOffset: i * 0.5,
                        note,
                        duration: "8n",
                        velocity: 0.8
                    });
                }
                return { events };
            }
        },

        // Scala veloce
        scale_run: {
            generate(scale, durationBeats, rand) {
                const events = [];
                for (let i = 0; i < durationBeats * 4; i++) {
                    const note = scale[i % scale.length] + "5";
                    events.push({
                        beatOffset: i * 0.25,
                        note,
                        duration: "16n",
                        velocity: 0.7
                    });
                }
                return { events };
            }
        },

        // Fanfara epica (triadi)
        fanfare: {
            generate(scale, durationBeats, rand) {
                const events = [];
                for (let i = 0; i < durationBeats; i++) {
                    const root = scale[i % scale.length] + "5";
                    const third = scale[(i + 2) % scale.length] + "5";
                    const fifth = scale[(i + 4) % scale.length] + "5";

                    events.push({
                        beatOffset: i,
                        note: root,
                        duration: "4n",
                        velocity: 0.9
                    });
                    events.push({
                        beatOffset: i,
                        note: third,
                        duration: "4n",
                        velocity: 0.9
                    });
                    events.push({
                        beatOffset: i,
                        note: fifth,
                        duration: "4n",
                        velocity: 0.9
                    });
                }
                return { events };
            }
        },

        // Cluster (accordi densi)
        cluster: {
            generate(scale, durationBeats, rand) {
                const events = [];
                for (let i = 0; i < durationBeats; i++) {
                    scale.forEach(n => {
                        events.push({
                            beatOffset: i,
                            note: n + "4",
                            duration: "4n",
                            velocity: 0.5
                        });
                    });
                }
                return { events };
            }
        }
    };

    // ============================================================
    // PROFILE FROM IMAGE
    // ============================================================

    function getProfile(imageParams) {
        return {
            energy: imageParams?.energy ?? 0.5,
            darkness: imageParams?.texture ?? 0.5,
            complexity: imageParams?.complexity ?? 0.5,
            dna: imageParams?.dna ?? 123456
        };
    }

    // ============================================================
    // SCALE UTILITIES
    // ============================================================

    function buildScaleInRange(scale, lowOct, highOct) {
        const letters = scale.map(n => n[0].toUpperCase());
        const notes = [];
        for (let o = lowOct; o <= highOct; o++) {
            letters.forEach(l => notes.push(l + o));
        }
        return notes;
    }

    function pickRandom(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    }

    // ============================================================
    // SOLO STYLE SELECTION
    // ============================================================

    function pickSoloStyle(profile) {
        const { energy, darkness, complexity } = profile;

        if (energy > 0.7 && complexity > 0.6) return "shred";
        if (darkness > 0.6) return "epic";
        if (energy < 0.5) return "lyric";
        return "melodic";
    }

    // ============================================================
    // PHRASE GENERATORS
    // ============================================================

    function generateShredPattern(scale) {
        const pool = buildScaleInRange(scale, 4, 6);
        const phrase = [];

        for (let i = 0; i < 16; i++) {
            phrase.push({
                note: pickRandom(pool),
                dur: "16n"
            });
        }
        return phrase;
    }

    function generateEpicPhrase(scale) {
        const pool = buildScaleInRange(scale, 4, 5);
        const phrase = [];

        for (let i = 0; i < 8; i++) {
            phrase.push({
                note: pool[i % pool.length],
                dur: "8n"
            });
        }
        return phrase;
    }

    function generateLyricPhrase(scale) {
        const pool = buildScaleInRange(scale, 4, 5);
        return [
            { note: pool[0], dur: "2n" },
            { note: pool[2], dur: "2n" }
        ];
    }

    function generateMelodicPhrase(scale) {
        const pool = buildScaleInRange(scale, 4, 5);
        const phrase = [];

        for (let i = 0; i < 6; i++) {
            phrase.push({
                note: pool[(i * 2) % pool.length],
                dur: "4n"
            });
        }
        return phrase;
    }

    // ============================================================
    // HARMONIZATION
    // ============================================================

    function harmonizeLine(line, scale) {
        const letters = scale.map(n => n[0].toUpperCase());
        const thirdUp = {};

        for (let i = 0; i < letters.length; i++) {
            thirdUp[letters[i]] = letters[(i + 2) % letters.length];
        }

        return line.map(ev => {
            const base = ev.note[0].toUpperCase();
            const oct = ev.note.slice(1);
            const harm = thirdUp[base] + oct;
            return { note: harm, dur: ev.dur };
        });
    }

    // ============================================================
    // SCHEDULING
    // ============================================================

    function schedulePhrase(section, phrase, volume = 0.8) {
        const start = section.startTime;
        let t = start;

        phrase.forEach(ev => {
            Tone.Transport.schedule(time => {
                soloLead.triggerAttackRelease(ev.note, ev.dur, time, volume);
            }, t);
            t += Tone.Time(ev.dur).toSeconds();
        });
    }

    // ============================================================
    // PUBLIC API — MAIN KEYBOARD
    // ============================================================

    function scheduleKeyboard(section, scale, riffEvents, themeEvents) {

        const profile = getProfile(imageParams);
        const style = pickSoloStyle(profile);

        let phrase;

        switch (style) {
            case "shred":   phrase = generateShredPattern(scale); break;
            case "epic":    phrase = generateEpicPhrase(scale); break;
            case "lyric":   phrase = generateLyricPhrase(scale); break;
            case "melodic":
            default:        phrase = generateMelodicPhrase(scale); break;
        }

        if (profile.complexity > 0.7) {
            const harmony = harmonizeLine(phrase, scale);
            schedulePhrase(section, harmony, 0.5);
        }

        schedulePhrase(section, phrase, 0.9);
    }

    // ============================================================
    // 🎹 SCHEDULAZIONE PER SOTTOSEZIONE (v23+)
    // ============================================================

    function scheduleKeyboardSubsection(
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

        const pattern = keyboardPatterns[patternName];
        if (!pattern) {
            console.warn("[KEYBOARD] Pattern non trovato:", patternName);
            return;
        }

        const events = pattern.generate(scale, durationBeats, rand).events;

        events.forEach(ev => {
            const eventTime = startTime + ev.beatOffset * secondsPerBeat;

            Tone.Transport.schedule(time => {
                instruments.keyboardLead.triggerAttackRelease(
                    ev.note,
                    ev.duration ?? "16n",
                    time,
                    ev.velocity
                );
            }, eventTime);
        });
    }

    // ============================================================
    // EXPORT
    // ============================================================

    return {
        scheduleKeyboard,
        scheduleKeyboardSubsection
    };
}
