import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import html from "./visBlink.html";
import "../../funcs/blink.css";

// Parameters
const stimON = 131;
const stimOFF = 49;
let trialNum = 0;
let data = [];
let currentTrial = null;
let currentTrialRow = 0;
let trialTotal = 0;
let fullSeq = []
let trialStartTime;

let subjID = "";
let ctx;
const taskName = 'visBlink';

async function startTask(participantID) {

    subjID = participantID;

    // Create experiment container
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);
    
    // Inject HTML
    root.innerHTML = html;

    // Define trials
    const t1opts = ['1', '2', '3', '4'];
    const t2opts = ['5', '6', '7', '8'];
    const lags = [0,3,9];
    const reps = 2;

    const trialRnd = randomizeFull(t1opts, t2opts, lags, reps);
    fullSeq = makeSeq(trialRnd, 'vis');

    window.trials = trialRnd;
    trialTotal = window.trials.length;

    document.getElementById("startButton").addEventListener("click", () => {
        document.getElementById("instrBox").style.display = "none";
        document.getElementById("startButton").style.display = "none";
        runTrial(fullSeq[trialNum]);
    });
}

export default { startTask };


// Run single trial
function runTrial(trialInfo) {

    currentTrial = trialInfo; 
    currentTrialRow = NaN;
    currentTrial.stimuli = trialInfo.stimOrder;

    trialStartTime = performance.now();

    let i = 0;
    currentTrialRow = NaN;
    const stimuli = trialInfo.stimOrder;

    function showNext() {
        if (i < stimuli.length) {
            const stim = stimuli[i];
            console.log(stim)
            changeStim(stim);
            i++;
            setTimeout(showISI, stimON);
        } else {
            collectResp(1,trialInfo); 
        }
    }

    function showISI() {
        alphanum.innerHTML = '';
        setTimeout(showNext, stimOFF);
    }

    showNext();
}

function changeStim(stim) {
  console.log(stim.stim, stim.type)

  // Determine color
  let color;
  if (stim.type === 't1') color = 'white';
  else color = 'black'; // T2 and distractors

  // Put in the letter
  alphanum.innerHTML = stim.stim;
  alphanum.style.color = color;
}

window.collectResp = function(question, response = null) {

    const cTrial = trials[trialNum];
    console.log('t1', cTrial.t1);
    console.log('t2', cTrial.t2);
    console.log('lag', cTrial.lag);

    // Always initialize when question 1 is shown
    if (question === 1) {
          const now = new Date();

        currentTrialRow = {
            t1_item: cTrial.t1,
            t2_item: cTrial.t2,
            lag: cTrial.lag,
            resp1: "",
            resp2: "",
            t1_pos: "",
            t2_pos: "",
            rt1: "",
            rt2: "",
            time: now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0],
            seqLen: currentTrial.stimuli.length,
            seqOrder: currentTrial.stimuli.map(s => s.stim).join(","),
        };
    }

    if (question === 2 && response !== null) {
        currentTrialRow.resp1 = response;
        currentTrialRow.rt1 = performance.now() - trialStartTime;
    }

    if (question === 3 && response !== null) {
        currentTrialRow.resp2 = response;
        currentTrialRow.rt2 = performance.now() - trialStartTime;
    }

    if (question === 1) {
        if (q1) q1.style.display = "block";
        if (q2) q2.style.display = "none";
    }

    if (question === 2) {
        if (q1) q1.style.display = "none";
        if (q2) q2.style.display = "block";
    }

    if (question === 3) {
        data.push(currentTrialRow);
        currentTrialRow = null;

        if (q1) q1.style.display = "none";
        if (q2) q2.style.display = "none";
        trialNum++;

        if (trialNum < trialTotal) {
            runTrial(fullSeq[trialNum]);
        } else {
            endTask(subjID, taskName);
        }
    }
}

function endTask() {
  console.log("Task complete.");
  console.log("Data:", data);

  const jsonData = JSON.stringify(data);

  // Save entire dataset into one embedded field
  Qualtrics.SurveyEngine.setEmbeddedData("blinkData", jsonData);

  // Advance survey so data is actually submitted
  document.querySelector("#NextButton").click();
}
