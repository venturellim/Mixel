export function createMetalEngine() {

    console.log("⚡ Engine METAL creato (test)");

    let interval = null;
    let currentTime = 0;
    const totalDuration = 120; // 2 minuti

    function update() {
        currentTime += 0.1;

        if (currentTime >= totalDuration) {
            stop();
        }

        window.dispatchEvent(new CustomEvent("engineTick", {
            detail: { currentTime, totalDuration }
        }));
    }

    function play() {
        if (interval) return;
        console.log("▶ PLAY");
        interval = setInterval(update, 100);
    }

    function pause() {
        console.log("⏸ PAUSE");
        clearInterval(interval);
        interval = null;
    }

    function stop() {
        console.log("⏹ STOP");
        clearInterval(interval);
        interval = null;
        currentTime = 0;

        window.dispatchEvent(new CustomEvent("engineTick", {
            detail: { currentTime, totalDuration }
        }));
    }

    function seek(seconds) {
        currentTime = seconds;

        window.dispatchEvent(new CustomEvent("engineTick", {
            detail: { currentTime, totalDuration }
        }));
    }

    return {
        play,
        pause,
        stop,
        seek,
        totalDuration
    };
}