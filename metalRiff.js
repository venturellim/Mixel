// metalRiff.js

import * as Tone from "https://esm.sh/tone";

export function generateMetalRiff(dna, scale, style, rand) {

    // ============================
    // PARAMETRI DAL DNA
    // ============================

    const complexity = (dna % 1000) / 1000;           
    const texture    = ((dna >> 8)  % 1000) / 1000;   
    const energy     = ((dna >> 16) % 1000) / 1000;   
    const direction  = ((dna >> 24) % 1000) / 1000;   

    // ============================
    // PARAMETRI MUSICALI
    // ============================

    const length = 16; // 1 misura in 16th
    const riff = [];

    // nota pedal (fondamentale)
    const pedal = scale[0];

    // nota alta per salti
    const highNote = scale[scale.length - 1];

    // cromatismo metal (nota fuori scala)
    const chromatic = Tone.Frequency(pedal + "2").transpose(-1).toNote().replace(/\d/, "");

    // pattern AB deterministico
    const patternType = dna % 3; // 0 = pedal, 1 = alternate, 2 = gallop


    // ============================
    // FUNZIONI DI SUPPORTO
    // ============================

    function chooseScaleNote() {
        return scale[Math.floor(rand() * scale.length)];
    }

    function chooseWeightedNote() {
        // più energia → più note alte
        if (energy > 0.7 && rand() > 0.5) return highNote;
        return chooseScaleNote();
    }

    function gallopPattern(i) {
        // pattern tipico thrash/power: 1-eee-a
        if (i % 4 === 0) return pedal;
        if (i % 4 === 1) return pedal;
        if (i % 4 === 2) return chooseWeightedNote();
        return pedal;
    }

    function alternatePattern(i) {
        // alternanza pedal / nota scala
        return (i % 2 === 0) ? pedal : chooseWeightedNote();
    }

    function pedalPattern() {
        return pedal;
    }

    function chromaticChance() {
        // più complessità → più cromatismi
        return (complexity > 0.6 && rand() > 0.8);
    }


    // ============================
    // GENERAZIONE RIGA PRINCIPALE
    // ============================

    for (let i = 0; i < length; i++) {

        let note;

        // stile → pattern
        if (style === "thrash") {
            note = gallopPattern(i);
        }
        else if (style === "power") {
            note = alternatePattern(i);
        }
        else if (style === "doom") {
            // doom → note lunghe, poche variazioni
            note = (i % 4 === 0) ? chooseScaleNote() : pedal;
        }
        else { // heavy
            note = (patternType === 0)
                ? pedalPattern(i)
                : (patternType === 1)
                    ? alternatePattern(i)
                    : gallopPattern(i);
        }

        // cromatismi
        if (chromaticChance()) {
            note = chromatic;
        }

        // direzione melodica (DNA)
        if (direction > 0.7 && rand() > 0.8) {
            note = highNote;
        }

        riff.push(note);
    }


    // ============================
    // VARIAZIONE OGNI 4 MISURE
    // ============================

    if (complexity > 0.5) {
        for (let i = 12; i < 16; i++) {
            if (rand() > 0.6) riff[i] = chooseWeightedNote();
        }
    }

    return riff;
}
