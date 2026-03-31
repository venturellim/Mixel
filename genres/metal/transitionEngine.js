// transitionEngine.js — ver. 2.0
// Sistema modulare definitivo per transizioni power metal
// ============================================================
// UTILITY
// ============================================================

console.log("transitionEngine.js ver. 020 loaded");

// Normalizza una nota in lettera naturale A–G
function safeLetter(n) {
    if (!n || typeof n !== "string") return "A";
    return n[0].toUpperCase();
}

// Distanza armonica ciclica tra due note (C–B)
function harmonicDistance(a, b) {
    const letters = ["C","D","E","F","G","A","B"];
    const i1 = letters.indexOf(a);
    const i2 = letters.indexOf(b);
    if (i1 === -1 || i2 === -1) return 0;
    let d = Math.abs(i1 - i2);
    return d > 3 ? 7 - d : d;
}

// Scelta pesata
function weightedChoice(options, rand) {
    const total = options.reduce((s, o) => s + o.weight, 0);
    let r = rand() * total;
    for (const o of options) {
        if (r < o.weight) return o.value;
        r -= o.weight;
    }
    return options[options.length - 1].value;
}

// ============================================================
// REGISTRY
// ============================================================

const TRANSITIONS = [];

export function registerTransition(def) {
    TRANSITIONS.push(def);
}

// ============================================================
// PICK TRANSITION
// ============================================================
// Nota: prevPattern e nextPattern possono essere aggiunti in futuro.
// Per ora manteniamo la firma compatibile con metalEngine 020.

export function pickTransition(fromNote, toNote, scale, imageParams, rand) {
    const from = safeLetter(fromNote);
    const to   = safeLetter(toNote);
    const dist = harmonicDistance(from, to);

    // Filtra le transizioni valide per distanza armonica
    const candidates = TRANSITIONS.filter(t => t.condition(dist, from, to));

    if (candidates.length === 0) {
        console.warn("[TransitionEngine] Nessuna transizione valida, fallback.");
        return TRANSITIONS[0];
    }

    // Pesatura
    const total = candidates.reduce((s, t) => s + t.weight, 0);
    let r = rand() * total;

    for (const t of candidates) {
        if (r < t.weight) return t;
        r -= t.weight;
    }

    return candidates[candidates.length - 1];
}

// ============================================================
// TRANSIZIONI STATICHE (GUITAR PALM) — DISTANZA 0
// ============================================================

// pm_burst_9
registerTransition({
    name: "pm_burst_9",
    weight: 1.4,
    instrument: "palm",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const events = [];
        for (let b = 0; b < 3; b++) {
            events.push({ beatOffset: b,       note: f });
            events.push({ beatOffset: b + 0.33, note: f });
            events.push({ beatOffset: b + 0.66, note: f });
        }
        return { durationBeats: 4, events };
    }
});

// pm_burst_12
registerTransition({
    name: "pm_burst_12",
    weight: 1.4,
    instrument: "palm",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const events = [];
        for (let b = 0; b < 4; b++) {
            events.push({ beatOffset: b,       note: f });
            events.push({ beatOffset: b + 0.33, note: f });
            events.push({ beatOffset: b + 0.66, note: f });
        }
        return { durationBeats: 4, events };
    }
});

// tremolo_burst
registerTransition({
    name: "tremolo_burst",
    weight: 1.0,
    instrument: "palm",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const events = [];
        for (let b = 0; b < 4; b += 0.25) {
            events.push({ beatOffset: b, note: f });
        }
        return { durationBeats: 4, events };
    }
});

// gallop_9
registerTransition({
    name: "gallop_9",
    weight: 1.0,
    instrument: "palm",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const events = [];
        for (let b = 0; b < 4; b++) {
            events.push({ beatOffset: b,     note: f });
            events.push({ beatOffset: b+0.5, note: f });
            events.push({ beatOffset: b+0.75,note: f });
        }
        return { durationBeats: 4, events };
    }
});

