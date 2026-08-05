/**
 * API Gateway Integration Tests
 *
 * Tests REST endpoints (/health, /classify, /feedback) using Supertest.
 */

import request from "supertest";
import { jest } from "@jest/globals";
import { app } from "../src/index.js";

jest.setTimeout(10000);

describe("API Gateway Routes", () => {
  describe("GET /", () => {
    it("should return API metadata", async () => {
      const res = await request(app).get("/");
      expect(res.status).toBe(200);
      expect(res.body.name).toContain("Mail Guard AI");
      expect(res.body.version).toBe("2.0.0");
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
