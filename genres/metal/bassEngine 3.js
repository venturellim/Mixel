// bassEngine.js — versione 002 (Helloween style)
// Basso power metal: dritto, potente, radicato sulla root.
// Pattern coerenti con riffEngine, ma indipendenti.

import * as Tone from "https://esm.sh/tone";
import { degreeToRoot } from "./metalTheory.js";


console.log("bassEngine.js ver. 002 loaded");

export function initBassEngine(instruments, params, rand) {

    const { bass } = instruments;
    const secondsPerBeat = 60 / params.bpm;
    const measureDuration = secondsPerBeat * 4;

    // ============================================================
    // 🎵 UTILITIES
    // ============================================================

    function scheduleIfInSection(section, eventTime, cb) {
        const end = section.startTime + section.measures * measureDuration;
        if (eventTime >= end) return;
        Tone.Transport.schedule(cb, eventTime);
    }

    function toLetter(n) {
        return typeof n === "string" ? n[0] : "A";
    }

    // ============================================================
    // 🎸 PATTERN DISPATCHER
    // ============================================================

    function scheduleBassPattern(section, scale, root, pattern, offset) {
        switch(pattern) {

            // --- PEDAL ---
            case "pedal_8n":       return schedulePedal8n(section, scale, root, offset);
            case "pedal_16n":      return schedulePedal16n(section, scale, root, offset);

            // --- GALLOP ---
            case "gallop":         return scheduleGallop(section, scale, root, offset);
            case "reverse_gallop": return scheduleReverseGallop(section, scale, root, offset);

            // --- ROOT–FIFTH ---
            case "root_fifth":     return scheduleRootFifth(section, scale, root, offset);
            case "root_octave":    return scheduleRootOctave(section, scale, root, offset);

            // --- SINCOPATI ---
            case "syncopated_8n":  return scheduleSyncopated8n(section, scale, root, offset);
            case "power_slide":    return schedulePowerSlide(section, scale, root, offset);
case "accent_first":   return scheduleAccentFirst(section, scale, root, offset);
case "accent_third":   return scheduleAccentThird(section, scale, root, offset);


            // --- FALLBACK ---
            default:
                console.warn("[BASS] Pattern sconosciuto:", pattern, "→ fallback pedal_8n");
                return schedulePedal8n(section, scale, root, offset);
        }
    }

    // ============================================================
    // 🎸 PATTERN IMPLEMENTATION (vuoti, li riempiamo dopo)
    // ============================================================

    function schedulePedal8n(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    // Timeline: ottavi → "8n"
    const timeline = Tone.Time("8n").toSeconds();
    const measureDuration = Tone.Time("1m").toSeconds();

    // Quante note?  
    // Ogni misura = 8 ottavi → 8 colpi per misura
    const hits = Math.floor(measureDuration / timeline);

    for (let i = 0; i < hits; i++) {
        const eventTime = s + i * timeline;

        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",   // registro del basso
                "8n",
                time
            );
        });
    }
}


    function schedulePedal16n(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const sixteenth = Tone.Time("16n").toSeconds();
    const measureDuration = Tone.Time("1m").toSeconds();

    const hits = Math.floor(measureDuration / sixteenth);

    for (let i = 0; i < hits; i++) {
        const eventTime = s + i * sixteenth;

        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "16n",
                time
            );
        });
    }
}


    function scheduleGallop(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const beat = Tone.Time("4n").toSeconds();   // 1/4
    const sixteenth = Tone.Time("16n").toSeconds(); // 1/16

    // 4 gallop per misura (4/4)
    for (let g = 0; g < 4; g++) {

        const base = s + g * beat;

        // 1) colpo sul beat
        scheduleIfInSection(section, base, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "16n",
                time
            );
        });

        // 2) sedicesimo dopo
        scheduleIfInSection(section, base + sixteenth, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "16n",
                time
            );
        });

        // 3) altro sedicesimo
        scheduleIfInSection(section, base + sixteenth * 2, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "16n",
                time
            );
        });
    }
}


    function scheduleReverseGallop(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const beat = Tone.Time("4n").toSeconds();       // 1/4
    const sixteenth = Tone.Time("16n").toSeconds(); // 1/16

    // 4 reverse gallop per misura (4/4)
    for (let g = 0; g < 4; g++) {

        const base = s + g * beat;

        // 1) sedicesimo dopo il beat
        scheduleIfInSection(section, base + sixteenth, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "16n",
                time
            );
        });

        // 2) altro sedicesimo
        scheduleIfInSection(section, base + sixteenth * 2, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "16n",
                time
            );
        });

        // 3) ottavo (salta il beat, colpisce dopo)
        scheduleIfInSection(section, base + sixteenth * 4, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "16n",
                time
            );
        });
    }
}


    function scheduleRootFifth(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);

    // Trova la quinta nella scala
    const idx = scale.indexOf(rootLetter);
    let fifthLetter = rootLetter;

    if (idx !== -1) {
        const fifthIdx = idx + 4; // quinta giusta nella scala naturale
        if (fifthIdx < scale.length) {
            fifthLetter = scale[fifthIdx];
        }
    }

    const s = section.startTime + offset;

    const eighth = Tone.Time("8n").toSeconds();
    const measureDuration = Tone.Time("1m").toSeconds();

    const hits = Math.floor(measureDuration / eighth);

    for (let i = 0; i < hits; i++) {
        const eventTime = s + i * eighth;

        const noteLetter = (i % 2 === 0) ? rootLetter : fifthLetter;

        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                noteLetter + "1",
                "8n",
                time
            );
        });
    }
}


    function scheduleRootOctave(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);

    // L’ottava è semplicemente la stessa lettera, ma registro superiore
    const rootNote = rootLetter + "1";
    const octaveNote = rootLetter + "2"; // una ottava sopra

    const s = section.startTime + offset;

    const eighth = Tone.Time("8n").toSeconds();
    const measureDuration = Tone.Time("1m").toSeconds();

    const hits = Math.floor(measureDuration / eighth);

    for (let i = 0; i < hits; i++) {
        const eventTime = s + i * eighth;

        const note = (i % 2 === 0) ? rootNote : octaveNote;

        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                note,
                "8n",
                time
            );
        });
    }
}


    function scheduleSyncopated8n(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const eighth = Tone.Time("8n").toSeconds();
    const sixteenth = Tone.Time("16n").toSeconds();
    const measureDuration = Tone.Time("1m").toSeconds();

    // Offsets in ottavi (con sincopi)
    const offsets = [
        0,
        eighth + sixteenth,      // 1.5 ottavi
        2 * eighth,
        3 * eighth + sixteenth,  // 3.5 ottavi
        4 * eighth,
        5 * eighth + sixteenth,  // 5.5 ottavi
        6 * eighth,
        7 * eighth + sixteenth   // 7.5 ottavi
    ];

    offsets.forEach(off => {
        const eventTime = s + off;

        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "8n",
                time
            );
        });
    });
}

