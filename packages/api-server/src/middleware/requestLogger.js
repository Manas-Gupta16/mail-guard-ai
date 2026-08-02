/**
 * Request Logger Middleware
 *
 * Logs every incoming request and its response with:
 *  - Correlation ID
 *  - HTTP method and path
 *  - Response status code
 *  - Latency in milliseconds
 */

import { logger } from "../utils/logger.js";

export function requestLogger(req, res, next) {
  const start = Date.now();

  // Log on response finish
  res.on("finish", () => {
    const duration = Date.now() - start;
    const logData = {
      requestId: req.id,
      method: req.method,
      path: req.originalUrl,
      status: res.statusCode,
      durationMs: duration,
    };

    if (res.statusCode >= 400) {
      logger.warn(logData, "Request completed with error");
    } else {
      logger.info(logData, "Request completed");
    }
  });

  next();
}
