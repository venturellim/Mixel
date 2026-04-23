// ==========================================
// pianoEngine.js — ver. 022.0 (RH MELODY FIX + SOLO ENGINE V2)
// ==========================================

import * as Tone from "https://esm.sh/tone";
import { piano, pianoInstruments, pianoVolumeMap, lhBus, rhBus } from "./pianoInstruments.js";
import { buildPianoParams } from "./pianoParams.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { progressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("pianoEngine.js ver. 022.8 loaded");

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

// ============================================================
// SOLO ENGINE V3 — Espressivo con accelerazioni, pause, dinamica
// ============================================================

const PianoSolo = {
    generate(section, progression, instruments, params, rand, measureDur, score) {
        const { piano } = instruments;
        if (!piano) {
            console.warn("PianoSoloV3: piano instrument not available");
            return;
        }

        const p = params.imageParams;
        if (!p) {
            console.warn("PianoSoloV3: imageParams not available");
            return;
        }

        // Ottieni tonalità
        let rootMidi;
        try {
            const tonalCenterNote = params.tonalCenter || p.tonalCenter || "C";
            rootMidi = Tone.Frequency(tonalCenterNote).toMidi();
            console.log(`PianoSoloV3: tonalCenter = ${tonalCenterNote}, root MIDI = ${rootMidi}`);
        } catch (e) {
            console.warn("PianoSoloV3: fallback a C4", e);
            rootMidi = 60;
        }

        // Scala per il solo
        const scaleType = p.complexity > 0.6 ? "harmonicMinor" : "naturalMinor";
        const scale = buildScaleFromTonic(Tone.Frequency(rootMidi, "midi").toNote(), scaleType);
        
        // Durata totale del solo
        const totalSeconds = section.measures * measureDur;
        
        // Numero di frasi (3-6 a seconda dell'energia)
        const numPhrases = Math.floor(3 + p.energy * 4);
        
        // ============================================================
        // STRUTTURA DELL'ASSOLO CON ACCELERAZIONI E PAUSE
        // ============================================================
        
        // Distribuisci le frasi con timing espressivo
        const phraseTimings = [];
        let remainingTime = totalSeconds;
        
        for (let i = 0; i < numPhrases; i++) {
            const progress = i / numPhrases;
            let phraseDuration;
            
            // Accelerando verso la metà, poi rallentando
            if (progress < 0.3) {
                // Inizio: più lento (build up)
                phraseDuration = (remainingTime / (numPhrases - i)) * (1 + (0.3 - progress) * 0.5);
            } else if (progress < 0.7) {
                // Metà: più veloce (climax)
                phraseDuration = (remainingTime / (numPhrases - i)) * 0.7;
            } else {
                // Fine: rallenta (finale)
                phraseDuration = (remainingTime / (numPhrases - i)) * 1.3;
            }
            
            // Aggiungi pausa dopo alcune frasi (respiro)
            let pauseAfter = 0;
            if (i > 0 && i < numPhrases - 1 && rand() < 0.3) {
                pauseAfter = 0.2 + rand() * 0.3; // pausa di 0.2-0.5 secondi
            }
            
            phraseTimings.push({
                duration: Math.min(phraseDuration, remainingTime - pauseAfter),
                pause: pauseAfter,
                isClimax: (progress > 0.4 && progress < 0.7)
            });
            
            remainingTime -= (phraseDuration + pauseAfter);
            if (remainingTime < 0.5) break;
        }
        
        // Stile del solo
        let soloStyle = "lyrical";
        if (p.energy > 0.7) soloStyle = "cinematic";
        if (p.complexity > 0.6) soloStyle = "romantic";
        
        // Pattern melodici per stile
        const phrasePatterns = {
            lyrical: [
                [0, 2, 3, 5, 3, 2, 0],
                [0, 2, 4, 5, 4, 2],
                [0, 1, 3, 5, 3, 1],
                [0, 2, 5, 7, 5, 2],
                [0, 3, 2, 1, 2, 3]
            ],
            romantic: [
                [0, 3, 5, 7, 9, 7, 5, 3],
                [0, 2, 5, 7, 9, 7, 5, 2],
                [0, 4, 7, 9, 7, 4],
                [0, 3, 7, 10, 7, 3],
                [0, 5, 3, 1, 3, 5]
            ],
            cinematic: [
                [0, 5, 7, 12, 7, 5],
                [0, 4, 7, 12, 7, 4],
                [0, 5, 9, 12, 9, 5],
                [0, 7, 12, 14, 12, 7],
                [0, 5, 12, 7, 5]
            ]
        };
        
        const patterns = phrasePatterns[soloStyle] || phrasePatterns.lyrical;
        
        let cursor = section.startTime;
        let melodicCursor = 0;
        let lastNote = null;
        let repeatCount = 0;
        
        // ============================================================
        // GENERA LE FRASI
        // ============================================================
        
        for (let phraseIdx = 0; phraseIdx < phraseTimings.length; phraseIdx++) {
            const timing = phraseTimings[phraseIdx];
            const pattern = patterns[phraseIdx % patterns.length];
            
            // Numero di note in questa frase (variabile)
            let notesPerPhrase = Math.floor(4 + p.complexity * 8);
            
            // Frase climax = più note
            if (timing.isClimax) notesPerPhrase = Math.floor(notesPerPhrase * 1.5);
            
            // Aggiungi pause all'interno della frase (respiro)
            const internalPauses = [];
            if (phraseIdx > 0 && rand() < 0.4) {
                const pausePosition = Math.floor(notesPerPhrase * 0.3 + rand() * 0.4);
                internalPauses.push(pausePosition);
            }
            if (rand() < 0.2 && notesPerPhrase > 6) {
                const pausePosition = Math.floor(notesPerPhrase * 0.6);
                internalPauses.push(pausePosition);
            }
            
            // Estendi il pattern
            const noteOffsets = [];
            for (let i = 0; i < notesPerPhrase; i++) {
                // Aggiungi ripetizioni occasionali
                let offset = pattern[i % pattern.length];
                if (rand() < 0.15 && lastNote !== null && repeatCount < 2) {
                    // Ripeti la nota precedente
                    offset = noteOffsets[noteOffsets.length - 1] || offset;
                    repeatCount++;
                } else {
                    repeatCount = 0;
                }
                noteOffsets.push(offset);
            }
            
            // Timing delle note con accelerando interno
            const noteTimings = [];
            let timePos = 0;
            
            for (let i = 0; i < noteOffsets.length; i++) {
                // Verifica se c'è una pausa qui
                if (internalPauses.includes(i)) {
                    timePos += 0.15 + rand() * 0.2; // pausa breve
                }
                
                // Durata variabile con accelerando
                const progress = i / noteOffsets.length;
                let duration;
                
                if (timing.isClimax) {
                    // Nella parte climax: note più corte (accelerando)
                    duration = 0.12 + (1 - progress) * 0.1;
                } else if (phraseIdx === phraseTimings.length - 1) {
                    // Ultima frase: rallenta
                    duration = 0.3 + progress * 0.2;
                } else {
                    // Normale
                    duration = 0.18 + rand() * 0.12;
                }
                
                noteTimings.push({
                    offset: timePos,
                    duration: duration,
                    isAccented: (i % 4 === 0) // accento ogni 4 note
                });
                timePos += duration;
            }
            
            // Normalizza alla durata della frase
            const timeScale = timing.duration / timePos;
            
            // Genera le note
            for (let i = 0; i < noteOffsets.length; i++) {
                const absTime = cursor + noteTimings[i].offset * timeScale;
                
                // Movimento melodico
                melodicCursor += noteOffsets[i];
                melodicCursor = (melodicCursor + scale.length) % scale.length;
                
                // Ottieni la nota
                let noteMidi = rootMidi + melodicCursor;
                
                // Aggiungi ottave per varietà
                if (p.brightness > 0.6 && rand() < 0.2) {
                    noteMidi += 12;
                }
                if (timing.isClimax && rand() < 0.3) {
                    noteMidi += 12; // ottava alta nel climax
                }
                
                noteMidi = Math.min(Math.max(noteMidi, 60), 96);
                const note = Tone.Frequency(noteMidi, "midi").toNote();
                
                // Evita troppe ripetizioni consecutive
                if (lastNote === note && rand() < 0.8) continue;
                lastNote = note;
                
                // Dinamica espressiva
                const phraseProgress = i / noteOffsets.length;
                let velocity = 0.4;
                
                if (timing.isClimax) {
                    // Climax: più forte
                    velocity = 0.7 + phraseProgress * 0.3;
                } else if (phraseIdx === phraseTimings.length - 1) {
                    // Finale: piano
                    velocity = 0.35 + (1 - phraseProgress) * 0.2;
                } else {
                    // Normale: crescendo
                    velocity = 0.45 + phraseProgress * 0.3;
                }
                
                // Accento sulle note forti
                if (noteTimings[i].isAccented) velocity *= 1.2;
                
                // Durata variabile
                let durationStr = "8n";
                const durationSec = noteTimings[i].duration * timeScale;
                if (durationSec < 0.15) durationStr = "16n";
                else if (durationSec < 0.25) durationStr = "8n";
                else if (durationSec < 0.4) durationStr = "4n";
                else durationStr = "2n";
                
                // Micro-rubato
                const microDelay = (rand() - 0.5) * 0.02;
                
                Tone.Transport.schedule(time => {
                    const t = time + microDelay;
                    piano.triggerAttackRelease(note, durationStr, t, velocity);
                    
                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", note, `${section.name}_SOLO`);
                    }, t);
                }, absTime);
            }
            
            // Avanza il cursore (frase + pausa)
            cursor += timing.duration;
            if (timing.pause > 0) {
                // Schedulazione del silenzio (pausa)
                cursor += timing.pause;
            }
        }
    }
};

