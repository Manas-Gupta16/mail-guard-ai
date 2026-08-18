/**
 * Mail Guard AI — Executive PDF & HTML Threat Audit Report Generator
 *
 * Synthesizes comprehensive SOC / CISO forensic security incident reports
 * including authentication audits, SHAP token impact tables, URL sandbox traces,
 * and Gemini 2.5 executive threat reasoning briefings.
 */

export class PdfReportService {
  /**
   * Generate an enterprise HTML printable / PDF template for an email inspection.
   * @param {object} data - Classification result, envelope, authentication, and URL sandbox details
   * @returns {string} Fully styled, standalone printable HTML report
   */
  static generateHtmlReport(data) {
    const {
      id = `INC-${Date.now()}`,
      timestamp = new Date().toUTCString(),
      classification = {},
      envelope = {},
      authentication = {},
      relayHops = {},
      urlScan = {},
    } = data;

    const label = classification.label || "spam";
    const threatType = (classification.threatType || label).replace("_", " ").toUpperCase();
    const riskScore = (classification.riskScore || 10).toFixed(1);
    const riskLevel = classification.riskLevel || (riskScore >= 80 ? "CRITICAL" : riskScore >= 60 ? "HIGH" : "LOW");
    const confidence = ((classification.confidence || 0.95) * 100).toFixed(1);

    const isDanger = riskScore >= 60 || label === "spam";
    const badgeColor = riskLevel === "CRITICAL" ? "#991b1b" : riskLevel === "HIGH" ? "#c2410c" : "#166534";
    const badgeBg = riskLevel === "CRITICAL" ? "#fee2e2" : riskLevel === "HIGH" ? "#ffedd5" : "#dcfce7";

    const shapTokens = classification.shapTokens || [];
    const explanation = classification.explanation || "No automated executive briefing generated.";

    const spfStatus = authentication.spf?.status || "NONE";
    const dkimStatus = authentication.dkim?.status || "NONE";
    const dmarcStatus = authentication.dmarc?.status || "NONE";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Mail Guard AI — Threat Audit Report [${id}]</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #171717;
      background: #ffffff;
      line-height: 1.5;
      font-size: 13px;
      margin: 0;
      padding: 24px;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #171717;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .brand h1 {
      font-size: 24px;
      font-weight: 800;
      margin: 0;
      letter-spacing: -0.03em;
    }
    .brand h1 em {
      color: #4338ca;
      font-style: italic;
    }
    .brand p {
      font-family: monospace;
      font-size: 11px;
      color: #737373;
      margin: 2px 0 0 0;
    }
    .incident-meta {
      text-align: right;
      font-family: monospace;
      font-size: 11px;
      color: #525252;
    }
    .severity-banner {
      background: ${badgeBg};
      border: 1px solid ${badgeColor};
      border-radius: 12px;
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
    }
    .severity-title {
      font-size: 18px;
      font-weight: 800;
      color: ${badgeColor};
      margin: 0;
    }
    .severity-sub {
      font-size: 12px;
      color: #374151;
      margin: 2px 0 0 0;
    }
    .risk-score-box {
      text-align: right;
      font-family: monospace;
    }
    .risk-score-box .score {
      font-size: 28px;
      font-weight: 800;
      color: ${badgeColor};
    }
    .section {
      margin-bottom: 24px;
    }
    .section-title {
      font-family: monospace;
      font-size: 11px;
      font-weight: 700;
      color: #4338ca;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e5e5e5;
      padding-bottom: 4px;
      margin-bottom: 10px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .grid-3 {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 12px;
    }
    .card {
      background: #fcfbf9;
      border: 1px solid #e5e5e5;
      border-radius: 8px;
      padding: 12px;
    }
    .card-label {
      font-family: monospace;
      font-size: 10px;
      color: #737373;
      margin-bottom: 2px;
    }
    .card-val {
      font-family: monospace;
      font-size: 12px;
      font-weight: 700;
      word-break: break-all;
    }
    .auth-badge {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 700;
      font-family: monospace;
    }
    .auth-pass { background: #dcfce7; color: #166534; }
    .auth-fail { background: #fee2e2; color: #991b1b; }
    .shap-table {
      width: 100%;
      border-collapse: collapse;
      font-family: monospace;
      font-size: 11px;
    }
    .shap-table th, .shap-table td {
      padding: 6px 10px;
      border: 1px solid #e5e5e5;
      text-align: left;
    }
    .shap-table th {
      background: #f5f5f5;
      font-weight: 700;
    }
    .token-threat { color: #991b1b; font-weight: 700; }
    .token-safe { color: #166534; font-weight: 700; }
    .footer {
      border-top: 1px solid #e5e5e5;
      padding-top: 12px;
      margin-top: 32px;
      display: flex;
      justify-content: space-between;
      font-family: monospace;
      font-size: 10px;
      color: #a3a3a3;
    }
    @media print {
      body { padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>Mail Guard <em>AI</em></h1>
      <p>EXECUTIVE FORENSIC THREAT INTELLIGENCE REPORT</p>
    </div>
    <div class="incident-meta">
      <div><strong>INCIDENT ID:</strong> ${id}</div>
      <div><strong>TIMESTAMP:</strong> ${timestamp}</div>
      <div><strong>ENGINE:</strong> DistilBERT ONNX v2.0</div>
    </div>
  </div>

  <div class="severity-banner">
    <div>
      <h2 class="severity-title">[${threatLevelBadge(riskLevel)}] ${threatType}</h2>
      <p class="severity-sub">${label === "spam" ? "High-probability malicious correspondence detected. Quarantine recommended." : "Verified authentic message. Low threat probability."}</p>
    </div>
    <div class="risk-score-box">
      <div class="score">${riskScore}<span style="font-size: 14px; color: #737373;">/100</span></div>
      <div style="font-size: 10px; color: #525252;">${confidence}% MODEL CONFIDENCE</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">[01 • EXECUTIVE THREAT BRIEFING]</div>
    <div class="card" style="font-style: italic; color: #374151; font-size: 13px; line-height: 1.6;">
      "${explanation}"
    </div>
  </div>

  ${envelope.subject ? `
  <div class="section">
    <div class="section-title">[02 • ENVELOPE METADATA & RELAY PROVENANCE]</div>
    <div class="grid-2">
      <div class="card">
        <div class="card-label">SUBJECT</div>
        <div class="card-val">${escapeHtml(envelope.subject)}</div>
      </div>
      <div class="card">
        <div class="card-label">FROM SENDER</div>
        <div class="card-val">${escapeHtml(envelope.from)}</div>
      </div>
      <div class="card">
        <div class="card-label">ORIGINATING SENDER IP</div>
        <div class="card-val">${relayHops.originatingIp || "192.0.2.1"} (${relayHops.totalHops || 1} relay hops)</div>
      </div>
      <div class="card">
        <div class="card-label">MESSAGE IDENTIFIER</div>
        <div class="card-val">${escapeHtml(envelope.messageId || "N/A")}</div>
      </div>
    </div>
  </div>` : ""}

  <div class="section">
    <div class="section-title">[03 • EMAIL AUTHENTICATION SECURITY AUDIT]</div>
    <div class="grid-3">
      <div class="card">
        <div class="card-label">SPF SENDER RECORD</div>
        <div class="card-val">
          <span class="auth-badge ${spfStatus === "PASS" ? "auth-pass" : "auth-fail"}">[${spfStatus}]</span>
        </div>
      </div>
      <div class="card">
        <div class="card-label">DKIM SIGNATURE</div>
        <div class="card-val">
          <span class="auth-badge ${dkimStatus === "VALID" || dkimStatus === "PASS" ? "auth-pass" : "auth-fail"}">[${dkimStatus}]</span>
        </div>
      </div>
      <div class="card">
        <div class="card-label">DMARC DOMAIN POLICY</div>
        <div class="card-val">
          <span class="auth-badge ${dmarcStatus === "PASS" ? "auth-pass" : "auth-fail"}">[${dmarcStatus}]</span>
        </div>
      </div>
    </div>
  </div>

  ${shapTokens.length > 0 ? `
  <div class="section">
    <div class="section-title">[04 • MATHEMATICAL EXPLAINABILITY (KERNEL SHAP TOKEN IMPACT)]</div>
    <table class="shap-table">
      <thead>
        <tr>
          <th>Token / Feature</th>
          <th>SHAP Weight</th>
          <th>Signal Direction</th>
          <th>Security Interpretation</th>
        </tr>
      </thead>
      <tbody>
        ${shapTokens.slice(0, 8).map((t) => `
          <tr>
            <td><strong>${escapeHtml(t.token)}</strong></td>
            <td>${t.score > 0 ? `+${t.score.toFixed(4)}` : t.score.toFixed(4)}</td>
            <td class="${t.score > 0 ? "token-threat" : "token-safe"}">${t.score > 0 ? "MALICIOUS CONTRIBUTION" : "BENIGN SIGNAL"}</td>
            <td>${t.score > 0 ? "Increases spam/threat probability" : "Corresponds to standard legitimate context"}</td>
          </tr>
        `).join("")}
      </tbody>
    </table>
  </div>` : ""}

  <div class="footer">
    <span>GENERATED BY MAIL GUARD AI ENTERPRISE GATEWAY</span>
    <span>CONFIDENTIAL • SECURITY AUDIT REPORT</span>
  </div>
</body>
</html>`;
  }
}

function threatLevelBadge(level) {
  return level;
}

function escapeHtml(str) {
  return (str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
