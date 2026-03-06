import * as Tone from "https://esm.sh/tone";

export function createMetalDrumEngine({
    drums,
    style,
    brightness,
    dna,
    rand
}) {

    let step = 0;

    function play(time) {

        // =====================
        // KICK
        // =====================

        if (style === "thrash") {

            if (step % 2 === 0)
                drums.player("kick").start(time);

        }

        else if (style === "power") {

            if (step === 0 || step === 4 || step === 8 || step === 12)
                drums.player("kick").start(time);

        }

        else if (style === "doom") {

            if (step === 0 || step === 8)
                drums.player("kick").start(time);

        }

        else { // heavy

            if (step % 4 === 0)
                drums.player("kick").start(time);

        }


        // =====================
        // SNARE
        // =====================

        if (step === 4 || step === 12)
            drums.player("snare").start(time);


        // =====================
        // HIHAT / RIDE
        // =====================

        if (brightness > 0.6) {

            if (step % 2 === 0)
                drums.player("ride").start(time);

        } else {

            drums.player("hihat").start(time);

        }


        // =====================
        // OPEN HAT ACCENT
        // =====================

        if (step === 7 || step === 15) {

            if (rand() > 0.7)
                drums.player("openhat").start(time);

        }


        // =====================
        // CRASH
        // =====================

        if (step === 0) {

            if (rand() > 0.5)
                drums.player("crash1").start(time);
            else
                drums.player("crash2").start(time);

        }


        // =====================
        // CHINA (metal accent)
        // =====================

        if (style === "thrash" && rand() > 0.8) {

            if (step === 8)
                drums.player("china").start(time);

        }


        // =====================
        // TOM FILLS
        // =====================

        if (step === 15 && rand() > 0.6) {

            drums.player("tom1").start(time);
            drums.player("tom2").start(time + 0.05);
            drums.player("tom3").start(time + 0.1);
            drums.player("tom4").start(time + 0.15);

        }

        step++;

        if (step >= 16)
            step = 0;

    }

    return { play };

}