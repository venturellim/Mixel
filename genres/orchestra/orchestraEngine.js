// ===============================================================
// 🎻 ORCHESTRA ENGINE 022.12 — PARTE 1/5
// ===============================================================
//
// Include:
// - Struttura completa con SOLO1 e SOLO2
// - Durata dinamica basata sui BPM
// - Selezione automatica dello stile del solo
// - Scelta strumento solista (violino/viola con bias)
// - Cello sempre attivo (pattern per modalità)
// - Chorus2 intensificato
// - Orchestrazione dedicata per SOLO1 e SOLO2
// - Orchestrazione normale per tutte le altre sezioni
//
// ===============================================================

import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { generateSongProgressions } from "../../utils/musicTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("orchestraEngine.js ver. 022.22 loaded");

// ---------------------------------------------------------------
// SAFE NOTE
// ---------------------------------------------------------------
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// ---------------------------------------------------------------
// STILE SOLO
// ---------------------------------------------------------------
function selectSoloStyle(img) {
    const { energy = 0.5, complexity = 0.5, brightness = 0.5 } = img;
    if (energy > 0.7 && complexity > 0.6) return "baroque";
    if (brightness < 0.5 && complexity > 0.4) return "romantic";
    return "lyrical";
}

// ---------------------------------------------------------------
// STRUMENTO SOLISTA
// ---------------------------------------------------------------
function chooseSoloInstrument(rand, img) {
    let base = rand();
    if (img.brightness < 0.4) base -= 0.1;
    if (img.brightness > 0.6) base += 0.1;
    return base < 0.2 ? "viola" : "violin";
}

// ---------------------------------------------------------------
// CARICAMENTO STRUMENTI
// ---------------------------------------------------------------
export async function waitOrchestraInstruments() {
    await waitForInstruments(6);
}

