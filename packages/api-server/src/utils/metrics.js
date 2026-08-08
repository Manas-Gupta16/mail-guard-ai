/**
 * Prometheus Metrics Registry
 *
 * Exposes core operational telemetry:
 *  - HTTP request volume & duration histograms
 *  - ML prediction counts by threat classification & risk tier
 *  - Active WebSocket client count
 *  - Gemini LLM explanation generation latency & token counter
 *  - Asynchronous batch job status tracking
 */

import client from "prom-client";

// Collect default Node.js runtime metrics (CPU, heap, event loop lag)
client.collectDefaultMetrics({ prefix: "mailguard_" });

export const metricsRegistry = client.register;

// ─── HTTP Metrics ───────────────────────────────────────────────────
export const httpRequestCounter = new client.Counter({
  name: "mailguard_http_requests_total",
  help: "Total number of HTTP requests received",
  labelNames: ["method", "route", "status_code"],
});

export const httpRequestDurationHistogram = new client.Histogram({
  name: "mailguard_http_request_duration_seconds",
  help: "HTTP request latency in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
});

// ─── ML & Threat Intelligence Metrics ───────────────────────────────
export const predictionCounter = new client.Counter({
  name: "mailguard_predictions_total",
  help: "Total email classifications performed",
  labelNames: ["label", "threat_type", "risk_level"],
});

export const predictionLatencyGauge = new client.Gauge({
  name: "mailguard_prediction_latency_ms",
  help: "Last ML service prediction latency in milliseconds",
});

export const riskScoreHistogram = new client.Histogram({
  name: "mailguard_risk_score_distribution",
  help: "Distribution of email risk scores (0-100)",
  buckets: [10, 25, 50, 75, 85, 95, 100],
});

// ─── Gemini LLM Metrics ─────────────────────────────────────────────
export const geminiExplanationCounter = new client.Counter({
  name: "mailguard_gemini_explanations_total",
  help: "Total natural language explanations generated via Gemini",
  labelNames: ["status"], // "success" | "failure"
});

// ─── WebSocket Metrics ──────────────────────────────────────────────
export const activeWsConnectionsGauge = new client.Gauge({
  name: "mailguard_active_ws_connections",
  help: "Current number of connected WebSocket streaming clients",
});

// ─── Batch Jobs Metrics ─────────────────────────────────────────────
export const batchJobsCounter = new client.Counter({
  name: "mailguard_batch_jobs_total",
  help: "Total batch processing jobs submitted",
  labelNames: ["status"], // "queued" | "completed" | "failed"
});
