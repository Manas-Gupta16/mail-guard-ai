/**
 * Correlation ID Middleware
 *
 * Assigns a unique request ID to every incoming request for
 * end-to-end tracing across services. Reads from X-Request-ID
 * header if present (forwarded from load balancer), otherwise
 * generates a new one.
 */

import { nanoid } from "nanoid";

export function correlationId(req, _res, next) {
  req.id = req.headers["x-request-id"] || nanoid(21);
  next();
}