// ---------------------------------------------------------------
// CREAZIONE ENGINE ORCHESTRALE
// ---------------------------------------------------------------
export async function createOrchestraEngine(params, score) {

    const rand = createSeededRandom(params.dna);
    const { violin, viola, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    const img = params.imageParams || {};
    const energy = img.energy ?? 0.5;
    const complexity = img.complexity ?? 0.5;
    const brightness = img.brightness ?? 0.5;

    // MODALITÀ
    let mode;
    if (energy < 0.35 || (brightness < 0.4 && complexity < 0.5)) mode = "canon";
    else if (energy > 0.65 || complexity > 0.7) mode = "vivaldi";
    else mode = "hybrid";

    console.log("🎼 Orchestra Mode:", mode);

    // BPM
    let bpm;
    if (mode === "canon") bpm = 60 + energy * 20;
    else if (mode === "vivaldi") bpm = 130 + energy * 30;
    else bpm = 90 + energy * 25;

    // Durata misura (4/4)
    const measureDur = (60 / bpm) * 4;

    // SOLO1
    const solo1Sec = 10 + rand() * 5;
    let solo1Measures = Math.max(4, Math.min(8, Math.round(solo1Sec / measureDur)));

    // SOLO2
    const solo2Sec = 20 + rand() * 25;
    let solo2Measures = Math.max(8, Math.min(24, Math.round(solo2Sec / measureDur)));

    // STRUTTURA
    const dynamicStructure = [
        { name: "intro",   measures: 4 },
        { name: "verse",   measures: 16 },
        { name: "chorus",  measures: 16 },
        { name: "solo1",   measures: solo1Measures },
        { name: "bridge",  measures: 8 },
        { name: "chorus2", measures: 16 },
        { name: "solo2",   measures: solo2Measures },
        { name: "outro",   measures: 4 }
    ];

    const structure = buildSongStructure(dynamicStructure, bpm);

    // ARMONIA
    const tonalBase = params.tonalCenter || "A";
    const songProgressions = generateSongProgressions(structure, img, tonalBase, rand);

    if (score) {
        score.notes = [];
        if (score.setTheme) score.setTheme("orchestra");
    }

    // ENGINE OBJECT
    const engine = {
        structure,
        songProgressions,
        rand,
        img,
        mode,
        bpm,
        instruments: orchestraInstruments,
        score,
        totalDuration: structure.totalDuration,
        mixerData: {
            instruments: orchestraInstruments,
            volumeMap: orchestraVolumeMap
        }
    };

    // PLAY / STOP
    engine.play = () => {
        Tone.context.resume();
        Tone.Transport.stop();
        Tone.Transport.cancel();
        Tone.Transport.bpm.value = engine.bpm;

        startOrchestraEngine(engine);
        Tone.Transport.start("+0.1");
    };

    engine.stop = () => {
        Tone.Transport.stop();
        Tone.Transport.cancel();
        [violin, viola, cello, doubleBass, harpsichord].forEach(i => i?.releaseAll?.());
        timpani?.stopAll?.();
    };

    return engine;
}

// ===============================================================
// 🎻 ORCHESTRA ENGINE 022.12 — PARTE 2/5
// ===============================================================
//
// SOLO ENGINE:
// - micro-rubato (solo romantico)
// - micro-vibrato (tutti gli stili, più forte nel romantico)
// - curva dinamica naturale (crescendo/diminuendo)
// - generatori di fraseggio per i tre stili:
//      • lirico (cinematografico)
//      • barocco (virtuosistico)
//      • romantico (cantabile/drammatico)
// - selezione del pattern melodico
//
// ===============================================================

// ---------------------------------------------------------------
// MICRO RUBATO (solo romantico)
// ---------------------------------------------------------------
function applyRubato(time, rand) {
    // ±30ms circa
    const offset = (rand() - 0.5) * 0.06;
    return time + offset;
}

// ---------------------------------------------------------------
// MICRO VIBRATO (variazione velocity)
// ---------------------------------------------------------------
function vibratoVelocity(baseVel, rand, intensity = 0.05) {
    return Math.min(1, Math.max(0, baseVel + (rand() - 0.5) * intensity));
}

// ---------------------------------------------------------------
// CURVA DI DINAMICA (crescendo naturale)
// ---------------------------------------------------------------
function dynamicCurve(baseVel, sectionProgress, style) {
    let factor = 1;

    if (style === "lyrical") {
        factor = 0.9 + sectionProgress * 0.3;
    } else if (style === "romantic") {
        factor = 0.8 + sectionProgress * 0.5;
    } else if (style === "baroque") {
        factor = 0.95 + sectionProgress * 0.15;
    }

    return Math.min(1, baseVel * factor);
}

// ---------------------------------------------------------------
// GENERATORI DI FRASEGGIO
// ---------------------------------------------------------------

// --- LIRICO (cinematografico, morbido) ---
function lyricalSoloPhrase(scale, rootIdx, rand) {
    const patterns = [
        [0, 2, 4, 5, 4, 2, 0],
[0, 3, 5, 7, 5, 3],
[0, 1, 3, 5, 7, 5, 3],
        [0, 1, 3, 5],
        [0, 2, 4],
        [0, 1, 2, 1, 0],
        [0]
    ];
    return patterns[(rand() * patterns.length) | 0];
}

// --- BAROCCO (virtuosistico, rapido) ---
function baroqueSoloPhrase(scale, rootIdx, rand) {
    const patterns = [
    [0, 2, 4, 7, 9, 7, 4, 2],
[0, 1, 2, 3, 4, 5, 6, 7],
[7, 6, 5, 4, 3, 2, 1, 0],
        [0, 2, 4, 7, 4, 2],
        [0, 1, 2, 3, 4, 5, 6],
        [7, 6, 5, 4, 3, 2, 1],
        [0, 4, 7, 4, 0]
    ];
    return patterns[(rand() * patterns.length) | 0];
}

// --- ROMANTICO (drammatico, intervalli ampi) ---
function romanticSoloPhrase(scale, rootIdx, rand) {
    const patterns = [
    [0, 5, 3, 8, 10, 8, 5],
[0, 2, 7, 9, 12, 9, 7],
[0, -2, 3, 10, 12, 10, 3],

        [0, 5, 3, 8],
        [0, 2, 7, 9],
        [0, -2, 3, 10],
        [0]
    ];
    return patterns[(rand() * patterns.length) | 0];
}

// ---------------------------------------------------------------
// SELEZIONE DEL GENERATORE DI FRASEGGIO
// ---------------------------------------------------------------
function generateSoloPhrase(style, scale, rootIdx, rand) {
    if (style === "baroque") return baroqueSoloPhrase(scale, rootIdx, rand);
    if (style === "romantic") return romanticSoloPhrase(scale, rootIdx, rand);
    return lyricalSoloPhrase(scale, rootIdx, rand);
}

// ===============================================================
// 🎻 ORCHESTRA ENGINE 022.12 — PARTE 3/5
// ===============================================================
//
// CELLO ENGINE (SEMPRE ATTIVO):
// - Il violoncello è la "spina dorsale" dell'orchestra
// - Pattern diversi per modalità:
//      • canon   → arpeggio lento
//      • hybrid  → moto congiunto cinematografico
//      • vivaldi → ostinato leggero
// - Volume leggermente più alto del contrabbasso
// - Usato in TUTTE le sezioni: intro, verse, chorus, solo1, solo2, bridge, outro
//
// ===============================================================

// ---------------------------------------------------------------
// PATTERN DEL VIOLONCELLO PER OGNI MODALITÀ
// ---------------------------------------------------------------
const celloPatterns = {
    canon:  [0, 4, 7, 9, 7, 4],
hybrid: [0, 2, 3, 5, 3, 2],
vivaldi:[0, 4, 5, 7, 5, 4]
};

// ---------------------------------------------------------------
// GENERATORE DI NOTE DEL VIOLONCELLO
// ---------------------------------------------------------------
function generateCelloNote(scale, rootIdx, step, mode) {
    const pattern = celloPatterns[mode] || celloPatterns.hybrid;
    const offset = pattern[step % pattern.length];
    return getScaleDegree(scale, rootIdx + offset);
}

// ---------------------------------------------------------------
// ESECUZIONE DEL VIOLONCELLO
// ---------------------------------------------------------------
function playCello(time, scale, rootIdx, step, mode, cello, score, sectionName, rand) {
    const note = generateCelloNote(scale, rootIdx, step, mode);
    const safe = safeNote(note, "3");
    if (!safe) return;

    const vel = 0.55 + (rand() * 0.1);

    Tone.Transport.schedule(time => {
        cello.triggerAttackRelease(safe, "4n", time, vel);
        if (score) score.addNote("BassXtra", safe, sectionName);
    }, time);
}

function playTimpani(time, rand, timpani, score, sectionName) {
    if (!timpani || !timpani.player) return;

    const keys = ["timpano1", "timpano2", "timpano3", "timpano4", "timpano5"];
    const key = keys[Math.floor(rand() * keys.length)];

    const player = timpani.player(key);
    if (!player) return;

    Tone.Transport.schedule(time => {
        player.start(time);
        if (score) score.addNote("Drums", "Kick", sectionName);
    }, time);
}

// ===============================================================
// 🎻 ORCHESTRA ENGINE 022.12 — PARTE 4/5
// ===============================================================
//
// Contiene:
// - playNormalSection()
// - playSolo1Section()
// - playSolo2Section()
// ===============================================================

// ---------------------------------------------------------------
// 🎼 SOLO1 — PRE-SOLO (morbido, introduttivo)
// ---------------------------------------------------------------
function playSolo1Section(startTime, section, engine) {

    const {
        rand,
        img,
        mode,
        songProgressions,
        instruments: { violin, viola, cello, doubleBass },
        score
    } = engine;

    const style = img.brightness < 0.5 ? "romantic" : "lyrical";
    const soloInstrument = chooseSoloInstrument(rand, img);
    const soloPlayer = soloInstrument === "viola" ? viola : violin;

    const prog = songProgressions[section.name].progression;
    const root = songProgressions[section.name].root;

    const scale = buildScaleFromTonic(root + "3", "harmonicMinor");
    const rootIdx = 0;

    const totalSteps = section.measures * 4;

    for (let s = 0; s < totalSteps; s++) {

        const stepTime = startTime + s * Tone.Time("4n").toSeconds();
        const sectionProgress = s / totalSteps;

        // SOLO
        const phrase = generateSoloPhrase(style, scale, rootIdx, rand);
        // Direzione melodica: frasi ascendenti o discendenti
const direction = rand() < 0.5 ? 1 : -1;
const idx = (s * direction) % phrase.length;
const noteOffset = phrase[(idx + phrase.length) % phrase.length];

        //const noteOffset = phrase[(s / 2) % phrase.length | 0];
        const note = getScaleDegree(scale, rootIdx + noteOffset);
        let safe = safeNote(note, soloInstrument === "viola" ? "4" : "5");

        if (safe) {
        // Pause naturali (10% di probabilità)
if (rand() < 0.10) {
    continue; // salta la nota
}

            const vel = dynamicCurve(0.55, sectionProgress, style);
            // Climax dinamico: più vibrato verso la fine
const climax = sectionProgress > 0.7 ? 1.5 : 1.0;
const vib = vibratoVelocity(vel * climax, rand, style === "romantic" ? 0.12 : 0.06);

            //const vib = vibratoVelocity(vel, rand, style === "romantic" ? 0.08 : 0.04);
            const t = style === "romantic" ? applyRubato(stepTime, rand) : stepTime;

            const durations = ["8n", "4n", "4n", "8n", "2n"];
const dur = durations[(rand() * durations.length) | 0];
// Note di passaggio cromatiche (5%)
if (rand() < 0.05) {
    const midi = Tone.Frequency(safe).toMidi();
    const chromatic = Tone.Frequency(midi + (rand() < 0.5 ? -1 : 1), "midi").toNote();
    safe = safeNote(chromatic, soloInstrument === "viola" ? "4" : "5");
}
// Salti di ottava (solo barocco o climax)
if (style === "baroque" && rand() < 0.15) {
    const midi = Tone.Frequency(safe).toMidi();
    const up = Tone.Frequency(midi + 12, "midi").toNote();
    safe = safeNote(up, soloInstrument === "viola" ? "5" : "6");
}

Tone.Transport.schedule(time => {
    soloPlayer.triggerAttackRelease(safe, dur, time, vib);
    if (score) score.addNote(soloInstrument === "viola" ? "LeadXtra" : "Lead", safe, section.name);
}, t);
        }

        // VIOLA CONTRO-CANTO (solo se non è solista)
        if (soloInstrument !== "viola") {
            const alt = getScaleDegree(scale, rootIdx + 2);
            const safeAlt = safeNote(alt, "4");
            if (safeAlt && rand() < 0.4) {
                Tone.Transport.schedule(time => {
                    viola.triggerAttackRelease(safeAlt, "4n", time, 0.35);
                    if (score) score.addNote("LeadXtra", safeAlt, section.name);
                }, stepTime);
            }
        }

        // CELLO
        playCello(stepTime, scale, rootIdx, s, mode, cello, score, section.name, rand);

        // CONTRABBASSO
        if (s % 4 === 0) {
            const bassNote = getScaleDegree(scale, rootIdx + (rand() < 0.3 ? -2 : 0))
            const safeBass = safeNote(bassNote, "2");
            if (safeBass) {
                Tone.Transport.schedule(time => {
                    doubleBass.triggerAttackRelease(safeBass, "1n", time, 0.35);
                    if (score) score.addNote("Bass", safeBass, section.name);
                }, stepTime);
            }
        }
    }
}

// ---------------------------------------------------------------
// 🎼 SOLO2 — SOLO PRINCIPALE (climax orchestrale)
// ---------------------------------------------------------------
function playSolo2Section(startTime, section, engine) {

    const {
        rand,
        img,
        mode,
        songProgressions,
        instruments: { violin, viola, cello, doubleBass, harpsichord, timpani },
        score
    } = engine;

    const style = selectSoloStyle(img);
    const soloInstrument = chooseSoloInstrument(rand, img);
    const soloPlayer = soloInstrument === "viola" ? viola : violin;

    const prog = songProgressions[section.name].progression;
    const root = songProgressions[section.name].root;

    const scale = buildScaleFromTonic(root + "3", "harmonicMinor");
    const rootIdx = 0;

    const totalSteps = section.measures * 4;

    for (let s = 0; s < totalSteps; s++) {

        const stepTime = startTime + s * Tone.Time("4n").toSeconds();
        const sectionProgress = s / totalSteps;

        // SOLO
        const phrase = generateSoloPhrase(style, scale, rootIdx, rand);
        // Direzione melodica: frasi ascendenti o discendenti
const direction = rand() < 0.5 ? 1 : -1;
const idx = (s * direction) % phrase.length;
const noteOffset = phrase[(idx + phrase.length) % phrase.length];

        // const noteOffset = phrase[(s / 2) % phrase.length | 0];
        const note = getScaleDegree(scale, rootIdx + noteOffset);
        let safe = safeNote(note, soloInstrument === "viola" ? "4" : "5");

        if (safe) {
        // Pause naturali (10% di probabilità)
if (rand() < 0.10) {
    continue; // salta la nota
}

            const vel = dynamicCurve(0.65, sectionProgress, style);
            // Climax dinamico: più vibrato verso la fine
const climax = sectionProgress > 0.7 ? 1.5 : 1.0;
const vib = vibratoVelocity(vel * climax, rand, style === "romantic" ? 0.12 : 0.06);

            //const vib = vibratoVelocity(vel, rand, style === "romantic" ? 0.12 : 0.06);
            const t = style === "romantic" ? applyRubato(stepTime, rand) : stepTime;

            const durations = ["8n", "4n", "4n", "8n", "2n"];
const dur = durations[(rand() * durations.length) | 0];
// Note di passaggio cromatiche (5%)
if (rand() < 0.05) {
    const midi = Tone.Frequency(safe).toMidi();
    const chromatic = Tone.Frequency(midi + (rand() < 0.5 ? -1 : 1), "midi").toNote();
    safe = safeNote(chromatic, soloInstrument === "viola" ? "4" : "5");
}
// Salti di ottava (solo barocco o climax)
if (style === "baroque" && rand() < 0.15) {
    const midi = Tone.Frequency(safe).toMidi();
    const up = Tone.Frequency(midi + 12, "midi").toNote();
    safe = safeNote(up, soloInstrument === "viola" ? "5" : "6");
}


Tone.Transport.schedule(time => {
    soloPlayer.triggerAttackRelease(safe, dur, time, vib);
    if (score) score.addNote(soloInstrument === "viola" ? "LeadXtra" : "Lead", safe, section.name);
}, t);
        }

        // VIOLA CONTRO-CANTO
        if (soloInstrument !== "viola") {
            const alt = getScaleDegree(scale, rootIdx + (style === "baroque" ? -2 : 2));
            const safeAlt = safeNote(alt, "4");
            if (safeAlt && rand() < 0.45) {
                Tone.Transport.schedule(time => {
                    viola.triggerAttackRelease(safeAlt, "4n", time, 0.45);
                    if (score) score.addNote("LeadXtra", safeAlt, section.name);
                }, stepTime);
            }
        }

        // CELLO
        playCello(stepTime, scale, rootIdx, s, mode, cello, score, section.name, rand);

        // CONTRABBASSO
        if (s % 4 === 0) {
            const bassNote = getScaleDegree(scale, rootIdx + (rand() < 0.3 ? -2 : 0))
            const safeBass = safeNote(bassNote, "2");
            if (safeBass) {
                Tone.Transport.schedule(time => {
                    doubleBass.triggerAttackRelease(safeBass, "1n", time, 0.45);
                    if (score) score.addNote("Bass", safeBass, section.name);
                }, stepTime);
            }
        }

        // CLAVICEMBALO (solo barocco)
        if (style === "baroque" && rand() < 0.5) {
            const harpsNote = getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 4 : 7));
            const safeHarps = safeNote(harpsNote, "4");
            if (safeHarps) {
                Tone.Transport.schedule(time => {
                    harpsichord.triggerAttackRelease(safeHarps, "8n", time, 0.35);
                    if (score) score.addNote("Rhythm", safeHarps, section.name);
                }, stepTime);
            }
        }

        // TIMPANI (climax)
        if (style !== "lyrical" && s % 8 === 0 && sectionProgress > 0.4) {
            Tone.Transport.schedule(time => {
                playTimpani(time, rand, timpani, score, section.name);
            }, stepTime);
        }
    }
}

