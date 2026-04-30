// danceFXEngine.js — ver. 001 (Eurodance FX)
import * as Tone from "https://esm.sh/tone";

console.log("danceFXEngine.js ver. 001 loaded");

// ------------------------------------------------------------
// FX ENGINE (Riser / Downlifter / Build FX)
// ------------------------------------------------------------
export function scheduleDanceFX(
    section,
    progression,
    instruments,
    params,
    rand,
    measureDur,
    nextSectionRoot,
    score
) {
    const { fx } = instruments;
    if (!fx) return;

    const { riser, down } = fx;

    const name = section?.name?.toLowerCase() || "";
    const isIntro = name.includes("intro");
    const isBuild = name.includes("build");
    const isDrop  = name.includes("drop");
    const isRiff  = name.includes("riff");
    const isBreak = name.includes("break");
    const isOutro = name.includes("outro");

    // Nessun FX in break/outro
    if (isBreak || isOutro) return;

    const sectionStart = section.startTime;
    const sectionEnd   = section.startTime + section.measures * measureDur;

    // --------------------------------------------------------
    // 1. RISER PRIMA DEL DROP
    // --------------------------------------------------------
    if (isBuild) {
        const riserStart = sectionEnd - measureDur * 2; // 2 misure prima del drop

        Tone.Transport.schedule(t => {
            riser.volume.value = -12;
            riser.triggerAttack(t);

            // Crescita graduale
            riser.volume.rampTo(0, measureDur * 2);

            if (score) score.addNote("FX", "Riser", section.name);

        }, riserStart);

        // Stop riser al drop
        Tone.Transport.schedule(t => {
            riser.triggerRelease(t);
        }, sectionEnd);
    }

    // --------------------------------------------------------
    // 2. DOWNLIFTER DOPO IL DROP
    // --------------------------------------------------------
    if (isDrop) {
        const downStart = sectionStart + 0.1; // subito dopo il primo kick

        Tone.Transport.schedule(t => {
            down.volume.value = -6;
            down.triggerAttackRelease("2n", t);

            if (score) score.addNote("FX", "Downlifter", section.name);

        }, downStart);
    }

    // --------------------------------------------------------
    // 3. MINI-RISER NEL BUILD (ogni 4 misure)
    // --------------------------------------------------------
    if (isBuild) {
        for (let m = 0; m < section.measures; m += 4) {

            const miniStart = section.startTime + m * measureDur;

            Tone.Transport.schedule(t => {
                riser.volume.value = -18;
                riser.triggerAttackRelease("1n", t);

                if (score) score.addNote("FX", "MiniRiser", section.name);

            }, miniStart);
        }
    }

    // --------------------------------------------------------
    // 4. TRANSIZIONE TRA SEZIONI (se non è break/outro)
    // --------------------------------------------------------
    if (!isBreak && !isOutro) {
        Tone.Transport.schedule(t => {
            down.volume.value = -10;
            down.triggerAttackRelease("4n", t);

            if (score) score.addNote("FX", "Transition", section.name);

        }, sectionEnd - 0.05);
    }
}
