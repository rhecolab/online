
import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import { preloadSounds, playSound, buffer, audioCtx, runPractice, showTrialCounter, showMessage } from '../../funcs/utils.js';
import html from "./audBlink.html";
import "../../funcs/blink.css";

window.playSound = playSound;
window.preloadSounds = preloadSounds;

// Parameters
const stimON = 300;
const stimOFF = 300;
let data = [];
let currentTrial = null;
let currentTrialRow = 0;
let trialTotal = 0;
let pracTotal = 3;
let fullSeq = []
let pracSeq = [];
let trialStartTime;

window.trialNum = 0
window.pracNum = 0;

var subjID = "${e://Field/subjID}";
const taskName = 'audBlink';

async function startTask(participantID) {

    // Create experiment container
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);

    // Inject HTML
    root.innerHTML = html;

    // Define trials
    const t1opts = ['glide_up', 'glide_down'];
    const t2opts = ['a1_sh', 'a2_sh', 'a8_sh', 'a9_sh'];
    const lags = [0,3,9];
    const reps = 2;

    const trialRnd = randomizeFull(t1opts, t2opts, lags, reps);
    fullSeq = makeSeq(trialRnd, 'aud');

    const pracTrials = [
        { t1: 'glide_up',   t2: 'a1_sh', lag: 0 },
        { t1: 'glide_down', t2: 'a8_sh', lag: 3 },
        { t1: 'glide_up',   t2: 'a2_sh', lag: 9 }
    ];

    const pracSeq = makeSeq(pracTrials, 'aud');

    window.trials = trialRnd;
    trialTotal = window.trials.length;

    const soundFiles = [
      'glide_up','glide_down','a1_sh','a2_sh','a8_sh','a9_sh',
      'h1_sh','h2_sh','h3_sh','h4_sh','h5_sh','h6_sh','h7_sh','h8_sh','h9_sh','h10_sh',
      'i1_sh','i2_sh','i3_sh','i4_sh','i5_sh','i6_sh','i7_sh','i8_sh','i9_sh','i10_sh'
    ];

    await preloadSounds(soundFiles);

    document.getElementById("startButton").addEventListener("click", async () => {

        document.getElementById("instrBox").style.display = "none";
        document.getElementById("startButton").style.display = "none";

        // Run practice block first
        await runPractice(pracSeq, runTrial);
        
        // Show transition message
        await showMessage("Practice complete! Main trials will start soon.");

        // Reset for main trials
        runTrial(fullSeq[trialNum],false);
    });

}

export default { startTask };


// Run single trial
function runTrial(trialInfo, isPractice = false) {
    currentTrial = trialInfo;
    currentTrialRow = NaN;
    currentTrial.stimuli = trialInfo.stimOrder;
    currentTrial.isPractice = isPractice;

    trialStartTime = performance.now();
    
    const stimuli = trialInfo.stimOrder;
    let t = audioCtx.currentTime;

        // Show trial counter
        if (isPractice) {
            window.pracNum = (window.pracNum || 0) + 1;
            //showTrialCounter(true, window.pracNum, pracSeq.length);
        } else {
            window.trialNum = (window.trialNum || 0) + 1;
            //showTrialCounter(false, window.trialNum, fullSeq.length);
        }

    for (let i = 0; i < stimuli.length; i++) {
        const stim = stimuli[i];

        playSound(stim.stim, t);
        scheduleFixOn(t);
        scheduleFixOff(t + stimON / 1000);
        t += (stimON + stimOFF) / 1000;
    }

    // After last stimulus, go to question screen
    const totalTime = stimuli.length * (stimON + stimOFF);
    setTimeout(() => collectResp(1, trialInfo), totalTime);
}

function scheduleFixOn(when) {
    const delay = Math.max(0, (when - audioCtx.currentTime) * 1000);
    setTimeout(() => {   
        const fix = document.getElementById("fix");
        if (fix) fix.textContent = "+";
    }, delay);
}

function scheduleFixOff(when) {
    const delay = Math.max(0, (when - audioCtx.currentTime) * 1000);
    setTimeout(() => { 
        const fix = document.getElementById("fix");
        if (fix) fix.textContent = "";
    }, delay);
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

            if (window.pracNum < pracTotal) {
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
  Qualtrics.SurveyEngine.setEmbeddedData("audData", jsonData);

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