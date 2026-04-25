// metalLeadEngine.js — ver. 073 (Solo Direction Engine)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 075 loaded");

// Utility

const LeadUtils = {
    rand() { return Math.random(); },
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); },

    distributeTimes(start, end, count) {
        const step = (end - start) / count;
        return Array.from({ length: count }, (_, i) => start + i * step);
    },

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

// Scale

const LeadScales = {
    major(root) { return [0,2,4,5,7,9,11].map(i => root+i); },
    minor(root) { return [0,2,3,5,7,8,10].map(i => root+i); },
    harmonicMinor(root) { return [0,2,3,5,7,8,11].map(i => root+i); },
    dorian(root) { return [0,2,3,5,7,9,10].map(i => root+i); },
    pentatonicMinor(root) { return [0,3,5,7,10].map(i => root+i); },
    phrygian(root) { return [0,1,3,5,7,8,10].map(i => root+i); },
    diminished(root) { return [0,2,3,5,6,8,9,11].map(i => root+i); },
    wholeTone(root) { return [0,2,4,6,8,10].map(i => root+i); }
};

// Pattern

const LeadPatterns = {
    melodicTheme: [
        [0,2,4,5,4,2,0],
        [0,2,5,4,2,0],
        [0,4,5,7,5,4,2]
    ],
    lyricalBreak: [
        [0,2,3,2,0],
        [0,3,5,3,0],
        [0,2,0,-2,0]
    ],
    terzine: [
        [0,2,4],
        [2,4,5],
        [4,5,7]
    ],
    shredRun: [
        [0,2,3,5,7,8,11],
        [0,2,3,5,7,9,11],
        [0,1,3,5,7,8,10]
    ],
    sweep: [
        [0,4,7,12],
        [0,3,7,12],
        [0,4,8,12]
    ],
    tapping: [
        [0,7,12,7],
        [0,5,12,5],
        [0,8,12,8]
    ],
    diminished: [
        [0,2,3,5,6,8,9,11],
        [0,3,6,9],
        [0,2,5,8]
    ],
    finalBurst: [
        [0,2,4,5,7,9,11,12],
        [0,3,5,7,10,12],
        [0,2,5,7,9,12]
    ]
};

// Floyd Rose

const LeadFloyd = {
    apply(guitarLead, time, type="scoop") {
        if (!guitarLead || !guitarLead.playbackRate) return;
        const pr = guitarLead.playbackRate;

        if (type==="scoop") {
            pr.setValueAtTime(0.95, time);
            pr.linearRampToValueAtTime(1.0, time+0.12);
        } else if (type==="dive") {
            pr.setValueAtTime(1.0, time);
            pr.exponentialRampToValueAtTime(0.7, time+0.18);
            pr.linearRampToValueAtTime(1.0, time+0.32);
        } else if (type==="rise") {
            pr.setValueAtTime(0.9, time);
            pr.linearRampToValueAtTime(1.05, time+0.25);
            pr.linearRampToValueAtTime(1.0, time+0.35);
        } else if (type==="vibrato") {
            for (let i=0;i<6;i++){
                const t = time + i*0.04;
                const val = i%2===0 ? 0.98 : 1.02;
                pr.setValueAtTime(val, t);
            }
            pr.setValueAtTime(1.0, time+0.25);
        }
    }
};

// Phrase generator

const LeadPhraseGen = {
    expandPattern(pattern, scale, desiredLength) {
        const notes=[];
        while (notes.length<desiredLength){
            for (let step of pattern){
                const idx=(step%scale.length+scale.length)%scale.length;
                notes.push(scale[idx]);
                if (notes.length>=desiredLength) break;
            }
        }
        return notes;
    },

    buildPhrase(pattern, scale, phraseTime, maxNPS) {
        const maxNotes = Math.floor(phraseTime * maxNPS);
        const desired = LeadUtils.clamp(maxNotes, 10, 28);

        const notes = this.expandPattern(pattern, scale, desired);

        const times=[];
        let t=0;

        for (let i=0;i<notes.length;i++){
            const progress=i/notes.length;
            let step;

            if (progress<0.25) step=0.04+(0.12*progress);
            else if (progress<0.75) step=0.08;
            else step=0.12+(0.12*(progress-0.75));

            t+=step;
            times.push(t);
        }

        const scaleFactor = phraseTime/t;
        const finalTimes = times.map(x=>x*scaleFactor);

        return notes.map((n,i)=>({ midi:n, relTime:finalTimes[i] }));
    }
};

// Timing

