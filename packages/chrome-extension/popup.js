/**
 * Mail Guard AI — Popup Inspector Controller
 */

document.addEventListener("DOMContentLoaded", () => {
  const inspectBtn = document.getElementById("inspect-btn");
  const scanActiveTabBtn = document.getElementById("scan-active-tab-btn");
  const inspectText = document.getElementById("inspect-text");
  const resultCard = document.getElementById("result-card");
  const resThreatType = document.getElementById("res-threat-type");
  const resVerdict = document.getElementById("res-verdict");
  const resRiskScore = document.getElementById("res-risk-score");
  const resExplanation = document.getElementById("res-explanation");
  const resTokens = document.getElementById("res-tokens");

  inspectBtn.addEventListener("click", () => {
    const text = inspectText.value.trim();
    if (!text) return;

    inspectBtn.innerText = "Analyzing...";
    inspectBtn.disabled = true;

    chrome.runtime.sendMessage(
      {
        action: "CLASSIFY_EMAIL",
        payload: { text, includeShap: true, includeExplanation: true },
      },
      (response) => {
        inspectBtn.innerText = "Inspect";
        inspectBtn.disabled = false;

        if (response && response.data) {
          renderResult(response.data);
        }
      }
    );
  });

  scanActiveTabBtn.addEventListener("click", async () => {
    scanActiveTabBtn.innerText = "Scanning Tab...";
    scanActiveTabBtn.disabled = true;

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab?.id) throw new Error("No active tab");

      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const body = document.querySelector(".a3s.aiL, [aria-label='Message body'], [role='main']");
          return body ? body.innerText.slice(0, 3000) : "";
        },
      });

      const extractedText = results?.[0]?.result;
      if (extractedText) {
        inspectText.value = extractedText;
        inspectBtn.click();
      } else {
        alert("Could not extract email from active tab. Please ensure Gmail/Outlook is open.");
      }
    } catch (err) {
      alert("Error scanning active tab: " + err.message);
    } finally {
      scanActiveTabBtn.innerText = "Scan Active Mailbox";
      scanActiveTabBtn.disabled = false;
    }
  });

  function renderResult(data) {
    resultCard.classList.remove("hidden");
    const isSpam = data.label === "spam";
    const threatLabel = (data.threatType || data.label).replace("_", " ").toUpperCase();

    resThreatType.innerText = `[${threatLabel}]`;
    resVerdict.innerText = isSpam ? "Threat Detected" : "Authentic Communication";
    resVerdict.style.color = isSpam ? "#dc2626" : "#16a34a";
    resRiskScore.innerText = (data.riskScore || 10).toFixed(1);
    resRiskScore.style.color = data.riskScore > 60 ? "#dc2626" : "#16a34a";
    resExplanation.innerText = data.explanation || "";

    resTokens.innerHTML = "";
    (data.shapTokens || []).slice(0, 8).forEach((t) => {
      const pill = document.createElement("span");
      pill.className = `token-pill ${t.score > 0 ? "token-spam" : "token-ham"}`;
      pill.innerText = `${t.token} (${t.score > 0 ? "+" : ""}${t.score.toFixed(2)})`;
      resTokens.appendChild(pill);
    });
  }
});
