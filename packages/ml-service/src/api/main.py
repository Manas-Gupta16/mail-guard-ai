"""
Mail Guard AI — ML Service

FastAPI application providing multi-class spam and threat classification,
SHAP explainability, structural signal extraction, and Prometheus observability.
"""

import time
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel, Field

from src.config import settings
from src.explainers.shap_explainer import ShapExplainer
from src.features.extractor import FeatureExtractor
from src.models.classifier import SpamClassifier

# --------------------------------------------------------------------------- #
#  Globals & Prometheus Counters
# --------------------------------------------------------------------------- #
classifier: SpamClassifier | None = None
explainer: ShapExplainer | None = None
feature_extractor = FeatureExtractor()

# In-memory Prometheus metric counters
metrics_state = {
    "requests_total": 0,
    "predictions_total": {"ham": 0, "marketing_spam": 0, "phishing": 0, "malware_dropper": 0},
    "total_inference_time_ms": 0.0,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and explainer on startup, release on shutdown."""
    global classifier, explainer

    try:
        print(f"[+] Loading model from {settings.model_path} ...")
        classifier = SpamClassifier(
            model_path=settings.model_path,
            use_onnx=settings.use_onnx,
        )
        explainer = ShapExplainer(classifier)
        print(f"[+] Model v{settings.model_version} loaded successfully")
    except Exception as err:
        print(f"[!] Failed to load model: {err}")
        classifier = None
        explainer = None

    yield  # App is running

    print("[*] Shutting down ML service")
    classifier = None
    explainer = None


# --------------------------------------------------------------------------- #
#  App
# --------------------------------------------------------------------------- #
app = FastAPI(
    title="Mail Guard AI — ML Service",
    version=settings.model_version,
    description="Multi-class spam & threat classification with SHAP explainability",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# --------------------------------------------------------------------------- #
#  Schemas
# --------------------------------------------------------------------------- #
class PredictRequest(BaseModel):
    """Request body for /predict endpoint."""

    text: str = Field(..., min_length=1, max_length=5000, description="Email text to classify")
    include_shap: bool = Field(True, description="Include SHAP token attributions")


class ShapToken(BaseModel):
    token: str
    score: float


class PredictResponse(BaseModel):
    """Response body for /predict endpoint with multi-class taxonomy."""

    label: str  # "spam" | "ham"
    confidence: float
    threat_type: str = "ham"  # "ham" | "marketing_spam" | "phishing" | "malware_dropper"
    risk_score: float = 0.0  # 0.0 to 100.0
    risk_level: str = "LOW"  # "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    probabilities: dict[str, float] = {}
    shap_tokens: list[ShapToken]
    features: dict
    model_version: str
    inference_time_ms: int


class HealthResponse(BaseModel):
    status: str
    model_loaded: bool
    model_version: str


# --------------------------------------------------------------------------- #
#  Routes
# --------------------------------------------------------------------------- #
@app.post("/predict", response_model=PredictResponse)
async def predict(request: PredictRequest):
    """Classify email text with 4-class taxonomy, risk scores, and SHAP tokens."""
    if classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    start = time.perf_counter()

    # 1. Extract structural features first
    features = feature_extractor.extract(request.text)

    # 2. Classify with multi-class threat taxonomy
    result = classifier.predict(request.text, features=features)

    # 3. SHAP explanation (if requested)
    shap_tokens = []
    if request.include_shap and explainer is not None:
        raw_shap = explainer.explain(request.text)
        shap_tokens = [
            ShapToken(token=t["token"], score=round(t["score"], 4))
            for t in raw_shap[: settings.shap_max_tokens]
        ]

    elapsed_ms = int((time.perf_counter() - start) * 1000)

    # Update Prometheus counters
    metrics_state["requests_total"] += 1
    metrics_state["total_inference_time_ms"] += elapsed_ms
    threat = result.get("threat_type", "ham")
    if threat in metrics_state["predictions_total"]:
        metrics_state["predictions_total"][threat] += 1

    return PredictResponse(
        label=result["label"],
        confidence=round(result["confidence"], 4),
        threat_type=result.get("threat_type", "ham"),
        risk_score=result.get("risk_score", 0.0),
        risk_level=result.get("risk_level", "LOW"),
        probabilities=result.get("probabilities", {}),
        shap_tokens=shap_tokens,
        features=features,
        model_version=settings.model_version,
        inference_time_ms=elapsed_ms,
    )


@app.get("/health", response_model=HealthResponse)
async def health():
    """Health check endpoint."""
    return HealthResponse(
        status="ok" if classifier is not None else "degraded",
        model_loaded=classifier is not None,
        model_version=settings.model_version,
    )


@app.get("/metrics", response_class=PlainTextResponse)
async def metrics():
    """Prometheus scrapable metrics format."""
    req_count = metrics_state["requests_total"]
    avg_latency = (
        (metrics_state["total_inference_time_ms"] / req_count) if req_count > 0 else 0.0
    )

    lines = [
        "# HELP ml_requests_total Total number of classification requests handled by ML service",
        "# TYPE ml_requests_total counter",
        f"ml_requests_total {req_count}",
        "",
        "# HELP ml_inference_latency_avg_ms Average inference latency in milliseconds",
        "# TYPE ml_inference_latency_avg_ms gauge",
        f"ml_inference_latency_avg_ms {round(avg_latency, 2)}",
        "",
        "# HELP ml_predictions_by_threat_total Total predictions grouped by threat taxonomy",
        "# TYPE ml_predictions_by_threat_total counter",
    ]

    for threat, count in metrics_state["predictions_total"].items():
        lines.append(f'ml_predictions_by_threat_total{{threat_type="{threat}"}} {count}')

    lines.append("")
    return "\n".join(lines)
