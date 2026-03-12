// metalRiff.js — versione con palm mute realistici, compatibile con il tuo sistema

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
    // Palm mute state
    // ------------------------------------------------------------
    let palmMuteActive = false;
    let palmMuteMeasuresLeft = 0;

    function maybeStartPalmMute(section) {
        if (section === "intro") return;

        const prob =
            section === "verse"  ? 0.25 :
            section === "chorus" ? 0.40 :
            section === "solo"   ? 0.15 :
            section === "outro"  ? 0.10 : 0.20;

        if (!palmMuteActive && rand() < prob) {
            palmMuteActive = true;
            palmMuteMeasuresLeft = 2 + Math.floor(rand() * 3); // 2–4 misure
        }
    }

    function updatePalmMuteState(stepInMeasure) {
        if (stepInMeasure === 0 && palmMuteActive) {
            palmMuteMeasuresLeft--;
            if (palmMuteMeasuresLeft <= 0) palmMuteActive = false;
        }
    }

    // ------------------------------------------------------------
    // Power chord builder
    // ------------------------------------------------------------
    function buildChord(root) {
        const rootMidi = Tone.Frequency(root).toMidi();
        return [
            root,
            Tone.Frequency(rootMidi + 7, "midi").toNote(),
            Tone.Frequency(rootMidi + 12, "midi").toNote()
        ];
    }

    // ------------------------------------------------------------
    // Sezione riff con palm mute realistici
    // ------------------------------------------------------------
    function generateSectionRiff(sectionName, sectionMeasures, densityFactor) {

        const totalSteps = sectionMeasures * beatsPerMeasure;
        const notes = [];
        const sections = [];

        for (let i = 0; i < totalSteps; i++) {

            const stepInMeasure = i % beatsPerMeasure;

            // Aggiorna palm mute
            updatePalmMuteState(stepInMeasure);

            // Possibile inizio blocco palm
            if (stepInMeasure === 0) {
                maybeStartPalmMute(sectionName);
            }

            // Palm mute attivo → pattern denso
            if (palmMuteActive) {

                if (stepInMeasure % 1 === 0) {
                    // ogni 8n
                    const root = scale[0] + octave;
                    notes.push(clampNote(root, MIN, MAX));
                }
                else if (stepInMeasure % 0.5 === 0 && rand() < 0.5) {
                    // alcuni 16n
                    const root = scale[0] + octave;
                    notes.push(clampNote(root, MIN, MAX));
                }
                else {
                    notes.push(null);
                }

                sections.push(sectionName);
                continue;
            }

            // ----------------------------------------------------
            // OPEN (nessun palm attivo)
            // ----------------------------------------------------

            // Accento forte su ogni misura
            if (stepInMeasure === 0) {
                const root = scale[0] + octave;
                notes.push(clampNote(root, MIN, MAX));
                sections.push(sectionName);
                continue;
            }

            // Ritmica per sezione
            let allow =
                (sectionName === "intro"  && stepInMeasure === 0) ||
                (sectionName === "verse"  && stepInMeasure % 2 === 0) ||
                (sectionName === "chorus" && stepInMeasure % 1 === 0) ||
                (sectionName === "solo"   && stepInMeasure % 1 === 0) ||
                (sectionName === "outro"  && stepInMeasure % 2 === 0);

            if (allow) {
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

    // ------------------------------------------------------------
    // Generazione sezioni
    // ------------------------------------------------------------
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
        const sound = palmMuteActive ? guitarPalm : guitarOpen;

        for (const n of chord) {
            sound.triggerAttackRelease(n, "8n", time);
        }
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
