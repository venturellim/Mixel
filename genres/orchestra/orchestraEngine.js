// ===============================================================
// 🎻 ORCHESTRA ENGINE 022.6 — VERSIONE COMPLETAMENTE COMMENTATA
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
// Tutto è modulare, leggibile e facilmente estendibile.
// ===============================================================

import * as Tone from "https://esm.sh/tone";
import { orchestraInstruments, orchestraVolumeMap } from "./orchestraInstruments.js";
import { createSeededRandom } from "../../utils/randomUtils.js";
import { buildSongStructure } from "../../utils/structureUtils.js";
import { buildScaleFromTonic, getScaleDegree } from "../../utils/scaleUtils.js";
import { generateSongProgressions } from "../../utils/musicTheory.js";
import { waitForInstruments } from "../../common.js";

console.log("🎼 orchestraEngine.js ver. 022.11 loaded");

// ---------------------------------------------------------------
// SAFE NOTE
// Garantisce che la nota sia valida e con ottava corretta.
// ---------------------------------------------------------------
function safeNote(note, defaultOctave = "4") {
    if (!note || typeof note !== "string") return null;
    const validated = /\d/.test(note) ? note : `${note}${defaultOctave}`;
    return isNaN(Tone.Frequency(validated).toMidi()) ? null : validated;
}

// ---------------------------------------------------------------
// SELEZIONE STILE SOLO (lirico / barocco / romantico)
// Basata su energia, complessità e luminosità dell'immagine.
// ---------------------------------------------------------------
function selectSoloStyle(img) {
    const { energy = 0.5, complexity = 0.5, brightness = 0.5 } = img;

    if (energy > 0.7 && complexity > 0.6) return "baroque";
    if (brightness < 0.5 && complexity > 0.4) return "romantic";
    return "lyrical";
}

// ---------------------------------------------------------------
// SCELTA STRUMENTO SOLISTA (violino 80%, viola 20%)
// Con bias basato sulla luminosità dell'immagine.
// ---------------------------------------------------------------
function chooseSoloInstrument(rand, img) {
    let base = rand();
    if (img.brightness < 0.4) base -= 0.1; // immagini scure → più viola
    if (img.brightness > 0.6) base += 0.1; // immagini luminose → più violino
    return base < 0.2 ? "viola" : "violin";
}

// ---------------------------------------------------------------
// CARICAMENTO STRUMENTI
// ---------------------------------------------------------------
export async function waitOrchestraInstruments() {
    await waitForInstruments(10);
}

