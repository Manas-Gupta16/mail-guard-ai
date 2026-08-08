/**
 * Mail Guard AI — API Server Entry Point
 *
 * Express server with enterprise middleware stack:
 *  - CORS, Helmet, structured logging
 *  - Rate limiting (Redis-backed)
 *  - API key authentication
 *  - WebSocket server for streaming inference
 *  - Prometheus /metrics endpoint
 *  - Asynchronous batch ingestion & active learning retraining routes
 */

import dotenv from "dotenv";
import path from "path";

// Load root .env file if available, otherwise default dotenv
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config(); // fallback
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { WebSocketServer } from "ws";
import http from "http";

import { logger } from "./utils/logger.js";
import { correlationId } from "./middleware/correlationId.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { apiKeyAuth } from "./middleware/apiKeyAuth.js";
import { rateLimiter } from "./middleware/rateLimiter.js";
import { classifyRouter } from "./routes/classify.js";
import { feedbackRouter } from "./routes/feedback.js";
import { healthRouter } from "./routes/health.js";
import { batchRouter } from "./routes/batch.js";
import { retrainRouter } from "./routes/retrain.js";
import { metricsRouter } from "./routes/metrics.js";
import { setupWebSocket } from "./websocket/handler.js";

const app = express();
const server = http.createServer(app);

// ─── Prometheus Scraper Route (before auth/rate limiting) ────────────
app.use("/metrics", metricsRouter);

// ─── Global Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use(correlationId);
app.use(requestLogger);
app.use(apiKeyAuth);
app.use(rateLimiter);

// ─── API Routes ─────────────────────────────────────────────────────
const API_PREFIX = `/api/${process.env.API_VERSION || "v1"}`;

app.use(`${API_PREFIX}/classify`, classifyRouter);
app.use(`${API_PREFIX}/feedback`, feedbackRouter);
app.use(`${API_PREFIX}/health`, healthRouter);
app.use(`${API_PREFIX}/batch`, batchRouter);
app.use(`${API_PREFIX}/retrain`, retrainRouter);
app.use(`${API_PREFIX}/metrics`, metricsRouter);

// Root route
app.get("/", (_req, res) => {
  res.json({
    name: "Mail Guard AI — API Gateway",
    version: "2.0.0",
    endpoints: {
      classify: `${API_PREFIX}/classify`,
      stream: `${API_PREFIX}/classify/stream`,
      batch: `${API_PREFIX}/batch`,
      feedback: `${API_PREFIX}/feedback`,
      retrain: `${API_PREFIX}/retrain/drift`,
      health: `${API_PREFIX}/health`,
      metrics: "/metrics",
    },
  });
});

// ─── Error Handler (must be last) ───────────────────────────────────
app.use(errorHandler);

// ─── WebSocket Server ───────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: `${API_PREFIX}/classify/stream` });
setupWebSocket(wss);

// ─── Start Server ───────────────────────────────────────────────────
const PORT = process.env.API_PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  server.listen(PORT, () => {
    logger.info({ port: PORT, prefix: API_PREFIX }, "🚀 Mail Guard AI API server started");
  });
}

export { app, server };
