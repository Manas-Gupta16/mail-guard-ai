/**
 * Batch Ingestion & Processing Service
 *
 * Handles asynchronous bulk classification of 10 to 1,000+ emails.
 * Uses concurrent chunked processing with progress tracking,
 * aggregated risk distribution summaries, and exportable reports.
 */

import { nanoid } from "nanoid";
import { mlService } from "./mlService.js";
import { geminiService } from "./geminiService.js";
import { logger } from "../utils/logger.js";
import { batchJobsCounter } from "../utils/metrics.js";

// In-memory batch job store (Map of jobId -> jobData)
const jobs = new Map();

// Auto-cleanup jobs older than 1 hour to prevent memory leaks
setInterval(() => {
  const oneHourAgo = Date.now() - 3600 * 1000;
  for (const [id, job] of jobs.entries()) {
    if (new Date(job.createdAt).getTime() < oneHourAgo) {
      jobs.delete(id);
    }
  }
}, 600 * 1000);

export const batchService = {
  /**
   * Submit a new batch of email texts for background scanning.
   *
   * @param {Array<{id?: string, text: string}>} items - List of email items
   * @param {Object} options - { includeExplanation: boolean }
   * @returns {string} jobId
   */
  createJob(items, options = {}) {
    const jobId = `batch_${nanoid(12)}`;
    const job = {
      id: jobId,
      status: "pending", // "pending" | "processing" | "completed" | "failed"
      total: items.length,
      processed: 0,
      progress: 0,
      summary: {
        total: items.length,
        spamCount: 0,
        hamCount: 0,
        threatBreakdown: {
          ham: 0,
          marketing_spam: 0,
          phishing: 0,
          malware_dropper: 0,
        },
        riskLevelBreakdown: {
          LOW: 0,
          MEDIUM: 0,
          HIGH: 0,
          CRITICAL: 0,
        },
        avgConfidence: 0.0,
        avgLatencyMs: 0.0,
        highRiskFlagged: [],
      },
      results: [],
      error: null,
      createdAt: new Date().toISOString(),
      completedAt: null,
    };

    jobs.set(jobId, job);
    batchJobsCounter.inc({ status: "queued" });

    // Launch background worker processing (non-blocking)
    setImmediate(() => this._processJob(jobId, items, options));

    return jobId;
  },

  /**
   * Retrieve current job progress and results.
   */
  getJob(jobId) {
    return jobs.get(jobId) || null;
  },

  /**
   * Internal asynchronous worker executing chunked classifications.
   */
  async _processJob(jobId, items, options) {
    const job = jobs.get(jobId);
    if (!job) return;

    job.status = "processing";
    const startTime = Date.now();
    let totalConfidence = 0.0;
    let totalLatency = 0;

    const CHUNK_SIZE = 5; // Concurrency limit to prevent overwhelming ML service

    try {
      for (let i = 0; i < items.length; i += CHUNK_SIZE) {
        const chunk = items.slice(i, i + CHUNK_SIZE);

        const chunkPromises = chunk.map(async (item, idx) => {
          const text = typeof item === "string" ? item : item.text;
          const itemId = (typeof item === "object" && item.id) ? item.id : `item_${i + idx + 1}`;

          try {
            const pred = await mlService.classify(text, { includeShap: false });

            let explanation = null;
            if (options.includeExplanation && (pred.threat_type === "phishing" || pred.threat_type === "malware_dropper")) {
              explanation = await geminiService.generateExplanation({
                label: pred.label,
                confidence: pred.confidence,
                features: pred.features,
                textExcerpt: text.slice(0, 150),
              });
            }

            return {
              id: itemId,
              textExcerpt: text.length > 80 ? `${text.slice(0, 80)}...` : text,
              label: pred.label,
              confidence: pred.confidence,
              threatType: pred.threat_type || pred.label,
              riskScore: pred.risk_score || (pred.label === "spam" ? 75.0 : 10.0),
              riskLevel: pred.risk_level || (pred.label === "spam" ? "HIGH" : "LOW"),
              probabilities: pred.probabilities || {},
              explanation,
              inferenceTimeMs: pred.inference_time_ms,
            };
          } catch (itemErr) {
            logger.warn({ itemId, error: itemErr.message }, "Batch item classification failed");
            return {
              id: itemId,
              textExcerpt: text.slice(0, 80),
              label: "error",
              confidence: 0.0,
              error: itemErr.message,
            };
          }
        });

        const chunkResults = await Promise.all(chunkPromises);

        // Update job stats
        for (const res of chunkResults) {
          job.results.push(res);
          job.processed += 1;

          if (res.label !== "error") {
            totalConfidence += res.confidence;
            totalLatency += res.inferenceTimeMs || 10;

            if (res.label === "spam") job.summary.spamCount += 1;
            else job.summary.hamCount += 1;

            const threat = res.threatType in job.summary.threatBreakdown ? res.threatType : "ham";
            job.summary.threatBreakdown[threat] = (job.summary.threatBreakdown[threat] || 0) + 1;

            const risk = res.riskLevel in job.summary.riskLevelBreakdown ? res.riskLevel : "LOW";
            job.summary.riskLevelBreakdown[risk] = (job.summary.riskLevelBreakdown[risk] || 0) + 1;

            if (res.riskLevel === "CRITICAL" || res.riskLevel === "HIGH") {
              if (job.summary.highRiskFlagged.length < 10) {
                job.summary.highRiskFlagged.push({
                  id: res.id,
                  threatType: res.threatType,
                  riskScore: res.riskScore,
                  textExcerpt: res.textExcerpt,
                });
              }
            }
          }
        }

        job.progress = Math.round((job.processed / job.total) * 100);
      }

      job.status = "completed";
      job.completedAt = new Date().toISOString();
      const validCount = job.results.filter((r) => r.label !== "error").length || 1;
      job.summary.avgConfidence = parseFloat((totalConfidence / validCount).toFixed(4));
      job.summary.avgLatencyMs = parseFloat((totalLatency / validCount).toFixed(1));
      job.summary.totalDurationMs = Date.now() - startTime;

      batchJobsCounter.inc({ status: "completed" });
      logger.info({ jobId, processed: job.processed, durationMs: job.summary.totalDurationMs }, "Batch job completed successfully");
    } catch (err) {
      job.status = "failed";
      job.error = err.message;
      batchJobsCounter.inc({ status: "failed" });
      logger.error({ jobId, error: err.message }, "Batch job processing failed");
    }
  },
};
