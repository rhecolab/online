import html from "./line.html";
import "../funcs/line.css";

// Parameters
let data = [];
let trialNumber = 0;
const totalTrials = 10;
const subjID = "${e://Field/subjID}";
const taskName = "line";
const pxPerCm = parseFloat("${e://Field/px_per_cm}") || 37;

function cmToPx(cm) {
    return cm * pxPerCm;
}

async function startTask(subjID) {

    // Create experiment container & inject HTML
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);
    root.innerHTML = html;

    // Hide stim at first
    document.getElementById("stim").style.display = "none";

    // Start on button click
    document.getElementById("startButton").addEventListener("click", () => {
        document.getElementById("instrBox").style.display = "none";
        runTrial();
    });

}

export default { startTask };


function runTrial() {
    const stim = document.getElementById("stim");
    const lineContainer = document.getElementById("lineContainer");
    const bisectLine = document.getElementById("bisectLine");

    // Show stimulus
    stim.style.display = "block";
    bisectLine.style.display = "block";

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

    function handleMouseMove(e) {
        const stimRect = stim.getBoundingClientRect();
        bisectLine.style.left = (e.clientX - stimRect.left) + "px";
        bisectLine.style.top = lineContainer.offsetTop + (lineContainer.offsetHeight / 2) - (bisectLine.offsetHeight / 2) + "px";
    }

    function handleClick(e) {
        const rt = Math.round(performance.now() - startTime);

        const rect = document.getElementById("line").getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const trueMid = rect.width / 2;
        const devPx = clickX - trueMid;
        const devRel = devPx / rect.width;
        const devCm = devPx / pxPerCm;

        data.push({
            sub: subjID,
            task: taskName,
            trial: trialNumber + 1,
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

        cleanup();
        trialNumber++;

        if (trialNumber < totalTrials) {
            setTimeout(runTrial, 400);
        } else {
            endTask();
        }
    }

    function cleanup() {
        document.removeEventListener("mousemove", handleMouseMove);
        lineContainer.removeEventListener("click", handleClick);
        stim.style.display = "none";
        bisectLine.style.display = "none";
    }

    document.addEventListener("mousemove", handleMouseMove);
    lineContainer.addEventListener("click", handleClick);
}

function endTask() {

    // Save data
    Qualtrics.SurveyEngine.setEmbeddedData("lineData", JSON.stringify(data));

    // Submit with fallbacks to handle Qualtrics
    try {
        if (typeof Qualtrics !== "undefined" &&
            Qualtrics.SurveyEngine &&
            typeof Qualtrics.SurveyEngine.navNext === "function") {
            console.log("Advancing via navNext()");
            Qualtrics.SurveyEngine.navNext();
            return;
        }
    } catch (e) {
        console.warn("navNext() failed:", e);
    }

    // Click NextButton if it exists
    const attemptNextClick = () => {
        const nextBtn = document.querySelector("#NextButton");
        if (nextBtn) {
            console.log("Advancing via NextButton click");
            nextBtn.style.visibility = "visible";
            nextBtn.click();
        } else {
            setTimeout(attemptNextClick, 50);
        }
    };
    attemptNextClick();

    // Fall back to form submit
    const attemptFormSubmit = () => {
        const form = document.querySelector("form[name='QualtricsForm']");
        if (form) {
            console.log("Advancing via form.submit()");
            form.submit();
        } else {
            setTimeout(attemptFormSubmit, 50);
        }
    };
    setTimeout(attemptFormSubmit, 500);
}