// metalLeadEngine.js — ver. 067 (Advanced Solo v3)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 007 loaded");

// ─────────────────────────────────────────────
// METAL LEAD ENGINE — VERSIONE 4
// Modello: Stratovarius / Sonata Arctica
// Note: MIDI-based (più veloce per Tone.js)
// Floyd Rose: playbackRate automation
// Densità: adattiva (max 8 note/sec)
// Scale: dinamiche per sezione
// ─────────────────────────────────────────────



// ─────────────────────────────────────────────
// Capitolo 1 — Utility
// ─────────────────────────────────────────────

const LeadUtils = {
    rand() {
        return Math.random();
    },

    randInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    choice(arr) {
        return arr[Math.floor(Math.random() * arr.length)];
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    // Distribuisce N note in un intervallo temporale
    distributeTimes(start, end, count) {
        const step = (end - start) / count;
        return Array.from({ length: count }, (_, i) => start + i * step);
    }
};



// ─────────────────────────────────────────────
// Capitolo 2 — Scale dinamiche per sezione
// ─────────────────────────────────────────────
//
// Ogni sezione del solo usa una scala diversa:
// - melodic → maggiore/minore
// - lyrical → pentatonica/dorica
// - terzine → minore naturale
// - shred → minore armonica
// - sweep → arpeggi
// - tapping → modale
// - diminished → simmetrica
// - finalBurst → scala principale
//

const LeadScales = {
    major(root) {
        return [0, 2, 4, 5, 7, 9, 11].map(i => root + i);
    },

    minor(root) {
        return [0, 2, 3, 5, 7, 8, 10].map(i => root + i);
    },

    harmonicMinor(root) {
        return [0, 2, 3, 5, 7, 8, 11].map(i => root + i);
    },

    dorian(root) {
        return [0, 2, 3, 5, 7, 9, 10].map(i => root + i);
    },

    pentatonicMinor(root) {
        return [0, 3, 5, 7, 10].map(i => root + i);
    },

    phrygian(root) {
        return [0, 1, 3, 5, 7, 8, 10].map(i => root + i);
    },

    diminished(root) {
        return [0, 2, 3, 5, 6, 8, 9, 11].map(i => root + i);
    },

    wholeTone(root) {
        return [0, 2, 4, 6, 8, 10].map(i => root + i);
    }
};



// ─────────────────────────────────────────────
// Capitolo 3 — Pattern frase (contorni melodici)
// ─────────────────────────────────────────────
//
// Ogni pattern è espresso in gradi di scala.
// Verrà poi mappato sulla scala corretta della sezione.
//

const LeadPatterns = {
    melodicTheme: [
        [0, 2, 4, 5, 4, 2, 0],
        [0, 2, 5, 4, 2, 0],
        [0, 4, 5, 7, 5, 4, 2]
    ],

    lyricalBreak: [
        [0, 2, 3, 2, 0],
        [0, 3, 5, 3, 0],
        [0, 2, 0, -2, 0]
    ],

    terzine: [
        [0, 2, 4],
        [2, 4, 5],
        [4, 5, 7]
    ],

    shredRun: [
        [0, 2, 3, 5, 7, 8, 11],
        [0, 2, 3, 5, 7, 9, 11],
        [0, 1, 3, 5, 7, 8, 10]
    ],

    sweep: [
        [0, 4, 7, 12],
        [0, 3, 7, 12],
        [0, 4, 8, 12]
    ],

    tapping: [
        [0, 7, 12, 7],
        [0, 5, 12, 5],
        [0, 8, 12, 8]
    ],

    diminished: [
        [0, 2, 3, 5, 6, 8, 9, 11],
        [0, 3, 6, 9],
        [0, 2, 5, 8]
    ],

    finalBurst: [
        [0, 2, 4, 5, 7, 9, 11, 12],
        [0, 3, 5, 7, 10, 12],
        [0, 2, 5, 7, 9, 12]
    ]
};

// ─────────────────────────────────────────────
// Capitolo 4 — Floyd Rose (playbackRate automation)
// ─────────────────────────────────────────────
//
// Usato solo in frasi melodiche (circa 20% dei casi).
// Non tocca le note, solo il playbackRate del player.
//

const LeadFloyd = {
    apply(guitarLead, time, type = "scoop") {
        if (!guitarLead || !guitarLead.playbackRate) return;

        const pr = guitarLead.playbackRate;

        if (type === "scoop") {
            // leggero scoop verso l’alto
            pr.setValueAtTime(0.95, time);
            pr.linearRampToValueAtTime(1.0, time + 0.12);
        } else if (type === "dive") {
            // divebomb leggero
            pr.setValueAtTime(1.0, time);
            pr.exponentialRampToValueAtTime(0.7, time + 0.18);
            pr.linearRampToValueAtTime(1.0, time + 0.32);
        } else if (type === "rise") {
            // risalita lenta
            pr.setValueAtTime(0.9, time);
            pr.linearRampToValueAtTime(1.05, time + 0.25);
            pr.linearRampToValueAtTime(1.0, time + 0.35);
        } else if (type === "vibrato") {
            // vibrato largo power metal
            const steps = 6;
            for (let i = 0; i < steps; i++) {
                const t = time + i * 0.04;
                const val = i % 2 === 0 ? 0.98 : 1.02;
                pr.setValueAtTime(val, t);
            }
            pr.setValueAtTime(1.0, time + 0.25);
        }
    }
};

// ─────────────────────────────────────────────
// Capitolo 5 — Generatori di frasi (12–24 note, MIDI)
// ─────────────────────────────────────────────
//
// Qui non c’è ancora il tempo assoluto: solo
// struttura della frase (note + tempo relativo).
//

const LeadPhraseGen = {
    expandPattern(pattern, scale, rootMidi, desiredLength) {
        const notes = [];

        while (notes.length < desiredLength) {
            for (let step of pattern) {
                const idx = (step % scale.length + scale.length) % scale.length;
                notes.push(scale[idx] + rootMidi);
                if (notes.length >= desiredLength) break;
            }
        }
        return notes;
    },

    buildPhrase(pattern, scale, rootMidi, phraseTime, maxNotesPerSecond) {
        const maxNotes = Math.floor(phraseTime * maxNotesPerSecond);
        const desired = LeadUtils.clamp(maxNotes, 12, 24);

        const notes = this.expandPattern(pattern, scale, rootMidi, desired);
        const times = LeadUtils.distributeTimes(0, phraseTime, notes.length);

        return notes.map((n, i) => ({
            midi: n,
            relTime: times[i]
        }));
    }
};

// ─────────────────────────────────────────────
// Capitolo 6 — Logica BPM-aware e tempo totale
// ─────────────────────────────────────────────
//
// Qui calcoliamo:
// - tempo totale del solo
// - numero di frasi (3–5, ma adattato al tempo reale)
// - durata di ogni frase
// - filtro sezioni in base al BPM
//

const LeadTiming = {
    computeTotalSoloTime(sectionMeasures, measureDur) {
        return sectionMeasures * measureDur;
    },

    computePhraseCount(totalTime, energy) {
        let count = energy > 0.7 ? 5 : energy > 0.4 ? 4 : 3;
        const minPhraseTime = 1.2;

        while (count * minPhraseTime > totalTime) {
            count--;
        }
        return Math.max(1, count);
    },

    computePhraseTime(totalTime, phraseCount) {
        return totalTime / phraseCount;
    },

    filterSectionsByBPM(sections, bpm) {
        return sections.filter(sec => {
            if (bpm > 150 && sec.type === "lyrical") return false;
            if (bpm < 110 && sec.type === "shred") return false;
            return true;
        });
    }
};

// ─────────────────────────────────────────────
// Capitolo 7 — Tema B + C (immagine + BPM)
// ─────────────────────────────────────────────
//
// Il tema iniziale del solo dipende da:
// - brightness (immagine)
// - complexity (immagine)
// - BPM del brano
//
// Produce un pattern melodico di base per la prima frase.
//

const LeadTheme = {
    pickTheme(brightness, complexity, bpm) {
        // Tema più luminoso → maggiore
        if (brightness > 0.6) {
            return LeadPatterns.melodicTheme[LeadUtils.randInt(0, 2)];
        }

        // Tema più complesso → dorico / modale
        if (complexity > 0.6) {
            return LeadPatterns.lyricalBreak[LeadUtils.randInt(0, 2)];
        }

        // BPM alto → terzine
        if (bpm > 150) {
            return LeadPatterns.terzine[LeadUtils.randInt(0, 2)];
        }

        // Default power metal
        return LeadPatterns.melodicTheme[0];
    }
};

// ─────────────────────────────────────────────
// Capitolo 8 — Sezioni Modello 1 (Stratovarius/Sonata)
// ─────────────────────────────────────────────
//
// Ordine delle sezioni del solo:
// 1. melodicTheme
// 2. lyricalBreak
// 3. terzine
// 4. shredRun
// 5. sweep
// 6. tapping
// 7. diminished
// 8. finalBurst
//
// Verranno filtrate in base al BPM.
//

const LeadSections = [
    { type: "melodic",      patternSet: "melodicTheme",  scale: "major" },
    { type: "lyrical",      patternSet: "lyricalBreak",  scale: "pentatonicMinor" },
    { type: "terzine",      patternSet: "terzine",       scale: "minor" },
    { type: "shred",        patternSet: "shredRun",      scale: "harmonicMinor" },
    { type: "sweep",        patternSet: "sweep",         scale: "major" },
    { type: "tapping",      patternSet: "tapping",       scale: "phrygian" },
    { type: "diminished",   patternSet: "diminished",    scale: "diminished" },
    { type: "finalBurst",   patternSet: "finalBurst",    scale: "major" }
];

// ─────────────────────────────────────────────
// Capitolo 9 — Densità adattiva (max 8 note/sec)
// ─────────────────────────────────────────────
//
// La densità dipende da:
// - energy
// - complexity
// - BPM
//
// Il limite assoluto è 8 note/sec.
//

const LeadDensity = {
    computeMaxNotesPerSecond(energy, complexity, bpm) {
        let base = 4;

        if (energy > 0.6) base += 1.5;
        if (complexity > 0.6) base += 1.5;
        if (bpm > 150) base += 1.0;

        return Math.min(8, base);
    }
};

// ─────────────────────────────────────────────
// Capitolo 10 — Generatore SOLO V4
// ─────────────────────────────────────────────
//
// Qui costruiamo il solo completo:
// - calcolo tempo totale
// - numero frasi
// - durata frasi
// - scelta sezioni
// - generazione frasi
// - scheduling MIDI
//

const LeadSoloV4 = {
    generate(section, progression, instruments, params, rand, measureDur, score) {
        const { guitarLead } = instruments;
        if (!guitarLead) return;

        const { energy, brightness, texture, complexity, bpm } = params.imageParams;
        const totalTime = LeadTiming.computeTotalSoloTime(section.measures, measureDur);

        // Numero frasi
        const phraseCount = LeadTiming.computePhraseCount(totalTime, energy);
        const phraseTime = LeadTiming.computePhraseTime(totalTime, phraseCount);

        // Sezioni filtrate per BPM
        const usableSections = LeadTiming.filterSectionsByBPM(LeadSections, bpm);

        // Tema iniziale
        const themePattern = LeadTheme.pickTheme(brightness, complexity, bpm);

        // Densità
        const maxNPS = LeadDensity.computeMaxNotesPerSecond(energy, complexity, bpm);

        // Root MIDI (A4 = 69)
        const rootMidi = 60; // C4 come base

        // Generazione frasi
        let phrases = [];

        for (let i = 0; i < phraseCount; i++) {
            const sec = usableSections[i % usableSections.length];
            const patternSet = LeadPatterns[sec.patternSet];
            const pattern = (i === 0) ? themePattern : LeadUtils.choice(patternSet);

            const scaleFn = LeadScales[sec.scale];
            const scale = scaleFn(0); // root = 0, poi aggiungiamo rootMidi

            const phrase = LeadPhraseGen.buildPhrase(
                pattern,
                scale,
                rootMidi,
                phraseTime,
                maxNPS
            );

            phrases.push({ section: sec.type, phrase });
        }

        // Scheduling
        let cursor = section.startTime;

        for (let p of phrases) {
            for (let noteObj of p.phrase) {
                const absTime = cursor + noteObj.relTime;

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(
                        Tone.Frequency(noteObj.midi, "midi"),
                        "16n",
                        time
                    );

                    // Floyd Rose solo nelle sezioni melodiche
                    if (p.section === "melodic" && rand() < 0.2) {
                        LeadFloyd.apply(guitarLead, time, LeadUtils.choice(["scoop", "vibrato"]));
                    }

                    // Score
                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", noteObj.midi, p.section);
                    }, time);
                }, absTime);
            }

            cursor += phraseTime;
        }
    }
};

