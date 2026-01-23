import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import { saveData } from '../../funcs/saveData.js';

// Parameters
const stimON = 131;
const stimOFF = 49;
let trialNum = 0;
let data = [];
let currentTrial = null;
let currentTrialRow = 0;
let trialTotal = 0;
let fullSeq = []

let subjID = "";
let ctx;
const taskName = 'visBlink';

// Preload & setup
window.onload = () => {

    subjID = prompt("Enter subject number:") || Math.floor(100 + Math.random() * 900);

    // Generate trials
    const t1opts = ['1', '2', '3', '4'];
    const t2opts = ['5', '6', '7', '8'];
    const lags = [0,3,9];
    const reps = 2;

    const trialRnd = randomizeFull(t1opts, t2opts, lags, reps);
    fullSeq = makeSeq(trialRnd, 'vis');

    window.trials = trialRnd
    trialTotal = window.trials.length;
    console.log(trialTotal)

    // Start button listener
    document.getElementById("startButton").addEventListener("click", () => {
        document.getElementById("instrBox").style.display = "none";
        document.getElementById("startButton").style.display = "none";
        runTrial(fullSeq[trialNum]);

    });
};

// Run single trial
function runTrial(trialInfo) {

    currentTrial = trialInfo; 

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
            collectResp(1,trialInfo); // Move to response collection
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

// Response collection
//window.collectResp = function(question, response = null) {

 //   const cTrial = trials[trialNum];
 //   console.log('t1', cTrial.t1);
 //   console.log('t2', cTrial.t2);
 //   console.log('lag', cTrial.lag);

    // Always initialize when question 1 is shown
 //   if (question === 1) {
 //        $("#q1").show();
//
 //        currentTrialRow = {
 //           t1_item: cTrial.t1,
 //           t2_item: cTrial.t2,
 //           lag: cTrial.lag,
 //           resp1: "",
 //           resp2: ""
 //       };
 //   }

//    if (question === 2) {
//        const r1 = document.getElementById("q1input").value.trim();
//        currentTrialRow.resp1 = r1;

 //       $("#q1").hide();
 //       $("#q2").show();
 //       return;
 //   }

//       if (question === 3) {
//        const r2 = document.getElementById("q2input").value.trim();
//        currentTrialRow.resp2 = r2;

//        data.push(currentTrialRow);
//        currentTrialRow = null;

 //       $("#q2").hide();
 //       trialNum++;

 //       if (trialNum < trialTotal) {
 //           document.getElementById("q1input").value = "";
 //           document.getElementById("q2input").value = "";
 //           runTrial(fullSeq[trialNum]);
 //       } else {
 //           endTask(subjID, taskName);
 //       }
 //   }

 //   }

// Response collection
window.collectResp = function(question, response = null) {

    const cTrial = trials[trialNum];
    console.log('t1', cTrial.t1);
    console.log('t2', cTrial.t2);
    console.log('lag', cTrial.lag);

    // Always initialize when question 1 is shown
    if (question === 1) {
        currentTrialRow = {
            t1_item: cTrial.t1,
            t2_item: cTrial.t2,
            lag: cTrial.lag,
            resp1: "",
            resp2: ""
        };
    }

    if (question === 2 && response !== null) {
        currentTrialRow.resp1 = response;
    }

    if (question === 3 && response !== null) {
        currentTrialRow.resp2 = response;
    }

    if (question === 1) {
        $("#q1").show();
        $("#q2").hide();
    }

    if (question === 2) {
        $("#q1").hide();
        $("#q2").show();
    }

    if (question === 3) {
        data.push(currentTrialRow);
        currentTrialRow = null;

        $("#q1, #q2").hide();
        trialNum++;

        if (trialNum < trialTotal) {
            runTrial(fullSeq[trialNum]);
        } else {
            endTask(subjID, taskName);
        }
    }
}

// End experiment
function endTask(subjID, taskName) {
    document.getElementById("exptBox").innerText = "Task complete!";
    console.log("Subject ID:", subjID);
    console.log("Data:", data);
    saveData(subjID, taskName, data);
}
