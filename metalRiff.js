// metalRiff.js — versione ad alta densità, base metal solida

import * as Tone from "https://esm.sh/tone";
import { guitarPalm, guitarOpen, clampNote } from "./common.js";

export function generateMetalRiff(analysis, params, rand) {

    const scale = params.scale;
    const key = params.key;

    const timeSig = params.timeSignature;
    const beatsPerMeasure = (timeSig === "6/8") ? 6 : 4;

    const measures = params.measures;
    const rhythm = params.rhythm;

    const MIN = 36; // C2
    const MAX = 52; // E3
    const octave = 2;

    // ------------------------------------------------------------
    // Utility: suona un accordo usando note singole
    // ------------------------------------------------------------
    function playChord(sampler, chordNotes, dur, time) {
        for (const n of chordNotes) {
            sampler.triggerAttackRelease(n, dur, time);
        }
    }

    // ------------------------------------------------------------
    // Costruzione accordi
    // ------------------------------------------------------------
    function buildChord(root) {
        const rootMidi = Tone.Frequency(root).toMidi();

        if (analysis.energy > 0.6) {
            return [
                root,
                Tone.Frequency(rootMidi + 7, "midi").toNote(),
                Tone.Frequency(rootMidi + 12, "midi").toNote()
            ];
        }

        if (analysis.brightness > 0.6) {
            return [
                root,
                Tone.Frequency(rootMidi + 4, "midi").toNote(),
                Tone.Frequency(rootMidi + 7, "midi").toNote()
            ];
        }

        return [
            root,
            Tone.Frequency(rootMidi + 3, "midi").toNote(),
            Tone.Frequency(rootMidi + 7, "midi").toNote()
        ];
    }

    function pickSound() {
        return rhythm.palmMute ? guitarPalm : guitarOpen;
    }

    // ------------------------------------------------------------
    // Generazione note per sezione (densità 75–100%)
    // ------------------------------------------------------------
    function generateSectionRiff(sectionName, sectionMeasures, densityFactor) {
        const totalSteps = sectionMeasures * beatsPerMeasure;
        const notes = [];
        const sections = [];

        for (let i = 0; i < totalSteps; i++) {

            // Densità minima garantita
            let density = densityFactor * rhythm.attack;
            density = Math.max(0.75, density); // mai sotto 75%

            // Accento forte su ogni battito (power chord)
            if (i % beatsPerMeasure === 0) {
                const root = scale[0] + octave;
                notes.push(clampNote(root, MIN, MAX));
                sections.push(sectionName);
                continue;
            }

            // Nota su ogni 8n (obbligatoria)
            if (i % 2 === 0) {
                const idx = Math.floor(rand() * scale.length);
                const note = scale[idx] + octave;
                notes.push(clampNote(note, MIN, MAX));
                sections.push(sectionName);
                continue;
            }

            // Note aggiuntive su 16n (in base alla densità)
            if (rand() < density) {
                const idx = Math.floor(rand() * scale.length);
                const note = scale[idx] + octave;
                notes.push(clampNote(note, MIN, MAX));
            } else {
                notes.push(null);
            }

            sections.push(sectionName);
        }

        return { notes, sections };
    }

    const intro  = generateSectionRiff("intro",  measures.intro,  0.6);
    const verse  = generateSectionRiff("verse",  measures.verse,  0.8);
    const chorus = generateSectionRiff("chorus", measures.chorus, 1.0);
    const solo   = generateSectionRiff("solo",   measures.solo,   0.7);
    const outro  = generateSectionRiff("outro",  measures.outro,  0.5);

    // ------------------------------------------------------------
    // Timeline completa
    // ------------------------------------------------------------
    const fullRiff = [
        ...intro.notes,
        ...verse.notes,
        ...chorus.notes,
        ...solo.notes,
        ...chorus.notes,
        ...outro.notes
    ];

    const sectionTimeline = [
        ...intro.sections,
        ...verse.sections,
        ...chorus.sections,
        ...solo.sections,
        ...chorus.sections,
        ...outro.sections
    ];

    const totalSteps = fullRiff.length;

    // ------------------------------------------------------------
    // Progressione armonica coerente
    // ------------------------------------------------------------
    const chordRoots = [
        scale[0] + octave,
        scale[5 % scale.length] + octave,
        scale[6 % scale.length] + octave,
        scale[4 % scale.length] + octave
    ];

    const chordTimeline = [];
    for (let i = 0; i < totalSteps; i++) {
        const chordIndex = Math.floor(i / beatsPerMeasure) % chordRoots.length;
        const chord = buildChord(chordRoots[chordIndex]);
        chordTimeline.push(chord);
    }

    // ------------------------------------------------------------
    // ENGINE ritornato a metal.js
    // ------------------------------------------------------------
    function riffEngine(time, step) {

        const idx = step % totalSteps;
        const note = fullRiff[idx];
        if (!note) return;

        const chord = chordTimeline[idx];
        const sound = pickSound();

        playChord(sound, chord, "8n", time);
    }

    return {
        engine: riffEngine,
        data: {
            fullRiff,
            chordTimeline,
            sectionTimeline,
            beatsPerMeasure,
            totalSteps
        }
    };
}
