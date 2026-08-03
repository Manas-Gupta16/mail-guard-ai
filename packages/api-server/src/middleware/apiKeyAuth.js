/**
 * API Key Authentication Middleware
 *
 * Validates API keys from the X-API-Key header. Keys are
 * looked up in PostgreSQL via Prisma. If no key is provided,
 * the request proceeds with a restricted "anonymous" tier.
 *
 * This middleware is intentionally permissive — it attaches
 * the API key to the request if valid, but doesn't block
 * unauthenticated requests (rate limiter handles the restriction).
 */

import { logger } from "../utils/logger.js";

/**
 * Authenticate API key from X-API-Key header.
 *
 * Attaches req.apiKey = { id, tier, rateLimit } on success.
 * Passes through with no req.apiKey for unauthenticated requests.
 */
export function apiKeyAuth(req, _res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    // No key provided — proceed as anonymous
    req.apiKey = null;
    return next();
  }

  // TODO (Phase 2 - DB wired): Look up key in PostgreSQL via Prisma
  // const key = await prisma.apiKey.findUnique({ where: { key: apiKey } });
  // if (!key || !key.active) { ... }

  // For now, use a simple env-based validation
  const validKeys = parseEnvKeys();

  if (validKeys.has(apiKey)) {
    req.apiKey = validKeys.get(apiKey);
    logger.debug(
      { requestId: req.id, keyId: req.apiKey.id, tier: req.apiKey.tier },
      "API key authenticated"
    );
  } else {
    logger.warn({ requestId: req.id }, "Invalid API key provided");
    req.apiKey = null;
  }

  next();
}

/**
 * Parse API keys from environment variable.
 *
 * Format: API_KEYS=key1:tier1,key2:tier2
 * Example: API_KEYS=abc123:pro,def456:free
 *
 * This is a temporary solution until Prisma is wired up.
 */
function parseEnvKeys() {
  const keys = new Map();
  const envKeys = process.env.API_KEYS || "";

  if (!envKeys) return keys;

  envKeys.split(",").forEach((entry, i) => {
    const [key, tier = "free"] = entry.trim().split(":");
    if (key) {
      keys.set(key, {
        id: `env_key_${i}`,
        tier: tier,
        rateLimit: tier === "pro"
          ? parseInt(process.env.RATE_LIMIT_PRO || "1000")
          : parseInt(process.env.RATE_LIMIT_FREE || "50"),
      });
    }
  });

  return keys;
}