function schedulePowerSlide(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const beat = Tone.Time("4n").toSeconds();
    const measureDuration = Tone.Time("1m").toSeconds();

    // Nota “di partenza” per lo slide: una quinta sotto se possibile
    const idx = scale.indexOf(rootLetter);
    const slideFrom = (idx > 0 ? scale[idx - 1] : rootLetter) + "1";
    const slideTo   = rootLetter + "1";

    // Slide iniziale (nota breve che porta alla root)
    scheduleIfInSection(section, s, time => {
        instruments.bass.triggerAttackRelease(slideFrom, "8n", time);
    });

    // Arrivo sulla root, leggermente dopo
    scheduleIfInSection(section, s + beat * 0.5, time => {
        instruments.bass.triggerAttackRelease(slideTo, "4n", time);
    });

    // Riempimento: ottavi sulla root fino a fine misura
    const eighth = Tone.Time("8n").toSeconds();
    for (let t = beat; t < measureDuration; t += eighth) {
        const eventTime = s + t;
        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "8n",
                time
            );
        });
    }
}

function scheduleAccentFirst(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const beat = Tone.Time("4n").toSeconds();
    const eighth = Tone.Time("8n").toSeconds();
    const measureDuration = Tone.Time("1m").toSeconds();

    // Accento sul primo beat (nota più lunga)
    scheduleIfInSection(section, s, time => {
        instruments.bass.triggerAttackRelease(
            rootLetter + "1",
            "4n",
            time
        );
    });

    // Dal secondo beat in poi → ottavi dritti
    for (let t = beat; t < measureDuration; t += eighth) {
        const eventTime = s + t;
        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "8n",
                time
            );
        });
    }
}

