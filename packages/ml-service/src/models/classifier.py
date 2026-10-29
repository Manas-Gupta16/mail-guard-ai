"""
Mail Guard AI — Spam & Threat Classifier

Supports two model backends:
  1. Logistic Regression + TF-IDF (default for college/academic presentations):
     - Simple, textbook-friendly linear classification
     - Fast CPU inference (<1ms)
     - Direct token attribution via model weights: beta_i * tfidf_i
  2. DistilBERT Transformer (ONNX Runtime / PyTorch):
     - Deep contextual NLP embeddings
     - Evaluated with SHAP token attribution
"""

import pickle
from pathlib import Path

import numpy as np


class SpamClassifier:
    """
    Spam & Threat Classifier supporting Logistic Regression and DistilBERT.

    Usage:
        classifier = SpamClassifier("./models/logistic_regression")
        result = classifier.predict("Congratulations! You won free cash.", features)
    """

    LABEL_MAP = {0: "ham", 1: "spam"}
    THREAT_CLASSES = ["ham", "marketing_spam", "phishing", "malware_dropper"]

    def __init__(self, model_path: str, use_onnx: bool = True):
        raw_path = Path(model_path)
        pkg_root = Path(__file__).resolve().parent.parent.parent
        cleaned = model_path.replace("\\", "/").lstrip(".").lstrip("/")
        pkg_candidate = pkg_root / cleaned

        # Prefer the path that actually contains model files
        if (
            (raw_path / "model.pkl").exists()
            or (raw_path / "model.onnx").exists()
            or (raw_path / "config.json").exists()
        ):
            self.model_path = raw_path
        elif (
            (pkg_candidate / "model.pkl").exists()
            or (pkg_candidate / "model.onnx").exists()
            or (pkg_candidate / "config.json").exists()
        ):
            self.model_path = pkg_candidate
        elif raw_path.exists():
            self.model_path = raw_path
        elif pkg_candidate.exists():
            self.model_path = pkg_candidate
        else:
            self.model_path = raw_path

        self.use_onnx = use_onnx
        self._tokenizer = None
        self._model = None
        self._onnx_session = None
        self._vectorizer = None
        self.model_type = "unknown"

        self._load_model()

    def _load_model(self):
        """Auto-detect model backend based on directory contents."""
        lr_model = self.model_path / "model.pkl"
        lr_vec = self.model_path / "vectorizer.pkl"

        if lr_model.exists() and lr_vec.exists():
            self._load_logistic_regression(lr_model, lr_vec)
        else:
            self._load_distilbert()

    def _load_logistic_regression(self, model_file: Path, vec_file: Path):
        """Load trained Logistic Regression model and TF-IDF vectorizer."""
        with open(model_file, "rb") as f:
            self._model = pickle.load(f)  # noqa: S301
        with open(vec_file, "rb") as f:
            self._vectorizer = pickle.load(f)  # noqa: S301

        self.model_type = "logistic_regression"
        print(f"[+] Loaded Logistic Regression & TF-IDF vectorizer from {self.model_path}")

    def _load_distilbert(self):
        """Load tokenizer and DistilBERT model (ONNX or PyTorch)."""
        from transformers import AutoTokenizer

        self.model_type = "distilbert"
        self._tokenizer = AutoTokenizer.from_pretrained(self.model_path)

        if self.use_onnx:
            self._load_onnx()
        else:
            self._load_pytorch()

    def _load_onnx(self):
        """Load ONNX Runtime session for fast CPU inference."""
        import onnxruntime as ort

        onnx_path = self.model_path / "model.onnx"
        if not onnx_path.exists():
            print(f"[!] ONNX model not found at {onnx_path}, falling back to PyTorch")
            self.use_onnx = False
            self._load_pytorch()
            return

        self._onnx_session = ort.InferenceSession(
            str(onnx_path),
            providers=["CPUExecutionProvider"],
        )
        print(f"[+] ONNX model loaded from {onnx_path}")

    def _load_pytorch(self):
        """Load PyTorch model as fallback."""
        from transformers import AutoModelForSequenceClassification

        self._model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
        self._model.eval()
        print(f"[+] PyTorch model loaded from {self.model_path}")

    @property
    def tokenizer(self):
        """Expose tokenizer for SHAP explainer when using DistilBERT."""
        return self._tokenizer

    def predict(self, text: str, features: dict | None = None) -> dict:
        """
        Classify a single email text and derive fine-grained threat taxonomy.

        Args:
            text: The email body text to classify.
            features: Optional pre-extracted structural features.

        Returns:
            dict with label, confidence, threat_type, risk_score, risk_level, probabilities, logits
        """
        features = features or {}

        if self.model_type == "logistic_regression":
            return self._predict_logistic_regression(text, features)

        return self._predict_transformer(text, features)

    def _predict_logistic_regression(self, text: str, features: dict) -> dict:
        """Inference using TF-IDF Vectorizer and Logistic Regression."""
        x_vec = self._vectorizer.transform([text])
        probs = self._model.predict_proba(x_vec)[0]
        ham_prob = float(probs[0])
        spam_prob = float(probs[1])

        # Decision function log-odds: z = w^T * x + b
        decision = float(self._model.decision_function(x_vec)[0])
        logits = [-decision, decision]

        # Compute multi-class taxonomy scores
        threat_type, class_probs = self._derive_threat_taxonomy(
            spam_prob=spam_prob,
            ham_prob=ham_prob,
            text=text,
            features=features,
        )

        is_spam = threat_type != "ham"
        confidence = (1.0 - class_probs.get("ham", ham_prob)) if is_spam else ham_prob

        risk_score = self._calculate_risk_score(
            threat_type,
            max(spam_prob, 0.75 if is_spam else spam_prob),
            features,
        )
        risk_level = self._get_risk_level(risk_score)

        return {
            "label": "spam" if is_spam else "ham",
            "confidence": round(confidence, 4),
            "threat_type": threat_type,
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "probabilities": {k: round(v, 4) for k, v in class_probs.items()},
            "logits": logits,
        }

    def _predict_transformer(self, text: str, features: dict) -> dict:
        """Inference using DistilBERT."""
        inputs = self._tokenizer(
            text,
            return_tensors="np" if self.use_onnx else "pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        logits = self._predict_onnx(inputs) if self.use_onnx else self._predict_pytorch(inputs)

        binary_probs = self._softmax(logits[0])
        spam_prob = float(binary_probs[1])
        ham_prob = float(binary_probs[0])
        is_spam = spam_prob >= 0.5

        threat_type, class_probs = self._derive_threat_taxonomy(
            spam_prob=spam_prob,
            ham_prob=ham_prob,
            text=text,
            features=features,
        )

        is_spam = threat_type != "ham"
        confidence = (1.0 - class_probs.get("ham", ham_prob)) if is_spam else ham_prob

        risk_score = self._calculate_risk_score(
            threat_type,
            max(spam_prob, 0.75 if is_spam else spam_prob),
            features,
        )
        risk_level = self._get_risk_level(risk_score)

        return {
            "label": "spam" if is_spam else "ham",
            "confidence": round(confidence, 4),
            "threat_type": threat_type,
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "probabilities": {k: round(v, 4) for k, v in class_probs.items()},
            "logits": logits[0].tolist(),
        }

    def explain(self, text: str) -> list[dict]:
        """
        Extract token-level attribution scores for Logistic Regression.
        Score = beta_i * tfidf_i for each word present in the text.
        Positive score pushes toward spam, negative pushes toward ham.
        """
        if self.model_type != "logistic_regression" or self._vectorizer is None:
            return []

        x_vec = self._vectorizer.transform([text])
        feature_names = self._vectorizer.get_feature_names_out()
        coefs = self._model.coef_[0]

        row = x_vec.tocoo()
        token_scores = []
        for col, val in zip(row.col, row.data, strict=False):
            token_scores.append({
                "token": str(feature_names[col]),
                "score": float(coefs[col] * val),
            })

        token_scores.sort(key=lambda x: abs(x["score"]), reverse=True)
        return token_scores

    def _derive_threat_taxonomy(
        self,
        spam_prob: float,
        ham_prob: float,
        text: str,
        features: dict,
    ) -> tuple[str, dict[str, float]]:
        """Map binary model probabilities and threat heuristics to 4-class taxonomy."""
        phishing_signals = (
            features.get("phishing_score", 0.0) * 1.5
            + (1.0 if features.get("has_shortened_urls") else 0.0)
            + features.get("urgency_score", 0.0) * 0.8
        )

        malware_signals = (
            (2.0 if features.get("suspicious_attachment_mentioned") else 0.0)
            + features.get("malware_score", 0.0) * 1.5
        )

        marketing_signals = (
            features.get("marketing_score", 0.0) * 1.5
            + (0.5 if "unsubscribe" in text.lower() else 0.0)
        )

        scores = {
            "phishing": phishing_signals,
            "malware_dropper": malware_signals,
            "marketing_spam": marketing_signals + 0.1,
        }

        dominant_threat = max(scores, key=scores.get)
        max_threat_score = scores[dominant_threat]

        # In cybersecurity, a threat is triggered if statistical spam >= 0.50 OR
        # if elevated spam probability (>= 0.35) combines with high threat signals (>= 0.80)
        is_threat = (
            spam_prob >= 0.5
            or (spam_prob >= 0.35 and max_threat_score >= 0.8)
            or max_threat_score >= 1.5
        )

        if not is_threat:
            return "ham", {
                "ham": ham_prob,
                "marketing_spam": spam_prob * 0.4,
                "phishing": spam_prob * 0.4,
                "malware_dropper": spam_prob * 0.2,
            }

        effective_spam_prob = max(spam_prob, 0.85 if max_threat_score >= 0.8 else spam_prob)
        total_subscore = sum(scores.values()) or 1.0
        threat_probs = {
            "ham": round(1.0 - effective_spam_prob, 4),
            "marketing_spam": round(
                effective_spam_prob * (scores["marketing_spam"] / total_subscore), 4
            ),
            "phishing": round(
                effective_spam_prob * (scores["phishing"] / total_subscore), 4
            ),
            "malware_dropper": round(
                effective_spam_prob * (scores["malware_dropper"] / total_subscore), 4
            ),
        }

        return dominant_threat, threat_probs

    def _calculate_risk_score(self, threat_type: str, spam_prob: float, features: dict) -> float:
        """Compute compound risk score (0-100)."""
        base_score = spam_prob * 60.0

        if threat_type == "malware_dropper":
            base_score += 35.0
        elif threat_type == "phishing":
            base_score += 25.0
        elif threat_type == "marketing_spam":
            base_score += 10.0

        if features.get("has_shortened_urls"):
            base_score += 10.0
        if features.get("urgency_score", 0) > 0.5:
            base_score += 8.0
        if features.get("suspicious_attachment_mentioned"):
            base_score += 15.0

        return min(max(base_score, 0.0), 100.0)

    @staticmethod
    def _get_risk_level(risk_score: float) -> str:
        """Categorize risk score into actionable severity tiers."""
        if risk_score >= 85.0:
            return "CRITICAL"
        if risk_score >= 60.0:
            return "HIGH"
        if risk_score >= 25.0:
            return "MEDIUM"
        return "LOW"

    def _predict_onnx(self, inputs) -> np.ndarray:
        """Run inference with ONNX Runtime."""
        ort_inputs = {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"],
        }
        outputs = self._onnx_session.run(None, ort_inputs)
        return outputs[0]

    def _predict_pytorch(self, inputs) -> np.ndarray:
        """Run inference with PyTorch."""
        import torch

        with torch.no_grad():
            outputs = self._model(**inputs)
        return outputs.logits.numpy()

    @staticmethod
    def _softmax(logits: np.ndarray) -> np.ndarray:
        """Compute softmax probabilities from logits."""
        exp = np.exp(logits - np.max(logits))
        return exp / exp.sum()
