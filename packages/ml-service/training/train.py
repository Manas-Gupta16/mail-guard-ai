"""
Mail Guard AI — DistilBERT Fine-tuning Script

Fine-tunes distilbert-base-uncased on the processed spam dataset
and exports the model in both PyTorch and ONNX formats.

This script is designed to run in Google Colab (free GPU) or
locally with an NVIDIA GPU.

Usage:
  python -m training.train --data ./data/processed/dataset.parquet
  python -m training.train --data ./data/processed/dataset.parquet --epochs 5
"""

import argparse
from pathlib import Path

import numpy as np
import pandas as pd
from datasets import Dataset
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    Trainer,
    TrainingArguments,
)


def compute_metrics(eval_pred):
    """Compute accuracy, precision, recall, F1 for evaluation."""
    from sklearn.metrics import accuracy_score, f1_score, precision_score, recall_score

    logits, labels = eval_pred
    predictions = np.argmax(logits, axis=-1)

    return {
        "accuracy": accuracy_score(labels, predictions),
        "f1": f1_score(labels, predictions),
        "precision": precision_score(labels, predictions),
        "recall": recall_score(labels, predictions),
    }


def main(
    data_path: str = "./data/processed/dataset.parquet",
    model_name: str = "distilbert-base-uncased",
    output_dir: str = "./models/distilbert-spam-v2",
    epochs: int = 3,
    batch_size: int = 16,
    learning_rate: float = 2e-5,
    max_length: int = 512,
):
    """
    Fine-tune DistilBERT for spam classification.

    Args:
        data_path: Path to processed Parquet dataset
        model_name: HuggingFace model to fine-tune
        output_dir: Where to save the fine-tuned model
        epochs: Number of training epochs
        batch_size: Training batch size (reduce if OOM)
        learning_rate: Learning rate for AdamW
        max_length: Max token sequence length
    """
    print("🚀 Mail Guard AI — Model Training\n")
    print(f"  Base model: {model_name}")
    print(f"  Epochs: {epochs}")
    print(f"  Batch size: {batch_size}")
    print(f"  Learning rate: {learning_rate}\n")

    # ─── Load Data ───────────────────────────────────────────────────
    print("📦 Loading dataset...")
    df = pd.read_parquet(data_path)

    train_df = df[df["split"] == "train"][["text", "label"]].reset_index(drop=True)
    val_df = df[df["split"] == "val"][["text", "label"]].reset_index(drop=True)
    test_df = df[df["split"] == "test"][["text", "label"]].reset_index(drop=True)

    print(f"  Train: {len(train_df)} | Val: {len(val_df)} | Test: {len(test_df)}")

    train_dataset = Dataset.from_pandas(train_df)
    val_dataset = Dataset.from_pandas(val_df)
    test_dataset = Dataset.from_pandas(test_df)

    # ─── Tokenizer ───────────────────────────────────────────────────
    print(f"\n🔤 Loading tokenizer: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)

    def tokenize(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            padding="max_length",
            max_length=max_length,
        )

    train_dataset = train_dataset.map(tokenize, batched=True, batch_size=64)
    val_dataset = val_dataset.map(tokenize, batched=True, batch_size=64)
    test_dataset = test_dataset.map(tokenize, batched=True, batch_size=64)

    # Set format for PyTorch
    train_dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])
    val_dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])
    test_dataset.set_format("torch", columns=["input_ids", "attention_mask", "label"])

    # ─── Model ───────────────────────────────────────────────────────
    print(f"\n🧠 Loading model: {model_name}")
    model = AutoModelForSequenceClassification.from_pretrained(
        model_name,
        num_labels=2,
        id2label={0: "ham", 1: "spam"},
        label2id={"ham": 0, "spam": 1},
    )

    # ─── Training ────────────────────────────────────────────────────
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        per_device_eval_batch_size=batch_size * 2,
        learning_rate=learning_rate,
        weight_decay=0.01,
        eval_strategy="epoch",
        save_strategy="epoch",
        load_best_model_at_end=True,
        metric_for_best_model="f1",
        logging_steps=50,
        report_to="none",  # Disable W&B etc.
        fp16=True,  # Mixed precision for speed (GPU only)
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset,
        eval_dataset=val_dataset,
        compute_metrics=compute_metrics,
    )

    print("\n🏋️ Starting training...")
    trainer.train()

    # ─── Evaluation ──────────────────────────────────────────────────
    print("\n📊 Evaluating on test set...")
    results = trainer.evaluate(test_dataset)
    print(f"  Accuracy:  {results['eval_accuracy']:.4f}")
    print(f"  F1 Score:  {results['eval_f1']:.4f}")
    print(f"  Precision: {results['eval_precision']:.4f}")
    print(f"  Recall:    {results['eval_recall']:.4f}")

    # ─── Save ────────────────────────────────────────────────────────
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    print(f"\n💾 Saving model to {output_dir}")
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)

    # ─── ONNX Export ─────────────────────────────────────────────────
    print("\n📦 Exporting to ONNX format...")
    try:
        from optimum.onnxruntime import ORTModelForSequenceClassification

        ort_model = ORTModelForSequenceClassification.from_pretrained(
            output_dir, export=True
        )
        ort_model.save_pretrained(output_dir)
        print(f"  ✅ ONNX model saved to {output_dir}/model.onnx")
    except ImportError:
        print("  ⚠️  optimum not installed — skipping ONNX export")
        print("  Run: pip install optimum[onnxruntime]")

    print("\n✅ Training complete!")
    print(f"   Model saved at: {output_dir}")

    return results


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mail Guard AI — Train DistilBERT")
    parser.add_argument("--data", type=str, default="./data/processed/dataset.parquet")
    parser.add_argument("--model", type=str, default="distilbert-base-uncased")
    parser.add_argument("--output", type=str, default="./models/distilbert-spam-v2")
    parser.add_argument("--epochs", type=int, default=3)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=2e-5)
    args = parser.parse_args()

    main(
        data_path=args.data,
        model_name=args.model,
        output_dir=args.output,
        epochs=args.epochs,
        batch_size=args.batch_size,
        learning_rate=args.lr,
    )
