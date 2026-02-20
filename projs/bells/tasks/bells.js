import { } from '../funcs/utils_bells.js';
import html from "./bells.html";
import "../funcs/bells.css";

// Parameters
let data = [];
let trialNumber = 0;
let startTime;
let totalTime = 100; // how long they have to click; change to 5 min for full time

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
function runTrial(){

    const startTime = performance.now();
    stim.style.display = "block"; 

    function getClicks(event) {

            const rect = stim.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            trialNumber++;

            const trial = {
                trial: trialNumber,
                x: Math.round(x),
                y: Math.round(y),
                rt: Math.round(performance.now() - startTime)
            };

            trialData.push(trial);
            console.log("Trial saved:", trial);
        }

    stim.addEventListener("click", getClicks);
    
    setTimeout(() => {
            stim.style.display = "none";
            stim.removeEventListener("click", getClicks);
            endTask();
        }, totalTime);
    }



function endTask() {

data = trialData; 
  console.log("Task complete.");
  console.log("Data:", data);

  const jsonData = JSON.stringify(data);

  // Save entire dataset into one embedded field
  Qualtrics.SurveyEngine.setEmbeddedData("bellsData", jsonData);

  // Advance survey so data is actually submitted
  document.querySelector("#NextButton").click();
}