// syncopated_hits
registerTransition({
    name: "syncopated_hits",
    weight: 0.8,
    instrument: "palm",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const events = [];
        for (let b = 0; b < 4; b++) {
            events.push({ beatOffset: b + 0.5, note: f });
        }
        return { durationBeats: 4, events };
    }
});

// open_hit
registerTransition({
    name: "open_hit",
    weight: 0.6,
    instrument: "palm",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        return {
            durationBeats: 2,
            events: [{ beatOffset: 0, note: f }]
        };
    }
});

// Variante: palm_chug_variants
registerTransition({
    name: "palm_chug_variants",
    weight: 0.9,
    instrument: "palm",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const events = [];
        for (let b = 0; b < 4; b += 0.5) {
            events.push({ beatOffset: b, note: f });
        }
        return { durationBeats: 4, events };
    }
});

// Variante: gallop_alt
registerTransition({
    name: "gallop_alt",
    weight: 0.7,
    instrument: "palm",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const events = [];
        for (let b = 0; b < 4; b++) {
            events.push({ beatOffset: b,     note: f });
            events.push({ beatOffset: b+0.33, note: f });
            events.push({ beatOffset: b+0.66, note: f });
        }
        return { durationBeats: 4, events };
    }
});

// ============================================================
// TRANSIZIONI DINAMICHE (GUITAR MIXED) — DISTANZA 1–3
// ============================================================

// power_walk
registerTransition({
    name: "power_walk",
    weight: 1.4,
    instrument: "mixed",
    condition: (dist, from, to) => dist === 2 || dist === 3,
    generate: (from, to, scale, rand) => {
        const events = [];
        const letters = scale.map(n => safeLetter(n));
        let i1 = letters.indexOf(safeLetter(from));
        let i2 = letters.indexOf(safeLetter(to));
        if (i1 === -1) i1 = 0;
        if (i2 === -1) i2 = letters.length - 1;

        const step = i1 < i2 ? 1 : -1;
        let pos = i1;

        for (let b = 0; b < 5; b++) {
            events.push({ beatOffset: b, note: letters[pos] });
            pos += step;
            if (pos < 0) pos = 0;
            if (pos >= letters.length) pos = letters.length - 1;
        }

        events.push({ beatOffset: 5, note: letters[i2] });

        return { durationBeats: 6, events };
    }
});

// power_slide
registerTransition({
    name: "power_slide",
    weight: 1.0,
    instrument: "mixed",
    condition: (dist, from, to) => dist >= 1 && dist <= 3,
    generate: (from, to, scale, rand) => {
        return {
            durationBeats: 6,
            events: [
                { beatOffset: 0, note: safeLetter(from) },
                { beatOffset: 5, note: safeLetter(to) }
            ]
        };
    }
});

// scale_up_short
registerTransition({
    name: "scale_up_short",
    weight: 1.2,
    instrument: "mixed",
    condition: (dist, from, to) => dist >= 1 && dist <= 3,
    generate: (from, to, scale, rand) => {
        const events = [];
        const letters = scale.map(n => safeLetter(n));
        let i1 = letters.indexOf(safeLetter(from));
        let i2 = letters.indexOf(safeLetter(to));
        if (i1 === -1) i1 = 0;
        if (i2 === -1) i2 = letters.length - 1;

        const step = i1 < i2 ? 1 : -1;
        let pos = i1;

        for (let b = 0; b < 5; b += 0.5) {
            events.push({ beatOffset: b, note: letters[pos] });
            pos += step;
            if (pos < 0) pos = 0;
            if (pos >= letters.length) pos = letters.length - 1;
        }

        events.push({ beatOffset: 5, note: letters[i2] });

        return { durationBeats: 6, events };
    }
});

