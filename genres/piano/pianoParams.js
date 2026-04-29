// pianoParams.js — ver. 001 (base for Piano Engine)
import { createSeededRandom } from "../../utils/randomUtils.js";

console.log("pianoParams.js ver. 001 loaded");

export function buildPianoParams(rand) {

    // BPM dinamico come orchestra/metal
    const bpm = 70 + rand() * 50; // 70–120

    // Tonicità di base
    const tonalCenters = ["A", "C", "D", "E", "F", "G"];
    const tonalCenter = tonalCenters[(rand() * tonalCenters.length) | 0];

    // Parametri immagine (come orchestra/metal)
    const imageParams = {
        energy: rand(),
        brightness: rand(),
        complexity: rand(),
        texture: rand()
    };

    return {
        bpm,
        tonalCenter,
        imageParams
    };
}
