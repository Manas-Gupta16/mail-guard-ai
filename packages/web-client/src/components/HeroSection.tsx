import React, { useState, useRef } from "react";
import { Sparkles, ShieldAlert, ShieldCheck, Zap, UploadCloud, FileText, CheckCircle2, ThumbsUp, ThumbsDown, Shield, Server, ArrowRight } from "lucide-react";
import type { ClassificationResult, EmlAnalysisResult } from "../types";
import { api } from "../services/api";

const PRESET_MESSAGES = [
  {
    name: "Phishing Urgency",
    text: "FINAL WARNING: Your PayPal account will be suspended within 24 hours due to suspicious activity. Verify your identity immediately at http://bit.ly/paypal-security-update or your funds will be permanently frozen!",
  },
  {
    name: "Macro Malware",
    text: "Please find attached the overdue payment invoice #INV-92842. Download payment_receipt_928.zip executable and enable macros to review wire transfer instructions.",
  },
  {
    name: "Authentic Business",
    text: "Hi team, thanks for sending over the quarterly architecture report. We reviewed the microservices diagram and will discuss the deployment timeline in tomorrow's sync.",
  },
];

const SAMPLE_EML = `From: PayPal Security <security@paypal-auth-verify.com>
To: target.user@enterprise.org
Subject: URGENT: Your PayPal Account Has Been Suspended
Date: Sun, 16 Aug 2026 12:00:00 +0000
Message-ID: <sec_alert_9842@paypal-auth-verify.com>
Received-SPF: fail (google.com: domain of security@paypal-auth-verify.com does not designate 198.51.100.44 as permitted sender)
Authentication-Results: mx.google.com; dkim=fail; dmarc=fail action=none
Received: from mail.paypal-auth-verify.com [198.51.100.44] by mx.google.com with ESMTP; Sun, 16 Aug 2026 12:00:00 +0000

FINAL WARNING: Your PayPal account balance is restricted due to suspicious logins from Russia. You must verify identity immediately at http://bit.ly/paypal-security-auth or funds will be seized.`;

