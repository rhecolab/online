import { } from '../funcs/utils_line.js';
import html from "./line.html";
import "../funcs/line.css";

// Parameters
let data = [];
let trialNumber = 0;
let totalTrials = 10;

let subjID = "";
const taskName = 'line';

async function startTask(participantID) {

    subjID = participantID;

    // Create experiment container
    const exptDiv = document.createElement("div");
    exptDiv.id = "exptDiv";
    document.querySelector(".SkinInner").appendChild(exptDiv);

    // Inject HTML
    exptDiv.innerHTML = html;

    // Hide instructions & start button when start
    document.getElementById("startButton").addEventListener("click", () => {
        document.getElementById("instrBox").style.display = "none";
        document.getElementById("startButton").style.display = "none";
        runTrial();
    });

}

export default { startTask };


// Run single trial
function runTrial() {

    // Get trial start time
    const startTime = performance.now();

    // Make stimulus div visible
    const stim = document.getElementById("stim");
    stim.style.display = "block";
    
    // Create line & get midpoint
    const line = document.getElementById("line");
    const lineLength = Math.floor(Math.random() * 200) + 400;
    line.style.width = lineLength + "px";
    const rect = line.getBoundingClientRect();
    const trueMid = rect.left + rect.width / 2;

    // Show bisect line following mouse
    const bisectLine = document.getElementById("bisectLine");

    function handleMouseMove(event) {
        const stimRect = stim.getBoundingClientRect();
        bisectLine.style.left = (event.clientX - stimRect.left) + "px";
        bisectLine.style.top = (event.clientY - stimRect.top) + "px";
    }

    document.addEventListener("mousemove", handleMouseMove);
    line.addEventListener("mousemove", handleMouseMove);

  function handleClick(event) {

        const clickX = event.clientX;
        const rt = performance.now() - startTime;

        const devPx = clickX - trueMid;
        const devRel = devPx / rect.width;

        data.push({
            sub: subjID,
            task: taskName,
            trial: trialNumber + 1,
            deviationPx: Math.round(devPx),
            deviationRel: parseFloat(devRel.toFixed(4)),
            rt: Math.round(rt)
        });

        // Stop tracking
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("click", handleClick);

        trialNumber++;

        // Next trial or finish
        if (trialNumber < totalTrials) {
            setTimeout(() => {
                finalMark.remove();
                runTrial();
            }, 800);
        } else {
            endTask();
        }
    }

    line.addEventListener("click", handleClick);
}

function endTask() {

  console.log("Task complete.");
  console.log("Data:", data);

  const jsonData = JSON.stringify(data);

  saveImage();

  // Save entire dataset into one embedded field
  Qualtrics.SurveyEngine.setEmbeddedData("lineData", jsonData);

  // Advance survey so data is actually submitted
  document.querySelector("#NextButton").click();
}
