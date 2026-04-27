// metalLeadEngine.js — ver. 084 FINAL (Solo unificato, sezioni normali IDENTICHE)

import * as Tone from "https://esm.sh/tone";
import { normalizeNote, leadBus } from "./metalInstruments.js";

console.log("metalLeadEngine.js ver. 084.1 loaded");

// ============================================================
// UTILITY
// ============================================================

const LeadUtils = {
    rand() { return Math.random(); },
    randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
    choice(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
    clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
};

// ============================================================
// FLOYD ROSE (effetti chitarra)
// ============================================================

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

// ============================================================
// LIBRARY (sezioni normali + assolo) - INVARIATA
// ============================================================

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
    ],
    // LIBRARY RITMICHE PER L'ASSOLO
    solo_epic: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16],
        [0, 2, 4, 6, 8, 10, 12, 14, 16, 14, 12, 10, 8, 6, 4, 2, 0],
        [0, 1, 3, 5, 7, 9, 11, 13, 15, 13, 11, 9, 7, 5, 3, 1, 0],
        [0, 3, 6, 9, 12, 15, 12, 9, 6, 3, 0, 3, 6, 9, 12, 15, 12, 9, 6, 3, 0]
    ],
    solo_shred: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        [0, 2, 3, 5, 6, 8, 9, 11, 12, 14, 15, 17, 18, 20, 21, 23, 21, 20, 18, 17, 15, 14, 12, 11, 9, 8, 6, 5, 3, 2, 0],
        [0, 1, 3, 4, 6, 7, 9, 10, 12, 13, 15, 16, 18, 19, 21, 22, 21, 19, 18, 16, 15, 13, 12, 10, 9, 7, 6, 4, 3, 1, 0],
        [0, 2, 4, 5, 7, 8, 10, 11, 12, 13, 15, 16, 18, 19, 21, 22, 24, 22, 21, 19, 18, 16, 15, 13, 12, 11, 10, 8, 7, 5, 4, 2, 0]
    ],
    solo_romantic: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2, 0],
        [0, 3, 5, 7, 9, 10, 12, 10, 9, 7, 5, 3, 0, 3, 5, 7, 9, 10, 12, 10, 9, 7, 5, 3, 0],
        [0, 4, 7, 8, 10, 12, 14, 12, 10, 8, 7, 4, 0, 4, 7, 8, 10, 12, 14, 12, 10, 8, 7, 4, 0]
    ],
    solo_evil: [
        [0, 1, 3, 4, 6, 8, 10, 11, 12, 11, 10, 8, 6, 4, 3, 1, 0],
        [0, 1, 4, 6, 8, 10, 12, 10, 8, 6, 4, 1, 0, 1, 4, 6, 8, 10, 12, 10, 8, 6, 4, 1, 0],
        [0, 3, 4, 6, 8, 10, 12, 13, 12, 10, 8, 6, 4, 3, 0],
        [0, 1, 3, 5, 6, 8, 10, 12, 13, 12, 10, 8, 6, 5, 3, 1, 0]
    ],
    solo_tapping: [
        [0, 12, 0, 12, 7, 12, 7, 12, 5, 12, 5, 12, 0, 12, 0],
        [0, 12, 5, 12, 5, 12, 7, 12, 7, 12, 0, 12, 0, 12, 5, 12, 5, 12, 7, 12, 7, 12, 0],
        [0, 12, 8, 12, 8, 12, 5, 12, 5, 12, 7, 12, 7, 12, 0],
        [0, 12, 7, 14, 7, 12, 5, 12, 5, 14, 5, 12, 0, 12, 7, 14, 7, 12, 5, 12, 5, 14, 5, 12, 0]
    ],
    solo_sweep: [
        [0, 3, 7, 12, 7, 3, 0, 3, 7, 12, 7, 3, 0],
        [0, 2, 7, 12, 7, 2, 0, 2, 7, 12, 7, 2, 0],
        [0, 3, 7, 12, 15, 12, 7, 3, 0, 3, 7, 12, 15, 12, 7, 3, 0],
        [0, 4, 7, 12, 16, 12, 7, 4, 0, 4, 7, 12, 16, 12, 7, 4, 0]
    ],
    solo_power: [
        [0, 7, 12, 14, 12, 7, 0, 7, 12, 14, 12, 7, 0],
        [0, 5, 12, 14, 12, 5, 0, 5, 12, 14, 12, 5, 0],
        [0, 7, 12, 19, 12, 7, 0, 7, 12, 19, 12, 7, 0],
        [0, 5, 12, 19, 12, 5, 0, 5, 12, 19, 12, 5, 0]
    ],
    solo_neoclassical: [
        [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1, 0],
        [0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 14, 12, 10, 8, 7, 5, 3, 2, 0, 2, 3, 5, 7, 8, 10, 12, 14, 15, 14, 12, 10, 8, 7, 5, 3, 2, 0],
        [0, 1, 3, 5, 6, 8, 10, 12, 13, 15, 13, 12, 10, 8, 6, 5, 3, 1, 0],
        [0, 3, 5, 7, 8, 11, 12, 14, 15, 17, 15, 14, 12, 11, 8, 7, 5, 3, 0]
    ],
    solo_modern: [
        [0, 3, 5, 8, 10, 13, 15, 13, 10, 8, 5, 3, 0, 3, 5, 8, 10, 13, 15, 13, 10, 8, 5, 3, 0],
        [0, 2, 5, 7, 9, 12, 14, 12, 9, 7, 5, 2, 0, 2, 5, 7, 9, 12, 14, 12, 9, 7, 5, 2, 0],
        [0, 4, 6, 9, 11, 14, 16, 14, 11, 9, 6, 4, 0, 4, 6, 9, 11, 14, 16, 14, 11, 9, 6, 4, 0],
        [0, 3, 6, 8, 11, 13, 16, 13, 11, 8, 6, 3, 0]
    ],
    solo_bluesy: [
        [0, 3, 5, 6, 7, 10, 12, 10, 7, 6, 5, 3, 0, 3, 5, 6, 7, 10, 12, 10, 7, 6, 5, 3, 0],
        [0, 3, 5, 7, 10, 12, 14, 12, 10, 7, 5, 3, 0, 3, 5, 7, 10, 12, 14, 12, 10, 7, 5, 3, 0],
        [0, 4, 5, 7, 10, 12, 15, 12, 10, 7, 5, 4, 0, 4, 5, 7, 10, 12, 15, 12, 10, 7, 5, 4, 0],
        [0, 3, 5, 6, 7, 6, 5, 3, 5, 6, 7, 10, 12, 10, 7, 6, 5, 3, 0]
    ]
};