function scheduleAccentThird(section, scale, root, offset = 0) {
    const rootLetter = toLetter(root);
    const s = section.startTime + offset;

    const beat = Tone.Time("4n").toSeconds();
    const eighth = Tone.Time("8n").toSeconds();
    const measureDuration = Tone.Time("1m").toSeconds();

    // Beat 1–2: ottavi
    for (let t = 0; t < 2 * beat; t += eighth) {
        const eventTime = s + t;
        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "8n",
                time
            );
        });
    }

    // Beat 3: accento (nota lunga)
    scheduleIfInSection(section, s + 2 * beat, time => {
        instruments.bass.triggerAttackRelease(
            rootLetter + "1",
            "4n",
            time
        );
    });

    // Beat 4: ottavi
    for (let t = 3 * beat; t < measureDuration; t += eighth) {
        const eventTime = s + t;
        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                rootLetter + "1",
                "8n",
                time
            );
        });
    }
}

    // ============================================================
    // 🎼 TRANSIZIONI DEL BASSO
    // ============================================================
    
    function scheduleWalkingUp(section, scale, fromRoot, toRoot, durationBeats, offset = 0) {
    const s = section.startTime + offset;

    const beat = Tone.Time("4n").toSeconds();
    const totalTime = durationBeats * beat;

    const startIdx = scale.indexOf(toLetter(fromRoot));
    const endIdx   = scale.indexOf(toLetter(toRoot));

    if (startIdx === -1 || endIdx === -1) return;

    const step = startIdx < endIdx ? 1 : -1;
    const notes = [];

    for (let i = startIdx; i !== endIdx + step; i += step) {
        notes.push(scale[i]);
    }

    const interval = totalTime / notes.length;

    notes.forEach((letter, i) => {
        const eventTime = s + i * interval;

        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                letter + "1",
                "8n",
                time
            );
        });
    });
}