// ---------------------------------------------------------------
// CREAZIONE ENGINE ORCHESTRALE
// Qui si definisce:
// - modalità (canon / hybrid / vivaldi)
// - BPM
// - durata dinamica dei soli
// - struttura completa del brano
// - progressioni armoniche
// ---------------------------------------------------------------
export async function createOrchestraEngine(params, score) {
    const rand = createSeededRandom(params.dna);
    const { violin, viola, cello, doubleBass, harpsichord, timpani } = orchestraInstruments;

    const img = params.imageParams || {};
    const energy = img.energy ?? 0.5;
    const complexity = img.complexity ?? 0.5;
    const brightness = img.brightness ?? 0.5;

    // -----------------------------------------------------------
    // SELEZIONE MODALITÀ
    // canon  → dolce, barocco lento
    // hybrid → cinematografico
    // vivaldi → veloce, energico
    // -----------------------------------------------------------
    let mode;
    if (energy < 0.35 || (brightness < 0.4 && complexity < 0.5)) mode = "canon";
    else if (energy > 0.65 || complexity > 0.7) mode = "vivaldi";
    else mode = "hybrid";

    console.log("🎼 Orchestra Mode:", mode);

    // -----------------------------------------------------------
    // BPM PER MODALITÀ
    // -----------------------------------------------------------
    let bpm;
    if (mode === "canon") bpm = 60 + energy * 20;
    else if (mode === "vivaldi") bpm = 130 + energy * 30;
    else bpm = 90 + energy * 25;

    Tone.Transport.stop();
    Tone.Transport.cancel();
    Tone.Transport.bpm.value = bpm;

    // Durata di una misura (4/4)
    const measureDur = (60 / bpm) * 4;

    // -----------------------------------------------------------
    // DURATA DINAMICA SOLO1 (pre-solo)
    // 10–15 secondi → 4–8 misure
    // -----------------------------------------------------------
    const solo1Sec = 10 + rand() * 5;
    let solo1Measures = Math.round(solo1Sec / measureDur);
    solo1Measures = Math.max(4, Math.min(8, solo1Measures));

    // -----------------------------------------------------------
    // DURATA DINAMICA SOLO2 (solo principale)
    // 20–45 secondi → 8–24 misure
    // -----------------------------------------------------------
    const solo2Sec = 20 + rand() * 25;
    let solo2Measures = Math.round(solo2Sec / measureDur);
    solo2Measures = Math.max(8, Math.min(24, solo2Measures));

    // -----------------------------------------------------------
    // STRUTTURA COMPLETA DEL BRANO
    // Con SOLO1 e SOLO2 integrati
    // -----------------------------------------------------------
    const dynamicStructure = [
        { name: "intro",   measures: 4 },
        { name: "verse",   measures: 16 },
        { name: "chorus",  measures: 16 },
        { name: "solo1",   measures: solo1Measures }, // pre-solo
        { name: "bridge",  measures: 8 },
        { name: "chorus2", measures: 16 },             // chorus intensificato
        { name: "solo2",   measures: solo2Measures },  // solo principale
        { name: "outro",   measures: 4 }
    ];

    const structure = buildSongStructure(dynamicStructure, bpm);

    // -----------------------------------------------------------
    // ARMONIA
    // -----------------------------------------------------------
    const tonalBase = params.tonalCenter || "A";
    const songProgressions = generateSongProgressions(structure, img, tonalBase, rand);

    if (score) {
        score.notes = [];
        if (score.setTheme) score.setTheme("orchestra");
    }

    // -----------------------------------------------------------
    // RITORNO ENGINE
    // -----------------------------------------------------------
    return {
    totalDuration: structure.totalDuration,

    instruments: orchestraInstruments,   // <— MANCAVA QUESTO!

    play: () => { 
        Tone.context.resume(); 
        Tone.Transport.start("+0.1"); 
    },

    stop: () => {
        Tone.Transport.stop();
        Tone.Transport.cancel();

        [violin, viola, cello, doubleBass, harpsichord].forEach(i => i?.releaseAll?.());
        timpani?.stopAll?.();
    },

    mixerData: {
        instruments: orchestraInstruments,
        volumeMap: orchestraVolumeMap
    }
};
}
// ===============================================================
// 🎻 PARTE 2/5 — SOLO ENGINE: FRASEGGIO + DINAMICHE + RUBATO
// ===============================================================
//
// Questa sezione definisce:
// - micro-rubato (solo romantico)
// - micro-vibrato (tutti gli stili, più forte nel romantico)
// - curva dinamica naturale (crescendo/diminuendo)
// - generatori di fraseggio per i tre stili:
//      • lirico (cinematografico)
//      • barocco (virtuosistico)
//      • romantico (cantabile/drammatico)
// - selezione del pattern melodico
//
// Tutto è modulare e facilmente estendibile.
// ===============================================================


// ---------------------------------------------------------------
// MICRO RUBATO
// Aggiunge un leggero anticipo/ritardo alla nota.
// Usato SOLO nello stile romantico.
// ---------------------------------------------------------------
function applyRubato(time, rand) {
    // ±30ms circa
    const offset = (rand() - 0.5) * 0.06;
    return time + offset;
}


// ---------------------------------------------------------------
// MICRO VIBRATO
// Aggiunge una variazione casuale alla velocity.
// Più intenso nel romantico, più leggero negli altri stili.
// ---------------------------------------------------------------
function vibratoVelocity(baseVel, rand, intensity = 0.05) {
    return Math.min(1, Math.max(0, baseVel + (rand() - 0.5) * intensity));
}


// ---------------------------------------------------------------
// CURVA DI DINAMICA
// Crea un crescendo naturale durante la sezione.
// Ogni stile ha una curva diversa.
// ---------------------------------------------------------------
function dynamicCurve(baseVel, sectionProgress, style) {
    let factor = 1;

    if (style === "lyrical") {
        // Crescendo dolce e cinematografico
        factor = 0.9 + sectionProgress * 0.3;

    } else if (style === "romantic") {
        // Crescendo molto ampio e drammatico
        factor = 0.8 + sectionProgress * 0.5;

    } else if (style === "baroque") {
        // Crescendo leggero, quasi impercettibile
        factor = 0.95 + sectionProgress * 0.15;
    }

    return Math.min(1, baseVel * factor);
}


