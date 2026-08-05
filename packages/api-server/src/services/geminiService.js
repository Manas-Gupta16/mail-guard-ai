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

let genAI = null;

function getGenAI() {
  if (genAI) return genAI;

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("your_gemini_api_key")) {
    logger.warn("GEMINI_API_KEY is missing or placeholder — explanation generation disabled");
    return null;
  }

  genAI = new GoogleGenerativeAI(apiKey);
  return genAI;
}

export const geminiService = {
  /**
   * Generate a human-readable explanation for a spam classification.
   *
   * @param {Object} context - Analysis context
   * @returns {Promise<string|null>} Natural language explanation
   */
  async generateExplanation(context) {
    const ai = getGenAI();
    if (!ai) return null;

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

    // Active model list supported by Gemini API v1beta
    const candidateModels = [
      "gemini-2.5-flash",
      "gemini-flash-latest",
      "gemini-2.0-flash",
      "gemini-2.0-flash-lite",
    ];

    for (const modelName of candidateModels) {
      try {
        const model = ai.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const text = result.response.text();
        if (text) {
          logger.info({ modelUsed: modelName }, "Gemini explanation generated successfully");
          return text.trim();
        }
      } catch (err) {
        logger.debug({ modelName, error: err.message }, "Gemini model candidate failed, trying next fallback");
      }
    }

    logger.error("All Gemini model candidates failed to generate explanation");
    return null;
  },
};
