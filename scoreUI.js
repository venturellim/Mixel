// scoreUI.js — ver. 005
// Full Responsive: percentuali per corsie, etichette e limiti di scorrimento.

console.log("scoreUI.js ver. 005.2 loaded");

export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        // --- 1. CARICAMENTO IMMAGINE SFONDO ---
        this.bgImage = new Image();
        this.bgImage.src = "Pentagramma.jpg"; 
        
        this.imageLoaded = false;
        this.bgImage.onload = () => {
            this.imageLoaded = true;
            console.log("✅ Immagine pentagramma caricata.");
        };

        // Tasto di chiusura "X"
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
        this.canvas.id = "scoreCanvas"; 
        
        if (!this.canvas.parentElement) document.body.appendChild(this.canvas);
        if (!this.closeBtn.parentElement) document.body.appendChild(this.closeBtn);
        
        // --- PARAMETRI RESPONSIVE ---
        // Punto di "nascita" delle note: a DESTRA (85% della larghezza)
        this.playheadX = this.canvas.width * 0.85;
        
        // Limite a SINISTRA: le note spariscono al 12% per non coprire le chiavi
        this.leftLimit = this.canvas.width * 0.12; 
    }

    show() {
        this.isVisible = true;
        this.canvas.style.display = "block";
        this.closeBtn.style.display = "flex";
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
        if (this.notes.length > 400) this.notes.shift();

        this.notes.push({
            x: this.playheadX,
            track: track,
            label: note,
            time: Date.now()
        });
    }

    render() {
        if (!this.isVisible) return;

        const { ctx, canvas, playheadX, leftLimit, bgImage, imageLoaded } = this;
        
        // --- 2. POSIZIONAMENTO CORSIE (Percentuali Altezza) ---
        const tracks = {
            "Lead":   { y: 0.24, label: "GT LEAD" },    
            "Rhythm": { y: 0.42, label: "GT RHYTHM" },  
            "Bass":   { y: 0.60, label: "BASS" },       
            "Drums":  { y: 0.76, label: "DRUMS" }       
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- 3. DISEGNO SFONDO ---
        if (imageLoaded) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#fffaf0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Titolo Sezione (Intro, Verse, ecc.)
        if (this.currentSection) {
            ctx.fillStyle = "#ff0000"; 
            ctx.font = "bold 22px serif"; 
            ctx.textAlign = "left";
            // Posizionato appena dopo il limite delle chiavi
            ctx.fillText(this.currentSection.toUpperCase(), leftLimit + 20, canvas.height * 0.12); 
        }

        // --- 4. DISEGNO NOMI STRUMENTI (Responsive a sinistra) ---
        Object.keys(tracks).forEach(key => {
            const trackY = canvas.height * tracks[key].y;
            ctx.fillStyle = "#444";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "left";
            // Posizionati al 2% della larghezza, sopra la linea
            ctx.fillText(tracks[key].label, canvas.width * 0.02, trackY - 15);
        });

        // --- 5. LINEA DI ESECUZIONE (PLAYHEAD) ---
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0); 
        ctx.lineTo(playheadX, canvas.height); 
        ctx.stroke();

        // --- 6. DISEGNO NOTE CON LIMITE DINAMICO ---
        ctx.font = "bold 10px 'Courier New', monospace"; 
        ctx.textAlign = "center";

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackCfg = tracks[n.track];
            if(!trackCfg) continue;
            
            const y = canvas.height * trackCfg.y;
            
            // Velocità: 3.5 pixel per frame (puoi aumentarla se vuoi più rapidità)
            n.x -= 3.5; 

            // Disegna solo se la nota è "dentro" lo spartito leggibile
            if (n.x > leftLimit) {
                ctx.fillStyle = "#000";
                ctx.fillRect(n.x - 3, y - 3, 6, 6); 

                if (n.track !== "Drums") {
                    ctx.fillText(n.label, n.x, y - 12);
                }
            }

            // Elimina la nota quando supera il limite sinistro
            if (n.x < leftLimit) {
                this.notes.splice(i, 1);
            }
        }

        requestAnimationFrame(() => this.render());
    }
}
