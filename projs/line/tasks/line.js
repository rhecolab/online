import html from "./line.html";
import "../funcs/line.css";
import { qualtricsAdvance } from "../funcs/utils_line.js";

// Parameters
let data = [];
const totalTrials = 10;
const subjID = "${e://Field/subjID}";
const taskName = "line";
const pxPerCm = parseFloat("${e://Field/pxPerCm}") || 37;
window.trialNum  = 0;
window.pracNum   = 0;

const Y_TOLERANCE_PX = 20;

// ── Balanced line-length array (half 12 cm, half 24 cm) ──────────────────────
function makeLineLengths(n) {
    const half = Math.floor(n / 2);
    const arr = [...Array(half).fill(12), ...Array(n - half).fill(24)];
    // Fisher-Yates shuffle
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}
let lineLengths = makeLineLengths(totalTrials);

// Practice trials also use the two lengths, picked randomly
function pracLineLength() {
    return Math.random() < 0.5 ? 12 : 24;
}

function cmToPx(cm) {
    return cm * pxPerCm;
}

// ── Click home button to continue to next trial ──────────────────────────────────────────
function waitForContinue() {
    return new Promise(resolve => {
        const btn = document.getElementById("homeButton");
        const stim = document.getElementById("stim");

        stim.style.display = "block";
        document.getElementById("lineContainer").style.display = "none";

        // Position using fixed coordinates 
        btn.style.position = "fixed";
        btn.style.left = (lineRect.right + 12) + "px";
        btn.style.top  = (lineRect.top - 48) + "px";
        btn.style.display = "block";

        btn.onclick = () => {
            btn.style.display = "none";
            btn.style.position = "";
            btn.style.left = "";
            btn.style.top = "";
            document.getElementById("lineContainer").style.display = "";
            resolve();
        };
    });
}

async function startTask() {

    // Create experiment container & inject HTML
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);
    root.innerHTML = html;

    // Hide stim at first
    document.getElementById("stim").style.display = "none";

    // Start on button click
    document.getElementById("startButton").addEventListener("click", async () => {
        document.getElementById("instrBox").style.display = "none";
        await runPractice();
        runTrial();
    });

}

export default { startTask };


async function runPractice() {

    await showMessage("Practice starting...");

    const pracTrials = 3;

    for (let i = 0; i < pracTrials; i++) {
        await new Promise(resolve => {
            runTrial(true, resolve);
        });
    }

    await showMessage("Practice complete! Press continue for main trials.");
}

// ── Overlay message with fade in/out ─────────────────────────────────────────
export function showMessage(text) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "overlayBox";
        overlay.style.cssText = `
            position: fixed;
            inset: 0;
            background: rgba(212,212,212,0.95);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            pointer-events: all;
        `;
        overlay.innerHTML = `
            <div style="text-align:center; max-width:520px; padding:0 24px;">
                ${text}<br><br>
                <button id="continueBtn" style="font-size:18px; padding:10px 28px;">Continue</button>
            </div>`;

        // Append to expRoot
        const root = document.getElementById("expRoot") || document.body;
        root.appendChild(overlay);

        overlay.querySelector("#continueBtn").onclick = () => {
            overlay.remove();
            resolve();
        };
    });
}

function runTrial(isPractice = false, onComplete = null) {
    const stim = document.getElementById("stim");
    const lineContainer = document.getElementById("lineContainer");
    const bisectLine = document.getElementById("bisectLine");

    // Show stimulus area (but keep bisect line hidden until cursor is near)
    stim.style.display = "block";
    bisectLine.style.display = "none";

    // Line length: balanced 12/24 cm for main trials, random for practice
    const lineLengthCm = isPractice
        ? pracLineLength()
        : lineLengths[window.trialNum];
    const lineLengthPx = cmToPx(lineLengthCm);
    lineContainer.style.width = lineLengthPx + "px";

    // Vertical jitter: middle 40% of screen
    requestAnimationFrame(() => {
        const stimHeight = window.innerHeight;
        const topBand = stimHeight * 0.3;
        const bottomBand = stimHeight * 0.7;
        const containerHeight = lineContainer.offsetHeight;
        const randomY = Math.floor(Math.random() * (bottomBand - topBand - containerHeight)) + topBand;
        lineContainer.style.top = randomY + "px";
    });

    const startTime = performance.now();

    // Track whether the cursor is currently in the tolerance band
    let inBand = false;

    function getLineCenterY() {
        const rect = document.getElementById("line").getBoundingClientRect();
        return rect.top + rect.height / 2;
    }

    function handleMouseMove(e) {
        const lineCenterY = getLineCenterY();
        const distY = Math.abs(e.clientY - lineCenterY);

        if (distY <= Y_TOLERANCE_PX) {
            // Cursor is within the tolerance band — show the bisect line
            inBand = true;
            bisectLine.style.display = "block";

            const stimRect = stim.getBoundingClientRect();
            // X follows the cursor
            bisectLine.style.left = (e.clientX - stimRect.left) + "px";
            // Y is locked to the black line's center
            bisectLine.style.top =
                lineContainer.offsetTop +
                lineContainer.offsetHeight / 2 -
                bisectLine.offsetHeight / 2 + "px";

            // Show a crosshair so it's obvious clicking will register
            stim.style.cursor = "crosshair";
        } else {
            // Outside the band — hide bisect line and restore default cursor
            inBand = false;
            bisectLine.style.display = "none";
            stim.style.cursor = "default";
        }
    }

    function handleClick(e) {
        // Only register the click when the cursor is in the tolerance band
        if (!inBand) return;

        const rt = Math.round(performance.now() - startTime);

        const rect = document.getElementById("line").getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const trueMid = rect.width / 2;
        const devPx = clickX - trueMid;
        const devRel = devPx / rect.width;
        const devCm = devPx / pxPerCm;

        if (!isPractice) {
            data.push({
                sub: subjID,
                task: taskName,
                trial: window.trialNum + 1,
                devPx: Math.round(devPx),
                devRel: Number(devRel.toFixed(4)),
                devCm: Number(devCm.toFixed(2)),
                rt,
                lineLengthCm: Number(lineLengthCm.toFixed(2)),
                lineLengthPx: Math.round(lineLengthPx),
                pxPerCm,
                screenW: window.innerWidth,
                screenH: window.innerHeight,
                dpr: window.devicePixelRatio
            });
            window.trialNum++;
        }

        cleanup();

        // ── Practice: return to home, then continue ─────────
        if (isPractice) {
            waitForContinue().then(() => {
                if (onComplete) onComplete();
            });
            return;
        }

        // ── Main trials: return to home, then start next trial or end ────────
        if (window.trialNum < totalTrials) {
            waitForContinue().then(() => runTrial());
        } else {
            endTask();
        }
    }

    function cleanup() {
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("click", handleClick);
        stim.style.display = "none";
        stim.style.cursor = "";
        bisectLine.style.display = "none";
        inBand = false;
    }

    // Both listeners on document so mousemove is never missed
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("click", handleClick);
}

function endTask() {
    const root = document.getElementById("expRoot");
    if (root) root.remove();

    qualtricsAdvance("lineData", data);
}