// ============================================================
// MELODIC LIBRARY (sezioni normali + assolo) - INVARIATA
// ============================================================

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
    ],
    // MELODIC LIBRARY PER L'ASSOLO (normali)
    solo_epic: [
        [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2, 0],
        [0, 3, 5, 7, 9, 10, 12, 14, 12, 10, 9, 7, 5, 3, 0],
        [0, 2, 5, 7, 8, 10, 12, 14, 15, 14, 12, 10, 8, 7, 5, 2, 0],
        [0, 4, 7, 8, 10, 12, 14, 16, 14, 12, 10, 8, 7, 4, 0]
    ],
    solo_shred: [
        [0, 2, 3, 5, 7, 8, 10, 12, 10, 8, 7, 5, 3, 2, 0, 2, 3, 5, 7, 8, 10, 12],
        [0, 1, 3, 5, 6, 8, 10, 12, 10, 8, 6, 5, 3, 1, 0, 1, 3, 5, 6, 8, 10, 12],
        [0, 2, 4, 5, 7, 9, 10, 12, 14, 12, 10, 9, 7, 5, 4, 2, 0, 2, 4, 5, 7, 9, 10, 12],
        [0, 3, 4, 5, 7, 8, 10, 12, 14, 15, 14, 12, 10, 8, 7, 5, 4, 3, 0]
    ],
    solo_romantic: [
        [0, 3, 5, 7, 5, 3, 2, 3, 5, 7, 5, 3, 0],
        [0, 2, 3, 5, 7, 8, 7, 5, 3, 2, 3, 5, 7, 5, 3, 0],
        [0, 3, 7, 8, 10, 8, 7, 5, 3, 5, 7, 8, 10, 8, 7, 3, 0],
        [0, 5, 7, 9, 10, 12, 10, 9, 7, 5, 3, 2, 3, 5, 7, 5, 0]
    ],
    solo_evil: [
        [0, 1, 3, 4, 6, 8, 10, 8, 6, 4, 3, 1, 0],
        [0, 1, 4, 6, 8, 10, 12, 10, 8, 6, 4, 1, 0],
        [0, 3, 4, 6, 8, 10, 12, 11, 10, 8, 6, 4, 3, 0],
        [0, 1, 3, 5, 6, 8, 10, 12, 10, 8, 6, 5, 3, 1, 0]
    ],
    solo_tapping: [
        [0, 12, 0, 12, 7, 12, 7, 12, 5, 12, 5, 12, 0],
        [0, 12, 5, 12, 5, 12, 7, 12, 7, 12, 0, 12, 0],
        [0, 12, 8, 12, 8, 12, 5, 12, 5, 12, 7, 12, 7, 12, 0],
        [0, 12, 7, 14, 7, 12, 5, 12, 5, 14, 5, 12, 0]
    ],
    solo_sweep: [
        [0, 3, 7, 12, 7, 3, 0],
        [0, 2, 7, 12, 7, 2, 0],
        [0, 3, 7, 12, 15, 12, 7, 3, 0],
        [0, 4, 7, 12, 16, 12, 7, 4, 0],
        [0, 3, 7, 12, 14, 12, 7, 3, 0, 3, 7, 12, 14, 12, 7, 3]
    ],
    solo_power: [
        [0, 7, 12, 7, 0, 7, 12, 7, 5, 12, 5, 0],
        [0, 5, 12, 5, 0, 5, 12, 7, 0, 7, 12, 7, 0],
        [0, 7, 12, 14, 12, 7, 0, 5, 12, 14, 12, 5, 0],
        [0, 5, 7, 12, 14, 16, 14, 12, 7, 5, 0]
    ],
    solo_neoclassical: [
        [0, 2, 3, 5, 7, 8, 10, 12, 14, 12, 10, 8, 7, 5, 3, 2, 0],
        [0, 1, 3, 4, 6, 8, 10, 12, 13, 12, 10, 8, 6, 4, 3, 1, 0],
        [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 14, 12, 11, 9, 7, 5, 4, 2, 0],
        [0, 3, 5, 7, 9, 10, 12, 14, 15, 17, 15, 14, 12, 10, 9, 7, 5, 3, 0]
    ],
    solo_modern: [
        [0, 5, 7, 12, 10, 7, 5, 3, 5, 7, 10, 12, 7, 5, 0],
        [0, 4, 7, 10, 12, 10, 7, 5, 3, 5, 7, 10, 12, 9, 7, 4, 0],
        [0, 3, 5, 8, 10, 12, 14, 12, 10, 8, 5, 3, 0, 3, 5, 8, 10, 12],
        [0, 2, 5, 7, 9, 12, 14, 12, 9, 7, 5, 2, 0]
    ],
    solo_bluesy: [
        [0, 3, 5, 6, 7, 10, 12, 10, 7, 6, 5, 3, 0],
        [0, 3, 5, 7, 6, 7, 10, 12, 10, 7, 6, 5, 3, 0],
        [0, 4, 5, 7, 6, 7, 10, 12, 14, 12, 10, 7, 6, 5, 4, 0],
        [0, 3, 5, 6, 7, 6, 5, 3, 5, 6, 7, 10, 12, 10, 7, 6, 5, 3, 0]
    ],
    // MELODIC LIBRARY PER L'ASSOLO (armoniche minori)
    solo_epic_harmonic: [
        [0, 2, 3, 5, 7, 8, 11, 12, 11, 8, 7, 5, 3, 2, 0],
        [0, 3, 5, 7, 8, 11, 12, 14, 12, 11, 8, 7, 5, 3, 0],
        [0, 2, 5, 7, 8, 11, 12, 14, 15, 14, 12, 11, 8, 7, 5, 2, 0],
        [0, 4, 7, 11, 12, 14, 16, 14, 12, 11, 7, 4, 0]
    ],
    solo_shred_harmonic: [
        [0, 2, 3, 5, 7, 8, 11, 12, 11, 8, 7, 5, 3, 2, 0, 2, 3, 5, 7, 8, 11, 12],
        [0, 1, 3, 5, 7, 8, 11, 12, 14, 12, 11, 8, 7, 5, 3, 1, 0, 1, 3, 5, 7, 8, 11, 12],
        [0, 2, 4, 5, 7, 8, 11, 12, 14, 15, 14, 12, 11, 8, 7, 5, 4, 2, 0, 2, 4, 5, 7, 8, 11, 12],
        [0, 3, 5, 7, 8, 11, 12, 14, 15, 17, 15, 14, 12, 11, 8, 7, 5, 3, 0]
    ],
    solo_romantic_harmonic: [
        [0, 3, 5, 7, 8, 11, 8, 7, 5, 3, 2, 3, 5, 7, 8, 11, 8, 7, 5, 3, 0],
        [0, 2, 3, 5, 7, 8, 11, 12, 11, 8, 7, 5, 3, 2, 3, 5, 7, 8, 11, 8, 7, 5, 3, 0],
        [0, 3, 7, 8, 11, 12, 11, 8, 7, 5, 3, 5, 7, 8, 11, 12, 11, 8, 7, 3, 0],
        [0, 5, 7, 8, 11, 12, 14, 12, 11, 8, 7, 5, 3, 2, 3, 5, 7, 8, 11, 8, 7, 5, 0]
    ],
    solo_evil_harmonic: [
        [0, 1, 3, 4, 6, 8, 11, 12, 11, 8, 6, 4, 3, 1, 0],
        [0, 1, 4, 6, 8, 11, 12, 14, 12, 11, 8, 6, 4, 1, 0],
        [0, 3, 4, 6, 8, 11, 12, 13, 12, 11, 8, 6, 4, 3, 0],
        [0, 1, 3, 5, 7, 8, 11, 12, 14, 12, 11, 8, 7, 5, 3, 1, 0]
    ],
    solo_tapping_harmonic: [
        [0, 11, 0, 11, 7, 11, 7, 11, 5, 11, 5, 11, 0],
        [0, 11, 5, 11, 5, 11, 7, 11, 7, 11, 0, 11, 0],
        [0, 11, 8, 11, 8, 11, 5, 11, 5, 11, 7, 11, 7, 11, 0],
        [0, 11, 7, 14, 7, 11, 5, 11, 5, 14, 5, 11, 0]
    ],
    solo_sweep_harmonic: [
        [0, 3, 7, 11, 7, 3, 0],
        [0, 2, 7, 11, 7, 2, 0],
        [0, 3, 7, 11, 15, 11, 7, 3, 0],
        [0, 4, 7, 11, 16, 11, 7, 4, 0],
        [0, 3, 7, 11, 14, 11, 7, 3, 0, 3, 7, 11, 14, 11, 7, 3]
    ],
    solo_power_harmonic: [
        [0, 7, 11, 7, 0, 7, 11, 7, 5, 11, 5, 0],
        [0, 5, 11, 5, 0, 5, 11, 7, 0, 7, 11, 7, 0],
        [0, 7, 11, 14, 11, 7, 0, 5, 11, 14, 11, 5, 0],
        [0, 5, 7, 11, 14, 16, 14, 11, 7, 5, 0]
    ],
    solo_neoclassical_harmonic: [
        [0, 2, 3, 5, 7, 8, 11, 12, 14, 12, 11, 8, 7, 5, 3, 2, 0],
        [0, 1, 3, 5, 6, 8, 11, 12, 14, 15, 14, 12, 11, 8, 6, 5, 3, 1, 0],
        [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 14, 12, 11, 9, 7, 5, 4, 2, 0],
        [0, 3, 5, 7, 8, 11, 12, 14, 15, 17, 15, 14, 12, 11, 8, 7, 5, 3, 0]
    ],
    solo_modern_harmonic: [
        [0, 5, 7, 11, 12, 11, 7, 5, 3, 5, 7, 11, 12, 11, 7, 5, 0],
        [0, 4, 7, 11, 12, 14, 12, 11, 7, 5, 3, 5, 7, 11, 12, 14, 12, 11, 7, 4, 0],
        [0, 3, 5, 7, 8, 11, 12, 14, 16, 14, 12, 11, 8, 7, 5, 3, 0, 3, 5, 7, 8, 11, 12],
        [0, 2, 5, 7, 8, 11, 12, 14, 12, 11, 8, 7, 5, 2, 0]
    ],
    solo_bluesy_harmonic: [
        [0, 3, 5, 6, 7, 8, 11, 12, 11, 8, 7, 6, 5, 3, 0],
        [0, 3, 5, 7, 6, 7, 8, 11, 12, 14, 12, 11, 8, 7, 6, 5, 3, 0],
        [0, 4, 5, 7, 6, 7, 8, 11, 12, 14, 16, 14, 12, 11, 8, 7, 6, 5, 4, 0],
        [0, 3, 5, 6, 7, 6, 5, 3, 5, 6, 7, 8, 11, 12, 14, 12, 11, 8, 7, 6, 5, 3, 0]
    ]
};