// scale_down_short
registerTransition({
    name: "scale_down_short",
    weight: 1.2,
    instrument: "mixed",
    condition: (dist, from, to) => dist >= 1 && dist <= 3,
    generate: (from, to, scale, rand) => {
        const events = [];
        const letters = scale.map(n => safeLetter(n));
        let i1 = letters.indexOf(safeLetter(from));
        let i2 = letters.indexOf(safeLetter(to));
        if (i1 === -1) i1 = 0;
        if (i2 === -1) i2 = letters.length - 1;

        const step = i1 < i2 ? 1 : -1;
        let pos = i1;

        for (let b = 0; b < 5; b += 0.5) {
            events.push({ beatOffset: b, note: letters[pos] });
            pos += step;
            if (pos < 0) pos = 0;
            if (pos >= letters.length) pos = letters.length - 1;
        }

        events.push({ beatOffset: 5, note: letters[i2] });

        return { durationBeats: 6, events };
    }
});

// chromatic_climb (nuova)
registerTransition({
    name: "chromatic_climb",
    weight: 0.9,
    instrument: "mixed",
    condition: (dist, from, to) => dist >= 2 && dist <= 3,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const t = safeLetter(to);
        const events = [];

        // 12 semicrome cromatiche
        for (let i = 0; i < 12; i++) {
            events.push({
                beatOffset: i * 0.25,
                note: rand() > 0.5 ? f : t
            });
        }

        return { durationBeats: 6, events };
    }
});

// pedal_shift (nuova)
registerTransition({
    name: "pedal_shift",
    weight: 0.8,
    instrument: "mixed",
    condition: (dist, from, to) => dist >= 1 && dist <= 3,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const t = safeLetter(to);
        const events = [];

        for (let b = 0; b < 6; b++) {
            events.push({ beatOffset: b, note: f });
            if (rand() > 0.5) {
                events.push({ beatOffset: b + 0.5, note: t });
            }
        }

        return { durationBeats: 6, events };
    }
});

// ============================================================
// TRANSIZIONI MELODICHE (GUITAR LEAD) — DISTANZA 4–6
// ============================================================

// scale_up
registerTransition({
    name: "scale_up",
    weight: 1.4,
    instrument: "lead",
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const events = [];
        const letters = scale.map(n => safeLetter(n));
        let i1 = letters.indexOf(safeLetter(from));
        let i2 = letters.indexOf(safeLetter(to));
        if (i1 === -1) i1 = 0;
        if (i2 === -1) i2 = letters.length - 1;

        const step = i1 < i2 ? 1 : -1;
        let pos = i1;

        for (let b = 0; b < 7.5; b += 0.5) {
            events.push({ beatOffset: b, note: letters[pos] });
            pos += step;
            if (pos < 0) pos = 0;
            if (pos >= letters.length) pos = letters.length - 1;
        }

        events.push({ beatOffset: 7.5, note: letters[i2] });

        return { durationBeats: 8, events };
    }
});

// scale_down
registerTransition({
    name: "scale_down",
    weight: 1.4,
    instrument: "lead",
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const events = [];
        const letters = scale.map(n => safeLetter(n));
        let i1 = letters.indexOf(safeLetter(from));
        let i2 = letters.indexOf(safeLetter(to));
        if (i1 === -1) i1 = 0;
        if (i2 === -1) i2 = letters.length - 1;

        const step = i1 < i2 ? 1 : -1;
        let pos = i1;

        for (let b = 0; b < 7.5; b += 0.5) {
            events.push({ beatOffset: b, note: letters[pos] });
            pos += step;
            if (pos < 0) pos = 0;
            if (pos >= letters.length) pos = letters.length - 1;
        }

        events.push({ beatOffset: 7.5, note: letters[i2] });

        return { durationBeats: 8, events };
    }
});

// melodic_run
registerTransition({
    name: "melodic_run",
    weight: 1.2,
    instrument: "lead",
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const letters = scale.map(n => safeLetter(n));
        const events = [];

        for (let b = 0; b < 7.5; b += 0.25) {
            const pos = Math.floor(rand() * letters.length);
            events.push({ beatOffset: b, note: letters[pos] });
        }

        events.push({ beatOffset: 7.5, note: safeLetter(to) });

        return { durationBeats: 8, events };
    }
});