// ---------------------------------------------------------------
// GENERATORI DI FRASEGGIO
// Ogni stile ha un set di pattern melodici diversi.
// ---------------------------------------------------------------

// --- LIRICO (cinematografico, frasi morbide e cantabili) ---
function lyricalSoloPhrase(scale, rootIdx, rand) {
    const patterns = [
        [0, 1, 3, 5],       // salita dolce
        [0, 2, 4],          // triade semplice
        [0, 1, 2, 1, 0],    // ondulazione
        [0]                 // nota lunga
    ];
    return patterns[(rand() * patterns.length) | 0];
}


// --- BAROCCO (virtuosistico, semicrome, moto rapido) ---
function baroqueSoloPhrase(scale, rootIdx, rand) {
    const patterns = [
        [0, 2, 4, 7, 4, 2],     // arpeggio veloce
        [0, 1, 2, 3, 4, 5, 6],  // scala ascendente
        [7, 6, 5, 4, 3, 2, 1],  // scala discendente
        [0, 4, 7, 4, 0]         // arpeggio classico
    ];
    return patterns[(rand() * patterns.length) | 0];
}


// --- ROMANTICO (drammatico, intervalli ampi, rubato) ---
function romanticSoloPhrase(scale, rootIdx, rand) {
    const patterns = [
        [0, 5, 3, 8],       // salto ampio
        [0, 2, 7, 9],       // progressione drammatica
        [0, -2, 3, 10],     // cromatismi e salti
        [0]                 // nota lunga molto espressiva
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
// 🎻 PARTE 3/5 — NUOVA LOGICA DEL VIOLONCELLO (SEMPRE ATTIVO)
// ===============================================================
//
// Il violoncello è la "spina dorsale" dell'orchestra.
// Non segue più il contrabbasso, ma ha un ruolo indipendente.
//
// Pattern diversi per modalità:
// - canon   → arpeggio lento (barocco dolce)
// - hybrid  → moto congiunto (cinematografico)
// - vivaldi → ostinato leggero (barocco veloce)
//
// Il volume è leggermente più alto del contrabbasso,
// come richiesto, per dare più presenza e base armonica.
//
// Questa sezione è usata in TUTTE le parti del brano:
// intro, verse, chorus, bridge, solo1, solo2, outro.
// ===============================================================


// ---------------------------------------------------------------
// PATTERN DEL VIOLONCELLO PER OGNI MODALITÀ
// ---------------------------------------------------------------
const celloPatterns = {
    canon:  [0, 4, 7, 4],   // arpeggio lento e dolce
    hybrid: [0, 2, 3, 2],   // moto congiunto cinematografico
    vivaldi:[0, 4, 0, 4]    // ostinato leggero e ritmico
};


// ---------------------------------------------------------------
// GENERATORE DI NOTE DEL VIOLONCELLO
// Restituisce la nota corretta in base al pattern e allo step.
// ---------------------------------------------------------------
function generateCelloNote(scale, rootIdx, step, mode) {
    const pattern = celloPatterns[mode] || celloPatterns.hybrid;
    const offset = pattern[step % pattern.length];
    return getScaleDegree(scale, rootIdx + offset);
}


// ---------------------------------------------------------------
// ESECUZIONE DEL VIOLONCELLO
// - Sempre attivo
// - Volume più alto del contrabbasso
// - Pattern diverso per modalità
// ---------------------------------------------------------------
function playCello(time, scale, rootIdx, step, mode, cello, score, sectionName, rand) {
    const note = generateCelloNote(scale, rootIdx, step, mode);
    const safe = safeNote(note, "3");
    if (!safe) return;

    // Volume più alto del contrabbasso (+3/+4 dB equivalente)
    const vel = 0.55 + (rand() * 0.1);

    cello.triggerAttackRelease(safe, "4n", time, vel);

    if (score) {
        score.addNote("Cello", safe, sectionName);
    }
}
// ===============================================================
// 🎻 PARTE 4/5 — ORCHESTRAZIONE SOLO1 + SOLO2
// ===============================================================
//
// Questa sezione contiene:
// - SOLO1 (pre-solo): morbido, introduttivo, elegante
// - SOLO2 (solo principale): climax orchestrale, espressivo, dinamico
//
// Entrambi usano:
// - fraseggio dedicato (lirico/barocco/romantico)
// - dinamiche curve
// - vibrato naturale
// - rubato (solo romantico)
// - cello sempre attivo
// - contrabbasso semplice
// - accompagnamento orchestrale intelligente
//
// ===============================================================


// ---------------------------------------------------------------
// 🎼 SOLO1 — PRE-SOLO (morbido, introduttivo)
// ---------------------------------------------------------------
//
// Caratteristiche:
// - stile lirico o romantico (mai barocco)
// - dinamiche morbide
// - nessun timpano
// - nessun clavicembalo
// - cello attivo ma dolce
// - contrabbasso leggerissimo
// - viola in controcanto solo se non è solista
// ---------------------------------------------------------------
function playSolo1Section(time, section, engine) {
    const {
        rand,
        img,
        mode,
        songProgressions,
        instruments: { violin, viola, cello, doubleBass },
        score
    } = engine;

    // SOLO1 usa solo lirico o romantico
    const style = img.brightness < 0.5 ? "romantic" : "lyrical";

    // Scelta strumento solista (violino/viola)
    const soloInstrument = chooseSoloInstrument(rand, img);
    const soloPlayer = soloInstrument === "viola" ? viola : violin;

    const scale = songProgressions[section.index].scale;
    const rootIdx = songProgressions[section.index].rootIdx;

    const totalSteps = section.measures * 4;

    for (let s = 0; s < totalSteps; s++) {
        const stepTime = time + s * Tone.Time("4n").toSeconds();
        const sectionProgress = s / totalSteps;

        // ---------------------------
        // 🎻 SOLO (violino/viola)
        // ---------------------------
        const phrase = generateSoloPhrase(style, scale, rootIdx, rand);
        const noteOffset = phrase[s % phrase.length];
        const note = getScaleDegree(scale, rootIdx + noteOffset);
        const safe = safeNote(note, soloInstrument === "viola" ? "4" : "5");

        if (safe) {
            const vel = dynamicCurve(0.55, sectionProgress, style);
            const vib = vibratoVelocity(vel, rand, style === "romantic" ? 0.08 : 0.04);
            const t = style === "romantic" ? applyRubato(stepTime, rand) : stepTime;

            soloPlayer.triggerAttackRelease(safe, "4n", t, vib);

            if (score) {
                score.addNote(
                    soloInstrument === "viola" ? "ViolaSolo" : "ViolinSolo",
                    safe,
                    section.name
                );
            }
        }

        // ---------------------------
        // 🎻 VIOLA (contro-canto leggero)
        // Solo se NON è solista
        // ---------------------------
        if (soloInstrument !== "viola") {
            const alt = getScaleDegree(scale, rootIdx + 2);
            const safeAlt = safeNote(alt, "4");
            if (safeAlt && rand() < 0.4) {
                viola.triggerAttackRelease(safeAlt, "4n", stepTime, 0.35);
                if (score) score.addNote("Viola", safeAlt, section.name);
            }
        }

        // ---------------------------
        // 🎻 CELLO (attivo ma morbido)
        // ---------------------------
        playCello(stepTime, scale, rootIdx, s, mode, cello, score, section.name, rand);

        // ---------------------------
        // 🎻 CONTRABBASSO (molto leggero)
        // ---------------------------
        if (s % 4 === 0) {
            const bassNote = getScaleDegree(scale, rootIdx);
            const safeBass = safeNote(bassNote, "2");
            if (safeBass) {
                doubleBass.triggerAttackRelease(safeBass, "1n", stepTime, 0.35);
                if (score) score.addNote("DoubleBass", safeBass, section.name);
            }
        }

        // Nessun timpano / nessun clavicembalo
    }
}



// ---------------------------------------------------------------
// 🎼 SOLO2 — SOLO PRINCIPALE (climax orchestrale)
// ---------------------------------------------------------------
//
// Caratteristiche:
// - stile dinamico (lirico / barocco / romantico)
// - fraseggio più ricco
// - vibrato più forte
// - rubato nel romantico
// - viola in controcanto
// - cello attivo e indipendente
// - contrabbasso semplice
// - clavicembalo solo in barocco
// - timpani nei climax
// ---------------------------------------------------------------
function playSolo2Section(time, section, engine) {
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

    const scale = songProgressions[section.index].scale;
    const rootIdx = songProgressions[section.index].rootIdx;

    const totalSteps = section.measures * 4;

    for (let s = 0; s < totalSteps; s++) {
        const stepTime = time + s * Tone.Time("4n").toSeconds();
        const sectionProgress = s / totalSteps;

        // ---------------------------
        // 🎻 SOLO (violino/viola)
        // ---------------------------
        const phrase = generateSoloPhrase(style, scale, rootIdx, rand);
        const noteOffset = phrase[s % phrase.length];
        const note = getScaleDegree(scale, rootIdx + noteOffset);
        const safe = safeNote(note, soloInstrument === "viola" ? "4" : "5");

        if (safe) {
            const vel = dynamicCurve(0.65, sectionProgress, style);
            const vib = vibratoVelocity(vel, rand, style === "romantic" ? 0.12 : 0.06);
            const t = style === "romantic" ? applyRubato(stepTime, rand) : stepTime;

            soloPlayer.triggerAttackRelease(safe, "4n", t, vib);

            if (score) {
                score.addNote(
                    soloInstrument === "viola" ? "ViolaSolo" : "ViolinSolo",
                    safe,
                    section.name
                );
            }
        }

        // ---------------------------
        // 🎻 VIOLA (contro-canto)
        // ---------------------------
        if (soloInstrument !== "viola") {
            const alt = getScaleDegree(scale, rootIdx + (style === "baroque" ? -2 : 2));
            const safeAlt = safeNote(alt, "4");
            if (safeAlt && rand() < 0.45) {
                viola.triggerAttackRelease(safeAlt, "4n", stepTime, 0.45);
                if (score) score.addNote("Viola", safeAlt, section.name);
            }
        }

        // ---------------------------
        // 🎻 CELLO (attivo, indipendente)
        // ---------------------------
        playCello(stepTime, scale, rootIdx, s, mode, cello, score, section.name, rand);

        // ---------------------------
        // 🎻 CONTRABBASSO (semplice)
        // ---------------------------
        if (s % 4 === 0) {
            const bassNote = getScaleDegree(scale, rootIdx);
            const safeBass = safeNote(bassNote, "2");
            if (safeBass) {
                doubleBass.triggerAttackRelease(safeBass, "1n", stepTime, 0.45);
                if (score) score.addNote("DoubleBass", safeBass, section.name);
            }
        }

        // ---------------------------
        // 🎹 CLAVICEMBALO (solo barocco)
        // ---------------------------
        if (style === "baroque" && rand() < 0.5) {
            const harpsNote = getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 4 : 7));
            const safeHarps = safeNote(harpsNote, "4");
            if (safeHarps) {
                harpsichord.triggerAttackRelease(safeHarps, "8n", stepTime, 0.35);
                if (score) score.addNote("Harpsichord", safeHarps, section.name);
            }
        }

        // ---------------------------
        // 🥁 TIMPANI (solo nei climax)
        // ---------------------------
        if (style !== "lyrical" && s % 8 === 0 && sectionProgress > 0.4) {
            const timpNote = getScaleDegree(scale, rootIdx);
            const safeTimp = safeNote(timpNote, "2");
            if (safeTimp) {
                timpani.triggerAttackRelease(safeTimp, "2n", stepTime, 0.55);
                if (score) score.addNote("Timpani", safeTimp, section.name);
            }
        }
    }
}

