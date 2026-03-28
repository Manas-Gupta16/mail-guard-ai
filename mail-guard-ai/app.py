import pickle
import os
import sys

# Handle path (for exe)
base_path = getattr(sys, '_MEIPASS', os.path.abspath("."))

model_path = os.path.join(base_path, "model", "model.pkl")
vectorizer_path = os.path.join(base_path, "model", "vectorizer.pkl")

model = pickle.load(open(model_path, 'rb'))
vectorizer = pickle.load(open(vectorizer_path, 'rb'))

# 🔥 Add keyword-based rule
spam_keywords = [
    "free", "win", "winner", "urgent", "lottery", "prize",
    "click here", "verify", "account", "limited offer",
    "claim", "reward", "cash", "offer"
]

msg = input("Enter email text: ").lower()

# Rule-based check
if any(word in msg for word in spam_keywords):
    print("Spam Email 🚫 (Rule-based detection)")
else:
    data = vectorizer.transform([msg])
    pred = model.predict(data)

    if pred[0] == 1:
        print("Spam Email 🚫 (ML)")
    else:
        print("Not Spam ✅")

input("Press Enter to exit...")