// ==========================================
// pianoEngine.js — ver. 016 (ADVANCED LH GROOVE)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { piano, pianoInstruments, pianoVolumeMap, lhBus, rhBus } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 016.1 loaded");

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}
// Genera il "Motto" melodico unico per la foto
function generateMotto(rand) {
    const motto = [];
    for (let i = 0; i < 4; i++) motto.push(Math.floor(rand() * 7)); 
    return motto;
}

// Ritorna il pattern ritmico per la mano sinistra in base alla sezione
function getLHPattern(sectionName, stepIdx, rand, complexity) {
    // Pattern di base (1 = colpo, 0 = pausa)
    const patterns = {
        intro:  [1, 0, 0, 0, 0, 0, 0, 0], // Solo l'uno
        verse:  [1, 0, 0, 0, 1, 0, 0, 0], // 1 e 5
        chorus: [1, 0, 1, 0, 1, 0, 1, 0], // In ottavi
        outro:  [1, 0, 0, 0, 0, 0, 0, 0]  
    };
    const base = patterns[sectionName] || patterns.verse;
    let hit = base[stepIdx];

    // Se la foto è complessa, aggiungiamo colpi extra nel Verse/Chorus
    if (hit === 0 && complexity > 0.6 && (stepIdx === 2 || stepIdx === 6) && rand() > 0.8) {
        hit = 0.6; // Colpo fantasma (più leggero)
    }
    return hit;
}

export async function createPianoEngine(params) {
    const rand = createSeededRandom(params.dna);
    const p = buildPianoParams(rand, params.imageParams);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8;

    const mottoIndices = generateMotto(rand); 
    let lastNoteIdx = 1; 

    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                
                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ].map(n => Tone.Frequency(n).transpose(section.name === "chorus" ? 12 : 0).toNote());

                const mottoNotes = mottoIndices.map(idx => 
                    Tone.Frequency(getScaleDegree(scale, degreeToIndex(degree) + idx)).transpose(12).toNote()
                );

                for (let s = 0; s < 8; s++) {
                    const stepTime = chordStartTime + (s * step8n);
                    
                    // --- MANO SINISTRA (LH) ---
                    const lhHit = getLHPattern(section.name, s, rand, p.complexity);
                    if (lhHit > 0) {
                        const isFirstHit = s === 0;
                        const isDoubleHit = (s === 3 || s === 7) && rand() > 0.7 && p.complexity > 0.5;

                        // Ottava spezzata: il primo colpo è bassissimo
                        const noteLH = Tone.Frequency(chordNotes[0]).transpose(isFirstHit ? -24 : -12).toNote();

                        Tone.Transport.schedule((time) => {
                            const vel = 0.4 * lhHit * lhBus.gain.value;
                            piano.triggerAttackRelease(noteLH, isFirstHit ? "1n" : "2n", time, vel);

                            if (isDoubleHit) {
                                // Il "ta-tam" ritmico
                                piano.triggerAttackRelease(noteLH, "16n", time + (step8n/2), vel * 0.6);
                            }
                        }, stepTime);
                    }

                    // --- MANO DESTRA (RH) ---
                    let noteToPlay = null;
                    let rhVel = 0.5;

                    if (section.name === "intro" || section.name === "outro" || section.name === "prechorus") {
                        if (s % 2 === 0) { 
                            noteToPlay = mottoNotes[(s / 2) % mottoNotes.length];
                            rhVel = 0.6;
                        }
                    } else {
                        if (rand() > 0.4) {
                            const move = rand() > 0.5 ? 1 : -1;
                            lastNoteIdx = Math.max(0, Math.min(2, lastNoteIdx + move));
                            noteToPlay = chordNotes[lastNoteIdx];
                            rhVel = 0.45;
                        }
                    }

                    if (noteToPlay) {
                        const microDelay = rand() * 0.015;
                        Tone.Transport.schedule((time) => {
                            piano.triggerAttackRelease(noteToPlay, "1n", time + microDelay, rhVel * rhBus.gain.value);
                        }, stepTime);
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
        },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: pianoInstruments, volumeMap: pianoVolumeMap }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}
