// ==========================================
// pianoEngine.js — ver. 013 (MELODIC & MIXER)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { piano, pianoInstruments, pianoVolumeMap } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("🎹 pianoEngine v013: Melodic Movement & Mixer Active");

const PIANO_INTERPRETER = {
    "pm_sparse":    { lh: [1, 0, 0, 0, 0, 0, 0, 0], rh: [1, 0, 0, 0, 0, 0, 0, 0] },
    "pm_groove":    { lh: [1, 0, 0.7, 0, 1, 0, 0.7, 0], rh: [0, 0, 1, 0, 0, 0, 1, 0] },
    "open_epic":    { lh: [1, 0, 0, 0, 1, 0, 0, 0], rh: [1, 0.6, 0.8, 0.6, 1, 0.6, 0.8, 0.6] },
    "default":      { lh: [1, 0, 0.8, 0, 1, 0, 0.8, 0], rh: [1, 0.5, 1, 0.5, 1, 0.5, 1, 0.5] }
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

    const sustainValue = (params.imageParams.brightness > 0.7) ? 2.5 : 1.5; 
    piano.set({ release: sustainValue });
    
    const humanTouch = params.imageParams.complexity * 0.2; 
    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8;

    // --- LOGICA PUNTO 1: MEMORIA MELODICA ---
    let lastNoteIdx = 1; // Inizia dalla nota centrale dell'accordo

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

                    if (section.name === "intro" && s > 0 && rand() > 0.6) continue;

                    // --- MANO SINISTRA ---
                    if (style.lh[patternIdx] > 0) {
                        const dynamicVel = (p.velocityBase * style.lh[patternIdx]) + ((rand() - 0.5) * humanTouch);
                        const noteLH = Tone.Frequency(rootNote).transpose(-12).toNote();
                        Tone.Transport.schedule((time) => {
                            piano.triggerAttackRelease(noteLH, "2n", time, Math.max(0.1, dynamicVel * 0.8));
                        }, stepTime);
                    }

                    // --- MANO DESTRA (Melodia Fluida) ---
                    let canPlayRH = true;
                    if (section.name === "intro" && !isSecondHalf) canPlayRH = rand() > 0.8;

                    if (canPlayRH) {
                        const isPatternActive = style.rh[patternIdx] > 0;
                        if (isPatternActive || rand() > 0.6) {
                            
                            // Logica di movimento Punto 1:
                            // Invece di una nota a caso, ci spostiamo di un passo sopra o sotto l'ultima
                            const move = rand() > 0.5 ? 1 : -1;
                            lastNoteIdx = Math.max(0, Math.min(2, lastNoteIdx + move));
                            
                            const note = chordNotes[lastNoteIdx];
                            const microDelay = rand() * 0.015; 
                            const dynamicVelBase = ((p.velocityBase * (style.rh[patternIdx] || 0.6)) + ((rand() - 0.5) * humanTouch));
                            
                            Tone.Transport.schedule((time) => {
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
        pause: () => {
            Tone.Transport.pause();
        },
        stop: () => {
            Tone.Transport.stop();
            Tone.Transport.cancel();
            piano.releaseAll();
        },
        seek: (s) => {
            Tone.Transport.seconds = s;
        },
        mixerData: {
            instruments: pianoInstruments,
            volumeMap: pianoVolumeMap
        }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}
