// leadTheme.js
import * as Tone from "https://esm.sh/tone";

export function generateLeadTheme(params, rand) {

    const scale = params.scale;
    const key = params.key;

    if (!scale || scale.length === 0) {
        return [0,2,4,5,7,5,4,2];
    }

    const scaleMidi = scale.map(n => Tone.Frequency(n + "4").toMidi());

    // intervalli melodici cantabili
    const steps = [0,1,2,3,4,5];

    function pick() {
        return steps[Math.floor(rand() * steps.length)];
    }

    // frase A
    const A = [
        pick(),
        pick(),
        pick(),
        pick(),
        pick(),
        pick(),
        pick(),
        pick()
    ];

    // frase B (variazione)
    const B = A.map(n => n + (rand() < 0.5 ? 1 : -1));

    // frase finale
    const Aprime = [...A];
    Aprime[7] = 0;

    return [
        ...A,
        ...A,
        ...B,
        ...Aprime
    ];
}