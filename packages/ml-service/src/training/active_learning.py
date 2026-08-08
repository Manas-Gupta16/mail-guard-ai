"""
Mail Guard AI — Active Learning & Model Drift Engine

Analyzes human-in-the-loop feedback corrections, detects model drift,
and generates curated dataset manifests for automated DistilBERT fine-tuning.
"""

import json
from dataclasses import asdict, dataclass
from datetime import datetime


@dataclass
class DriftReport:
    """Model performance drift evaluation report."""
    total_feedback_samples: int
    agreement_count: int
    disagreement_count: int
    agreement_rate: float
    drift_score: float  # 0.0 (no drift) to 1.0 (severe drift)
    drift_status: str   # "HEALTHY" | "MONITOR" | "RETRAINING_RECOMMENDED"
    uncertainty_samples_count: int
    generated_at: str


class ActiveLearningEngine:
    """
    Evaluates model drift and creates fine-tuning training sets from user corrections.
    """

    def __init__(self, uncertainty_threshold: float = 0.65):
        self.uncertainty_threshold = uncertainty_threshold

    def analyze_feedback(self, feedback_records: list[dict]) -> DriftReport:
        """
        Evaluate dataset shift and model drift from human feedback logs.

        Args:
            feedback_records: list of dicts with keys:
              - id: str
              - model_label: str
              - user_label: str
              - confidence: float
              - text: str
        """
        total = len(feedback_records)
        if total == 0:
            return DriftReport(
                total_feedback_samples=0,
                agreement_count=0,
                disagreement_count=0,
                agreement_rate=1.0,
                drift_score=0.0,
                drift_status="HEALTHY",
                uncertainty_samples_count=0,
                generated_at=datetime.utcnow().isoformat(),
            )

        agreements = sum(1 for f in feedback_records if f.get("model_label") == f.get("user_label"))
        disagreements = total - agreements
        agreement_rate = round(agreements / total, 4)
        drift_score = round(disagreements / total, 4)

        # Count borderline predictions where the model was uncertain
        uncertain_count = sum(
            1 for f in feedback_records
            if 0.40 <= f.get("confidence", 0.5) <= self.uncertainty_threshold
        )

        if drift_score >= 0.20:
            status = "RETRAINING_RECOMMENDED"
        elif drift_score >= 0.10:
            status = "MONITOR"
        else:
            status = "HEALTHY"

        return DriftReport(
            total_feedback_samples=total,
            agreement_count=agreements,
            disagreement_count=disagreements,
            agreement_rate=agreement_rate,
            drift_score=drift_score,
            drift_status=status,
            uncertainty_samples_count=uncertain_count,
            generated_at=datetime.utcnow().isoformat(),
        )

    def export_training_manifest(self, feedback_records: list[dict]) -> list[dict]:
        """
        Convert human feedback corrections into supervised training samples.

        Returns list of {"text": str, "label": int} (0=ham, 1=spam).
        """
        training_samples = []
        for record in feedback_records:
            user_label = record.get("user_label", "").lower()
            text = record.get("text", "")
            if text and user_label in ("ham", "spam"):
                training_samples.append({
                    "text": text,
                    "label": 1 if user_label == "spam" else 0,
                    "source": "human_feedback_active_learning",
                    "correction_timestamp": record.get("createdAt", datetime.utcnow().isoformat()),
                })
        return training_samples


if __name__ == "__main__":
    # Test demonstration run
    engine = ActiveLearningEngine()
    dummy_records = [
        {
            "model_label": "spam",
            "user_label": "spam",
            "confidence": 0.98,
            "text": "Win free money now",
        },
        {
            "model_label": "spam",
            "user_label": "ham",
            "confidence": 0.55,
            "text": "Team meeting invoice update",
        },
        {
            "model_label": "ham",
            "user_label": "ham",
            "confidence": 0.99,
            "text": "See you at the conference",
        },
    ]
    report = engine.analyze_feedback(dummy_records)
    print(json.dumps(asdict(report), indent=2))
