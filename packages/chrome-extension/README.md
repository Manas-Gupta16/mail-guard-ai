# 🛡️ Mail Guard AI — Chrome & Webmail Extension

Enterprise AI threat intelligence and Explainable AI (SHAP) inspection directly inside **Gmail**, **Outlook Web**, and Microsoft 365.

---

## Features

- **Floating In-Mailbox Pill**: Injects an *"Inspect with Mail Guard"* button directly into the Gmail / Outlook email action toolbar.
- **Deep Transformer Inference**: Evaluates email semantic structures via DistilBERT ONNX and structural heuristics.
- **SHAP Token Attribution Cloud**: Highlights exact suspicious words (+score) and reassuring safe words (-score).
- **Gemini 2.5 Security Briefing**: Generates concise natural language explanations of detected threats.
- **Live URL Sandboxing**: Scans and uncloaks shortened links (`bit.ly`, `tinyurl`) in the background.
- **Human-in-the-Loop Active Learning**: One-click thumbs-up/down feedback directly feeds the PostgreSQL training manifest queue.

---

## 🚀 How to Install in Google Chrome / Brave / Edge

1. Open your browser and navigate to **`chrome://extensions`** (or `edge://extensions`).
2. Toggle **Developer mode** in the top right corner.
3. Click the **Load unpacked** button.
4. Select the folder:
   ```
   mail-guard-api/packages/chrome-extension
   ```
5. The **Mail Guard AI** extension icon will now appear in your browser toolbar!

---

## ✉️ How to Use with Gmail or Outlook

1. Make sure your local API Gateway is running (`npm run dev` or `docker compose up`).
2. Open [Gmail](https://mail.google.com) or [Outlook](https://outlook.live.com).
3. Click to open any email.
4. Click the purple **"Inspect with Mail Guard"** pill in the email header.
5. The executive threat intelligence overlay will appear directly above the message body with real-time risk scores and SHAP token attributions!
