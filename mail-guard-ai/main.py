import streamlit as st
import pickle

model = pickle.load(open('model/model.pkl', 'rb'))
vectorizer = pickle.load(open('model/vectorizer.pkl', 'rb'))

st.title("📧 Mail Guard AI - Spam Detector")

msg = st.text_area("Enter Email Text")

if st.button("Detect"):
    data = vectorizer.transform([msg])
    pred = model.predict(data)

    if pred[0] == 1:
        st.error("Spam Email 🚫")
    else:
        st.success("Not Spam ✅")