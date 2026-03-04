import { } from '../funcs/utils_bells.js';
import html from "./bells.html";
import "../funcs/bells.css";

// Parameters
let data = [];
let trialNumber = 0;
let startTime;

let subjID = "";
const taskName = 'bells';

let reminderTime = 30 * 1000; // after 30 sec of no clicks, ask if they want to submit
let submitTime = 60 * 1000; // if there's no clicks for 60 sec, auto submit

let warningTimeout;
let autoSubmitTimeout;
let taskEnded = false; 

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


// Display bells image & collect clicks 
function runTrial() {

    resetTimers();

    // Make stimulus visible 
    const stim = document.getElementById("stim");
    const container = document.getElementById("stimContainer");
    stim.style.display = "block";

    // Set up countdown 
    const startTime = performance.now();


    // Capture & display clicks on screen 
    function getClicks(event) {
        resetTimers();

        const rect = stim.getBoundingClientRect();

        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;

        // Trial number is each click 
        trialNumber++;

        // Save trial data as relative coordinates
        const trial = {
            trial: trialNumber,
            x_rel: parseFloat(relativeX.toFixed(4)),
            y_rel: parseFloat(relativeY.toFixed(4)),
            rt: Math.round(performance.now() - startTime)
        };

        data.push(trial);

        // Display click locations 
        const circle = document.createElement("div");
        circle.style.position = "absolute";
        circle.style.width = "20px";
        circle.style.height = "20px";
        circle.style.border = "2px solid red";
        circle.style.borderRadius = "50%";
        circle.style.pointerEvents = "none";

        // Convert relative coordinates back to displayed pixels
        const displayX = relativeX * rect.width;
        const displayY = relativeY * rect.height;

        circle.style.left = `${displayX - 10}px`; // center circle
        circle.style.top = `${displayY - 10}px`;

        container.appendChild(circle);
    }

    stim.addEventListener("click", getClicks);

    setTimeout(() => {
        stim.style.display = "none";
        stim.removeEventListener("click", getClicks);
        endTask();
    }, totalTime);
}

function resetTimers(){
    clearTimeout(warningTimeout);
    clearTimeout(autoSubmitTimeout);

    // Show warning popup
    warningTimeout = setTimeout(() => {
        const confirmSubmit = confirm(
            "You haven’t clicked in a while. Do you want to submit your responses?"
        );

        if (confirmSubmit) {
            endTask();
        }
    }, reminderTime);

    // Auto-submit
    autoSubmitTimeout = setTimeout(() => {
        alert("The task will now be submitted.");
        endTask();
    }, submitTime);

}

function saveImage() {
    const stim = document.getElementById("stim");
    
    // Create canvas
    const canvas = document.createElement("canvas");
    canvas.width = stim.naturalWidth;
    canvas.height = stim.naturalHeight;
    const ctx = canvas.getContext("2d");

    // Draw the underlying image
    ctx.drawImage(stim, 0, 0, canvas.width, canvas.height);

    // Draw clicks
    data.forEach(trial => {
        const x = trial.x_rel * canvas.width;
        const y = trial.y_rel * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI); // same radius as on screen
        ctx.fillStyle = "rgba(255,0,0,0.6)";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    // Convert canvas 
    const dataURL = canvas.toDataURL("image/png");

    // Save to Qualtrics Embedded Data
    if (window.Qualtrics && Qualtrics.SurveyEngine) {
        Qualtrics.SurveyEngine.setEmbeddedData("bellsImage", dataURL);
    }
}


function endTask() {

  if (taskEnded) return;
  taskEnded = true;

  clearTimeout(warningTimeout);
  clearTimeout(autoSubmitTimeout);

  const stim = document.getElementById("stim");
  stim.removeEventListener("click", getClicks);

  console.log("Task complete.");
  console.log("Data:", data);

  const jsonData = JSON.stringify(data);

  saveImage();

  Qualtrics.SurveyEngine.setEmbeddedData("bellsData", jsonData);

  document.querySelector("#NextButton").click();
}