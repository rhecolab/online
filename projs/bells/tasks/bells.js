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
function runTrial() {

    const stim = document.getElementById("stim");
    const container = document.getElementById("stimContainer");
    const countdownDiv = document.getElementById("countdownDiv");

    stim.style.display = "block";

    const startTime = performance.now();
    const endTime = startTime + totalTime;

    // --- Countdown ---
    function countdown() {
        const now = performance.now();
        const remaining = Math.max(0, endTime - now);

        const totalSeconds = Math.ceil(remaining / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;

        countdownDiv.textContent =
            String(minutes).padStart(2, "0") + ":" +
            String(seconds).padStart(2, "0");

        if (remaining > 0) {
            requestAnimationFrame(countdown);
        }
    }

    countdown();

    // --- Click handler ---
    function getClicks(event) {
        const rect = stim.getBoundingClientRect();

        // Get click position relative to image in [0,1]
        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;

        trialNumber++;

        // Save trial data as relative coordinates
        const trial = {
            trial: trialNumber,
            x_rel: parseFloat(relativeX.toFixed(4)),
            y_rel: parseFloat(relativeY.toFixed(4)),
            rt: Math.round(performance.now() - startTime)
        };

        data.push(trial);
        console.log("Trial saved:", trial);

        // --- Draw circle on displayed image ---
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

function saveImage() {
    const stim = document.getElementById("stim");
    
    // Create a canvas at the image's natural size
    const canvas = document.createElement("canvas");
    canvas.width = stim.naturalWidth;
    canvas.height = stim.naturalHeight;
    const ctx = canvas.getContext("2d");

    // Draw the underlying image
    ctx.drawImage(stim, 0, 0, canvas.width, canvas.height);

    // Draw each click circle using relative offsets
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

    // Convert canvas to base64 PNG
    const dataURL = canvas.toDataURL("image/png");

    // Save to Qualtrics Embedded Data
    if (window.Qualtrics && Qualtrics.SurveyEngine) {
        Qualtrics.SurveyEngine.setEmbeddedData("bellsImage", dataURL);
    }
}

function endTask() {

  console.log("Task complete.");
  console.log("Data:", data);

  const jsonData = JSON.stringify(data);

  saveImage();

  // Save entire dataset into one embedded field
  Qualtrics.SurveyEngine.setEmbeddedData("bellsData", jsonData);

  // Advance survey so data is actually submitted
  document.querySelector("#NextButton").click();
}
