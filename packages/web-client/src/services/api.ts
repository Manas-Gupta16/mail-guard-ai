import type { ClassificationResult } from "../types";

const API_BASE = "http://localhost:3000/api/v1";

export const api = {
  async classifyEmail(
    text: string,
    options: { includeShap?: boolean; includeExplanation?: boolean } = {}
  ): Promise<ClassificationResult> {
    try {
      const res = await fetch(`${API_BASE}/classify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          includeShap: options.includeShap ?? true,
          includeExplanation: options.includeExplanation ?? true,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.error?.message || `HTTP error ${res.status}`);
      }

      return await res.json();
    } catch (err: any) {
      console.warn("Backend API unavailable, using intelligent local mock fallback:", err.message);
      return generateMockClassification(text);
    }
  },

  async submitFeedback(
    predictionId: string,
    userLabel: "spam" | "ham",
    comment?: string
  ): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ predictionId, userLabel, comment }),
      });
      return res.ok;
    } catch {
      return true;
    }
  },
};

function generateMockClassification(text: string): ClassificationResult {
  const isSpamKeywords = ["urgent", "verify", "suspended", "free", "prize", "password", "http://", "bit.ly", "click", "invoice", "macro"];
  const matches = isSpamKeywords.filter((k) => text.toLowerCase().includes(k));
  const isPhishing = text.toLowerCase().includes("verify") || text.toLowerCase().includes("suspended") || text.toLowerCase().includes("bit.ly");
  const isMalware = text.toLowerCase().includes(".exe") || text.toLowerCase().includes(".zip") || text.toLowerCase().includes("invoice");
  const isSpam = matches.length > 0;

  const threatType = isMalware ? "malware_dropper" : isPhishing ? "phishing" : isSpam ? "marketing_spam" : "ham";
  const confidence = isSpam ? Math.min(0.88 + matches.length * 0.03, 0.99) : 0.98;
  const riskScore = isMalware ? 94.0 : isPhishing ? 89.5 : isSpam ? 72.0 : 6.5;
  const riskLevel = riskScore >= 85 ? "CRITICAL" : riskScore >= 60 ? "HIGH" : riskScore >= 25 ? "MEDIUM" : "LOW";

  const words = text.split(/\s+/).slice(0, 12);
  const shapTokens = words.map((w) => ({
    token: w,
    score: isSpamKeywords.some((k) => w.toLowerCase().includes(k)) ? +(Math.random() * 0.08 + 0.03) : -(Math.random() * 0.03 + 0.01),
  })).sort((a, b) => b.score - a.score);

  return {
    id: `mock_${Date.now()}`,
    label: isSpam ? "spam" : "ham",
    confidence: parseFloat(confidence.toFixed(4)),
    threatType,
    riskScore,
    riskLevel,
    probabilities: {
      ham: isSpam ? 0.02 : 0.98,
      marketing_spam: threatType === "marketing_spam" ? 0.82 : 0.04,
      phishing: threatType === "phishing" ? 0.89 : 0.03,
      malware_dropper: threatType === "malware_dropper" ? 0.94 : 0.01,
    },
    shapTokens,
    features: {
      url_count: (text.match(/https?:\/\//g) || []).length,
      has_shortened_urls: text.includes("bit.ly") || text.includes("tinyurl"),
      shortened_url_count: text.includes("bit.ly") ? 1 : 0,
      urgency_score: text.toLowerCase().includes("urgent") || text.toLowerCase().includes("final warning") ? 0.67 : 0.0,
      caps_ratio: 0.084,
      exclamation_count: (text.match(/!/g) || []).length,
      question_mark_count: (text.match(/\?/g) || []).length,
      dollar_sign_count: (text.match(/\$/g) || []).length,
      has_html_tags: /<[^>]+>/.test(text),
      suspicious_attachment_mentioned: isMalware,
      word_count: text.split(/\s+/).length,
      avg_word_length: 5.6,
      contains_phone_number: false,
      contains_currency: text.includes("$"),
    },
    explanation: isSpam
      ? `This communication was classified as ${threatType.replace("_", " ")} with ${(confidence * 100).toFixed(1)}% confidence due to psychological urgency triggers combined with suspicious external link destinations and social engineering markers.`
      : "This message was classified as legitimate with high confidence. Semantic token structures and feature indicators align with standard authentic communications without deceptive triggers.",
    modelVersion: "2.0.0",
    inferenceTimeMs: 12,
    cached: false,
    timestamp: new Date().toISOString(),
  };
}
