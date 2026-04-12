// scoreUI.js — ver. 072

console.log("scoreUI.js ver. 003 loaded");

export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        // Tasto di chiusura
        this.closeBtn = document.createElement("button");
        this.closeBtn.innerHTML = "✕";
        this.closeBtn.className = "close-score-btn";
        this.closeBtn.onclick = () => this.hide();

        this.notes = [];
        this.currentSection = "";
        this.isVisible = false;

        this.initCanvas();
        window.addEventListener("resize", () => this.initCanvas());
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.zIndex = "10000"; // Sopra l'interfaccia standard
        this.canvas.style.background = "#fffaf0"; // Bianco "carta" leggermente avorio
        this.canvas.style.display = "none";
        this.closeBtn.style.display = "none";
        
        document.body.appendChild(this.canvas);
        document.body.appendChild(this.closeBtn);
        this.playheadX = this.canvas.width * 0.85;
    }

    show() {
        this.isVisible = true;
        this.canvas.style.display = "block";
        this.closeBtn.style.display = "flex";
        this.render(); // Avvia il loop di rendering
    }

    hide() {
        this.isVisible = false;
        this.canvas.style.display = "none";
        this.closeBtn.style.display = "none";
        this.notes = []; // Pulisce le note quando chiudi
    }

    addNote(track, note, section) {
        this.currentSection = section;
        if (this.notes.length > 300) this.notes.shift();

        this.notes.push({
            x: this.playheadX,
            track: track,
            label: note,
            time: Date.now()
        });
    }

    render() {
        if (!this.isVisible) return; // Ferma il loop se nascosto

        const { ctx, canvas, playheadX } = this;
        const tracks = {
            "Lead":   { y: 0.25, label: "GT LEAD" },
            "Rhythm": { y: 0.45, label: "GT RHYTHM" },
            "Bass":   { y: 0.65, label: "BASS" },
            "Drums":  { y: 0.85, label: "DRUMS" }
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Titolo Sezione
        if (this.currentSection) {
            ctx.fillStyle = "#000";
            ctx.font = "bold 24px Georgia";
            ctx.textAlign = "center";
            ctx.fillText(this.currentSection.toUpperCase(), canvas.width / 2, 60);
        }

        // Disegna linee corsie e nomi strumenti
        Object.keys(tracks).forEach(key => {
            const trackY = canvas.height * tracks[key].y;
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, trackY); ctx.lineTo(canvas.width, trackY); ctx.stroke();

            ctx.fillStyle = "#666";
            ctx.font = "bold 12px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(tracks[key].label, 30, trackY - 10);
        });

        // Linea Playhead Nera a DESTRA
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); ctx.stroke();

        // Disegna Note
        ctx.font = "10px 'Courier New'";
        ctx.textAlign = "center";

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackCfg = tracks[n.track];
            if(!trackCfg) continue;
            
            const y = canvas.height * trackCfg.y;
            n.x -= 4; 

            ctx.fillStyle = "#000";
            ctx.fillRect(n.x - 3, y - 3, 6, 6); // Quadratini più visibili

            if (n.track !== "Drums") {
                ctx.fillText(n.label, n.x, y - 12);
            }

            if (n.x < -50) this.notes.splice(i, 1);
        }

        requestAnimationFrame(() => this.render());
    }
}
