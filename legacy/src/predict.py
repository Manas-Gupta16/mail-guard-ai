import pickle
from preprocessing import clean_text

model = pickle.load(open('model/model.pkl', 'rb'))
vectorizer = pickle.load(open('model/vectorizer.pkl', 'rb'))

# This function takes an email message as input, cleans it using the same preprocessing steps as during training, vectorizes it using the trained vectorizer, and then uses the trained model to predict whether it's spam or not.

def predict_message(msg):
    msg = clean_text(msg)
    vec = vectorizer.transform([msg])
    return model.predict(vec)[0]

# Example usage
# msg = "Congratulations! You've won a free lottery. Click here to claim your prize."