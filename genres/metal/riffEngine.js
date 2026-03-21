// riffEngine.js
// Generatore di riff power metal.
// Nessuna logica di routing. Nessuna logica di strumenti.
// Solo generazione di note + scheduling.

import * as Tone from "https://esm.sh/tone";

import { noteToMidi, midiToNote, nearestNatural } from "../../utils/harmonyUtils.js";
import { scaleWithinRange } from "../../utils/scaleUtils.js";
import { buildSectionTimeline } from "../../utils/structureUtils.js";

console.log("riffEngine.js ver. 001 loaded");

// ============================================================
// 🎸 INIZIALIZZAZIONE
// ============================================================

export function initRiffEngine(instruments, params, rand, options = {}) {

    const { guitarPalm, guitarOpen } = instruments;
    const { enableLog = false } = options;

    // --------------------------------------------------------
    // Pattern ritmici power metal (straight 16th)
    // --------------------------------------------------------
    const patterns = {
        intro:  [1,1,1,1, 1,1,1,1],
        verse:  [1,1,1,1, 1,1,1,1],
        chorus: [1,1,1,1, 1,1,1,1],
        solo:   [1,1,1,1, 1,1,1,1],
        outro:  [1,1,1,1, 1,1,1,1]
    };

    // --------------------------------------------------------
    // Funzione per scegliere una nota dalla scala della sezione
    // --------------------------------------------------------
    function pickNote(sectionScale) {
        if (!sectionScale || sectionScale.length === 0) return "C2";

        // Adattiamo la scala al range C2–C3
        const riffScale = scaleWithinRange(
            sectionScale,
            noteToMidi("C2"),
            noteToMidi("C3")
        )
        .map(n => nearestNatural(n))
        .filter(n => n !== undefined)
        .map(n => typeof n === "number" ? midiToNote(n) : n);

        if (riffScale.length === 0) return "C2";

        const idx = Math.floor(rand() * riffScale.length);
        return riffScale[idx];
    }

    // --------------------------------------------------------
    // Scheduling di una singola sezione
    // --------------------------------------------------------
    function scheduleSection(section, sectionScale, root) {

        const pattern =
            section.name === "intro"  ? patterns.intro :
            section.name === "chorus" ? patterns.chorus :
            section.name === "solo"   ? patterns.solo :
            section.name === "outro"  ? patterns.outro :
                                        patterns.verse;

        const timeline = buildSectionTimeline(section, "16n");

        if (enableLog) {
            console.log("[riffEngine] section:", section.name, "timeline:", timeline);
        }

        timeline.forEach((t, i) => {
            if (pattern[i % pattern.length] !== 1) return;

            const note = pickNote(sectionScale);

            if (enableLog) {
                console.log("[riffEngine] palm", section.name, "t:", t, "note:", note);
            }

            // Palm mute
            Tone.Transport.schedule((time) => {
                guitarPalm.triggerAttackRelease(note, "16n", time);
            }, t);

            // Open chord (accents)
            if (section.name === "chorus") {
                // Nel chorus suona SEMPRE open (power metal wall)
                Tone.Transport.schedule((time) => {
                    guitarOpen.triggerAttackRelease(note, "4n", time);
                }, t);
            } else {
                // Negli altri casi: accenti occasionali
                if (rand() < params.riffDensity * 0.2) {
                    Tone.Transport.schedule((time) => {
                        guitarOpen.triggerAttackRelease(note, "8n", time);
                    }, t);
                }
            }
        });
    }

    // ============================================================
    // EXPORT ENGINE
    // ============================================================

    return {
        scheduleSection
    };
}
