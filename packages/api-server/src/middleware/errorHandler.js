/**
 * Global Error Handler Middleware
 *
 * Catches all unhandled errors and returns a consistent
 * JSON error response. Logs the full error for debugging
 * but only sends safe details to the client.
 */

import { logger } from "../utils/logger.js";

export function errorHandler(err, req, res, _next) {
  const status = err.status || err.statusCode || 500;

  logger.error(
    {
      requestId: req.id,
      error: err.message,
      stack: err.stack,
      path: req.originalUrl,
    },
    "Unhandled error"
  );

  res.status(status).json({
    error: {
      message: status === 500 ? "Internal server error" : err.message,
      code: err.code || "INTERNAL_ERROR",
      requestId: req.id,
    },
  });
}
