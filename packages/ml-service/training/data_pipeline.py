"""
Mail Guard AI — Data Pipeline

Downloads, merges, and preprocesses multiple spam/ham datasets
into a single high-quality training dataset.

Datasets:
  1. SMS Spam Collection (UCI/Kaggle) — 5,574 SMS messages
  2. Enron Spam Corpus — 33,716 real corporate emails
  3. SpamAssassin Public Corpus — 6,047 emails

Output: A versioned Parquet file with columns:
  - text (str): cleaned email/message text
  - label (int): 0 = ham, 1 = spam
  - source (str): dataset origin
  - split (str): train/val/test

Usage:
  python -m training.data_pipeline --output ./data/processed
"""

import argparse
import hashlib
from pathlib import Path

import pandas as pd
from sklearn.model_selection import train_test_split


def load_sms_spam(path: str | None = None) -> pd.DataFrame:
    """
    Load the SMS Spam Collection dataset.

    If path is provided, loads from local CSV. Otherwise expects
    the file at data/raw/spam.csv (the original dataset from the
    legacy project).
    """
    if path is None:
        path = "data/raw/spam.csv"

    df = pd.read_csv(path, encoding="latin-1")

    # Handle various column formats
    if "v1" in df.columns:
        df = df[["v1", "v2"]].copy()
        df.columns = ["label_str", "text"]
    elif "label" in df.columns and "message" in df.columns:
        df = df[["label", "message"]].copy()
        df.columns = ["label_str", "text"]
    else:
        raise ValueError(f"Unexpected columns: {df.columns.tolist()}")

    df["label"] = df["label_str"].map({"ham": 0, "spam": 1, 0: 0, 1: 1})
    df["source"] = "sms_spam_collection"
    df = df[["text", "label", "source"]].dropna()

    print(f"  📱 SMS Spam Collection: {len(df)} messages "
          f"({df['label'].sum()} spam, {(df['label'] == 0).sum()} ham)")
    return df


def load_enron_spam(path: str) -> pd.DataFrame:
    """
    Load Enron Spam corpus from a directory of text files.

    Expected structure:
      path/
        spam/
          *.txt
        ham/
          *.txt
    """
    records = []

    for label_name, label_int in [("spam", 1), ("ham", 0)]:
        label_dir = Path(path) / label_name
        if not label_dir.exists():
            print(f"  ⚠️  Enron {label_name}/ directory not found at {label_dir}")
            continue

        for txt_file in label_dir.glob("*.txt"):
            try:
                text = txt_file.read_text(encoding="utf-8", errors="ignore").strip()
                if len(text) > 10:  # Skip near-empty files
                    records.append({"text": text, "label": label_int})
            except Exception:
                continue

    df = pd.DataFrame(records)
    df["source"] = "enron"

    print(f"  📧 Enron Spam Corpus: {len(df)} emails "
          f"({df['label'].sum()} spam, {(df['label'] == 0).sum()} ham)")
    return df


def clean_text(text: str) -> str:
    """
    Clean email text while preserving meaningful content.

    More sophisticated than simple regex — preserves URLs and
    structure that are important signals for spam detection.
    """
    if not isinstance(text, str):
        return ""

    # Remove email headers (From:, To:, Subject: etc.) if present
    lines = text.split("\n")
    body_start = 0
    for i, line in enumerate(lines):
        if line.strip() == "" and i > 0:
            body_start = i + 1
            break
        if not any(line.startswith(h) for h in
                   ["From:", "To:", "Subject:", "Date:", "Cc:", "Bcc:",
                    "Content-Type:", "MIME-Version:", "X-", "Return-Path:"]):
            break

    text = "\n".join(lines[body_start:]) if body_start > 0 else text

    # Normalize whitespace (but preserve some structure)
    text = " ".join(text.split())

    # Truncate very long emails
    if len(text) > 5000:
        text = text[:5000]

    return text.strip()


