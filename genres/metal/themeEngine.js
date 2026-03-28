// themeEngine.js — versione 001
// Generatore di tema power metal (2 misure, lead ibrida, immagine-influenced)

import { nearestNatural } from "../../utils/harmonyUtils.js";

console.log("themeEngine.js ver. 001.1 loaded");

export function initThemeEngine(metalParams, imageParams, rand)
 {

    const secondsPerBeat = 60 / params.bpm;

    // ------------------------------------------------------------
    // UTILITIES
    // ------------------------------------------------------------

    // Converte nota in ottava 4 (es: "E" → "E4")
    function toLeadNote(letter) {
        return letter + "4";
    }

    // Sceglie una nota valida dalla scala della sezione
    function pickScaleNote(sectionScale) {
        if (!sectionScale || sectionScale.length === 0) return "C4";

        const nat = sectionScale
            .map(n => nearestNatural(n)) // niente diesis
            .filter(n => n !== undefined)
            .map(n => n[0]); // solo lettera

        if (nat.length === 0) return "C4";

        const letter = nat[Math.floor(rand() * nat.length)];
        return toLeadNote(letter);
    }

    // Intervallo di quinta naturale
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
            darkness: imageParams.darkness ?? 0.5,
            color: imageParams.colorfulness ?? 0.5,
            calm: imageParams.calm ?? 0.5
        };
    }

    // ------------------------------------------------------------
    // GENERAZIONE MISURA 1
    // ------------------------------------------------------------

    function generateMeasure1(sectionScale, profile) {

        const events = [];

        // 1) Nota iniziale: salto di quinta o ottava
        const root = pickScaleNote(sectionScale);
        const rootLetter = root[0];

        const startNoteLetter =
            profile.energy > 0.6
                ? getFifth(rootLetter) // salto di quinta
                : rootLetter;          // nota semplice

        const startNote = toLeadNote(startNoteLetter);

        events.push({
            beatOffset: 0,
            note: startNote,
            duration: 0.5,
            velocity: 0.95
        });

        // 2) Frase discendente o ascendente
        const dir = profile.darkness > 0.5 ? -1 : 1;

        const midNote = pickScaleNote(sectionScale);
        const midLetter = midNote[0];

        const mid2Letter = nearestNatural(
            String.fromCharCode(midLetter.charCodeAt(0) + dir)
        )[0];

        const mid2 = toLeadNote(mid2Letter);

        events.push({
            beatOffset: 0.5,
            note: midNote,
            duration: 0.5,
            velocity: 0.85
        });

        events.push({
            beatOffset: 1,
            note: mid2,
            duration: 0.5,
            velocity: 0.85
        });

        // 3) Passing note (solo se colorfulness alta)
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
        const endNote = pickScaleNote(sectionScale);

        events.push({
            beatOffset: 2,
            note: endNote,
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

        // Copia la prima nota ma con abbellimento
        const first = measure1[0].note;
        const firstLetter = first[0];

        const embellish =
            profile.color > 0.6
                ? pickScaleNote(sectionScale)
                : first;

        events.push({
            beatOffset: 4, // misura 2
            note: embellish,
            duration: 0.5,
            velocity: 0.95
        });

        // Variazione della frase
        const mid = pickScaleNote(sectionScale);
        events.push({
            beatOffset: 4.5,
            note: mid,
            duration: 0.5,
            velocity: 0.85
        });

        const mid2 = pickScaleNote(sectionScale);
        events.push({
            beatOffset: 5,
            note: mid2,
            duration: 0.5,
            velocity: 0.85
        });

        // Passing note opzionale
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
        const rootLetter = root[0];
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
