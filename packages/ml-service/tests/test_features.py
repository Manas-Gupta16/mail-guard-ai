"""
Tests for the Feature Extractor module.

Validates URL detection, urgency scoring, caps ratio,
and all structural feature extraction.
"""

from src.features.extractor import FeatureExtractor


extractor = FeatureExtractor()


class TestURLDetection:
    def test_no_urls(self):
        features = extractor.extract("Hello, this is a normal email.")
        assert features["url_count"] == 0
        assert features["has_shortened_urls"] is False

    def test_regular_urls(self):
        features = extractor.extract("Visit https://example.com and http://test.org")
        assert features["url_count"] == 2
        assert features["has_shortened_urls"] is False

    def test_shortened_urls(self):
        features = extractor.extract("Click here: https://bit.ly/abc123")
        assert features["url_count"] == 1
        assert features["has_shortened_urls"] is True
        assert features["shortened_url_count"] == 1

    def test_multiple_shortened_urls(self):
        text = "Links: https://bit.ly/a https://tinyurl.com/b https://t.co/c"
        features = extractor.extract(text)
        assert features["shortened_url_count"] == 3


class TestUrgencyScore:
    def test_no_urgency(self):
        features = extractor.extract("Meeting at 3pm tomorrow.")
        assert features["urgency_score"] == 0.0

    def test_high_urgency(self):
        features = extractor.extract("URGENT! Act now! Limited time offer! Final warning!")
        assert features["urgency_score"] > 0.8

    def test_moderate_urgency(self):
        features = extractor.extract("Please respond immediately regarding your account.")
        assert features["urgency_score"] > 0.0
        assert features["urgency_score"] <= 1.0


class TestCapsRatio:
    def test_normal_text(self):
        features = extractor.extract("Hello World")
        # 2 uppercase out of 10 alpha chars
        assert features["caps_ratio"] < 0.3

    def test_all_caps(self):
        features = extractor.extract("FREE MONEY NOW")
        assert features["caps_ratio"] == 1.0

    def test_no_alpha(self):
        features = extractor.extract("12345 !@#$%")
        assert features["caps_ratio"] == 0.0


class TestSpecialCharacters:
    def test_exclamation_count(self):
        features = extractor.extract("Buy now!!! Great deal!!")
        assert features["exclamation_count"] == 5

    def test_dollar_signs(self):
        features = extractor.extract("Win $1000 or $500 cash!")
        assert features["dollar_sign_count"] == 2

    def test_currency_detection(self):
        features = extractor.extract("Send $500 to claim your prize")
        assert features["contains_currency"] is True


class TestSuspiciousAttachments:
    def test_no_attachments(self):
        features = extractor.extract("Please see the attached document.")
        assert features["suspicious_attachment_mentioned"] is False

    def test_exe_mentioned(self):
        features = extractor.extract("Download setup.exe to install")
        assert features["suspicious_attachment_mentioned"] is True

    def test_zip_mentioned(self):
        features = extractor.extract("Unzip the file archive.zip")
        assert features["suspicious_attachment_mentioned"] is True


class TestSpamEmail:
    """Integration test with realistic spam email."""

    def test_typical_spam(self):
        spam_text = """
        CONGRATULATIONS!!! You have been selected to receive $1,000,000!!!
        Click here NOW: https://bit.ly/claim-prize
        This is URGENT - act immediately or you will LOSE your prize!
        Download winner_form.exe to claim.
        """
        features = extractor.extract(spam_text)

        assert features["url_count"] >= 1
        assert features["has_shortened_urls"] is True
        assert features["urgency_score"] > 0.5
        assert features["caps_ratio"] > 0.2
        assert features["exclamation_count"] >= 3
        assert features["dollar_sign_count"] >= 1
        assert features["suspicious_attachment_mentioned"] is True
        assert features["contains_currency"] is True

    def test_typical_ham(self):
        ham_text = """
        Hi John, just wanted to follow up on our meeting yesterday.
        The quarterly report looks good. Can you send me the updated
        spreadsheet by Friday? Thanks, Sarah
        """
        features = extractor.extract(ham_text)

        assert features["url_count"] == 0
        assert features["has_shortened_urls"] is False
        assert features["urgency_score"] == 0.0
        assert features["caps_ratio"] < 0.1
        assert features["suspicious_attachment_mentioned"] is False
