import { clampNote, pickFromScale, guitarPalm, guitarOpen } from "./common.js";

export function generateMetalRiff(analysis, rand) {

    let scale = analysis.scale;
    if (!scale || !Array.isArray(scale) || scale.length === 0) {
        console.warn("⚠️ SCALA VUOTA — fallback C minor");
        scale = ["C", "D", "Eb", "F", "G", "Ab", "Bb"];
    }

    const texture = analysis.texture;
    const entropy = analysis.entropy;
    const symmetry = analysis.symmetry;
    const contrast = analysis.contrast ?? 0.5; // fallback sicuro

    const length = 16;
    const riff = [];

    const octave = 2;
    const MIN = 36;
    const MAX = 48;

    const density = 1 + Math.floor(texture * 3);
    const melodicVariety = 1 + Math.floor(entropy * 3);
    const patternType = Math.floor(symmetry * 3);

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

    // 🔥 ENGINE: questa è la parte che metal.js si aspetta
    return function riffEngine(time, step) {
        const note = riff[step % riff.length];
        if (!note) return;

        if (rand() < contrast) {
            guitarPalm.triggerAttackRelease(note, "8n", time);
        } else {
            guitarOpen.triggerAttackRelease(note, "8n", time);
        }
    };
}
