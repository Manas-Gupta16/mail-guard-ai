"""
Mail Guard AI — ML Service

FastAPI application providing spam classification with SHAP explainability.
"""

from contextlib import asynccontextmanager
import time

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from src.config import settings
from src.models.classifier import SpamClassifier
from src.explainers.shap_explainer import ShapExplainer
from src.features.extractor import FeatureExtractor

# --------------------------------------------------------------------------- #
#  Globals (loaded once at startup)
# --------------------------------------------------------------------------- #
classifier: SpamClassifier | None = None
explainer: ShapExplainer | None = None
feature_extractor = FeatureExtractor()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load model and explainer on startup, release on shutdown."""
    global classifier, explainer

    print(f"🔄 Loading model from {settings.model_path} ...")
    classifier = SpamClassifier(
        model_path=settings.model_path,
        use_onnx=settings.use_onnx,
    )
    explainer = ShapExplainer(classifier)
    print(f"✅ Model v{settings.model_version} loaded successfully")

    yield  # App is running

    print("🛑 Shutting down ML service")
    classifier = None
    explainer = None


# --------------------------------------------------------------------------- #
#  App
# --------------------------------------------------------------------------- #
app = FastAPI(
    title="Mail Guard AI — ML Service",
    version=settings.model_version,
    description="Spam classification with SHAP explainability",
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
    """Response body for /predict endpoint."""

    label: str  # "spam" | "ham"
    confidence: float
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
    """Classify email text as spam or ham with SHAP explanations."""
    if classifier is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    start = time.perf_counter()

    # 1. Classify
    result = classifier.predict(request.text)

    # 2. Extract structural features
    features = feature_extractor.extract(request.text)

    # 3. SHAP explanation (if requested)
    shap_tokens = []
    if request.include_shap and explainer is not None:
        raw_shap = explainer.explain(request.text)
        shap_tokens = [
            ShapToken(token=t["token"], score=round(t["score"], 4))
            for t in raw_shap[: settings.shap_max_tokens]
        ]

    elapsed_ms = int((time.perf_counter() - start) * 1000)

    return PredictResponse(
        label=result["label"],
        confidence=round(result["confidence"], 4),
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
