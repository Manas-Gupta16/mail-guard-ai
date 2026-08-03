"""
Mail Guard AI — Model Evaluation Script

Loads a trained model and runs comprehensive evaluation:
  - Accuracy, F1, Precision, Recall
  - Confusion matrix visualization
  - Per-class breakdown
  - Inference latency benchmarking
  - Sample predictions with confidence scores

Usage:
  python -m training.evaluate --model ./models/distilbert-spam-v2 --data ./data/processed/dataset.parquet
"""

import argparse
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)


def load_model(model_path: str, use_onnx: bool = True):
    """Load the trained model and tokenizer."""
    from transformers import AutoTokenizer

    tokenizer = AutoTokenizer.from_pretrained(model_path)

    if use_onnx and (Path(model_path) / "model.onnx").exists():
        import onnxruntime as ort

        session = ort.InferenceSession(
            str(Path(model_path) / "model.onnx"),
            providers=["CPUExecutionProvider"],
        )
        return tokenizer, session, "onnx"
    else:
        from transformers import AutoModelForSequenceClassification

        model = AutoModelForSequenceClassification.from_pretrained(model_path)
        model.eval()
        return tokenizer, model, "pytorch"


def predict_batch(texts: list[str], tokenizer, model, backend: str) -> np.ndarray:
    """Run batch prediction, returning probabilities."""
    inputs = tokenizer(
        texts,
        return_tensors="np" if backend == "onnx" else "pt",
        truncation=True,
        max_length=512,
        padding=True,
    )

    if backend == "onnx":
        ort_inputs = {
            "input_ids": inputs["input_ids"],
            "attention_mask": inputs["attention_mask"],
        }
        logits = model.run(None, ort_inputs)[0]
    else:
        import torch

        with torch.no_grad():
            outputs = model(**inputs)
        logits = outputs.logits.numpy()

    # Softmax
    exp = np.exp(logits - np.max(logits, axis=-1, keepdims=True))
    probs = exp / exp.sum(axis=-1, keepdims=True)
    return probs


def main(
    model_path: str = "./models/distilbert-spam-v2",
    data_path: str = "./data/processed/dataset.parquet",
    use_onnx: bool = True,
    batch_size: int = 32,
):
    """Run full evaluation."""
    print("Mail Guard AI — Model Evaluation\n")

    # Load model
    print(f"Loading model from {model_path} (backend: {'ONNX' if use_onnx else 'PyTorch'})...")
    tokenizer, model, backend = load_model(model_path, use_onnx)
    print(f"  Backend: {backend}\n")

    # Load test data
    print(f"Loading test data from {data_path}...")
    df = pd.read_parquet(data_path)
    test_df = df[df["split"] == "test"].reset_index(drop=True)
    print(f"  Test samples: {len(test_df)}\n")

    # Run predictions in batches
    print("Running predictions...")
    all_probs = []
    start_time = time.perf_counter()

    for i in range(0, len(test_df), batch_size):
        batch_texts = test_df["text"].iloc[i : i + batch_size].tolist()
        probs = predict_batch(batch_texts, tokenizer, model, backend)
        all_probs.append(probs)

    total_time = time.perf_counter() - start_time
    all_probs = np.concatenate(all_probs, axis=0)

    y_true = test_df["label"].values
    y_pred = np.argmax(all_probs, axis=-1)
    confidences = np.max(all_probs, axis=-1)

    # Metrics
    print("\n" + "=" * 50)
    print("TEST SET RESULTS")
    print("=" * 50)
    print(f"  Accuracy:  {accuracy_score(y_true, y_pred):.4f}")
    print(f"  F1 Score:  {f1_score(y_true, y_pred):.4f}")
    print(f"  Precision: {precision_score(y_true, y_pred):.4f}")
    print(f"  Recall:    {recall_score(y_true, y_pred):.4f}")

    # Classification report
    print(f"\n{'=' * 50}")
    print("CLASSIFICATION REPORT")
    print("=" * 50)
    print(classification_report(y_true, y_pred, target_names=["Ham", "Spam"]))

    # Confusion matrix
    cm = confusion_matrix(y_true, y_pred)
    print(f"{'=' * 50}")
    print("CONFUSION MATRIX")
    print("=" * 50)
    print(f"  True Neg (Ham→Ham):    {cm[0][0]}")
    print(f"  False Pos (Ham→Spam):  {cm[0][1]}")
    print(f"  False Neg (Spam→Ham):  {cm[1][0]}")
    print(f"  True Pos (Spam→Spam):  {cm[1][1]}")

    # Latency
    avg_latency = (total_time / len(test_df)) * 1000
    print(f"\n{'=' * 50}")
    print("PERFORMANCE")
    print("=" * 50)
    print(f"  Total inference time:  {total_time:.2f}s")
    print(f"  Avg latency per email: {avg_latency:.1f}ms")
    print(f"  Throughput: {len(test_df) / total_time:.0f} emails/sec")

    # Confidence analysis
    print(f"\n{'=' * 50}")
    print("CONFIDENCE ANALYSIS")
    print("=" * 50)
    correct_mask = y_true == y_pred
    print(f"  Avg confidence (correct):   {confidences[correct_mask].mean():.4f}")
    if (~correct_mask).any():
        print(f"  Avg confidence (incorrect): {confidences[~correct_mask].mean():.4f}")
    else:
        print(f"  Avg confidence (incorrect): N/A (all correct)")

    # Save confusion matrix plot
    try:
        import matplotlib.pyplot as plt
        import seaborn as sns

        output_dir = Path("artifacts")
        output_dir.mkdir(exist_ok=True)

        fig, ax = plt.subplots(figsize=(8, 6))
        sns.heatmap(
            cm,
            annot=True,
            fmt="d",
            cmap="Blues",
            xticklabels=["Ham", "Spam"],
            yticklabels=["Ham", "Spam"],
            ax=ax,
            annot_kws={"size": 16},
        )
        ax.set_xlabel("Predicted", fontsize=14)
        ax.set_ylabel("Actual", fontsize=14)
        ax.set_title("Mail Guard AI — Confusion Matrix", fontsize=16)
        plt.tight_layout()
        plt.savefig(output_dir / "confusion_matrix.png", dpi=150)
        plt.close()
        print(f"\n  Confusion matrix saved to artifacts/confusion_matrix.png")
    except ImportError:
        print("\n  matplotlib/seaborn not installed — skipping plot generation")

    return {
        "accuracy": accuracy_score(y_true, y_pred),
        "f1": f1_score(y_true, y_pred),
        "precision": precision_score(y_true, y_pred),
        "recall": recall_score(y_true, y_pred),
        "avg_latency_ms": avg_latency,
    }


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mail Guard AI — Evaluate Model")
    parser.add_argument("--model", type=str, default="./models/distilbert-spam-v2")
    parser.add_argument("--data", type=str, default="./data/processed/dataset.parquet")
    parser.add_argument("--no-onnx", action="store_true", help="Use PyTorch instead of ONNX")
    parser.add_argument("--batch-size", type=int, default=32)
    args = parser.parse_args()

    main(
        model_path=args.model,
        data_path=args.data,
        use_onnx=not args.no_onnx,
        batch_size=args.batch_size,
    )