// ─────────────────────────────────────────────
// Capitolo Extra — Extra assolo (intro/verse/chorus) — VERSIONE ORIGINALE
// ─────────────────────────────────────────────
//
// Questa parte è praticamente identica alla tua V3
// per TUTTO ciò che NON è solo.
// L’unica cosa che cambia è il ramo `isSolo`,
// che ora delega a LeadSoloV4.
//

const LeadLegacy = {
    scheduleNonSolo(section, progression, instruments, params, rand, measureDur, score) {
        const { guitarLead } = instruments || {};
        if (!guitarLead) return;

        const name = section?.name?.toLowerCase() || "";
        const isChorus = name.includes("chorus") && !name.includes("pre");
        const isPreChorus = name.includes("pre");
        const isIntro = name.includes("intro") || name.includes("outro");
        const stepTime = measureDur / 16;

        const {
            energy = 0.5,
            brightness = 0.5,
            texture = 0.5,
            complexity = 0.5
        } = params?.imageParams || {};

        // --- LIBRERIA MASCHERE RITMICHE (Quando suonare) ---
        const library = {
            intro: [
                [0, 1, 2, 3, 4, 8, 12],
                [0, 4, 8, 10, 11, 12, 13, 14],
                [0, 2, 3, 4, 8, 10, 11, 12],
                [0, 3, 4, 7, 8, 11, 12, 15],
                [0, 1, 2, 3, 4, 5, 6, 7, 8]
            ],
            verse: [
                [0, 8],
                [0, 4, 8, 12],
                [0, 6, 8, 14],
                [0, 4, 10],
                [2, 6, 10, 14],
                [0, 2, 4, 8, 10, 12]
            ],
            prechorus: [
                [0, 4, 8, 12],
                [0, 2, 4, 6, 8, 10, 12, 14],
                [0, 4, 7, 11, 12],
                [0, 8, 12, 14],
                [0, 2, 4, 8, 10, 12]
            ],
            chorus: [
                [0, 2, 4, 6, 8, 10, 12, 14],
                [0, 8, 12],
                [0, 4, 8, 12],
                [0, 3, 8, 11],
                [0, 6, 7, 8, 14]
            ]
        };

        // --- LIBRERIA MELODICA (Cosa suonare) ---
        const melodicLibrary = {
            epic: [
                [0, 4, 7, 4, 5, 4, 2, 0], [0, 0, 4, 4, 7, 7, 4, 4],
                [0, 4, 5, 7, 0, 4, 5, 7], [7, 4, 0, 4, 7, 4, 0, 0],
                [0, 2, 4, 7, 5, 4, 2, 0], [0, 7, 4, 2, 0, 4, 2, 0],
                [4, 0, 4, 5, 7, 5, 4, 0], [0, 3, 5, 0, 3, 5, 7, 0]
            ],
            evil: [
                [0, 1, 0, 1, 4, 3, 1, 0], [0, 6, 5, 0, 6, 5, 1, 0],
                [0, 1, 4, 1, 0, 1, 4, 1], [0, 3, 4, 0, 3, 4, 6, 0],
                [1, 0, 1, 0, 3, 1, 0, 0], [0, 1, 3, 4, 6, 4, 3, 1],
                [0, 4, 3, 1, 0, 1, 3, 4], [6, 5, 4, 3, 2, 1, 0, 0]
            ],
            active: [
                [0, 1, 2, 3, 4, 5, 6, 7], [0, 2, 4, 2, 3, 5, 7, 5],
                [0, 2, 0, 4, 0, 5, 0, 7], [4, 0, 5, 0, 7, 0, 5, 0],
                [0, 2, 4, 5, 7, 5, 4, 2], [0, 3, 2, 5, 4, 7, 6, 0],
                [7, 5, 4, 2, 7, 5, 4, 2], [0, 7, 6, 7, 0, 5, 4, 5]
            ],
            emotional: [
                [0, 6, 5, 4, 2, 3, 2, 0], [2, 3, 2, 0, 4, 5, 4, 2],
                [4, 2, 0, 6, 5, 4, 2, 2], [0, 4, 6, 7, 6, 4, 2, 0],
                [5, 4, 2, 0, 5, 4, 2, 0], [0, 2, 4, 6, 0, 2, 4, 6],
                [4, 5, 7, 4, 2, 3, 2, 0], [0, 0, 6, 6, 5, 5, 4, 4]
            ],
            prechorus: [
                [0, 2, 3, 4, 5, 6, 7, 7], [0, 0, 2, 2, 4, 4, 6, 6],
                [0, 4, 0, 5, 0, 6, 0, 7], [4, 5, 4, 5, 6, 7, 7, 7]
            ]
        };

        const getPattern = (type) => {
            const family = library[type] || library.verse;
            const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
            const index = Math.floor(Math.abs(dnaScore)) % family.length;
            return family[index];
        };

        const getMelodyFamily = () => {
            if (isPreChorus) return { name: "PRE-CHORUS 📈", data: melodicLibrary.prechorus };
            if (isChorus) {
                return brightness > 0.5
                    ? { name: "EPIC 🏰", data: melodicLibrary.epic }
                    : { name: "EMOTIONAL 💧", data: melodicLibrary.emotional };
            }
            if (energy > 0.7 && texture > 0.6) return { name: "EVIL 😈", data: melodicLibrary.evil };
            if (complexity > 0.7) return { name: "ACTIVE ⚡", data: melodicLibrary.active };
            if (brightness < 0.4) return { name: "EMOTIONAL 💧", data: melodicLibrary.emotional };
            return { name: "EPIC 🏰", data: melodicLibrary.epic };
        };

        const sectionType = isIntro ? "intro" : (isPreChorus ? "prechorus" : (isChorus ? "chorus" : "verse"));
        const currentPattern = getPattern(sectionType);
        const mood = getMelodyFamily();
        const currentMelody = mood.data[Math.floor(energy * mood.data.length) % mood.data.length];

        // Debug (solo fuori dal solo)
        console.log(
            `%c 🎸 LEAD DNA EXECUTION \n` +
            `%c > Section: ${name.toUpperCase()} \n` +
            `%c > Mood: ${mood.name} \n` +
            `%c > Rhythm Mask: [${currentPattern.join(" - ")}] \n` +
            `%c > Melody Steps: [${currentMelody.join(", ")}]`,
            "color: #191970; font-weight: bold; font-size: 12px;",
            "color: #191970;",
            "color: #eee; font-weight: bold;",
            "color: #191970;",
            "color: #191970;"
        );

        const getStrictScale = (root) => {
            const allNotes = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
            let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
            let isMinor = root.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
            cleanRoot = cleanRoot.toUpperCase();
            const altNames = { "DB": "C#", "EB": "D#", "GB": "F#", "AB": "G#", "BB": "A#" };
            cleanRoot = altNames[cleanRoot] || cleanRoot;
            let rootIdx = allNotes.indexOf(cleanRoot);
            if (rootIdx === -1) rootIdx = 9; // Default A
            const intervals = isMinor ? [0, 2, 3, 5, 7, 8, 10] : [0, 2, 4, 5, 7, 9, 11];
            return intervals.map(interval => allNotes[(rootIdx + interval) % 12]);
        };

        for (let m = 0; m < section.measures; m++) {
            const measureStartTime = section.startTime + (m * measureDur);
            const currentScale = getStrictScale(progression[m % progression.length] || "A");
            const isTransitionMeasure = (m === section.measures - 1);

            currentPattern.forEach((s, i) => {
                if (isTransitionMeasure && s > 13 && energy > 0.6) return;

                const absoluteTime = measureStartTime + (s * stepTime);
                const nextStep = (i < currentPattern.length - 1) ? currentPattern[i + 1] : 16;
                const noteIdx = currentMelody[i % currentMelody.length];
                const octave = isChorus ? 5 : 4;
                const noteName = normalizeNote(currentScale[noteIdx % 7], "guitarLead") + octave;

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(noteName, (nextStep - s) * stepTime, time);

                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", noteName, section.name);
                    }, time);
                }, absoluteTime);
            });
        }
    }
};

// ─────────────────────────────────────────────
// scheduleLead — Funzione esportata compatibile col metalEngine
// ─────────────────────────────────────────────
//
// - Se NON è solo → usa LeadLegacy (extra assolo originale)
// - Se è solo → usa LeadSoloV4 (nuovo solo completo)
//

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const name = section?.name?.toLowerCase() || "";
    const isSolo = name.includes("solo") || name.includes("bridge");

    // Parametri immagine + BPM (ricavato se non presente)
    const {
        energy = 0.5,
        brightness = 0.5,
        texture = 0.5,
        complexity = 0.5
    } = params?.imageParams || {};

    const bpm =
        params?.imageParams?.bpm ||
        params?.bpm ||
        (60 / (measureDur / 4)); // fallback dal tempo di misura

    if (!isSolo) {
        // Extra assolo (intro/verse/chorus/prechorus) — versione originale
        LeadLegacy.scheduleNonSolo(section, progression, instruments, params, rand, measureDur, score);
    } else {
        // SOLO V4 — nuovo motore completo
        const soloParams = {
            imageParams: { energy, brightness, texture, complexity, bpm }
        };

        LeadSoloV4.generate(section, progression, instruments, soloParams, rand, measureDur, score);
    }
}