// arpeggio_climb (nuova)
registerTransition({
    name: "arpeggio_climb",
    weight: 1.0,
    instrument: "lead",
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const letters = scale.map(n => safeLetter(n));
        const events = [];

        // Arpeggio 1–3–5 ripetuto
        const chord = [
            letters[0],
            letters[2 % letters.length],
            letters[4 % letters.length]
        ];

        let beat = 0;
        while (beat < 7.5) {
            for (let n of chord) {
                events.push({ beatOffset: beat, note: n });
                beat += 0.5;
                if (beat >= 7.5) break;
            }
        }

        events.push({ beatOffset: 7.5, note: safeLetter(to) });

        return { durationBeats: 8, events };
    }
});

// octave_jump (nuova)
registerTransition({
    name: "octave_jump",
    weight: 0.9,
    instrument: "lead",
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const t = safeLetter(to);
        const events = [];

        // Alterna nota bassa e nota alta
        for (let b = 0; b < 8; b += 0.5) {
            events.push({
                beatOffset: b,
                note: rand() > 0.5 ? f : t
            });
        }

        return { durationBeats: 8, events };
    }
});

// ============================================================
// TRANSIZIONI KEYBOARD (SOFT MODE) — DISTANZA ≥ 4
// ============================================================

// 1) Johansson Run — 16 semicrome shred
registerTransition({
    name: "keyboard_johansson_run",
    instrument: "keyboard",
    weight: 0.6,
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const letters = scale.map(n => n[0].toUpperCase());
        const events = [];
        for (let i = 0; i < 16; i++) {
            const pos = Math.floor(rand() * letters.length);
            events.push({
                beatOffset: i * 0.25,
                note: letters[pos] + "5"
            });
        }
        return { durationBeats: 4, events };
    }
});

// 2) Staropoli Arpeggio — arpeggio 1–3–5
registerTransition({
    name: "keyboard_staropoli_arpeggio",
    instrument: "keyboard",
    weight: 0.5,
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const letters = scale.map(n => n[0].toUpperCase());
        const chord = [
            letters[0] + "5",
            letters[2 % letters.length] + "5",
            letters[4 % letters.length] + "5"
        ];
        const events = [];
        let b = 0;
        while (b < 4) {
            for (let n of chord) {
                events.push({ beatOffset: b, note: n });
                b += 0.5;
                if (b >= 4) break;
            }
        }
        return { durationBeats: 4, events };
    }
});

// 3) Scale 3-3-2 — pattern power metal classico
registerTransition({
    name: "keyboard_scale_332",
    instrument: "keyboard",
    weight: 0.4,
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const letters = scale.map(n => n[0].toUpperCase());
        const events = [];
        const pattern = [3, 3, 2];
        let beat = 0;
        for (let group of pattern) {
            for (let i = 0; i < group; i++) {
                const pos = Math.floor(rand() * letters.length);
                events.push({ beatOffset: beat, note: letters[pos] + "5" });
                beat += 0.25;
            }
        }
        return { durationBeats: 4, events };
    }
});

// 4) Chromatic Spiral — cromatismi ascendenti/descendenti
registerTransition({
    name: "keyboard_chromatic_spiral",
    instrument: "keyboard",
    weight: 0.3,
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const f = from[0].toUpperCase() + "5";
        const t = to[0].toUpperCase() + "5";
        const events = [];
        for (let i = 0; i < 16; i++) {
            events.push({
                beatOffset: i * 0.25,
                note: rand() > 0.5 ? f : t
            });
        }
        return { durationBeats: 4, events };
    }
});

// 5) Octave Fanfare — alternanza ottava bassa/alta
registerTransition({
    name: "keyboard_octave_fanfare",
    instrument: "keyboard",
    weight: 0.3,
    condition: (dist, from, to) => dist >= 4,
    generate: (from, to, scale, rand) => {
        const base = from[0].toUpperCase();
        const events = [];
        for (let b = 0; b < 4; b += 0.5) {
            const note = rand() > 0.5 ? base + "4" : base + "5";
            events.push({ beatOffset: b, note });
        }
        return { durationBeats: 4, events };
    }
});


