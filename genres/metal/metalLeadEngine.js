// metalLeadEngine.js — ver. 073 (Solo Direction Engine)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 074.1 loaded");

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

// Solo V5 — Direction & Continuity Engine (basato su root1, root2, root3)

const LeadSolo = {
    generate(section, progression, instruments, params, rand, measureDur, score) {
        console.log("🔥 SOLO V5 ATTIVATO su sezione:", section.name);
        console.log("🔍 progression ricevuta:", progression);
        
        const { guitarLead } = instruments;
        if (!guitarLead) return;

        // ============================================================
        // FALLBACK: se progression è vuota, crea una progressione di default
        // ============================================================
        let validProgression = progression;
        if (!progression || progression.length === 0) {
            console.warn("⚠️ progressione vuota! Uso fallback: ['i', 'iv', 'v', 'i']");
            validProgression = ["i", "iv", "v", "i"];
        }

        const { energy, brightness, complexity, bpm, tonalCenter = "A4" } = params.imageParams;

        const totalTime = section.measures * measureDur;
        
        // Numero di frasi in base all'energia
        let phraseCount = energy > 0.7 ? 4 : energy > 0.4 ? 3 : 2;
        phraseCount = Math.min(phraseCount, Math.floor(totalTime / 2.5));
        if (phraseCount < 1) phraseCount = 2; // minimo 2 frasi
        
        const phraseTime = totalTime / phraseCount;
        
        // Root MIDI
        let rootMidi;
        try { rootMidi = Tone.Frequency(tonalCenter).toMidi(); }
        catch { rootMidi = 69; }
        
        // Calcola le root in MIDI usando la progressione validata
        const chordRootsMidi = validProgression.map(root => {
            let clean = root.replace(/[^A-G#b]/g, "");
            if (!clean) clean = tonalCenter.replace(/[0-9]/g, "");
            try { 
                const freq = Tone.Frequency(clean + "4");
                return freq.toMidi();
            }
            catch { 
                return rootMidi; 
            }
        });
        
        console.log("🔍 chordRootsMidi calcolate:", chordRootsMidi);
        
        // Se ancora vuoto, usa rootMidi come default
        if (chordRootsMidi.length === 0) {
            chordRootsMidi.push(rootMidi);
        }      
        
        // Tracciamento dello stato per il solo
        let lastNoteMidi = null;
        let sustainUsed = false;
        let root4Used = false;
        
        // Collezione delle frasi
        let phrases = [];
        let cursor = section.startTime;
        
        // Determina velocità delle note in base al BPM
        const isHighBPM = bpm >= 140;
        const noteDuration = isHighBPM ? 0.12 : 0.18;
        
        for (let i = 0; i < phraseCount; i++) {
            // Root della frase corrente (root1)
            const root1 = chordRootsMidi[i % chordRootsMidi.length];
            // Root della prossima frase (root2)
            const root2 = chordRootsMidi[(i + 1) % chordRootsMidi.length];
            // Root della dopo prossima (root3)
            const root3 = chordRootsMidi[(i + 2) % chordRootsMidi.length];
            
            // Calcola direzioni
            const dir1to2 = root2 > root1 ? "up" : (root2 < root1 ? "down" : "flat");
            const dir2to3 = root3 > root2 ? "up" : (root3 < root2 ? "down" : "flat");
            const sameDirection = (dir1to2 === dir2to3 && dir1to2 !== "flat");
            
            // Distanza tra le root
            const distance12 = Math.abs(root2 - root1);
            const distance23 = Math.abs(root3 - root2);
            const isConsecutive12 = distance12 <= 2;
            const isConsecutive23 = distance23 <= 2;
            
            // Scegli la scala in base alla root1
            const scaleType = complexity > 0.6 ? "harmonicMinor" : "minor";
            const scaleFn = LeadScales[scaleType] || LeadScales.minor;
            let scale = scaleFn(root1);
            
            // Determina il pattern in base all'energia e brightness
            let pattern;
            if (energy > 0.7) pattern = LeadPatterns.shredRun[0];
            else if (brightness > 0.6) pattern = LeadPatterns.melodicTheme[0];
            else pattern = LeadPatterns.lyricalBreak[0];
            
            // ============================================================
            // LOGICA DI DIREZIONE E CONTINUITÀ
            // ============================================================
            
            let phraseNotes = [];
            let specialMode = null;
            
            // ──────────────────────────────────────────────────────────
            // OPZIONE 1: SUSTAIN (se root consecutive, BPM alto, una volta per semi-sezione)
            // ──────────────────────────────────────────────────────────
            if (!sustainUsed && isHighBPM && isConsecutive12 && energy > 0.5 && LeadUtils.rand() < 0.3) {
                specialMode = "sustain";
                sustainUsed = true;
                phraseNotes.push({
                    midi: root1,
                    relTime: 0,
                    sustain: phraseTime * 0.9,
                    duration: phraseTime * 0.9
                });
            }
            
            // ──────────────────────────────────────────────────────────
            // OPZIONE 2: ROOT × 4 (cambio semi-sezione, root consecutive, BPM alto)
            // ──────────────────────────────────────────────────────────
            else if (!root4Used && i === Math.floor(phraseCount / 2) && isHighBPM && isConsecutive12 && LeadUtils.rand() < 0.4) {
                specialMode = "root4";
                root4Used = true;
                const hits = 4;
                const step = phraseTime / (hits + 1);
                for (let h = 0; h < hits; h++) {
                    phraseNotes.push({
                        midi: root1,
                        relTime: h * step,
                        sustain: step * 0.7,
                        duration: step * 0.7
                    });
                }
            }
            
            // ──────────────────────────────────────────────────────────
            // OPZIONE 3: SCALA CON DIREZIONE (la più importante!)
            // ──────────────────────────────────────────────────────────
            else {
                // Trova la nota più vicina a root2 all'interno della scala di root1
                const targetNote = LeadUtils.nearestNote(root2, scale);
                const targetIndex = scale.indexOf(targetNote);
                
                // Determina la direzione della scala in base a root2
                let scaleDirection = dir1to2;
                
                // Se abbiamo root3, possiamo prevedere la direzione
                if (distance23 <= 3 && sameDirection) {
                    // Stessa direzione → scala continua fino a nota prima di root2
                    scaleDirection = dir1to2;
                } else if (distance23 <= 3 && !sameDirection) {
                    // Direzioni opposte → arriviamo a root2 e poi invertiamo
                    scaleDirection = dir1to2;
                }
                
                // Trova l'indice di partenza (nota più vicina a lastNoteMidi o root1)
                let startIndex = 0;
                if (lastNoteMidi !== null) {
                    const nearestStart = LeadUtils.nearestNote(lastNoteMidi, scale);
                    startIndex = scale.indexOf(nearestStart);
                    if (startIndex === -1) startIndex = 0;
                } else {
                    startIndex = scale.indexOf(root1);
                    if (startIndex === -1) startIndex = 0;
                }
                
                // Determina quanti step fare (fino a targetIndex o fino alla fine)
                let steps = [];
                
                if (scaleDirection === "up") {
                    // Scala ascendente
                    for (let s = startIndex; s <= targetIndex && s < scale.length; s++) {
                        steps.push(scale[s]);
                    }
                    // Opzione: continuare oltre root2 se stessa direzione (30% probabilità)
                    if (sameDirection && LeadUtils.rand() < 0.3 && targetIndex + 2 < scale.length) {
                        steps.push(scale[targetIndex + 1]);
                        steps.push(scale[targetIndex + 2]);
                    }
                } else if (scaleDirection === "down") {
                    // Scala discendente
                    for (let s = startIndex; s >= targetIndex && s >= 0; s--) {
                        steps.push(scale[s]);
                    }
                    // Opzione: continuare oltre root2 se stessa direzione
                    if (sameDirection && LeadUtils.rand() < 0.3 && targetIndex - 2 >= 0) {
                        steps.push(scale[targetIndex - 1]);
                        steps.push(scale[targetIndex - 2]);
                    }
                } else {
                    // flat → nota singola
                    steps = [root1];
                }
                
                // Se le note sono consecutive e direzioni opposte, possiamo fare salita+discesa
                if (isConsecutive12 && !sameDirection && LeadUtils.rand() < 0.5 && steps.length > 2) {
                    // Scala: sali fino a root2, poi scendi
                    const upSteps = [];
                    const downSteps = [];
                    for (let s = startIndex; s <= targetIndex && s < scale.length; s++) {
                        upSteps.push(scale[s]);
                    }
                    for (let s = targetIndex - 1; s >= startIndex && s >= 0; s--) {
                        downSteps.push(scale[s]);
                    }
                    steps = [...upSteps, ...downSteps];
                }
                
                if (steps.length === 0) steps = [root1];
                
                // Distribuisci le note nel tempo
                const stepTime = phraseTime / steps.length;
                
                for (let stepIdx = 0; stepIdx < steps.length; stepIdx++) {
                    const isLast = (stepIdx === steps.length - 1);
                    phraseNotes.push({
                        midi: steps[stepIdx],
                        relTime: stepIdx * stepTime,
                        duration: isLast ? noteDuration * 1.5 : noteDuration,
                        sustain: isLast ? noteDuration * 1.5 : noteDuration
                    });
                }
                
                // Salva l'ultima nota per la continuità
                lastNoteMidi = steps[steps.length - 1];
            }
            
            // Aggiungi la frase alla collezione
            phrases.push({
                phrase: phraseNotes,
                chordMidi: root1,
                nextChordMidi: root2
            });
        }
        
        // ============================================================
        // SCHEDULAZIONE DELLE FRASI
        // ============================================================
        
        let cursorTime = section.startTime;
        
        for (let pIndex = 0; pIndex < phrases.length; pIndex++) {
            const p = phrases[pIndex];
            
            for (let noteObj of p.phrase) {
                const absTime = cursorTime + noteObj.relTime;
                const duration = noteObj.duration || 0.18;
                
                Tone.Transport.schedule(time => {
                    const noteName = Tone.Frequency(noteObj.midi, "midi").toNote();
                    guitarLead.triggerAttackRelease(noteName, duration, time, 0.7);
                    
                    // Effetto Floyd Rose occasionale
                    if (LeadUtils.rand() < 0.15) {
                        LeadFloyd.apply(guitarLead, time, "vibrato");
                    }
                    
                    Tone.Draw.schedule(() => {
                        if (score) score.addNote("Lead", noteName, section.name);
                    }, time);
                }, absTime);
            }
            
            cursorTime += phraseTime;
        }
        
        console.log(`✅ SOLO V5 completato: ${phrases.length} frasi, durata totale ${totalTime.toFixed(2)}s`);
    }
};

// Aggiorna il riferimento in scheduleLead
// Sostituisci la chiamata a LeadSoloV4 con LeadSoloV5:
// LeadSoloV5.generate(section, progression, instruments, soloParams, rand, measureDur, score);

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
