// pianoParams.js — ver. 001 (base for Piano Engine)
import { createSeededRandom } from "../../utils/randomUtils.js";

console.log("pianoParams.js ver. 001 loaded");

export function buildPianoParams(rand, imageParamsFromPhoto) {

    const bpm = 70 + rand() * 50;

    const tonalCenters = ["A", "C", "D", "E", "F", "G"];
    const tonalCenter = tonalCenters[(rand() * tonalCenters.length) | 0];

    // Usa i parametri della foto, NON quelli random
    const imageParams = imageParamsFromPhoto;

    return {
        bpm,
        tonalCenter,
        imageParams
    };
}

