import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { generateSongProgressions } from "../../utils/musicTheory.js"; 
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 019 loaded");

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

    const bpm = 80 + (energy * 60);
    const motto = generateOrchestraMotto(rand, complexity);

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // Struttura dinamica (dal 18)
    const hasBridge = complexity > 0.7;
    const dynamicStructure = [
        { name: "intro",  measures: energy > 0.6 ? 2 : 4 },
        { name: "verse",  measures: complexity > 0.5 ? 12 : 8 },
        { name: "chorus", measures: energy > 0.5 ? 16 : 8 }
    ];
    if (hasBridge) dynamicStructure.push({ name: "bridge", measures: 4 });
    dynamicStructure.push({ name: "outro", measures: energy < 0.3 ? 8 : 4 });

    const structure = buildSongStructure(dynamicStructure, bpm);

    // Armonia dal 17 (migliore)
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

                        // === VIOLINO (Lead) ===
                        const mottoShift = motto[s % motto.length];
                        const vNote = safeNote(getScaleDegree(scale, rootIdx + 7 + mottoShift), "5");
                        
                        if (vNote && rand() > (0.6 - energy * 0.3)) {
                            violin.triggerAttackRelease(vNote, "8n", time, 0.6);
                            
                            // Visualizzazione VIOLINO (NERO)
                            Tone.Draw.schedule(() => { 
                                if (score) score.addNote("Lead", vNote, section.name, false);
                            }, time);
                        }

                        // === VIOLA (Lead - secondario) ===
                        // SUONA INDIPENDENTEMENTE dal violino (più densità)
                        const violaNote = safeNote(getScaleDegree(scale, rootIdx + 2), "4");
                        if (violaNote && rand() > 0.4) {  // 60% di probabilità
                            viola.triggerAttackRelease(violaNote, "4n", time, 0.4);
                            
                            // Visualizzazione VIOLA (BLU NOTTE)
                            Tone.Draw.schedule(() => { 
                                if (score) score.addNote("Lead", violaNote, section.name, true);
                            }, time);
                        }

                        // === CLAVICEMBALO (Rhythm) - dal 18 ===
                        if (s % 2 === 1 && energy > 0.4) {
                            const hNote = safeNote(baseNote, "4");
                            if (hNote) harpsichord.triggerAttackRelease(hNote, "16n", time, 0.3);
                            Tone.Draw.schedule(() => { 
                                if (score) score.addNote("Rhythm", hNote, section.name);
                            }, time);
                        }

                        // === CELLO & CONTRABBASSO (Bass) ===
                        if (s % 4 === 0) {
                            const bNote = safeNote(baseNote, "2");
                            if (bNote) {
                                cello.triggerAttackRelease(bNote, "2n", time, 0.7);
                                const dbNote = Tone.Frequency(bNote).transpose(-12).toNote();
                                doubleBass.triggerAttackRelease(dbNote, "2n", time, 0.5);

                                Tone.Draw.schedule(() => { 
                                    if (score) {
                                        score.addNote("Bass", bNote, section.name, false);
                                        score.addNote("Bass", dbNote, section.name, true);
                                    }
                                }, time);
                            }
                        }

                        // === TIMPANI (Drums) ===
                        if (s === 0 && (energy > 0.5 || section.name === "chorus")) {
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