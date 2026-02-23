import { } from '../funcs/utils_line.js';
import html from "./line.html";
import "../funcs/line.css";

// Parameters
let data = [];
let trialNumber = 0;

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

    // Make stimulus div visible 
    const stim = document.getElementById("stim");
    stim.style.display = "block";
    
    // Create line & get midpoint
    const line = document.getElementById("line");
    line.style.width = "400px";
    const rect = line.getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    // Show bisect line following mouse
    line.addEventListener("mousemove", (event) => {
        const offsetX = event.offsetX;

        const bisectLine = document.getElementById("bisectLine");
        bisectLine.style.display = "block";
        bisectLine.style.left = offsetX + "px";
    });

    line.addEventListener("mouseleave", () => {
        const bisectLine = document.getElementById("bisectLine");
        bisectLine.style.display = "none";
    });

    // Record click location 
    const startTime = performance.now();

    line.addEventListener("click", function handleClick(event) {

    const offsetX = event.offsetX;
    const clickX = event.clientX;
    const rt = performance.now() - startTime;

    const deviationPx = clickX - midpoint;
    const deviationRel = deviationPx / rect.width;

    trialData.push({
        clickPosition: offsetX,
        deviationPx: Math.round(deviationPx),
        deviationRel: parseFloat(deviationRel.toFixed(4)),
        rt: Math.round(rt)
    });
})

    // Create permanent marker
    const finalMark = document.createElement("div");
    finalMark.style.position = "absolute";
    finalMark.style.top = "-20px";
    finalMark.style.width = "2px";
    finalMark.style.height = "44px";
    finalMark.style.background = "blue";
    finalMark.style.left = offsetX + "px";

    wrapper.appendChild(finalMark);

    line.removeEventListener("click", handleClick);
    console.log(trialData);
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
