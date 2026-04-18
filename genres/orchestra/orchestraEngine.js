// ==========================================
// orchestraEngine.js — ver. 021.3
// (SOLO ENGINE V2 + FIX TIMPANI + FIX SCOREUI)
// ==========================================

import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { generateSongProgressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 021.3 loaded");

// MIDI → nota stringa
function midiToNote(midi) {
    return Tone.Frequency(midi, "midi").toNote();
}

// safeNote accetta solo stringhe valide
function safeNote(note) {
    if (!note || typeof note !== "string") return null;
    return isNaN(Tone.Frequency(note).toMidi()) ? null : note;
}

// Mappa timpani → note vere (come la batteria del metal)
const timpaniNotes = ["C2", "D2", "E2", "F2", "G2"];

// Motto orchestrale
function generateOrchestraMotto(rand, complexity) {
    const size = complexity > 0.6 ? 8 : 4;
    const motto = [];
    for (let i = 0; i < size; i++) {
        motto.push(Math.floor(rand() * 12) - 6);
    }
    return motto;
}

export async function waitOrchestraInstruments() {
    await waitForInstruments(6);
}

// ─────────────────────────────────────────────
// ORCHESTRA SOLO ENGINE V2 — Violino + Archi + Timpani
// ─────────────────────────────────────────────

const OrchestraSoloV2 = {
    generate(section, progression, instruments, params, rand, measureDur, score, scale) {
        const { violin, viola, cello, doubleBass, timpani } = instruments;
        if (!violin) return;

        const totalTime = section.measures * measureDur;
        const phraseCount = 4;
        const phraseTime = totalTime / phraseCount;

        const patterns = [
            [0, 2, 4, 5, 4, 2, 0],
            [0, 3, 5, 7, 5, 3, 1],
            [0, 4, 7, 9, 7, 4, 2],
            [0, 5, 7, 12, 7, 5, 2]
        ];

        let cursor = section.startTime;

        for (let pIndex = 0; pIndex < phraseCount; pIndex++) {
            const pattern = patterns[rand() * patterns.length | 0];

            const degree = progression[pIndex % progression.length];
            const rootIdx = degreeToIndex(degree);
            const rootMidi = getScaleDegree(scale, rootIdx);

            const notes = pattern.map(step => {
                const idx = (step % scale.length + scale.length) % scale.length;
                return getScaleDegree(scale, idx) + (rootMidi - scale[0]);
            });

            const times = Array.from({ length: notes.length }, (_, i) => i * (phraseTime / notes.length));

            // Violino solista
            notes.forEach((midi, i) => {
                const abs = cursor + times[i];
                const note = midiToNote(midi);

                Tone.Transport.schedule(time => {
                    violin.triggerAttackRelease(note, "8n", time, 0.95);

                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", note, "SOLO");
                    }, time);
                }, abs);
            });

            // Pad di viola
            const padNote = midiToNote(rootMidi);
            Tone.Transport.schedule(time => {
                viola.triggerAttackRelease(padNote, phraseTime, time, 0.35);
            }, cursor);

            // Cello basso
            Tone.Transport.schedule(time => {
                cello.triggerAttackRelease(padNote, phraseTime, time, 0.4);
            }, cursor);

            // Contrabbasso sul primo battito
            Tone.Transport.schedule(time => {
                const dbNote = Tone.Frequency(padNote).transpose(-12).toNote();
                doubleBass.triggerAttackRelease(dbNote, "1n", time, 0.5);
            }, cursor);

            // Timpani drammatici + nota per lo spartito
            Tone.Transport.schedule(time => {
                const tIndex = pIndex % 5;
                const tName = `timpano${tIndex + 1}`;
                timpani.player(tName).start(time);

                const tNote = timpaniNotes[tIndex];
                if (score) score.addNote("Drums", tNote, "SOLO");
            }, cursor);

            cursor += phraseTime;
        }
    }
};

