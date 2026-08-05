/**
 * Prisma Client Instance & Helper
 *
 * Centralized Prisma client with connection state check and
 * graceful degradation when PostgreSQL is offline.
 */

import { PrismaClient } from "@prisma/client";
import { logger } from "../utils/logger.js";

let prisma = null;

export function getPrisma() {
  if (prisma) return prisma;

  if (!process.env.DATABASE_URL) {
    logger.info("DATABASE_URL not set — PostgreSQL storage disabled");
    return null;
  }

  try {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
    });
    return prisma;
  } catch (err) {
    logger.warn({ error: err.message }, "Prisma init failed — PostgreSQL disabled");
    return null;
  }
}

/**
 * Perform a database health check.
 */
export async function dbHealthCheck() {
  const client = getPrisma();
  if (!client) return { status: "disabled", message: "DATABASE_URL not set" };

  try {
    await client.$queryRaw`SELECT 1`;
    return { status: "ok" };
  } catch (err) {
    return { status: "error", message: err.message };
  }
}