function playNormalSection(time, section, engine) {
    const {
        rand,
        mode,
        songProgressions,
        instruments: { violin, viola, cello, doubleBass, harpsichord, timpani },
        score
    } = engine;

    const scale = songProgressions[section.index].scale;
    const rootIdx = songProgressions[section.index].rootIdx;
    const totalSteps = section.measures * 4;

    for (let s = 0; s < totalSteps; s++) {
        const stepTime = time + s * Tone.Time("4n").toSeconds();

        // 🎻 Violino
        if (rand() < 0.45) {
            const note = safeNote(getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 2 : 4)), "5");
            if (note) {
                violin.triggerAttackRelease(note, "4n", stepTime, 0.45);
                if (score) score.addNote("Violin", note, section.name);
            }
        }

        // 🎻 Viola
        if (rand() < 0.55) {
            const note = safeNote(getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 0 : 2)), "4");
            if (note) {
                viola.triggerAttackRelease(note, "4n", stepTime, 0.40);
                if (score) score.addNote("Viola", note, section.name);
            }
        }

        // 🎻 Cello (sempre attivo)
        playCello(stepTime, scale, rootIdx, s, mode, cello, score, section.name, rand);

        // 🎻 Contrabbasso
        if (s % 4 === 0) {
            const bass = safeNote(getScaleDegree(scale, rootIdx), "2");
            if (bass) {
                doubleBass.triggerAttackRelease(bass, "1n", stepTime, 0.40);
                if (score) score.addNote("DoubleBass", bass, section.name);
            }
        }

        // 🎹 Clavicembalo
        if ((mode === "canon" || mode === "vivaldi") && rand() < 0.35) {
            const harps = safeNote(getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 4 : 7)), "4");
            if (harps) {
                harpsichord.triggerAttackRelease(harps, "8n", stepTime, 0.35);
                if (score) score.addNote("Harpsichord", harps, section.name);
            }
        }

        // 🥁 Timpani
        if (mode === "vivaldi" && s % 8 === 0 && rand() < 0.5) {
            const timp = safeNote(getScaleDegree(scale, rootIdx), "2");
            if (timp) {
                timpani.triggerAttackRelease(timp, "2n", stepTime, 0.5);
                if (score) score.addNote("Timpani", timp, section.name);
            }
        }
    }
}

