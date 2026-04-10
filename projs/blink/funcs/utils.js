// Can load in specific functions depending on what that experiment needs 

// Qualtrics can only access direct links, not relative links for stimuli 
const githubPath = "https://rhecolab.github.io/online/projs/blink/";

function getBasePath() {
  // local path if testing locally
  if (
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1" ||
    window.location.protocol === "file:"
  ) {
    return "../../";
  }

  // default to github
  return githubPath;
}

export async function runPractice(seq, func) {
    const root = document.getElementById("expRoot");

    // Ensure root can host overlay properly
    root.style.position = "relative";

    // Initialize counter properly
    window.pracTrialNum = 0;

    // Practice start screen
    await showMessage("Practice starting...");

    for (let i = 0; i < seq.length; i++) {
        const startTrial = window.pracTrialNum;

        // (Optional) clear fixation if needed
        const fix = document.getElementById("fix");
        if (fix) fix.textContent = "";

        // Run trial WITHOUT touching DOM
        func(seq[i], true);

        // Wait until collectResp increments practice counter
        await new Promise((resolve) => {
            const check = setInterval(() => {
                if (window.pracTrialNum > startTrial) {
                    clearInterval(check);
                    resolve();
                }
            }, 50);
        });
    }

    // Practice end screen
    await showMessage("Practice finished! Press continue for main trials.");
}

export function showMessage(text) {
        return new Promise((resolve) => {
            const overlay = document.createElement("div");
            const root = document.getElementById("expRoot");
            
            overlay.style.position = "absolute";
            overlay.style.top = "0";
            overlay.style.left = "0";
            overlay.style.width = "100%";
            overlay.style.height = "100%";
            overlay.style.display = "flex";
            overlay.style.flexDirection = "column";
            overlay.style.alignItems = "center";
            overlay.style.justifyContent = "center";
            overlay.style.fontSize = "28px";
            overlay.style.zIndex = "9999";

            overlay.innerHTML = `
                <div style="text-align:center;">
                    ${text}
                    <br><br>
                    <button id="continueBtn">Continue</button>
                </div>
            `;

            root.appendChild(overlay);

            overlay.querySelector("#continueBtn").onclick = () => {
                overlay.remove();  
                resolve();
            };
        });
    }

