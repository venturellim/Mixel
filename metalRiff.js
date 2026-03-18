// metalRiff.js — riff engine modern metal (DNA rhythm + real samples)

import * as Tone from "https://esm.sh/tone";
import {
    guitarPalm,
    guitarOpen,
    orchestraPad,
    clampNote,
    humanizeTime
} from "./common.js";

console.log("metalRiff.js loaded");

// ------------------------------------------------------------
// SAMPLE MAP
// ------------------------------------------------------------

const AVAILABLE_NOTES = [
    "C2","D2","E2","F2","G2","A2","B2"
];

function mapToAvailableSample(note) {

    if (!note) return null;

    const midi = Tone.Frequency(note).toMidi();

    let closest = AVAILABLE_NOTES[0];
    let minDiff = Infinity;

    for (const n of AVAILABLE_NOTES) {
        const m = Tone.Frequency(n).toMidi();
        const diff = Math.abs(midi - m);

        if (diff < minDiff) {
            minDiff = diff;
            closest = n;
        }
    }

    return closest;
}

// ------------------------------------------------------------
// PROGRESSIONI
// ------------------------------------------------------------

const progressions = [
    [0,4,5,3],
    [0,5,3,4],
    [0,3,4,3],
    [0,4,3,5],
    [0,3,5,4]
];

// ------------------------------------------------------------
// ENGINE
// ------------------------------------------------------------

