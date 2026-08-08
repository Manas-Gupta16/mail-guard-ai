/**
 * Prometheus Metrics Route
 *
 * Exposes /metrics in standard Prometheus text format for scraping
 * by Prometheus / Grafana / Datadog agents.
 */

import { Router } from "express";
import { metricsRegistry } from "../utils/metrics.js";

export const metricsRouter = Router();

metricsRouter.get("/", async (_req, res, next) => {
  try {
    res.setHeader("Content-Type", metricsRegistry.contentType);
    const metrics = await metricsRegistry.metrics();
    res.send(metrics);
  } catch (err) {
    next(err);
  }
});
