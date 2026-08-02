/**
 * Classification Route — POST /api/v1/classify
 *
 * Core endpoint: receives email text, calls ML service for
 * classification + SHAP, calls Gemini for explanation, and
 * returns the full analysis result.
 */

import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { mlService } from "../services/mlService.js";
import { geminiService } from "../services/geminiService.js";
import { logger } from "../utils/logger.js";

export const classifyRouter = Router();

// ─── Validation Schema ─────────────────────────────────────────────
const classifySchema = z.object({
  text: z
    .string()
    .min(1, "Email text is required")
    .max(5000, "Email text must be under 5000 characters"),
  includeShap: z.boolean().default(true),
  includeExplanation: z.boolean().default(true),
});

// ─── POST /classify ─────────────────────────────────────────────────
classifyRouter.post("/", validate(classifySchema), async (req, res, next) => {
  try {
    const { text, includeShap, includeExplanation } = req.body;

    logger.debug({ requestId: req.id, textLength: text.length }, "Classification request");

    // 1. Call ML service for classification + SHAP
    const mlResult = await mlService.classify(text, includeShap);

    // 2. Generate Gemini explanation (if requested and API key is configured)
    let explanation = null;
    if (includeExplanation && process.env.GEMINI_API_KEY) {
      try {
        explanation = await geminiService.generateExplanation({
          label: mlResult.label,
          confidence: mlResult.confidence,
          shapTokens: mlResult.shap_tokens,
          features: mlResult.features,
          textExcerpt: text.substring(0, 200),
        });
      } catch (err) {
        logger.warn({ requestId: req.id, error: err.message }, "Gemini explanation failed, skipping");
      }
    }

    // 3. Build response
    const response = {
      id: req.id,
      label: mlResult.label,
      confidence: mlResult.confidence,
      shapTokens: mlResult.shap_tokens || [],
      features: mlResult.features || {},
      explanation: explanation,
      modelVersion: mlResult.model_version,
      inferenceTimeMs: mlResult.inference_time_ms,
      timestamp: new Date().toISOString(),
    };

    // TODO (Phase 2): Cache result in Redis
    // TODO (Phase 2): Log to PostgreSQL

    res.json(response);
  } catch (err) {
    next(err);
  }
});
