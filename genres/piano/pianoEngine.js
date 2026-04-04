// ==========================================
// pianoEngine.js — ver. 015 (THEMATIC ENGINE)
// ==========================================
import * as Tone from "https://esm.sh/tone";
import { piano, pianoInstruments, pianoVolumeMap, lhBus, rhBus } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 015 loaded");

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

// Funzione interna per generare il "Motto" melodico della foto
function generateMotto(rand) {
    const motto = [];
    // Creiamo una sequenza di 4 indici della scala (es. 0, 2, 4, 3)
    for (let i = 0; i < 4; i++) {
        motto.push(Math.floor(rand() * 7)); 
    }
    return motto;
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

    // --- GENERAZIONE DEL TEMA UNICO ---
    const mottoIndices = generateMotto(rand); 
    let lastNoteIdx = 1; 

    structure.sections.forEach(section => {
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                
                // Note dell'accordo corrente
                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ].map(n => Tone.Frequency(n).transpose(section.name === "chorus" ? 12 : 0).toNote());

                // Note del TEMA adattate all'accordo (Motto)
                const mottoNotes = mottoIndices.map(idx => 
                    Tone.Frequency(getScaleDegree(scale, degreeToIndex(degree) + idx)).transpose(12).toNote()
                );

                for (let s = 0; s < 8; s++) {
                    const stepTime = chordStartTime + (s * step8n);
                    
                    // --- MANO SINISTRA (LH) EVOLUTA ---
const lhPattern = getLHPattern(section.name, rand, p.complexity);

if (lhPattern[s] > 0) {
    const isDoubleHit = (s === 3 || s === 7) && rand() > 0.7; // Raddoppio casuale
    const noteLH = Tone.Frequency(rootNote).transpose(-12).toNote();
    const octaveLH = Tone.Frequency(rootNote).transpose(-24).toNote(); // Ottava ancora più bassa

    Tone.Transport.schedule((time) => {
        const finalVel = Math.max(0.05, dynamicVel * 0.6 * lhBus.gain.value);
        
        // Alternanza ottave per dare profondità
        const noteToPlay = (s === 0) ? octaveLH : noteLH;
        
        piano.triggerAttackRelease(noteToPlay, "2n", time, finalVel);

        // Se è un raddoppio, suona una nota rapida subito dopo
        if (isDoubleHit) {
            piano.triggerAttackRelease(noteToPlay, "16n", time + (step8n / 2), finalVel * 0.7);
        }
    }, stepTime);
}

                    // --- MANO DESTRA (RH) ---
                    let noteToPlay = null;
                    let vel = 0.5;

                    // LOGICA TEMATICA: Intro e Outro suonano il Motto
                    if (section.name === "intro" || section.name === "outro" || section.name === "prechorus") {
                        if (s % 2 === 0) { // Suona il tema ogni 2 ottavi
                            noteToPlay = mottoNotes[(s / 2) % mottoNotes.length];
                            vel = 0.6;
                        }
                    } else {
                        // Chorus e Verse: Logica fluida solita (Punto 1)
                        if (rand() > 0.4) {
                            const move = rand() > 0.5 ? 1 : -1;
                            lastNoteIdx = Math.max(0, Math.min(2, lastNoteIdx + move));
                            noteToPlay = chordNotes[lastNoteIdx];
                            vel = 0.4;
                        }
                    }

                    if (noteToPlay) {
                        const microDelay = rand() * 0.015;
                        Tone.Transport.schedule((time) => {
                            piano.triggerAttackRelease(noteToPlay, "1n", time + microDelay, vel * rhBus.gain.value);
                        }, stepTime);
                    }
                }
            });
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { Tone.Transport.start("+0.1"); },
        pause: () => Tone.Transport.pause(),
        stop: () => { Tone.Transport.stop(); Tone.Transport.cancel(); },
        seek: (s) => Tone.Transport.seconds = s,
        mixerData: { instruments: pianoInstruments, volumeMap: pianoVolumeMap }
    };
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}
