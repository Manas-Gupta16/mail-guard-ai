/**
 * URL Sandbox & Threat Intelligence Route — POST /api/v1/url/sandbox
 *
 * Scans individual URLs or extracts and inspects all URLs within an email body,
 * tracing redirect chains, expanding shortened links, and scoring domain risks.
 */

import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { UrlThreatService } from "../services/urlThreatService.js";
import { logger } from "../utils/logger.js";

export const urlThreatRouter = Router();

const urlScanSchema = z.object({
  url: z.string().url("Invalid URL format").optional(),
  text: z.string().optional(),
}).refine((data) => data.url || data.text, {
  message: "Either 'url' or 'text' must be provided",
});

urlThreatRouter.post("/sandbox", validate(urlScanSchema), async (req, res, next) => {
  try {
    const { url, text } = req.body;

    logger.debug({ requestId: req.id, hasUrl: !!url, hasText: !!text }, "URL sandbox inspection request");

    if (url) {
      const trace = await UrlThreatService.traceUrl(url);
      return res.json({ id: req.id, resultType: "single_url", ...trace });
    }

    const scan = await UrlThreatService.scanAllUrlsInText(text);
    return res.json({ id: req.id, resultType: "text_urls", ...scan });
  } catch (err) {
    next(err);
  }
});
