//
// imageAnalysis.js
// Analisi visiva universale per il generatore musicale multi-genere
// Estrae solo parametri VISIVI, senza logica musicale.
// Risoluzione: 64×64
//

console.log("imageAnalysis.js ver. 002 loaded");

// -------------------------------------------------------------
// Utility
// -------------------------------------------------------------
function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
}

function normalize(v, min, max) {
    return (v - min) / (max - min);
}

// -------------------------------------------------------------
// Brightness (media luminanza)
// -------------------------------------------------------------
export function analyzeImageBrightness(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return 0.5;

    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    let total = 0;
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const brightness = 0.299 * r + 0.587 * g + 0.114 * b;
        total += brightness;
    }

    const avg = total / (data.length / 4);
    return avg / 255;
}

// -------------------------------------------------------------
// Average color (RGB medio)
// -------------------------------------------------------------
export function analyzeAverageColor(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);

    const data = ctx.getImageData(0, 0, 64, 64).data;

    let r = 0, g = 0, b = 0;
    let count = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
        r += data[i];
        g += data[i + 1];
        b += data[i + 2];
    }

    return {
        r: r / count,
        g: g / count,
        b: b / count
    };
}

// -------------------------------------------------------------
// Color temperature (0 = warm, 1 = cold)
// -------------------------------------------------------------
function computeColorTemperature(avgColor) {
    const { r, g, b } = avgColor;

    // Semplice: più blu = più freddo
    const warm = (r + g) / 2;
    const cold = b;

    return clamp(cold / (warm + cold + 1), 0, 1);
}

// -------------------------------------------------------------
// Photo DNA (hash deterministico)
// -------------------------------------------------------------
export function extractPhotoDNA(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = 32;
    canvas.height = 32;

    ctx.drawImage(img, 0, 0, 32, 32);
    const data = ctx.getImageData(0, 0, 32, 32).data;

    let hash = 0;
    for (let i = 0; i < data.length; i += 4) {
        hash = (hash * 31 + data[i] + data[i + 1] + data[i + 2]) >>> 0;
    }

    return hash;
}

// -------------------------------------------------------------
// Gaussian blur (per stabilizzare Sobel)
// -------------------------------------------------------------
function gaussianBlur(data, width, height) {
    const kernel = [1, 4, 6, 4, 1];
    const ksum = 16;

    const temp = new Uint8ClampedArray(data.length);
    const out = new Uint8ClampedArray(data.length);

    // Blur orizzontale
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            let r = 0, g = 0, b = 0;
            for (let k = -2; k <= 2; k++) {
                const xx = clamp(x + k, 0, width - 1);
                const idx = (y * width + xx) * 4;
                const w = kernel[k + 2];

                r += data[idx] * w;
                g += data[idx + 1] * w;
                b += data[idx + 2] * w;
            }

            const idx2 = (y * width + x) * 4;
            temp[idx2] = r / ksum;
            temp[idx2 + 1] = g / ksum;
            temp[idx2 + 2] = b / ksum;
            temp[idx2 + 3] = 255;
        }
    }

    // Blur verticale
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {

            let r = 0, g = 0, b = 0;
            for (let k = -2; k <= 2; k++) {
                const yy = clamp(y + k, 0, height - 1);
                const idx = (yy * width + x) * 4;
                const w = kernel[k + 2];

                r += temp[idx] * w;
                g += temp[idx + 1] * w;
                b += temp[idx + 2] * w;
            }

            const idx2 = (y * width + x) * 4;
            out[idx2] = r / ksum;
            out[idx2 + 1] = g / ksum;
            out[idx2 + 2] = b / ksum;
            out[idx2 + 3] = 255;
        }
    }

    return out;
}

