import os
from flask import Flask, request, jsonify
import spacy
from sumy.parsers.plaintext import PlaintextParser
from sumy.nlp.tokenizers import Tokenizer
from sumy.summarizers.text_rank import TextRankSummarizer
import nltk
from flask_cors import CORS
from bs4 import BeautifulSoup
app = Flask(__name__)
CORS(app)



# ===== HTML Sanitization =====
def sanitize_text(raw_text):
    soup = BeautifulSoup(raw_text, "html.parser")
    for tag in soup.find_all(['p', 'br']):
        tag.append('\n')
    clean_text = soup.get_text()
    clean_text = '\n'.join(line.strip() for line in clean_text.split('\n') if line.strip())
    return clean_text.strip()

# ===== NLTK Setup =====
nltk_data_path = os.path.join(os.path.expanduser("~"), "nltk_data")
if not os.path.exists(nltk_data_path):
    os.makedirs(nltk_data_path)

try:
    nltk.data.find("tokenizers/punkt")
except LookupError:
    nltk.download("punkt", download_dir=nltk_data_path)
    nltk.data.path.append(nltk_data_path)

# ===== spaCy Setup =====
try:
    nlp = spacy.load("en_core_web_sm")
except OSError:
    from spacy.cli import download
    download("en_core_web_sm")
    nlp = spacy.load("en_core_web_sm")

# ===== Improved Keyword Extraction =====
@app.route('/extract-keywords', methods=['POST'])
def extract_keywords():
    try:
        print("\nKeyword Extraction Request Received")
        if 'text' not in request.json or not isinstance(request.json['text'], str):
            return jsonify({'error': 'Missing or invalid text parameter'}), 400

        raw_text = request.json['text'].strip()
        text = sanitize_text(raw_text)

        if not text:
            return jsonify({'error': 'Empty text provided after sanitization'}), 400

        # Normalize quotation and brackets
        import re
        text = re.sub(r"[‘’“”\"()\[\]]", "", text)

        doc = nlp(text)
        keywords = set()

        for chunk in doc.noun_chunks:
            # Clean individual tokens
            tokens = [token for token in chunk if not token.is_stop and token.pos_ != "PRON"]
            phrase = " ".join(token.lemma_ for token in tokens).strip()

            # Filter badly formed phrases
            if (len(phrase) > 2 and 
                not any(sym in phrase for sym in [' and ', ' etc', '\n']) and 
                phrase.lower() not in nlp.Defaults.stop_words and 
                not phrase.lower().endswith(('etc', 'and'))):
                keywords.add(phrase)

        # Final clean-up: remove duplicate or very short keywords
        final_keywords = sorted(
            [kw for kw in keywords if kw and len(kw.split()) <= 5], 
            key=lambda x: text.find(x)
        )

        print("Cleaned keywords:", final_keywords)
        return jsonify({'keywords': final_keywords})

    except Exception as e:
        print("Keyword Extraction Error:", str(e))
        return jsonify({'error': str(e)}), 500

# ===== Summarization Endpoint =====
@app.route('/summarize', methods=['POST'])
def summarize():
    try:
        print("\nSummarization Request Received")
        if 'text' not in request.json or not isinstance(request.json['text'], str):
            return jsonify({'error': 'Missing or invalid text parameter'}), 400

        raw_text = request.json['text'].strip()
        text = sanitize_text(raw_text)

        if not text:
            return jsonify({'error': 'Empty text provided after sanitization'}), 400

        parser = PlaintextParser.from_string(text, Tokenizer("english"))
        summarizer = TextRankSummarizer()
        all_sentences = summarizer(parser.document, 6)

        ignore_starts = ('it', 'they', 'he', 'she', 'this', 'these', 'those', 'that')
        filtered = [
            str(s) for s in all_sentences
            if not str(s).strip().lower().startswith(ignore_starts)
        ]

        final_summary = filtered[:3] if len(filtered) >= 3 else [str(s) for s in all_sentences[:3]]
        return jsonify({'summary': ' '.join(final_summary)})

    except Exception as e:
        print("Summarization Error:", str(e))
        return jsonify({'error': str(e)}), 500
# ===== Main =====
if __name__ == '__main__':
    app.run(port=5001, debug=True)
