// scoreUI.js — ver. 007
// Universale: Supporto Temi (Metal/Piano) e Drum Map avanzata.

console.log("scoreUI.js ver. 007.1 loaded");

export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        this.bgImage = new Image();
        this.bgImage.src = "Pentagramma.jpg"; 
        
        this.imageLoaded = false;
        this.bgImage.onload = () => {
            this.imageLoaded = true;
            console.log("✅ Immagine pentagramma caricata.");
        };

        this.closeBtn = document.createElement("button");
        this.closeBtn.innerHTML = "✕";
        this.closeBtn.className = "close-score-btn";
        this.closeBtn.onclick = () => this.hide();

        this.notes = [];
        this.currentSection = "";
        this.isVisible = false;
        this.currentGenre = "metal"; // Default

        // --- GESTIONE ETICHETTE STRUMENTI ---
        this.themes = {
            metal: {
                "Lead": "GT LEAD",
                "Rhythm": "GT RHYTHM",
                "Bass": "BASS",
                "Drums": "DRUMS"
            },
            piano: {
                "Lead": "PIANO RIGHT",
                "Rhythm": "PIANO LEFT",
                "Bass": "AMBIENCE",
                "Drums": "PERCUSSION"
            }
        };

        this.initCanvas();
        window.addEventListener("resize", () => this.initCanvas());
    }

    // Metodo per cambiare il tema (chiamalo nel main.js)
    setTheme(genre) {
        if (this.themes[genre]) {
            this.currentGenre = genre;
            console.log(`🎵 Score Theme impostato su: ${genre}`);
        }
    }

    initCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.canvas.id = "scoreCanvas"; 
        
        if (!this.canvas.parentElement) document.body.appendChild(this.canvas);
        if (!this.closeBtn.parentElement) document.body.appendChild(this.closeBtn);
        
        this.playheadX = this.canvas.width * 0.85;
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
        const currentLabels = this.themes[this.currentGenre] || this.themes.metal;
        
        // --- 2. POSIZIONAMENTO CORSIE ---
        const tracks = {
            "Lead":   { y: 0.24, label: currentLabels["Lead"] },    
            "Rhythm": { y: 0.42, label: currentLabels["Rhythm"] },  
            "Bass":   { y: 0.60, label: currentLabels["Bass"] },       
            "Drums":  { y: 0.80, label: currentLabels["Drums"] }       
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (imageLoaded) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            ctx.fillStyle = "#fffaf0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Titolo Sezione
        if (this.currentSection) {
            ctx.fillStyle = "#ff0000"; 
            ctx.font = "bold 22px serif"; 
            ctx.textAlign = "left";
            ctx.fillText(this.currentSection.toUpperCase(), leftLimit + 20, canvas.height * 0.12); 
        }

        // --- 4. DISEGNO NOMI STRUMENTI (Dinamici) ---
        Object.keys(tracks).forEach(key => {
            const trackY = canvas.height * tracks[key].y;
            ctx.fillStyle = "#444";
            ctx.font = "bold 11px sans-serif";
            ctx.textAlign = "left";
            ctx.fillText(tracks[key].label, canvas.width * 0.02, trackY - 15);
        });

        // --- 5. LINEA DI ESECUZIONE ---
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); ctx.stroke();

        // --- 6. DISEGNO NOTE ---
        ctx.font = "bold 8px 'Courier New', monospace"; 
        ctx.textAlign = "center";

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackCfg = tracks[n.track];
            if(!trackCfg) continue;
            
            let y = canvas.height * trackCfg.y;
            
            // --- MAPPATURA SPECIFICA BATTERIA (Solo se Metal) ---
            if (this.currentGenre === "metal" && n.track === "Drums") {
                if (n.label.includes("Kick"))  y += 6;
                if (n.label.includes("Snare")) y -= 2;
                if (n.label.includes("HiHat")) y -= 12;
                if (n.label.includes("Crash")) y -= 22;
            }

            n.x -= 3.5; 

            if (n.x > leftLimit) {
                ctx.fillStyle = "#000";
                
                // Disegno differenziato: X per piatti, Quadrati per il resto
                if (this.currentGenre === "metal" && n.track === "Drums") {
                    if (n.label.includes("Kick") || n.label.includes("Snare")) {
                        ctx.fillRect(n.x - 3, y - 3, 6, 6);
                    } else {
                        ctx.font = "bold 8px sans-serif";
                        ctx.fillText("✕", n.x, y + 4);
                        ctx.font = "bold 8px 'Courier New', monospace";
                    }
                } else {
                    ctx.fillRect(n.x - 3, y - 3, 6, 6); 
                    ctx.fillText(n.label, n.x, y - 12);
                }
            }

            if (n.x < leftLimit) this.notes.splice(i, 1);
        }

        requestAnimationFrame(() => this.render());
    }
}
