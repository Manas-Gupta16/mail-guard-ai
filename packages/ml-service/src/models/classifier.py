"""
Mail Guard AI — Spam Classifier

Loads a fine-tuned DistilBERT model (PyTorch or ONNX) and provides
inference with confidence scores.
"""

from pathlib import Path

import numpy as np


class SpamClassifier:
    """
    Wraps a HuggingFace DistilBERT model for spam classification.

    Supports two inference backends:
      - ONNX Runtime (default): ~3-5x faster on CPU
      - PyTorch: fallback if ONNX model not available

    Usage:
        classifier = SpamClassifier("./models/distilbert-spam-v2")
        result = classifier.predict("Congratulations! You've won!")
        # {"label": "spam", "confidence": 0.97}
    """

    LABEL_MAP = {0: "ham", 1: "spam"}

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
            print(f"⚠️  ONNX model not found at {onnx_path}, falling back to PyTorch")
            self.use_onnx = False
            self._load_pytorch()
            return

        self._onnx_session = ort.InferenceSession(
            str(onnx_path),
            providers=["CPUExecutionProvider"],
        )
        print(f"✅ ONNX model loaded from {onnx_path}")

    def _load_pytorch(self):
        """Load PyTorch model as fallback."""
        from transformers import AutoModelForSequenceClassification

        self._model = AutoModelForSequenceClassification.from_pretrained(self.model_path)
        self._model.eval()
        print(f"✅ PyTorch model loaded from {self.model_path}")

    @property
    def tokenizer(self):
        """Expose tokenizer for SHAP explainer."""
        return self._tokenizer

    def predict(self, text: str) -> dict:
        """
        Classify a single email text.

        Args:
            text: The email body text to classify.

        Returns:
            dict with keys: label (str), confidence (float), logits (list)
        """
        inputs = self._tokenizer(
            text,
            return_tensors="np" if self.use_onnx else "pt",
            truncation=True,
            max_length=512,
            padding=True,
        )

        if self.use_onnx:
            logits = self._predict_onnx(inputs)
        else:
            logits = self._predict_pytorch(inputs)

        probabilities = self._softmax(logits[0])
        predicted_class = int(np.argmax(probabilities))

        return {
            "label": self.LABEL_MAP[predicted_class],
            "confidence": float(probabilities[predicted_class]),
            "logits": logits[0].tolist(),
        }

    def _predict_onnx(self, inputs) -> np.ndarray:
        """Run inference with ONNX Runtime."""
        ort_inputs = {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"],
        }
        outputs = self._onnx_session.run(None, ort_inputs)
        return outputs[0]  # logits

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
