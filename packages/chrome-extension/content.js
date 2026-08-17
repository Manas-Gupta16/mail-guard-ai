/**
 * Mail Guard AI — In-Mailbox Threat Inspector Content Script
 *
 * Automatically attaches to Gmail & Outlook web interfaces, injecting
 * floating inspection buttons and interactive AI threat overlays.
 */

let lastInspectedText = "";

function injectMailGuardButton() {
  // Gmail active email view detector
  const gmailToolbar = document.querySelector(".nH.gE.iv.gt, .adn.ads .gE, .ha");
  const outlookToolbar = document.querySelector('[aria-label="Message actions"], .Q4gH5');

  const targetToolbar = gmailToolbar || outlookToolbar;
  if (!targetToolbar || targetToolbar.querySelector(".mailguard-inspect-btn")) {
    return;
  }

  const btn = document.createElement("button");
  btn.className = "mailguard-inspect-btn";
  btn.innerHTML = `
    <svg class="mailguard-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
    <span>Inspect with Mail Guard</span>
  `;

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    runInspection(btn);
  });

  targetToolbar.appendChild(btn);
}

function extractEmailText() {
  // Gmail email body selectors
  const gmailBody = document.querySelector(".a3s.aiL, .adn.ads .ii.gt, div[dir='ltr']");
  if (gmailBody) {
    return gmailBody.innerText.trim();
  }

  // Outlook email body selectors
  const outlookBody = document.querySelector('[aria-label="Message body"], .ReadingPaneContainer [role="document"]');
  if (outlookBody) {
    return outlookBody.innerText.trim();
  }

  // Fallback: selected text or main container text
  const selection = window.getSelection()?.toString().trim();
  if (selection) return selection;

  const mainRole = document.querySelector('[role="main"]');
  return mainRole ? mainRole.innerText.slice(0, 3000) : "";
}

async function runInspection(buttonElement) {
  const originalText = buttonElement.innerHTML;
  buttonElement.innerHTML = `
    <span class="mailguard-spinner"></span>
    <span>Analyzing with DistilBERT...</span>
  `;
  buttonElement.disabled = true;

  const emailText = extractEmailText();
  if (!emailText) {
    alert("Mail Guard AI: Could not extract email text. Please highlight text or open an email.");
    buttonElement.innerHTML = originalText;
    buttonElement.disabled = false;
    return;
  }

  lastInspectedText = emailText;

  chrome.runtime.sendMessage(
    {
      action: "CLASSIFY_EMAIL",
      payload: { text: emailText.slice(0, 4000), includeShap: true, includeExplanation: true },
    },
    (response) => {
      buttonElement.innerHTML = originalText;
      buttonElement.disabled = false;

      if (response && response.data) {
        renderThreatOverlay(response.data);
      } else {
        alert("Mail Guard AI: Inspection failed. Please ensure the API Gateway is running.");
      }
    }
  );
}

function renderThreatOverlay(result) {
  // Remove existing overlay if present
  const existing = document.getElementById("mailguard-threat-overlay");
  if (existing) existing.remove();

  const emailContainer = document.querySelector(".nH.hx, .adn.ads, [role='main']");
  if (!emailContainer) return;

  const isSpam = result.label === "spam";
  const isHighRisk = result.riskScore >= 60;

  const overlay = document.createElement("div");
  overlay.id = "mailguard-threat-overlay";
  overlay.className = `mailguard-banner ${isHighRisk ? "mailguard-banner-danger" : "mailguard-banner-safe"}`;

  const threatLabel = result.threatType.replace("_", " ").toUpperCase();
  const shapBadges = (result.shapTokens || [])
    .slice(0, 6)
    .map(
      (t) => `
      <span class="mailguard-token ${t.score > 0 ? "mailguard-token-spam" : "mailguard-token-ham"}">
        ${escapeHtml(t.token)} <em>${t.score > 0 ? "+" : ""}${t.score.toFixed(3)}</em>
      </span>
    `
    )
    .join("");

  overlay.innerHTML = `
    <div class="mailguard-header">
      <div class="mailguard-title-group">
        <div class="mailguard-badge ${isHighRisk ? "badge-danger" : "badge-safe"}">
          [${threatLabel}]
        </div>
        <h3>${isSpam ? "Threat Detected by Mail Guard AI" : "Verified Authentic Communication"}</h3>
      </div>
      <div class="mailguard-metrics">
        <span>CONFIDENCE: <strong>${(result.confidence * 100).toFixed(1)}%</strong></span>
        <span>RISK SCORE: <strong>${result.riskScore.toFixed(1)} / 100 (${result.riskLevel})</strong></span>
        <button id="mailguard-close-btn" class="mailguard-close-btn" title="Dismiss">✕</button>
      </div>
    </div>

    ${
      result.explanation
        ? `<div class="mailguard-reasoning">
            <span class="mailguard-label">[GEMINI 2.5 SECURITY BRIEFING]</span>
            <p>"${escapeHtml(result.explanation)}"</p>
           </div>`
        : ""
    }

    ${
      shapBadges
        ? `<div class="mailguard-shap">
            <span class="mailguard-label">[EXPLAINABLE AI • TOP SHAP TOKENS]</span>
            <div class="mailguard-tokens">${shapBadges}</div>
           </div>`
        : ""
    }

    <div class="mailguard-footer">
      <span class="mailguard-feedback-prompt">Help retrain the model:</span>
      <button id="mailguard-flag-spam" class="mailguard-fb-btn fb-spam">👎 Flag as Threat</button>
      <button id="mailguard-confirm-safe" class="mailguard-fb-btn fb-safe">👍 Confirm Safe</button>
      <span id="mailguard-fb-status" class="mailguard-fb-status"></span>
    </div>
  `;

  emailContainer.prepend(overlay);

  // Bind close button
  document.getElementById("mailguard-close-btn")?.addEventListener("click", () => overlay.remove());

  // Bind feedback buttons
  const fbStatus = document.getElementById("mailguard-fb-status");
  document.getElementById("mailguard-flag-spam")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "SUBMIT_FEEDBACK",
      payload: { predictionId: result.id, userLabel: "spam", comment: "Flagged via Chrome Extension" },
    });
    if (fbStatus) fbStatus.innerText = "✓ Threat flagged for active learning!";
  });

  document.getElementById("mailguard-confirm-safe")?.addEventListener("click", () => {
    chrome.runtime.sendMessage({
      action: "SUBMIT_FEEDBACK",
      payload: { predictionId: result.id, userLabel: "ham", comment: "Confirmed safe via Chrome Extension" },
    });
    if (fbStatus) fbStatus.innerText = "✓ Verified safe recorded in PostgreSQL!";
  });
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Watch DOM mutations for navigation inside Gmail (SPA)
const observer = new MutationObserver(() => {
  injectMailGuardButton();
});
observer.observe(document.body, { childList: true, subtree: true });

// Initial check
setTimeout(injectMailGuardButton, 1500);
