// danceParams.js — ver. 001 (Eurodance 1995–2005)
import { createSeededRandom } from "../../utils/randomUtils.js";

console.log("danceParams.js ver. 001 loaded");

export function buildDanceParams(rand) {

    // --------------------------------------------------------
    // BPM TIPICO EURODANCE (Gabry Ponte / Prezioso / Eiffel 65)
    // --------------------------------------------------------
    const bpm = 120 + rand() * 25; // 120–145 BPM

    // --------------------------------------------------------
    // TONALITÀ TIPICHE EURODANCE
    // --------------------------------------------------------
    const tonalCenters = ["C", "D", "E", "F", "G", "A"];
    const tonalCenter = tonalCenters[(rand() * tonalCenters.length) | 0];

    // --------------------------------------------------------
    // PARAMETRI IMMAGINE (come orchestra/metal/piano)
    // --------------------------------------------------------
    const imageParams = {
        energy: rand(),      // influenza bass/lead
        brightness: rand(),  // influenza lead/chords
        complexity: rand(),  // influenza bass pattern
        texture: rand()      // influenza pad/FX
    };

    return {
        bpm,
        tonalCenter,
        imageParams
    };
}
