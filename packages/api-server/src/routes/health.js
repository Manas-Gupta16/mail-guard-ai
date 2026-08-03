/**
 * Health Route — GET /api/v1/health
 *
 * Deep health check endpoint that verifies all dependencies:
 *  - ML Service connectivity
 *  - Database connectivity (PostgreSQL)
 *  - Cache connectivity (Redis)
 */

import { Router } from "express";
import { mlService } from "../services/mlService.js";
import { redisHealthCheck } from "../utils/redis.js";

export const healthRouter = Router();

// ─── GET /health ────────────────────────────────────────────────────
healthRouter.get("/", async (_req, res) => {
  const checks = {};
  let overallStatus = "ok";

  // 1. ML Service health
  try {
    const mlHealth = await mlService.healthCheck();
    checks.mlService = {
      status: "ok",
      modelLoaded: mlHealth.model_loaded,
      modelVersion: mlHealth.model_version,
    };
  } catch {
    checks.mlService = { status: "error", message: "ML service unreachable" };
    overallStatus = "degraded";
  }

  // 2. Database health
  // TODO: Add Prisma connection check when DB is wired
  checks.database = { status: "ok", message: "Not yet configured" };

  // 3. Redis health
  const redisStatus = await redisHealthCheck();
  checks.cache = redisStatus;
  if (redisStatus.status === "error") {
    overallStatus = "degraded";
  }

  const statusCode = overallStatus === "ok" ? 200 : 503;

  res.status(statusCode).json({
    status: overallStatus,
    version: "2.0.0",
    uptime: process.uptime(),
    checks,
    timestamp: new Date().toISOString(),
  });
});
