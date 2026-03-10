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
let clickListener = null; 
let warningText;
let continueButton;

async function startTask(participantID) {

    subjID = participantID;

    // Create experiment container & inject html
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);
    root.innerHTML = html;

    // Hide bells image at first 
    document.getElementById("stim").style.display = "none";
    document.getElementById("submitDiv").style.display = "none";

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

    // Create function to reset timers
        function resetTimers() {

        clearTimeout(warningTimeout);
        clearTimeout(autoSubmitTimeout);

        warningText.style.display = "none";
        continueButton.style.display = "none";

        warningTimeout = setTimeout(() => {
            warningText.textContent =
                "You haven’t clicked in a while. Click another bell to continue working or click 'submit' to finish the task.";
            warningText.style.display = "block";
            continueButton.style.display = "inline-block";
        }, reminderTime);

        autoSubmitTimeout = setTimeout(() => {
            endTask();
        }, submitTime);
    }

    // Define everything
    const stimWrapper = document.getElementById("stim");
    const stimImage = document.getElementById("bells");
    const container = document.getElementById("stimContainer");
    const submitDiv = document.getElementById("submitDiv");
    const submitButton = document.getElementById("submitButton");

    // Make stimulus visible 
    stimWrapper.style.display = "block";
    submitDiv.style.display = "block";

    // Get trial start time
    startTime = performance.now();

    // Add warning message + continue button
    warningText = document.createElement("p");
    warningText.id = "warningText";

    continueButton = document.createElement("button");
    continueButton.id = "continueButton";
    continueButton.textContent = "Continue";
    continueButton.className = "button";

    submitDiv.insertBefore(warningText, submitButton);
    submitDiv.insertBefore(continueButton, submitButton);

    // Actually restart timers 
    resetTimers();


    clickListener = function (event) {

        const rect = stimImage.getBoundingClientRect();

        const relativeX = (event.clientX - rect.left) / rect.width;
        const relativeY = (event.clientY - rect.top) / rect.height;

        // Prevent invalid clicks
        if (relativeX < 0 || relativeX > 1 || relativeY < 0 || relativeY > 1) {
            return;
        }

        trialNumber++;

        const trial = {
            trial: trialNumber,
            x_rel: parseFloat(relativeX.toFixed(4)),
            y_rel: parseFloat(relativeY.toFixed(4)),
            rt: Math.round(performance.now() - startTime)
        };

        data.push(trial);

        const circle = document.createElement("div");
        const displayX = relativeX * rect.width;
        const displayY = relativeY * rect.height;

        circle.style.left = `${displayX - 10}px`;
        circle.style.top = `${displayY - 10}px`;

        container.appendChild(circle);
    };

    stimImage.addEventListener("click", clickListener);

    submitButton.addEventListener("click", endTask);

    continueButton.addEventListener("click", () => {
        warningText.style.display = "none";
        continueButton.style.display = "none";
        resetTimers();
    });

    resetTimers();
}

function saveImage() {

    const stimImage = document.getElementById("bells");

    const canvas = document.createElement("canvas");
    canvas.width = stimImage.naturalWidth;
    canvas.height = stimImage.naturalHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(stimImage, 0, 0, canvas.width, canvas.height);

    data.forEach(trial => {
        const x = trial.x_rel * canvas.width;
        const y = trial.y_rel * canvas.height;

        ctx.beginPath();
        ctx.arc(x, y, 7, 0, 2 * Math.PI);
        ctx.fillStyle = "rgba(255,0,0,0.6)";
        ctx.fill();
        ctx.strokeStyle = "black";
        ctx.lineWidth = 2;
        ctx.stroke();
    });

    const dataURL = canvas.toDataURL("image/png");

    if (window.Qualtrics && Qualtrics.SurveyEngine) {
        Qualtrics.SurveyEngine.setEmbeddedData("bellsImage", dataURL);
    }
}


function endTask() {

    if (taskEnded) return;
    taskEnded = true;

    clearTimeout(warningTimeout);
    clearTimeout(autoSubmitTimeout);

    const stimImage = document.getElementById("bells");
    if (clickListener) {
        stimImage.removeEventListener("click", clickListener);
    }

    saveImage();

    const jsonData = JSON.stringify(data);
    Qualtrics.SurveyEngine.setEmbeddedData("bellsData", jsonData);

    document.querySelector("#NextButton").click();
}