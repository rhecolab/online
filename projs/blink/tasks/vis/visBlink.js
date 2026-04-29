import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import { runPractice, showMessage, buildTrialRow, qualtricsAdvance, updateProgressBar } from '../../funcs/utils.js';
import html from "./visBlink.html";
import "../../funcs/blink.css";
 
// Parameters
const stimON  = 131;
const stimOFF = 49;
 
let data         = [];
let currentTrial = null;
let currentTrialRow;
let trialTotal   = 0;
let fullSeq      = [];
let pracSeq      = [];
let trialStartTime;
 
window.trialNum  = 0;
window.pracNum   = 0;
 
var subjID = "${e://Field/subjID}";
 
async function startTask() {
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);
    root.innerHTML = html;
 
    const trialRnd = randomizeFull(['1','2','3','4'], ['5','6','7','8'], [0,3,9], 2);
    fullSeq = makeSeq(trialRnd, 'vis');
    pracSeq = makeSeq([
        { t1: '2', t2: '8', lag: 0 },
        { t1: '4', t2: '6', lag: 3 },
        { t1: '1', t2: '5', lag: 9 },
    ], 'vis');
    trialTotal = fullSeq.length;
 
    document.getElementById("startButton").addEventListener("click", async () => {
        document.getElementById("instrBox").style.display = "none";
        await runPractice(pracSeq, runTrial, { on: 300, off: 100 });
        runTrial(fullSeq[0]);
    });
}
 
export default { startTask };

// ── Trial ───────────────────────────────────────────────────────────────────
function runTrial(trialInfo, isPractice = false, on = stimON, off = stimOFF) {
    on = on ?? stimON;
    off = off ?? stimOFF;


    currentTrial = trialInfo;
    currentTrial.stimuli   = trialInfo.stimOrder;
    currentTrial.isPractice = isPractice;
    trialStartTime = performance.now();
 
    const stimuli = trialInfo.stimOrder;
    let i = 0;

    document.body.style.cursor = "none"; // Hide cursor
    const pause = document.getElementById("pauseScreen");
    pause.style.display = "none"; // Hide pause screen

    function showNext() {
        if (i < stimuli.length) {
            changeStim(stimuli[i++]);
            setTimeout(showISI, on);
        } else {
            collectResp(1);
        }
    }
    function showISI() {
        document.getElementById("alphanum").innerHTML = "";
        setTimeout(showNext, off);
    }
    showNext();
}
 
function changeStim(stim) {
    const el = document.getElementById("alphanum");
    el.textContent = stim.stim;
    el.style.color = stim.type === 't1' ? 'white' : 'black';
}
 
// ── Response collection ───────────────────────────────────────────────────────
window.collectResp = function (question, response = null) {
    if (!currentTrial) return;
    const q1 = document.getElementById("q1");
    const q2 = document.getElementById("q2");

    updateProgressBar(window.trialNum + (currentTrial.isPractice ? 0 : 1), trialTotal);

    document.body.style.cursor = "auto"; // Show cursor
 
    if (question === 1) {
        currentTrialRow = buildTrialRow(currentTrial);
        q1.style.display = "block";
        q2.style.display = "none";
    }
 
    if (question === 2 && response !== null) {
        currentTrialRow.resp1 = response;
        currentTrialRow.rt1   = performance.now() - trialStartTime;
        q1.style.display = "none";
        q2.style.display = "block";
    }
 
    if (question === 3 && response !== null) {

        currentTrialRow.resp2 = response;
        currentTrialRow.rt2   = performance.now() - trialStartTime;
        if (!currentTrial.isPractice) data.push(currentTrialRow);

        q1.style.display = "none";
        q2.style.display = "none";

        if (currentTrial.isPractice) {
            window.pracTrialNum = (window.pracTrialNum || 0) + 1;  // ADD THIS
        return;
    }    

    q1.style.display = "none";
        q2.style.display = "none";

        const pause = document.getElementById("pauseScreen");
        const btn = pause.querySelector("#continueBtn");
        pause.style.display = "block";

        btn.onclick = () => {
            pause.style.display = "none";

            window.trialNum++;
            if (window.trialNum < trialTotal) {
                runTrial(fullSeq[window.trialNum], false);
            } else {
                qualtricsAdvance("visData", data);
            }
        };
    }

}
