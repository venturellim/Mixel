// themeEngine.js — versione 001.5
// Generatore di tema power metal (2 misure, lead ibrida, immagine-influenced)
// FIX: gestione bemolle, niente ASCII, niente note inesistenti

import { nearestNatural } from "../../utils/harmonyUtils.js";

console.log("themeEngine.js ver. 001.5 loaded");

export function initThemeEngine(metalParams, imageParams, rand) {

    const secondsPerBeat = 60 / metalParams.bpm;

    // ------------------------------------------------------------
    // UTILITIES
    // ------------------------------------------------------------

    // Converte nota in ottava 4 (es: "Eb" → "Eb4")
    function toLeadNote(letter) {
        return letter + "4";
    }

    // Sceglie una nota valida dalla scala della sezione (mantiene i bemolle!)
    function pickScaleNote(sectionScale) {
        if (!sectionScale || sectionScale.length === 0) return "C4";

        const nat = sectionScale
            .map(n => nearestNatural(n)) // mantiene Bb, Eb, Ab
            .filter(n => typeof n === "string");

        if (nat.length === 0) return "C4";

        const note = nat[Math.floor(rand() * nat.length)];
        return toLeadNote(note);
    }

    // Sceglie una nota vicina nella scala (dir = +1 o -1)
    function pickNeighbor(sectionScale, note, dir) {
        const nat = sectionScale.map(n => nearestNatural(n));
        const base = nearestNatural(note.replace("4", ""));

        const idx = nat.indexOf(base);
        if (idx === -1) return toLeadNote(base);

        const idx2 = Math.min(nat.length - 1, Math.max(0, idx + dir));
        return toLeadNote(nat[idx2]);
    }

    // Quinta naturale (mantiene solo la lettera, ma la scala corregge i bemolle)
    const fifthMap = {
        "C": "G",
        "D": "A",
        "E": "B",
        "F": "C",
        "G": "D",
        "A": "E",
        "B": "F"
    };

    function getFifth(noteLetter) {
        return fifthMap[noteLetter] || "G";
    }

    // ------------------------------------------------------------
    // INFLUENZA IMMAGINE
    // ------------------------------------------------------------

    function getThemeProfile(imageParams) {
        return {
            energy: imageParams.energy ?? 0.5,
            darkness: imageParams.texture ?? 0.5,      // texture = “darkness”
            color: imageParams.complexity ?? 0.5,      // complexity = “colorfulness”
            calm: 1 - (imageParams.energy ?? 0.5)      // calm inverso dell’energia
        };
    }

    // ------------------------------------------------------------
    // GENERAZIONE MISURA 1
    // ------------------------------------------------------------

    function generateMeasure1(sectionScale, profile) {

        const events = [];

        // 1) Nota iniziale: salto di quinta o tonica
        const root = pickScaleNote(sectionScale);
        const rootLetter = nearestNatural(root.replace("4", ""));

        const startLetter =
            profile.energy > 0.6
                ? getFifth(rootLetter)
                : rootLetter;

        const startNote = toLeadNote(startLetter);

        events.push({
            beatOffset: 0,
            note: startNote,
            duration: 0.5,
            velocity: 0.95
        });

        // 2) Frase ascendente o discendente
        const dir = profile.darkness > 0.5 ? -1 : 1;

        const mid = pickScaleNote(sectionScale);
        const mid2 = pickNeighbor(sectionScale, mid, dir);

        events.push({
            beatOffset: 0.5,
            note: mid,
            duration: 0.5,
            velocity: 0.85
        });

        events.push({
            beatOffset: 1,
            note: mid2,
            duration: 0.5,
            velocity: 0.85
        });

        // 3) Passing note
        if (profile.color > 0.5) {
            const pass = pickScaleNote(sectionScale);
            events.push({
                beatOffset: 1.5,
                note: pass,
                duration: 0.25,
                velocity: 0.75
            });
        }

        // 4) Nota lunga finale
        const end = pickScaleNote(sectionScale);

        events.push({
            beatOffset: 2,
            note: end,
            duration: profile.calm > 0.5 ? 2 : 1,
            velocity: 0.9
        });

        return events;
    }

    // ------------------------------------------------------------
    // GENERAZIONE MISURA 2 (variazione)
    // ------------------------------------------------------------

    function generateMeasure2(sectionScale, profile, measure1) {

        const events = [];

        // Prima nota variata
        const first = measure1[0].note;
        const embellish =
            profile.color > 0.6
                ? pickScaleNote(sectionScale)
                : first;

        events.push({
            beatOffset: 4,
            note: embellish,
            duration: 0.5,
            velocity: 0.95
        });

        // Variazione frase
        const mid = pickScaleNote(sectionScale);
        const mid2 = pickScaleNote(sectionScale);

        events.push({
            beatOffset: 4.5,
            note: mid,
            duration: 0.5,
            velocity: 0.85
        });

        events.push({
            beatOffset: 5,
            note: mid2,
            duration: 0.5,
            velocity: 0.85
        });

        // Passing note
        if (profile.color > 0.7) {
            const pass = pickScaleNote(sectionScale);
            events.push({
                beatOffset: 5.5,
                note: pass,
                duration: 0.25,
                velocity: 0.75
            });
        }

        // Chiusura sulla tonica o quinta
        const root = pickScaleNote(sectionScale);
        const rootLetter = nearestNatural(root.replace("4", ""));

        const closeLetter =
            profile.darkness > 0.5
                ? rootLetter
                : getFifth(rootLetter);

        const close = toLeadNote(closeLetter);

        events.push({
            beatOffset: 6,
            note: close,
            duration: profile.calm > 0.5 ? 2 : 1,
            velocity: 0.9
        });

        return events;
    }

    // ------------------------------------------------------------
    // GENERATORE PRINCIPALE
    // ------------------------------------------------------------

    function generateTheme(section, sectionScale, progression) {
        const profile = getThemeProfile(imageParams);

        const m1 = generateMeasure1(sectionScale, profile);
        const m2 = generateMeasure2(sectionScale, profile, m1);

        return [...m1, ...m2];
    }

    return { generateTheme };
}
