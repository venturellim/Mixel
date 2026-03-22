//
// structureUtils.js — versione 002
// Timeline BPM-correct, nessun drift, nessun buco tra sezioni
//

console.log("structureUtils.js ver. 002 loaded");

// ============================================================
// 🎼 COSTRUZIONE STRUTTURA DEL BRANO (BPM-CORRECT)
// ============================================================
//
// structurePreset = [
//   { name: "intro", measures: 4 },
//   { name: "verse", measures: 8 },
//   ...
// ]
//
// bpm = BPM reale del brano
//

export function buildSongStructure(structurePreset, bpm) {

    const secondsPerBeat = 60 / bpm;
    const measureDur = secondsPerBeat * 4; // 4/4

    let currentTime = 0;

    const sections = structurePreset.map(s => {

        const measures = s.measures ?? 4;
        const duration = measures * measureDur;

        const section = {
            name: s.name,
            measures,
            duration,
            startTime: currentTime,
            endTime: currentTime + duration
        };

        currentTime += duration;

        return section;
    });

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
    return structure.sections.find(s => time >= s.startTime && time < s.endTime) || null;
}



// ============================================================
// 🧱 GENERARE TIMELINE DI EVENTI PER UNA SEZIONE (BPM-CORRECT)
// ============================================================
//
// subdivision: "4n", "8n", "16n"
// bpm: BPM reale
//
// ⚠️ IMPORTANTE:
// Questa timeline è *relativa alla sezione*.
// NON aggiunge section.startTime.
//

export function buildSectionTimeline(section, subdivision = "4n", bpm) {

    const secondsPerBeat = 60 / bpm;

    const subdivisionMap = {
        "1n":  secondsPerBeat * 4,
        "2n":  secondsPerBeat * 2,
        "4n":  secondsPerBeat,
        "8n":  secondsPerBeat / 2,
        "16n": secondsPerBeat / 4
    };

    const step = subdivisionMap[subdivision];
    const measureDur = secondsPerBeat * 4;

    const events = [];

    for (let m = 0; m < section.measures; m++) {

        const base = m * measureDur; // RELATIVO alla sezione

        for (let t = 0; t < measureDur; t += step) {
            events.push(base + t);
        }
    }

    return events;
}



// ============================================================
// 🎹 TIMELINE COMPLETA DEL BRANO (BPM-CORRECT)
// ============================================================

export function buildFullTimeline(structure, subdivision, bpm) {

    const secondsPerBeat = 60 / bpm;

    const subdivisionMap = {
        "1n":  secondsPerBeat * 4,
        "2n":  secondsPerBeat * 2,
        "4n":  secondsPerBeat,
        "8n":  secondsPerBeat / 2,
        "16n": secondsPerBeat / 4
    };

    const step = subdivisionMap[subdivision];
    const events = [];

    for (let t = 0; t < structure.totalDuration; t += step) {
        events.push(t);
    }

    return events;
}



// ============================================================
// 🎵 UTILITY: TEMPO RELATIVO ALLA SEZIONE
// ============================================================

export function sectionRelativeTime(section, absoluteTime) {
    return absoluteTime - section.startTime;
}



// ============================================================
// 🎶 UTILITY: VERIFICARE SE UN TEMPO È DENTRO UNA SEZIONE
// ============================================================

export function isTimeInSection(section, time) {
    return time >= section.startTime && time < section.endTime;
}
