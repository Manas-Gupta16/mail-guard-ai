import pickle
from preprocessing import clean_text

model = pickle.load(open('model/model.pkl', 'rb'))
vectorizer = pickle.load(open('model/vectorizer.pkl', 'rb'))

def predict_message(msg):
    msg = clean_text(msg)
    vec = vectorizer.transform([msg])
    return model.predict(vec)[0]