// danceLeadEngine.js — ver. 001 (Supersaw Eurodance Lead)
import * as Tone from "https://esm.sh/tone";

console.log("danceLeadEngine.js ver. 001 loaded");

// ------------------------------------------------------------
// LEAD MELODIES (Eurodance 1995–2005)
// ------------------------------------------------------------
const leadMelodies = {
    simple: [
        [0, 2, 4, 2, 0, 2, 4, 5],      // Eiffel 65 style
        [0, 3, 5, 3, 0, 3, 5, 7],      // Prezioso style
        [0, 4, 5, 4, 2, 4, 5, 7],      // Gabry Ponte style
    ],
    energetic: [
        [0, 5, 7, 5, 4, 5, 7, 9],      // supersaw anthem
        [0, 7, 9, 7, 5, 7, 9, 12],     // big hook
    ],
    dark: [
        [0, 3, 2, 3, 0, 3, 2, -1],     // Gigi D’Agostino darker vibe
        [0, 2, 1, 2, 0, 2, 1, -1],
    ]
};

// ------------------------------------------------------------
// LEAD ENGINE
// ------------------------------------------------------------
export function scheduleDanceLead(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    score
) {
    const { lead } = instruments;
    if (!lead) return;

    const name = section?.name?.toLowerCase() || "";
    const isIntro = name.includes("intro");
    const isBuild = name.includes("build");
    const isDrop  = name.includes("drop");
    const isRiff  = name.includes("riff");
    const isBreak = name.includes("break");
    const isOutro = name.includes("outro");

    // Nessun lead in intro/break/outro
    if (isIntro || isBreak || isOutro) return;

    const stepTime = measureDur / 16;

    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = params?.imageParams || {};

    // --------------------------------------------------------
    // SELEZIONE FAMIGLIA MELODICA
    // --------------------------------------------------------
    let family = leadMelodies.simple;

    if (energy > 0.6 && brightness > 0.5) family = leadMelodies.energetic;
    if (brightness < 0.4) family = leadMelodies.dark;

    const melody = family[(rand() * family.length) | 0];

    // --------------------------------------------------------
    // LOOP MISURE
    // --------------------------------------------------------
    for (let m = 0; m < section.measures; m++) {

        const measureStart = section.startTime + m * measureDur;

        const root = progression[m % progression.length];
        const scale = buildMajorScale(root);

        // Ottava diversa per sezione
        const octave = isDrop ? 5 : 4;

        // ----------------------------------------------------
        // LOOP NOTE DELLA MELODIA
        // ----------------------------------------------------
        melody.forEach((degree, i) => {

            const step = i * 2; // 8th notes
            const absoluteTime = measureStart + step * stepTime;

            const pitch = scale[(degree % 7 + 7) % 7];
            const note = `${pitch}${octave}`;

            Tone.Transport.schedule(t => {
                lead.triggerAttackRelease(note, "8n", t, 0.9);

                if (score) {
                    score.addNote("Lead", note, section.name);
                }
            }, absoluteTime);
        });
    }
}

// ------------------------------------------------------------
// COSTRUZIONE SCALA MAGGIORE (Eurodance = quasi sempre maggiore)
// ------------------------------------------------------------
function buildMajorScale(root) {
    const notes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    const idx = notes.indexOf(root.toUpperCase());
    if (idx < 0) return ["C","D","E","F","G","A","B"];

    const intervals = [0,2,4,5,7,9,11];
    return intervals.map(i => notes[(idx + i) % 12]);
}
