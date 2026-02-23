import { } from '../funcs/utils_line.js';
import html from "./line.html";
import "../funcs/line.css";

// Parameters
let data = [];
let trialNumber = 5;

let subjID = "";
const taskName = 'line';

async function startTask(participantID) {

    subjID = participantID;

    // Create experiment container
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);

    // Inject HTML
    root.innerHTML = html;

    // Hide bells image at first 
    document.getElementById("stim").style.display = "none";

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
    function handleMouseMove(event) {
        bisectLine.style.left = event.clientX + "px";
        bisectLine.style.top = event.clientY - 20 + "px"; 
    }

    document.addEventListener("mousemove", handleMouseMove);

    line.addEventListener("mousemove", handleMouseMove);

  function handleClick(event) {

        const clickX = event.clientX;
        const rt = performance.now() - startTime;

        const deviationPx = clickX - trueMid;
        const deviationRel = deviationPx / rect.width;

        data.push({
            deviationPx: Math.round(deviationPx),
            deviationRel: parseFloat(deviationRel.toFixed(4)),
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
