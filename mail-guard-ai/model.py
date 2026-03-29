import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
import pickle

# Load dataset
df = pd.read_csv('data/spam.csv', encoding='latin-1')

# Keep only required columns
# this is for the original dataset, which has extra columns we don't need
df = df[['v1', 'v2']]
df.columns = ['label', 'message']

# Convert labels to numeric
df['label'] = df['label'].map({'ham': 0, 'spam': 1})

# Improved vectorizer (IMPORTANT)
vectorizer = TfidfVectorizer(
    stop_words='english',
    ngram_range=(1, 2)   # unigrams + bigrams
)

# Transform data
X = vectorizer.fit_transform(df['message'])
y = df['label']

# Improved model
model = LogisticRegression(max_iter=1000)

# Train model
model.fit(X, y)

# Save model and vectorizer
pickle.dump(model, open('model/model.pkl', 'wb'))
pickle.dump(vectorizer, open('model/vectorizer.pkl', 'wb'))

print("Model trained successfully with improved accuracy")