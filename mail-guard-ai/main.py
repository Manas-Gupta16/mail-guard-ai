import streamlit as st
import pickle
from spam_keywords import spam_keywords
from PIL import Image
from datetime import datetime

# Load model
model = pickle.load(open('model/model.pkl', 'rb'))
vectorizer = pickle.load(open('model/vectorizer.pkl', 'rb'))

st.set_page_config(page_title="Mail Guard AI", layout="wide")

# ----------- CSS (FINAL PREMIUM UI) -----------
st.markdown("""
<style>

/* GLOBAL */
html, body, [class*="css"] {
    color: #2e2e2e !important;
    font-family: 'Segoe UI', sans-serif;
}

/* HERO (ANIMATED GRADIENT) */
.hero {
    background: linear-gradient(270deg, #cbb79c, #e6d3b3, #cbb79c);
    background-size: 400% 400%;
    animation: gradientMove 8s ease infinite;
    padding: 60px;
    border-radius: 12px;
}

@keyframes gradientMove {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
}

/* SECTION */
.section {
    margin-top: 60px;
}

/* CARDS */
.card {
    background: #f3ede4;
    padding: 25px;
    border-radius: 12px;
    min-height: 230px;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0px 4px 15px rgba(0,0,0,0.08);
    transition: all 0.3s ease;
}

.card:hover {
    transform: translateY(-8px) scale(1.02);
}

/* TEXT FIX */
.card h3 { color: #2e2e2e !important; }
.card p { color: #444 !important; }
.card li { color: #444 !important; }

/* STATS */
.stat {
    text-align: center;
}
.stat h2 {
    font-size: 32px;
    color: #2e2e2e;
}

/* BUTTON */
.stButton>button {
    background: linear-gradient(135deg, #cbb79c, #a8906f);
    color: white;
    border-radius: 8px;
    padding: 10px 20px;
    font-weight: bold;
    border: none;
    transition: all 0.3s ease;
}

.stButton>button:hover {
    transform: scale(1.05);
    box-shadow: 0px 5px 15px rgba(0,0,0,0.2);
}

.stButton>button:active {
    transform: scale(0.95);
}

/* RESULT */
.result-spam {
    color: red;
    font-size: 22px;
    font-weight: bold;
}
.result-ham {
    color: green;
    font-size: 22px;
    font-weight: bold;
}

/* FADE-IN */
.fade-in {
    animation: fadeIn 1s ease-in;
}

@keyframes fadeIn {
    from {opacity: 0; transform: translateY(10px);}
    to {opacity: 1; transform: translateY(0);}
}

</style>
""", unsafe_allow_html=True)

# ----------- HERO -----------
st.markdown("""
<div class="hero fade-in">
    <h1>📧 Mail Guard AI</h1>
    <p>Advanced spam detection using Machine Learning + intelligent keyword analysis.</p>
</div>
""", unsafe_allow_html=True)

# ----------- STATS -----------
st.markdown("<div class='section fade-in'>", unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("<div class='stat'><h2>95%+</h2><p>Accuracy</p></div>", unsafe_allow_html=True)

with col2:
    st.markdown("<div class='stat'><h2>1000+</h2><p>Emails Analyzed</p></div>", unsafe_allow_html=True)

with col3:
    st.markdown("<div class='stat'><h2>Real-Time</h2><p>Detection Speed</p></div>", unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)

# ----------- FEATURES -----------
st.markdown("<div class='section fade-in'>", unsafe_allow_html=True)

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("""
    <div class='card'>
        <div>
            <h3>⚡ Fast Detection</h3>
            <p>Instant spam classification using optimized ML pipeline.</p>
        </div>
        <ul>
            <li>Real-time processing</li>
            <li>Low latency</li>
            <li>Efficient model</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

with col2:
    st.markdown("""
    <div class='card'>
        <div>
            <h3>🧠 AI Intelligence</h3>
            <p>Hybrid model combining ML + keyword detection.</p>
        </div>
        <ul>
            <li>TF-IDF Vectorization</li>
            <li>Logistic Regression</li>
            <li>Keyword rules</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

with col3:
    st.markdown("""
    <div class='card'>
        <div>
            <h3>📊 Insights</h3>
            <p>Explainable AI with meaningful outputs.</p>
        </div>
        <ul>
            <li>Confidence score</li>
            <li>Keyword highlight</li>
            <li>Download reports</li>
        </ul>
    </div>
    """, unsafe_allow_html=True)

st.markdown("</div>", unsafe_allow_html=True)

# ----------- INPUT -----------
st.markdown("## 📩 Analyze Email")

uploaded_file = st.file_uploader("Upload Email (.txt)", type=["txt"])

if uploaded_file is not None:
    msg = uploaded_file.read().decode("utf-8")
    st.text_area("Preview", msg, height=120)
else:
    msg = st.text_area("Enter Email Text", height=120)

# ----------- PREDICTION -----------
if st.button("Analyze Email"):

    if msg.strip() == "":
        st.warning("Enter a message")

    else:
        msg_lower = msg.lower()

        data = vectorizer.transform([msg])
        prob = model.predict_proba(data)[0][1]

        matched = [w for w in spam_keywords if w in msg_lower]

        is_spam = matched or prob > 0.65

        st.markdown("<h2 class='fade-in'>📊 Result</h2>", unsafe_allow_html=True)

        if is_spam:
            st.markdown("<p class='result-spam'>🚫 Spam Email</p>", unsafe_allow_html=True)
        else:
            st.markdown("<p class='result-ham'>✅ Not Spam</p>", unsafe_allow_html=True)

        # Explanation
        st.markdown("### 🧠 Explanation")

        if matched:
            st.write("Detected Keywords:", ", ".join(matched[:5]))

        st.write(f"Confidence Score: {prob:.2f}")

        st.progress(int(prob * 100))

        # Report
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

# ----------- CONFUSION MATRIX -----------
st.markdown("## 📉 Model Performance")

try:
    img = Image.open("artifacts/confusion_matrix.png")
    st.image(img, use_container_width=True)
except:
    st.info("Run training first")