function scheduleWalkingDown(section, scale, fromRoot, toRoot, durationBeats, offset = 0) {
    const s = section.startTime + offset;

    const beat = Tone.Time("4n").toSeconds();
    const totalTime = durationBeats * beat;

    const startIdx = scale.indexOf(toLetter(fromRoot));
    const endIdx   = scale.indexOf(toLetter(toRoot));

    if (startIdx === -1 || endIdx === -1) return;

    const step = startIdx > endIdx ? -1 : 1;
    const notes = [];

    for (let i = startIdx; i !== endIdx + step; i += step) {
        notes.push(scale[i]);
    }

    const interval = totalTime / notes.length;

    notes.forEach((letter, i) => {
        const eventTime = s + i * interval;

        scheduleIfInSection(section, eventTime, time => {
            instruments.bass.triggerAttackRelease(
                letter + "1",
                "8n",
                time
            );
        });
    });
}

    function scheduleTransition(section, transition) {
    const { events, durationBeats } = transition;

    const start = section.startTime;
    const end   = start + durationBeats * secondsPerBeat;

    // from → to
    const fromNote = events[0].note;
    const toNote   = events[events.length - 1].note;

    const letters = ["C","D","E","F","G","A","B"];
    const i1 = letters.indexOf(fromNote);
    const i2 = letters.indexOf(toNote);

    let dist = Math.abs(i1 - i2);
    if (dist > 3) dist = 7 - dist;

    const scale = section.scale;

    // ---------------------------------------------------------
    // SLIDE INIZIALE (solo se cambia nota)
    // ---------------------------------------------------------
    if (dist > 0) {
        Tone.Transport.schedule(time => {
            instruments.bass.triggerAttackRelease(
                fromNote + "1",
                "8n",
                time
            );
        }, start);
    }

    // ---------------------------------------------------------
    // TRANSIZIONI CORTE (≤ 4 beat)
    // ---------------------------------------------------------
    if (durationBeats <= 4) {

        // distanza 0 → pedal_16n
        if (dist === 0) {
            schedulePedal16n(section, scale, fromNote, 0);
            return;
        }

        // distanza 1 → gallop
        if (dist === 1) {
            scheduleGallop(section, scale, fromNote, 0);
            return;
        }

        // distanza 2–3 → reverse gallop (più tensione)
        if (dist === 2 || dist === 3) {
            scheduleReverseGallop(section, scale, fromNote, 0);
            return;
        }

        // distanza grande → power slide
        schedulePowerSlide(section, scale, fromNote, 0);
        return;
    }

    // ---------------------------------------------------------
    // TRANSIZIONI MEDIE (5–6 beat)
    // ---------------------------------------------------------
    if (durationBeats <= 6) {

        // distanza piccola → accent_first (groove)
        if (dist === 0 || dist === 1) {
            scheduleAccentFirst(section, scale, fromNote, 0);
            return;
        }

        // distanza media → walking breve
        if (dist === 2 || dist === 3) {
            if (i1 < i2) {
                scheduleWalkingUp(section, scale, fromNote, toNote, durationBeats, 0);
            } else {
                scheduleWalkingDown(section, scale, fromNote, toNote, durationBeats, 0);
            }
            return;
        }

        // distanza grande → power slide + pedal
        schedulePowerSlide(section, scale, fromNote, 0);
        return;
    }

    // ---------------------------------------------------------
    // TRANSIZIONI LUNGHE (≥ 7 beat)
    // ---------------------------------------------------------
    if (durationBeats >= 7) {

        // distanza piccola → accent_third (tensione)
        if (dist === 0 || dist === 1) {
            scheduleAccentThird(section, scale, fromNote, 0);
            return;
        }

        // distanza media o grande → walking completo
        if (i1 < i2) {
            scheduleWalkingUp(section, scale, fromNote, toNote, durationBeats, 0);
        } else {
            scheduleWalkingDown(section, scale, fromNote, toNote, durationBeats, 0);
        }
        return;
    }
}

    // ============================================================
    // 🎼 SCHEDULAZIONE SEZIONE
    // ============================================================

    function scheduleSection(section, scale, progression, riffEvents = null) {

    // Se abbiamo gli eventi del riff → il basso li segue
    if (riffEvents && riffEvents.length > 0) {

        riffEvents.forEach(ev => {

            const eventTime = section.startTime + ev.beatOffset * secondsPerBeat;

            const rootLetter = toLetter(ev.note);

            scheduleIfInSection(section, eventTime, time => {
                instruments.bass.triggerAttackRelease(
                    rootLetter + "1",
                    ev.type === "open" ? "4n" : "8n",
                    time
                );
            });
        });

        return;
    }

    // Fallback: pattern Helloween
    const measures = section.measures;

    for (let i = 0; i < measures; i++) {

        const degree = progression[i % progression.length];
        const root = degreeToRoot(degree, params.tonalCenter);

        const offset = i * measureDuration;

        scheduleBassPattern(section, scale, root, "pedal_8n", offset);
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
