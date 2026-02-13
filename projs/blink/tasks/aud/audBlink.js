import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import { preloadSounds, playSound, buffer, audioCtx } from '../../funcs/utils.js';
import html from "./audBlink.html";
import "../../funcs/blink.css";


window.playSound = playSound;
window.preloadSounds = preloadSounds;

// Parameters
const stimON = 300;
const stimOFF = 300;
let trialNum = 0;
let data = [];
let currentTrial = null;
let currentTrialRow = 0;
let trialTotal = 0;
let fullSeq = []
let trialStartTime;

let subjID = "";
const taskName = 'audBlink';

async function startTask(participantID) {

    subjID = participantID;

    // Create experiment container
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);

    // Inject HTML
    root.innerHTML = html;

    const t1opts = ['glide_up', 'glide_down'];
    const t2opts = ['a1_sh', 'a2_sh', 'a8_sh', 'a9_sh'];
    const lags = [0,3,9];
    const reps = 2;

    const trialRnd = randomizeFull(t1opts, t2opts, lags, reps);
    fullSeq = makeSeq(trialRnd, 'aud');

    window.trials = trialRnd;
    trialTotal = window.trials.length;

    const soundFiles = [
      'glide_up','glide_down','a1_sh','a2_sh','a8_sh','a9_sh',
      'h1_sh','h2_sh','h3_sh','h4_sh','h5_sh','h6_sh','h7_sh','h8_sh','h9_sh','h10_sh',
      'i1_sh','i2_sh','i3_sh','i4_sh','i5_sh','i6_sh','i7_sh','i8_sh','i9_sh','i10_sh'
    ];

    await preloadSounds(soundFiles);

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
    
    const stimuli = trialInfo.stimOrder;
    let t = audioCtx.currentTime;

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
window.collectResp = function(question, response = null) {

    const cTrial = trials[trialNum];
    console.log('t1', cTrial.t1);
    console.log('t2', cTrial.t2);
    console.log('lag', cTrial.lag);

    const q1 = document.getElementById("q1");
    const q2 = document.getElementById("q2");

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
