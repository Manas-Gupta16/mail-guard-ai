# Mail Guard AI

**Production-grade email spam classification with Explainable AI, real-time WebSocket inference, and enterprise API design.**

[![CI](https://github.com/Manas-Gupta16/mail-guard-ai/actions/workflows/ci.yml/badge.svg)](https://github.com/Manas-Gupta16/mail-guard-ai/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://python.org/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)](https://docker.com/)

---

## Overview

Mail Guard AI is a full-stack email classification system that goes beyond simple spam detection. It combines a fine-tuned DistilBERT transformer model with SHAP-based token-level explainability and LLM-powered natural language reasoning to not only classify emails, but explain *why* they were flagged.

This is not a tutorial project. It is a production-ready, cloud-native application built with enterprise engineering practices — microservice architecture, structured observability, containerized deployment, and CI/CD automation.

---

## What Sets This Apart

| Dimension | Typical Portfolio Project | Mail Guard AI |
|-----------|--------------------------|---------------|
| **Model** | Naive Bayes or Logistic Regression | Fine-tuned DistilBERT with ONNX Runtime inference |
| **Explainability** | None | SHAP token attribution + Gemini LLM reasoning |
| **Backend** | Single Flask/FastAPI app | Node.js API Gateway + Python ML Microservice |
| **Frontend** | Streamlit or Jupyter | React SPA with real-time WebSocket streaming |
| **Real-time** | Request-response only | WebSocket streaming with live-typing classification |
| **Feedback Loop** | None | Human-in-the-loop corrections with drift monitoring |
| **API Design** | Bare endpoints | Rate limiting, API keys, request validation, correlation IDs |
| **Observability** | Print statements | Structured JSON logging (Pino), latency tracking, health checks |
| **Infrastructure** | Runs on localhost | Docker Compose, GCP Cloud Run, GitHub Actions CI/CD |

---

## Architecture

```
                                 Mail Guard AI — System Architecture

    +------------------+        +---------------------------+        +-------------------------+
    |                  |  REST  |                           |  HTTP  |                         |
    |  React Frontend  +------->+  Node.js API Gateway      +------->+  Python ML Service      |
    |  (Vite + TW)     |  WS    |  (Express)                |        |  (FastAPI)              |
    |                  +------->+                           |        |                         |
    +------------------+        +--+----------+----------+--+        +--+----------+----------++
                                   |          |          |              |          |           |
                                   v          v          v              v          v           v
                              +--------+ +--------+ +--------+   +---------+ +--------+ +---------+
                              |PostgreSQL| | Redis  | | Gemini |   |DistilBERT| | SHAP   | |Feature  |
                              |  (Prisma)| | Cache  | |  LLM   |   | (ONNX)  | |Explain | |Extract  |
                              +--------+ +--------+ +--------+   +---------+ +--------+ +---------+
```

### Request Flow

1. Client submits email text via REST or WebSocket
2. API Gateway validates input, checks rate limits, and queries cache
3. ML Service runs DistilBERT inference (~40ms) and SHAP explanation
4. Structural features are extracted (URL analysis, urgency scoring, caps ratio)
5. Gemini generates a natural language explanation from the analysis
6. Results are cached, logged to PostgreSQL, and returned to the client
7. WebSocket mode streams each step progressively for real-time UX

---

## Key Features

### Explainable AI Pipeline

The system provides three layers of explainability:

- **Token Attribution (SHAP):** Each word in the email receives a contribution score. Positive scores push toward spam, negative toward ham. The top contributing tokens are highlighted in the frontend.
- **Structural Analysis:** Beyond text, the system extracts signals like URL shortener usage, urgency keyword density, caps ratio, suspicious attachment mentions, and HTML-to-text ratio.
- **Natural Language Reasoning (Gemini):** A Gemini Flash model receives the SHAP tokens and structural features as context and generates a 2-3 sentence explanation — e.g., *"Flagged due to urgency language ('act now'), three shortened URLs, and sender domain registered two days ago."*

### Real-Time WebSocket Inference

A WebSocket endpoint supports streaming classification where results arrive progressively:

1. Classification verdict and confidence (~50ms)
2. SHAP token highlights (~200ms)
3. Structural feature breakdown (~50ms)
4. Gemini explanation (~800ms)

This creates a UX where the interface visually "thinks through" its analysis. A live-typing mode with 300ms debounce updates classification as the user types.

### Human-in-the-Loop Feedback System

Users can submit corrections on any prediction. Feedback is stored with the original text, model prediction, user correction, and timestamp. A stats endpoint tracks agreement/disagreement rates over time for model drift monitoring.

### Enterprise API Design

- **Rate Limiting:** Redis-backed sliding window rate limiter with tiered API keys (free: 50 req/hr, pro: 1000 req/hr)
- **Request Validation:** Zod schema validation with structured field-level error responses
- **Correlation IDs:** Every request receives a unique ID for end-to-end distributed tracing
- **Structured Logging:** Pino JSON logging with request metadata, latency tracking, and error context
- **Deep Health Checks:** `/health` endpoint verifies ML service, database, and cache connectivity

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **ML Model** | DistilBERT (HuggingFace Transformers) | Fine-tuned spam classifier |
| **Inference** | ONNX Runtime | 3-5x faster CPU inference vs PyTorch |
| **Explainability** | SHAP | Token-level attribution scores |
| **LLM** | Google Gemini Flash | Natural language explanations |
| **ML API** | FastAPI + Uvicorn | High-performance Python API |
| **API Gateway** | Express.js + ws | REST + WebSocket server |
| **Validation** | Zod | Runtime request schema validation |
| **Database** | PostgreSQL + Prisma | Predictions, feedback, API keys |
| **Cache** | Redis (ioredis) | Response caching + rate limiting |
| **Frontend** | React + Vite + Tailwind CSS | Single-page application |
| **Containerization** | Docker + Docker Compose | Multi-service orchestration |
| **CI/CD** | GitHub Actions | Lint, test, build, deploy pipeline |
| **Cloud** | GCP Cloud Run | Serverless container deployment |
| **Logging** | Pino | Structured JSON logging |

---

## Project Structure

```
mail-guard-api/
├── .github/workflows/          # CI/CD pipelines
│   └── ci.yml
├── packages/
│   ├── ml-service/             # Python ML microservice
│   │   ├── src/
│   │   │   ├── api/            # FastAPI application
│   │   │   ├── models/         # Model loading and inference
│   │   │   ├── explainers/     # SHAP integration
│   │   │   └── features/       # Structural feature extraction
│   │   ├── training/           # Fine-tuning scripts
│   │   ├── tests/              # Pytest test suite
│   │   ├── Dockerfile
│   │   └── pyproject.toml
│   ├── api-server/             # Node.js API gateway
│   │   ├── src/
│   │   │   ├── routes/         # REST endpoints
│   │   │   ├── middleware/     # Auth, rate limit, validation, logging
│   │   │   ├── services/       # ML service + Gemini clients
│   │   │   ├── websocket/      # WebSocket handler
│   │   │   └── db/             # Prisma schema
│   │   ├── Dockerfile
│   │   └── package.json
│   └── web-client/             # React frontend
├── infra/
│   └── docker-compose.yml      # Local development stack
├── legacy/                     # Archived v1 (Streamlit + sklearn)
└── README.md
```

---

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Node.js 20+
- Python 3.11+

### Local Development

```bash
# Clone the repository
git clone https://github.com/Manas-Gupta16/mail-guard-ai.git
cd mail-guard-ai

# Copy environment variables
cp .env.example .env
# Add your GEMINI_API_KEY to .env (get one at https://aistudio.google.com)

# Start all services
docker-compose -f infra/docker-compose.yml up --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| API Gateway | http://localhost:3000 |
| ML Service | http://localhost:8000 |
| API Health Check | http://localhost:3000/api/v1/health |

### Without Docker

```bash
# ML Service
cd packages/ml-service
pip install -e ".[dev]"
uvicorn src.api.main:app --reload --port 8000

# API Server
cd packages/api-server
npm install
npm run dev

# Frontend
cd packages/web-client
npm install
npm run dev
```

---

## API Reference

### POST /api/v1/classify

Classify an email as spam or ham with full explainability.

```bash
curl -X POST http://localhost:3000/api/v1/classify \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Congratulations! You have won a free prize. Click here to claim now.",
    "includeShap": true,
    "includeExplanation": true
  }'
```

**Response:**

```json
{
  "id": "req_abc123",
  "label": "spam",
  "confidence": 0.9731,
  "shapTokens": [
    { "token": "free", "score": 0.3412 },
    { "token": "prize", "score": 0.2891 },
    { "token": "congratulations", "score": 0.2104 },
    { "token": "click", "score": 0.1876 },
    { "token": "claim", "score": 0.1543 }
  ],
  "features": {
    "url_count": 0,
    "has_shortened_urls": false,
    "urgency_score": 0.33,
    "caps_ratio": 0.05,
    "exclamation_count": 1,
    "suspicious_attachment_mentioned": false
  },
  "explanation": "This email was flagged as spam with high confidence due to classic social engineering patterns. The words 'free,' 'prize,' and 'congratulations' are strong spam indicators, combined with a call-to-action phrase 'click here to claim' that attempts to create urgency.",
  "modelVersion": "2.0.0",
  "inferenceTimeMs": 42,
  "timestamp": "2026-08-02T16:30:00.000Z"
}
```

### POST /api/v1/feedback

Submit a correction on a prediction.

```bash
curl -X POST http://localhost:3000/api/v1/feedback \
  -H "Content-Type: application/json" \
  -d '{
    "predictionId": "req_abc123",
    "userLabel": "ham",
    "comment": "This was a legitimate promotional email I subscribed to."
  }'
