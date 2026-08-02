# 📧 Mail Guard AI

A smart spam email detection system using Machine Learning and a professional UI.

---

## 📁 Project Structure

mail-guard-ai/

│
├── data/
│ └── spam.csv # Dataset
│
├── model/
│ ├── model.pkl # Trained ML model
│ └── vectorizer.pkl # TF-IDF vectorizer
│
├── src/
│ ├── preprocessing.py # Text cleaning functions
│ ├── train.py # Model training script
│ ├── predict.py # Prediction logic
│
├── artifacts/
│ └── confusion_matrix.png # Model evaluation output
│
├── spam_keywords.py # Keyword-based spam rules
├── main.py # Streamlit frontend
├── app.py # CLI / executable version
├── requirements.txt # Dependencies
└── README.md # Project documentation

---

## ⚙️ How to Run

1. Install dependencies:
   pip install -r requirements.txt

2. Train the model:
   python src/train.py

3. Run the frontend:
   python -m streamlit run main.py

4. Create executable (optional):
   python -m PyInstaller --onefile --collect-all sklearn --add-data "model;model" app.py

---

## 🚀 Features

- Machine Learning spam detection
- Hybrid system (ML + keyword rules)
- Explainable predictions
- Confusion matrix visualization
- Professional UI with dark/light mode

---

## 👨‍💻 Authors

- Manas Gupta
- Prathamesh Lahoti
