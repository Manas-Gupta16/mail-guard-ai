/**
 * Structured JSON logger using Pino.
 *
 * In development: pretty-printed with colors.
 * In production: machine-readable JSON for log aggregation.
 */

import pino from "pino";

const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDev ? "debug" : "info"),
  transport: isDev
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "HH:MM:ss",
          ignore: "pid,hostname",
        },
      }
    : undefined,

  // Standard fields for log aggregation
  base: {
    service: "mail-guard-api",
    version: "2.0.0",
  },
});
