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
        document.getElementById("startButton").addEventListener("click", () => {
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

    // Show stimulus
    stim.style.display = "block";

    // Randomize line length
    const lineLengthCm = Math.random() * 6 + 10; // 10–16 cm
    const lineLengthPx = cmToPx(lineLengthCm);
    lineContainer.style.width = lineLengthPx + "px";

    // Wait for layout before positioning
    requestAnimationFrame(() => {

        // Use window height (more robust than stim)
        const stimHeight = window.innerHeight;

        const bandHeight = cmToPx(2);
        const margin = cmToPx(4);

        const randomY = Math.floor(
            Math.random() * (stimHeight - bandHeight - margin * 2)
        ) + margin;

        lineContainer.style.position = "absolute";
        lineContainer.style.top = randomY + "px";
        lineContainer.style.left = "50%";
        lineContainer.style.transform = "translateX(-50%)";
    });

    const startTime = performance.now();

    // Follow mouse with bisector line
    function handleMouseMove(event) {
        const stimRect = stim.getBoundingClientRect();

        bisectLine.style.left = (event.clientX - stimRect.left) + "px";
        bisectLine.style.top = (event.clientY - stimRect.top) + "px";
    }

    // Grab click & save trial
    function handleClick(event) {

        const clickTime = performance.now();
        const rt = clickTime - startTime;

        const rect = line.getBoundingClientRect();
        const trueMid = rect.left + rect.width / 2;

        const clickX = event.clientX;
        const devPx = clickX - trueMid;
        const devRel = devPx / rect.width;
        const devCm = devPx / pxPerCm;

        // Save trial
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

        // clean up
        document.removeEventListener("mousemove", handleMouseMove);
        lineContainer.removeEventListener("click", handleClick);
        stim.style.display = "none";

        trialNumber++;

        if (trialNumber < totalTrials) {
            setTimeout(runTrial, 400);
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
      setTimeout(() => {
        console.log("ADVANCING SURVEY");
        Qualtrics.SurveyEngine.navClick("NextButton");
    }, 100);

}