// ---------------------------------------------------------------
// 🎼 SEZIONI NORMALI (intro, verse, chorus, bridge, outro)
// ---------------------------------------------------------------
function playNormalSection(startTime, section, engine) {

    const {
        rand,
        mode,
        songProgressions,
        instruments: { violin, viola, cello, doubleBass, harpsichord, timpani },
        score
    } = engine;

    const prog = songProgressions[section.name].progression;
    const root = songProgressions[section.name].root;

    const scale = buildScaleFromTonic(root + "3", "harmonicMinor");
    const rootIdx = 0;
    const totalSteps = section.measures * 4;

    for (let s = 0; s < totalSteps; s++) {

        const stepTime = startTime + s * Tone.Time("4n").toSeconds();

        // VIOLINO
        if (rand() < 0.45) {
            const note = safeNote(getScaleDegree(scale, rootIdx + [0, 1, 2, 3, 4, 5, 7][(rand() * 7) | 0]), "5");
            if (note) {
                Tone.Transport.schedule(time => {
                    violin.triggerAttackRelease(note, "4n", time, 0.45);
                    if (score) score.addNote("Lead", note, section.name);
                }, stepTime);
            }
        }

        // VIOLA
        if (rand() < 0.55) {
            const note = safeNote(getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 0 : 2)), "4");
            if (note) {
                Tone.Transport.schedule(time => {
                    viola.triggerAttackRelease(note, "4n", time, 0.40);
                    if (score) score.addNote("LeadXtra", note, section.name);
                }, stepTime);
            }
        }

        // CELLO
        playCello(stepTime, scale, rootIdx, s, mode, cello, score, section.name, rand);

        // CONTRABBASSO
        if (s % 4 === 0) {
            const bass = safeNote(getScaleDegree(scale, rootIdx), "2");
            if (bass) {
                Tone.Transport.schedule(time => {
                    doubleBass.triggerAttackRelease(bass, "1n", time, 0.40);
                    if (score) score.addNote("Bass", bass, section.name);
                }, stepTime);
            }
        }

        // CLAVICEMBALO
        if ((mode === "canon" || mode === "vivaldi") && rand() < 0.35) {
            const harps = safeNote(getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 4 : 7)), "4");
            if (harps) {
                Tone.Transport.schedule(time => {
                    harpsichord.triggerAttackRelease(harps, "8n", time, 0.35);
                    if (score) score.addNote("Rhythm", harps, section.name);
                }, stepTime);
            }
        }

        // TIMPANI
        if (mode === "vivaldi" && s % 8 === 0 && rand() < 0.5) {
            Tone.Transport.schedule(time => {
                playTimpani(time, rand, timpani, score, section.name);
            }, stepTime);
        }
    }
}

