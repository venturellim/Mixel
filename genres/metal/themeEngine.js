// themeEngine.js — versione 002.5
// Tema power metal deterministico + flag isAccent per DrumEngine

console.log("themeEngine.js ver. 002.5 loaded");

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
    // DNA / RANDOM DETERMINISTICO
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
    // ACCENT DETECTION (per DrumEngine)
    // ------------------------------------------------------------

    function markAccent(ev) {
        const beat = ev.beatOffset;

        const isDownbeat = (beat % 1 === 0);
        const isBarEnd = Math.abs((beat % 4) - 3.5) < 0.01;
        const isLong = ev.duration >= 1;
        const isLoud = ev.velocity >= 0.9;

        return {
            ...ev,
            isAccent: isDownbeat || isBarEnd || isLong || isLoud
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
            const baseVel = 0.85 + (i === 0 ? 0.1 : 0);
            const ev = {
                beatOffset,
                note: notes[i],
                duration: 0.5,
                velocity: baseVel
            };
            events.push(markAccent(ev));
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
            const ev = {
                beatOffset,
                note: notes[i],
                duration: 0.5,
                velocity: 0.85
            };
            events.push(markAccent(ev));
        }

        // chiusura sulla tonica
        const tonic = toLeadNote(pool[0]);
        const closingDuration = profile.calm > 0.5 ? 2 : 1;
        const closing = {
            beatOffset: 4 + notes.length * 0.5,
            note: tonic,
            duration: closingDuration,
            velocity: 0.95
        };
        events.push(markAccent(closing));

        return events;
    }

    // ------------------------------------------------------------
    // GENERATORE PRINCIPALE (002.5)
    // ------------------------------------------------------------

    function generateTheme(section, sectionScale, progression) {
        const profile = getThemeProfile(imageParams);
        const dna = imageParams.dna ?? 123456;

        // Tema base (misure 1–2)
        const m1 = generateMeasure1(sectionScale, profile, dna);
        const m2 = generateMeasure2(sectionScale, profile, dna, m1);
        const base = [...m1, ...m2];

        // RNG deterministici per variazione/virtuoso
        const rVar = createDNASeededRandom(dna + 777);
        const rVirt = createDNASeededRandom(dna + 1337);

        // Variazione leggera (misure 3–4)
        const variation = base.map(ev => {
            let beatOffset = ev.beatOffset + 8; // +2 misure
            let note = ev.note;
            let velocity = ev.velocity * 0.95;
            const duration = ev.duration;

            // 30%: micro shift ritmico 16th
            if (rVar() < 0.3) {
                const dir = rVar() < 0.5 ? -0.25 : 0.25;
                beatOffset += dir;
            }

            // 30%: nota vicina
            if (rVar() < 0.3) {
                const dir = rVar() < 0.5 ? 1 : -1;
                note = pickNeighbor(sectionScale, ev.note, dir);
            }

            const ev2 = { beatOffset, note, duration, velocity };
            return markAccent(ev2);
        });

        // Ripetizione del tema base (misure 5–6)
        const base2 = base.map(ev => {
            const ev2 = {
                ...ev,
                beatOffset: ev.beatOffset + 16 // +4 misure
            };
            return markAccent(ev2);
        });

        // Virtuosismo leggero (misure 7–8)
        const virtuoso = base.map(ev => {
            let beatOffset = ev.beatOffset + 24; // +6 misure
            let note = ev.note;
            let velocity = ev.velocity * 1.05;
            let duration = ev.duration * 0.9;

            // 40%: nota vicina
            if (rVirt() < 0.4) {
                const dir = rVirt() < 0.5 ? 1 : -1;
                note = pickNeighbor(sectionScale, ev.note, dir);
            }

            // 20%: salto di quinta (power metal)
            if (rVirt() < 0.2) {
                const pool = scalePool(sectionScale);
                const baseLetter = stripOctave(ev.note);
                let idx = pool.indexOf(baseLetter);
                if (idx === -1) idx = 0;
                const idx2 = Math.min(pool.length - 1, idx + 3);
                note = toLeadNote(pool[idx2]);
            }

            const ev2 = { beatOffset, note, duration, velocity };
            return markAccent(ev2);
        });

        // Finale epico (misura 8, nota lunga + eventuale terza)
        const pool = scalePool(sectionScale);
        const tonic = toLeadNote(pool[0] || "C");
        const finalBeat = 28; // inizio misura 8
        const finalNote = markAccent({
            beatOffset: finalBeat,
            note: tonic,
            duration: 4,
            velocity: 1.0
        });

        let finale = [finalNote];

        if (pool.length >= 3) {
            const third = toLeadNote(pool[2]);
            const thirdEv = markAccent({
                beatOffset: finalBeat,
                note: third,
                duration: 4,
                velocity: 0.85
            });
            finale.push(thirdEv);
        }

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
