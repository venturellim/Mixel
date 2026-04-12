// scoreUI.js — ver. 003

console.log("scoreUI.js ver. 003.2 loaded");

export class scoreVisualizer {
    constructor() {
        this.canvas = document.createElement("canvas");
        this.ctx = this.canvas.getContext("2d");
        
        // --- 1. CARICAMENTO IMMAGINE SFONDO ---
        this.bgImage = new Image();
        // Assicurati che l'immagine sia nella stessa cartella o metti il percorso corretto
        this.bgImage.src = "Pentagramma.jpg"; // Metti il nome esatto del tuo file
        
        this.imageLoaded = false;
        this.bgImage.onload = () => {
            this.imageLoaded = true;
            console.log("✅ Immagine pentagramma caricata.");
        };

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
        this.canvas.id = "scoreCanvas"; 
        
        if (!this.canvas.parentElement) document.body.appendChild(this.canvas);
        if (!this.closeBtn.parentElement) document.body.appendChild(this.closeBtn);
        
        // Punto di "nascita" delle note: a DESTRA (85%)
        this.playheadX = this.canvas.width * 0.85;
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
        if (this.notes.length > 400) this.notes.shift(); // Aumentiamo un po' il buffer

        this.notes.push({
            x: this.playheadX,
            track: track,
            label: note,
            time: Date.now()
        });
    }

    render() {
        if (!this.isVisible) return;

        const { ctx, canvas, playheadX, bgImage, imageLoaded } = this;
        
        // --- 2. POSIZIONAMENTO ADATTIVO CORSIE ---
        // Dobbiamo allineare le nostre corsie ai 4 righi musicali dell'immagine.
        // L'immagine ha una sua "griglia" interna. Queste percentuali sono stime
        // basate sull'immagine vuota, vanno adattate per far cadere le note
        // esattamente "tra le righe" dei 4 pentagrammi.
        const tracks = {
            "Lead":   { y: 0.22, label: "GT LEAD" },    // Primo pentagramma (alto)
            "Rhythm": { y: 0.42, label: "GT RHYTHM" },  // Secondo
            "Bass":   { y: 0.62, label: "BASS" },       // Terzo
            "Drums":  { y: 0.82, label: "DRUMS" }       // Quarto (basso)
        };

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // --- 3. DISEGNO SFONDO ---
        // Disegna l'immagine di sfondo vuota su tutto il canvas
        if (imageLoaded) {
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        } else {
            // Fallback se l'immagine non si carica (carta avorio)
            ctx.fillStyle = "#fffaf0";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }

        // Titolo Sezione (Cambiato font e posizionamento per non coprire il pentagramma)
        if (this.currentSection) {
            ctx.fillStyle = "#000";
            ctx.font = "bold 28px 'Times New Roman', serif"; // Font più classico
            ctx.textAlign = "center";
            // Lo alziamo un po' di più per non toccare il primo rigo
            ctx.fillText(this.currentSection.toUpperCase(), canvas.width / 2, canvas.height * 0.08); 
        }

        // Disegna nomi strumenti (A SINISTRA, sopra le corsie)
        // Usiamo un font più pulito per l'etichetta dello strumento
        Object.keys(tracks).forEach(key => {
            const trackY = canvas.height * tracks[key].y;
            
            ctx.fillStyle = "#666";
            ctx.font = "bold 13px sans-serif";
            ctx.textAlign = "left";
            // Scriviamo il nome dello strumento leggermente a sinistra e in alto
            ctx.fillText(tracks[key].label, canvas.width * 0.02, trackY - 15);
        });

        // --- 4. LINEA DI ESECUZIONE NERA (A DESTRA) ---
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(playheadX, 0); ctx.lineTo(playheadX, canvas.height); ctx.stroke();

        // Disegna Note
        // Usiamo un carattere monospace pulito per le note
        ctx.font = "bold 11px 'Courier New', monospace"; 
        ctx.textAlign = "center";

        for (let i = this.notes.length - 1; i >= 0; i--) {
            const n = this.notes[i];
            const trackCfg = tracks[n.track];
            if(!trackCfg) continue;
            
            const y = canvas.height * trackCfg.y;
            // Velocità adattata: 3.5 per farlo scorrere fluido
            n.x -= 3.5; 

            // quadratino tecnico
            ctx.fillStyle = "#000";
            ctx.fillRect(n.x - 3, y - 3, 6, 6); 

            // Se non è batteria, scrivi la nota (es. E2)
            if (n.track !== "Drums") {
                // Posizioniamo il testo sopra il quadratino
                ctx.fillText(n.label, n.x, y - 12);
            }

            if (n.x < -100) this.notes.splice(i, 1);
        }

        requestAnimationFrame(() => this.render());
    }
}
