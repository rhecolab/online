import { randomizeFull, makeSeq } from '../../funcs/randomization.js';
import { preloadSounds, playSound, audioCtx, runPractice, showMessage, updateProgressBar, buildTrialRow, qualtricsAdvance } from '../../funcs/utils.js';
import html from "./audBlink.html";
import "../../funcs/blink.css";
 
window.playSound = playSound;
 
// Parameters
const stimON  = 300;
const stimOFF = 300;
 
let data         = [];
let currentTrial = null;
let currentTrialRow;
let trialTotal   = 0;
let fullSeq      = [];
let pracSeq      = [];
let trialStartTime;
 
window.trialNum = 0;
window.pracNum  = 0;
 
var subjID = "${e://Field/subjID}";
 
async function startTask() {
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);
    root.innerHTML = html;
 
    const trialRnd = randomizeFull(
        ['glide_up','glide_down'],
        ['a1_sh','a2_sh','a8_sh','a9_sh'],
        [0,3,9], 2
    );
    fullSeq = makeSeq(trialRnd, 'aud');
    pracSeq = makeSeq([
        { t1: 'glide_up',   t2: 'a1_sh', lag: 0 },
        { t1: 'glide_down', t2: 'a8_sh', lag: 3 },
        { t1: 'glide_up',   t2: 'a2_sh', lag: 9 },
    ], 'aud');
    trialTotal = fullSeq.length;
 
    await preloadSounds([
        'glide_up','glide_down','a1_sh','a2_sh','a8_sh','a9_sh',
        'h1_sh','h2_sh','h3_sh','h4_sh','h5_sh','h6_sh','h7_sh','h8_sh','h9_sh','h10_sh',
        'i1_sh','i2_sh','i3_sh','i4_sh','i5_sh','i6_sh','i7_sh','i8_sh','i9_sh','i10_sh',
    ]);
 
    document.getElementById("startButton").addEventListener("click", async () => {
        document.getElementById("instrBox").style.display = "none";
        await runPractice(pracSeq, runTrial);
        runTrial(fullSeq[0], false);
    });
}
 
export default { startTask };
 
// ── Trial ─────────────────────────────────────────────────────────────────────
function runTrial(trialInfo, isPractice = false) {
    currentTrial = trialInfo;
    currentTrial.stimuli    = trialInfo.stimOrder;
    currentTrial.isPractice = isPractice;
    trialStartTime = performance.now();
 
    const stimuli = trialInfo.stimOrder;
    let t = audioCtx.currentTime;
 
    for (const stim of stimuli) {
        playSound(stim.stim, t);
        scheduleFixAt(t, "+");
        scheduleFixAt(t + stimON / 1000, "");
        t += (stimON + stimOFF) / 1000;
    }
 
    setTimeout(() => collectResp(1), stimuli.length * (stimON + stimOFF));
}
 
function scheduleFixAt(when, text) {
    const delay = Math.max(0, (when - audioCtx.currentTime) * 1000);
    setTimeout(() => {
        const fix = document.getElementById("fix");
        if (fix) fix.textContent = text;
    }, delay);
}
 
// ── Response collection ───────────────────────────────────────────────────────
window.collectResp = function (question, response = null) {
    if (!currentTrial) return;
    const q1 = document.getElementById("q1");
    const q2 = document.getElementById("q2");
 
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
 
        if (currentTrial.isPractice) {
            window.pracTrialNum = (window.pracTrialNum || 0) + 1;
            return;
        }
 
        window.trialNum++;
        if (window.trialNum < trialTotal) {
            runTrial(fullSeq[window.trialNum], false);
        } else {
            qualtricsAdvance("audData", data);
        }
    }
};
 