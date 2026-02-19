import { } from '../funcs/utils_bells.js';
import html from "./bells.html";
import "../funcs/bells.css";

// Parameters
let data = [];
let startTime;

let subjID = "";
const taskName = 'bells';

async function startTask(participantID) {

    subjID = participantID;

    // Create experiment container
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);

    // Inject HTML
    root.innerHTML = html;

    document.getElementById("startButton").addEventListener("click", () => {
        document.getElementById("instrBox").style.display = "none";
        document.getElementById("startButton").style.display = "none";
    });

    runTrial();
}

export default { startTask };


// Run single trial
function runTrial() {
    startTime = performance.now();
    stim.style.display = "block";

}


// Response collection
window.collectResp = function(question, response = null) {

}

function endTask() {
  console.log("Task complete.");
  console.log("Data:", data);

  const jsonData = JSON.stringify(data);

  // Save entire dataset into one embedded field
  Qualtrics.SurveyEngine.setEmbeddedData("bellsData", jsonData);

  // Advance survey so data is actually submitted
  document.querySelector("#NextButton").click();
}
