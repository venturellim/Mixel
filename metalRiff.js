// metalRiff.js — riff principale con palm mute realistico per pezzi veloci

import * as Tone from "https://esm.sh/tone";
import { guitarPalm, guitarOpen } from "./common.js";

export function createRiffEngine(analysis, params, riffData, rand) {

    const beatsPerMeasure = riffData.beatsPerMeasure;
    const totalSteps = riffData.totalSteps;

    // Stato palm mute
    let palmMuteActive = false;
    let palmMuteMeasuresLeft = 0;

    // ------------------------------------------------------------
    // Decide se iniziare un blocco di palm mute
    // ------------------------------------------------------------
    function maybeStartPalmMute(section) {

        // niente palm nell’intro
        if (section === "intro") return;

        // probabilità diversa per sezione
        const prob =
            section === "verse"  ? 0.25 :
            section === "chorus" ? 0.40 :
            section === "solo"   ? 0.15 :
            section === "outro"  ? 0.10 : 0.20;

        if (!palmMuteActive && rand() < prob) {
            palmMuteActive = true;
            // blocco di 2–4 misure
            palmMuteMeasuresLeft = 2 + Math.floor(rand() * 3);
        }
    }

    // ------------------------------------------------------------
    // Aggiorna stato palm mute a inizio misura
    // ------------------------------------------------------------
    function updatePalmMuteState(stepInMeasure) {
        if (stepInMeasure === 0 && palmMuteActive) {
            palmMuteMeasuresLeft--;
            if (palmMuteMeasuresLeft <= 0) {
                palmMuteActive = false;
            }
        }
    }

    // ------------------------------------------------------------
    // Scegli se usare palm o open in questo step
    // ------------------------------------------------------------
    function pickSoundForStep(section, stepInMeasure) {

        if (palmMuteActive) {
            // palm denso: almeno 4 per misura, spesso 8
            if (stepInMeasure % 1 === 0) return "palm";      // ogni 8n
            if (stepInMeasure % 0.5 === 0 && rand() < 0.5) return "palm"; // alcuni 16n
            return null;
        }

        // nessun palm attivo → open
        // ma non per forza ogni step
        if (section === "intro") {
            // intro più ariosa
            return stepInMeasure === 0 ? "open" : null;
        }

        if (section === "verse") {
            return stepInMeasure % 2 === 0 ? "open" : null; // ogni 4n
        }

        if (section === "chorus") {
            return stepInMeasure % 1 === 0 ? "open" : null; // ogni 8n
        }

        if (section === "solo") {
            return stepInMeasure % 1 === 0 ? "open" : null;
        }

        if (section === "outro") {
            return stepInMeasure % 2 === 0 ? "open" : null;
        }

        return null;
    }

    // ------------------------------------------------------------
    // Suona un power chord (root + quinta + opzionale ottava)
    // ------------------------------------------------------------
    function triggerPowerChord(time, chord, soundType) {

        if (!chord || chord.length === 0) return;

        const root = chord[0];
        const rootMidi = Tone.Frequency(root).toMidi();

        const fifthMidi = rootMidi + 7;
        const octaveMidi = rootMidi + 12;

        const rootNote = Tone.Frequency(rootMidi, "midi").toNote();
        const fifthNote = Tone.Frequency(fifthMidi, "midi").toNote();
        const octaveNote = Tone.Frequency(octaveMidi, "midi").toNote();

        const synth = soundType === "palm" ? guitarPalm : guitarOpen;
        const dur = soundType === "palm" ? "16n" : "8n";

        synth.triggerAttackRelease(rootNote, dur, time);
        synth.triggerAttackRelease(fifthNote, dur, time);
        if (soundType === "open") {
            synth.triggerAttackRelease(octaveNote, dur, time);
        }
    }

    // ------------------------------------------------------------
    // ENGINE ritornato a metal.js
    // ------------------------------------------------------------
    return function riffEngine(time, step) {

        const idx = step % totalSteps;

        const chord = riffData.chordTimeline[idx];
        const section = riffData.sectionTimeline[idx];

        const stepInMeasure = idx % beatsPerMeasure;

        // aggiorna stato palm a inizio misura
        updatePalmMuteState(stepInMeasure);

        // forse inizia un nuovo blocco palm
        if (stepInMeasure === 0) {
            maybeStartPalmMute(section);
        }

        const soundType = pickSoundForStep(section, stepInMeasure);
        if (!soundType) return;

        triggerPowerChord(time, chord, soundType);
    };
}

