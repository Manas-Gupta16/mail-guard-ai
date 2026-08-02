/**
 * Gemini LLM Service
 *
 * Uses Google's Gemini Flash model to generate human-readable
 * explanations for spam classifications. This is the "lightweight RAG"
 * component — it receives structured analysis (SHAP tokens + features)
 * as context and generates a natural language security-analyst explanation.
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { logger } from "../utils/logger.js";

let model = null;

/**
 * Lazily initialize the Gemini client.
 * Returns null if no API key is configured.
 */
function getModel() {
  if (model) return model;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    logger.warn("GEMINI_API_KEY not set — explanation generation disabled");
    return null;
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  return model;
}

export const geminiService = {
  /**
   * Generate a human-readable explanation for a spam classification.
   *
   * @param {Object} context - Analysis context
   * @param {string} context.label - "spam" or "ham"
   * @param {number} context.confidence - Classification confidence (0-1)
   * @param {Array} context.shapTokens - SHAP token attributions
   * @param {Object} context.features - Structural features
   * @param {string} context.textExcerpt - First 200 chars of email
   * @returns {Promise<string|null>} Natural language explanation
   */
  async generateExplanation(context) {
    const geminiModel = getModel();
    if (!geminiModel) return null;

    const topTokens = (context.shapTokens || [])
      .slice(0, 10)
      .map((t) => `"${t.token}" (${t.score > 0 ? "+" : ""}${t.score.toFixed(3)})`)
      .join(", ");

    const featureLines = Object.entries(context.features || {})
      .map(([k, v]) => `  - ${k}: ${v}`)
      .join("\n");

    const prompt = `You are an email security analyst. Based on the following machine learning analysis, explain in 2-3 concise sentences why this email was classified as "${context.label}" with ${(context.confidence * 100).toFixed(1)}% confidence.

Classification: ${context.label.toUpperCase()}
Confidence: ${(context.confidence * 100).toFixed(1)}%

Key contributing tokens (SHAP values, positive = spam signal, negative = ham signal):
${topTokens || "No SHAP data available"}

Structural signals:
${featureLines || "No structural features available"}

Email excerpt:
"${context.textExcerpt}"

Rules:
- Be specific. Reference actual words and patterns from the email.
- Mention structural signals like URL count, urgency score, or caps ratio if they are notable.
- Do NOT use markdown formatting. Write plain text only.
- Keep it to exactly 2-3 sentences.`;

    try {
      const result = await geminiModel.generateContent(prompt);
      const text = result.response.text();
      return text.trim();
    } catch (err) {
      logger.error({ error: err.message }, "Gemini explanation generation failed");
      return null;
    }
  },
};
