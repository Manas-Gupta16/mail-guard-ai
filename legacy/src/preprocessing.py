import re

def clean_text(text):
    text = text.lower()
    text = re.sub(r'[^a-zA-Z\s]', '', text)
    return text
# This function can be enhanced with more sophisticated cleaning steps if needed, such as removing stop words, stemming, or lemmatization.
# For the current scope, this basic cleaning should suffice to improve model performance by reducing noise in the input data.