// -------------------------------------------------------------
// Energy = contrasto globale (deviazione standard luminanza)
// -------------------------------------------------------------
export function analyzeEnergy(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    let luminances = [];
    for (let i = 0; i < data.length; i += 4) {
        const L = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        luminances.push(L);
    }

    const mean = luminances.reduce((a, b) => a + b, 0) / luminances.length;
    const variance = luminances.reduce((a, b) => a + (b - mean) ** 2, 0) / luminances.length;
    const std = Math.sqrt(variance);

    return clamp(std / 128, 0, 1);
}

// -------------------------------------------------------------
// Texture = densità bordi (Sobel magnitude)
// -------------------------------------------------------------
export function analyzeTexture(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    let data = ctx.getImageData(0, 0, 64, 64).data;

    data = gaussianBlur(data, 64, 64);

    const sobelX = [-1,0,1,-2,0,2,-1,0,1];
    const sobelY = [-1,-2,-1,0,0,0,1,2,1];

    let totalMag = 0;
    let count = 0;

    for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {

            let gx = 0, gy = 0;
            let idx = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {

                    const px = (y + ky) * 64 + (x + kx);
                    const L = 0.299 * data[px*4] + 0.587 * data[px*4+1] + 0.114 * data[px*4+2];

                    gx += L * sobelX[idx];
                    gy += L * sobelY[idx];
                    idx++;
                }
            }

            const mag = Math.sqrt(gx*gx + gy*gy);
            totalMag += mag;
            count++;
        }
    }

    const avgMag = totalMag / count;
    return clamp(avgMag / 200, 0, 1);
}

// -------------------------------------------------------------
// Complexity = varianza colori + entropia luminanza
// -------------------------------------------------------------
export function analyzeComplexity(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    let luminances = [];

    for (let i = 0; i < data.length; i += 4) {
        const L = 0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2];
        luminances.push(L);
    }

    const meanL = luminances.reduce((a,b)=>a+b,0)/luminances.length;
    const varL = luminances.reduce((a,b)=>a+(b-meanL)**2,0)/luminances.length;

    let hist = new Array(256).fill(0);
    for (let L of luminances) hist[Math.floor(L)]++;

    let entropy = 0;
    for (let h of hist) {
        if (h > 0) {
            const p = h / luminances.length;
            entropy -= p * Math.log2(p);
        }
    }

    const varNorm = clamp(varL / 5000, 0, 1);
    const entNorm = clamp(entropy / 8, 0, 1);

    return clamp((varNorm + entNorm) / 2, 0, 1);
}

// -------------------------------------------------------------
// Direction = direzione dominante bordi (0–1)
// -------------------------------------------------------------
export function analyzeDirection(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    let data = ctx.getImageData(0, 0, 64, 64).data;

    data = gaussianBlur(data, 64, 64);

    const sobelX = [-1,0,1,-2,0,2,-1,0,1];
    const sobelY = [-1,-2,-1,0,0,0,1,2,1];

    let hist = new Array(180).fill(0);

    for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {

            let gx = 0, gy = 0;
            let idx = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {

                    const px = (y + ky) * 64 + (x + kx);
                    const L = 0.299 * data[px*4] + 0.587 * data[px*4+1] + 0.114 * data[px*4+2];

                    gx += L * sobelX[idx];
                    gy += L * sobelY[idx];
                    idx++;
                }
            }

            const angle = Math.atan2(gy, gx) * (180 / Math.PI);
            const a = Math.floor((angle + 180) % 180);
            hist[a]++;
        }
    }

    let maxVal = 0;
    let maxIdx = 0;
    for (let i = 0; i < 180; i++) {
        if (hist[i] > maxVal) {
            maxVal = hist[i];
            maxIdx = i;
        }
    }

    return maxIdx / 179;
}

