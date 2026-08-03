/**
 * Mail Guard AI — API Server Entry Point
 *
 * Express server with enterprise middleware stack:
 *  - CORS, Helmet, structured logging
 *  - Rate limiting (Redis-backed)
 *  - API key authentication
 *  - WebSocket server for streaming inference
 */

import "dotenv/config";
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
import { setupWebSocket } from "./websocket/handler.js";

const app = express();
const server = http.createServer(app);

// ─── Global Middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "http://localhost:5173" }));
app.use(express.json({ limit: "1mb" }));
app.use(correlationId);
app.use(requestLogger);
app.use(apiKeyAuth);
app.use(rateLimiter);

// ─── API Routes ─────────────────────────────────────────────────────
const API_PREFIX = `/api/${process.env.API_VERSION || "v1"}`;

app.use(`${API_PREFIX}/classify`, classifyRouter);
app.use(`${API_PREFIX}/feedback`, feedbackRouter);
app.use(`${API_PREFIX}/health`, healthRouter);

// Root route
app.get("/", (_req, res) => {
  res.json({
    name: "Mail Guard AI — API",
    version: "2.0.0",
    docs: `${API_PREFIX}/health`,
  });
});

// ─── Error Handler (must be last) ───────────────────────────────────
app.use(errorHandler);

// ─── WebSocket Server ───────────────────────────────────────────────
const wss = new WebSocketServer({ server, path: `${API_PREFIX}/classify/stream` });
setupWebSocket(wss);

// ─── Start Server ───────────────────────────────────────────────────
const PORT = process.env.API_PORT || 3000;

server.listen(PORT, () => {
  logger.info({ port: PORT, prefix: API_PREFIX }, "🚀 Mail Guard AI API server started");
});

export { app, server };
