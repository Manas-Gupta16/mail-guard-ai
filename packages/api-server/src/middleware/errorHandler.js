/**
 * Global Error Handler Middleware & Custom Error Classes
 *
 * Catches all unhandled errors and returns a consistent
 * JSON error response. Logs the full error for debugging
 * but only sends safe details to the client.
 */

import { logger } from "../utils/logger.js";

export class AppError extends Error {
  constructor(message, status = 500, code = "INTERNAL_ERROR") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Resource not found") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ValidationError extends AppError {
  constructor(message = "Validation failed", details = null) {
    super(message, 400, "VALIDATION_ERROR");
    this.details = details;
  }
}

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
      ...(err.details ? { details: err.details } : {}),
    },
  });
}