// ─────────────────────────────────────────────
// ORCHESTRA ENGINE PRINCIPALE
// ─────────────────────────────────────────────

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, viola, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    const img = params.imageParams || {};
    const energy = img.energy ?? 0.5;
    const complexity = img.complexity ?? 0.5;
    const brightness = img.brightness ?? 0.5;

    const bpm = 80 + (energy * 60);
    const motto = generateOrchestraMotto(rand, complexity);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // Struttura dinamica
    const hasBridge = complexity > 0.7;
    const dynamicStructure = [
        { name: "intro",  measures: energy > 0.6 ? 2 : 4 },
        { name: "verse",  measures: complexity > 0.5 ? 12 : 8 },
        { name: "chorus", measures: energy > 0.5 ? 16 : 8 }
    ];
    if (hasBridge) dynamicStructure.push({ name: "bridge", measures: 4 });
    dynamicStructure.push({ name: "solo", measures: 4 });
    dynamicStructure.push({ name: "outro", measures: energy < 0.3 ? 8 : 4 });

    const structure = buildSongStructure(dynamicStructure, bpm);

    // Armonia
    const tonalBase = params.tonalCenter || "A";
    const songProgressions = generateSongProgressions(structure, img, tonalBase, rand);

    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8;

    if (score) {
        score.notes = [];
        if (score.setTheme) score.setTheme("orchestra");
    }

    structure.sections.forEach(section => {
        const sectionData = songProgressions[section.name];
        const progression = sectionData.progression;

        const sectionRoot = sectionData.root + (brightness > 0.6 ? "4" : "3");
        const scale = buildScaleFromTonic(sectionRoot, "harmonicMinor");

        const isSolo = section.name === "solo";

        // SOLO ENGINE
        if (isSolo) {
            OrchestraSoloV2.generate(
                section,
                progression,
                { violin, viola, cello, doubleBass, timpani },
                params,
                rand,
                measureDur,
                score,
                scale
            );
            return;
        }

        // SEZIONI NORMALI
        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            for (let s = 0; s < 8; s++) {
                const stepTime = measureStartTime + (s * step8n);
                const currentDegree = progression[m % progression.length];
                const rootIdx = degreeToIndex(currentDegree);

                Tone.Transport.schedule((time) => {
                    try {
                        const baseMidi = getScaleDegree(scale, rootIdx);
                        const baseNote = midiToNote(baseMidi);

                        // Violino lead leggero
                        const leadMidi = getScaleDegree(scale, rootIdx + 7 + motto[s % motto.length]);
                        const leadNote = safeNote(midiToNote(leadMidi));

                        if (leadNote && rand() > (0.6 - energy * 0.3)) {
                            violin.triggerAttackRelease(leadNote, "8n", time, 0.6);
                            if (score) score.addNote("Lead", leadNote, section.name);
                        }

                        // Viola
                        const violaMidi = getScaleDegree(scale, rootIdx + 2);
                        const violaNote = safeNote(midiToNote(violaMidi));
                        if (violaNote && rand() > 0.4) {
                            viola.triggerAttackRelease(violaNote, "4n", time, 0.4);
                            if (score) score.addNote("LeadXtra", violaNote, section.name);
                        }

                        // Clavicembalo
                        if (s % 2 === 1 && energy > 0.3) {
                            const hNote = safeNote(baseNote);
                            if (hNote) harpsichord.triggerAttackRelease(hNote, "16n", time, 0.3);
                            if (score) score.addNote("Rhythm", hNote, section.name);
                        }

                        // Cello + Contrabbasso
                        if (s % 4 === 0) {
                            const celloNote = safeNote(midiToNote(baseMidi));
                            if (celloNote) {
                                cello.triggerAttackRelease(celloNote, "2n", time, 0.7);

                                const dbNote = Tone.Frequency(celloNote).transpose(-12).toNote();
                                doubleBass.triggerAttackRelease(dbNote, "2n", time, 0.5);

                                if (score) {
                                    score.addNote("Bass", dbNote, section.name);
                                    score.addNote("BassXtra", celloNote, section.name);
                                }
                            }
                        }

                        // Timpani (con nota vera per lo spartito)
                        if (s === 0 || (energy > 0.7 && s === 4)) {
                            const tIndex = m % 5;
                            const tName = `timpano${tIndex + 1}`;
                            timpani.player(tName).start(time);

                            const tNote = timpaniNotes[tIndex];
                            if (score) score.addNote("Drums", tNote, section.name);
                        }

                    } catch (e) { console.warn(e); }
                }, stepTime);
            }
        }
    });

    return {
        totalDuration: structure.totalDuration,
        play: () => { Tone.context.resume(); Tone.Transport.start("+0.1"); },
        stop: () => { 
            Tone.Transport.stop(); 
            Tone.Transport.cancel(); 
            [violin, viola, cello, doubleBass, harpsichord].forEach(i => i?.releaseAll?.());
            if (timpani) timpani.stopAll?.();
        },
        mixerData: { instruments: orchestraInstruments, volumeMap: orchestraVolumeMap }
    };
}

function degreeToIndex(degree) {
    const d = degree.toLowerCase().replace('b', '').replace('#', '');
    const map = { 'i': 0, 'ii': 1, 'iii': 2, 'iv': 3, 'v': 4, 'vi': 5, 'vii': 6 };
    return map[d] || 0;
}
