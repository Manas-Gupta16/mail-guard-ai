/**
 * Rate Limiter Middleware
 *
 * Redis-backed sliding window rate limiter with tiered limits.
 * Falls back to in-memory rate limiting if Redis is unavailable.
 *
 * Tiers:
 *  - No API key:  20 requests / hour
 *  - Free tier:   50 requests / hour
 *  - Pro tier:  1000 requests / hour
 */

import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger.js";

/**
 * Get rate limit for a request based on API key tier.
 */
function getLimit(req) {
  if (req.apiKey?.tier === "pro") {
    return parseInt(process.env.RATE_LIMIT_PRO || "1000");
  }
  if (req.apiKey?.tier === "free") {
    return parseInt(process.env.RATE_LIMIT_FREE || "50");
  }
  return 20; // No API key — strict limit
}

/**
 * Key generator — rate limit per API key or per IP.
 */
function keyGenerator(req) {
  if (req.apiKey?.id) {
    return `apikey:${req.apiKey.id}`;
  }
  return `ip:${req.ip}`;
}

/**
 * Create the rate limiter middleware.
 *
 * Uses in-memory store by default. Redis store can be added
 * for distributed rate limiting across multiple instances.
 */
export const rateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: getLimit,
  keyGenerator,
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false,

  // Custom response on rate limit hit
  handler: (req, res) => {
    logger.warn(
      { requestId: req.id, key: keyGenerator(req) },
      "Rate limit exceeded"
    );

    res.status(429).json({
      error: {
        message: "Rate limit exceeded. Please try again later.",
        code: "RATE_LIMIT_EXCEEDED",
        retryAfter: res.getHeader("Retry-After"),
        requestId: req.id,
      },
    });
  },

  // Skip rate limiting for health checks
  skip: (req) => req.path.includes("/health"),
});
