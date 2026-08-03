/**
 * Redis Client
 *
 * Centralized Redis connection for caching and rate limiting.
 * Gracefully handles connection failures — the app continues
 * to work without Redis (just without caching).
 */

import Redis from "ioredis";
import { logger } from "./logger.js";

let redis = null;

/**
 * Get or create the Redis client.
 * Returns null if Redis is not configured or unreachable.
 */
export function getRedis() {
  if (redis) return redis;

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    logger.info("REDIS_URL not set — caching disabled");
    return null;
  }

  try {
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 3) {
          logger.warn("Redis connection failed after 3 retries — disabling cache");
          return null; // Stop retrying
        }
        return Math.min(times * 200, 2000);
      },
      lazyConnect: true,
    });

    redis.on("connect", () => logger.info("Redis connected"));
    redis.on("error", (err) => logger.warn({ error: err.message }, "Redis error"));

    // Attempt connection
    redis.connect().catch(() => {
      logger.warn("Redis connection failed — caching disabled");
      redis = null;
    });

    return redis;
  } catch (err) {
    logger.warn({ error: err.message }, "Redis init failed — caching disabled");
    return null;
  }
}

/**
 * Cache a value with TTL.
 */
export async function cacheSet(key, value, ttlSeconds = 3600) {
  const client = getRedis();
  if (!client) return;

  try {
    await client.set(key, JSON.stringify(value), "EX", ttlSeconds);
  } catch (err) {
    logger.warn({ error: err.message, key }, "Cache set failed");
  }
}

/**
 * Get a cached value.
 * Returns null on miss or error.
 */
export async function cacheGet(key) {
  const client = getRedis();
  if (!client) return null;

  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.warn({ error: err.message, key }, "Cache get failed");
    return null;
  }
}

/**
 * Check if Redis is healthy.
 */
export async function redisHealthCheck() {
  const client = getRedis();
  if (!client) return { status: "disabled" };

  try {
    await client.ping();
    return { status: "ok" };
  } catch {
    return { status: "error", message: "Redis unreachable" };
  }
}
