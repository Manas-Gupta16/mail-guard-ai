/**
 * ML Service Client
 *
 * HTTP client for communicating with the Python FastAPI ML service.
 * Handles classification requests, health checks, and error mapping.
 */

import axios from "axios";
import { logger } from "../utils/logger.js";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30_000, // 30s — SHAP can take a while
  headers: { "Content-Type": "application/json" },
});

export const mlService = {
  /**
   * Classify email text via the ML service.
   *
   * @param {string} text - Email body text
   * @param {boolean} includeShap - Whether to include SHAP explanations
   * @returns {Promise<Object>} Classification result with SHAP tokens and features
   */
  async classify(text, includeShap = true) {
    try {
      const { data } = await client.post("/predict", {
        text,
        include_shap: includeShap,
      });
      return data;
    } catch (err) {
      logger.error(
        { error: err.message, url: `${ML_SERVICE_URL}/predict` },
        "ML service classify call failed"
      );

      if (err.response) {
        const error = new Error(
          err.response.data?.detail || "ML service error"
        );
        error.status = err.response.status;
        throw error;
      }

      const error = new Error("ML service is unavailable");
      error.status = 503;
      throw error;
    }
  },

  /**
   * Check ML service health.
   *
   * @returns {Promise<Object>} Health check response
   */
  async healthCheck() {
    const { data } = await client.get("/health");
    return data;
  },
};
