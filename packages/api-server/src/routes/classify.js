/**
 * Classification Route — POST /api/v1/classify
 *
 * Core endpoint: receives email text, calls ML service for
 * classification + SHAP, calls Gemini for explanation, and
 * returns the full analysis result.
 *
 * Features:
 *  - Redis response caching (SHA-256 keyed)
 *  - Gemini LLM explanation generation
 *  - Structured response with timing metadata
 */

import { Router } from "express";
import { z } from "zod";
import crypto from "crypto";
import { validate } from "../middleware/validate.js";
import { mlService } from "../services/mlService.js";
import { geminiService } from "../services/geminiService.js";
import { cacheGet, cacheSet } from "../utils/redis.js";
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

    // 1. Check cache (keyed by SHA-256 of input + options)
    const cacheKey = `classify:${crypto
      .createHash("sha256")
      .update(`${text}:${includeShap}:${includeExplanation}`)
      .digest("hex")}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      logger.debug({ requestId: req.id }, "Cache hit");
      return res.json({ ...cached, id: req.id, cached: true });
    }

    // 2. Call ML service for classification + SHAP
    const mlResult = await mlService.classify(text, includeShap);

    // 3. Generate Gemini explanation (if requested and API key is configured)
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

    // 4. Build response
    const response = {
      id: req.id,
      label: mlResult.label,
      confidence: mlResult.confidence,
      shapTokens: mlResult.shap_tokens || [],
      features: mlResult.features || {},
      explanation: explanation,
      modelVersion: mlResult.model_version,
      inferenceTimeMs: mlResult.inference_time_ms,
      cached: false,
      timestamp: new Date().toISOString(),
    };

    // 5. Cache the result (1 hour TTL)
    await cacheSet(cacheKey, response, 3600);

    // TODO: Log to PostgreSQL via Prisma (after DB is wired)

    res.json(response);
  } catch (err) {
    next(err);
  }
});
