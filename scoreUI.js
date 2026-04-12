// scorrUI.js — ver. 070 (Professional Multi-Track)

console.log("scoreUI.js ver. 001 loaded");

export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        document.body.appendChild(this.canvas);
        
        this.notes = [];
        this.currentSection = "";
        this.playheadX = 0;
        
        // Configurazione corsie (Y in percentuale)
        this.tracks = {
            "Lead":   { y: 0.25, label: "GT LEAD",  color: "#000" },
            "Rhythm": { y: 0.45, label: "GT RHYTHM", color: "#000" },
            "Bass":   { y: 0.65, label: "BASS",      color: "#000" },
            "Drums":  { y: 0.85, label: "DRUMS",     color: "#000" }
        };

        this.initCanvas();
        window.addEventListener("resize", () => this.initCanvas());
        this.render();
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.style.position = "fixed";
        this.canvas.style.top = "0";
        this.canvas.style.left = "0";
        this.canvas.style.zIndex = "1"; // Sotto la UI ma sopra lo sfondo
        this.canvas.style.pointerEvents = "none";
        this.playheadX = this.canvas.width * 0.85; // Linea di esecuzione a DESTRA
    }

    /**
     * @param {string} track - "Lead", "Rhythm", "Bass", "Drums"
     * @param {string} note - Nome nota (es. "E2")
     * @param {string} section - Nome sezione (es. "Verse")
     */
    addNote(track, note, section) {
        this.currentSection = section;
        
        // Limite per non ingolfare il canvas nelle parti veloci
        if (this.notes.length > 300) this.notes.shift();

        this.notes.push({
            x: this.playheadX,
            track: track,
            label: note,
            time: Date.now()
        });
    }

    render() {
        const { ctx, canvas, tracks, playheadX } = this;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // 1. DISEGNA TITOLO SEZIONE (AL CENTRO, NERO)
        if (this.currentSection) {
            ctx.fillStyle = "#000";
            ctx.font = "bold 20px Georgia";
            ctx.textAlign = "center";
            ctx.fillText(this.currentSection.toUpperCase(), canvas.width / 2, 50);
        }

        // 2. DISEGNA LE CORSIE E LE ETICHETTE STRUMENTI
        Object.keys(tracks).forEach(key => {
            const trackY = canvas.height * tracks[key].y;
            
            // Linea orizzontale della corsia (molto leggera)
            ctx.strokeStyle = "rgba(0,0,0,0.1)";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(0, trackY);
            ctx.lineTo(canvas.width, trackY);
            ctx.stroke();

            // Etichetta Strumento (a SINISTRA, sopra la linea)
            ctx.fillStyle = "#555";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(tracks[key].label, 20, trackY - 5);
        });

        // 3. DISEGNA LA LINEA DI ESECUZIONE (NERA, A DESTRA)
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0);
        ctx.lineTo(playheadX, canvas.height);
        ctx.stroke();

        // 4. DISEGNA LE NOTE
        ctx.font = "10px 'Courier New'"; // RISOLUZIONE ALTA: carattere piccolo
        ctx.textAlign = "center";

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackCfg = tracks[n.track] || tracks["Rhythm"];
            const y = canvas.height * trackCfg.y;

            // Movimento verso sinistra
            n.x -= 3.5; 

            // Disegna quadratino tecnico
            ctx.fillStyle = "#000";
            ctx.fillRect(n.x - 2, y - 2, 4, 4);

            // Disegna etichetta nota (solo se non è batteria, per pulizia)
            if (n.track !== "Drums") {
                ctx.fillText(n.label, n.x, y - 8);
            }

            // Rimuovi note fuori schermo a sinistra
            if (n.x < -50) this.notes.splice(i, 1);
        }

        requestAnimationFrame(() => this.render());
    }
}
