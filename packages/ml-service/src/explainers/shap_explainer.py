"""
Mail Guard AI — SHAP Explainer

Generates token-level attribution scores using SHAP, explaining
which words in an email contributed most to the spam/ham classification.
"""

from typing import Any

import numpy as np


class ShapExplainer:
    """
    Wraps SHAP's text explainer around our SpamClassifier.

    Produces a list of {token, score} dicts where:
      - Positive score → token pushes toward "spam"
      - Negative score → token pushes toward "ham"
      - Higher absolute value → stronger contribution

    Usage:
        explainer = ShapExplainer(classifier)
        tokens = explainer.explain("Click here to claim your free prize!")
        # [{"token": "free", "score": 0.34}, {"token": "prize", "score": 0.28}, ...]
    """

    def __init__(self, classifier: Any):
        self.classifier = classifier
        self._explainer = None

    def _build_explainer(self):
        """Lazily build the SHAP explainer on first use."""
        import shap

        def model_predict(texts: list[str]) -> np.ndarray:
            """Batch prediction function for SHAP."""
            results = []
            for text in texts:
                result = self.classifier.predict(text)
                logits = result["logits"]
                # Convert logits to probabilities
                exp = np.exp(logits - np.max(logits))
                probs = exp / exp.sum()
                results.append(probs)
            return np.array(results)

        # Use the masker for text tokenization
        masker = shap.maskers.Text(self.classifier.tokenizer)
        self._explainer = shap.Explainer(
            model_predict,
            masker,
            output_names=["ham", "spam"],
        )

    def explain(self, text: str) -> list[dict]:
        """
        Generate SHAP token attributions for the given text.

        Args:
            text: Email body text to explain.

        Returns:
            List of dicts with 'token' and 'score' keys,
            sorted by absolute score descending.
        """
        if self._explainer is None:
            self._build_explainer()

        shap_values = self._explainer([text])

        # Extract values for the "spam" class (index 1)
        tokens = shap_values.data[0]
        scores = shap_values.values[0][:, 1]  # spam class attributions

        token_scores = []
        for token, score in zip(tokens, scores):
            token_str = str(token).strip()
            if token_str and token_str not in ("[CLS]", "[SEP]", "[PAD]"):
                token_scores.append({
                    "token": token_str,
                    "score": float(score),
                })

        # Sort by absolute score, strongest contributors first
        token_scores.sort(key=lambda x: abs(x["score"]), reverse=True)

        return token_scores
