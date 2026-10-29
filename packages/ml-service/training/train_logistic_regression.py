"""
Mail Guard AI — Logistic Regression + TF-IDF Training Pipeline

Trains a textbook-friendly, explainable Logistic Regression classifier on the
Spam dataset using TF-IDF vectorization.

Produces:
  - model.pkl (LogisticRegression)
  - vectorizer.pkl (TfidfVectorizer)
  - metrics.json (Accuracy, Precision, Recall, F1, Confusion Matrix)
"""

import json
import pickle
from pathlib import Path

import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import train_test_split


def train(
    data_path: str | None = None,
    output_dir: str | None = None,
    test_size: float = 0.2,
    random_state: int = 42,
):
    """Train Logistic Regression on the Spam dataset."""
    base_dir = Path(__file__).resolve().parent.parent
    dataset_file = Path(data_path) if data_path else base_dir / "data" / "raw" / "spam.csv"
    output_path = Path(output_dir) if output_dir else base_dir / "models" / "logistic_regression"
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"[+] Loading dataset from {dataset_file} ...")
    df = pd.read_csv(dataset_file, encoding="latin-1")

    # SMS Spam dataset has columns v1 (label) and v2 (text)
    if "v1" in df.columns and "v2" in df.columns:
        df = df[["v1", "v2"]].copy()
        df.columns = ["label_str", "text"]
    elif "label" in df.columns and "message" in df.columns:
        df = df[["label", "message"]].copy()
        df.columns = ["label_str", "text"]
    else:
        df = df.iloc[:, [0, 1]].copy()
        df.columns = ["label_str", "text"]

    df = df.dropna(subset=["label_str", "text"])
    df["label"] = df["label_str"].map({"ham": 0, "spam": 1, 0: 0, 1: 1})
    df = df.dropna(subset=["label"])
    df["label"] = df["label"].astype(int)

    total_samples = len(df)
    spam_count = int(df["label"].sum())
    ham_count = total_samples - spam_count
    print(f"[+] Dataset loaded: {total_samples} samples ({ham_count} ham, {spam_count} spam)")

    # 1. Train / Test Split
    x_train, x_test, y_train, y_test = train_test_split(
        df["text"],
        df["label"],
        test_size=test_size,
        random_state=random_state,
        stratify=df["label"],
    )
    print(f"[+] Train set: {len(x_train)} samples, Test set: {len(x_test)} samples")

    # 2. TF-IDF Feature Extraction (unigrams + bigrams, English stop words)
    print("[+] Extracting TF-IDF features ...")
    vectorizer = TfidfVectorizer(
        stop_words="english",
        ngram_range=(1, 2),
        max_features=5000,
        sublinear_tf=True,
    )
    x_train_vec = vectorizer.fit_transform(x_train)
    x_test_vec = vectorizer.transform(x_test)
    print(f"[+] Vocabulary size: {len(vectorizer.vocabulary_)} features")

    # 3. Logistic Regression Classifier
    print("[+] Training Logistic Regression classifier ...")
    model = LogisticRegression(
        C=1.0,
        max_iter=1000,
        class_weight="balanced",  # Accounts for class imbalance between ham and spam
        random_state=random_state,
    )
    model.fit(x_train_vec, y_train)

    # 4. Evaluation
    y_pred = model.predict(x_test_vec)

    acc = float(accuracy_score(y_test, y_pred))
    prec = float(precision_score(y_test, y_pred))
    rec = float(recall_score(y_test, y_pred))
    f1 = float(f1_score(y_test, y_pred))
    cm = confusion_matrix(y_test, y_pred).tolist()

    metrics = {
        "model_name": "Logistic Regression with TF-IDF",
        "dataset": "SMS Spam Collection (5,572 samples)",
        "features": "TF-IDF (unigrams + bigrams, stop_words='english', max_features=5000)",
        "train_samples": len(x_train),
        "test_samples": len(x_test),
        "accuracy": round(acc, 4),
        "precision": round(prec, 4),
        "recall": round(rec, 4),
        "f1_score": round(f1, 4),
        "confusion_matrix": {
            "true_negative": cm[0][0],  # Legitimate correctly identified as ham
            "false_positive": cm[0][1], # Legitimate wrongly flagged as spam
            "false_negative": cm[1][0], # Spam missed as ham
            "true_positive": cm[1][1],  # Spam correctly identified as spam
        },
    }

    print("\n" + "=" * 50)
    print("  MODEL EVALUATION RESULTS")
    print("=" * 50)
    print(f"Accuracy : {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall   : {rec * 100:.2f}%")
    print(f"F1 Score : {f1 * 100:.2f}%")
    print(f"Confusion Matrix (TN={cm[0][0]}, FP={cm[0][1]}, FN={cm[1][0]}, TP={cm[1][1]})")
    print("=" * 50)
    report = classification_report(y_test, y_pred, target_names=["ham", "spam"])
    print("\nClassification Report:\n", report)

    # 5. Save Artifacts
    model_file = output_path / "model.pkl"
    vectorizer_file = output_path / "vectorizer.pkl"
    metrics_file = output_path / "metrics.json"

    with open(model_file, "wb") as f:
        pickle.dump(model, f)
    with open(vectorizer_file, "wb") as f:
        pickle.dump(vectorizer, f)
    with open(metrics_file, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"[+] Saved model to {model_file}")
    print(f"[+] Saved vectorizer to {vectorizer_file}")
    print(f"[+] Saved metrics to {metrics_file}")
    return metrics


if __name__ == "__main__":
    train()
