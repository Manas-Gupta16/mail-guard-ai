"""
Mail Guard AI — Spam & Threat Classifier

Loads a fine-tuned DistilBERT model (PyTorch or ONNX) and maps predictions
into an enterprise 4-class cybersecurity threat taxonomy:
  - ham: Benign, legitimate email
  - marketing_spam: Commercial bulk emails, promotional spam, newsletters
  - phishing: Credential harvesting, urgent account suspension, fake logins
  - malware_dropper: Malicious attachments, payload links, script injection
"""

from pathlib import Path

import numpy as np


class SpamClassifier:
    """
    Wraps DistilBERT model with multi-class cybersecurity taxonomy mapping.

    Supports two inference backends:
      - ONNX Runtime (default): ~3-5x faster on CPU (~12ms)
      - PyTorch: fallback if ONNX model not available

    Usage:
        classifier = SpamClassifier("./models/distilbert-spam-v2")
        result = classifier.predict("Verify your account: http://bit.ly/123", features)
    """

    LABEL_MAP = {0: "ham", 1: "spam"}
    THREAT_CLASSES = ["ham", "marketing_spam", "phishing", "malware_dropper"]

    def __init__(self, model_path: str, use_onnx: bool = True):
        self.model_path = Path(model_path)
        self.use_onnx = use_onnx
        self._tokenizer = None
        self._model = None
        self._onnx_session = None

        self._load_model()

    def _load_model(self):
        """Load tokenizer and model from disk."""
        from transformers import AutoTokenizer

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
        """Expose tokenizer for SHAP explainer."""
        return self._tokenizer

    def predict(self, text: str, features: dict | None = None) -> dict:
        """
        Classify a single email text and derive fine-grained threat taxonomy.

        Args:
            text: The email body text to classify.
            features: Optional pre-extracted structural features.

        Returns:
            dict with keys:
              - label: 'spam' | 'ham'
              - confidence: float (0.0-1.0)
              - threat_type: 'ham' | 'marketing_spam' | 'phishing' | 'malware_dropper'
              - risk_score: float (0.0-100.0)
              - risk_level: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
              - probabilities: dict of class -> probability
              - logits: list of raw model logits
        """
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

        # Compute multi-class taxonomy scores
        threat_type, class_probs = self._derive_threat_taxonomy(
            spam_prob=spam_prob,
            ham_prob=ham_prob,
            text=text,
            features=features or {},
        )

        # Compound risk score (0-100)
        risk_score = self._calculate_risk_score(threat_type, spam_prob, features or {})
        risk_level = self._get_risk_level(risk_score)

        return {
            "label": "spam" if is_spam else "ham",
            "confidence": round(spam_prob if is_spam else ham_prob, 4),
            "threat_type": threat_type,
            "risk_score": round(risk_score, 2),
            "risk_level": risk_level,
            "probabilities": {k: round(v, 4) for k, v in class_probs.items()},
            "logits": logits[0].tolist(),
        }

    def _derive_threat_taxonomy(
        self,
        spam_prob: float,
        ham_prob: float,
        text: str,
        features: dict,
    ) -> tuple[str, dict[str, float]]:
        """Map binary model probabilities and threat heuristics to 4-class taxonomy."""
        if spam_prob < 0.5:
            # Benign email
            return "ham", {
                "ham": ham_prob,
                "marketing_spam": spam_prob * 0.4,
                "phishing": spam_prob * 0.4,
                "malware_dropper": spam_prob * 0.2,
            }

        # It is spam — determine the granular subtype
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
            "marketing_spam": marketing_signals + 0.1,  # Default spam baseline
        }

        # Dominant threat
        dominant_threat = max(scores, key=scores.get)

        # Build normalized probability distribution
        total_subscore = sum(scores.values()) or 1.0
        threat_probs = {
            "ham": round(ham_prob, 4),
            "marketing_spam": round(spam_prob * (scores["marketing_spam"] / total_subscore), 4),
            "phishing": round(spam_prob * (scores["phishing"] / total_subscore), 4),
            "malware_dropper": round(spam_prob * (scores["malware_dropper"] / total_subscore), 4),
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

        # Structural modifiers
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