def deduplicate(df: pd.DataFrame) -> pd.DataFrame:
    """Remove duplicate texts using SHA-256 hashing."""
    df["hash"] = df["text"].apply(lambda x: hashlib.sha256(x.encode()).hexdigest())
    before = len(df)
    df = df.drop_duplicates(subset=["hash"]).drop(columns=["hash"])
    removed = before - len(df)
    if removed > 0:
        print(f"  🔄 Removed {removed} duplicates")
    return df


def create_splits(
    df: pd.DataFrame,
    test_size: float = 0.15,
    val_size: float = 0.10,
    random_state: int = 42,
) -> pd.DataFrame:
    """
    Create stratified train/val/test splits.

    Default: 75% train, 10% val, 15% test
    """
    # First split: train+val vs test
    train_val, test = train_test_split(
        df, test_size=test_size, stratify=df["label"], random_state=random_state
    )

    # Second split: train vs val
    relative_val_size = val_size / (1 - test_size)
    train, val = train_test_split(
        train_val, test_size=relative_val_size, stratify=train_val["label"],
        random_state=random_state,
    )

    train = train.assign(split="train")
    val = val.assign(split="val")
    test = test.assign(split="test")

    result = pd.concat([train, val, test], ignore_index=True)

    print(f"\n  📊 Split distribution:")
    print(f"     Train: {len(train)} ({len(train)/len(result)*100:.1f}%)")
    print(f"     Val:   {len(val)} ({len(val)/len(result)*100:.1f}%)")
    print(f"     Test:  {len(test)} ({len(test)/len(result)*100:.1f}%)")

    return result


def run_pipeline(
    sms_path: str | None = None,
    enron_path: str | None = None,
    output_dir: str = "./data/processed",
):
    """
    Run the full data pipeline.

    Args:
        sms_path: Path to SMS spam CSV (optional, uses default)
        enron_path: Path to Enron spam directory (optional, skips if not found)
        output_dir: Where to save the processed dataset
    """
    print("🚀 Mail Guard AI — Data Pipeline\n")

    datasets = []

    # 1. SMS Spam Collection (always available — from legacy project)
    try:
        sms_df = load_sms_spam(sms_path)
        datasets.append(sms_df)
    except Exception as e:
        print(f"  ❌ SMS dataset failed: {e}")

    # 2. Enron Spam (if available)
    if enron_path and Path(enron_path).exists():
        try:
            enron_df = load_enron_spam(enron_path)
            datasets.append(enron_df)
        except Exception as e:
            print(f"  ❌ Enron dataset failed: {e}")

    if not datasets:
        raise RuntimeError("No datasets loaded! Check file paths.")

    # Merge
    print(f"\n📦 Merging {len(datasets)} datasets...")
    merged = pd.concat(datasets, ignore_index=True)
    print(f"  Total: {len(merged)} samples")

    # Clean
    print("\n🧹 Cleaning text...")
    merged["text"] = merged["text"].apply(clean_text)
    merged = merged[merged["text"].str.len() > 10]  # Remove too-short
    print(f"  After cleaning: {len(merged)} samples")

    # Deduplicate
    print("\n🔍 Deduplicating...")
    merged = deduplicate(merged)

    # Create splits
    print("\n✂️  Creating train/val/test splits...")
    final = create_splits(merged)

    # Save
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    parquet_path = output_path / "dataset.parquet"
    final.to_parquet(parquet_path, index=False)
    print(f"\n✅ Saved to {parquet_path}")
    print(f"   Total samples: {len(final)}")
    print(f"   Spam ratio: {final['label'].mean()*100:.1f}%")

    # Also save a small CSV preview
    csv_path = output_path / "dataset_preview.csv"
    final.head(100).to_csv(csv_path, index=False)
    print(f"   Preview: {csv_path}")

    return final


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Mail Guard AI — Data Pipeline")
    parser.add_argument("--sms", type=str, default=None, help="Path to SMS spam CSV")
    parser.add_argument("--enron", type=str, default=None, help="Path to Enron spam directory")
    parser.add_argument("--output", type=str, default="./data/processed", help="Output directory")
    args = parser.parse_args()

    run_pipeline(sms_path=args.sms, enron_path=args.enron, output_dir=args.output)
