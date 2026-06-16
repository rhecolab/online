import html from "./skeleton.html";
import "../../funcs/skeleton.css";
 
// ── Define parameters ───────────────────────────────────────────────────────────────────
let data = [];
let totalTrial = 4;
let stimuli = ["cat", "dog", "bird", "horse"]; 
let stimON = 100;
let stimOFF = 200;

window.trialNum  = 0;
window.pracNum   = 0;
 

// ── Trial ───────────────────────────────────────────────────────────────────
async function startTask(){
    await runTrial();
}

function runTrial (isPractice = false) {
    // Show the stimulus image
    const stimImg = document.getElementById("stimImg");
    stimImg.src = `stimuli/img/${stimuli[trialNum]}.jpg`;  // Set the image source
    stimImg.style.display = "block";

    // Hide it after stimON ms, then show the response buttons
    setTimeout(() => {
        stimImg.style.display = "none";
        setTimeout(showResponse, stimOFF);
    }, stimON);


}

// ── Response collection ────────────────────────────────────────────────────
function showResponse() {
    document.getElementById("responseBox").style.display = "block";
}

window.collectResp = function(response) {
    document.getElementById("responseBox").style.display = "none";
    saveData(response);

    trialNum++;
    if (trialNum < trialList.length) {
        runTrial();
    } else {
        document.getElementById("exptBox").textContent = "Done!";
        document.getElementById("exptBox").style.display = "block";
        console.log(data);
    }
};
