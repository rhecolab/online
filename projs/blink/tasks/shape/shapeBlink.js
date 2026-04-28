import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import { drawShape, runPractice, showMessage, buildTrialRow, qualtricsAdvance, updateProgressBar } from '../../funcs/utils.js';
import html from "./shapeBlink.html";
import "../../funcs/blink.css";
 
// Parameters
const stimON  = 150;
const stimOFF = 50;
 
let data         = [];
let currentTrial = null;
let currentTrialRow;
let trialTotal   = 0;
let fullSeq      = [];
let pracSeq      = [];
let trialStartTime;
let ctx;
let canvas;
 
window.trialNum = 0;
window.pracNum  = 0;
 
var subjID = "${e://Field/subjID}";
 
async function startTask() {
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);
    root.innerHTML = html;
 
    canvas = root.querySelector("#shapes");
    const side = Math.min(window.innerWidth, window.innerHeight, 400);
    canvas.width  = side;
    canvas.height = side;
    ctx = canvas.getContext("2d");
 
    const trialRnd = randomizeFull(
        ['circle','square','triangle','pentagon'],
        ['semiup','semidown','semileft','semiright'],
        [0,3,9], 2
    );
    fullSeq = makeSeq(trialRnd, 'shape');
    pracSeq = makeSeq([
        { t1: 'circle',   t2: 'semiup',   lag: 0 },
        { t1: 'square',   t2: 'semidown', lag: 3 },
        { t1: 'triangle', t2: 'semileft', lag: 9 },
    ], 'shape');
    trialTotal = fullSeq.length;
 
    document.getElementById("startButton").addEventListener("click", async () => {
        document.getElementById("instrBox").style.display = "none";
        await runPractice(pracSeq, runTrial);
        runTrial(fullSeq[0]);
    });
}
 
export default { startTask };
 
// ── Trial ─────────────────────────────────────────────────────────────────────
function runTrial(trialInfo, isPractice = false, on = stimON, off = stimOFF) {
    on = on ?? stimON;
    off = off ?? stimOFF;
    
    currentTrial = trialInfo;
    currentTrial.stimuli    = trialInfo.stimOrder;
    currentTrial.isPractice = isPractice;
    trialStartTime = performance.now();

    document.body.style.cursor = "none"; // Hide cursor
    const pause = document.getElementById("pauseScreen");
    pause.style.display = "none"; // Hide pause screen
 
    const stimuli = trialInfo.stimOrder;
    let i = 0;
 
    function showNext() {
        if (i < stimuli.length) {
            const stim = stimuli[i++];
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawShape(stim.stim, ctx, canvas.width / 2, canvas.height / 2,
                      stim.type === 't1' ? 'white' : 'black');
            setTimeout(showISI, on);
        } else {
            collectResp(1);
        }
    }
    function showISI() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setTimeout(showNext, off);
    }
    showNext();
}
 
// ── Response collection ───────────────────────────────────────────────────────
window.collectResp = function (question, response = null) {
    if (!currentTrial) return;
    const q1 = document.getElementById("q1");
    const q2 = document.getElementById("q2");

    document.body.style.cursor = "auto"; // Show cursor

    updateProgressBar(window.trialNum + (currentTrial.isPractice ? 0 : 1), trialTotal);

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

        const pause = document.getElementById("pauseScreen");
        const btn = pause.querySelector("#continueBtn");
        pause.style.display = "block";

        btn.onclick = () => {
            pause.style.display = "none";

            window.trialNum++;
            if (window.trialNum < trialTotal) {
                runTrial(fullSeq[window.trialNum], false);
            } else {
                qualtricsAdvance("shapeData", data);
            }
        };
    }
};