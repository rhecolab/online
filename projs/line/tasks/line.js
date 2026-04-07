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
var pxPerCm = parseFloat("${e://Field/px_per_cm}");

// to convert to px so cm size always displayed
function cmToPx(cm){
    return cm * pxPerCm;
}

async function startTask() {

    document.querySelector(".SkinInner").innerHTML = html;

    requestAnimationFrame(() => {

        document
        .getElementById("startButton")
        .addEventListener("click", () => {

            document.getElementById("instrBox").style.display = "none";

            runTrial();

        });

    });

}

export default { startTask };


// Run single trial
function runTrial() {
    console.log("RUN TRIAL", trialNumber);

    const stim = document.getElementById("stim");
    const line = document.getElementById("line");
    const bisectLine = document.getElementById("bisectLine");
    const lineContainer = document.getElementById("lineContainer");

    stim.style.display = "block";

    const startTime = performance.now();

    // Randomize line length (based on cm, then converted to px)
    const lineLengthCm = Math.random() * 6 + 10; // 10–16 cm
    const lineLengthPx = cmToPx(lineLengthCm);

    //lineContainer.style.width = lineLengthPx + "px";
    lineContainer.style.width = 500 + "px";

    // Random vertical position
    const stimRect = stim.getBoundingClientRect();
    const stimHeight = stimRect.height;
    const bandHeight = cmToPx(2);   // clickable height
    const margin = cmToPx(4);

    const randomY = Math.floor(
        Math.random() * (stimHeight - bandHeight - margin * 2)
    ) + margin;

    lineContainer.style.top = randomY + "px";

    // Center horizontally
    lineContainer.style.left = "50%";
    lineContainer.style.transform = "translateX(-50%)";

    // Get bisect line following mouse
    function handleMouseMove(event) {
        bisectLine.style.left = (event.clientX - stimRect.left) + "px";
        bisectLine.style.top = (event.clientY - stimRect.top) + "px";
    }

    document.addEventListener("mousemove", handleMouseMove);
    lineContainer.addEventListener("mousemove", handleMouseMove);

     function handleClick(event) {

        const clickTime = performance.now();
        const rt = clickTime - startTime;

        // Recalculate midpoint at click time (safer)
        const rect = line.getBoundingClientRect();
        const trueMid = rect.left + rect.width / 2;

        const clickX = event.clientX;
        const devPx = clickX - trueMid;
        const devRel = devPx / rect.width;
        const devCm = devPx / pxPerCm;

        // Save data
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

            pxPerCm: pxPerCm,

            screenW: screenW,
            screenH: screenH,
            dpr: dpr

        });

        // Clean up listeners
        document.removeEventListener("mousemove", handleMouseMove);
        lineContainer.removeEventListener("click", handleClick);
        stim.style.display = "none";

        trialNumber++;


        if (trialNumber < totalTrials) {
            setTimeout(() => {
            runTrial();
            }, 400);
        } else {
            endTask();
        }
    }

    // Attach listeners
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
    Qualtrics.SurveyEngine.navClick("NextButton");

}