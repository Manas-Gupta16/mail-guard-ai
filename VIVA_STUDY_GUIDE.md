# 🎓 Mail Guard AI — Complete Viva & Practical Defense Guide

> **Prepared for Academic Project Presentation & Viva Voce**  
> **Course:** Machine Learning (Unit-I & Unit-II Syllabus Aligned)  
> **Project:** Enterprise Email Spam & Threat Classification Gateway  
> **Primary ML Model:** Logistic Regression with TF-IDF Vectorization  

---

## 📑 Table of Contents
1. [Core Machine Learning Concepts (Practical Theory)](#1-core-machine-learning-concepts-practical-theory)
2. [Step-by-Step Mathematical Formulation](#2-step-by-step-mathematical-formulation)
3. [How ML is Implemented in This Project](#3-how-ml-is-implemented-in-this-project)
4. [Dataset & Data Preprocessing Pipeline](#4-dataset--data-preprocessing-pipeline)
5. [Model Evaluation & Confusion Matrix Analysis](#5-model-evaluation--confusion-matrix-analysis)
6. [Feature Attribution & Explainability](#6-feature-attribution--explainability)
7. [System Architecture & Engineering Flow](#7-system-architecture--engineering-flow)
8. [Top 15 Viva Questions & Direct Answers](#8-top-15-viva-questions--direct-answers)
9. [Live Demo Checklist (What to show on screen)](#9-live-demo-checklist-what-to-show-on-screen)

---

## 1. Core Machine Learning Concepts (Practical Theory)

### 1.1 What is Machine Learning?
Machine Learning is a subset of Artificial Intelligence where algorithms learn mathematical patterns and decision rules from historical data ($X, y$), rather than relying on manually programmed `if-else` rules.

### 1.2 Supervised Learning vs. Unsupervised Learning
* **Supervised Learning (Used in this project):** The algorithm is trained on labeled data consisting of input-output pairs $(X, y)$. The model learns a mapping function $f: X \to y$.
  * In our project:
    * **Input ($X$):** Email text (e.g., *"You won 1000 cash free"*).
    * **Target Label ($y$):** `0` for legitimate (Ham) or `1` for malicious (Spam).
* **Unsupervised Learning:** The algorithm finds hidden structure or clustering in unlabeled data without explicit target labels (e.g., K-Means, PCA).

### 1.3 Regression vs. Classification
* **Regression:** Predicts a continuous numerical value (e.g., house price = ₹65.4 Lakhs, temperature = 31.5°C).
* **Classification:** Predicts a discrete categorical class label (e.g., Spam vs. Ham, Fraud vs. Legitimate).

### 1.4 Why is it called "Logistic Regression" if it performs Classification?
* **Linear Regression** predicts unbounded numbers: $z = \mathbf{w}^T \mathbf{x} + b \in (-\infty, +\infty)$.
* **Logistic Regression** calculates this same linear regression combination $z$, but feeds $z$ into a **Sigmoid (Logistic) Function** $\sigma(z) = \frac{1}{1 + e^{-z}}$.
* This squashes any real number into a valid probability between $0.0$ and $1.0$.
* A threshold (typically $0.5$) converts the continuous probability into discrete classes (`0` or `1`).
* **Summary for Viva:** It is a **classification algorithm** whose decision boundary is modeled by an internal linear regression score.

---

## 2. Step-by-Step Mathematical Formulation

### 2.1 The Hypothesis Function
The model calculates the probability that an email belongs to class 1 (Spam) given input features $\mathbf{x}$:

$$z = w_0 + w_1 x_1 + w_2 x_2 + \dots + w_n x_n = \mathbf{w}^T \mathbf{x} + b$$

$$\hat{y} = P(y = 1 \mid \mathbf{x}) = \sigma(z) = \frac{1}{1 + e^{-z}} = \frac{1}{1 + e^{-(\mathbf{w}^T \mathbf{x} + b)}}$$

* $\mathbf{x} = [x_1, x_2, \dots, x_n]^T$: Feature vector representing word frequencies in the email.
* $\mathbf{w} = [w_1, w_2, \dots, w_n]^T$: Learned model weights for each word in the vocabulary.
* $b$: Bias term (intercept).
* $\sigma(z)$: Standard logistic (sigmoid) activation function.

### 2.2 The Sigmoid Function Properties
$$\sigma(z) = \frac{1}{1 + e^{-z}}$$

* As $z \to +\infty \implies e^{-z} \to 0 \implies \sigma(z) \to \mathbf{1.0}$
* As $z \to -\infty \implies e^{-z} \to +\infty \implies \sigma(z) \to \mathbf{0.0}$
* At $z = 0 \implies e^{0} = 1 \implies \sigma(0) = \frac{1}{1 + 1} = \mathbf{0.5}$

### 2.3 The Decision Rule
$$\text{Class Output} = \begin{cases} 
1 \text{ (Spam)} & \text{if } \hat{y} \ge 0.5 \iff z \ge 0 \\
0 \text{ (Ham)}  & \text{if } \hat{y} < 0.5 \iff z < 0
\end{cases}$$

### 2.4 Cost Function: Binary Cross-Entropy (Log Loss)
Why not use Mean Squared Error (MSE)?
> MSE with a non-linear sigmoid activation produces a **non-convex** error landscape with multiple local minima where Gradient Descent gets trapped.  
> **Binary Cross-Entropy** guarantees a **convex** bowl-shaped cost surface with a single global minimum.

$$J(\mathbf{w}, b) = -\frac{1}{m} \sum_{i=1}^{m} \Big[ y^{(i)} \log(\hat{y}^{(i)}) + (1 - y^{(i)}) \log(1 - \hat{y}^{(i)}) \Big]$$

* When actual label $y = 1$: Loss is $-\log(\hat{y})$. If $\hat{y} = 1$, loss is $0$. If $\hat{y} \to 0$, loss approaches $+\infty$.
* When actual label $y = 0$: Loss is $-\log(1 - \hat{y})$. If $\hat{y} = 0$, loss is $0$. If $\hat{y} \to 1$, loss approaches $+\infty$.

### 2.5 Optimization: Gradient Descent
To minimize the cost function $J(\mathbf{w}, b)$, weights are iteratively updated along the negative gradient:

$$w_j := w_j - \alpha \frac{\partial J}{\partial w_j}$$
$$b := b - \alpha \frac{\partial J}{\partial b}$$

The partial derivative simplifies to:
$$\frac{\partial J}{\partial w_j} = \frac{1}{m} \sum_{i=1}^{m} \Big(\hat{y}^{(i)} - y^{(i)}\Big) \cdot x_j^{(i)}$$

* $\alpha$: Learning rate.
* $(\hat{y}^{(i)} - y^{(i)})$: Prediction error on the $i$-th training sample.
* $x_j^{(i)}$: Value of feature $j$ for sample $i$.

---

## 3. How ML is Implemented in This Project

### 3.1 Codebase File Map
All machine learning operations are modularized in the `packages/ml-service` package:

```
packages/ml-service/
├── data/raw/spam.csv                      # 5,572 labeled email/SMS dataset
├── models/logistic_regression/
│   ├── model.pkl                         # Serialized LogisticRegression weights
│   ├── vectorizer.pkl                    # Serialized TfidfVectorizer vocabulary
│   └── metrics.json                      # Accuracy, Precision, Recall, Confusion Matrix
├── training/
│   └── train_logistic_regression.py      # Standalone reproducible training script
└── src/
    ├── api/main.py                       # FastAPI /predict endpoint
    └── models/classifier.py              # Real-time inference & feature attribution engine
```

### 3.2 Step 1: Training Pipeline
In `train_logistic_regression.py`:
1. **Load Data (Line 40):** Reads `spam.csv` containing columns `v1` (label) and `v2` (text).
2. **Label Encoding (Line 54):** Maps string labels `{'ham': 0, 'spam': 1}`.
3. **Stratified Split (Lines 64–70):** 80% training ($4,457$ samples), 20% testing ($1,115$ samples) while preserving class proportions.
4. **Vectorization (Lines 75–82):** `TfidfVectorizer` learns a 5,000-word vocabulary with unigram and bigram features.
5. **Model Fit (Lines 87–93):** `LogisticRegression(class_weight='balanced', max_iter=1000)` trains weights via convex optimization.
6. **Artifact Export (Lines 118–130):** Serializes `model.pkl` and `vectorizer.pkl` via `pickle`.

### 3.3 Step 2: Real-Time Inference
In `classifier.py`:
```python
# Transform incoming email text using fitted vocabulary
X = self._vectorizer.transform([text])

# Predict class probabilities using Sigmoid function
probs = self._model.predict_proba(X)[0]
ham_prob = float(probs[0])
spam_prob = float(probs[1])

# Apply decision boundary threshold
is_spam = spam_prob >= 0.5
```

---

## 4. Dataset & Data Preprocessing Pipeline

### 4.1 Dataset Details
* **Source:** SMS / Email Spam Collection (UCI Machine Learning Repository).
* **Total Samples:** $5,572$ records.
  * **Ham (Legitimate):** $4,825$ samples ($86.60\%$).
  * **Spam (Malicious):** $747$ samples ($13.40\%$).
* **Class Imbalance Handling:** Addressed using `class_weight='balanced'` in scikit-learn, which automatically scales weights inversely proportional to class frequencies:
  $$W_{\text{class}} = \frac{N_{\text{total}}}{2 \times N_{\text{class}}}$$

### 4.2 Text Preprocessing & Vectorization (Bag of Words / TF-IDF)
Raw text cannot be processed directly by linear algebra equations. It must be vectorized:

#### 1. Tokenization & Normalization:
* Words are converted to lowercase.
* Punctuation is parsed.
* English stop words (*"is"*, *"the"*, *"at"*, *"which"*) are filtered to remove non-informative noise.

#### 2. N-Grams ($1, 2$):
* **Unigrams:** Single words (e.g., *"free"*, *"prize"*, *"account"*).
* **Bigrams:** Word pairs (e.g., *"claim free"*, *"cash prize"*, *"urgent alert"*).
* Bigrams preserve essential multi-word spam context.

#### 3. TF-IDF Calculation:
$$\text{TF}(t, d) = \frac{\text{Count of word } t \text{ in email } d}{\text{Total words in email } d}$$
$$\text{IDF}(t) = \log\left(\frac{N_{\text{emails}}}{\text{Count of emails containing word } t}\right) + 1$$
$$\text{TF-IDF}(t, d) = \text{TF}(t, d) \times \text{IDF}(t)$$

* Words appearing in almost every email receive an IDF near $0$.
* Distinctive spam words appearing specifically in threat messages receive high weights.

---

## 5. Model Evaluation & Confusion Matrix Analysis

### 5.1 Evaluation Results (Tested on 1,115 Unseen Samples)

| Metric | Score | Formula | Academic Explanation |
| :--- | :---: | :--- | :--- |
| **Accuracy** | **98.21%** | $\frac{TP + TN}{TP + TN + FP + FN}$ | Overall percentage of correct classifications across all test samples. |
| **Precision** | **94.48%** | $\frac{TP}{TP + FP}$ | Out of all emails flagged as Spam, 94.5% were genuinely malicious. |
| **Recall** | **91.95%** | $\frac{TP}{TP + FN}$ | Out of all actual Spam emails, the model caught 92.0%. |
| **F1-Score** | **93.20%** | $2 \times \frac{\text{Precision} \times \text{Recall}}{\text{Precision} + \text{Recall}}$ | Harmonic mean of Precision and Recall, proving balanced performance. |

### 5.2 The Confusion Matrix

```
                      PREDICTED HAM        PREDICTED SPAM
ACTUAL HAM (966)    │  TN = 958        │     FP = 8        │  (99.2% Specificity)
ACTUAL SPAM (149)   │  FN = 12         │     TP = 137      │  (91.95% Sensitivity)
```

* **True Negatives (TN = 958):** Legitimate emails correctly identified as Ham.
* **True Positives (TP = 137):** Malicious emails correctly identified as Spam.
* **False Positives (FP = 8):** Benign emails incorrectly marked as Spam (critical to minimize in email systems).
* **False Negatives (FN = 12):** Spam emails that slipped through into the inbox.

---

## 6. Feature Attribution & Explainability

Traditional machine learning algorithms act as "black boxes" that output a label without explaining why. Our system implements **Linear Feature Attribution**:

### 6.1 The Mathematical Attribution Formula
In Logistic Regression, the log-odds score $z$ is linear with respect to the input features:
$$z = \sum_{j=1}^{n} w_j x_j + b$$

For each word $j$ present in an email, its individual contribution to the spam score is:
$$\text{Contribution}(j) = w_j \times x_j$$

* **Positive Score ($w_j x_j > 0$):** Word pushes the prediction towards **Spam**.
  * Examples: `prize: +1.03`, `claim: +0.78`, `won: +0.64`, `urgent: +0.55`, `cash: +0.46`.
* **Negative Score ($w_j x_j < 0$):** Word pushes the prediction towards **Ham**.
  * Examples: `meeting: -0.21`, `hi: -0.17`, `tomorrow: -0.13`, `thanks: -0.03`.

### 6.2 Code Implementation in `classifier.py` (Lines 192–214):
```python
def explain(self, text: str) -> list[dict]:
    X = self._vectorizer.transform([text])
    feature_names = self._vectorizer.get_feature_names_out()
    coefs = self._model.coef_[0]

    token_scores = []
    row = X.tocoo()
    for col, val in zip(row.col, row.data):
        score = coefs[col] * val  # Weight * TF-IDF value
        token_scores.append({"token": feature_names[col], "score": round(score, 4)})

    token_scores.sort(key=lambda x: abs(x["score"]), reverse=True)
    return token_scores
```

---

## 7. System Architecture & Engineering Flow

### 7.1 Architecture Flow
1. **User Input:** User pastes email body in React web client (`http://localhost:5173`).
2. **API Gateway Request:** React issues HTTP POST request to Express gateway (`http://localhost:3000/api/v1/classify`).
3. **ML Microservice Forwarding:** Express validates schema with Zod, checks cache, and forwards payload to FastAPI ML service (`http://127.0.0.1:8000/predict`).
4. **Vectorization & Prediction:** Model transforms text into TF-IDF vector, calls Logistic Regression Sigmoid function, and calculates word contribution scores.
5. **Unified Response:** JSON payload returned with `label: "spam"|"ham"`, `confidence: float`, and `shap_tokens: list` in ~3ms.
6. **UI Rendering:** Frontend displays risk gauge, threat badge, and color-coded word highlights.

---

## 8. Top 15 Viva Questions & Direct Answers

#### Q1: "What is the problem statement of your project?"
> **Answer:** To design and deploy an explainable machine learning system capable of classifying incoming emails as spam or legitimate in real time, while pinpointing the exact deceptive tokens and linguistic urgency markers responsible for the classification.

#### Q2: "Why did you choose Logistic Regression over Linear Regression?"
> **Answer:** Linear Regression predicts continuous values from $-\infty$ to $+\infty$, which can exceed probability bounds ($<0$ or $>1$) and is heavily distorted by outliers. Logistic Regression applies the Sigmoid activation function $\sigma(z) = \frac{1}{1 + e^{-z}}$ to constrain outputs strictly between $0$ and $1$, representing a valid probability distribution.

#### Q3: "What is the Sigmoid function and what is its equation?"
> **Answer:** $\sigma(z) = \frac{1}{1 + e^{-z}}$. It is an S-shaped curve that maps any real number into the range $(0, 1)$. When $z=0$, $\sigma(z)=0.5$, which serves as our default decision threshold.

#### Q4: "What cost function is used in Logistic Regression?"
> **Answer:** Binary Cross-Entropy (Log Loss):
> $$J(\mathbf{w}, b) = -\frac{1}{m} \sum \Big[y \log(\hat{y}) + (1-y) \log(1-\hat{y})\Big]$$
> We do not use Mean Squared Error because combining MSE with Sigmoid yields a non-convex function with local minima. Log Loss guarantees convexity.

#### Q5: "How does the model learn optimal parameters?"
> **Answer:** By using Gradient Descent. The model calculates the partial derivative of the cost function with respect to each weight: $\frac{\partial J}{\partial w_j} = \frac{1}{m} \sum (\hat{y} - y) x_j$, and updates weights in the opposite direction of the gradient: $w_j := w_j - \alpha \frac{\partial J}{\partial w_j}$.

#### Q6: "What is TF-IDF and why is it used?"
> **Answer:** TF-IDF stands for Term Frequency–Inverse Document Frequency. Machine learning algorithms require numerical inputs; TF-IDF converts raw text into numerical feature vectors by weighting words based on how frequently they appear in a document relative to how rare they are across the entire dataset.

#### Q7: "What is the difference between Precision and Recall? Which is more critical here?"
> **Answer:** Precision is $\frac{TP}{TP + FP}$ (accuracy of positive predictions), while Recall is $\frac{TP}{TP + FN}$ (coverage of actual positives). In email filtering, **Precision is more critical** because a False Positive misclassifies an important legitimate email (such as an interview invitation) into the spam folder, causing potential data loss for the user.

#### Q8: "How did you address class imbalance in the training data?"
> **Answer:** The dataset contains 86.6% Ham and only 13.4% Spam. We addressed this using `class_weight='balanced'` in scikit-learn, which assigns higher loss penalties to misclassified instances of the minority spam class during gradient updates.

#### Q9: "What are n-grams in your feature extractor?"
> **Answer:** We configured `ngram_range=(1, 2)`. Unigrams capture single words like *"prize"*, while bigrams capture two-word sequences like *"claim free"* or *"cash prize"*, enabling the linear classifier to capture localized contextual phrases.

#### Q10: "How does your project achieve Explainable AI (XAI)?"
> **Answer:** Because Logistic Regression is a linear model, the prediction is a direct weighted sum: $z = \sum w_i x_i + b$. We multiply each word's TF-IDF score $x_i$ by its learned weight $w_i$. Positive products indicate words that increased the spam probability, which we highlight in the UI.

#### Q11: "What is Overfitting and how do you prevent it?"
> **Answer:** Overfitting occurs when a model memorizes noise in the training set and fails to generalize to unseen test data. We prevent overfitting by:
> 1. Limiting the vocabulary size to 5,000 top features (`max_features=5000`).
> 2. Applying L2 Regularization penalty ($C=1.0$).
> 3. Evaluating on an independent 20% stratified test set.

#### Q12: "What is the Confusion Matrix of your trained model?"
> **Answer:** On 1,115 test emails:
> * True Negatives: $958$ (Legitimate emails correctly passed).
> * True Positives: $137$ (Spam emails correctly caught).
> * False Positives: $8$ (Legitimate emails wrongly flagged).
> * False Negatives: $12$ (Spam emails that slipped through).

#### Q13: "What is the inference time of your model?"
> **Answer:** Sub-3 milliseconds on standard CPU hardware, because vectorizing a short text and taking a dot product with model weights requires minimal matrix operations.

#### Q14: "How does the Python ML model communicate with the web frontend?"
> **Answer:** We created a decoupled microservice architecture. The React frontend makes REST API calls to a Node.js Express API Gateway (port 3000), which forwards sanitized requests to the Python FastAPI ML microservice (port 8000) hosting the loaded model.

#### Q15: "Can this model be retrained with new data?"
> **Answer:** Yes. Running `python -m training.train_logistic_regression` ingests new CSV samples, executes the TF-IDF pipeline, optimizes weights, validates metrics, and re-exports serialized `.pkl` files in approximately 2 seconds.

---

## 9. Live Demo Checklist (What to show on screen)

### 1. Show the Training Process in Terminal:
```powershell
cd packages/ml-service
python -m training.train_logistic_regression
```
* **Point out:** The 5,572 sample count, the 98.21% accuracy, and the printed Confusion Matrix.

### 2. Show Live Classification in Browser (`http://localhost:5173`):
* **Demo Case 1 (Spam):**
  > `"URGENT! You have won a 1000 cash prize or a 2000 gift voucher. Call 09066362206 to claim your prize now! Valid for today only."`
  * Point out: **Threat Identified (Spam)**, Confidence > 97%, and the highlighted trigger tokens: `prize`, `claim`, `won`, `urgent`, `cash`.
* **Demo Case 2 (Legitimate):**
  > `"Hi Team, please find the project review agenda for tomorrow attached. Let me know if you have any questions. Thanks, Alice."`
  * Point out: **Authentic Communication (Ham)**, Confidence > 80%, and green tokens indicating legitimate context: `meeting`, `hi`, `thanks`.