interface HeroSectionProps {
  onAnalyzeStart: () => void;
  onAnalysisResult: (result: ClassificationResult) => void;
  result: ClassificationResult | null;
  loading: boolean;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onAnalyzeStart,
  onAnalysisResult,
  result,
  loading,
}) => {
  const [inputMode, setInputMode] = useState<"text" | "eml">("text");
  const [inputText, setInputText] = useState(PRESET_MESSAGES[0].text);
  const [emlResult, setEmlResult] = useState<EmlAnalysisResult | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [feedbackRecorded, setFeedbackRecorded] = useState(false);
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAnalyze = async () => {
    if (loading) return;

    onAnalyzeStart();
    setFeedbackRecorded(false);

    try {
      if (inputMode === "eml") {
        const emlData = await api.analyzeEml(inputText);
        setEmlResult(emlData);
        onAnalysisResult(emlData.classification);
      } else {
        setEmlResult(null);
        const res = await api.classifyEmail(inputText, { includeShap: true, includeExplanation: true });
        onAnalysisResult(res);
      }
    } catch (err) {
      console.error("Analysis error:", err);
    }
  };

  const handleFileUpload = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setInputText(content);
        setInputMode("eml");
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFeedback = async (label: "spam" | "ham") => {
    if (!result) return;
    setSubmittingFeedback(true);
    try {
      await api.submitFeedback(result.id, label, "User feedback recorded via web client");
      setFeedbackRecorded(true);
    } catch (err) {
      console.error("Feedback error:", err);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  return (
    <section id="analyzer" className="relative min-h-[115vh] w-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#f5f3ef] via-[#fcfbf9] to-[#fcfbf9] pt-28 pb-32">
      {/* Drifting Background Mesh Gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-indigo-100/20 blur-[100px] animate-mesh" />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-bl from-purple-200/35 via-indigo-200/25 to-pink-100/20 blur-[120px] animate-mesh" style={{ animationDirection: "reverse", animationDuration: "38s" }} />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center flex flex-col items-center">
        {/* Eyebrow Label */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 border border-[#e5e5e5] shadow-xs mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono-tracked text-[11px] text-[#171717] font-semibold">
            DISTILBERT ONNX + SPF/DKIM PARSER + GEMINI 2.5
          </span>
        </div>

        {/* Hero Title */}
        <h1 className="font-display font-normal text-[11vw] sm:text-[9vw] lg:text-[7.5rem] tracking-[-0.04em] leading-[0.88] text-[#171717] mb-8 select-none">
          Detect <span className="italic font-normal font-display text-indigo-700">Spam.</span>
        </h1>

        <p className="font-body text-base md:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-8">
          An editorial threat intelligence analyzer providing deep semantic classification, authentication header parsing, and mathematical explainability.
        </p>

        {/* Input Mode Selector Tabs */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => {
              setInputMode("text");
              setInputText(PRESET_MESSAGES[0].text);
            }}
            className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all cursor-pointer ${
              inputMode === "text"
                ? "bg-[#171717] text-white shadow-md"
                : "bg-white/80 text-neutral-600 border border-[#e5e5e5] hover:border-indigo-300"
            }`}
          >
            [PASTE EMAIL BODY]
          </button>
          <button
            onClick={() => {
              setInputMode("eml");
              setInputText(SAMPLE_EML);
            }}
            className={`px-4 py-2 rounded-full font-mono text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              inputMode === "eml"
                ? "bg-indigo-700 text-white shadow-md"
                : "bg-white/80 text-neutral-600 border border-[#e5e5e5] hover:border-indigo-300"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            [RAW .EML / HEADER PARSER]
          </button>
        </div>

        {/* Preset Sample Pills (in Text Mode) */}
        {inputMode === "text" && (
          <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
            <span className="font-mono-tracked text-[10px] text-neutral-400 mr-2">SAMPLE INPUTS:</span>
            {PRESET_MESSAGES.map((preset) => (
              <button
                key={preset.name}
                onClick={() => setInputText(preset.text)}
                className="text-xs px-3 py-1.5 rounded-full bg-white/90 border border-[#e5e5e5] hover:border-indigo-400 text-neutral-700 hover:text-indigo-700 transition-colors shadow-2xs cursor-pointer font-medium"
              >
                {preset.name}
              </button>
            ))}
          </div>
        )}

        {/* Input Card with Drag & Drop Zone */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`w-full max-w-3xl bg-white/90 backdrop-blur-xl rounded-3xl border transition-premium p-6 shadow-[0_20px_50px_rgba(67,56,202,0.06)] ${
            dragOver ? "border-indigo-500 bg-indigo-50/40 shadow-indigo-100" : "border-[#e5e5e5]"
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <label htmlFor="message-input" className="block text-left font-mono-tracked text-[11px] text-neutral-500 font-bold">
              {inputMode === "eml" ? "[RAW RFC 822 / .EML PAYLOAD WITH HEADERS]" : "[INPUT MESSAGE BODY OR SUSPICIOUS EMAIL EXCERPT]"}
            </label>

            {inputMode === "eml" && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] font-mono font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                SELECT FILE (.EML/.TXT)
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".eml,.txt,.msg"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) handleFileUpload(e.target.files[0]);
              }}
            />
          </div>

          <textarea
            id="message-input"
            rows={inputMode === "eml" ? 6 : 4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              inputMode === "eml"
                ? "Paste raw RFC 822 email payload including headers (From, Subject, Received-SPF, etc.) or drag & drop a .eml file here..."
                : "Paste raw email text, SMS alert, or phishing communication to analyze..."
            }
            className="w-full bg-transparent border-none text-[#171717] font-mono text-xs md:text-sm placeholder:text-neutral-400 focus:outline-none resize-y leading-relaxed"
          />

          <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0] text-neutral-500 font-mono text-[11px]">
            <span>{inputText.length} CHARACTERS</span>
            <span>{inputMode === "eml" ? "RFC 822 MIME PARSER" : "~12MS INFERENCE LATENCY"}</span>
          </div>
        </div>

        {/* EML Authentication & Relay Hop Security Card (when EML parsed) */}
        {emlResult && (
          <div className="w-full max-w-3xl mt-6 p-6 rounded-3xl bg-white border border-[#e5e5e5] shadow-xl text-left transition-premium space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-700">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <span className="font-mono-tracked text-[10px] text-indigo-700 font-bold">
                    [EMAIL ENVELOPE & AUTHENTICATION AUDIT]
                  </span>
                  <h3 className="font-display text-xl font-bold text-[#171717]">
                    {emlResult.envelope.subject}
                  </h3>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono text-[10px] text-neutral-400 block">AUTH SCORE</span>
                <span className={`font-mono text-lg font-bold ${emlResult.authentication.overallScore > 70 ? "text-emerald-600" : "text-rose-600"}`}>
                  {emlResult.authentication.overallScore} / 100
                </span>
              </div>
            </div>

            {/* Authentication Badges Grid: SPF, DKIM, DMARC */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-[#fcfbf9] border border-[#e5e5e5] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-500">SPF RECORD</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    emlResult.authentication.spf.status === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    [{emlResult.authentication.spf.status}]
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 font-mono leading-tight">{emlResult.authentication.spf.details}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcfbf9] border border-[#e5e5e5] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-500">DKIM SIGNATURE</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    emlResult.authentication.dkim.status === "VALID" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    [{emlResult.authentication.dkim.status}]
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 font-mono leading-tight">{emlResult.authentication.dkim.details}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#fcfbf9] border border-[#e5e5e5] space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-neutral-500">DMARC POLICY</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                    emlResult.authentication.dmarc.status === "PASS" ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}>
                    [{emlResult.authentication.dmarc.status}]
                  </span>
                </div>
                <p className="text-[11px] text-neutral-600 font-mono leading-tight">{emlResult.authentication.dmarc.details}</p>
              </div>
            </div>

            {/* Envelope & Relay Chain */}
            <div className="p-4 rounded-2xl bg-neutral-50/70 border border-[#e5e5e5] text-xs font-mono space-y-2 text-neutral-700">
              <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                <span className="text-neutral-400">FROM ENVELOPE:</span>
                <span className="font-bold truncate max-w-sm">{emlResult.envelope.from}</span>
              </div>
              <div className="flex justify-between border-b border-neutral-200 pb-1.5">
                <span className="text-neutral-400">ORIGINATING SENDER IP:</span>
                <span className="font-bold text-indigo-700">{emlResult.relayHops.originatingIp || "N/A"} ({emlResult.relayHops.totalHops} relay hops)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">MESSAGE DATE:</span>
                <span>{emlResult.envelope.date}</span>
              </div>
            </div>
          </div>
        )}

        {/* Real-time Inline Result Display (when analyzed) */}
        {result && (
          <div className="w-full max-w-3xl mt-6 p-6 rounded-3xl bg-white border border-[#e5e5e5] shadow-xl text-left transition-premium space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#f0f0f0]">
              <div className="flex items-center gap-3">
                {result.label === "spam" ? (
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                    <ShieldAlert className="w-6 h-6" />
                  </div>
                ) : (
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <span className="font-mono-tracked text-[10px] text-indigo-600 font-bold">
                    [{result.threatType.replace("_", " ").toUpperCase()}]
                  </span>
                  <h3 className="font-display text-xl font-bold text-[#171717]">
                    {result.label === "spam" ? "Threat Identified" : "Authentic Communication"}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-neutral-400 block text-[10px]">CONFIDENCE</span>
                  <span className="font-bold text-indigo-700">{(result.confidence * 100).toFixed(1)}%</span>
                </div>
                <div className="border-l border-[#e5e5e5] pl-4">
                  <span className="text-neutral-400 block text-[10px]">COMPOUND RISK</span>
                  <span className={`font-bold ${result.riskScore > 60 ? "text-rose-600" : "text-emerald-600"}`}>
                    {result.riskScore.toFixed(1)} / 100 ({result.riskLevel})
                  </span>
                </div>
              </div>
            </div>

            {/* Gemini LLM Reasoning */}
            {result.explanation && (
              <div className="py-2">
                <span className="font-mono-tracked text-[10px] text-indigo-600 block mb-1">
                  [GEMINI 2.5 SECURITY REASONING]
                </span>
                <p className="font-body text-xs md:text-sm text-neutral-700 leading-relaxed italic">
                  "{result.explanation}"
                </p>
              </div>
            )}

            {/* SHAP Token Attribution Cloud */}
            <div className="pt-2 border-t border-[#f0f0f0]">
              <span className="font-mono-tracked text-[10px] text-neutral-400 block mb-2">
                [SHAP TOKEN ATTRIBUTIONS]
              </span>
              <div className="flex flex-wrap gap-1.5">
                {result.shapTokens.map((token, idx) => (
                  <span
                    key={idx}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono ${
                      token.score > 0 ? "shap-badge-spam" : "shap-badge-ham"
                    }`}
                  >
                    <span>{token.token}</span>
                    <span className="text-[10px] opacity-70">
                      {token.score > 0 ? `+${token.score.toFixed(3)}` : token.score.toFixed(3)}
                    </span>
                  </span>
                ))}
              </div>
            </div>

            {/* Human-in-the-Loop Feedback Controls */}
            <div className="pt-3 border-t border-[#f0f0f0] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-neutral-500">
                Was this verdict accurate? Feed active learning:
              </span>

              {feedbackRecorded ? (
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  FEEDBACK RECORDED IN POSTGRESQL!
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleFeedback("spam")}
                    disabled={submittingFeedback}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-rose-200 hover:border-rose-400 bg-rose-50/60 text-xs font-mono text-rose-700 cursor-pointer transition-colors"
                  >
                    <ThumbsDown className="w-3 h-3" /> Flag as Spam
                  </button>
                  <button
                    onClick={() => handleFeedback("ham")}
                    disabled={submittingFeedback}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-200 hover:border-emerald-400 bg-emerald-50/60 text-xs font-mono text-emerald-700 cursor-pointer transition-colors"
                  >
                    <ThumbsUp className="w-3 h-3" /> Confirm Safe
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* The Wave Container */}
      <div className="wave-container">
        <div className="wave-curve relative flex justify-center items-start pt-6">
          <button
            onClick={handleAnalyze}
            disabled={loading || !inputText.trim()}
            className="animate-btn-pulse bg-[#4338ca] text-white px-8 py-4 rounded-full font-mono-tracked text-xs font-bold shadow-xl hover:bg-indigo-800 transition-premium cursor-pointer flex items-center gap-3 active:scale-95"
          >
            <Zap className="w-4 h-4 text-indigo-200 fill-indigo-200" />
            {loading ? "PARSING HEADERS & GRAPH..." : inputMode === "eml" ? "ANALYZE EML HEADERS" : "ANALYZE MESSAGE"}
          </button>
        </div>
      </div>
    </section>
  );
};