// Aggiungi questa funzione per calcolare l'entropia (mancante!)
export function analyzeEntropy(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    const data = ctx.getImageData(0, 0, 64, 64).data;

    // Calcola istogramma dei valori di luminanza
    let hist = new Array(256).fill(0);
    
    for (let i = 0; i < data.length; i += 4) {
        const L = Math.floor(0.299 * data[i] + 0.587 * data[i+1] + 0.114 * data[i+2]);
        hist[L]++;
    }
    
    const total = data.length / 4;
    let entropy = 0;
    
    for (let h of hist) {
        if (h > 0) {
            const p = h / total;
            entropy -= p * Math.log2(p);
        }
    }
    
    // Normalizza tra 0 e 1 (max entropy ≈ 8)
    return Math.min(1, entropy / 8);
}

// Modifica analyzeTexture per restituire anche edges
export function analyzeEdges(img) {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = 64;
    canvas.height = 64;

    ctx.drawImage(img, 0, 0, 64, 64);
    let data = ctx.getImageData(0, 0, 64, 64).data;
    data = gaussianBlur(data, 64, 64);

    const sobelX = [-1,0,1,-2,0,2,-1,0,1];
    const sobelY = [-1,-2,-1,0,0,0,1,2,1];

    let totalMag = 0;
    let count = 0;

    for (let y = 1; y < 63; y++) {
        for (let x = 1; x < 63; x++) {
            let gx = 0, gy = 0;
            let idx = 0;

            for (let ky = -1; ky <= 1; ky++) {
                for (let kx = -1; kx <= 1; kx++) {
                    const px = (y + ky) * 64 + (x + kx);
                    const L = 0.299 * data[px*4] + 0.587 * data[px*4+1] + 0.114 * data[px*4+2];
                    gx += L * sobelX[idx];
                    gy += L * sobelY[idx];
                    idx++;
                }
            }

            const mag = Math.sqrt(gx*gx + gy*gy);
            totalMag += mag;
            count++;
        }
    }

    const avgMag = totalMag / count;
    return clamp(avgMag / 200, 0, 1); // edges density
}

// Aggiungi funzione per determinare la tonalità dominante
function determineKey(avgColor) {
    const { r, g, b } = avgColor;
    
    // Mappa i colori RGB a tonalità musicali (semplificata)
    const max = Math.max(r, g, b);
    
    if (max === r && r > g && r > b) return "C";    // Rosso → Do
    if (max === g && g > r && g > b) return "E";    // Verde → Mi
    if (max === b && b > r && b > g) return "A";    // Blu → La
    
    if (r > g && r > b) return "D";                 // Rosso caldo → Re
    if (g > r && g > b) return "F";                 // Verde brillante → Fa
    if (b > r && b > g) return "G";                 // Blu freddo → Sol
    
    return "C"; // default
}

// MODIFICA la funzione analyzeImage finale:
export function analyzeImage(img) {

    const brightness = analyzeImageBrightness(img);
    const avgColor = analyzeAverageColor(img);
    const colorTemperature = computeColorTemperature(avgColor);
    const dna = extractPhotoDNA(img);
    const energy = analyzeEnergy(img);
    const texture = analyzeTexture(img);      // texture = roughness
    const edges = analyzeEdges(img);          // edges = edge density
    const complexity = analyzeComplexity(img);
    const entropy = analyzeEntropy(img);      // entropy = information content
    const direction = analyzeDirection(img);
    
    // Determina la tonalità dominante (key)
    const key = determineKey(avgColor);  // funzione da aggiungere

    console.log("📊 imageAnalysis risultati:", {
        brightness: brightness.toFixed(3),
        energy: energy.toFixed(3),
        texture: texture.toFixed(3),
        edges: edges.toFixed(3),
        complexity: complexity.toFixed(3),
        entropy: entropy.toFixed(3),
        direction: direction.toFixed(3),
        colorTemperature: colorTemperature.toFixed(3)
    });

    return {
        brightness,
        avgColor,
        colorTemperature,
        dna,
        energy,
        texture,
        edges,           // ← AGGIUNTO!
        complexity,
        entropy,         // ← AGGIUNTO!
        direction,
        key
    };
}

