//
// structureUtils.js
// Modulo universale per la gestione della struttura del brano.
// Contiene:
// - generazione timeline sezioni
// - calcolo durate sezioni
// - mapping intro/verse/chorus/solo/outro
// - utilità per navigare la struttura
//
// Nessuna logica di genere.
// Nessuna dipendenza da strumenti.
//

import { duration } from "./tempoUtils.js";

console.log("structureUtils.js loaded");

// ============================================================
// 🎼 COSTRUZIONE STRUTTURA DEL BRANO
// ============================================================
//
// structureProfile = {
//   intro: 4,
//   verse: 8,
//   chorus: 8,
//   solo: 12,
//   outro: 4
// }
//
// Ogni valore rappresenta il numero di misure.
// bpm: per calcolare la durata reale.
//

export function buildSongStructure(structureProfile, bpm) {
    const measureDur = duration("1m"); // durata misura secondo Tone.js
    const sections = [];
    let currentTime = 0;

    for (const [name, measures] of Object.entries(structureProfile)) {
        const sectionDur = measures * measureDur;

        sections.push({
            name,
            start: currentTime,
            end: currentTime + sectionDur,
            duration: sectionDur,
            measures
        });

        currentTime += sectionDur;
    }

    return {
        sections,
        totalDuration: currentTime
    };
}


// ============================================================
// 🎵 OTTENERE UNA SEZIONE PER NOME
// ============================================================

export function getSection(structure, name) {
    return structure.sections.find(s => s.name === name) || null;
}


// ============================================================
// 🎶 OTTENERE LA SEZIONE CORRENTE DATO UN TEMPO
// ============================================================

export function getSectionAtTime(structure, time) {
    return structure.sections.find(s => time >= s.start && time < s.end) || null;
}


// ============================================================
// 🧱 GENERARE TIMELINE DI EVENTI PER UNA SEZIONE
// ============================================================
//
// division: "4n", "8n", "16n"
// bpm: per calcolare la durata reale
//

export function buildSectionTimeline(section, division) {
    const stepDur = duration(division);
    const events = [];

    for (let t = section.start; t < section.end; t += stepDur) {
        events.push(t);
    }

    return events;
}


// ============================================================
// 🎹 GENERARE TIMELINE COMPLETA DEL BRANO
// ============================================================
//
// Utile per strumenti che devono suonare in tutto il brano.
//

export function buildFullTimeline(structure, division) {
    const stepDur = duration(division);
    const events = [];

    for (let t = 0; t < structure.totalDuration; t += stepDur) {
        events.push(t);
    }

    return events;
}


// ============================================================
// 🎵 UTILITY: NORMALIZZARE TEMPO RELATIVO ALLA SEZIONE
// ============================================================
//
// Converte un tempo assoluto in tempo relativo alla sezione.
//

export function sectionRelativeTime(section, absoluteTime) {
    return absoluteTime - section.start;
}


// ============================================================
// 🎶 UTILITY: VERIFICARE SE UN TEMPO È DENTRO UNA SEZIONE
// ============================================================

export function isTimeInSection(section, time) {
    return time >= section.start && time < section.end;
}
