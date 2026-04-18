import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { generateSongProgressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 022.3 loaded");

// === SAFE NOTE (019.1 — NON SI TOCCA) ===
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// === MOTTO ===
function generateOrchestraMotto(rand, complexity) {
    const size = complexity > 0.6 ? 8 : 4;
    const motto = [];
    for (let i = 0; i < size; i++) {
        motto.push(Math.floor(rand() * 12) - 6);
    }
    return motto;
}

// === SELETTORE MODALITÀ ===
function selectOrchestraMode(img) {
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = img;

    if (energy < 0.35 || (brightness < 0.4 && complexity < 0.5)) return "canon";
    if (energy > 0.65 || complexity > 0.7) return "vivaldi";
    return "hybrid";
}

export async function waitOrchestraInstruments() {
    await waitForInstruments(6);
}

export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, viola, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    const img = params.imageParams || {};
    const energy = img.energy ?? 0.5;
    const complexity = img.complexity ?? 0.5;
    const brightness = img.brightness ?? 0.5;

    const mode = selectOrchestraMode(img);
    console.log("🎼 Orchestra Mode:", mode);

    // === BPM PER MODALITÀ ===
    let bpm;
    if (mode === "canon") bpm = 60 + energy * 20;
    else if (mode === "vivaldi") bpm = 130 + energy * 30;
    else bpm = 90 + energy * 25;

    const motto = generateOrchestraMotto(rand, complexity);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // === STRUTTURA PIÙ LUNGA ===
    let introM, verseM, chorusM, bridgeM, outroM;

    if (mode === "canon") {
        introM = 8; verseM = 16; chorusM = 16; bridgeM = 8; outroM = 8;
    } else if (mode === "hybrid") {
        introM = 4; verseM = 16; chorusM = 16; bridgeM = 4; outroM = 4;
    } else {
        introM = 4; verseM = 16; chorusM = 24; bridgeM = 8; outroM = 4;
    }

    const dynamicStructure = [
        { name: "intro", measures: introM },
        { name: "verse", measures: verseM },
        { name: "chorus", measures: chorusM },
        { name: "bridge", measures: bridgeM },
        { name: "outro", measures: outroM }
    ];

    const structure = buildSongStructure(dynamicStructure, bpm);

    // === ARMONIA ===
    const tonalBase = params.tonalCenter || "A";
    const songProgressions = generateSongProgressions(structure, img, tonalBase, rand);

    const measureDur = (60 / bpm) * 4;
    const step8n = measureDur / 8;

    if (score) {
        score.notes = [];
        if (score.setTheme) score.setTheme("orchestra");
    }

    // === SEZIONI ===
    structure.sections.forEach(section => {
        const sectionData = songProgressions[section.name];
        const progression = sectionData.progression;
        const sectionRoot = sectionData.root + (brightness > 0.6 ? "4" : "3");
        const scale = buildScaleFromTonic(sectionRoot, "harmonicMinor");

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + m * measureDur;

            for (let s = 0; s < 8; s++) {
                const stepTime = measureStartTime + s * step8n;
                const currentDegree = progression[m % progression.length];
                const rootIdx = degreeToIndex(currentDegree);

                Tone.Transport.schedule(time => {
                    try {
                        const baseNote = getScaleDegree(scale, rootIdx) || scale[0];

                        // === VIOLINO ===
                        const mottoShift = motto[s % motto.length];
                        let vDur, vProb;
                        if (mode === "canon") { vDur = "4n"; vProb = 0.5; }
                        else if (mode === "vivaldi") { vDur = "16n"; vProb = 0.9; }
                        else { vDur = "8n"; vProb = 0.7; }

                        const vNote = safeNote(getScaleDegree(scale, rootIdx + 7 + mottoShift), "5");
                        if (vNote && rand() < vProb) {
                            violin.triggerAttackRelease(vNote, vDur, time, 0.7);
                            if (score) score.addNote("Lead", vNote, section.name);
                        }

                        // === VIOLA (FIX: SEMPRE UNA NOTA VALIDA) ===
                        const // === VIOLA (FIX + LOG) ===
const violaRaw = getScaleDegree(scale, rootIdx + 2) || scale[2];
const violaNote = safeNote(violaRaw, "4");

let violaStep = mode === "vivaldi" ? 2 : 4;
let violaProb = mode === "vivaldi" ? 0.5 : 0.7;
let violaDur = mode === "canon" ? "2n" : "4n";

// LOG DIAGNOSTICO
console.log(
    `[VIOLA] section=${section.name} m=${m} s=${s}`,
    `raw=${violaRaw}`,
    `note=${violaNote}`,
    `stepOK=${(s % violaStep === 0)}`,
    `probOK=${rand() < violaProb}`
);

if (violaNote && (s % violaStep === 0) && rand() < violaProb) {
    viola.triggerAttackRelease(violaNote, violaDur, time, 0.4);
    if (score) score.addNote("LeadXtra", violaNote, section.name);
}

                        // === CLAVICEMBALO ===
                        if (mode !== "canon" && s % 2 === 1 && energy > 0.4) {
                            const hNote = safeNote(baseNote, "4");
                            if (hNote) {
                                harpsichord.triggerAttackRelease(hNote, mode === "vivaldi" ? "16n" : "8n", time, 0.3);
                                if (score) score.addNote("Rhythm", hNote, section.name);
                            }
                        }

                        // === CELLO & CONTRABBASSO ===
                        const bassStep = mode === "vivaldi" ? 2 : 4;
                        if (s % bassStep === 0) {
                            const bNote = safeNote(baseNote, "2");
                            if (bNote) {
                                cello.triggerAttackRelease(bNote, "2n", time, 0.7);
                                const dbNote = Tone.Frequency(bNote).transpose(-12).toNote();
                                doubleBass.triggerAttackRelease(dbNote, "2n", time, 0.5);

                                if (score) {
                                    score.addNote("Bass", dbNote, section.name);
                                    score.addNote("BassXtra", bNote, section.name);
                                }
                            }
                        }

                        // === TIMPANI (sempre Kick per scoreUI) ===
                        let timpCond = false;
                        if (mode === "canon") timpCond = (s === 0 && rand() < 0.4);
                        else if (mode === "hybrid") timpCond = (s === 0 || (s === 4 && energy > 0.6));
                        else timpCond = (s === 0 || s === 4);

                        if (timpCond) {
                            const tName = `timpano${(m % 5) + 1}`;
                            timpani.player(tName).start(time);
                            if (score) score.addNote("Drums", "Kick", section.name);
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
            timpani?.stopAll?.();
        },
        mixerData: { instruments: orchestraInstruments, volumeMap: orchestraVolumeMap }
    };
}

function degreeToIndex(degree) {
    const d = degree.toLowerCase().replace("b", "").replace("#", "");
    const map = { i:0, ii:1, iii:2, iv:3, v:4, vi:5, vii:6 };
    return map[d] ?? 0;
}
