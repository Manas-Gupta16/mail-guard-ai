# Privacy Policy for Mail Guard AI Chrome Extension

**Last Updated:** August 18, 2026

## 1. Overview
Mail Guard AI ("we", "our", or "the Extension") is dedicated to protecting your privacy and security. This privacy policy explains how data is handled when you use the Mail Guard AI Chrome & Webmail Extension.

## 2. Information We Process
- **Email Content for Threat Analysis**: When you explicitly click "Inspect with Mail Guard" or inspect text in the popup, the selected email subject and body text are transmitted over an encrypted connection to the Mail Guard AI API Gateway solely to compute security scores (DistilBERT ONNX classification, SHAP token attribution, and URL sandboxing).
- **No Background Surveillance**: The extension **only** reads email content when explicitly commanded by the user clicking the inspection button. It does **not** read, log, or transmit emails passively in the background.

## 3. Data Retention & Storage
- We do **not** sell, rent, or monetize your email text or personal data.
- Transient email payloads sent for inference are processed in memory and are **not** permanently retained unless the user explicitly submits feedback (active learning) to correct an AI misclassification.

## 4. Permissions Used
- `activeTab`: Needed to read the open email text when the user clicks the "Inspect with Mail Guard" button.
- `storage`: Used to save the user's preferred API gateway URL and preferences locally within the browser.
- `host_permissions` (`mail.google.com`, `outlook.live.com`, `outlook.office.com`): Needed to inject the floating inspection button into the Gmail and Outlook email toolbar.

## 5. Contact & Inquiries
For security inquiries or questions about this privacy policy, please contact the repository maintainer on GitHub:
https://github.com/Manas-Gupta16/mail-guard-ai
