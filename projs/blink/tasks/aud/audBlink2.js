import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import { saveData } from '../../funcs/saveData.js';
import { preloadSounds, playSound, buffer, audioCtx } from '../../funcs/utils.js';

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
let sounds = {}

let subjID = "";
const taskName = 'audBlink';

// Preload & setup
window.onload = async () => {

  subjID = prompt("Enter subject number:") || Math.floor(100 + Math.random() * 900);

    // Generate trials
    const t1opts = ['glide_up', 'glide_down'];
    const t2opts = ['a1_sh', 'a2_sh', 'a8_sh', 'a9_sh'];
    const lags = [0,3,9];
    const reps = 2;

    const trialRnd = randomizeFull(t1opts, t2opts, lags, reps);
    fullSeq = makeSeq(trialRnd, 'aud');

    window.trials = trialRnd
    trialTotal = window.trials.length;
    console.log(trialTotal)

    //
    const soundFiles = ['glide_up', 'glide_down', 'a1_sh', 'a2_sh', 'a8_sh', 'a9_sh', 'h1_sh','h2_sh','h3_sh','h4_sh','h5_sh','h6_sh','h7_sh','h8_sh','h9_sh','h10_sh','i1_sh','i2_sh','i3_sh','i4_sh','i5_sh','i6_sh','i7_sh','i8_sh','i9_sh','i10_sh']
    sounds = await preloadSounds(soundFiles)

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
    currentTrialRow = NaN;

    const stimuli = trialInfo.stimOrder;
    let t = audioCtx.currentTime;
    //trialStartTime = performance.now()

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
    // align JavaScript with audio clock
    const delay = (when - audioCtx.currentTime) * 1000;
    setTimeout(() => { $("#fix").text("+"); }, delay);
}

function scheduleFixOff(when) {
    const delay = (when - audioCtx.currentTime) * 1000;
    setTimeout(() => { $("#fix").text(""); }, delay);
}


// Response collection
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
            //t1_pos: "",
            //t2_pos: "",
            //rt1: "",
            //rt2: "",
            //time: now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0],
            //seqLen: stimuli.length,                         // length of the trial sequence
            //seqOrder: stimuli.map(s => s.stim).join(","),    // all stimuli in order, separated by semicolon

        };
    }

    if (question === 2 && response !== null) {
        currentTrialRow.resp1 = response;
        //currentTrialRow.rt1 = performance.now() - trialStartTime; 

    }

    if (question === 3 && response !== null) {
        currentTrialRow.resp2 = response;
        //currentTrialRow.rt2 = performance.now() - trialStartTime; 
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
