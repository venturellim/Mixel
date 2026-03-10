import { guitarLead } from "./common.js";
import { clampNote, pickFromScale } from "./common.js";

export function createLeadEngine(analysis, rand) {

    const scale = analysis.scale;
    const root = analysis.key; // FIX: usa la tonica
    const entropy = analysis.entropy;
    const edges = analysis.edges;
    const texture = analysis.texture;
    const brightness = analysis.brightness;
    const symmetry = analysis.symmetry;

    const MIN = 48; // C3
    const MAX = 84; // C6

    const baseOctave = 3 + Math.floor(entropy * 1.5); // C3–C4–C5
    const speed = 1 + Math.floor(edges * 3);
    const variety = 1 + Math.floor(texture * 3);
    const patternType = Math.floor(symmetry * 3);

    function applyPattern(step, note) {
        if (!note) return null;

        if (patternType === 0) {
            return pickFromScale(scale, step % scale.length);
        }
        if (patternType === 1) {
            return (step % 2 === 0)
                ? note
                : pickFromScale(scale, step + 1);
        }
        if (patternType === 2) {
            const idx = (step + Math.floor(rand() * variety)) % scale.length;
            return scale[idx];
        }
        return note;
    }

    return function(time, step) {

        if (step % speed !== 0) return;
        if (rand() > entropy) return;

        let note = pickFromScale(scale, step + Math.floor(rand() * variety));
        if (!note) return;

        note = applyPattern(step, note);
        if (!note) return;

        let octave = baseOctave;
        if (rand() < brightness * 0.3) octave++;

        const fullNote = note + octave;
        const clamped = clampNote(fullNote, MIN, MAX);
        if (!clamped) return;

        guitarLead.triggerAttackRelease(clamped, "8n", time);
    };
}
