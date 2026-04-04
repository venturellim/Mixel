// drumEngine.js — ver. 010 (TOTAL SYNC)
import * as Tone from "https://esm.sh/tone";

export function initDrumEngine(instruments, params, rand) {
    const { drums } = instruments;
    const secondsPerBeat = 60 / params.bpm;

    return {
        scheduleSection: (section, riffEvents) => {
            // 1. KICK (Cassa): segue ogni singolo trigger della chitarra
            riffEvents.forEach(ev => {
                if (ev.isKickTrigger) {
                    const time = section.startTime + ev.beatOffset * secondsPerBeat;
                    Tone.Transport.schedule(t => drums.player("kick").start(t), time);
                }
            });

            // 2. SNARE (Rullante): 2 e 4 fisso per il "tiro"
            const totalBeats = section.measures * 4;
            for (let b = 0; b < totalBeats; b++) {
                if (b % 4 === 1 || b % 4 === 3) {
                    const time = section.startTime + b * secondsPerBeat;
                    Tone.Transport.schedule(t => drums.player("snare").start(t), time);
                }
            }

            // 3. HI-HAT/RIDE: Ottavi costanti
            for (let b = 0; b < totalBeats * 2; b++) {
                const time = section.startTime + b * (secondsPerBeat * 0.5);
                const sample = (section.name === "chorus") ? "ride" : "hihat";
                Tone.Transport.schedule(t => drums.player(sample).start(t, 0, "16n"), time);
            }
        }
    };
}
