// metalLeadEngine.js — versione ottimizzata con Legacy Solo
import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 76 loaded");

// ============================================================================
// UTILITY
// ============================================================================
const LeadUtils = {
    rand() { return Math.random(); },
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },

    nearestNote(targetMidi, scale) {
        let best = scale[0];
        let bestDist = Math.abs(targetMidi - best);
        for (let n of scale) {
            const d = Math.abs(targetMidi - n);
            if (d < bestDist) { best = n; bestDist = d; }
        }
        return best;
    }
};

// ============================================================================
// SCALE (se servono in futuro, ora non usate direttamente dal solo)
// ============================================================================
const LeadScales = {
    minor(root) { return [0,2,3,5,7,8,10].map(i => root+i); },
    harmonicMinor(root) { return [0,2,3,5,7,8,11].map(i => root+i); },
    dorian(root) { return [0,2,3,5,7,9,10].map(i => root+i); },
    phrygian(root) { return [0,1,3,5,7,8,10].map(i => root+i); },
    pentatonicMinor(root) { return [0,3,5,7,10].map(i => root+i); }
};
// ============================================================================
// NUOVO SOLO LEGACY — SENZA MIDI, COERENTE CON IL LEGACY, SCALE AVANZATE
// ============================================================================
const LeadLegacySolo = {

    scheduleSolo(section, progression, instruments, params, rand, measureDur, score) {
        const { guitarLead } = instruments;
        if (!guitarLead) return;

        const { energy, brightness, complexity, bpm, tonalCenter = "A4" } = params.imageParams;

        // Durata totale della sezione
        const totalTime = section.measures * measureDur;

        // Numero di note (18–60)
        const totalNotes = Math.floor(18 + energy * 35 + complexity * 15);

        // ============================================================
        // SCALE AVANZATE (NOMI DI NOTE, NON MIDI)
        // ============================================================
        const scaleSets = {
            minor: ["A","B","C","D","E","F","G"],
            harmonicMinor: ["A","B","C","D","E","F","G#"],
            dorian: ["A","B","C","D","E","F#","G"],
            phrygian: ["A","Bb","C","D","E","F","G"],
            pentatonic: ["A","C","D","E","G"]
        };

        // Scelta scala intelligente
        let scale;
        if (brightness > 0.6) scale = scaleSets.dorian;
        else if (complexity > 0.6) scale = scaleSets.harmonicMinor;
        else if (brightness < 0.3) scale = scaleSets.phrygian;
        else if (energy < 0.4) scale = scaleSets.pentatonic;
        else scale = scaleSets.minor;

        // ============================================================
        // DISTRIBUZIONE TEMPORALE (accelerazione/decelerazione)
        // ============================================================
        const timing = [];
        let t = 0;

        for (let i = 0; i < totalNotes; i++) {
            const p = i / totalNotes;
            let step;

            if (energy > 0.6) {
                const d = Math.abs(p - 0.5) * 2;
                step = 0.7 + d * 1.8;
            } else {
                step = 1.1 - p * 0.3;
            }

            step *= (0.85 + Math.random() * 0.3);
            timing.push({ relTime: t, step });
            t += step;
        }

        const scaleFactor = totalTime / t;
        for (let x of timing) x.relTime *= scaleFactor;

        // ============================================================
        // FUNZIONE STRICT SCALE (come il Legacy non-solo, locale al solo)
        // ============================================================
        const getStrictScale = (root) => {
            const allNotes = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
            let cleanRoot = root.split('/')[0].replace(/[0-9]/g, '').trim();
            let isMinor = root.includes('m') || (cleanRoot === cleanRoot.toLowerCase() && cleanRoot.length === 1);
            cleanRoot = cleanRoot.toUpperCase();
            const alt = { "DB":"C#", "EB":"D#", "GB":"F#", "AB":"G#", "BB":"A#" };
            cleanRoot = alt[cleanRoot] || cleanRoot;
            let idx = allNotes.indexOf(cleanRoot);
            if (idx === -1) idx = 9;
            const intervals = isMinor ? [0,2,3,5,7,8,10] : [0,2,4,5,7,9,11];
            return intervals.map(i => allNotes[(idx + i) % 12]);
        };

        // ============================================================
        // GENERAZIONE NOTE (SENZA MIDI)
        // ============================================================
        const notes = [];
        const pauseProb = energy < 0.8 ? 0.12 : 0.04;
        let skip = 0;

        for (let i = 0; i < timing.length; i++) {
            const tm = timing[i];

            // Pause
            if (skip === 0 && Math.random() < pauseProb && i > 2 && i < timing.length - 3) {
                skip = 1 + Math.floor(Math.random() * 2);
                continue;
            }
            if (skip > 0) { skip--; continue; }

            // Root corrente
            const timePos = tm.relTime;
            const measurePos = Math.floor(timePos / measureDur);
            const phrasePos = Math.floor(measurePos / 4);
            const rootIndex = phrasePos % progression.length;

            const strictScale = getStrictScale(progression[rootIndex]);

            // Direzione melodica
            const notesPerPhrase = timing.length / progression.length;
            const phraseProgress = (i % notesPerPhrase) / notesPerPhrase;

            // Movimento melodico: indice nella scala avanzata
            let idx = Math.floor(phraseProgress * (scale.length - 1));

            // Variazioni
            if (Math.random() < 0.25) idx += (Math.random() < 0.5 ? 1 : -1);
            idx = Math.max(0, Math.min(scale.length - 1, idx));

            // Pitch avanzato (dorian, harmonic minor, ecc.)
            let pitch = scale[idx];

            // Normalizzazione per il sampler
            pitch = normalizeNote(pitch, "guitarLead");

            // Ottava sicura
            let octave = 4;
            if (energy > 0.6) octave = 5;

            const noteName = pitch + octave;

            // Durata
            let duration = tm.step * scaleFactor * 0.6;
            const endP = i / timing.length;

            if (endP > 0.8) duration *= (1 + (endP - 0.8) * 1.5);
            if (Math.abs(endP - 0.5) < 0.2 && energy > 0.6) duration *= 0.6;

            duration = Math.max(0.08, duration);

            let velocity = 0.45 + phraseProgress * 0.25;
            if (endP > 0.85) velocity *= 1.2;
            if (i === 0) velocity = 0.25;

            notes.push({
                noteName,
                relTime: tm.relTime,
                duration,
                velocity
            });
        }

        // ============================================================
        // PLAYBACK
        // ============================================================
        for (let n of notes) {
            const abs = section.startTime + n.relTime;

            Tone.Transport.schedule(time => {
                guitarLead.triggerAttackRelease(n.noteName, n.duration, time, n.velocity);

                Tone.Draw.schedule(() => {
                    if (score) score.addNote("Lead", n.noteName, section.name);
                }, time);
            }, abs);
        }

        console.log(`🎸 SOLO LEGACY (NO MIDI): ${notes.length} note generate`);
    }
};
// ============================================================================
// LEGACY NON-SOLO (ORIGINALE, NON TOCCATO)
// ============================================================================
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
            if (rootIdx === -1) rootIdx = 9;
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
// ============================================================================
// SCHEDULAZIONE LEAD (SOLO + NON-SOLO)
// ============================================================================
export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const rawName = section?.name;
    const name = String(rawName).toLowerCase();

    console.log("DEBUG SOLO CHECK → raw name:", rawName);
    console.log("DEBUG SOLO CHECK → lower:", name);

    const clean = String(rawName)
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z]/g, "")
        .toLowerCase();

    console.log("DEBUG SOLO CHECK → clean:", clean);

    const isSolo = /(solo|lead|assolo|guitar|bridge)/i.test(clean);

    console.log("DEBUG SOLO CHECK → isSolo:", isSolo);

    const {
        energy = 0.5,
        brightness = 0.5,
        texture = 0.5,
        complexity = 0.5
    } = params?.imageParams || {};

    const bpm =
        params?.imageParams?.bpm ||
        params?.bpm ||
        (60 / (measureDur / 4));

    if (!isSolo) {
        if (leadBus._soloBoostApplied) {
            leadBus.gain.cancelScheduledValues(Tone.now());
            leadBus.gain.rampTo(leadBus._originalGain, 0.25);
            leadBus._soloBoostApplied = false;
        }

        LeadLegacy.scheduleNonSolo(section, progression, instruments, params, rand, measureDur, score);
    } else {
        if (!leadBus._soloBoostApplied) {
            leadBus._originalGain = leadBus.gain.value;
            const boosted = leadBus._originalGain * 2.0;
            leadBus.gain.cancelScheduledValues(Tone.now());
            leadBus.gain.rampTo(boosted, 0.20);
            leadBus._soloBoostApplied = true;
        }

        const soloParams = {
            imageParams: { energy, brightness, texture, complexity, bpm, tonalCenter: params.tonalCenter }
        };

        console.log("🔍 progression prima del solo:", progression);
        console.log("🔍 progression length:", progression?.length);

        LeadLegacySolo.scheduleSolo(section, progression, instruments, soloParams, rand, measureDur, score);
    }
}
