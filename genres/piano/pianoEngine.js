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

console.log("pianoEngine.js ver. 022.7 loaded");

export async function waitPianoInstruments() {
    await waitForInstruments(1);
}

// ============================================================
// SOLO ENGINE V2 — Espressivo, fluido, melodico
// ============================================================

const PianoSoloV2 = {
    generate(section, progression, instruments, params, rand, measureDur, score) {
        const { piano } = instruments;
        if (!piano) {
            console.warn("PianoSoloV2: piano instrument not available");
            return;
        }

        const p = params.imageParams;
        if (!p) {
            console.warn("PianoSoloV2: imageParams not available");
            return;
        }

        // Ottieni tonalità
        let rootMidi;
        try {
            const tonalCenterNote = params.tonalCenter || p.tonalCenter || "C";
            rootMidi = Tone.Frequency(tonalCenterNote).toMidi();
            console.log(`PianoSoloV2: tonalCenter = ${tonalCenterNote}, root MIDI = ${rootMidi}`);
        } catch (e) {
            console.warn("PianoSoloV2: fallback a C4", e);
            rootMidi = 60;
        }

        // Scala per il solo
        const scaleType = p.complexity > 0.6 ? "harmonicMinor" : "naturalMinor";
        const scale = buildScaleFromTonic(Tone.Frequency(rootMidi, "midi").toNote(), scaleType);
        
        // Durata totale del solo
        const totalSeconds = section.measures * measureDur;
        
        // Numero di frasi (3-5 a seconda dell'energia)
        const numPhrases = Math.floor(3 + p.energy * 3);
        const phraseDuration = totalSeconds / numPhrases;
        
        // Stile del solo
        let soloStyle = "lyrical";
        if (p.energy > 0.7) soloStyle = "cinematic";
        if (p.complexity > 0.6) soloStyle = "romantic";
        
        // Pattern melodici per stile
        const phrasePatterns = {
            lyrical: [
                [0, 2, 3, 5, 3, 2, 0],
                [0, 2, 4, 5, 4, 2],
                [0, 1, 3, 5, 3, 1]
            ],
            romantic: [
                [0, 3, 5, 7, 9, 7, 5, 3],
                [0, 2, 5, 7, 9, 7, 5],
                [0, 4, 7, 9, 7, 4]
            ],
            cinematic: [
                [0, 5, 7, 12, 7, 5],
                [0, 4, 7, 12, 7, 4],
                [0, 5, 9, 12, 9, 5]
            ]
        };
        
        const patterns = phrasePatterns[soloStyle] || phrasePatterns.lyrical;
        
        let cursor = section.startTime;
        let melodicCursor = 0;
        let direction = 1;
        
        for (let phrase = 0; phrase < numPhrases; phrase++) {
            // Scegli pattern per questa frase
            const pattern = patterns[phrase % patterns.length];
            
            // Calcola quante note in questa frase
            const notesPerPhrase = Math.floor(5 + p.complexity * 8);
            
            // Estendi il pattern alla lunghezza desiderata
            const noteOffsets = [];
            for (let i = 0; i < notesPerPhrase; i++) {
                noteOffsets.push(pattern[i % pattern.length]);
            }
            
            // Timing delle note (con rubato e accelerando)
            const noteTimings = [];
            let timePos = 0;
            const totalPhraseTime = phraseDuration;
            
            // Distribuisci le note con ritmo naturale
            for (let i = 0; i < noteOffsets.length; i++) {
                // Durata variabile tra 0.2 e 0.5 secondi
                let duration = 0.25 + (rand() * 0.3);
                // Accelera verso la fine della frase
                const progress = i / noteOffsets.length;
                duration *= (1 - progress * 0.4);
                
                noteTimings.push({
                    offset: timePos,
                    duration: duration
                });
                timePos += duration;
            }
            
            // Normalizza alla durata della frase
            const timeScale = totalPhraseTime / timePos;
            
            // Genera le note
            for (let i = 0; i < noteOffsets.length; i++) {
                const absTime = cursor + noteTimings[i].offset * timeScale;
                
                // Movimento melodico naturale
                melodicCursor += noteOffsets[i];
                melodicCursor = (melodicCursor + scale.length) % scale.length;
                
                // Ottieni la nota
                let noteMidi = rootMidi + melodicCursor;
                
                // Aggiungi ottave per varietà
                if (p.brightness > 0.6 && rand() < 0.2) {
                    noteMidi += 12;
                }
                
                // Range sicuro (C4 - C7)
                noteMidi = Math.min(Math.max(noteMidi, 60), 96);
                const note = Tone.Frequency(noteMidi, "midi").toNote();
                
                // Dinamica espressiva
                const phraseProgress = i / noteOffsets.length;
                let velocity = 0.5 + phraseProgress * 0.4;
                
                // Climax verso la fine del solo
                const soloProgress = phrase / numPhrases;
                if (soloProgress > 0.7) velocity *= 1.2;
                
                // Micro-rubato
                const microDelay = (rand() - 0.5) * 0.025;
                const duration = noteTimings[i].duration * timeScale;
                const durationStr = duration < 0.3 ? "8n" : (duration < 0.5 ? "4n" : "2n");
                
                Tone.Transport.schedule(time => {
                    const t = time + microDelay;
                    piano.triggerAttackRelease(note, durationStr, t, velocity);
                    
                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", note, `${section.name}_SOLO`);
                    }, t);
                }, absTime);
            }
            
            cursor += totalPhraseTime;
        }
    }
};

function schedulePianoLead(section, progression, instruments, params, rand, measureDur, score) {
    const name = section.name.toLowerCase();
    if (!name.includes("solo")) return;
    PianoSoloV2.generate(section, progression, instruments, params, rand, measureDur, score);
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