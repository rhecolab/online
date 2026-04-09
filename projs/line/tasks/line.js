import html from "./line.html";
import "../funcs/line.css";

// Parameters
let data = [];
let trialNumber = 0;
const totalTrials = 10;
const subjID = "${e://Field/subjID}"; // should load in from qualtrics 
const taskName = "line";
const pxPerCm = parseFloat("${e://Field/px_per_cm}") || 37; // should load in from calib, but default 37 if not

function cmToPx(cm) {
  return cm * pxPerCm;
}

export async function startTask() {

    // Create experiment container
    const root = document.createElement("div");
    root.id = "expRoot";
    document.querySelector(".SkinInner").appendChild(root);

    // Inject HTML
    root.innerHTML = html;

    // Define 
    const startBtn = document.getElementById("startButton");
    const instrBox = document.getElementById("instrBox");

    // actually start the experiment
    startBtn.addEventListener("click", () => {
        instrBox.style.display = "none";
        runTrial();
    });

}

function runTrial() {
  const stim = document.getElementById("stim");
  const lineContainer = document.getElementById("lineContainer");
  const line = document.getElementById("line");
  const bisectLine = document.getElementById("bisectLine");

  stim.style.display = "block";

  // Random line length
  const lineLengthCm = Math.random() * 6 + 10;
  const lineLengthPx = cmToPx(lineLengthCm);
  lineContainer.style.width = lineLengthPx + "px";

  // Vertical jitter: middle 40% of screen
  requestAnimationFrame(() => {
    const stimHeight = window.innerHeight;
    const topBand = stimHeight * 0.3;
    const bottomBand = stimHeight * 0.7;
    const containerHeight = lineContainer.offsetHeight;
    const randomY = Math.floor(Math.random() * (bottomBand - topBand - containerHeight)) + topBand;
    lineContainer.style.top = randomY + "px";
  });

  const startTime = performance.now();

  function handleMouseMove(e) {
    const stimRect = stim.getBoundingClientRect();
    bisectLine.style.left = (e.clientX - stimRect.left) + "px";
    bisectLine.style.top = lineContainer.offsetTop + "px";
    bisectLine.style.top = lineContainer.offsetTop + (lineContainer.offsetHeight / 2) - (bisectLine.offsetHeight / 2) + "px";

  }

  function handleClick(e) {
    const clickTime = performance.now();
    const rt = clickTime - startTime;

    const rect = line.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const trueMid = rect.width / 2;
    const devPx = clickX - trueMid;
    const devRel = devPx / rect.width;
    const devCm = devPx / pxPerCm;

    data.push({
      sub: subjID,
      task: taskName,
      trial: trialNumber + 1,
      devPx: Math.round(devPx),
      devRel: Number(devRel.toFixed(4)),
      devCm: Number(devCm.toFixed(2)),
      rt: Math.round(rt),
      lineLengthCm: Number(lineLengthCm.toFixed(2)),
      lineLengthPx: Math.round(lineLengthPx),
      pxPerCm,
      screenW: window.innerWidth,
      screenH: window.innerHeight,
      dpr: window.devicePixelRatio
    });

    cleanup();
    trialNumber++;

    if (trialNumber < totalTrials) {
      setTimeout(runTrial, 400);
    } else {
      endTask();
    }
  }

  function cleanup() {
    document.removeEventListener("mousemove", handleMouseMove);
    lineContainer.removeEventListener("click", handleClick);
    stim.style.display = "none";
  }

  document.addEventListener("mousemove", handleMouseMove);
  lineContainer.addEventListener("click", handleClick);
}

function endTask() {
    // Save your data to an embedded field
    Qualtrics.SurveyEngine.setEmbeddedData("lineData", JSON.stringify(data));

    // interal qulatrics api
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