export function createMetalEngine() {

    console.log("⚡ Engine METAL creato (test)");

    let isPlaying = false;

    return {

        totalDuration: 120,

        play() {
            console.log("▶ PLAY metal");
            isPlaying = true;
        },

        pause() {
            console.log("⏸ PAUSE metal");
            isPlaying = false;
        },

        stop() {
            console.log("⏹ STOP metal");
            isPlaying = false;
        },

        seek(sec) {
            console.log("⏩ Seek:", sec);
        },

        jumpTo(section) {
            console.log("Jump to:", section);
        }
    };
    
    console.log("🔎 currentEngine:", currentEngine);
    console.log("🔎 typeof currentEngine:", typeof currentEngine);
    console.log("🔎 metodi engine:", Object.keys(currentEngine));
}