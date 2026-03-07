// metalLead.js

import * as Tone from "https://esm.sh/tone";

export function generateMetalLead(dna, scale, style, rand) {

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
    const lead = [];

    const root = scale[0];
    const highNote = scale[scale.length - 1];

    // cromatismo metal
    const chromatic = Tone.Frequency(root + "3")
        .transpose(-1)
        .toNote()
        .replace(/\d/, "");

    // ============================
    // FUNZIONI DI SUPPORTO
    // ============================

    function pickScaleNote() {
        return scale[Math.floor(rand() * scale.length)];
    }

    function pickHighNote() {
        return scale[Math.floor(scale.length * 0.6 + rand() * scale.length * 0.4)];
    }

    function tremoloPattern(i) {
        return (rand() > 0.5) ? highNote : pickScaleNote();
    }

    function doomPattern(i) {
        if (i % 4 === 0) return pickScaleNote();
        return root;
    }

    function powerPattern(i) {
        if (i % 4 === 0) return pickHighNote();
        if (i % 2 === 0) return pickScaleNote();
        return root;
    }

    function heavyPattern(i) {
        return (i % 2 === 0) ? pickScaleNote() : pickHighNote();
    }

    function chromaticChance() {
        return (complexity > 0.6 && rand() > 0.85);
    }

    // ============================
    // GENERAZIONE LEAD
    // ============================

    for (let i = 0; i < length; i++) {

        let note;

        // stile → pattern
        if (style === "thrash") {
            note = tremoloPattern(i);
        }
        else if (style === "power") {
            note = powerPattern(i);
        }
        else if (style === "doom") {
            note = doomPattern(i);
        }
        else { // heavy
            note = heavyPattern(i);
        }

        // cromatismi
        if (chromaticChance()) {
            note = chromatic;
        }

        // direzione melodica
        if (direction > 0.7 && rand() > 0.8) {
            note = highNote;
        }

        lead.push(note);
    }

    // ============================
    // VARIAZIONI FINALI
    // ============================

    if (complexity > 0.5) {
        for (let i = 12; i < 16; i++) {
            if (rand() > 0.6) lead[i] = pickHighNote();
        }
    }

    return lead;
}
