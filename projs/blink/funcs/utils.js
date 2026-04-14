// Qualtrics needs absolute URLs for stimuli; fall back to relative for local dev
const GITHUB_PATH = "https://rhecolab.github.io/online/projs/blink/";
 
function getBasePath() {
    const { hostname, protocol } = window.location;
    return (hostname === "localhost" || hostname === "127.0.0.1" || protocol === "file:")
        ? "../../"
        : GITHUB_PATH;
}
 
// ── Practice runner ──────────────────────────────────────────────────────────
// Runs each practice trial in sequence, waiting for window.pracTrialNum to
// increment (set by collectResp in each task) before advancing.
export async function runPractice(seq, runTrial) {
    const fix = document.getElementById("fix");
    window.pracTrialNum = 0;
 
    await showMessage("Practice starting...");
 
    for (let i = 0; i < seq.length; i++) {
        if (fix) fix.textContent = "";
        const before = window.pracTrialNum;
        runTrial(seq[i], true);
        await new Promise(resolve => {
            const poll = setInterval(() => {
                if (window.pracTrialNum > before) { clearInterval(poll); resolve(); }
            }, 50);
        });
    }
 
    await showMessage("Practice complete! Press continue for main trials.");
}
 
// ── Overlay message with fade in/out ─────────────────────────────────────────
export function showMessage(text) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "overlayBox";
        overlay.innerHTML = `
            <div style="text-align:center; max-width:520px; padding:0 24px;">
                ${text}<br><br>
                <button id="continueBtn" style="font-size:18px; padding:10px 28px;">Continue</button>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector("#continueBtn").onclick = () => {
            overlay.remove();
            resolve();
        };
    });
}
 
// ── Shared trial row builder ──────────────────────────────────────────────────
// Reads t1_pos / t2_pos that makeSeq computed and bakes them into the data row.
export function buildTrialRow(trial) {
    const now = new Date();
    return {
        t1_item:   trial.t1,
        t2_item:   trial.t2,
        lag:       trial.lag,
        t1_pos:    trial.t1_pos,
        t2_pos:    trial.t2_pos,
        resp1:     "",
        resp2:     "",
        rt1:       "",
        rt2:       "",
        time:      now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0],
        seqLen:    trial.stimuli.length,
        seqOrder:  trial.stimuli.map(s => s.stim).join(","),
    };
}
 
// ── Qualtrics submission ──────────────────────────────────────────────────────
// Saves data to an embedded field then advances to the next survey page.
export function qualtricsAdvance(fieldName, data) {
    Qualtrics.SurveyEngine.setEmbeddedData(fieldName, JSON.stringify(data));
 
    try {
        Qualtrics.SurveyEngine.navNext();
        return;
    } catch (e) {
        console.warn("navNext() failed:", e);
    }
 
    // Fallback: click the hidden Next button
    const clickNext = () => {
        const btn = document.querySelector("#NextButton");
        if (btn) { btn.style.visibility = "visible"; btn.click(); }
        else setTimeout(clickNext, 50);
    };
    clickNext();
 
    // Last-resort fallback: form submit
    setTimeout(() => {
        const form = document.querySelector("form[name='QualtricsForm']");
        if (form) form.submit();
        else setTimeout(arguments.callee, 50);
    }, 500);
}
 
// ── Trial counter banner (optional) ──────────────────────────────────────────
export function showTrialCounter(isPractice, trialNum, trialTotal) {
    const root = document.getElementById("expRoot");
    if (!root) return;
    const banner = document.createElement("div");
    Object.assign(banner.style, {
        position: "absolute", top: "10px", left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: isPractice ? "#a0c4ff" : "#fffa65",
        color: "#000", fontSize: "16px", padding: "10px 20px",
        borderRadius: "8px", zIndex: "9999", textAlign: "center",
    });
    banner.textContent = `Trial ${trialNum} / ${trialTotal}`;
    root.appendChild(banner);
    setTimeout(() => banner.remove(), 1500);
}
 
// ── Progress bar ──────────────────────────────────────────────────────────────
export function updateProgressBar(current, total) {
    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = `${(current / total) * 100}%`;
}
 
// ── General array shuffle ─────────────────────────────────────────────────────
export function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
 
// ── Audio ─────────────────────────────────────────────────────────────────────
export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export const buffer = {};
 
export async function preloadSounds(soundFiles) {
    const base = getBasePath();
    await Promise.all(soundFiles.map(async name => {
        const res = await fetch(`${base}stimuli/snds/${name}.wav`);
        buffer[name] = await audioCtx.decodeAudioData(await res.arrayBuffer());
    }));
    console.log("Sounds preloaded.");
}
 
export function playSound(stim, when, example = false) {
    const fix = document.getElementById("fix");
    if (fix) fix.textContent = example ? "" : "+";
    const source = audioCtx.createBufferSource();
    source.buffer = buffer[stim];
    source.connect(audioCtx.destination);
    source.start(when);
}
 
// ── Shapes ────────────────────────────────────────────────────────────────────
const BASE_SIZE = 75;
 
function drawCircle(ctx, x, y, r, color) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
}
 
function drawSquare(ctx, x, y, size, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x - size / 2, y - size / 2, size, size);
}
 
function drawTriangle(ctx, x, y, size, color) {
    const h = (Math.sqrt(3) / 2) * size;
    ctx.beginPath();
    ctx.moveTo(x,            y - h * 2 / 3);
    ctx.lineTo(x + size / 2, y + h / 3);
    ctx.lineTo(x - size / 2, y + h / 3);
    ctx.closePath();
    ctx.fillStyle = color; ctx.fill();
}
 
function drawPolygon(ctx, x, y, radius, sides, color) {
    const angle = (2 * Math.PI) / sides;
    ctx.beginPath();
    for (let i = 0; i < sides; i++) {
        const px = x + radius * Math.cos(i * angle);
        const py = y + radius * Math.sin(i * angle);
        i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
    }
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
 
function drawSemicircle(ctx, x, y, radius, color, direction) {
    const angles = {
        up:    [Math.PI,        2 * Math.PI],
        down:  [0,              Math.PI],
        left:  [0.5 * Math.PI, 1.5 * Math.PI],
        right: [-0.5 * Math.PI, 0.5 * Math.PI],
    };
    const [start, end] = angles[direction] ?? angles.up;
    ctx.beginPath(); ctx.arc(x, y, radius, start, end);
    ctx.closePath(); ctx.fillStyle = color; ctx.fill();
}
 
export function drawShape(shape, ctx, x, y, color) {
    const r = BASE_SIZE / 2;
    switch (shape) {
        case "circle":   drawCircle(ctx, x, y, r, color); break;
        case "square":   drawSquare(ctx, x, y, BASE_SIZE, color); break;
        case "triangle": drawTriangle(ctx, x, y, BASE_SIZE, color); break;
        case "pentagon": drawPolygon(ctx, x, y, r, 5, color); break;
        case "hexagon":  drawPolygon(ctx, x, y, r, 6, color); break;
        case "octagon":  drawPolygon(ctx, x, y, r, 8, color); break;
        case "semiup":    drawSemicircle(ctx, x, y, r, color, 'up'); break;
        case "semidown":  drawSemicircle(ctx, x, y, r, color, 'down'); break;
        case "semileft":  drawSemicircle(ctx, x, y, r, color, 'left'); break;
        case "semiright": drawSemicircle(ctx, x, y, r, color, 'right'); break;
    }
}
 