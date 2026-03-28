# 🚀 Mail Guard AI

### 📧 Spam Email Detection System using Machine Learning

---

## 🔍 Overview

**Mail Guard AI** is a machine learning-based project that detects whether an email message is **Spam 🚫** or **Not Spam ✅**.
It uses natural language processing techniques to analyze text and make accurate predictions.

---

## ✨ Features

- 📌 Detects spam emails instantly
- ⚡ Fast and lightweight model
- 🧠 Uses Machine Learning (Naive Bayes)
- 💻 Simple and interactive UI (Streamlit)
- 📦 Executable file support (.exe)

---

## 🛠️ Tech Stack

- 🐍 Python
- 📊 Scikit-learn
- 🧮 Pandas & NumPy
- 🌐 Streamlit
- ⚙️ PyInstaller

---

## 📂 Project Structure

```
mail-guard-ai/
│
├── data/
│   └── spam.csv
│
├── model/
│   ├── model.pkl
│   └── vectorizer.pkl
│
├── model.py        # Train model
├── main.py         # Streamlit UI
├── app.py          # CLI (for .exe)
├── requirements.txt
├── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository

```
git clone https://github.com/YOUR_USERNAME/mail-guard-ai.git
cd mail-guard-ai
```

### 2️⃣ Install Dependencies

```
pip install -r requirements.txt
```

---

## ▶️ How to Run

### 🔹 Train Model

```
python model.py
```

### 🔹 Run Web App

```
streamlit run main.py
```

---

## 💻 Run Executable (.exe)

After building:

```
dist/app.exe
```

---

## 🧠 How It Works

- Text data is converted using **TF-IDF Vectorization**
- Model is trained using **Naive Bayes Algorithm**
- Predicts whether input text is spam or not

---

## 📊 Output Example

| Input Message         | Result      |
| --------------------- | ----------- |
| "You won a lottery!"  | 🚫 Spam     |
| "Let's meet tomorrow" | ✅ Not Spam |

---

## 📸 Screenshots

_(Add your screenshots here before submission)_

---

## 🎯 Future Scope

- Add Deep Learning models
- Improve accuracy with larger datasets
- Deploy as a web application

---

## 👨‍💻 Contributors

- Your Name
- Your Friend's Name

---

## 📜 License

This project is for educational purposes only.

---

## ⭐ If you like this project

Give it a star on GitHub ⭐

---