// Wrapper aggiornato
function schedulePianoLead(section, progression, instruments, params, rand, measureDur, score) {
    const name = section.name.toLowerCase();
    if (!name.includes("solo")) return;
    PianoSolo.generate(section, progression, instruments, params, rand, measureDur, score);
}
// ============================================================
// UTILITIES
// ============================================================

function generateMotto(rand) {
    const motto = [];
    for (let i = 0; i < 4; i++) motto.push(Math.floor(rand() * 7)); 
    return motto;
}

function getLHPattern(sectionName, stepIdx, rand, complexity) {
    const patterns = {
        intro:  [1,0,0,0,0,0,0,0],
        verse:  [1,0,0,0,1,0,0,0],
        chorus: [1,0,1,0,1,0,1,0],
        outro:  [1,0,0,0,0,0,0,0]  
    };
    const base = patterns[sectionName] || patterns.verse;
    let hit = base[stepIdx];
    if (hit === 0 && complexity > 0.6 && (stepIdx === 2 || stepIdx === 6) && rand() > 0.8) hit = 0.6;
    return hit;
}

function degreeToIndex(degree) {
    const map = { "i":0, "I":0, "ii":1, "iii":2, "III":2, "iv":3, "IV":3, "v":4, "V":4, "vi":5, "VI":5, "vii":6, "VII":6, "bVII":6 };
    return map[degree] || 0;
}

