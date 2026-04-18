import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { generateSongProgressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 022.2 loaded");

// safeNote identico al 019.1
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

function generateOrchestraMotto(rand, complexity) {
    const size = complexity > 0.6 ? 8 : 4;
    const motto = [];
    for (let i = 0; i < size; i++) {
        motto.push(Math.floor(rand() * 12) - 6);
    }
    return motto;
}

// selettore modalità stile metal
function selectOrchestraMode(img) {
    const { energy = 0.5, brightness = 0.5, complexity = 0.5 } = img;

    if (energy < 0.35 || (brightness < 0.4 && complexity < 0.5)) {
        return "canon";
    }
    if (energy > 0.65 || complexity > 0.7) {
        return "vivaldi";
    }
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

    let bpm;
    if (mode === "canon") {
        bpm = 60 + energy * 20;      // 60–80
    } else if (mode === "vivaldi") {
        bpm = 130 + energy * 30;     // 130–160
    } else {
        bpm = 90 + energy * 25;      // 90–115
    }

    const motto = generateOrchestraMotto(rand, complexity);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    const hasBridge = complexity > 0.7;
    const dynamicStructure = [
        { name: "intro",  measures: mode === "canon" ? 4 : 2 },
        { name: "verse",  measures: complexity > 0.5 ? 12 : 8 },
        { name: "chorus", measures: mode === "vivaldi" ? 16 : 8 }
    ];
    if (hasBridge) dynamicStructure.push({ name: "bridge", measures: 4 });
    dynamicStructure.push({ name: "outro", measures: mode === "canon" ? 8 : 4 });

    const structure = buildSongStructure(dynamicStructure, bpm);

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

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            
            for (let s = 0; s < 8; s++) {
                const stepTime = measureStartTime + (s * step8n);
                const currentDegree = progression[m % progression.length];
                const rootIdx = degreeToIndex(currentDegree);

                Tone.Transport.schedule((time) => {
                    try {
                        const baseNote = getScaleDegree(scale, rootIdx) || scale[0];

                        // VIOLINO (Lead) – adattivo per modalità
                        const mottoShift = motto[s % motto.length];
                        let vOffset, vDur, vProb, vVel;
                        if (mode === "canon") {
                            vOffset = 7 + mottoShift;
                            vDur = "4n";
                            vProb = 0.5;
                            vVel = 0.6;
                        } else if (mode === "vivaldi") {
                            vOffset = 7 + mottoShift;
                            vDur = "16n";
                            vProb = 0.9;
                            vVel = 0.7;
                        } else {
                            vOffset = 7 + mottoShift;
                            vDur = "8n";
                            vProb = 0.7;
                            vVel = 0.65;
                        }

                        const vNote = safeNote(getScaleDegree(scale, rootIdx + vOffset), "5");
                        if (vNote && rand() < vProb) {
                            violin.triggerAttackRelease(vNote, vDur, time, vVel);
                            Tone.Draw.schedule(() => { 
                                if (score) score.addNote("Lead", vNote, section.name);
                            }, time);
                        }

                        // VIOLA (seconda voce / pad)
                        const violaNote = safeNote(getScaleDegree(scale, rootIdx + 2), "4");
                        const violaProb = mode === "vivaldi" ? 0.5 : 0.7;
                        const violaDur = mode === "canon" ? "2n" : "4n";
                        const violaStep = mode === "vivaldi" ? 2 : 4;

                        if (violaNote && rand() < violaProb && (s % violaStep === 0)) {
                            viola.triggerAttackRelease(violaNote, violaDur, time, 0.4);
                            Tone.Draw.schedule(() => { 
                                if (score) score.addNote("LeadXtra", violaNote, section.name);
                            }, time);
                        }

                        // CLAVICEMBALO (solo Hybrid/Vivaldi)
                        if (mode !== "canon" && s % 2 === 1 && energy > 0.4) {
                            const hNote = safeNote(baseNote, "4");
                            if (hNote) {
                                const hDur = mode === "vivaldi" ? "16n" : "8n";
                                harpsichord.triggerAttackRelease(hNote, hDur, time, 0.3);
                                Tone.Draw.schedule(() => { 
                                    if (score) score.addNote("Rhythm", hNote, section.name);
                                }, time);
                            }
                        }

                        // CELLO & CONTRABBASSO
                        const bassStep = mode === "vivaldi" ? 2 : 4;
                        if (s % bassStep === 0) {
                            const bNote = safeNote(baseNote, "2");
                            if (bNote) {
                                cello.triggerAttackRelease(bNote, "2n", time, 0.7);
                                const dbNote = Tone.Frequency(bNote).transpose(-12).toNote();
                                doubleBass.triggerAttackRelease(dbNote, "2n", time, 0.5);

                                Tone.Draw.schedule(() => { 
                                    if (score) {
                                        score.addNote("Bass", dbNote, section.name);
                                        score.addNote("BassXtra", bNote, section.name);
                                    }
                                }, time);
                            }
                        }

                        // TIMPANI (Drums) – mappati come Kick per scoreUI
                        let timpCond = false;
                        if (mode === "canon") {
                            timpCond = (s === 0 && (energy > 0.5 || section.name === "chorus") && rand() < 0.4);
                        } else if (mode === "hybrid") {
                            timpCond = (s === 0 || (s === 4 && energy > 0.6));
                        } else {
                            timpCond = (s === 0 || s === 4);
                        }

                        if (timpCond) {
                            const tName = `timpano${(m % 5) + 1}`;
                            timpani.player(tName).start(time);
                            Tone.Draw.schedule(() => { 
                                if (score) score.addNote("Drums", "Kick", section.name);
                            }, time);
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
