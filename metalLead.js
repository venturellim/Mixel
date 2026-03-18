// metalLead.js — lead melodica avanzata (solo + hook + chord aware)

import * as Tone from "https://esm.sh/tone";
import { guitarLead, humanizeTime } from "./common.js";

console.log("metalLead.js loaded");

export function createLeadEngine(analysis, params, timeline, riffData, rand, theme) {

    const { stepsPerMeasure, totalSteps } = timeline;
    const scale = params.scale;

    const MIN = 60;
    const MAX = 84;

    function clampMidi(m) {
        return Math.max(MIN, Math.min(MAX, m));
    }

    // ------------------------------------------------------------
    // DEBUG SEZIONI
    // ------------------------------------------------------------

    let lastSection = null;

    // ------------------------------------------------------------
    // CHORD HELPERS
    // ------------------------------------------------------------

    function getChordTones(chord) {
        return [chord[0], chord[1], chord[2]];
    }

    function getScaleNotes(scale, octave = 4) {
        return scale.map(n => n + octave);
    }

    // ------------------------------------------------------------
    // SOLO PHRASES
    // ------------------------------------------------------------

    function createSoloPhrase(scale, chord) {

        const chordTones = getChordTones(chord);
        const passing = getScaleNotes(scale);

        const r = rand();

        // HOLD
        if (r < 0.25) {
            return {
                type: "hold",
                note: chordTones[Math.floor(rand()*chordTones.length)],
                duration: rand() < 0.5 ? "1m" : "2m"
            };
        }

        // RUN
        if (r < 0.65) {

            const len = [4,6,8][Math.floor(rand()*3)];
            const start = Math.floor(rand() * passing.length);

            const notes = [];

            for (let i = 0; i < len; i++) {
                notes.push(passing[(start + i) % passing.length]);
            }

            // chiudi su chord tone
            notes[notes.length - 1] =
                chordTones[Math.floor(rand()*chordTones.length)];

            return {
                type: "run",
                notes,
                duration: "16n"
            };
        }

        // MELODY
        return {
            type: "melody",
            notes: [
                chordTones[Math.floor(rand()*chordTones.length)],
                passing[Math.floor(rand()*passing.length)],
                chordTones[Math.floor(rand()*chordTones.length)]
            ],
            duration: "8n"
        };
    }

    let currentPhrase = null;
    let phraseStep = 0;

    // ------------------------------------------------------------
    // CHORUS HOOK
    // ------------------------------------------------------------

    let chorusHoldNote = null;
    let chorusHoldTimer = 0;

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------

    return function leadEngine(time, step) {

        const idx = step % totalSteps;

        const { stepInMeasure, section } =
            timeline.getStepData(step);

        const chord = riffData.chordTimeline[idx];
        if (!chord) return;

        // --------------------------------------------------------
        // LOG SEZIONE
        // --------------------------------------------------------

        if (section !== lastSection) {
            console.log(`\n===== 🎵 SECTION: ${section.toUpperCase()} =====`);
            lastSection = section;
        }

        // --------------------------------------------------------
        // CHORUS → HOOK LUNGO
        // --------------------------------------------------------

        if (section === "chorus") {

            if (chorusHoldTimer <= 0) {

                const chordTones = getChordTones(chord);

                chorusHoldNote =
                    chordTones[Math.floor(rand()*chordTones.length)];

                chorusHoldTimer =
                    (rand() < 0.5 ? 1 : 2) * stepsPerMeasure;

                guitarLead.triggerAttackRelease(
                    chorusHoldNote,
                    "1m",
                    time,
                    0.9
                );
            }

            chorusHoldTimer--;

            // sotto possiamo ancora mettere qualche nota leggera
            if (rand() < 0.2) {

                const passing = getScaleNotes(scale);
                const note =
                    passing[Math.floor(rand()*passing.length)];

                guitarLead.triggerAttackRelease(
                    note,
                    "8n",
                    humanizeTime(time, rand),
                    0.6
                );
            }

            return;
        }

        // --------------------------------------------------------
        // SOLO → PHRASE ENGINE
        // --------------------------------------------------------

        if (section === "solo") {

            if (stepInMeasure === 0 || !currentPhrase) {
                currentPhrase =
                    createSoloPhrase(scale, chord);
                phraseStep = 0;
            }

            if (currentPhrase.type === "hold") {

                if (phraseStep === 0) {
                    guitarLead.triggerAttackRelease(
                        currentPhrase.note,
                        currentPhrase.duration,
                        time,
                        1
                    );
                }

                phraseStep++;
                return;
            }

            if (phraseStep < currentPhrase.notes.length) {

                const noteName =
                    currentPhrase.notes[phraseStep];

                let midi =
                    Tone.Frequency(noteName).toMidi();

                midi = clampMidi(midi);

                const note =
                    Tone.Frequency(midi, "midi").toNote();

                guitarLead.triggerAttackRelease(
                    note,
                    currentPhrase.duration,
                    humanizeTime(time, rand),
                    0.9
                );

                phraseStep++;
            }

            return;
        }

        // --------------------------------------------------------
        // VERSE / INTRO / OUTRO → LIGHT LEAD
        // --------------------------------------------------------

        const density =
            section === "intro" ? 0.4 :
            section === "verse" ? 0.6 :
            section === "outro" ? 0.3 : 0.5;

        if (rand() > density) return;

        const chordTones = getChordTones(chord);

        const noteName =
            chordTones[Math.floor(rand()*chordTones.length)];

        let midi =
            Tone.Frequency(noteName).toMidi();

        midi = clampMidi(midi);

        const note =
            Tone.Frequency(midi, "midi").toNote();

        guitarLead.triggerAttackRelease(
            note,
            "8n",
            humanizeTime(time, rand),
            0.7
        );
    };
}