const LeadTiming = {
    computeTotalSoloTime(measures, measureDur) {
        return measures * measureDur;
    },

    computePhraseCount(totalTime, energy) {
        let count = energy>0.7 ? 5 : energy>0.4 ? 4 : 3;
        const minPhraseTime = 2.8;
        while (count*minPhraseTime > totalTime) count--;
        return Math.max(2, count);
    },

    computePhraseTime(totalTime, phraseCount) {
        return totalTime / phraseCount;
    },

    filterSectionsByBPM(sections, bpm) {
        return sections.filter(sec=>{
            if (bpm>150 && sec.type==="lyrical") return false;
            if (bpm<110 && sec.type==="shred") return false;
            return true;
        });
    }
};

// Theme

const LeadTheme = {
    pickTheme(brightness, complexity, bpm) {
        if (brightness>0.6) return LeadPatterns.melodicTheme[LeadUtils.randInt(0,2)];
        if (complexity>0.6) return LeadPatterns.lyricalBreak[LeadUtils.randInt(0,2)];
        if (bpm>150) return LeadPatterns.terzine[LeadUtils.randInt(0,2)];
        return LeadPatterns.melodicTheme[0];
    }
};

// Sections

const LeadSections = [
    { type:"melodic", patternSet:"melodicTheme", scale:"major" },
    { type:"lyrical", patternSet:"lyricalBreak", scale:"pentatonicMinor" },
    { type:"terzine", patternSet:"terzine", scale:"minor" },
    { type:"shred", patternSet:"shredRun", scale:"harmonicMinor" },
    { type:"sweep", patternSet:"sweep", scale:"major" },
    { type:"tapping", patternSet:"tapping", scale:"phrygian" },
    { type:"diminished", patternSet:"diminished", scale:"diminished" },
    { type:"finalBurst", patternSet:"finalBurst", scale:"major" }
];

// Density

const LeadDensity = {
    computeMaxNotesPerSecond(energy, complexity, bpm) {
        let base=4;
        if (energy>0.6) base+=1.5;
        if (complexity>0.6) base+=1.5;
        if (bpm>150) base+=1;
        return Math.min(8, base);
    }
};

// Solo V6.1 — Simple & Robust con accelerazioni, decelerazioni e pause

