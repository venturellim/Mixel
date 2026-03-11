// metalRiff.js — versione sezionale con spartito completo per basso/lead/drums

import * as Tone from "https://esm.sh/tone";
import { guitarPalm, guitarOpen, clampNote } from "./common.js";

export function generateMetalRiff(analysis, params, rand) {

    const scale = params.scale;
    const key = params.key;

    const timeSig = params.timeSignature; // "4/4" o "6/8"
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
    // Generazione note per sezione
    // ------------------------------------------------------------
    function chooseNote(density) {
        if (rand() > density) return null;
        const idx = Math.floor(rand() * scale.length);
        return scale[idx] + octave;
    }

    function generateSectionRiff(sectionName, sectionMeasures, densityFactor) {
        const totalSteps = sectionMeasures * beatsPerMeasure;
        const notes = [];
        const sections = [];

        for (let i = 0; i < totalSteps; i++) {
            const density = densityFactor * rhythm.attack;
            const note = chooseNote(density);
            const clamped = note ? clampNote(note, MIN, MAX) : null;

            notes.push(clamped);
            sections.push(sectionName);
        }

        return { notes, sections };
    }

    const intro  = generateSectionRiff("intro",  measures.intro,  0.3);
    const verse  = generateSectionRiff("verse",  measures.verse,  0.5);
    const chorus = generateSectionRiff("chorus", measures.chorus, 0.8);
    const solo   = generateSectionRiff("solo",   measures.solo,   0.4);
    const outro  = generateSectionRiff("outro",  measures.outro,  0.2);

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

        playChord(sound, chord, "4n", time);
    }

    // ------------------------------------------------------------
    // Ritorno: engine + spartito completo
    // ------------------------------------------------------------
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