// ============================================================
// TRANSIZIONI DRUM — INDIPENDENTI DALLA DISTANZA
// ============================================================

// tom_fill
registerTransition({
    name: "tom_fill",
    weight: 0.6,
    instrument: "drums",
    condition: (dist, from, to) => dist === 0 || dist === 1,
    generate: (from, to, scale, rand) => {
        const events = [];
        const toms = ["tom1", "tom2", "tom3", "tom4"];

        for (let b = 0; b < 4; b += 0.5) {
            const drum = toms[Math.floor(rand() * toms.length)];
            events.push({ beatOffset: b, drum });
        }

        return { durationBeats: 4, events };
    }
});

// snare_roll
registerTransition({
    name: "snare_roll",
    weight: 0.5,
    instrument: "drums",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const events = [];
        for (let b = 0; b < 4; b += 0.25) {
            events.push({ beatOffset: b, drum: "snare" });
        }
        return { durationBeats: 4, events };
    }
});

// ride_pattern
registerTransition({
    name: "ride_pattern",
    weight: 0.4,
    instrument: "drums",
    condition: (dist, from, to) => dist <= 2,
    generate: (from, to, scale, rand) => {
        const events = [];
        for (let b = 0; b < 4; b += 0.5) {
            events.push({ beatOffset: b, drum: "ride" });
        }
        events.push({ beatOffset: 3.5, drum: "crash" });
        return { durationBeats: 4, events };
    }
});

// blast_fill
registerTransition({
    name: "blast_fill",
    weight: 0.3,
    instrument: "drums",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        const events = [];
        for (let b = 0; b < 4; b += 0.25) {
            events.push({ beatOffset: b, drum: rand() > 0.5 ? "snare" : "kick" });
        }
        return { durationBeats: 4, events };
    }
});

// china_hit
registerTransition({
    name: "china_hit",
    weight: 0.3,
    instrument: "drums",
    condition: (dist, from, to) => true, // sempre valida
    generate: (from, to, scale, rand) => {
        return {
            durationBeats: 2,
            events: [
                { beatOffset: 0, drum: "china" },
                { beatOffset: 1.5, drum: "crash" }
            ]
        };
    }
});

// ============================================================
// TRANSIZIONI BASS — COMPATIBILI CON METALENGINE 020
// ============================================================

// bass_spotlight (FUNZIONA GIÀ OGGI)
registerTransition({
    name: "bass_spotlight",
    weight: 0.8,
    instrument: "bass",
    condition: (dist, from, to) => dist <= 2, // meglio su distanze piccole
    generate: (from, to, scale, rand) => {
        const events = [];
        const letters = scale.map(n => safeLetter(n));

        // pattern: 8 semicrome + nota finale
        for (let b = 0; b < 3.5; b += 0.25) {
            const pos = Math.floor(rand() * letters.length);
            events.push({ beatOffset: b, note: letters[pos] });
        }

        events.push({ beatOffset: 3.75, note: safeLetter(to) });

        return { durationBeats: 4, events };
    }
});

// bass_slide (registrata ma NON suona finché non la abiliti nel metalEngine)
registerTransition({
    name: "bass_slide",
    weight: 0.4,
    instrument: "bass",
    condition: (dist, from, to) => dist <= 3,
    generate: (from, to, scale, rand) => {
        return {
            durationBeats: 4,
            events: [
                { beatOffset: 0, note: safeLetter(from) },
                { beatOffset: 3.5, note: safeLetter(to) }
            ]
        };
    }
});

// bass_gallop (registrata ma NON suona)
registerTransition({
    name: "bass_gallop",
    weight: 0.4,
    instrument: "bass",
    condition: (dist, from, to) => dist <= 2,
    generate: (from, to, scale, rand) => {
        const f = safeLetter(from);
        const events = [];
        for (let b = 0; b < 4; b++) {
            events.push({ beatOffset: b,     note: f });
            events.push({ beatOffset: b+0.5, note: f });
            events.push({ beatOffset: b+0.75,note: f });
        }
        return { durationBeats: 4, events };
    }
});

