// scoreUI.js — ver. 014
// Fix: Tasto chiusura (Z-Index), Batteria 8.1, Canali Xtra, No Ottave

console.log("scoreUI.js ver. 014 loaded");

export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.zIndex = "9998"; // Sotto il tasto
        this.canvas.style.display = "none";

        this.isVisible = false;
        this.currentGenre = "metal";
        this.notes = [];
        this.currentSection = "";

        this.bgImage = new Image();
        this.bgImage.src = "Pentagramma.jpg"; 
        this.imageLoaded = false;
        this.bgImage.onload = () => { this.imageLoaded = true; };

        // --- FIX TASTO CHIUSURA ---
        this.closeBtn = document.createElement("button");
        this.closeBtn.innerHTML = "✕";
        this.closeBtn.style.position = "fixed";
        this.closeBtn.style.top = "20px";
        this.closeBtn.style.right = "20px";
        this.closeBtn.style.zIndex = "9999"; // SEMPRE SOPRA
        this.closeBtn.style.width = "40px";
        this.closeBtn.style.height = "40px";
        this.closeBtn.style.cursor = "pointer";
        this.closeBtn.style.display = "none";
        this.closeBtn.style.backgroundColor = "rgba(0,0,0,0.6)";
        this.closeBtn.style.color = "white";
        this.closeBtn.style.border = "none";
        this.closeBtn.style.borderRadius = "50%";
        this.closeBtn.style.fontSize = "20px";
        
        this.closeBtn.onclick = (e) => {
            e.stopPropagation(); // Evita interferenze
            this.hide();
        };

        this.themes = {
            metal: { "Lead": "GT LEAD", "LeadXtra": "", "Rhythm": "GT RHYTHM", "RhythmXtra": "", "Bass": "BASS", "BassXtra": "", "Drums": "DRUMS" },
            orchestra: { "Lead": "VIOLIN", "LeadXtra": "VIOLA", "Rhythm": "HARPSICHORD", "RhythmXtra": "", "Bass": "DOUBLE BASS", "BassXtra": "CELLO", "Drums": "TIMPANI" },
            piano: { "Lead": "PIANO R", "LeadXtra": "", "Rhythm": "PIANO L", "RhythmXtra": "" }
        };

        this.initCanvas();
        window.addEventListener("resize", () => this.initCanvas());
    }

    setTheme(genre) {
        if (this.themes[genre]) this.currentGenre = genre;
    }

    cleanNoteLabel(note) {
        if (!note || typeof note !== 'string') return "";
        if (["Kick", "Snare", "HiHat", "Crash", "Timpano"].some(t => note.includes(t))) return note;
        return isNaN(parseInt(note[1])) ? note.substring(0, 2) : note.substring(0, 1);
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (!this.canvas.parentElement) document.body.appendChild(this.canvas);
        if (!this.closeBtn.parentElement) document.body.appendChild(this.closeBtn);
        this.playheadX = this.canvas.width * 0.85;
        this.leftLimit = this.canvas.width * 0.12;
    }

    show() {
        this.isVisible = true;
        this.canvas.style.display = "block";
        this.closeBtn.style.display = "block";
        this.render(); 
    }

    hide() {
        this.isVisible = false;
        this.canvas.style.display = "none";
        this.closeBtn.style.display = "none";
        this.notes = []; 
    }

    addNote(track, note, section) {
        this.currentSection = section;
        if (this.notes.length > 500) this.notes.shift();
        this.notes.push({
            x: this.playheadX,
            track: track,
            label: this.cleanNoteLabel(note),
            index: Date.now() + Math.random() 
        });
    }

    render() {
        if (!this.isVisible) return;
        const { ctx, canvas, playheadX, leftLimit, bgImage, imageLoaded } = this;
        const currentLabels = this.themes[this.currentGenre] || this.themes.metal;
        
        const tracksY = { "Lead": 0.22, "LeadXtra": 0.22, "Rhythm": 0.45, "RhythmXtra": 0.45, "Bass": 0.70, "BassXtra": 0.70, "Drums": 0.88 };

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        if (imageLoaded) ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

        // Playhead
        ctx.strokeStyle = "#ff000022";
        ctx.beginPath(); ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); ctx.stroke();

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const baseT = n.track.replace("Xtra", "");
            const trackY_ratio = tracksY[n.track];
            if(!trackY_ratio) continue;
            
            let y = canvas.height * trackY_ratio;
            n.x -= 3.5; 

            if (n.x > leftLimit) {
                if (n.track === "Drums") {
                    ctx.fillStyle = "#000";
                    if (n.label.includes("Kick"))  y += 6;
                    if (n.label.includes("Snare")) y -= 2;
                    if (n.label.includes("HiHat")) y -= 12;
                    if (n.label.includes("Crash")) y -= 22;

                    if (n.label.includes("Kick") || n.label.includes("Snare") || n.label.includes("Timpano")) {
                        ctx.fillRect(n.x - 3, y - 3, 6, 6);
                    } else {
                        ctx.font = "bold 10px sans-serif";
                        ctx.fillText("✕", n.x, y + 4);
                    }
                } else {
                    const isXtra = n.track.includes("Xtra");
                    const hasPartner = currentLabels[baseT + "Xtra"] !== "";

                    if (hasPartner) {
                        ctx.fillStyle = isXtra ? "#191970" : "#000000";
                        const rectY = isXtra ? y + 5 : y - 3;
                        ctx.fillRect(n.x - 3, rectY, 6, 6);
                        ctx.font = "bold 9px 'Courier New', monospace";
                        ctx.fillText(n.label, n.x, isXtra ? y - 25 : y - 12);
                    } else {
                        ctx.fillStyle = "#000000";
                        ctx.fillRect(n.x - 3, y - 3, 6, 6);
                        const isEven = Math.floor(n.index / 100) % 2 === 0;
                        ctx.font = "bold 9px 'Courier New', monospace";
                        ctx.fillText(n.label, n.x, isEven ? y - 12 : y - 22);
                    }
                }
            }
            if (n.x < leftLimit) this.notes.splice(i, 1);
        }
        requestAnimationFrame(() => this.render());
    }
}
