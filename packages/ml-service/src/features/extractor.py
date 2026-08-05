"""
Mail Guard AI — Feature Extractor

Extracts structural and linguistic features from email text that go
beyond what the DistilBERT model captures — URL analysis, formatting
signals, urgency scoring, and more.
"""

import re
from urllib.parse import urlparse

# Common URL shortener domains
SHORTENER_DOMAINS = {
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd",
    "buff.ly", "adf.ly", "bl.ink", "lnkd.in", "rb.gy", "cutt.ly",
    "shorturl.at", "tiny.cc",
}

# Free email providers (often used in spam)
FREE_EMAIL_PROVIDERS = {
    "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "aol.com",
    "mail.com", "protonmail.com", "yandex.com", "zoho.com",
}

# Urgency keywords with weights
URGENCY_KEYWORDS = {
    "urgent": 1.0, "immediately": 1.0, "act now": 1.0, "limited time": 0.9,
    "expires": 0.8, "hurry": 0.9, "don't miss": 0.8, "last chance": 0.9,
    "final warning": 1.0, "deadline": 0.7, "asap": 0.8, "right now": 0.7,
    "time sensitive": 0.9, "respond immediately": 1.0, "action required": 0.9,
}

# Suspicious file extensions
DANGEROUS_EXTENSIONS = {
    ".exe", ".bat", ".cmd", ".scr", ".pif", ".com", ".vbs", ".js",
    ".wsh", ".wsf", ".msi", ".jar", ".zip", ".rar", ".7z",
}


class FeatureExtractor:
    """
    Extract structural features from email text for enhanced classification.

    These features complement the DistilBERT model's text understanding
    with explicit structural signals that are harder for the model to
    learn from text alone.

    Usage:
        extractor = FeatureExtractor()
        features = extractor.extract("Click here: http://bit.ly/abc123")
    """

    def extract(self, text: str) -> dict:
        """
        Extract all features from email text.

        Returns a flat dict of feature names → values.
        """
        return {
            "url_count": self._count_urls(text),
            "has_shortened_urls": self._has_shortened_urls(text),
            "shortened_url_count": self._count_shortened_urls(text),
            "urgency_score": self._urgency_score(text),
            "caps_ratio": self._caps_ratio(text),
            "exclamation_count": text.count("!"),
            "question_mark_count": text.count("?"),
            "dollar_sign_count": text.count("$"),
            "has_html_tags": bool(re.search(r"<[a-zA-Z][^>]*>", text)),
            "suspicious_attachment_mentioned": self._has_suspicious_attachments(text),
            "word_count": len(text.split()),
            "avg_word_length": self._avg_word_length(text),
            "contains_phone_number": bool(re.search(r"\b\d{3}[-.]?\d{3}[-.]?\d{4}\b", text)),
            "contains_currency": bool(re.search(r"[$£€¥]\s*\d+", text)),
        }

    def _count_urls(self, text: str) -> int:
        """Count all URLs in the text."""
        url_pattern = r"https?://\S+|www\.\S+"
        return len(re.findall(url_pattern, text, re.IGNORECASE))

    def _has_shortened_urls(self, text: str) -> bool:
        """Check if any URL uses a known shortener service."""
        return self._count_shortened_urls(text) > 0

    def _count_shortened_urls(self, text: str) -> int:
        """Count URLs from known shortener services."""
        url_pattern = r"https?://\S+"
        urls = re.findall(url_pattern, text, re.IGNORECASE)
        count = 0
        for url in urls:
            try:
                parsed = urlparse(url)
                domain = re.sub(r"^www\.", "", parsed.netloc.lower())
                if domain in SHORTENER_DOMAINS:
                    count += 1
            except (ValueError, TypeError, AttributeError):
                pass
        return count

    def _urgency_score(self, text: str) -> float:
        """
        Score 0.0-1.0 based on urgency keyword density.
        Higher = more urgency language detected.
        """
        text_lower = text.lower()
        total_weight = 0.0
        for keyword, weight in URGENCY_KEYWORDS.items():
            if keyword in text_lower:
                total_weight += weight

        # Normalize to 0-1 range (cap at 3.0 total weight → 1.0)
        return min(total_weight / 3.0, 1.0)

    def _caps_ratio(self, text: str) -> float:
        """Ratio of uppercase characters to total alphabetic characters."""
        alpha_chars = [c for c in text if c.isalpha()]
        if not alpha_chars:
            return 0.0
        upper_count = sum(1 for c in alpha_chars if c.isupper())
        return round(upper_count / len(alpha_chars), 4)

    def _has_suspicious_attachments(self, text: str) -> bool:
        """Check if text mentions suspicious file types."""
        text_lower = text.lower()
        return any(ext in text_lower for ext in DANGEROUS_EXTENSIONS)

    def _avg_word_length(self, text: str) -> float:
        """Average word length — spam often has unusual word lengths."""
        words = text.split()
        if not words:
            return 0.0
        return round(sum(len(w) for w in words) / len(words), 2)
