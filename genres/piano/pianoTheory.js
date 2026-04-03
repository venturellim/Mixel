console.log("pianTheory.js ver. 001 loaded");

import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; // Possiamo riutilizzare le tue ottime progressioni!

export function generatePianoSequence(section, params, rand) {
    const scale = buildScaleFromTonic(params.harmony.tonalCenter + "3", params.harmony.scaleProfile);
    const selectedProg = progressions[section.name][Math.floor(rand() * progressions[section.name].length)];
    
    // Trasformiamo i gradi in note reali (es: "i" in E minor -> [E3, G3, B3])
    // Qui possiamo aggiungere la logica per "aprire" l'accordo su più ottave
    return selectedProg.map(degree => {
        const root = getScaleDegree(scale, degreeToIndex(degree)); // una piccola utility di conversione
        return [root, /* aggiungi 3a e 5a */];
    });
