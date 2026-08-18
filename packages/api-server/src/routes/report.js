/**
 * Executive Report Route — POST /api/v1/report/pdf
 *
 * Generates downloadable executive HTML / PDF forensic threat audit reports.
 */

import { Router } from "express";
import { z } from "zod";
import { validate } from "../middleware/validate.js";
import { PdfReportService } from "../services/pdfReportService.js";
import { logger } from "../utils/logger.js";

export const reportRouter = Router();

const reportSchema = z.object({
  id: z.string().optional(),
  classification: z.object({
    label: z.string(),
    confidence: z.number().optional(),
    threatType: z.string().optional(),
    riskScore: z.number().optional(),
    riskLevel: z.string().optional(),
    shapTokens: z.array(z.object({ token: z.string(), score: z.number() })).optional(),
    explanation: z.string().nullable().optional(),
  }),
  envelope: z.object({
    subject: z.string().optional(),
    from: z.string().optional(),
    to: z.string().optional(),
    date: z.string().optional(),
    messageId: z.string().optional(),
  }).optional(),
  authentication: z.object({
    spf: z.object({ status: z.string(), details: z.string().optional() }).optional(),
    dkim: z.object({ status: z.string(), details: z.string().optional() }).optional(),
    dmarc: z.object({ status: z.string(), details: z.string().optional() }).optional(),
    overallScore: z.number().optional(),
  }).optional(),
  relayHops: z.object({
    totalHops: z.number().optional(),
    originatingIp: z.string().nullable().optional(),
  }).optional(),
});

reportRouter.post("/pdf", validate(reportSchema), (req, res) => {
  try {
    const reportHtml = PdfReportService.generateHtmlReport(req.body);
    res.setHeader("Content-Type", "text/html");
    res.setHeader("Content-Disposition", `inline; filename="mailguard-threat-report-${req.body.id || Date.now()}.html"`);
    res.send(reportHtml);
  } catch (err) {
    logger.error({ error: err.message }, "Report generation failed");
    res.status(500).json({ error: { message: "Report generation failed" } });
  }
});
