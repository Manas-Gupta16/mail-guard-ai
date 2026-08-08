/**
 * API Gateway Integration Tests
 *
 * Tests REST endpoints:
 *  - GET / (metadata)
 *  - GET /metrics (Prometheus observability)
 *  - GET /api/v1/health (subsystem health)
 *  - POST /api/v1/classify (validation & taxonomy)
 *  - POST /api/v1/batch (asynchronous bulk scanning)
 *  - GET /api/v1/batch/:jobId (progress polling)
 *  - GET /api/v1/retrain/drift (model drift monitoring)
 *  - POST /api/v1/feedback (human-in-the-loop corrections)
 */

import request from "supertest";
import { jest } from "@jest/globals";
import { app } from "../src/index.js";

jest.setTimeout(10000);

describe("API Gateway Routes", () => {
  describe("GET /", () => {
    it("should return API metadata and active endpoints", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.body.name).toContain("Mail Guard AI");
      expect(res.body.version).toBe("2.0.0");
      expect(res.body.endpoints).toHaveProperty("batch");
      expect(res.body.endpoints).toHaveProperty("metrics");
    });
  });

  describe("GET /metrics (Prometheus Observability)", () => {
    it("should export Prometheus plain-text metrics format", async () => {
      const res = await request(app).get("/metrics");
      expect(res.status).toBe(200);
      expect(res.text).toContain("mailguard_http_requests_total");
      expect(res.text).toContain("mailguard_predictions_total");
    });
  });

  describe("GET /api/v1/health", () => {
    it("should return health status JSON structure", async () => {
      const res = await request(app).get("/api/v1/health");
      expect([200, 503]).toContain(res.status);
      expect(res.body).toHaveProperty("status");
      expect(res.body).toHaveProperty("checks");
      expect(res.body.checks).toHaveProperty("mlService");
      expect(res.body.checks).toHaveProperty("database");
      expect(res.body.checks).toHaveProperty("cache");
    });
  });

  describe("POST /api/v1/classify validation", () => {
    it("should reject empty request body with 400", async () => {
      const res = await request(app)
        .post("/api/v1/classify")
        .send({});

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty("error");
      expect(res.body.error.code).toBe("VALIDATION_ERROR");
    });

    it("should reject text longer than 5000 chars", async () => {
      const res = await request(app)
        .post("/api/v1/classify")
        .send({ text: "a".repeat(5001) });

      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/v1/batch & GET /api/v1/batch/:jobId", () => {
    it("should accept batch job with 202 Accepted and return status", async () => {
      const batchRes = await request(app)
        .post("/api/v1/batch")
        .send({
          items: [
            "Meeting agenda for Tuesday project review",
            "FINAL WARNING: Your PayPal account is suspended. Verify now at http://bit.ly/123",
          ],
        });

      expect(batchRes.status).toBe(202);
      expect(batchRes.body).toHaveProperty("jobId");
      expect(batchRes.body.totalItems).toBe(2);

      const { jobId } = batchRes.body;

      // Poll job status
      const statusRes = await request(app).get(`/api/v1/batch/${jobId}`);
      expect(statusRes.status).toBe(200);
      expect(statusRes.body.id).toBe(jobId);
      expect(["pending", "processing", "completed"]).toContain(statusRes.body.status);
      expect(statusRes.body).toHaveProperty("summary");
    });

    it("should return 404 for non-existent batch job", async () => {
      const res = await request(app).get("/api/v1/batch/non_existent_12345");
      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/v1/retrain/drift & POST /api/v1/retrain/export", () => {
    it("should return model drift analysis report", async () => {
      const res = await request(app).get("/api/v1/retrain/drift");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("driftStatus");
      expect(res.body).toHaveProperty("driftScore");
      expect(res.body).toHaveProperty("totalFeedbackSamples");
    });

    it("should export active learning training manifest", async () => {
      const res = await request(app).post("/api/v1/retrain/export");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("samplesExported");
      expect(Array.isArray(res.body.manifest)).toBe(true);
    });
  });

  describe("POST /api/v1/feedback validation & stats", () => {
    it("should record valid feedback with 201", async () => {
      const res = await request(app)
        .post("/api/v1/feedback")
        .send({
          predictionId: "test_pred_123",
          userLabel: "spam",
          comment: "Contains phishing link",
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toContain("Feedback recorded");
      expect(res.body.feedback.predictionId).toBe("test_pred_123");
    });

    it("should reject invalid userLabel with 400", async () => {
      const res = await request(app)
        .post("/api/v1/feedback")
        .send({
          predictionId: "test_pred_123",
          userLabel: "not_valid",
        });

      expect(res.status).toBe(400);
    });

    it("should return feedback stats on GET /api/v1/feedback/stats", async () => {
      const res = await request(app).get("/api/v1/feedback/stats");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("totalFeedback");
      expect(res.body).toHaveProperty("agreementRate");
    });
  });
});