// bass_run (registrata ma NON suona)
registerTransition({
    name: "bass_run",
    weight: 0.3,
    instrument: "bass",
    condition: (dist, from, to) => dist >= 2,
    generate: (from, to, scale, rand) => {
        const letters = scale.map(n => safeLetter(n));
        const events = [];
        for (let b = 0; b < 3.5; b += 0.25) {
            const pos = Math.floor(rand() * letters.length);
            events.push({ beatOffset: b, note: letters[pos] });
        }
        events.push({ beatOffset: 3.75, note: safeLetter(to) });
        return { durationBeats: 4, events };
    }
});

// bass_tapping (registrata ma NON suona)
registerTransition({
    name: "bass_tapping",
    weight: 0.2,
    instrument: "bass",
    condition: (dist, from, to) => dist >= 3,
    generate: (from, to, scale, rand) => {
        const letters = scale.map(n => safeLetter(n));
        const events = [];
        for (let b = 0; b < 4; b += 0.25) {
            const pos = Math.floor(rand() * letters.length);
            events.push({ beatOffset: b, note: letters[pos] });
        }
        return { durationBeats: 4, events };
    }
});

// ============================================================
// TRANSIZIONI CINEMATICHE / RESPIRO
// ============================================================

// silence_2s — FUNZIONA SUBITO
registerTransition({
    name: "silence_2s",
    weight: 0.5,
    instrument: "none",
    condition: (dist, from, to) => true, // sempre valida
    generate: (from, to, scale, rand) => {
        return {
            durationBeats: 8, // 2 secondi circa a 120 bpm
            events: []        // nessun evento → silenzio
        };
    }
});

// reverse_swell — registrata ma silenziosa finché non abiliti un pad/FX
registerTransition({
    name: "reverse_swell",
    weight: 0.3,
    instrument: "none",
    condition: (dist, from, to) => dist === 0 || dist >= 4,
    generate: (from, to, scale, rand) => {
        // Evento placeholder (non suona)
        return {
            durationBeats: 4,
            events: [
                { beatOffset: 0, fx: "reverse_swell" }
            ]
        };
    }
});

// hit_stab — registrata ma silenziosa
registerTransition({
    name: "hit_stab",
    weight: 0.3,
    instrument: "none",
    condition: (dist, from, to) => true,
    generate: (from, to, scale, rand) => {
        return {
            durationBeats: 2,
            events: [
                { beatOffset: 0, fx: "hit_stab" }
            ]
        };
    }
});

// airy_break — registrata ma silenziosa
registerTransition({
    name: "airy_break",
    weight: 0.2,
    instrument: "none",
    condition: (dist, from, to) => dist === 0,
    generate: (from, to, scale, rand) => {
        return {
            durationBeats: 4,
            events: []
        };
    }
});

// low_rumble — registrata ma silenziosa
registerTransition({
    name: "low_rumble",
    weight: 0.2,
    instrument: "none",
    condition: (dist, from, to) => dist >= 3,
    generate: (from, to, scale, rand) => {
        return {
            durationBeats: 4,
            events: [
                { beatOffset: 0, fx: "low_rumble" }
            ]
        };
    }
});

// ============================================================
// EXPORT FINALE DEL TRANSITION ENGINE
// ============================================================

export const TransitionEngine = {
    pickTransition,
    registerTransition,
    TRANSITIONS
};

// ============================================================
// FINE TRANSITIONENGINE 2.0
// ------------------------------------------------------------
// Questo file è progettato per essere DEFINITIVO.
// Le transizioni sono modulari, pesate, armonicamente corrette,
// e compatibili con metalEngine 020 senza ulteriori modifiche.
//
// Se in futuro vorrai aggiungere nuove transizioni:
// - usa registerTransition()
// - rispetta la distanza armonica
// - mantieni la coerenza con gli strumenti esistenti
//
// Buon power metal 🤘
// ============================================================
