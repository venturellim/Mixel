// metalLeadEngine.js — ver. 089 (Melodic Solo Mode, librerie normali potenziate)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 086.3 loaded");

// ============================================================
// UTILITY
// ============================================================

const LeadUtils = {
    rand() { return Math.random(); },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
};

// ============================================================
// RHYTHM LIBRARY (ORIGINALI + SOLO POTENZIATO)
// ============================================================

const rhythmLibrary = {
    intro: [
        [0,1,2,3,4,8,12],
        [0,4,8,10,11,12,13,14],
        [0,2,3,4,8,10,11,12],
        [0,3,4,7,8,11,12,15],
        [0,1,2,3,4,5,6,7,8]
    ],
    verse: [
        [0,8],
        [0,4,8,12],
        [0,6,8,14],
        [0,4,10],
        [2,6,10,14],
        [0,2,4,8,10,12]
    ],
    prechorus: [
        [0,4,8,12],
        [0,2,4,6,8,10,12,14],
        [0,4,7,11,12],
        [0,8,12,14],
        [0,2,4,8,10,12]
    ],
    chorus: [
        [0,2,4,6,8,10,12,14],
        [0,8,12],
        [0,4,8,12],
        [0,3,8,11],
        [0,6,7,8,14]
    ],

    // SOLO = librerie normali potenziate
    solo: [
        [0,2,4,6,8,10,12,14],       // chorus potenziato
        [0,3,5,7,9,11,13,15],       // variante ritmica
        [0,1,3,5,7,9,11,13],        // più mosso
        [0,4,6,8,10,12,14],         // largo ma melodico
        [0,2,5,7,10,12,14]          // fraseggi naturali
    ]
};

// ============================================================
// MELODIC LIBRARY (ORIGINALI + SOLO POTENZIATO)
// ============================================================

const melodicLibrary = {
    epic: [
        [0,4,7,4,5,4,2,0],
        [0,0,4,4,7,7,4,4],
        [0,4,5,7,0,4,5,7],
        [7,4,0,4,7,4,0,0],
        [0,2,4,7,5,4,2,0],
        [0,7,4,2,0,4,2,0],
        [4,0,4,5,7,5,4,0],
        [0,3,5,0,3,5,7,0]
    ],
    emotional: [
        [0,6,5,4,2,3,2,0],
        [2,3,2,0,4,5,4,2],
        [4,2,0,6,5,4,2,2],
        [0,4,6,7,6,4,2,0],
        [5,4,2,0,5,4,2,0],
        [0,2,4,6,0,2,4,6],
        [4,5,7,4,2,3,2,0],
        [0,0,6,6,5,5,4,4]
    ],
    active: [
        [0,1,2,3,4,5,6,7],
        [0,2,4,2,3,5,7,5],
        [0,2,0,4,0,5,0,7],
        [4,0,5,0,7,0,5,0],
        [0,2,4,5,7,5,4,2],
        [0,3,2,5,4,7,6,0],
        [7,5,4,2,7,5,4,2],
        [0,7,6,7,0,5,4,5]
    ],
    evil: [
        [0,1,0,1,4,3,1,0],
        [0,6,5,0,6,5,1,0],
        [0,1,4,1,0,1,4,1],
        [0,3,4,0,3,4,6,0],
        [1,0,1,0,3,1,0,0],
        [0,1,3,4,6,4,3,1],
        [0,4,3,1,0,1,3,4],
        [6,5,4,3,2,1,0,0]
    ],

    // SOLO = melodie normali potenziate
    solo: [
        [0,2,4,5,7,5,4,2,0],
        [0,3,5,7,8,7,5,3,0],
        [0,2,5,7,9,7,5,2,0],
        [0,4,5,7,8,7,5,4,0],
        [0,2,3,5,7,5,3,2,0]
    ]
};

// ============================================================
// ENHANCER (PASSING TONES + RIPETIZIONI)
// ============================================================

function enhanceMelody(base) {
    const out = [];
    for (let i = 0; i < base.length; i++) {
        const s = base[i];
        out.push(s);

        // Passing tone diatonico (15%)
        if (Math.random() < 0.15) {
            const dir = Math.random() < 0.5 ? -1 : 1;
            const pt = s + dir;
            if (pt >= 0 && pt < 7) out.push(pt);
        }

        // Ripetizione breve (10%)
        if (Math.random() < 0.10) out.push(s);
    }
    return out;
}

function enhancePattern(p) {
    const out = [...p];
    if (p.length < 10) {
        if (Math.random() < 0.5) out.push(p[0] + 1);
        if (Math.random() < 0.3) out.push(p[p.length - 1] - 1);
    }
    return out.sort((a,b)=>a-b);
}

// ============================================================
// SCALE
// ============================================================

function getStrictScale(root) {
    const all = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
    let clean = root.replace(/[0-9]/g,"").toUpperCase();
    const alt = {DB:"C#",EB:"D#",GB:"F#",AB:"G#",BB:"A#"};
    clean = alt[clean] || clean;
    const idx = all.indexOf(clean);
    const intervals = [0,2,3,5,7,8,10];
    return intervals.map(i => all[(idx+i)%12]);
}

// ============================================================
// LEAD ENGINE
// ============================================================

const LeadLegacy = {
    schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score) {
        const { guitarLead } = instruments;
        if (!guitarLead) return;

        const name = section.name.toLowerCase();
        const isSolo = name.includes("solo");
        const isChorus = name.includes("chorus");
        const stepTime = measureDur / 16;

        const { energy, brightness, complexity } = params.imageParams;

        // Mood per l’assolo = come le sezioni normali
        const mood = (() => {
            if (brightness > 0.6) return "epic";
            if (energy < 0.4) return "emotional";
            if (complexity > 0.6) return "active";
            return "epic";
        })();

        for (let m = 0; m < section.measures; m++) {
            const measureStart = section.startTime + m * measureDur;

            // Scala dinamica
            const scale = getStrictScale(progression[m]);

            // Pattern ritmico
            let pattern = isSolo
                ? enhancePattern(LeadUtils.choice(rhythmLibrary.solo))
                : LeadUtils.choice(rhythmLibrary[mood]);

            // Melodia
            let melody = isSolo
                ? enhanceMelody(LeadUtils.choice(melodicLibrary.solo))
                : LeadUtils.choice(melodicLibrary[mood]);

            pattern.forEach((s, i) => {
                const absTime = measureStart + s * stepTime;
                const nextStep = (i < pattern.length - 1) ? pattern[i+1] : 16;
                const idx = melody[i % melody.length];
                const octave = isChorus ? 5 : 4;
                const noteName = normalizeNote(scale[idx % 7], "guitarLead") + octave;

                Tone.Transport.schedule(time => {
                    guitarLead.triggerAttackRelease(
                        noteName,
                        (nextStep - s) * stepTime,
                        time
                    );
                    Tone.Draw.schedule(()=>score?.addNote("Lead",noteName,section.name),time);
                }, absTime);
            });
        }
    }
};

// ============================================================
// EXPORT
// ============================================================

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const tonalCenter = params.tonalCenter || params.imageParams.tonalCenter || "A4";
    const rootNote = tonalCenter.replace(/[0-9]/g,"");
    const isMinor = params.scaleType?.includes("minor") ?? true;

    LeadLegacy.schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, params.scaleType, score);
}
