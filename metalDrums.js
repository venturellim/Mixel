import * as Tone from "https://esm.sh/tone";

export function createMetalDrumEngine({
    drums,
    style,
    brightness,
    dna,
    rand
}) {

    // ============================
    // PARAMETRI ESTRATTI DAL DNA
    // ============================

    const complexity = (dna % 1000) / 1000;           // 0 → 1
    const texture    = ((dna >> 8)  % 1000) / 1000;   // 0 → 1
    const energy     = ((dna >> 16) % 1000) / 1000;   // 0 → 1
    const direction  = ((dna >> 24) % 1000) / 1000;   // 0 → 1

    let step = 0;
    let measure = 0;

    function play(time) {

        // =====================
        // KICK (dinamico)
        // =====================

        if (style === "thrash") {

            // doppio pedale + variazioni basate su energia
            if (step % 2 === 0 || (energy > 0.6 && rand() > 0.85))
                drums.player("kick").start(time);

        } else if (style === "power") {

            // 4/4 classico + raddoppi se energia alta
            if (step === 0 || step === 4 || step === 8 || step === 12)
                drums.player("kick").start(time);

            if (energy > 0.7 && (step === 2 || step === 10) && rand() > 0.7)
                drums.player("kick").start(time);

        } else if (style === "doom") {

            // kick lento ma pesante
            if (step === 0 || step === 8)
                drums.player("kick").start(time);

            if (energy > 0.8 && step === 12 && rand() > 0.8)
                drums.player("kick").start(time);

        } else { // heavy

            if (step % 4 === 0)
                drums.player("kick").start(time);

            if (energy > 0.5 && step === 6 && rand() > 0.8)
                drums.player("kick").start(time);
        }


        // =====================
        // SNARE + GHOST NOTES
        // =====================

        // backbeat
        if (step === 4 || step === 12)
            drums.player("snare").start(time);

        // ghost notes basate su texture
        if (texture > 0.4 && (step === 3 || step === 11) && rand() > 0.6)
            drums.player("ghost").start(time + Tone.Time("32n"));


        // =====================
        // HIHAT / RIDE (avanzati)
        // =====================

        if (brightness > 0.6) {

            // RIDE
            if (style === "thrash") {
                drums.player("ride").start(time);
                if (step % 4 === 0 && rand() > 0.5)
                    drums.player("ridebell").start(time);
            }

            else if (style === "power") {
                if (step % 2 === 0)
                    drums.player("ride").start(time);
                if (step % 4 === 0 && rand() > 0.6)
                    drums.player("ridebell").start(time);
            }

            else {
                drums.player("ride").start(time);
            }

        } else {

            // HI-HAT
            drums.player("hihat").start(time);

            // accenti basati su texture
            if (texture > 0.6 && step % 4 === 0 && rand() > 0.7)
                drums.player("hihat").start(time + Tone.Time("32n"));
        }


        // =====================
        // OPEN HAT ACCENT
        // =====================

        if ((step === 7 || step === 15) && rand() > 0.7)
            drums.player("openhat").start(time);


        // =====================
        // CRASH (variazioni ogni 4 misure)
        // =====================

        if (step === 0) {

            // immagini luminose → crash più frequenti
            const crashChance = brightness > 0.7 ? 0.9 : 0.5;

            if (measure % 4 === 0 || rand() < crashChance) {
                if (rand() > 0.5)
                    drums.player("crash1").start(time);
                else
                    drums.player("crash2").start(time);
            }
        }


        // =====================
        // CHINA (energia + complessità)
        // =====================

        if (energy > 0.6 && complexity > 0.5 && step === 8 && rand() > 0.7)
            drums.player("china").start(time);


        // =====================
        // TOM FILLS (musicali)
        // =====================

        if (step === 15 && rand() < complexity) {

            const spacing = Tone.Time("32n");

            drums.player("tom1").start(time);
            drums.player("tom2").start(time + spacing);
            drums.player("tom3").start(time + spacing * 2);
            drums.player("tom4").start(time + spacing * 3);

            // crash finale
            drums.player("crash2").start(time + spacing * 4);
        }


        // =====================
        // STEP & MEASURE COUNTER
        // =====================

        step++;
        if (step >= 16) {
            step = 0;
            measure++;
        }
    }

    return { play };
}
