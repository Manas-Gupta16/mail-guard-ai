import os
import sys
import pickle

# Handle path for exe
base_path = getattr(sys, '_MEIPASS', os.path.abspath("."))

# Load model and vectorizer
# This is the improved model with better accuracy and explainability
model_path = os.path.join(base_path, "model", "model.pkl")
vectorizer_path = os.path.join(base_path, "model", "vectorizer.pkl")

model = pickle.load(open(model_path, 'rb'))
vectorizer = pickle.load(open(vectorizer_path, 'rb'))

spam_keywords = [
    "free", "win", "urgent", "lottery", "prize",
    "click here", "verify", "account", "claim", "offer"
]

import re

msg = input("Enter email text: ").lower()

if any(re.search(rf"\b{re.escape(word)}\b", msg) for word in spam_keywords):
    print("Spam Email 🚫 (Rule-based)")
else:
    data = vectorizer.transform([msg])
    pred = model.predict(data)

    print("Spam Email 🚫" if pred[0] == 1 else "Not Spam ✅")

input("Press Enter to exit...")