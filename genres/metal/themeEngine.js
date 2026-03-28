// themeEngine.js — versione 002.0
// Generatore di tema power metal basato su DNA melodico
// Ogni immagine produce un tema unico, coerente e deterministico

console.log("themeEngine.js ver. 002.0 loaded");

export function initThemeEngine(metalParams, imageParams, rand) {

    const secondsPerBeat = 60 / metalParams.bpm;

    // ------------------------------------------------------------
    // UTILITIES
    // ------------------------------------------------------------

    function stripOctave(note) {
        if (typeof note !== "string") return "C";
        return note.replace(/[0-9]/g, "");
    }

    function toLeadNote(letter) {
        return stripOctave(letter) + "4";
    }

    function scalePool(sectionScale) {
        return sectionScale
            .map(stripOctave)
            .filter(n => /^[A-G](b)?$/.test(n));
    }

    function pickFromPool(pool, r) {
        return pool[Math.floor(r() * pool.length)];
    }

    // ------------------------------------------------------------
    // DNA MELODICO
    // ------------------------------------------------------------

    function createDNASeededRandom(dna) {
        let seed = dna >>> 0;
        return function () {
            seed = (seed * 1664525 + 1013904223) >>> 0;
            return seed / 0xFFFFFFFF;
        };
    }

    function generateIntervalPattern(dna, profile) {
        const r = createDNASeededRandom(dna);

        const length =
            profile.energy > 0.7 ? 10 :
            profile.energy > 0.4 ? 8 :
            6;

        const maxStep =
            profile.color > 0.7 ? 3 :
            profile.color > 0.4 ? 2 :
            1;

        const pattern = [];
        for (let i = 0; i < length; i++) {
            const step = Math.floor(r() * (maxStep * 2 + 1)) - maxStep;
            pattern.push(step);
        }

        return pattern;
    }

    function applyPattern(sectionScale, pattern, startIndex) {
        const pool = scalePool(sectionScale);
        if (pool.length === 0) return ["C4"];

        let idx = Math.min(pool.length - 1, Math.max(0, startIndex));
        const notes = [];

        for (const step of pattern) {
            idx = Math.min(pool.length - 1, Math.max(0, idx + step));
            notes.push(toLeadNote(pool[idx]));
        }

        return notes;
    }

    // ------------------------------------------------------------
    // PROFILO IMMAGINE
    // ------------------------------------------------------------

    function getThemeProfile(imageParams) {
        return {
            energy: imageParams.energy ?? 0.5,
            darkness: imageParams.texture ?? 0.5,
            color: imageParams.complexity ?? 0.5,
            calm: 1 - (imageParams.energy ?? 0.5)
        };
    }

    // ------------------------------------------------------------
    // GENERAZIONE MISURA 1 (DOMANDA)
    // ------------------------------------------------------------

    function generateMeasure1(sectionScale, profile, dna) {

        const pool = scalePool(sectionScale);
        if (pool.length === 0) return [];

        const r = createDNASeededRandom(dna);

        const startIndex = Math.floor(r() * pool.length);
        const pattern = generateIntervalPattern(dna, profile);
        const notes = applyPattern(sectionScale, pattern, startIndex);

        const events = [];

        for (let i = 0; i < notes.length; i++) {
            const beatOffset = i * 0.5; // 8n grid
            events.push({
                beatOffset,
                note: notes[i],
                duration: 0.5,
                velocity: 0.85 + (i === 0 ? 0.1 : 0)
            });
        }

        return events;
    }

    // ------------------------------------------------------------
    // GENERAZIONE MISURA 2 (RISPOSTA)
    // ------------------------------------------------------------

    function generateMeasure2(sectionScale, profile, dna, measure1) {

        const pool = scalePool(sectionScale);
        if (pool.length === 0) return [];

        const r = createDNASeededRandom(dna + 12345);

        const pattern = generateIntervalPattern(dna + 999, profile);
        const startIndex = Math.floor(r() * pool.length);
        const notes = applyPattern(sectionScale, pattern, startIndex);

        const events = [];

        for (let i = 0; i < notes.length; i++) {
            const beatOffset = 4 + i * 0.5; // seconda misura
            events.push({
                beatOffset,
                note: notes[i],
                duration: 0.5,
                velocity: 0.85
            });
        }

        // chiusura sulla tonica
        const tonic = toLeadNote(pool[0]);
        events.push({
            beatOffset: 4 + notes.length * 0.5,
            note: tonic,
            duration: profile.calm > 0.5 ? 2 : 1,
            velocity: 0.95
        });

        return events;
    }

    // ------------------------------------------------------------
    // GENERATORE PRINCIPALE
    // ------------------------------------------------------------

    function generateTheme(section, sectionScale, progression) {
        const profile = getThemeProfile(imageParams);
        const dna = imageParams.dna ?? 123456;

        const m1 = generateMeasure1(sectionScale, profile, dna);
        const m2 = generateMeasure2(sectionScale, profile, dna, m1);

        return [...m1, ...m2];
    }

    return { generateTheme };
}
