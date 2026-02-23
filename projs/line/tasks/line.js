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
        bisectLine.style.display = "block";
        bisectLine.style.left = event.offsetX + "px";
    }

    function handleMouseLeave() {
        bisectLine.style.display = "none";
    }

    line.addEventListener("mousemove", handleMouseMove);
    line.addEventListener("mouseleave", handleMouseLeave);

  function handleClick(event) {

        const offsetX = event.offsetX;
        const clickX = event.clientX;
        const rt = performance.now() - startTime;

        const deviationPx = clickX - trueMid;
        const deviationRel = deviationPx / rect.width;

        data.push({
            trial: trialNumber + 1,
            lineLength: rect.width,
            clickPosition: offsetX,
            deviationPx: Math.round(deviationPx),
            deviationRel: parseFloat(deviationRel.toFixed(4)),
            rt: Math.round(rt)
        });

        // Create permanent marker
        const finalMark = document.createElement("div");
        finalMark.style.position = "absolute";
        finalMark.style.top = "-20px";
        finalMark.style.width = "2px";
        finalMark.style.height = "44px";
        finalMark.style.background = "blue";
        finalMark.style.left = offsetX + "px";

        line.parentElement.appendChild(finalMark);

        // Cleanup listeners
        line.removeEventListener("mousemove", handleMouseMove);
        line.removeEventListener("mouseleave", handleMouseLeave);
        line.removeEventListener("click", handleClick);

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
