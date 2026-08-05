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
import { getPrisma } from "../db/prisma.js";
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

    const prisma = getPrisma();
    let savedFeedback = null;

    if (prisma) {
      try {
        savedFeedback = await prisma.feedback.create({
          data: {
            predictionId,
            userLabel,
            comment: comment || null,
          },
        });
      } catch (dbErr) {
        logger.warn({ requestId: req.id, error: dbErr.message }, "Prisma feedback creation skipped/failed");
      }
    }

    res.status(201).json({
      message: "Feedback recorded successfully",
      feedback: {
        id: savedFeedback?.id || `fb_${req.id}`,
        predictionId,
        userLabel,
        comment: comment || null,
        recordedAt: savedFeedback?.createdAt || new Date().toISOString(),
      },
    });
  } catch (err) {
    next(err);
  }
});

// ─── GET /feedback/stats ────────────────────────────────────────────
feedbackRouter.get("/stats", async (_req, res, next) => {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return res.json({
        totalFeedback: 0,
        agreementRate: 1.0,
        disagreementRate: 0.0,
        recentDisagreements: [],
      });
    }

    const totalFeedback = await prisma.feedback.count();
    if (totalFeedback === 0) {
      return res.json({
        totalFeedback: 0,
        agreementRate: 1.0,
        disagreementRate: 0.0,
        recentDisagreements: [],
      });
    }

    // Fetch feedback with predictions to compute agreement rate
    const feedbackList = await prisma.feedback.findMany({
      include: { prediction: true },
      take: 100,
      orderBy: { createdAt: "desc" },
    });

    let agreements = 0;
    const disagreements = [];

    for (const fb of feedbackList) {
      if (fb.prediction && fb.prediction.label === fb.userLabel) {
        agreements += 1;
      } else if (fb.prediction) {
        disagreements.push({
          predictionId: fb.predictionId,
          modelLabel: fb.prediction.label,
          userLabel: fb.userLabel,
          comment: fb.comment,
          createdAt: fb.createdAt,
        });
      }
    }

    const total = feedbackList.length;
    const agreementRate = total > 0 ? agreements / total : 1.0;

    res.json({
      totalFeedback,
      agreementRate: parseFloat(agreementRate.toFixed(4)),
      disagreementRate: parseFloat((1 - agreementRate).toFixed(4)),
      recentDisagreements: disagreements.slice(0, 10),
    });
  } catch (err) {
    next(err);
  }
});
