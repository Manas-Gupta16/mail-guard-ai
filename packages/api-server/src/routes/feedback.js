/**
 * Feedback Route — POST /api/v1/feedback
 *
 * Allows users to submit corrections on predictions,
 * creating a human-in-the-loop feedback system for
 * model monitoring and future retraining.
 */

import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { logger } from "../utils/logger.js";

export const feedbackRouter = Router();

// ─── Validation Schema ─────────────────────────────────────────────
const feedbackSchema = z.object({
  predictionId: z.string().min(1, "Prediction ID is required"),
  userLabel: z.enum(["spam", "ham"], {
    errorMap: () => ({ message: "userLabel must be 'spam' or 'ham'" }),
  }),
  comment: z.string().max(500).optional(),
});

// ─── POST /feedback ─────────────────────────────────────────────────
feedbackRouter.post("/", validate(feedbackSchema), async (req, res, next) => {
  try {
    const { predictionId, userLabel, comment } = req.body;

    logger.info(
      { requestId: req.id, predictionId, userLabel },
      "User feedback received"
    );

    // TODO (Phase 2): Save to PostgreSQL via Prisma
    // const feedback = await prisma.feedback.create({
    //   data: { predictionId, userLabel, comment },
    // });

    res.status(201).json({
      message: "Feedback recorded successfully",
      feedback: {
        predictionId,
        userLabel,
        comment: comment || null,
        recordedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /feedback/stats ────────────────────────────────────────────
feedbackRouter.get("/stats", async (_req, res, next) => {
  try {
    // TODO (Phase 2): Query PostgreSQL for real stats
    const stats = {
      totalFeedback: 0,
      agreementRate: 0,
      disagreementRate: 0,
      recentDisagreements: [],
    };

    res.json(stats);
  } catch (err) {
    next(err);
  }
});