// ============================================================
// CREATE PIANO ENGINE (CORRETTA)
// ============================================================

export async function createPianoEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const p = buildPianoParams(rand, params.imageParams);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = p.bpm;

    const structure = buildSongStructure(p.structure, p.bpm);
    const scale = buildScaleFromTonic(p.tonalCenter, p.scaleType);
    const measureDur = (60 / p.bpm) * 4;
    const step8n = measureDur / 8;

    const tonalCenter = p.tonalCenter;
    const mottoIndices = generateMotto(rand); 
    
    const rubatoIntensity = params.imageParams.complexity * 0.05;
    const swingFactor = params.imageParams.saturation * 0.15;

    structure.sections.forEach(section => {

        const isSolo = section.name.toLowerCase().includes("solo");
        const possibleProgs = progressions[section.name] || progressions.verse;
        const sectionProg = possibleProgs[Math.floor(rand() * possibleProgs.length)];

        // Inizializza cursore melodico per RH
        if (!section._melodicCursor) {
            section._melodicCursor = Math.floor(rand() * 7);
            section._melodyDirection = 1;
            section._lastNote = null;
        }
        
        // Scala melodica per RH (costruita una volta)
        if (!section._melodyScale) {
            section._melodyScale = [];
            for (let deg = 0; deg < 7; deg++) {
                const note = getScaleDegree(scale, deg);
                if (note) section._melodyScale.push(note);
            }
        }

        // SOLO → mano destra = solo engine (LH continua)
        if (isSolo) {
            schedulePianoLead(
                section,
                sectionProg,
                { piano },
                { ...params, tonalCenter: tonalCenter },
                rand,
                measureDur,
                score
            );
        }

        // ============================================================
        // LOOP SULLE BATTUTE
        // ============================================================
        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            const isClosingMeasure = (m === section.measures - 1);

            // ============================================================
            // LEFT HAND - ACCOMPAGNAMENTO (ACCORDI VARIABILI - versione originale che funzionava)
            // ============================================================
            sectionProg.forEach((degree, i) => {
                const chordStartTime = measureStartTime + (i * (measureDur / sectionProg.length));
                
                // Costruisci l'accordo per questo grado
                const chordNotes = [
                    getScaleDegree(scale, degreeToIndex(degree)),     
                    getScaleDegree(scale, degreeToIndex(degree) + 2), 
                    getScaleDegree(scale, degreeToIndex(degree) + 4)  
                ].map(n => Tone.Frequency(n).transpose(section.name === "chorus" ? 12 : 0).toNote());

                const mottoNotes = mottoIndices.map(idx => 
                    Tone.Frequency(getScaleDegree(scale, degreeToIndex(degree) + idx)).transpose(12).toNote()
                );

                // Loop sui 16esimi per LH e RH
                for (let s = 0; s < 8; s++) {
                    const isEvenStep = s % 2 !== 0;
                    const swingOffset = isEvenStep ? (step8n * swingFactor) : 0;
                    const waveRubato = Math.sin((s / 8) * Math.PI) * rubatoIntensity;
                    const ritardando = (isClosingMeasure && s > 4) ? (s - 4) * 0.03 : 0;
                    const stepTime = chordStartTime + (s * step8n) + swingOffset + waveRubato + ritardando;
                    
                    // ========================================
                    // LEFT HAND (accompagnamento con accordi)
                    // ========================================
                    const lhHit = getLHPattern(section.name, s, rand, p.complexity);
                    if (lhHit > 0) {
                        const isFirstHit = s === 0;
                        // Usa la fondamentale dell'accordo corrente (non fissa!)
                        const noteLH = Tone.Frequency(chordNotes[0]).transpose(isFirstHit ? -24 : -12).toNote();
                        
                        Tone.Transport.schedule((time) => {
                            const vel = 0.4 * lhHit * lhBus.gain.value;
                            piano.triggerAttackRelease(noteLH, isFirstHit ? "1n" : "2n", time, vel);
                            Tone.Draw.schedule(() => {
                                if (score) score.addNote("Rhythm", noteLH, section.name);
                            }, time);
                        }, stepTime);
                    }
                    
                    // ========================================
                    // RIGHT HAND - MELODIA A NOTE SINGOLE
                    // ========================================
                    if (isSolo) continue;
                    
                    if (section._melodyScale.length === 0) continue;
                    
                    // Probabilità di suonare (respiro musicale)
                    const noteProbability = (section.name === "chorus") ? 0.65 : 0.5;
                    if (rand() > noteProbability) continue;
                    
                    // Cambia direzione ogni tanto
                    if (rand() < 0.08) section._melodyDirection *= -1;
                    
                    // Passo melodico (1 o 2 gradi)
                    let step = 1;
                    if (rand() < 0.2) step = 2;
                    if (rand() < 0.05) step = 3;
                    
                    section._melodicCursor += step * section._melodyDirection;
                    section._melodicCursor = (section._melodicCursor + section._melodyScale.length) % section._melodyScale.length;
                    
                    // Ottieni la nota singola
                    let noteName = section._melodyScale[section._melodicCursor];
                    let midiNote = Tone.Frequency(noteName).toMidi();
                    
                    // Ottava corretta per la melodia
                    if (section.name === "chorus") midiNote += 12;
                    else if (section.name === "verse") midiNote += 7;
                    else midiNote += 5;
                    
                    midiNote = Math.min(Math.max(midiNote, 60), 96);
                    const noteToPlay = Tone.Frequency(midiNote, "midi").toNote();
                    
                    // Evita note ripetute
                    if (section._lastNote === noteToPlay && rand() < 0.7) continue;
                    section._lastNote = noteToPlay;
                    
                    // Dinamica espressiva
                    const phraseProgress = (s % 8) / 8;
                    let velocity = 0.45 + phraseProgress * 0.3;
                    if (s === 0 || s === 4) velocity *= 1.15;
                    if (section.name === "chorus") velocity += 0.1;
                    
                    const duration = (rand() < 0.3) ? "4n" : "8n";
                    const microDelay = (rand() - 0.5) * 0.02;
                    
                    Tone.Transport.schedule((time) => {
                        const t = time + microDelay;
                        piano.triggerAttackRelease(noteToPlay, duration, t, velocity * rhBus.gain.value);
                        Tone.Draw.schedule(() => {
                            if (score) score.addNote("Lead", noteToPlay, section.name);
                        }, t);
                    }, stepTime);
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