const LeadSolo = {
    generate(section, progression, instruments, params, rand, measureDur, score) {
        console.log("🎸 SOLO V6.1 ATTIVATO su sezione:", section.name);
        const { guitarLead } = instruments;
        if (!guitarLead) return;

        const { energy, brightness, complexity, bpm, tonalCenter = "A4" } = params.imageParams;
        
        // Parametri base
        const totalTime = section.measures * measureDur;
        const isFastBPM = bpm > 140;
        
        // Numero di note totali (da 18 a 60 circa)
        let totalNotes = Math.floor(18 + (energy * 35) + (complexity * 15));
        
        // ============================================================
        // DISTRIBUZIONE TEMPORALE CON ACCELERAZIONE/DECELERAZIONE
        // ============================================================
        const timingDistribution = [];
        let timePos = 0;
        
        for (let i = 0; i < totalNotes; i++) {
            const progress = i / totalNotes;
            let step;
            
            // Più note verso il centro (climax) se energia alta
            if (energy > 0.6) {
                const centerDist = Math.abs(progress - 0.5) * 2;
                step = 0.7 + (centerDist * 1.8);
            } else {
                // Leggera accelerazione verso la fine
                step = 1.1 - (progress * 0.3);
            }
            
            // Variazione casuale
            step *= (0.85 + Math.random() * 0.3);
            
            timingDistribution.push({
                relTime: timePos,
                step: step
            });
            timePos += step;
        }
        
        // Normalizza alla durata totale
        const timeScale = totalTime / timePos;
        for (let t of timingDistribution) {
            t.relTime *= timeScale;
        }
        
        // ============================================================
        // CALCOLO ROOT MIDI DALLA PROGRESSIONE
        // ============================================================
        let rootMidi;
        try { rootMidi = Tone.Frequency(tonalCenter).toMidi(); }
        catch { rootMidi = 69; }
        
        const chordRootsMidi = progression.map(root => {
            let clean = root.replace(/[^A-G#b]/g, "");
            if (!clean) clean = tonalCenter.replace(/[0-9]/g, "");
            try { return Tone.Frequency(clean + "4").toMidi(); }
            catch { return rootMidi; }
        });
        
        // ============================================================
        // COSTRUZIONE SCALA ESTESA
        // ============================================================
        const scaleType = complexity > 0.6 ? "harmonicMinor" : "minor";
        const scaleFn = LeadScales[scaleType] || LeadScales.minor;
        const baseScale = scaleFn(rootMidi);
        
        const fullScale = [];
        for (let oct = -1; oct <= 2; oct++) {
            for (let note of baseScale) {
                fullScale.push(note + (oct * 12));
            }
        }
        fullScale.sort((a, b) => a - b);
        
        // ============================================================
        // GENERAZIONE NOTE CON PAUSE
        // ============================================================
        const notes = [];
        const pauseProbability = energy < 0.8 ? 0.12 : 0.04;
        let skipCounter = 0;
        
        for (let i = 0; i < timingDistribution.length; i++) {
            const timing = timingDistribution[i];
            
            // PAUSA
            if (skipCounter === 0 && Math.random() < pauseProbability && i > 2 && i < timingDistribution.length - 3) {
                skipCounter = 1 + Math.floor(Math.random() * 2);
                continue;
            }
            
            if (skipCounter > 0) {
                skipCounter--;
                continue;
            }
            
            // Determina la root corrente in base al tempo
            const timePos = timing.relTime;
            const measurePos = Math.floor(timePos / measureDur);
            const phrasePos = Math.floor(measurePos / 4);
            const rootIndex = phrasePos % chordRootsMidi.length;
            const targetRoot = chordRootsMidi[rootIndex];
            const nextRoot = chordRootsMidi[(rootIndex + 1) % chordRootsMidi.length];
            
            // Direzione
            const direction = nextRoot > targetRoot ? 1 : (nextRoot < targetRoot ? -1 : 0);
            
            // Progresso nella frase
            const notesPerPhrase = timingDistribution.length / chordRootsMidi.length;
            const phraseProgress = (i % notesPerPhrase) / notesPerPhrase;
            
            // Nota target (interpolazione lineare tra root corrente e prossima)
            let targetNote;
            if (direction === 1) {
                targetNote = targetRoot + (phraseProgress * Math.abs(nextRoot - targetRoot));
            } else if (direction === -1) {
                targetNote = targetRoot - (phraseProgress * Math.abs(nextRoot - targetRoot));
            } else {
                targetNote = targetRoot;
            }
            
            // Trova la nota più vicina nella scala
            let bestNote = fullScale[0];
            let bestDist = Math.abs(fullScale[0] - targetNote);
            for (let n of fullScale) {
                const dist = Math.abs(n - targetNote);
                if (dist < bestDist) {
                    bestDist = dist;
                    bestNote = n;
                }
            }
            
            // Variazione melodica casuale
            if (Math.random() < 0.25) {
                const variation = (Math.random() - 0.5) * 2;
                const idx = fullScale.indexOf(bestNote);
                const newIdx = Math.min(Math.max(idx + Math.round(variation), 0), fullScale.length - 1);
                bestNote = fullScale[newIdx];
            }
            
            // Evita note ripetute
            if (notes.length > 0 && notes[notes.length - 1].midi === bestNote && Math.random() < 0.5) {
                continue;
            }
            
            // Durata e velocità
            let duration = timing.step * timeScale * 0.6;
            const endProgress = i / timingDistribution.length;
            
            if (endProgress > 0.8) duration *= (1 + (endProgress - 0.8) * 1.5);
            if (Math.abs(endProgress - 0.5) < 0.2 && energy > 0.6) duration *= 0.6;
            duration = Math.min(duration, timeScale * 1.2);
            
            let velocity = 0.45 + phraseProgress * 0.25;
            if (endProgress > 0.85) velocity *= 1.2;
            if (i === 0) velocity = 0.25;
            
            notes.push({
                midi: bestNote,
                relTime: timing.relTime,
                duration: Math.max(0.08, duration),
                velocity: Math.min(0.85, velocity)
            });
        }
        
        // ============================================================
        // SCHEDULAZIONE (semplice e diretta)
        // ============================================================
        console.log(`📊 SOLO V6.1: ${notes.length} note in ${totalTime.toFixed(1)}s`);
        
        for (let note of notes) {
            const absTime = section.startTime + note.relTime;
            
            Tone.Transport.schedule(time => {
                const noteName = Tone.Frequency(note.midi, "midi").toNote();
                guitarLead.triggerAttackRelease(noteName, note.duration, time, note.velocity);
                
                if (Math.random() < 0.12 && isFastBPM) {
                    LeadFloyd.apply(guitarLead, time, "vibrato");
                }
                
                Tone.Draw.schedule(() => {
                    if (score) score.addNote("Lead", noteName, section.name);
                }, time);
            }, absTime);
        }
        
        console.log(`✅ SOLO V6.1 completato: ${notes.length} note schedulate`);
    }
};

//legacy (non-solo) — originale

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

// scheduleLead

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const rawName = section?.name;
const name = String(rawName).toLowerCase();

console.log("DEBUG SOLO CHECK → raw name:", rawName);
console.log("DEBUG SOLO CHECK → lower:", name);

// Normalizzazione robusta
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
        LeadSolo.generate(section, progression, instruments, soloParams, rand, measureDur, score);
    }
}
