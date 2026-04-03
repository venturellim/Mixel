// pianoEngine.js — ver. 008 (Extended & Dynamic)
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 008 loaded");

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

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    // Setup espressività globale
    const sustainValue = (params.imageParams.brightness > 0.7) ? 2.5 : 1.2; 
    piano.set({ release: sustainValue });
    piano.volume.value = params.imageParams.brightness > 0.8 ? 0 : -5; 
    const humanTouch = params.imageParams.complexity * 0.2; 

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);

    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8;

    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        // DETERMINIAMO L'OTTAVA DELLA MANO DESTRA IN BASE ALLA SEZIONE
        let octaveOffset = 0;
        if (section.name === "chorus") octaveOffset = 12; // Un'ottava sopra
        if (section.name === "solo") octaveOffset = (rand() > 0.5 ? 12 : 0);

        const styleName = section.name === "chorus" ? "open_epic" : "pm_groove";
        const style = PIANO_INTERPRETER[styleName] || PIANO_INTERPRETER.default;

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                const chordDuration = (measureDur / sectionProg.length);
                
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                if (!rootNote) return;

                // CALCOLO CHORD NOTES CON OFFSET OTTAVA
                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ].map(note => Tone.Frequency(note).transpose(octaveOffset).toNote());

                const stepsInChord = Math.floor(chordDuration / step8n);

                for (let s = 0; s < stepsInChord; s++) {
                    const stepTime = chordStartTime + (s * step8n);
                    const patternIdx = s % 8;

                    // --- MANO SINISTRA (Bassi) ---
                    if (style.lh[patternIdx] > 0) {
                        const bassNote = Tone.Frequency(rootNote).transpose(-12).toNote();
                        const dynamicVel = (p.velocityBase * style.lh[patternIdx]) + ((rand() - 0.5) * humanTouch);
                        const h = (rand() - 0.5) * 0.02; 

                        Tone.Transport.schedule((time) => {
                            piano.triggerAttackRelease(bassNote, "2n", time, Math.max(0.1, Math.min(1, dynamicVel * 0.9)));
                        }, stepTime + h);
                    }

                    // --- MANO DESTRA EVOLUTA (Riempimento e Ottave) ---
                    const isPatternActive = style.rh[patternIdx] > 0;
                    const shouldFill = rand() > 0.6; // 40% possibilità nota extra

                    if (isPatternActive || shouldFill) {
                        const h = (rand() - 0.5) * 0.04;
                        const fillModifier = isPatternActive ? 1 : 0.4; 
                        const dynamicVelBase = ((p.velocityBase * (style.rh[patternIdx] || 0.5)) + ((rand() - 0.5) * humanTouch)) * fillModifier;

                        if (style.type === "arpeggio" || (!isPatternActive && shouldFill)) {
                            // Arpeggio o Ghost Note
                            const note = chordNotes[Math.floor(rand() * chordNotes.length)];
                            Tone.Transport.schedule((time) => {
                                piano.triggerAttackRelease(note, "8n", time, Math.max(0.05, Math.min(1, dynamicVelBase * 0.6)));
                            }, stepTime + h);
                        } else {
                            // Accordo pieno
                            chordNotes.forEach((note, idx) => {
                                const strum = idx * 0.025;
                                const noteVel = dynamicVelBase + ((rand() - 0.5) * 0.1);
                                Tone.Transport.schedule((time) => {
                                    piano.triggerAttackRelease(note, "2n", time + strum, Math.max(0.1, Math.min(1, noteVel * 0.5)));
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
