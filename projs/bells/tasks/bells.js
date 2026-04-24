import html from "./bells.html";
import "../funcs/bells.css";
 
// Parameters
let data = [];
let trialNumber = 0;
let startTime;
 
var subjID = "${e://Field/subjID}";
const taskName = 'bells';
 
let reminderTime = 30 * 1000; // after 30 sec of no clicks, ask if they want to submit
let submitTime = 180 * 1000; // if there's no clicks for 180 sec, auto submit

let warningTimeout;
let autoSubmitTimeout;
let taskEnded = false; 
let clickListener = null; 
let warningText;
let continueButton;

async function startTask() {

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
 
        if (taskEnded) return;
 
        console.log("Timers reset");
 
        clearTimeout(warningTimeout);
        clearTimeout(autoSubmitTimeout);
 
        warningText.style.display = "none";
        continueButton.style.display = "none";
 
        warningTimeout = setTimeout(() => {
            warningText.textContent =
                "You haven’t clicked in a while. Click continue to keep working or click 'submit' to finish the task.";
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
 
    submitButton.before(warningText);
    submitButton.before(continueButton);
 
    clickListener = function (event) {
 
        resetTimers();
 
        const imgRect = stimImage.getBoundingClientRect();
 
        const relativeX = (event.clientX - imgRect.left) / imgRect.width;
        const relativeY = (event.clientY - imgRect.top) / imgRect.height;
 
        // Prevent invalid clicks (outside the image)
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
 
        // Position circle relative to stimContainer (its parent)
        const containerRect = container.getBoundingClientRect();
        const displayX = event.clientX - containerRect.left;
        const displayY = event.clientY - containerRect.top;
 
        const circle = document.createElement("div");
        circle.style.position = "absolute";
        circle.style.width = "20px";
        circle.style.height = "20px";
        circle.style.border = "2px solid red";
        circle.style.borderRadius = "50%";
        circle.style.pointerEvents = "none";
        circle.style.zIndex = "10";
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
    
}
 
function endTask() {
 
    if (taskEnded) return;
    taskEnded = true;
 
    // Stop timers
    clearTimeout(warningTimeout);
    clearTimeout(autoSubmitTimeout);
 
    // Remove click listener
    const stimImage = document.getElementById("bells");
    if (clickListener) {
        stimImage.removeEventListener("click", clickListener);
    }
 
    // Save data
    const jsonData = JSON.stringify(data);
    Qualtrics.SurveyEngine.setEmbeddedData("bellsData", jsonData);
 
    // 
    // submit with lots of options to handle qualtrics
    try {
        if (typeof Qualtrics !== "undefined" &&
            Qualtrics.SurveyEngine &&
            typeof Qualtrics.SurveyEngine.navNext === "function") {
            console.log("Advancing via navNext()");
            Qualtrics.SurveyEngine.navNext();
            return;
        }
    } catch(e) {
        console.warn("navNext() failed:", e);
    }
 
    // click nextbutton if exists
    const attemptNextClick = () => {
        const nextBtn = document.querySelector("#NextButton");
        if (nextBtn) {
            console.log("Advancing via NextButton click");
            nextBtn.style.visibility = "visible";  // ensure clickable
            nextBtn.click();
        } else {
            // Retry until the button exists
            setTimeout(attemptNextClick, 50);
        }
    };
    attemptNextClick();
 
    // submit as form if other options don't work
    const attemptFormSubmit = () => {
        const form = document.querySelector("form[name='QualtricsForm']");
        if (form) {
            console.log("Advancing via form.submit()");
            form.submit();
        } else {
            setTimeout(attemptFormSubmit, 50);
        }
    };
    setTimeout(attemptFormSubmit, 500); // delayed fallback to avoid double submission
}