// General shuffle
export function shuffle(array) {
  let arr = array.slice();
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

//
export function showTrialCounter(isPractice, trialNum, trialTotal) {
    const root = document.getElementById("expRoot");
    const banner = document.createElement("div");

    banner.style.position = "absolute";
    banner.style.top = "10px";
    banner.style.left = "50%";
    banner.style.transform = "translateX(-50%)";
    banner.style.backgroundColor = isPractice ? "#a0c4ff" : "#fffa65";
    banner.style.color = "#000";
    banner.style.fontSize = "16px";
    banner.style.padding = "10px 20px";
    banner.style.borderRadius = "8px";
    banner.style.zIndex = "9999";
    banner.style.textAlign = "center";

    const blockName = isPractice ? "Practice" : "Main";
    banner.textContent = `Trial ${trialNum} / ${trialTotal}`;

    root.appendChild(banner);

    // Automatically remove banner after 1.5 seconds
    setTimeout(() => {
        banner.remove();
    }, 1500);
}

// If sounds are necessary 
export const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
export const buffer = {};  


export async function preloadSounds(soundFiles) {

  const base = getBasePath();

  for (const sndName of soundFiles) {
    const url = `${base}stimuli/snds/${sndName}.wav`;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    buffer[sndName] = await audioCtx.decodeAudioData(arrayBuffer);
  }
  console.log("sounds preloaded");
}

export function playSound(stim, when,example=false) {

  const fix = document.getElementById("fix");
  if (fix) {
    fix.textContent = example ? "" : "+";
  }

  const source = audioCtx.createBufferSource();
  source.buffer = buffer[stim];
  source.connect(audioCtx.destination);
  source.start(when);
}


// Shapes 
// Circle
export function drawCircle(ctx, x, y, radius, color) {
  if (!ctx) return;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.closePath();
}

// Square
export function drawSquare(ctx, x, y, size, color) {
  if (!ctx) return;
  ctx.fillStyle = color;
  ctx.fillRect(x, y, size, size);
}

// Triangle
export function drawTriangle(ctx, x, y, size, color) {
  if (!ctx) return;
  const height = (Math.sqrt(3) / 2) * size;

  ctx.beginPath();
  ctx.moveTo(x, y); 
  ctx.lineTo(x + size, y); 
  ctx.lineTo(x + size / 2, y - height); 
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();

}

// Star
export function drawStar(ctx, x, y, spikes, outerRadius, innerRadius, color) {
  if (!ctx) return;
  let rot = (Math.PI / 2) * 3;
  let step = Math.PI / spikes;

  ctx.beginPath();
  ctx.moveTo(x, y - outerRadius);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(x + Math.cos(rot) * outerRadius, y + Math.sin(rot) * outerRadius);
    rot += step;

    ctx.lineTo(x + Math.cos(rot) * innerRadius, y + Math.sin(rot) * innerRadius);
    rot += step;
  }
  ctx.lineTo(x, y - outerRadius);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Various polygons
export function drawPolygon(ctx, x, y, radius, sides, color) {
  if (sides < 3) return; // needs at least 3 sides
  const angle = (2 * Math.PI) / sides;
  ctx.beginPath();
  for (let i = 0; i < sides; i++) {
    const px = x + radius * Math.cos(i * angle);
    const py = y + radius * Math.sin(i * angle);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Semicircle
export function drawSemicircle(ctx, x, y, radius, color, direction = 'up') {
  let startAngle, endAngle;

  switch (direction.toLowerCase()) {
    case 'up':
      startAngle = Math.PI;
      endAngle = 2 * Math.PI;
      break;
    case 'down':
      startAngle = 0;
      endAngle = Math.PI;
      break;
    case 'left':
      startAngle = 0.5 * Math.PI;
      endAngle = 1.5 * Math.PI;
      break;
    case 'right':
      startAngle = -0.5 * Math.PI;
      endAngle = 0.5 * Math.PI;
      break;

  }

  ctx.beginPath();
  ctx.arc(x, y, radius, startAngle, endAngle);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// Shape dispatcher
const BASE_SIZE = 75; // define one consistent size

export function drawShape(shape, ctx, x, y, color) {
  switch (shape) {
    case "star":
      drawStar(ctx, x, y, 5, BASE_SIZE / 2, BASE_SIZE / 4, color);
      break;
    case "circle":
      drawCircle(ctx, x, y, BASE_SIZE / 2, color); // 
      break;
    case "square":
      drawSquare(ctx, x - BASE_SIZE / 2, y - BASE_SIZE / 2, BASE_SIZE, color);
      break;
    case "triangle":
      drawTriangle(ctx, x - BASE_SIZE / 2, y + BASE_SIZE / 2, BASE_SIZE, color);
      break;
    case "hexagon":
      drawPolygon(ctx, x, y, BASE_SIZE / 2, 6, color);
      break;
    case "pentagon":
      drawPolygon(ctx, x, y, BASE_SIZE / 2, 5, color);
      break;
    case "octagon":
      drawPolygon(ctx, x, y, BASE_SIZE / 2, 8, color);
      break;
    case "semiup":
      drawSemicircle(ctx, x, y, BASE_SIZE / 2, color, 'up');
      break;
    case "semidown":
      drawSemicircle(ctx, x, y, BASE_SIZE / 2, color, 'down');
     break;
    case "semileft":
      drawSemicircle(ctx, x, y, BASE_SIZE / 2, color, 'left');
    break;
    case "semiright":
      drawSemicircle(ctx, x, y, BASE_SIZE / 2, color, 'right');
    break;

  }
}
