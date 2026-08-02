import streamlit as st
import pickle
from spam_keywords import spam_keywords
from PIL import Image
from datetime import datetime
import re

# Load model
model = pickle.load(open('model/model.pkl', 'rb'))
vectorizer = pickle.load(open('model/vectorizer.pkl', 'rb'))

st.set_page_config(page_title="Mail Guard AI", layout="wide")

# ----------- CSS ADDITIONS ----------- (ADD BELOW YOUR CSS)
st.markdown("""
<style>
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap');

html, body, [class*="css"] {
    font-family: 'Inter', sans-serif;
}

/* Glassmorphism Cards */
.stat, .section {
    background: #1a1c24;
    border: 1px solid #2a2d3e;
    border-radius: 12px;
    padding: 20px;
    text-align: center;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    transition: transform 0.3s ease, border-color 0.3s ease;
}
.stat:hover {
    transform: translateY(-5px);
    border-color: #4a4d5e;
}
.stat h2 {
    font-size: 2.2rem;
    background: linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin: 0;
}
.stat p {
    color: #8f9bb3;
    font-size: 1.1rem;
    font-weight: 600;
}

/* Hero Section */
.hero {
    text-align: center;
    padding: 20px 0;
}
.hero h1 {
    font-size: 3rem;
    font-weight: 800;
    margin-bottom: 10px;
    background: linear-gradient(90deg, #e3ffe7 0%, #d9e7ff 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
}
.hero p {
    color: #8f9bb3;
    font-size: 1.2rem;
}

/* SPAM METER */
.meter-container {
    background: #1a1c24;
    padding: 20px;
    border-radius: 12px;
    border: 1px solid #2a2d3e;
    margin: 20px 0;
}
.meter {
    height: 20px;
    border-radius: 10px;
    background: #111217;
    overflow: hidden;
    position: relative;
    box-shadow: inset 0 2px 4px rgba(0,0,0,0.5);
}
.meter-fill {
    height: 100%;
    border-radius: 10px;
    transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}
.spam { background: linear-gradient(90deg, #ff416c 0%, #ff4b2b 100%); }
.ham { background: linear-gradient(90deg, #00b09b 0%, #96c93d 100%); }

/* HIGHLIGHT */
.highlight {
    background: rgba(255, 75, 43, 0.2);
    color: #ff4b2b;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 600;
    border: 1px solid rgba(255, 75, 43, 0.4);
}

.result-spam { color: #ff4b2b; font-size: 1.5rem; font-weight: bold; margin: 0; }
.result-ham { color: #96c93d; font-size: 1.5rem; font-weight: bold; margin: 0; }

</style>
""", unsafe_allow_html=True)

# ----------- HERO ----------- (same as yours)
st.markdown("""
<div class="hero fade-in">
    <h1>📧 Mail Guard AI</h1>
    <p>Advanced spam detection using Machine Learning + intelligent keyword analysis.</p>
</div>
""", unsafe_allow_html=True)

# ----------- STATS ----------- (same)
st.markdown("<div class='section fade-in'>", unsafe_allow_html=True)
col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("<div class='stat'><h2>95%+</h2><p>Accuracy</p></div>", unsafe_allow_html=True)
with col2:
    st.markdown("<div class='stat'><h2>1000+</h2><p>Emails Analyzed</p></div>", unsafe_allow_html=True)
with col3:
    st.markdown("<div class='stat'><h2>Real-Time</h2><p>Detection Speed</p></div>", unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)

# ----------- FEATURES ----------- (same as yours)

# (keep your existing feature cards unchanged)

# ----------- INPUT ----------- (same)
st.markdown("## 📩 Analyze Email")

uploaded_file = st.file_uploader("Upload Email (.txt)", type=["txt"])

if uploaded_file is not None:
    msg = uploaded_file.read().decode("utf-8")
    st.text_area("Preview", msg, height=120)
else:
    msg = st.text_area("Enter Email Text", height=120)

# ----------- HELPER: HIGHLIGHT FUNCTION ----------- NEW
def highlight_text(text, keywords):
    for word in keywords:
        text = re.sub(rf"\b({re.escape(word)})\b", r"<span class='highlight'>\1</span>", text, flags=re.IGNORECASE)
    return text

# ----------- PREDICTION ----------- (ENHANCED)
if st.button("Analyze Email"):

    if msg.strip() == "":
        st.warning("Enter a message")

    else:
        msg_lower = msg.lower()

        data = vectorizer.transform([msg])
        prob = model.predict_proba(data)[0][1]

        matched = [w for w in spam_keywords if re.search(rf"\b{re.escape(w)}\b", msg_lower)]
        is_spam = bool(matched) or prob > 0.65

        st.markdown("<h2 class='fade-in'>📊 Result</h2>", unsafe_allow_html=True)

        if is_spam:
            st.markdown("<p class='result-spam'>🚫 Spam Email</p>", unsafe_allow_html=True)
        else:
            st.markdown("<p class='result-ham'>✅ Not Spam</p>", unsafe_allow_html=True)

        # ----------- SPAM METER ----------- NEW
        st.markdown("### 🚦 Spam Score")
        color_class = "spam" if is_spam else "ham"

        st.markdown(f"""
        <div class="meter-container">
            <div class="meter">
                <div class="meter-fill {color_class}" style="width:{int(prob*100)}%"></div>
            </div>
            <p style="text-align:center; margin-top:12px; font-weight:600; color:#8f9bb3;">{int(prob*100)}% Spam Probability</p>
        </div>
        """, unsafe_allow_html=True)

        # ----------- BAR CHART ----------- NEW
        st.markdown("### 📊 Probability Breakdown")
        st.bar_chart({
            "Spam": [prob],
            "Not Spam": [1 - prob]
        })

        # ----------- EXPLANATION ----------- IMPROVED
        st.markdown("### 🧠 Explanation")

        if matched:
            st.write("🚨 Detected Spam Keywords:", ", ".join(matched[:5]))

        if prob > 0.8:
            st.write("High confidence spam detected.")
        elif prob > 0.6:
            st.write("Moderate spam likelihood.")
        else:
            st.write("Looks like a normal message.")

        st.write(f"Confidence Score: {prob:.2f}")
        st.progress(int(prob * 100))

        # ----------- HIGHLIGHT TEXT ----------- NEW
        if matched:
            st.markdown("### 🔍 Highlighted Message")
            highlighted = highlight_text(msg, matched[:5])
            st.markdown(highlighted, unsafe_allow_html=True)

        # ----------- REPORT ----------- (same)
        report = f"""
Mail Guard AI Report

Message:
{msg}

Prediction:
{"Spam" if is_spam else "Not Spam"}

Confidence:
{prob:.2f}

Keywords:
{', '.join(matched[:5]) if matched else 'None'}

Time:
{datetime.now()}
"""

        st.download_button("📄 Download Report", report, "report.txt")

# ----------- CONFUSION MATRIX ----------- (same)
st.markdown("## 📉 Model Performance")

try:
    img = Image.open("artifacts/confusion_matrix.png")
    st.image(img, use_column_width=True)
except:
    st.info("Run training first")