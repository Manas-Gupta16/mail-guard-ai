import streamlit as st
import pickle
from spam_keywords import spam_keywords
from PIL import Image
from datetime import datetime

# Load model
# This is the improved model with better accuracy and explainability
model = pickle.load(open('model/model.pkl', 'rb'))
vectorizer = pickle.load(open('model/vectorizer.pkl', 'rb'))

st.set_page_config(page_title="Mail Guard AI", page_icon="📧", layout="centered")

# ----------- THEME TOGGLE -----------
dark_mode = st.toggle("🌙 Dark Mode", value=True)

if dark_mode:
    bg = "#0e1117"
    text = "white"
    card = "#1c1f26"
else:
    bg = "#f5f7fa"
    text = "#000000"
    card = "#ffffff"

st.markdown(f"""
    <style>
    .stApp {{
        background-color: {bg};
        color: {text};
    }}
    .container {{
        max-width: 700px;
        margin: auto;
    }}
    .card {{
        background-color: {card};
        padding: 25px;
        border-radius: 12px;
        box-shadow: 0px 4px 12px rgba(0,0,0,0.15);
    }}
    .center {{
        text-align: center;
    }}
    </style>
""", unsafe_allow_html=True)

# ----------- HEADER -----------
st.markdown("<div class='container'>", unsafe_allow_html=True)

st.markdown("<h1 class='center'>📧 Mail Guard AI</h1>", unsafe_allow_html=True)
st.markdown("<p class='center'>Smart Spam Detection System</p>", unsafe_allow_html=True)

st.markdown("---")

# ----------- CARD UI -----------
st.markdown("<div class='card'>", unsafe_allow_html=True)

st.subheader("Let's Predict")

msg = st.text_area("Enter your message:", height=120)

if st.button("🔍 Analyze Email"):

    if msg.strip() == "":
        st.warning("⚠️ Please enter a message")

    else:
        msg_lower = msg.lower()

        # ML Prediction
        data = vectorizer.transform([msg])
        prob = model.predict_proba(data)[0][1]
        pred = model.predict(data)[0]

        # Keyword detection
        matched = [w for w in spam_keywords if w in msg_lower]

        st.markdown("### 📊 Result")

        # Hybrid logic
        is_spam = False

        if matched:
            st.error("🚫 Spam Email (Keyword Detection)")
            is_spam = True
        elif prob > 0.65:
            st.error("🚫 Spam Email (ML Model)")
            is_spam = True
        else:
            st.success("✅ Not Spam")

        # ----------- EXPLAINABILITY -----------
        st.markdown("### 🧠 Why this prediction?")

        if matched:
            st.write("🔎 Detected Keywords:", ", ".join(matched[:5]))

        st.write(f"📈 Model Confidence: {prob:.2f}")

        if prob > 0.65:
            st.write("👉 High likelihood of spam based on learned patterns")
        else:
            st.write("👉 Message resembles normal (ham) emails")

        # ----------- CONFIDENCE BAR -----------
        st.markdown("### 📊 Confidence Score")
        st.progress(int(prob * 100))

        # ----------- DOWNLOAD REPORT -----------
        report = f"""
Mail Guard AI - Prediction Report

Input Message:
{msg}

Prediction:
{"Spam" if is_spam else "Not Spam"}

Confidence:
{prob:.2f}

Detected Keywords:
{', '.join(matched[:5]) if matched else 'None'}

Generated at:
{datetime.now()}
"""

        st.download_button(
            label="📄 Download Report",
            data=report,
            file_name="spam_report.txt",
            mime="text/plain"
        )

st.markdown("</div>", unsafe_allow_html=True)

# ----------- CONFUSION MATRIX -----------
st.markdown("---")
st.markdown("## 📉 Model Performance")

try:
    img = Image.open("artifacts/confusion_matrix.png")
    st.image(img, caption="Confusion Matrix", use_container_width=True)
except:
    st.info("Run training to generate confusion matrix")

# ----------- FOOTER -----------
st.markdown("---")
st.markdown("<p class='center'>🚀 Built by Mail Guard AI Team</p>", unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)