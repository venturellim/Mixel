// pianoEngine.js — Photo Piano Cinematic + Minimal Hybrid (FINAL)

import * as Tone from "https://esm.sh/tone";
import { humanizeTime } from "./common.js";

console.log("pianoEngine FINAL loaded");

// synth piano (puoi sostituire con sampler dopo)
const piano = new Tone.PolySynth(Tone.Synth).toDestination();

export function createPianoEngine(analysis, params, timeline, rand) {

    const { stepsPerMeasure, totalSteps } = timeline;
    const scale = params.scale;
    const dna = analysis.dna || 123456;

    // --------------------------------------------------------
    // 🎚️ STYLE BLEND
    // --------------------------------------------------------

    const cinematicFactor =
        (1 - analysis.energy) * 0.6 +
        analysis.complexity * 0.4;

    const minimalFactor = 1 - cinematicFactor;

    // --------------------------------------------------------
    // 🎬 STRUTTURA EMOTIVA
    // --------------------------------------------------------

    function getSectionEnergy(section) {
        switch (section) {
            case "intro": return 0.3;
            case "A": return 0.5;
            case "B": return 0.7;
            case "climax": return 1.0;
            case "outro": return 0.2;
            default: return 0.5;
        }
    }

    // --------------------------------------------------------
    // 🎵 DNA RHYTHM
    // --------------------------------------------------------

    const rhythmPattern = [];

    for (let i = 0; i < stepsPerMeasure; i++) {
        rhythmPattern.push(((dna >> i) & 1) === 1);
    }

    // --------------------------------------------------------
    // 🎼 CHORD BUILDER
    // --------------------------------------------------------

    function buildChord(root) {

        const midi = Tone.Frequency(root).toMidi();

        const chord = [
            Tone.Frequency(midi, "midi").toNote(),
            Tone.Frequency(midi + 7, "midi").toNote(),
            Tone.Frequency(midi + 12, "midi").toNote()
        ];

        if (cinematicFactor > 0.5 && rand() < cinematicFactor) {
            chord.push(
                Tone.Frequency(midi + 11, "midi").toNote()
            );
        }

        return chord;
    }

    // --------------------------------------------------------
    // 🎼 PROGRESSION
    // --------------------------------------------------------

    const progressionSets = [
        [0,4,5,3],
        [0,5,3,4],
        [0,3,4,5]
    ];

    const progression =
        progressionSets[
            Math.floor(rand() * progressionSets.length)
        ];

    const chordTimeline = new Array(totalSteps);

    for (let step = 0; step < totalSteps; step++) {

        const measure = Math.floor(step / stepsPerMeasure);
        const degree = progression[measure % progression.length];

        const root = scale[degree] + 3;
        chordTimeline[step] = buildChord(root);
    }

    // --------------------------------------------------------
    // 🎹 MANO SINISTRA (BASSO PIANO)
    // --------------------------------------------------------

    function playLeftHand(chord, time, sectionEnergy) {

        const root = chord[0];
        const fifth = chord[1];

        const pattern = rand() < 0.5
            ? [root, null, fifth, null]
            : [root, fifth, root, null];

        const stepDur = "8n";

        pattern.forEach((n, i) => {
            if (!n) return;

            const t = Tone.Time(time) + Tone.Time(stepDur) * i;

            piano.triggerAttackRelease(
                n,
                "8n",
                humanizeTime(t, rand),
                0.5 + sectionEnergy * 0.3
            );
        });
    }

    // --------------------------------------------------------
    // 🎵 TEMA (HOOK)
    // --------------------------------------------------------

    function generateTheme() {

        const len = 4 + Math.floor(rand() * 4);
        const theme = [];

        let idx = Math.floor(rand() * scale.length);

        for (let i = 0; i < len; i++) {

            theme.push(scale[idx] + 5);

            idx += rand() < 0.5 ? 1 : -1;
            if (idx < 0) idx = 0;
            if (idx >= scale.length) idx = scale.length - 1;
        }

        return theme;
    }

    const theme = generateTheme();

    // --------------------------------------------------------
    // 🎵 PHRASES
    // --------------------------------------------------------

    let currentPhrase = [];
    let phraseIndex = 0;

    function generatePhrase(sectionEnergy) {

        const len = 3 + Math.floor(sectionEnergy * 5);
        const phrase = [];

        let idx = Math.floor(rand() * scale.length);

        for (let i = 0; i < len; i++) {

            phrase.push(scale[idx] + 5);

            idx += rand() < 0.6 ? 1 : -1;
            if (idx < 0) idx = 0;
            if (idx >= scale.length) idx = scale.length - 1;
        }

        return phrase;
    }

    // --------------------------------------------------------
    // 🎼 ENGINE
    // --------------------------------------------------------

    return function pianoEngine(time, step) {

        const idx = step % totalSteps;

        const { stepInMeasure, section } =
            timeline.getStepData(step);

        const sectionEnergy = getSectionEnergy(section);
        const chord = chordTimeline[idx];

        if (!chord) return;

        // ----------------------------------------------------
        // 🎹 CHORD (sustain cinematic)
        // ----------------------------------------------------

        if (stepInMeasure === 0) {

            const dur =
                cinematicFactor > 0.6 ? "1m" : "2n";

            piano.triggerAttackRelease(
                chord,
                dur,
                humanizeTime(time, rand),
                0.6 + sectionEnergy * 0.3
            );

            // mano sinistra
            playLeftHand(chord, time, sectionEnergy);
        }

        // ----------------------------------------------------
        // 🎵 NUOVA FRASE
        // ----------------------------------------------------

        if (stepInMeasure === 0) {

            if (rand() < (0.3 - sectionEnergy * 0.2)) {
                currentPhrase = [];
            } else {
                currentPhrase = generatePhrase(sectionEnergy);
            }

            phraseIndex = 0;
        }

        // ----------------------------------------------------
        // 🎼 TEMA (ritorna nel B e climax)
        // ----------------------------------------------------

        if (
            (section === "B" || section === "climax") &&
            rand() < 0.5
        ) {

            const note =
                theme[stepInMeasure % theme.length];

            piano.triggerAttackRelease(
                note,
                "8n",
                humanizeTime(time, rand),
                0.8
            );
        }

        // ----------------------------------------------------
        // 🎵 FRASE
        // ----------------------------------------------------

        if (currentPhrase.length > 0 && rand() < 0.8) {

            const note =
                currentPhrase[
                    phraseIndex % currentPhrase.length
                ];

            phraseIndex++;

            const dur =
                cinematicFactor > 0.6
                    ? "4n"
                    : (rand() < 0.5 ? "16n" : "8n");

            const vel =
                0.6 +
                Math.sin(
                    (phraseIndex / currentPhrase.length) * Math.PI
                ) * 0.4;

            piano.triggerAttackRelease(
                note,
                dur,
                humanizeTime(time, rand),
                vel
            );
        }

        // ----------------------------------------------------
        // 💥 CLIMAX BOOST
        // ----------------------------------------------------

        if (section === "climax" && rand() < 0.7) {

            const idxScale =
                Math.floor(rand() * scale.length);

            const note = scale[idxScale] + 5;

            piano.triggerAttackRelease(
                note,
                "16n",
                humanizeTime(time, rand),
                0.9
            );
        }
    };
}