/**
 * Batch Classification Routes
 *
 * Exposes asynchronous bulk scanning endpoints:
 *  - POST /api/v1/batch — Submit bulk emails (up to 1,000+ items)
 *  - GET /api/v1/batch/:jobId — Check job progress & results
 *  - GET /api/v1/batch/:jobId/download — Export scan report
 */

import { Router } from "express";
import { z } from "zod";
import { batchService } from "../services/batchService.js";
import { validateBody } from "../middleware/validate.js";
import { NotFoundError } from "../middleware/errorHandler.js";

export const batchRouter = Router();

const batchSubmitSchema = z.object({
  items: z
    .array(
      z.union([
        z.string().min(1).max(5000),
        z.object({
          id: z.string().optional(),
          text: z.string().min(1).max(5000),
        }),
      ])
    )
    .min(1, "Batch must contain at least 1 email")
    .max(1000, "Maximum 1,000 emails per batch"),
  includeExplanation: z.boolean().optional().default(false),
});

// ─── POST /api/v1/batch ──────────────────────────────────────────────
batchRouter.post("/", validateBody(batchSubmitSchema), (req, res) => {
  const { items, includeExplanation } = req.body;
  const jobId = batchService.createJob(items, { includeExplanation });

  res.status(202).json({
    message: "Batch job accepted for processing",
    jobId,
    totalItems: items.length,
    statusUrl: `/api/v1/batch/${jobId}`,
  });
});

// ─── GET /api/v1/batch/:jobId ────────────────────────────────────────
batchRouter.get("/:jobId", (req, res) => {
  const { jobId } = req.params;
  const job = batchService.getJob(jobId);

  if (!job) {
    throw new NotFoundError(`Batch job ${jobId} not found or expired`);
  }

  res.json(job);
});

// ─── GET /api/v1/batch/:jobId/download ───────────────────────────────
batchRouter.get("/:jobId/download", (req, res) => {
  const { jobId } = req.params;
  const job = batchService.getJob(jobId);

  if (!job) {
    throw new NotFoundError(`Batch job ${jobId} not found or expired`);
  }

  res.setHeader("Content-Disposition", `attachment; filename="scan-report-${jobId}.json"`);
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify(job, null, 2));
});
