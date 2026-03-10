import * as Tone from "https://esm.sh/tone";
import { clampNote, pickFromScale, guitarPalm, guitarOpen } from "./common.js";

export function generateMetalRiff(analysis, rand) {

    // ============================
    // SCALA E PARAMETRI DI BASE
    // ============================
    let scale = analysis.scale;
    if (!scale || !Array.isArray(scale) || scale.length === 0) {
        console.warn("⚠️ SCALA VUOTA — fallback C minor");
        scale = ["C", "D", "Eb", "F", "G", "Ab", "Bb"];
    }

    const texture = analysis.texture;
    const entropy = analysis.entropy;
    const symmetry = analysis.symmetry;
    const contrast = analysis.contrast ?? 0.5;

    const length = 16;
    const riff = [];

    const octave = 2;
    const MIN = 36;
    const MAX = 48;

    const density = 1 + Math.floor(texture * 3);
    const melodicVariety = 1 + Math.floor(entropy * 3);
    const patternType = Math.floor(symmetry * 3);

    // ============================
    // FUNZIONI PER IL RIFF
    // ============================
    function chooseNote(step) {
        if (rand() < 0.7) {
            const idx = step + Math.floor(rand() * melodicVariety);
            return pickFromScale(scale, idx) || null;
        }
        return scale[Math.floor(rand() * scale.length)] || null;
    }

    function applyPattern(step, note) {
        if (!note) return null;
        if (patternType === 0) return scale[0] || note;
        if (patternType === 1) return (step % 2 === 0) ? (scale[0] || note) : note;
        if (patternType === 2) {
            if (step % 4 === 0) return scale[0] || note;
            if (step % 4 === 1) return scale[0] || note;
            if (step % 4 === 2) return note;
            return scale[0] || note;
        }
        return note;
    }

    // ============================
    // GENERAZIONE RIFF
    // ============================
    for (let i = 0; i < length; i++) {

        if (i % (4 - density) !== 0) {
            riff.push(null);
            continue;
        }

        let note = chooseNote(i);
        if (!note) {
            riff.push(null);
            continue;
        }

        note = applyPattern(i, note);
        if (!note) {
            riff.push(null);
            continue;
        }

        const fullNote = note + octave;
        if (typeof fullNote !== "string") {
            riff.push(null);
            continue;
        }

        const clamped = clampNote(fullNote, MIN, MAX);
        riff.push(clamped);
    }

    // ============================
    // ACCORDI (power / major / minor)
    // ============================
    function buildChord(root, type) {
        const rootMidi = Tone.Frequency(root).toMidi();

        if (type === "power") {
            return [
                root,
                Tone.Frequency(rootMidi + 7, "midi").toNote(),
                Tone.Frequency(rootMidi + 12, "midi").toNote()
            ];
        }

        if (type === "major") {
            return [
                root,
                Tone.Frequency(rootMidi + 4, "midi").toNote(),
                Tone.Frequency(rootMidi + 7, "midi").toNote()
            ];
        }

        if (type === "minor") {
            return [
                root,
                Tone.Frequency(rootMidi + 3, "midi").toNote(),
                Tone.Frequency(rootMidi + 7, "midi").toNote()
            ];
        }
    }

    function chooseChordType(analysis) {
        if (analysis.energy > 0.6) return "power";
        if (analysis.brightness > 0.6) return "major";
        return "minor";
    }

    // ============================
    // PROGRESSIONE ARMONICA
    // ============================
    function generateChordProgression(scale, analysis, rand) {
        const degrees = [0, 3, 4, 5, 2, 1]; // tonica, minore, maggiore, subdominante, dorico, frigio
        const progression = [];

        for (let i = 0; i < 4; i++) {
            const degree = degrees[Math.floor(rand() * degrees.length)];
            const root = scale[degree] + "2";
            progression.push(root);
        }

        return progression;
    }

    const chordProgression = generateChordProgression(scale, analysis, rand);

    // Durata armonica scelta dalla foto:
    // Foto luminosa → progressione veloce (4 step)
    // Foto scura → progressione lenta (8 step)
    const chordLength = (analysis.brightness > 0.5) ? 4 : 8;

    // ============================
    // RIFF ENGINE (ritorna a metal.js)
    // ============================
    return function riffEngine(time, step) {

        const note = riff[step % riff.length];
        if (!note) return;

        // Scegli accordo dalla progressione
        const chordRoot = chordProgression[Math.floor(step / chordLength) % chordProgression.length];

        // Tipo di accordo basato sull’immagine
        const chordType = chooseChordType(analysis);

        // Costruzione accordo
        const chord = buildChord(chordRoot, chordType);

        // Palm/open + sustain lungo
        if (rand() < contrast) {
            guitarPalm.triggerAttackRelease(chord, "4n", time);
        } else {
            guitarOpen.triggerAttackRelease(chord, "4n", time);
        }
    };
}