// ===============================================================
// 🎻 ORCHESTRA ENGINE 022.12 — PARTE 5/5
// ===============================================================
//
// Contiene:
// - intensifyChorus2()
// - startOrchestraEngine(engine)
// ===============================================================

// ---------------------------------------------------------------
// 🎼 INTENSIFICAZIONE DEL CHORUS2
// ---------------------------------------------------------------
function intensifyChorus2(startTime, section, engine) {

    const {
        rand,
        songProgressions,
        instruments: { violin, viola, cello },
        score
    } = engine;

    const prog = songProgressions[section.name].progression;
    const root = songProgressions[section.name].root;

    const scale = buildScaleFromTonic(root + "3", "harmonicMinor");
    const rootIdx = 0;
    const totalSteps = section.measures * 4;

    for (let s = 0; s < totalSteps; s++) {

        const stepTime = startTime + s * Tone.Time("4n").toSeconds();

        // VIOLINO più presente
        if (rand() < 0.6) {
            const note = getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 4 : 7));
            const safe = safeNote(note, "5");
            if (safe) {
                Tone.Transport.schedule(time => {
                    violin.triggerAttackRelease(safe, "4n", time, 0.65);
                    if (score) score.addNote("Lead", safe, section.name);
                }, stepTime);
            }
        }

        // VIOLA più presente
        if (rand() < 0.5) {
            const note = getScaleDegree(scale, rootIdx + 2);
            const safe = safeNote(note, "4");
            if (safe) {
                Tone.Transport.schedule(time => {
                    viola.triggerAttackRelease(safe, "4n", time, 0.55);
                    if (score) score.addNote("LeadXtra", safe, section.name);
                }, stepTime);
            }
        }

        // CELLO più forte
        if (rand() < 0.8) {
            const note = getScaleDegree(scale, rootIdx);
            const safe = safeNote(note, "3");
            if (safe) {
                Tone.Transport.schedule(time => {
                    cello.triggerAttackRelease(safe, "4n", time, 0.65);
                    if (score) score.addNote("BassXtra", safe, section.name);
                }, stepTime);
            }
        }
    }
}

// ---------------------------------------------------------------
// 🎼 AVVIO ENGINE ORCHESTRALE
// ---------------------------------------------------------------
export async function startOrchestraEngine(engine) {

    const structure = engine.structure.sections;
    let currentTime = 0;

    for (let i = 0; i < structure.length; i++) {

        const section = structure[i];
        const start = currentTime;

        section.index = i;

        if (section.name === "solo1") {
            playSolo1Section(start, section, engine);
        } else if (section.name === "solo2") {
            playSolo2Section(start, section, engine);
        } else if (section.name === "chorus2") {
            playNormalSection(start, section, engine);
            intensifyChorus2(start, section, engine);
        } else {
            playNormalSection(start, section, engine);
        }

        currentTime += section.measures * Tone.Time("1m").toSeconds();
    }
}