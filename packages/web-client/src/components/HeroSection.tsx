import React, { useState } from "react";
import { Sparkles, ArrowDown, ShieldAlert, ShieldCheck, Zap } from "lucide-react";
import type { ClassificationResult } from "../types";
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
  const [inputText, setInputText] = useState(PRESET_MESSAGES[0].text);

  const handleAnalyze = async () => {
    if (!inputText.trim() || loading) return;
    onAnalyzeStart();
    try {
      const res = await api.classifyEmail(inputText, { includeShap: true, includeExplanation: true });
      onAnalysisResult(res);
    } catch (err) {
      console.error("Classification error:", err);
    }
  };

  return (
    <section id="analyzer" className="relative min-h-[115vh] w-full flex flex-col justify-between overflow-hidden bg-gradient-to-b from-[#f5f3ef] via-[#fcfbf9] to-[#fcfbf9] pt-28 pb-32">
      {/* Drifting Background Mesh Gradient (30s infinite drift) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[20%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-tr from-indigo-200/40 via-purple-200/30 to-indigo-100/20 blur-[100px] animate-mesh" />
        <div className="absolute top-[20%] right-[-10%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-bl from-purple-200/35 via-indigo-200/25 to-pink-100/20 blur-[120px] animate-mesh" style={{ animationDirection: "reverse", animationDuration: "38s" }} />
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 max-w-5xl mx-auto px-6 w-full text-center flex flex-col items-center">
        {/* Subtle Eyebrow Label */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/70 border border-[#e5e5e5] shadow-xs mb-6 backdrop-blur-sm">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span className="font-mono-tracked text-[11px] text-[#171717] font-semibold">
            DISTILBERT ONNX + SHAP + GEMINI 2.5
          </span>
        </div>

        {/* Large Scale Display Typography with Italic Emphasis (11vw-14vw, leading [0.85]) */}
        <h1 className="font-display font-normal text-[11vw] sm:text-[9vw] lg:text-[7.5rem] tracking-[-0.04em] leading-[0.88] text-[#171717] mb-8 select-none">
          Detect <span className="italic font-normal font-display text-indigo-700">Spam.</span>
        </h1>

        <p className="font-body text-base md:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed mb-8">
          An editorial threat intelligence analyzer providing deep semantic classification, mathematical token attribution, and natural language reasoning.
        </p>

        {/* Preset Sample Pills */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
          <span className="font-mono-tracked text-[10px] text-neutral-400 mr-2">SAMPLE INPUTS:</span>
          {PRESET_MESSAGES.map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                setInputText(preset.text);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-white/80 border border-[#e5e5e5] hover:border-indigo-400 text-neutral-700 hover:text-indigo-700 transition-colors shadow-2xs cursor-pointer font-medium"
            >
              {preset.name}
            </button>
          ))}
        </div>

        {/* Minimalist Text Area Card */}
        <div className="w-full max-w-3xl bg-white/85 backdrop-blur-xl rounded-3xl border border-[#e5e5e5] shadow-[0_20px_50px_rgba(67,56,202,0.06)] p-6 transition-premium focus-within:border-indigo-300 focus-within:shadow-[0_25px_60px_rgba(67,56,202,0.12)]">
          <label htmlFor="message-input" className="block text-left font-mono-tracked text-[11px] text-neutral-400 mb-2">
            [INPUT MESSAGE BODY OR SUSPICIOUS EMAIL EXCERPT]
          </label>
          <textarea
            id="message-input"
            rows={4}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Paste raw email text, SMS alert, or phishing communication to analyze..."
            className="w-full bg-transparent border-none text-[#171717] font-body text-sm md:text-base placeholder:text-neutral-400 focus:outline-none resize-none leading-relaxed"
          />
          <div className="flex items-center justify-between pt-2 border-t border-[#f0f0f0] text-neutral-400 font-mono text-[11px]">
            <span>{inputText.length} CHARACTERS</span>
            <span>~12MS INFERENCE LATENCY</span>
          </div>
        </div>

        {/* Real-time Inline Result Display (when analyzed) */}
        {result && (
          <div className="w-full max-w-3xl mt-6 p-6 rounded-3xl bg-white border border-[#e5e5e5] shadow-xl text-left transition-premium">
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
                  <span className="text-neutral-400 block text-[10px]">RISK SCORE</span>
                  <span className={`font-bold ${result.riskScore > 60 ? "text-rose-600" : "text-emerald-600"}`}>
                    {result.riskScore.toFixed(1)} / 100 ({result.riskLevel})
                  </span>
                </div>
              </div>
            </div>

            {/* Gemini LLM Reasoning */}
            {result.explanation && (
              <div className="py-4 border-b border-[#f0f0f0]">
                <span className="font-mono-tracked text-[10px] text-indigo-600 block mb-1">
                  [GEMINI 2.5 SECURITY REASONING]
                </span>
                <p className="font-body text-xs md:text-sm text-neutral-700 leading-relaxed italic">
                  "{result.explanation}"
                </p>
              </div>
            )}

            {/* SHAP Token Attribution Cloud */}
            <div className="pt-3">
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
          </div>
        )}
      </div>

      {/* The Wave Container (Crucial Component) */}
      <div className="wave-container">
        <div className="wave-curve relative flex justify-center items-start pt-6">
          {/* Analyze Message Button at Center-Top of Curve */}
          <button
            onClick={handleAnalyze}
            disabled={loading || !inputText.trim()}
            className="animate-btn-pulse bg-[#4338ca] text-white px-8 py-4 rounded-full font-mono-tracked text-xs font-bold shadow-xl hover:bg-indigo-800 transition-premium cursor-pointer flex items-center gap-3 active:scale-95"
          >
            <Zap className="w-4 h-4 text-indigo-200 fill-indigo-200" />
            {loading ? "ANALYZING GRAPH..." : "ANALYZE MESSAGE"}
          </button>
        </div>
      </div>
    </section>
  );
};
