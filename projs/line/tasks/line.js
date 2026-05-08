import html from "./line.html";
import "../funcs/line.css";

// Parameters
let data = [];
const totalTrials = 10;
const subjID = "${e://Field/subjID}";
const taskName = "line";
const pxPerCm = parseFloat("${e://Field/px_per_cm}") || 37;
window.trialNum  = 0;
window.pracNum   = 0;

// How many px above/below the line centre counts as "on the line"
const Y_TOLERANCE_PX = 20;

function cmToPx(cm) {
    return cm * pxPerCm;
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

        // Append to expRoot so it sits inside the experiment layer, not body
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

    // Random line length between 10–16 cm
    const lineLengthCm = Math.random() * 6 + 10;
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

    function getLineCentreY() {
        // Use getBoundingClientRect for the most accurate position at call time
        const rect = document.getElementById("line").getBoundingClientRect();
        return rect.top + rect.height / 2;
    }

    function handleMouseMove(e) {
        const lineCentreY = getLineCentreY();
        const distY = Math.abs(e.clientY - lineCentreY);

        if (distY <= Y_TOLERANCE_PX) {
            // Cursor is within the tolerance band — show the bisect line
            inBand = true;
            bisectLine.style.display = "block";

            const stimRect = stim.getBoundingClientRect();
            // X follows the cursor
            bisectLine.style.left = (e.clientX - stimRect.left) + "px";
            // Y is locked to the black line's centre
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

        if (isPractice) {
            if (onComplete) onComplete();
            return;
        }

        if (window.trialNum < totalTrials) {
            setTimeout(() => runTrial(), 400);
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
    // Save data
    Qualtrics.SurveyEngine.setEmbeddedData("lineData", JSON.stringify(data));

    // Clean up before advancing so break page shows properly
    const root = document.getElementById("expRoot");
    if (root) root.remove();


    // Try navNext first
    try {
        if (typeof Qualtrics !== "undefined" &&
            Qualtrics.SurveyEngine &&
            typeof Qualtrics.SurveyEngine.navNext === "function") {
            console.log("Advancing via navNext()");
            Qualtrics.SurveyEngine.navNext();
            return; // ← this return should prevent the rest, but navNext is async
                    //   so the code below was still executing
        }
    } catch (e) {
        console.warn("navNext() failed:", e);
    }

    // Only reach here if navNext wasn't available
    const nextBtn = document.querySelector("#NextButton");
    if (nextBtn) {
        console.log("Advancing via NextButton click");
        nextBtn.style.visibility = "visible";
        nextBtn.click();
    } else {
        const form = document.querySelector("form[name='QualtricsForm']");
        if (form) {
            console.log("Advancing via form.submit()");
            form.submit();
        }
    }
}