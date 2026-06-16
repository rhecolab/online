// Qualtrics needs absolute URLs for stimuli; fall back to relative for local dev
const GITHUB_PATH = "https://rhecolab.github.io/online/projs/blink/";
 
function getBasePath() {
    const { hostname, protocol } = window.location;
    return (hostname === "localhost" || hostname === "127.0.0.1" || protocol === "file:")
        ? "../../"
        : GITHUB_PATH;
}
 
// ── Practice runner ──────────────────────────────────────────────────────────
// Runs each practice trial in sequence, waiting for window.pracTrialNum to
// increment (set by collectResp in each task) before advancing.
export async function runPractice(seq, func, trialArgs = {}) {

    window.pracTrialNum = 0
    
    for (let i = 0; i < seq.length; i++) {
        const startTrial = window.pracTrialNum;
        const fix = document.getElementById("fix");
        if (fix) fix.textContent = "";

        func(seq[i], true, trialArgs.on, trialArgs.off);  // forward here

        await new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.pracTrialNum > startTrial) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });
    }
    await showMessage("Practice finished! Press continue for main trials.");
}

 
// ── Overlay message with fade in/out ─────────────────────────────────────────
export function showMessage(text) {
    return new Promise(resolve => {
        const overlay = document.createElement("div");
        overlay.className = "overlayBox";
        overlay.innerHTML = `
            <div style="text-align:center; max-width:520px; padding:0 24px;">
                ${text}<br><br>
                <button id="continueBtn" style="font-size:18px; padding:10px 28px;">Continue</button>
            </div>`;
        document.body.appendChild(overlay);
        overlay.querySelector("#continueBtn").onclick = () => {
            overlay.remove();
            resolve();
        };
    });
}
 
// ── Shared trial row builder ──────────────────────────────────────────────────
// Reads t1_pos / t2_pos that makeSeq computed and bakes them into the data row.
export function buildTrialRow(trial) {
    const now = new Date();
    return {
        t1_item:   trial.t1,
        t2_item:   trial.t2,
        lag:       trial.lag,
        t1_pos:    trial.t1_pos,
        t2_pos:    trial.t2_pos,
        resp1:     "",
        resp2:     "",
        rt1:       "",
        rt2:       "",
        time:      now.toISOString().split("T")[0] + " " + now.toTimeString().split(" ")[0],
        seqLen:    trial.stimuli.length,
        seqOrder:  trial.stimuli.map(s => s.stim).join(","),
    };
}
 
// ── Qualtrics submission ──────────────────────────────────────────────────────
// Saves data to an embedded field then advances to the next survey page.
export function qualtricsAdvance(fieldName, data) {
    Qualtrics.SurveyEngine.setEmbeddedData(fieldName, JSON.stringify(data));
 
    try {
        Qualtrics.SurveyEngine.navNext();
        return;
    } catch (e) {
        console.warn("navNext() failed:", e);
    }
 
    // Fallback: click the hidden Next button
    const clickNext = () => {
        const btn = document.querySelector("#NextButton");
        if (btn) { btn.style.visibility = "visible"; btn.click(); }
        else setTimeout(clickNext, 50);
    };
    clickNext();
 
    // Last-resort fallback: form submit
    setTimeout(() => {
        const form = document.querySelector("form[name='QualtricsForm']");
        if (form) form.submit();
        else setTimeout(arguments.callee, 50);
    }, 500);
}
 
// ── Trial counter banner  ──────────────────────────────────────────
export function showTrialCounter(isPractice, trialNum, trialTotal) {
    const root = document.getElementById("expRoot");
    if (!root) return;
    const banner = document.createElement("div");
    Object.assign(banner.style, {
        position: "absolute", top: "10px", left: "50%",
        transform: "translateX(-50%)",
        backgroundColor: isPractice ? "#a0c4ff" : "#fffa65",
        color: "#000", fontSize: "16px", padding: "10px 20px",
        borderRadius: "8px", zIndex: "9999", textAlign: "center",
    });
    banner.textContent = `Trial ${trialNum} / ${trialTotal}`;
    root.appendChild(banner);
    setTimeout(() => banner.remove(), 1500);
}
 
// ── Progress bar ──────────────────────────────────────────────────────────────
export function updateProgressBar(current, total) {
    const bar = document.getElementById("progressBar");
    if (bar) bar.style.width = `${(current / total) * 100}%`;
}
 
// ── General array shuffle ─────────────────────────────────────────────────────
export function shuffle(array) {
    const arr = array.slice();
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
}