// ===============================================================
// 🎻 PARTE 5/5 — INTEGRAZIONE FINALE + ROUTING SEZIONI
// ===============================================================
//
// Questa sezione:
// - scorre la struttura del brano
// - calcola il tempo di inizio di ogni sezione
// - chiama la funzione di orchestrazione corretta:
//      • playNormalSection
//      • playSolo1Section
//      • playSolo2Section
// - gestisce il Chorus2 intensificato
// - avvia il Transport
//
// È il "direttore d'orchestra" dell'intero engine.
// ===============================================================


// ---------------------------------------------------------------
// AVVIO ENGINE ORCHESTRALE
// ---------------------------------------------------------------
export async function startOrchestraEngine(engine) {

    // Usa SEMPRE l’array delle sezioni
    const structure = engine.structure.sections;

    let currentTime = Tone.now() + 0.5;

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

    Tone.Transport.start();
}



// ---------------------------------------------------------------
// INTENSIFICAZIONE DEL CHORUS2
// ---------------------------------------------------------------
//
// Chorus2 è un pre-chorus potenziato:
// - violino più presente
// - viola più presente
// - cello più forte
//
// Non aggiunge strumenti nuovi, ma aumenta l'intensità.
// ---------------------------------------------------------------
function intensifyChorus2(time, section, engine) {
    const {
        rand,
        songProgressions,
        instruments: { violin, viola, cello },
        score
    } = engine;

    const scale = songProgressions[section.index].scale;
    const rootIdx = songProgressions[section.index].rootIdx;

    const totalSteps = section.measures * 4;

    for (let s = 0; s < totalSteps; s++) {
        const stepTime = time + s * Tone.Time("4n").toSeconds();

        // ---------------------------
        // 🎻 VIOLINO (più presente)
        // ---------------------------
        if (rand() < 0.6) {
            const note = getScaleDegree(scale, rootIdx + (rand() < 0.5 ? 4 : 7));
            const safe = safeNote(note, "5");
            if (safe) {
                violin.triggerAttackRelease(safe, "4n", stepTime, 0.65);
                if (score) score.addNote("Violin", safe, section.name);
            }
        }

        // ---------------------------
        // 🎻 VIOLA (più presente)
        // ---------------------------
        if (rand() < 0.5) {
            const note = getScaleDegree(scale, rootIdx + 2);
            const safe = safeNote(note, "4");
            if (safe) {
                viola.triggerAttackRelease(safe, "4n", stepTime, 0.55);
                if (score) score.addNote("Viola", safe, section.name);
            }
        }

        // ---------------------------
        // 🎻 CELLO (più forte)
        // ---------------------------
        if (rand() < 0.8) {
            const note = getScaleDegree(scale, rootIdx);
            const safe = safeNote(note, "3");
            if (safe) {
                cello.triggerAttackRelease(safe, "4n", stepTime, 0.65);
                if (score) score.addNote("Cello", safe, section.name);
            }
        }
    }
}