// ============================================================
// FUNZIONE UNIFICATA PER L'ASSOLO (SOLO PER L'ASSOLO!)
// ============================================================

const getSoloStyles = (energy, brightness, complexity, texture, isHarmonic) => {
    let style;
    
    // Ordine gerarchico per la scelta dello stile
    if (complexity > 0.8) {
        style = "neoclassical";
    } else if (brightness > 0.7 && energy > 0.6) {
        style = "power";
    } else if (texture > 0.6) {
        style = "modern";
    } else if (brightness < 0.3) {
        style = "bluesy";
    } else if (energy > 0.8 && complexity > 0.6) {
        style = "shred";
    } else if (energy > 0.6 && brightness > 0.5) {
        style = "tapping";
    } else if (energy > 0.5 && complexity > 0.5) {
        style = "sweep";
    } else if (brightness < 0.4 && complexity > 0.4) {
        style = "evil";
    } else if (energy > 0.7) {
        style = "shred";
    } else if (energy < 0.4) {
        style = "romantic";
    } else {
        style = "epic";
    }
    
    // Costruisci i nomi delle library
    const rhythmName = `solo_${style}`;
    const melodyName = isHarmonic ? `solo_${style}_harmonic` : `solo_${style}`;
    
    return {
        rhythmPatterns: library[rhythmName],
        melodyPatterns: melodicLibrary[melodyName],
        styleName: style.toUpperCase(),
        isHarmonic: isHarmonic
    };
};

