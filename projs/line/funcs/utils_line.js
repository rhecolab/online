// Qualtrics needs absolute URLs for stimuli; fall back to relative for local dev
const GITHUB_PATH = "https://rhecolab.github.io/online/projs/blink/";
 
function getBasePath() {
    const { hostname, protocol } = window.location;
    return (hostname === "localhost" || hostname === "127.0.0.1" || protocol === "file:")
        ? "../../"
        : GITHUB_PATH;
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
 