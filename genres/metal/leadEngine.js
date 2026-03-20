//
// leadEngine.js
// Generatore di melodie power metal.
//

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote } from "../../utils/harmonyUtils.js";
import { melodicStep } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";
import { duration } from "../../utils/tempoUtils.js";

console.log("leadEngine.js loaded");

function toFlat(note) {
    return Tone.Frequency(note).toNote("flat");
}

export function initLeadEngine(instruments, params, scale, rand, structure) {

    const { guitarLead } = instruments;

    const MIN_MIDI = noteToMidi("C4");
    const MAX_MIDI = noteToMidi("C6");

    function clampLead(note) {
        const midi = noteToMidi(note);
        if (midi < MIN_MIDI) return toFlat(midiToNote(MIN_MIDI));
        if (midi > MAX_MIDI) return toFlat(midiToNote(MAX_MIDI));
        return toFlat(note);
    }

    function generatePhrase(startNote, length = 4) {
        let note = startNote;
        const phrase = [];

        for (let i = 0; i < length; i++) {
            const step = rand() < params.intensity ? 1 : -1;

            if (rand() < params.leadDensity * 0.2) {
                const jump = rand() < 0.5 ? 2 : -2;
                note = melodicStep(scale, note, jump);
            } else {
                note = melodicStep(scale, note, step);
            }

            note = clampLead(note);
            phrase.push(note);
        }

        return phrase;
    }

    function scheduleSection(section, density) {
        const timeline = buildSectionTimeline(section, "8n");

        let currentNote = clampLead(
            scale[Math.floor(rand() * scale.length)]
        );

        timeline.forEach((t, i) => {

            if (rand() > density) return;

            if (i % 4 === 0) {
                const phrase = generatePhrase(currentNote, 4);

                phrase.forEach((n, idx) => {
                    const eventTime = t + idx * duration("16n");

                    Tone.Transport.schedule((time) => {
                        guitarLead.triggerAttackRelease(n, "16n", time);
                    }, eventTime);
                });

                currentNote = phrase[phrase.length - 1];
            }
        });
    }

    function schedule() {

        structure.sections.forEach(section => {

            let density = params.leadDensity;

            if (section.name === "intro")  density *= 0.3;
            if (section.name === "verse")  density *= 0.6;
            if (section.name === "chorus") density *= 1.0;
            if (section.name === "solo")   density *= 1.4;
            if (section.name === "outro")  density *= 0.4;

            scheduleSection(section, density);
        });
    }

    return {
        schedule
    };
}
