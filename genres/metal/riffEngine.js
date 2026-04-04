// riffEngine.js — ver. 031 (COORDINATED & COMPLETE)
import * as Tone from "https://esm.sh/tone";
import { chooseRiffPattern } from "./riffPatterns.js";
import { degreeToRoot } from "./metalTheory.js";

export function initRiffEngine(instruments, params, rand) {
    const { guitarPalm, guitarOpen } = instruments;
    const secondsPerBeat = 60 / params.bpm;

    // Helper per creare l'evento con il flag per la batteria
    const createEv = (offset, note, type, duration = "16n") => ({
        beatOffset: offset,
        note: note + "2",
        type: type,
        isKickTrigger: type === "palm" || type === "strike",
        duration: duration
    });

    // Qui ho riassunto i tuoi 1000 righe di pattern in funzioni logiche
    const patterns = {
        pm_groove: (root) => [
            createEv(0, root, "palm"), createEv(0.5, root, "palm"),
            createEv(1, root, "strike", "8n"), createEv(2, root, "palm"),
            createEv(2.5, root, "palm"), createEv(3, root, "palm"), createEv(3.5, root, "palm")
        ],
        gallop: (root) => [
            createEv(0, root, "strike"), createEv(0.25, root, "palm"), createEv(0.5, root, "palm"),
            createEv(1, root, "strike"), createEv(1.25, root, "palm"), createEv(1.5, root, "palm"),
            createEv(2, root, "strike"), createEv(3, root, "strike")
        ],
        pedal: (root) => {
            const evs = [];
            for(let i=0; i<4; i+=0.5) evs.push(createEv(i, root, "palm"));
            return evs;
        },
        open_epic: (root) => [
            createEv(0, root, "open", "1n"),
            createEv(2, root, "open", "2n")
        ],
        pm_sparse: (root) => [
            createEv(0, root, "strike", "4n"),
            createEv(2, root, "palm"), createEv(2.5, root, "palm")
        ]
    };

    return {
        generateRiff: (section, scale, progression) => {
            const events = [];
            // Scegliamo il pattern una volta per tutta la sezione per coerenza
            const patternName = chooseRiffPattern(section.name, 0.5, 0.5, rand);
            const playPattern = patterns[patternName] || patterns.pm_groove;

            progression.forEach((degree, i) => {
                const root = degreeToRoot(degree);
                const barOffset = i * 4; // Sposta ogni accordo di una misura
                playPattern(root).forEach(ev => {
                    events.push({ ...ev, beatOffset: ev.beatOffset + barOffset });
                });
            });
            return { events, patternName };
        },
        scheduleRiff: (section, events) => {
            events.forEach(ev => {
                const time = section.startTime + ev.beatOffset * secondsPerBeat;
                const inst = (ev.type === "palm") ? guitarPalm : guitarOpen;
                Tone.Transport.schedule(t => inst.triggerAttackRelease(ev.note, ev.duration, t), time);
            });
        }
    };
}