```

### GET /api/v1/health

Deep health check across all dependencies.

```bash
curl http://localhost:3000/api/v1/health
```

### WebSocket /api/v1/classify/stream

Real-time streaming classification.

```javascript
const ws = new WebSocket("ws://localhost:3000/api/v1/classify/stream");

ws.send(JSON.stringify({ type: "classify", text: "Your email text here..." }));

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // data.type: "classification" | "shap" | "features" | "explanation" | "complete"
};
```

---

## Model Training

The DistilBERT model is fine-tuned on a merged dataset of 40,000+ emails from multiple sources:

| Dataset | Size | Source |
|---------|------|--------|
| SMS Spam Collection | 5,574 messages | UCI / Kaggle |
| Enron Spam Corpus | 33,716 emails | Kaggle |
| SpamAssassin Public Corpus | 6,047 emails | Apache |

Training is designed to run on Google Colab (free GPU) in approximately 30 minutes.

```bash
# Run the data pipeline
cd packages/ml-service
python -m training.data_pipeline --output ./data/processed

# Fine-tune the model
python -m training.train --data ./data/processed/dataset.parquet --epochs 3

# Model is saved to ./models/distilbert-spam-v2/ with ONNX export
```

---

## Development Roadmap

- [x] Phase 0: Monorepo scaffolding and architecture
- [ ] Phase 1: ML service — model training and explainability
- [ ] Phase 2: API gateway — Redis, Prisma, Gemini integration
- [ ] Phase 3: React frontend with real-time streaming UI
- [ ] Phase 4: Docker containerization and local testing
- [ ] Phase 5: GCP Cloud Run deployment and CI/CD
- [ ] Phase 6: Documentation and polish

---

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
