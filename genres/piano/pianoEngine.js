// ==========================================
// pianoEngine.js — ver. 012 (FLUID LOGIC)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; // Già puntato alla nuova utility!
import { waitForInstruments } from "../../common.js";

console.log("🎹 pianoEngine v012: Fluid Logic (No Scatti)");

const PIANO_INTERPRETER = {
    "pm_sparse":    { lh: [1, 0, 0, 0, 0, 0, 0, 0], rh: [1, 0, 0, 0, 0, 0, 0, 0], type: "static" },
    "pm_groove":    { lh: [1, 0, 0.7, 0, 1, 0, 0.7, 0], rh: [0, 0, 1, 0, 0, 0, 1, 0], type: "arpeggio" },
    "open_epic":    { lh: [1, 0, 0, 0, 1, 0, 0, 0], rh: [1, 0.6, 0.8, 0.6, 1, 0.6, 0.8, 0.6], type: "arpeggio" },
    "default":      { lh: [1, 0, 0.8, 0, 1, 0, 0.8, 0], rh: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5], type: "arpeggio" }
};

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

export async function createPianoEngine(params) {
    const rand = createSeededRandom(params.dna);
    const p = buildPianoParams(rand, params.imageParams);

    // 1. SETUP BPM FISSO (Stabile)
    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    // Sustain più naturale per il telefono
    const sustainValue = (params.imageParams.brightness > 0.7) ? 2.5 : 1.5; 
    piano.set({ release: sustainValue });
    piano.volume.value = -3; // Leggermente più alto per il telefono
    
    const humanTouch = params.imageParams.complexity * 0.2; 

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8;

    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];
        const halfMeasures = Math.ceil(section.measures / 2);

        for (let m = 0; m < section.measures; m++) {
            const isSecondHalf = m >= halfMeasures;
            const measureStartTime = section.startTime + (m * measureDur);

            let styleName = section.name === "chorus" ? "open_epic" : "pm_groove";
            if (section.name === "intro") styleName = isSecondHalf ? "pm_groove" : "pm_sparse";
            const style = PIANO_INTERPRETER[styleName] || PIANO_INTERPRETER.default;

            let octaveOffset = (section.name === "chorus" || (section.name === "intro" && isSecondHalf)) ? 12 : 0;

            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                const chordDuration = (measureDur / sectionProg.length);
                const stepsInChord = Math.floor(chordDuration / step8n);
                
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                if (!rootNote) return;

                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ].map(n => Tone.Frequency(n).transpose(octaveOffset).toNote());

                for (let s = 0; s < stepsInChord; s++) {
                    const stepTime = chordStartTime + (s * step8n);
                    const patternIdx = s % 8;

                    // Pausa intelligente (meno drastica della v011)
                    if (section.name === "intro" && s > 0 && rand() > 0.6) continue;

                    // --- MANO SINISTRA (Solida) ---
                    if (style.lh[patternIdx] > 0) {
                        const dynamicVel = (p.velocityBase * style.lh[patternIdx]) + ((rand() - 0.5) * humanTouch);
                        const noteLH = Tone.Frequency(rootNote).transpose(-12).toNote();

                        Tone.Transport.schedule((time) => {
                            // Bassi un filo più corti per evitare fango sonoro
                            piano.triggerAttackRelease(noteLH, "2n", time, Math.max(0.1, dynamicVel * 0.8));
                        }, stepTime);
                    }

                    // --- MANO DESTRA (Umanizzata ma a tempo) ---
                    let canPlayRH = true;
                    if (section.name === "intro" && !isSecondHalf) canPlayRH = rand() > 0.8;

                    if (canPlayRH) {
                        const isPatternActive = style.rh[patternIdx] > 0;
                        if (isPatternActive || rand() > 0.6) {
                            
                            // Micro-ritardo casuale (solo 5-15ms), non rompe il loop
                            const microDelay = rand() * 0.015; 
                            const dynamicVelBase = ((p.velocityBase * (style.rh[patternIdx] || 0.6)) + ((rand() - 0.5) * humanTouch));

                            const note = chordNotes[Math.floor(rand() * chordNotes.length)];
                            
                            Tone.Transport.schedule((time) => {
                                // Nota lunga ma con release controllata dal campionatore
                                piano.triggerAttackRelease(note, "1n", time + microDelay, Math.max(0.05, dynamicVelBase * 0.5));
                            }, stepTime);
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
