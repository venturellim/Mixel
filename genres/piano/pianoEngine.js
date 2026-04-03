// pianoEngine.js — ver. 006 (Final Evolution)
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 003 loaded");

// Mappa di traduzione: dal nome del pattern metal al movimento pianistico
const PIANO_INTERPRETER = {
    "pm_sparse":        { lh: [1, 0, 0, 0, 0, 0, 0, 0], rh: [1, 0, 0, 0, 0, 0, 0, 0], type: "static" },
    "pm_groove":        { lh: [1, 0, 0.7, 0, 1, 0, 0.7, 0], rh: [0, 0, 1, 0, 0, 0, 1, 0], type: "arpeggio" },
    "open_epic":        { lh: [1, 0, 0, 0, 1, 0, 0, 0], rh: [1, 0.6, 0.8, 0.6, 1, 0.6, 0.8, 0.6], type: "arpeggio" },
    "pedal":            { lh: [1, 1, 1, 1, 1, 1, 1, 1], rh: [1, 0, 1, 0, 1, 0, 1, 0], type: "staccato" },
    "open_sustain":     { lh: [1, 0, 0, 0, 0, 0, 0, 0], rh: [1, 0, 0, 0, 0, 0, 0, 0], type: "sustained" },
    "default":          { lh: [1, 0, 0, 0, 1, 0, 0, 0], rh: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5], type: "arpeggio" }
};

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

export async function createPianoEngine(params) {
    const rand = createSeededRandom(params.dna);
    const p = buildPianoParams(rand, params.imageParams);

    // Reset della timeline
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8; // Divisione in ottavi

    structure.sections.forEach(section => {
        // Scegliamo la progressione (coerente con la foto)
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        // Qui potresti importare la tua funzione chooseRiffPattern o simularla
        // Per ora usiamo un fallback basato sulla sezione
        const styleName = section.name === "chorus" ? "open_epic" : "pm_groove";
        const style = PIANO_INTERPRETER[styleName] || PIANO_INTERPRETER.default;

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                const chordDuration = (measureDur / sectionProg.length);
                
                // Note dell'accordo
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                if (!rootNote) return;

                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ];

                // Dividiamo la durata dell'accordo in step di ottavi
                const stepsInChord = Math.floor(chordDuration / step8n);

                for (let s = 0; s < stepsInChord; s++) {
                    const stepTime = chordStartTime + (s * step8n);
                    const patternIdx = s % 8;

                    // 1. MANO SINISTRA (Bassi)
                    if (style.lh[patternIdx] > 0) {
                        const bassNote = Tone.Frequency(rootNote).transpose(-12).toNote();
                        const vel = p.velocityBase * style.lh[patternIdx] * (0.8 + rand() * 0.3);
                        const h = (rand() - 0.5) * 0.02; // Humanize +/- 10ms

                        Tone.Transport.schedule((time) => {
                            piano.triggerAttackRelease(bassNote, "2n", time, vel);
                        }, stepTime + h);
                    }

                    // 2. MANO DESTRA (Armonia/Arpeggio)
                    if (style.rh[patternIdx] > 0) {
                        const vel = p.velocityBase * style.rh[patternIdx] * (0.6 + rand() * 0.3);
                        const h = (rand() - 0.5) * 0.03;

                        if (style.type === "arpeggio") {
                            // Suona una nota alla volta dell'accordo
                            const note = chordNotes[s % chordNotes.length];
                            Tone.Transport.schedule((time) => {
                                piano.triggerAttackRelease(note, "4n", time, vel * 0.7);
                            }, stepTime + h);
                        } else {
                            // Suona l'accordo pieno
                            chordNotes.forEach((note, idx) => {
                                const strum = idx * 0.02; // Leggero arpeggio del tasto
                                Tone.Transport.schedule((time) => {
                                    piano.triggerAttackRelease(note, "2n", time + strum, vel * 0.5);
                                }, stepTime + h);
                            });
                        }
                    }
                }
            });
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => {
            if (Tone.context.state !== 'running') Tone.context.resume();
            piano.releaseAll();
            Tone.Transport.start("+0.1");
        },
        pause: () => Tone.Transport.pause(),
        stop: () => {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            piano.releaseAll();
        }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}
