/**
 * WebSocket Handler — Real-time Streaming Inference
 *
 * Supports two modes:
 *  1. "classify" — One-shot classification with streamed results
 *     (classification → SHAP → explanation arrive as separate messages)
 *  2. "live" — Real-time classification as user types (debounced)
 *
 * Protocol (JSON messages):
 *
 * Client → Server:
 *   { "type": "classify", "text": "..." }
 *   { "type": "live", "text": "..." }
 *
 * Server → Client:
 *   { "type": "classification", "label": "spam", "confidence": 0.97 }
 *   { "type": "shap", "tokens": [...] }
 *   { "type": "features", "data": {...} }
 *   { "type": "explanation", "text": "..." }
 *   { "type": "error", "message": "..." }
 *   { "type": "complete" }
 */

import { mlService } from "../services/mlService.js";
import { geminiService } from "../services/geminiService.js";
import { logger } from "../utils/logger.js";

export function setupWebSocket(wss) {
  wss.on("connection", (ws) => {
    logger.info("WebSocket client connected");

    let debounceTimer = null;

    ws.on("message", async (raw) => {
      try {
        const message = JSON.parse(raw.toString());

        if (message.type === "classify") {
          await handleClassify(ws, message.text);
        } else if (message.type === "live") {
          // Debounce live typing — wait 300ms of silence before classifying
          clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => {
            handleClassify(ws, message.text);
          }, 300);
        } else {
          ws.send(
            JSON.stringify({ type: "error", message: "Unknown message type" })
          );
        }
      } catch (err) {
        logger.error({ error: err.message }, "WebSocket message error");
        ws.send(
          JSON.stringify({ type: "error", message: "Invalid message format" })
        );
      }
    });

    ws.on("close", () => {
      clearTimeout(debounceTimer);
      logger.info("WebSocket client disconnected");
    });
  });

  logger.info("WebSocket server initialized");
}

/**
 * Handle classification with streamed responses.
 * Sends classification, SHAP, features, and explanation as separate messages.
 */
async function handleClassify(ws, text) {
  if (!text || text.trim().length === 0) {
    ws.send(JSON.stringify({ type: "error", message: "Text is required" }));
    return;
  }

  try {
    // 1. Get classification + SHAP from ML service
    const mlResult = await mlService.classify(text, true);

    // Stream: classification result first (fastest)
    ws.send(
      JSON.stringify({
        type: "classification",
        label: mlResult.label,
        confidence: mlResult.confidence,
        modelVersion: mlResult.model_version,
        inferenceTimeMs: mlResult.inference_time_ms,
      })
    );

    // Stream: SHAP tokens
    if (mlResult.shap_tokens?.length) {
      ws.send(
        JSON.stringify({
          type: "shap",
          tokens: mlResult.shap_tokens,
        })
      );
    }

    // Stream: structural features
    if (mlResult.features) {
      ws.send(
        JSON.stringify({
          type: "features",
          data: mlResult.features,
        })
      );
    }

    // Stream: Gemini explanation (slowest, arrives last)
    if (process.env.GEMINI_API_KEY) {
      try {
        const explanation = await geminiService.generateExplanation({
          label: mlResult.label,
          confidence: mlResult.confidence,
          shapTokens: mlResult.shap_tokens,
          features: mlResult.features,
          textExcerpt: text.substring(0, 200),
        });

        if (explanation) {
          ws.send(JSON.stringify({ type: "explanation", text: explanation }));
        }
      } catch {
        // Non-fatal — skip explanation
      }
    }

    // Stream: completion signal
    ws.send(JSON.stringify({ type: "complete" }));
  } catch (err) {
    logger.error({ error: err.message }, "WebSocket classify error");
    ws.send(
      JSON.stringify({
        type: "error",
        message: "Classification failed: " + err.message,
      })
    );
  }
}
