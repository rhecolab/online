import { } from '../funcs/utils_line.js';
import html from "./line.html";
import "../funcs/line.css";

// Parameters
let data = [];
let trialNumber = 0;
let totalTrials = 10;

let subjID = "${e://Field/subjID}";
const taskName = 'line';

// Screen info
const screenW = window.innerWidth;
const screenH = window.innerHeight;
const dpr = window.devicePixelRatio;
var pxPerCm = parseFloat("${e://Field/px_per_cm}") || 37; // 37 is a fallback value if the credit card calibration fails 
const stimHeight = window.innerHeight;

// to convert to px so cm size always displayed
function cmToPx(cm){
    return cm * pxPerCm;
}

async function startTask() {

    document.querySelector(".SkinInner").innerHTML = html;

    requestAnimationFrame(() => {
        document.getElementById("startButton").addEventListener("click", () => {
            document.getElementById("instrBox").style.display = "none";
            runTrial();
        });
    });
}

export default { startTask };


function runTrial() {
    const stim = document.getElementById("stim");
    const lineContainer = document.getElementById("lineContainer");
    const line = document.getElementById("line");
    const bisectLine = document.getElementById("bisectLine");

    stim.style.display = "block";

    // Randomize line length 
    const lineLengthCm = Math.random() * 6 + 10;
    const lineLengthPx = cmToPx(lineLengthCm);
    lineContainer.style.width = lineLengthPx + "px";

    // Wait for layout to stabilize
    requestAnimationFrame(() => {
        const stimHeight = window.innerHeight;
        const containerHeight = lineContainer.offsetHeight;

        // Constrain vertical jitter to middle 40% of screen
        const topBand = stimHeight * 0.3;
        const bottomBand = stimHeight * 0.7;

        const randomY = Math.floor(
            Math.random() * (bottomBand - topBand - containerHeight)
        ) + topBand;

        lineContainer.style.top = randomY + "px";
    });

    const startTime = performance.now();

    function handleMouseMove(event) {
        const stimRect = stim.getBoundingClientRect();
        bisectLine.style.left = (event.clientX - stimRect.left) + "px";
        bisectLine.style.top = lineContainer.offsetTop + "px"; // lock to line vertically
    }

    function handleClick(event) {
        const clickTime = performance.now();
        const rt = clickTime - startTime;

        const rect = line.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
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
            rt: Math.round(rt),
            lineLengthCm: Number(lineLengthCm.toFixed(2)),
            lineLengthPx: Math.round(lineLengthPx),
            pxPerCm,
            screenW,
            screenH,
            dpr
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
    }

    document.addEventListener("mousemove", handleMouseMove);
    lineContainer.addEventListener("click", handleClick);
}


function endTask() {

  console.log("Task complete.");
  console.log("Data:", data);

  const jsonData = JSON.stringify(data);

  // Save entire dataset into one embedded field
  Qualtrics.SurveyEngine.setEmbeddedData("lineData", jsonData);

  // Advance survey
      setTimeout(() => {
        console.log("ADVANCING SURVEY");
        Qualtrics.SurveyEngine.navClick("NextButton");
    }, 100);

}