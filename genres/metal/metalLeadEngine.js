// metalLeadEngine.js — versione ottimizzata con Legacy Solo
import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 76.1 loaded");

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
// NUOVO SOLO LEGACY — COERENTE, MUSICALE, DINAMICO, SENZA MIDI
// ============================================================================
const LeadLegacySolo = {

    scheduleSolo(section, progression, instruments, params, rand, measureDur, score) {
        const { guitarLead } = instruments;
        if (!guitarLead) return;

        const { energy, brightness, complexity, bpm } = params.imageParams;

        // ====================================================================
        // 1) DENSITÀ DINAMICA BASATA SUI BPM
        // ====================================================================
        let densityMode;
        if (bpm > 165) densityMode = "low";        // pochi step → più melodico
        else if (bpm > 120) densityMode = "medium"; // densità equilibrata
        else densityMode = "high";                 // molte note → frasi lunghe

        let notesPerBeat;
        if (densityMode === "low") notesPerBeat = 1.2;
        if (densityMode === "medium") notesPerBeat = 2.4;
        if (densityMode === "high") notesPerBeat = 4.0;

        const beatsInSection = section.measures * 4;
        const totalNotes = Math.floor(notesPerBeat * beatsInSection);

        // ====================================================================
        // 2) SCALE AVANZATE (nomi di note, non MIDI)
        // ====================================================================
        const scaleSets = {
            minor: ["A","B","C","D","E","F","G"],
            harmonicMinor: ["A","B","C","D","E","F","G#"],
            dorian: ["A","B","C","D","E","F#","G"],
            phrygian: ["A","Bb","C","D","E","F","G"],
            pentatonic: ["A","C","D","E","G"]
        };

        let scale;
        if (brightness > 0.6) scale = scaleSets.dorian;
        else if (complexity > 0.6) scale = scaleSets.harmonicMinor;
        else if (brightness < 0.3) scale = scaleSets.phrygian;
        else if (energy < 0.4) scale = scaleSets.pentatonic;
        else scale = scaleSets.minor;

        // ====================================================================
        // 3) STRICT SCALE (come il Legacy non-solo)
        // ====================================================================
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

        // ====================================================================
        // 4) GENERAZIONE NOTE (NO MIDI, COERENTE CON LEGACY)
        // ====================================================================
        const notes = [];

        for (let i = 0; i < totalNotes; i++) {

            // Tempo relativo
            const relTime = (i / totalNotes) * (section.measures * measureDur);

            // Misura corrente
            const measurePos = Math.floor(relTime / measureDur);
            const rootIndex = measurePos % progression.length;

            // Strict scale della misura
            const strictScale = getStrictScale(progression[rootIndex]);

            // Direzione melodica
            const phraseProgress = (i % (totalNotes / progression.length)) / (totalNotes / progression.length);

            // Indice nella scala avanzata
            let idx = Math.floor(phraseProgress * (scale.length - 1));

            // Variazioni
            if (Math.random() < 0.25) idx += (Math.random() < 0.5 ? 1 : -1);
            idx = Math.max(0, Math.min(scale.length - 1, idx));

            // Pitch avanzato
            let pitch = scale[idx];

            // Normalizzazione per il sampler
            pitch = normalizeNote(pitch, "guitarLead");

            // Ottava sicura
            let octave = 4;
            if (energy > 0.6) octave = 5;

            const noteName = pitch + octave;

            // Durata dinamica
            let duration = (measureDur / 4) / notesPerBeat;
            duration *= (0.8 + Math.random() * 0.4);
            duration = Math.max(0.08, duration);

            // Velocity dinamica
            let velocity = 0.45 + phraseProgress * 0.25;
            if (i === 0) velocity = 0.25;

            notes.push({
                noteName,
                relTime,
                duration,
                velocity
            });
        }

        // ====================================================================
        // 5) PLAYBACK
        // ====================================================================
        for (let n of notes) {
            const abs = section.startTime + n.relTime;

            Tone.Transport.schedule(time => {
                guitarLead.triggerAttackRelease(n.noteName, n.duration, time, n.velocity);

                Tone.Draw.schedule(() => {
                    if (score) score.addNote("Lead", n.noteName, section.name);
                }, time);
            }, abs);
        }

        console.log(`🎸 SOLO LEGACY DINAMICO: ${notes.length} note generate (mode: ${densityMode})`);
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
