// pianoRhythmEngine.js — ver. A (Triad Arpeggio + Final Chord)
import * as Tone from "https://esm.sh/tone";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";

console.log("pianoRhythmEngine.js ver. A loaded");

// ------------------------------------------------------------
// SAFE NOTE
// ------------------------------------------------------------
function safeNote(note, defaultOctave = "2") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// ------------------------------------------------------------
// ROOT PITCH
// ------------------------------------------------------------
function getRootPitch(root) {
    if (!root || typeof root !== "string") return "A";
    const match = root.toUpperCase().match(/^([A-G](#|B)?)/);
    return match ? match[1] : "A";
}

// ------------------------------------------------------------
// RHYTHM ENGINE — VERSIONE A
// ------------------------------------------------------------
export function schedulePianoRhythm(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    nextSectionRoot,
    score
) {
    const { piano, lhBus } = instruments;
    if (!piano || !lhBus) return;

    const stepTime = measureDur / 16;

    for (let m = 0; m < section.measures; m++) {

        const isLastMeasure = (m === section.measures - 1);
        const measureStart = section.startTime + m * measureDur;

        const rawRoot = progression[m % progression.length];
        const pitchRoot = getRootPitch(rawRoot);

        // Scala armonica minore (come orchestra)
        const scale = buildScaleFromTonic(pitchRoot + "2", "harmonicMinor");
        const rootIdx = 0;

        // Triade
        const rootNote  = safeNote(getScaleDegree(scale, rootIdx), "2");
        const thirdNote = safeNote(getScaleDegree(scale, rootIdx + 2), "2");
        const fifthNote = safeNote(getScaleDegree(scale, rootIdx + 4), "2");

        if (!rootNote || !thirdNote || !fifthNote) continue;

        // ------------------------------------------------------------
        // ULTIMA MISURA → ACCORDO PIENO
        // ------------------------------------------------------------
        if (isLastMeasure) {
            Tone.Transport.schedule(t => {
                piano.triggerAttackRelease(
                    [rootNote, thirdNote, fifthNote],
                    "1n",
                    t,
                    0.75
                );
                if (score) {
                    score.addNote("PianoLH", rootNote, section.name);
                    score.addNote("PianoLH", thirdNote, section.name);
                    score.addNote("PianoLH", fifthNote, section.name);
                }
            }, measureStart);
            continue;
        }

        // ------------------------------------------------------------
        // MISURE NORMALI → ARPEGGIO TRIADICO
        // ------------------------------------------------------------
        const pattern = [
            { step: 0,  note: rootNote  },
            { step: 4,  note: thirdNote },
            { step: 8,  note: fifthNote },
            { step: 12, note: thirdNote }
        ];

        pattern.forEach(ev => {
            const time = measureStart + ev.step * stepTime;
            Tone.Transport.schedule(t => {
                piano.triggerAttackRelease(ev.note, "8n", t, 0.55);
                if (score) score.addNote("PianoLH", ev.note, section.name);
            }, time);
        });
    }
}
