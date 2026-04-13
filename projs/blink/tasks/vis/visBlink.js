import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import { runPractice, showTrialCounter, showMessage } from '../../funcs/utils.js';

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
let fullSeq = [];
let pracSeq = [];
let trialStartTime;

var subjID = "${e://Field/subjID}";
let ctx;
const taskName = 'visBlink';

window.trialNum = 0
window.pracNum = 0;

async function startTask(subjID) {

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

    const pracTrials = [
        { t1: '2',   t2: '8', lag: 0 },
        { t1: '4', t2: '6', lag: 3 },
        { t1: '1',   t2: '9', lag: 9 }
    ];

    pracSeq = makeSeq(pracTrials, 'vis');

    window.trials = trialRnd; 
    trialTotal = window.trials.length;

    document.getElementById("startButton").addEventListener("click", async () => {
        document.getElementById("instrBox").style.display = "none";
        document.getElementById("startButton").style.display = "none";

        // Run practice block first
        await runPractice(pracSeq, runTrial);

        // Show transition message
        await showMessage("Practice complete! Main trials will start soon.");
        await new Promise(r => setTimeout(r, 1000));

        // Run main trials
        runTrial(fullSeq[trialNum]);
    });
}

// this is important for the bundle to bundle properly
export default { startTask };

// Run single trial
function runTrial(trialInfo, isPractice = false) {

    currentTrial = trialInfo; 
    currentTrialRow = NaN;
    currentTrial.stimuli = trialInfo.stimOrder;
    currentTrial.isPractice = isPractice;

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

// Response collection
window.collectResp = function (question, response = null) {

    const cTrial = currentTrial;
    if (!cTrial) {
        console.error("collectResp called with no currentTrial");
        return;
    }

    const q1 = document.getElementById("q1");
    const q2 = document.getElementById("q2");
    //document.getElementById("progressContainer").style.display = "block";

    // question 1
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
            time:
                now.toISOString().split("T")[0] +
                " " +
                now.toTimeString().split(" ")[0],
            seqLen: cTrial.stimuli.length,
            seqOrder: cTrial.stimuli.map(s => s.stim).join(","),
        };

        if (q1) q1.style.display = "block";
        if (q2) q2.style.display = "none";

        // Show trial counter
        //if (isPractice) {
        //    showTrialCounter(true, window.pracNum+1, pracSeq.length);
        //} else {
        //    showTrialCounter(false, window.trialNum+1, fullSeq.length);
        //}
    }

    // question 2
    if (question === 2 && response !== null) {
        currentTrialRow.resp1 = response;
        currentTrialRow.rt1 = performance.now() - trialStartTime;

        if (q1) q1.style.display = "none";
        if (q2) q2.style.display = "block";
    }

    // question 3 (end task)
    if (question === 3 && response !== null) {

        currentTrialRow.resp2 = response;
        currentTrialRow.rt2 = performance.now() - trialStartTime;

        // save data only for main trials
        if (!currentTrial.isPractice) {
            data.push(currentTrialRow);
        }

        currentTrialRow = null;

        // hide questions
        if (q1) q1.style.display = "none";
        if (q2) q2.style.display = "none";

        // Practice 
        if (currentTrial.isPractice) {

            window.pracNum = (window.pracNum || 0) + 1;

            if (window.pracNum < pracSeq.length) {
                runTrial(pracSeq[window.pracNum], true);
                return;
            }

            // transition to main task
            window.trialNum = 0;
            runTrial(fullSeq[0], false);
            return;
        }

       // Main trials
        window.trialNum = (window.trialNum || 0) + 1;

        console.log("trialNum:", window.trialNum, "trialTotal:", trialTotal);

        if (window.trialNum < trialTotal) {
            runTrial(fullSeq[window.trialNum], false);
        } else {
            console.log("Ending task now");
            endTask();
        }
    }
};


function endTask() {
  console.log("Task complete.");
  console.log("Data:", data);

  const jsonData = JSON.stringify(data);

  // Save entire dataset into one embedded field
  Qualtrics.SurveyEngine.setEmbeddedData("visData", jsonData);

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