export function generateMetalRiff(analysis, params, timeline, rand) {

    const scale = params.scale;

    const {
        stepsPerMeasure,
        totalSteps,
        sectionTimeline
    } = timeline;

    const MIN = 36;
    const MAX = 52;
    const octave = 2;

    const progression =
        progressions[Math.floor(rand() * progressions.length)];

    // ------------------------------------------------------------
    // DNA → RHYTHM
    // ------------------------------------------------------------

    function generateRhythmPattern(dna, stepsPerMeasure) {
        const pattern = [];

        for (let i = 0; i < stepsPerMeasure; i++) {
            const bit = (dna >> i) & 1;
            pattern.push(bit === 1);
        }

        return pattern;
    }

    const rhythmPattern =
        generateRhythmPattern(
            analysis.dna || 123456,
            stepsPerMeasure
        );

    // ------------------------------------------------------------
    // CHORD
    // ------------------------------------------------------------

    function buildChord(root) {
        const rootMidi = Tone.Frequency(root).toMidi();
        return [
            root,
            Tone.Frequency(rootMidi + 7, "midi").toNote(),
            Tone.Frequency(rootMidi + 12, "midi").toNote()
        ];
    }

    // ------------------------------------------------------------
    // CHORUS
    // ------------------------------------------------------------

    function generateChorusProgression() {
        const patterns = [
            [0,5,6,4],
            [0,3,4,5],
            [0,4,5,3]
        ];

        const pattern =
            patterns[Math.floor(rand() * patterns.length)];

        return pattern.map(p => {
            const root = scale[p % scale.length] + octave;
            return buildChord(root);
        });
    }

    const chorusProgression = generateChorusProgression();

    // ------------------------------------------------------------
    // PEDAL
    // ------------------------------------------------------------

    function generatePedalPattern(bpm) {
        if (bpm < 100) return [0,4,8,12];
        if (bpm < 130) return [0,3,6,8,12];
        return [0,2,4,6,8,10,12];
    }

    const pedalPattern = generatePedalPattern(params.bpm);

    // ------------------------------------------------------------
    // TIMELINE ACCORDI
    // ------------------------------------------------------------

    const chordTimeline = new Array(totalSteps);
    let currentChord = buildChord(scale[0] + octave);

    for (let step = 0; step < totalSteps; step++) {

        const stepInMeasure = step % stepsPerMeasure;

        if (stepInMeasure === 0) {
            const measure = Math.floor(step / stepsPerMeasure);
            const degree = progression[measure % progression.length];
            const root = scale[degree] + octave;
            currentChord = buildChord(root);
        }

        chordTimeline[step] = currentChord;
    }

    // ------------------------------------------------------------
    // RIFF BASE
    // ------------------------------------------------------------

    const riffMeasures = 2;
    const riffLength = riffMeasures * stepsPerMeasure;

    const baseRiff = new Array(riffLength);
    const openMap = new Array(riffLength).fill(false);

    let chordRoot = scale[0] + octave;
    let chord = buildChord(chordRoot);
    let palmStreak = 0;

    for (let step = 0; step < riffLength; step++) {

        const stepInMeasure = step % stepsPerMeasure;

        if (stepInMeasure === 0) {
            const measure = Math.floor(step / stepsPerMeasure);
            const degree = progression[measure % progression.length];
            chordRoot = scale[degree] + octave;
            chord = buildChord(chordRoot);
        }

        // ---------------- PEDAL ----------------

        if (pedalPattern.includes(stepInMeasure)) {

            const isAccent = rand() < 0.75;

            if (isAccent) {

                baseRiff[step] =
                    clampNote(chordRoot, MIN, MAX);

                // 🎯 OPEN GUIDATO
                if (rand() < 0.6) {
                    openMap[step] = true;
                }

            } else {

                const pool = [chord[0], chord[1], chord[2]];

                baseRiff[step] =
                    clampNote(
                        pool[Math.floor(rand() * pool.length)],
                        MIN,
                        MAX
                    );
            }
        }

        // ---------------- BREAK METAL ----------------

        if (stepInMeasure === stepsPerMeasure - 1 && rand() < 0.7) {
            openMap[step] = true;
        }

        // ---------------- GROOVE ----------------

        if (!baseRiff[step]) {

            const energyBoost =
                analysis.energy > 0.6 ? 0.2 : 0;

            const shouldPlay =
                rhythmPattern[stepInMeasure] ||
                rand() < (0.1 + energyBoost);

            if (palmStreak > 0) {

                const pool = [chord[0], chord[1], chord[2]];

                baseRiff[step] =
                    clampNote(
                        pool[Math.floor(rand() * pool.length)],
                        MIN,
                        MAX
                    );

                palmStreak--;

            } else if (shouldPlay) {

                palmStreak =
                    2 + Math.floor(rand() * 3);

                baseRiff[step] =
                    clampNote(chordRoot, MIN, MAX);
            }
        }
    }

    // ------------------------------------------------------------
    // FULL RIFF
    // ------------------------------------------------------------

    const fullRiff = new Array(totalSteps);

    for (let step = 0; step < totalSteps; step++) {
        const baseStep = step % riffLength;
        fullRiff[step] = baseRiff[baseStep];
    }

    // ------------------------------------------------------------
    // ENGINE
    // ------------------------------------------------------------

    function riffEngine(time, step) {

        const idx = step % totalSteps;
        const baseStep = idx % riffLength;

        let note = fullRiff[idx];

        const { section, stepInMeasure } =
            timeline.getStepData(step);

        let chord =
            (section === "chorus" && stepInMeasure === 0)
                ? chorusProgression[
                    Math.floor(step / stepsPerMeasure) %
                    chorusProgression.length
                  ]
                : chordTimeline[idx];

        if (!note) return;

        // PAD
        if (section === "chorus" && stepInMeasure === 0) {
            orchestraPad.triggerAttackRelease(chord, "1m", time);
        }

        // ENERGY
        const energy =
            section === "chorus" ? 1 :
            section === "solo" ? 0.95 :
            section === "verse" ? 0.9 :
            section === "intro" ? 0.8 : 0.7;

        if (rand() > energy) return;

        // 🎯 OPEN GUIDATO (NO RANDOM)
        const isOpen =
            section === "chorus" ||
            openMap[baseStep];

        const sound = isOpen ? guitarOpen : guitarPalm;

        const dur =
            section === "chorus"
                ? "2n"
                : (params.bpm > 130 ? "16n" : "8n");

        const mappedNote = mapToAvailableSample(note);
        if (!mappedNote) return;

        sound.triggerAttackRelease(
            mappedNote,
            dur,
            humanizeTime(time, rand)
        );
    }

    return {
        engine: riffEngine,
        data: {
            fullRiff,
            chordTimeline,
            sectionTimeline,
            stepsPerMeasure,
            totalSteps
        }
    };
}