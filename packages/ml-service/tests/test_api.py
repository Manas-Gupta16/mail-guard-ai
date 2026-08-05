"""
Tests for the FastAPI ML service endpoints.

Uses FastAPI's TestClient for synchronous testing without
needing a running server or trained model.
"""

from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

# ─── Mock the classifier before importing the app ─────────────────────
mock_classifier = MagicMock()
mock_classifier.predict.return_value = {
    "label": "spam",
    "confidence": 0.95,
    "logits": [0.2, 3.0],
}
mock_classifier.tokenizer = MagicMock()

mock_explainer = MagicMock()
mock_explainer.explain.return_value = [
    {"token": "free", "score": 0.35},
    {"token": "prize", "score": 0.28},
    {"token": "click", "score": 0.19},
]


@pytest.fixture
def client():
    """Create a test client with mocked ML components."""
    with patch("src.api.main.SpamClassifier", return_value=mock_classifier), \
         patch("src.api.main.ShapExplainer", return_value=mock_explainer):
        from src.api.main import app
        with TestClient(app) as c:
            yield c


class TestHealthEndpoint:
    def test_health_returns_ok(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["model_loaded"] is True
        assert "model_version" in data

    def test_health_when_model_not_loaded(self):
        with patch("src.api.main.SpamClassifier", side_effect=Exception("Model failed to load")):
            from src.api.main import app
            with TestClient(app, raise_server_exceptions=False) as c:
                response = c.get("/health")
                data = response.json()
                assert data["status"] == "degraded"
                assert data["model_loaded"] is False


class TestPredictEndpoint:
    def test_predict_spam(self, client):
        response = client.post("/predict", json={
            "text": "Congratulations! You won a free prize!",
            "include_shap": True,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["label"] == "spam"
        assert data["confidence"] > 0.5
        assert len(data["shap_tokens"]) > 0
        assert "features" in data
        assert "model_version" in data
        assert "inference_time_ms" in data

    def test_predict_without_shap(self, client):
        response = client.post("/predict", json={
            "text": "Hello, how are you?",
            "include_shap": False,
        })
        assert response.status_code == 200
        data = response.json()
        assert data["shap_tokens"] == []

    def test_predict_empty_text_fails(self, client):
        response = client.post("/predict", json={
            "text": "",
        })
        assert response.status_code == 422  # Validation error

    def test_predict_missing_text_fails(self, client):
        response = client.post("/predict", json={})
        assert response.status_code == 422

    def test_predict_text_too_long(self, client):
        response = client.post("/predict", json={
            "text": "x" * 6000,  # Exceeds 5000 char limit
        })
        assert response.status_code == 422

    def test_predict_returns_features(self, client):
        response = client.post("/predict", json={
            "text": "Click here: https://bit.ly/abc URGENT!",
            "include_shap": False,
        })
        assert response.status_code == 200
        data = response.json()
        features = data["features"]
        assert "url_count" in features
        assert "urgency_score" in features
        assert "caps_ratio" in features

    def test_predict_response_structure(self, client):
        response = client.post("/predict", json={
            "text": "Test email content",
            "include_shap": True,
        })
        data = response.json()

        # Verify all expected fields are present
        required_fields = [
            "label", "confidence", "shap_tokens",
            "features", "model_version", "inference_time_ms",
        ]
        for field in required_fields:
            assert field in data, f"Missing field: {field}"

        # Verify types
        assert isinstance(data["label"], str)
        assert isinstance(data["confidence"], float)
        assert isinstance(data["shap_tokens"], list)
        assert isinstance(data["features"], dict)
        assert isinstance(data["inference_time_ms"], int)


class TestPredictEndpointModelNotLoaded:
    def test_predict_returns_503_when_no_model(self):
        with patch("src.api.main.SpamClassifier", side_effect=Exception("Model failed to load")):
            from src.api.main import app
            with TestClient(app, raise_server_exceptions=False) as c:
                response = c.post("/predict", json={
                    "text": "Test email",
                })
                assert response.status_code == 503
