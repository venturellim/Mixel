// themeEngine.js — versione 002.0
// Generatore di tema power metal basato su DNA melodico
// Ogni immagine produce un tema unico, coerente e deterministico

console.log("themeEngine.js ver. 002.3 loaded");

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
    
    function pickNeighbor(sectionScale, note, dir) {
    const pool = scalePool(sectionScale);
    if (pool.length === 0) return "C4";

    const base = stripOctave(note);
    let idx = pool.indexOf(base);

    if (idx === -1) idx = 0;

    const idx2 = Math.min(pool.length - 1, Math.max(0, idx + dir));
    return toLeadNote(pool[idx2]);
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

    // Tema base (misure 1–2)
    const m1 = generateMeasure1(sectionScale, profile, dna);
    const m2 = generateMeasure2(sectionScale, profile, dna, m1);
    const base = [...m1, ...m2];

    // ------------------------------------------------------------
    // MISURE 3–4 — Variazione ritmica leggera
    // ------------------------------------------------------------
    const variation = base.map(ev => {
        const ev2 = { ...ev, beatOffset: ev.beatOffset + 8 };

        // 30%: anticipi o ritardi di 1/16
        if (Math.random() < 0.3) {
            const shift = Math.random() < 0.5 ? -0.25 : 0.25;
            ev2.beatOffset += shift;
        }

        // 30%: nota vicina
        if (Math.random() < 0.3) {
            ev2.note = pickNeighbor(sectionScale, ev.note, Math.random() < 0.5 ? 1 : -1);
        }

        return ev2;
    });

    // ------------------------------------------------------------
    // MISURE 5–6 — Ripresa del tema base
    // ------------------------------------------------------------
    const base2 = base.map(ev => ({
        ...ev,
        beatOffset: ev.beatOffset + 16
    }));

    // ------------------------------------------------------------
    // MISURE 7–8 — Finale epico (virtuosismo leggero)
    // ------------------------------------------------------------
    const virtuoso = base.map(ev => {
        const ev2 = { ...ev, beatOffset: ev.beatOffset + 24 };

        // 40%: nota vicina
        if (Math.random() < 0.4) {
            ev2.note = pickNeighbor(sectionScale, ev.note, Math.random() < 0.5 ? 1 : -1);
        }

        // 20%: salto di quinta (power metal)
        if (Math.random() < 0.2) {
            const pool = scalePool(sectionScale);
            const idx = pool.indexOf(stripOctave(ev.note));
            const idx2 = Math.min(pool.length - 1, idx + 3);
            ev2.note = toLeadNote(pool[idx2]);
        }

        // leggero aumento di energia
        ev2.velocity *= 1.08;
        ev2.duration *= 0.9;

        return ev2;
    });

    // ------------------------------------------------------------
    // MISURA 8 — Terze parallele + nota lunga finale
    // ------------------------------------------------------------
    const pool = scalePool(sectionScale);
    const tonic = toLeadNote(pool[0]);

    const finalNote = {
        beatOffset: 28, // inizio misura 8
        note: tonic,
        duration: 4, // nota lunga
        velocity: 1.0
    };

    // terza parallela (solo se esiste)
    let third = null;
    if (pool.length >= 3) {
        third = {
            beatOffset: 28,
            note: toLeadNote(pool[2]),
            duration: 4,
            velocity: 0.85
        };
    }

    const finale = third ? [finalNote, third] : [finalNote];

    // ------------------------------------------------------------
    // Ritorno completo
    // ------------------------------------------------------------
    return [
        ...base,
        ...variation,
        ...base2,
        ...virtuoso,
        ...finale
    ];
}

    return { generateTheme };
}
