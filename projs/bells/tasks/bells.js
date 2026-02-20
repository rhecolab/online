import { } from '../funcs/utils_bells.js';
import html from "./bells.html";
import "../funcs/bells.css";

// Parameters
let data = [];
let trialNumber = 0;
let startTime;
let totalTime = 5 * 60 * 1000; // time in ms; 5 min * 60 sec per min * 1000 ms per sec 

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
    const endTime = startTime + totalTime;
    stim.style.display = "block";

    function countdown(){
        const now = performance.now();
        const remaining = Math.max(0, endTime - now);

        const totalSeconds = Math.ceil(remaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        countdown.textContent =
            String(minutes).padStart(2, "0") + ":" +
            String(seconds).padStart(2, "0");

        // Turn red in last 30 seconds
        if (totalSeconds <= 30) {
            countdown.style.color = "red";
        }

        if (remaining > 0) {
            requestAnimationFrame(countdown);
        }
    }

    countdown();

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

            data.push(trial);
            console.log("Trial saved:", trial);
    
            const circle = document.createElement("div");
            circle.style.position = "absolute";
            circle.style.width = "14px";
            circle.style.height = "14px";
            circle.style.border = "2px solid red";
            circle.style.borderRadius = "50%";
            circle.style.pointerEvents = "none";
            circle.style.left = (x - 7) + "px";
            circle.style.top = (y - 7) + "px";

    document.getElementById("stimContainer").appendChild(circle);

        }


    stim.addEventListener("click", getClicks);
    
    setTimeout(() => {
            stim.style.display = "none";
            stim.removeEventListener("click", getClicks);
            endTask();
        }, totalTime);
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
