// pianoEngine.js — ver. 005
import * as Tone from "https://esm.sh/tone";
import { piano } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../metal/metalTheory.js"; 
import { waitForInstruments } from "../../common.js";

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

export async function createPianoEngine(params) {
    // 1. Setup iniziale deterministico
    const rand = createSeededRandom(params.dna);
    const p = buildPianoParams(rand, params.imageParams);

    // Fermiamo e puliamo tutto prima di rischedulare
    Tone.Transport.stop();
    Tone.Transport.cancel();
    
    Tone.Transport.bpm.value = p.bpm;

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;

    // 2. Programmazione della Timeline
    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            sectionProg.forEach((degree, i) => {
                const chordTime = measureStartTime + (i * (measureDur / sectionProg.length));
                const duration = (measureDur / sectionProg.length) * 0.9;
                
                const rootNote = getScaleDegree(scale, degreeToIndex(degree));
                if (!rootNote) return;

                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ];

                // SCHEDULING CORRETTO: Programmiamo gli eventi PRIMA che parta il brano
                // NOTA: Non usiamo callback annidati, ma programmiamo i trigger direttamente sulla timeline
                
                // Mano Sinistra
                const bassNote = Tone.Frequency(rootNote).transpose(-12).toNote();
                Tone.Transport.schedule((time) => {
                    piano.triggerAttackRelease(bassNote, duration, time, p.velocityBase * 0.9);
                }, chordTime);

                // Mano Destra
                chordNotes.forEach((note, index) => {
                    const delay = p.useArpeggio ? index * 0.08 : 0;
                    Tone.Transport.schedule((time) => {
                        piano.triggerAttackRelease(note, duration, time, p.velocityBase * 0.6);
                    }, chordTime + delay);
                });
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
