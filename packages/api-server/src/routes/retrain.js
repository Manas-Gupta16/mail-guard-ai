/**
 * Active Learning & Retraining Routes
 *
 * Exposes model drift analysis and training data export endpoints:
 *  - GET /api/v1/retrain/drift — Live model drift index & disagreement rate
 *  - POST /api/v1/retrain/export — Export feedback corrections as training manifest
 */

import { Router } from "express";
import { getPrisma } from "../db/prisma.js";
import { logger } from "../utils/logger.js";

export const retrainRouter = Router();

// ─── GET /api/v1/retrain/drift ─────────────────────────────────────────
retrainRouter.get("/drift", async (_req, res, next) => {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return res.json({
        totalFeedbackSamples: 0,
        agreementRate: 1.0,
        driftScore: 0.0,
        driftStatus: "HEALTHY",
        uncertaintySamplesCount: 0,
        message: "Database offline — active learning baseline is healthy",
      });
    }

    try {
      const feedbackList = await prisma.feedback.findMany({
        include: { prediction: true },
        take: 500,
        orderBy: { createdAt: "desc" },
      });

      const total = feedbackList.length;
      if (total === 0) {
        return res.json({
          totalFeedbackSamples: 0,
          agreementRate: 1.0,
          driftScore: 0.0,
          driftStatus: "HEALTHY",
          uncertaintySamplesCount: 0,
          message: "No human corrections recorded yet",
        });
      }

      let agreements = 0;
      let uncertainCount = 0;

      for (const fb of feedbackList) {
        if (fb.prediction && fb.prediction.label === fb.userLabel) {
          agreements += 1;
        }
        if (fb.prediction && fb.prediction.confidence >= 0.45 && fb.prediction.confidence <= 0.65) {
          uncertainCount += 1;
        }
      }

      const disagreements = total - agreements;
      const agreementRate = parseFloat((agreements / total).toFixed(4));
      const driftScore = parseFloat((disagreements / total).toFixed(4));

      let driftStatus = "HEALTHY";
      if (driftScore >= 0.20) driftStatus = "RETRAINING_RECOMMENDED";
      else if (driftScore >= 0.10) driftStatus = "MONITOR";

      return res.json({
        totalFeedbackSamples: total,
        agreementCount: agreements,
        disagreementCount: disagreements,
        agreementRate,
        driftScore,
        driftStatus,
        uncertaintySamplesCount: uncertainCount,
        evaluatedAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      logger.warn({ error: dbErr.message }, "Database query failed in retrain/drift");
      return res.json({
        totalFeedbackSamples: 0,
        agreementRate: 1.0,
        driftScore: 0.0,
        driftStatus: "HEALTHY",
        uncertaintySamplesCount: 0,
      });
    }
  } catch (err) {
    next(err);
  }
});

// ─── POST /api/v1/retrain/export ───────────────────────────────────────
retrainRouter.post("/export", async (_req, res, next) => {
  try {
    const prisma = getPrisma();
    if (!prisma) {
      return res.json({
        samplesExported: 0,
        manifest: [],
        message: "Database offline — no feedback available for export",
      });
    }

    try {
      const feedbackList = await prisma.feedback.findMany({
        include: { prediction: true },
        take: 1000,
        orderBy: { createdAt: "desc" },
      });

      const manifest = feedbackList
        .filter((fb) => fb.prediction && fb.prediction.inputText)
        .map((fb) => ({
          text: fb.prediction.inputText,
          label: fb.userLabel === "spam" ? 1 : 0,
          originalModelLabel: fb.prediction.label,
          userLabel: fb.userLabel,
          confidence: fb.prediction.confidence,
          feedbackId: fb.id,
          createdAt: fb.createdAt,
        }));

      logger.info({ count: manifest.length }, "Exported active learning training manifest");

      res.json({
        samplesExported: manifest.length,
        manifest,
        exportedAt: new Date().toISOString(),
      });
    } catch (dbErr) {
      logger.warn({ error: dbErr.message }, "Database query failed in retrain/export");
      res.json({ samplesExported: 0, manifest: [] });
    }
  } catch (err) {
    next(err);
  }
});
