import React, { useState } from "react";
import { Terminal, Copy, Check, Shield, ArrowUpRight } from "lucide-react";

export const Footer: React.FC = () => {
  const [copied, setCopied] = useState(false);

  const curlSnippet = `curl -X POST http://localhost:3000/api/v1/classify \\
  -H "Content-Type: application/json" \\
  -d '{"text": "FINAL WARNING: Verify account at http://bit.ly/sec", "includeShap": true}'`;

  const handleCopy = () => {
    navigator.clipboard.writeText(curlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer id="architecture" className="relative bg-[#171717] text-white rounded-t-[5rem] overflow-hidden pt-24 pb-12 mt-20">
      {/* Subtle Radial Indigo Glow from Top-Center */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[300px] bg-indigo-600/15 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-6 md:px-12">
        {/* Large-Scale Serif Quote with Italic Emphasis */}
        <div className="border-b border-neutral-800 pb-16 mb-16">
          <span className="font-mono-tracked text-xs text-indigo-400 font-semibold block mb-4">
            [SECURITY PHILOSOPHY]
          </span>
          <h2 className="font-display text-4xl sm:text-6xl md:text-7xl font-normal tracking-tight text-white/95 max-w-4xl leading-[1.05]">
            <span className="italic font-display font-normal text-indigo-400">Clarity</span> in the noise.
          </h2>
          <p className="font-body text-neutral-400 text-sm sm:text-base max-w-xl mt-4 leading-relaxed">
            Eliminating black-box ambiguity with transparent machine learning token attribution, high-throughput microservices, and continuous active learning.
          </p>
        </div>

        {/* 3-Column Grid for Links, Endpoints, and Interactive cURL Playground */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-neutral-800">
          {/* Column 1: Platform & Architecture */}
          <div className="md:col-span-4 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Shield className="w-4 h-4 text-white" />
              </div>
              <span className="font-display italic text-xl font-bold text-white">Mail Guard AI</span>
            </div>
            <p className="font-body text-xs text-neutral-400 leading-relaxed pr-4">
              Production-grade email threat defense system combining fine-tuned DistilBERT ONNX, Kernel SHAP, Google Gemini 2.5 Flash RAG, and PostgreSQL Active Learning.
            </p>
            <div className="pt-2 font-mono text-[11px] text-neutral-500 space-y-1">
              <div>INFERENCE: ~12MS ONNX CPU</div>
              <div>CLASSIFIER: 4-CLASS TAXONOMY</div>
              <div>VERSION: v2.0 PRODUCTION</div>
            </div>
          </div>

          {/* Column 2: API Endpoints Directory */}
          <div className="md:col-span-3 space-y-3">
            <span className="font-mono-tracked text-[11px] text-indigo-400 font-semibold block">
              [API ENDPOINTS]
            </span>
            <ul className="space-y-2 font-mono text-xs text-neutral-300">
              <li className="flex items-center justify-between hover:text-indigo-300 transition-colors">
                <span>POST /api/v1/classify</span>
                <span className="text-[10px] text-neutral-500">REST</span>
              </li>
              <li className="flex items-center justify-between hover:text-indigo-300 transition-colors">
                <span>POST /api/v1/batch</span>
                <span className="text-[10px] text-neutral-500">ASYNC</span>
              </li>
              <li className="flex items-center justify-between hover:text-indigo-300 transition-colors">
                <span>GET /api/v1/retrain/drift</span>
                <span className="text-[10px] text-neutral-500">MLOPS</span>
              </li>
              <li className="flex items-center justify-between hover:text-indigo-300 transition-colors">
                <span>GET /metrics</span>
                <span className="text-[10px] text-neutral-500">PROMETHEUS</span>
              </li>
              <li className="flex items-center justify-between hover:text-indigo-300 transition-colors">
                <span>GET /api/v1/health</span>
                <span className="text-[10px] text-neutral-500">PROBE</span>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick cURL Snippet */}
          <div className="md:col-span-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-mono-tracked text-[11px] text-indigo-400 font-semibold flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5" /> [QUICK SCAN CURL]
              </span>
              <button
                onClick={handleCopy}
                className="text-[11px] font-mono text-neutral-400 hover:text-white flex items-center gap-1 cursor-pointer bg-neutral-800/80 px-2.5 py-1 rounded"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copied ? "COPIED" : "COPY"}
              </button>
            </div>

            <pre className="p-3.5 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] font-mono text-indigo-300 overflow-x-auto leading-relaxed">
              {curlSnippet}
            </pre>
          </div>
        </div>

        {/* Minimalist Monospace Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono-tracked text-[10px] text-neutral-500">
          <span>MAIL GUARD AI • ALL RIGHTS RESERVED 2026</span>
          <span className="tracking-[0.4em]">ORGANIC INTELLIGENCE DESIGN SYSTEM</span>
        </div>
      </div>
    </footer>
  );
};