// ============================================================
// LEGACY (sezioni normali - IDENTICO ALL'ORIGINALE!)
// ============================================================

const LeadLegacy = {
    schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score) {
        const { guitarLead } = instruments || {};
        if (!guitarLead) return;

        const name = section?.name?.toLowerCase() || "";
        const isChorus = name.includes("chorus") && !name.includes("pre");
        const isPreChorus = name.includes("pre");
        const isIntro = name.includes("intro") || name.includes("outro");
        const isSolo = name.includes("solo"); 
        const isBridge = name.includes("bridge");
        const stepTime = measureDur / 16;

        const {
            energy = 0.5,
            brightness = 0.5,
            texture = 0.5,
            complexity = 0.5
        } = params?.imageParams || {};

        const isHarmonic = scaleType === "harmonicMinor";

        // ============================================================
        // getPattern ORIGINALE (con dnaScore) - NON MODIFICATO!
        // ============================================================
        const getPattern = (type) => {
            const family = library[type] || library.verse;
            const dnaScore = (energy * 400) + (brightness * 30) + (complexity * 2);
            const index = Math.floor(Math.abs(dnaScore)) % family.length;
            return family[index];
        };

        // ============================================================
        // getMelodyFamily ORIGINALE (per sezioni normali) - NON MODIFICATO!
        // ============================================================
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

        // Seleziona il tipo di sezione per library (SOLO PER SEZIONI NORMALI)
        let sectionType;
        if (isSolo || isBridge) {
            // PER L'ASSOLO useremo getSoloStyles, quindi sectionType non serve
            sectionType = null;
        } else if (isIntro) {
            sectionType = "intro";
        } else if (isPreChorus) {
            sectionType = "prechorus";
        } else if (isChorus) {
            sectionType = "chorus";
        } else {
            sectionType = "verse";
        }

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

            let currentPattern;
            let currentMelody;
            let moodName;

            if (isSolo || isBridge) {
                // ============================================================
                // ASSOLO: usa la funzione unificata getSoloStyles
                // ============================================================
                const soloStyles = getSoloStyles(energy, brightness, complexity, texture, isHarmonic);
                
                // Scegli pattern random dalla library ritmica
                const rhythmIndex = Math.floor(rand() * soloStyles.rhythmPatterns.length);
                currentPattern = soloStyles.rhythmPatterns[rhythmIndex];
                
                // Scegli pattern random dalla melodic library
                const melodyIndex = Math.floor(rand() * soloStyles.melodyPatterns.length);
                currentMelody = soloStyles.melodyPatterns[melodyIndex];
                
                moodName = `SOLO ${soloStyles.styleName} ${isHarmonic ? "HARMONIC" : ""}`;
            } else {
                // ============================================================
                // SEZIONI NORMALI: usa la logica ORIGINALE (INALTERATA)
                // ============================================================
                currentPattern = getPattern(sectionType);
                const mood = getMelodyFamily();
                const melodyIndex = Math.floor(energy * mood.data.length) % mood.data.length;
                currentMelody = mood.data[melodyIndex];
                moodName = mood.name;
            }

            console.log(
                `%c 🎸 LEAD DNA EXECUTION (measure ${m})\n` +
                `%c > Mood: ${moodName}\n` +
                `%c > Rhythm Mask: [${currentPattern.join(" - ")}]\n` +
                `%c > Melody Steps: [${currentMelody.join(", ")}]`,
                "color:#191970;font-weight:bold;font-size:12px;",
                "color:#191970;",
                "color:#191970;",
                "color:#191970;"
            );
            
            let currentScale;
            if (isSolo || isBridge) {
                const fixedScaleRoot = rootNote + (isMinor ? "m" : "");
                currentScale = getStrictScale(fixedScaleRoot);
            } else {
                currentScale = getStrictScale(progression[m % progression.length] || "A");
            }
            
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

// ============================================================
// SCHEDULE LEAD — PUNTO DI ENTRATA PRINCIPALE
// ============================================================

export function scheduleLead(section, progression, instruments, params, rand, measureDur, score) {
    const { guitarLead } = instruments || {};
    if (!guitarLead) return;

    const tonalCenter = params?.tonalCenter || params?.imageParams?.tonalCenter || "A4";
    const scaleType = params?.scaleType || params?.imageParams?.scaleType || "naturalMinor";
    const rootNote = tonalCenter.replace(/[0-9]/g, "");
    const isMinor = scaleType.includes("minor");
    
    console.log("🎸 tonalCenter:", tonalCenter, "→ root:", rootNote);
    console.log("🎸 scaleType:", scaleType, "→ isMinor:", isMinor);
      
    LeadLegacy.schedule(section, progression, instruments, params, rand, measureDur, rootNote, isMinor, scaleType, score);
}