import React, { useState } from "react";
import { ArrowRight, Plus, Minus } from "lucide-react";

interface AccordionItem {
  id: string;
  title: string;
  italicWord: string;
  subtitle: string;
  description: string;
  tags: string[];
  specs: { label: string; value: string }[];
}

const ACCORDION_ITEMS: AccordionItem[] = [
  {
    id: "01",
    title: "Fine-Tuned Transformer",
    italicWord: "Embeddings",
    subtitle: "DistilBERT 66M Parameter Architecture",
    description: "Converts raw text sequences into 768-dimensional contextual vectors, capturing nuanced social engineering cues, obfuscation tricks, and urgent psychological deception patterns with 98.8% accuracy.",
    tags: ["[DISTILBERT-BASE]", "[768-DIM VECTOR]", "[NLP ENCODER]"],
    specs: [
      { label: "Vocabulary", value: "30,522 Tokens" },
      { label: "Max Sequence", value: "512 Subwords" },
      { label: "Accuracy", value: "98.8% Precision" },
    ],
  },
  {
    id: "02",
    title: "High-Throughput Graph",
    italicWord: "Inference",
    subtitle: "ONNX Runtime CPU Optimizations",
    description: "Compiles PyTorch model weights into an optimized execution graph with constant folding and operator fusion, executing real-time classifications in ~11-14ms on standard multi-core CPUs without GPU overhead.",
    tags: ["[ONNX RUNTIME]", "[OPERATOR FUSION]", "[12MS CPU P99]"],
    specs: [
      { label: "Latency", value: "11-14ms CPU" },
      { label: "Throughput", value: "350+ req/sec" },
      { label: "Memory Footprint", value: "< 240 MB" },
    ],
  },
  {
    id: "03",
    title: "Explainable Attribution",
    italicWord: "Mathematics",
    subtitle: "Cooperative Game-Theoretic SHAP",
    description: "Calculates marginal Shapley contribution values for each individual word token. Positive values identify malicious signals (e.g. 'Verify', 'Funds', 'Frozen') while negative values represent legitimate context markers.",
    tags: ["[KERNEL SHAP]", "[SHAPLEY VALUES]", "[TOKEN WEIGHTING]"],
    specs: [
      { label: "Attribution Type", value: "Token-Level Marginal" },
      { label: "Evaluation", value: "Game-Theoretic" },
      { label: "Transparency", value: "Full Auditability" },
    ],
  },
  {
    id: "04",
    title: "Security Analyst",
    italicWord: "Reasoning",
    subtitle: "Google Gemini 2.5 Flash RAG",
    description: "Synthesizes extracted structural heuristics (shortened URLs, caps ratio, attachments) and top SHAP attribution tokens into concise, actionable 2-3 sentence natural language security analyst threat reports.",
    tags: ["[GEMINI 2.5 FLASH]", "[RAG SYNTHESIS]", "[SECURITY BRIEFING]"],
    specs: [
      { label: "Reasoning Engine", value: "Gemini 2.5 Flash" },
      { label: "Output Format", value: "Analyst Briefing" },
      { label: "Context Window", value: "Structured JSON" },
    ],
  },
  {
    id: "05",
    title: "Continuous Feedback &",
    italicWord: "Drift Engine",
    subtitle: "Active Learning with Prometheus Telemetry",
    description: "Tracks human analyst feedback in PostgreSQL to calculate real-time model drift rates. Automatically generates fine-tuning dataset manifests when prediction uncertainty exceeds threshold limits.",
    tags: ["[ACTIVE LEARNING]", "[MODEL DRIFT]", "[PROMETHEUS]"],
    specs: [
      { label: "Feedback DB", value: "PostgreSQL Prisma" },
      { label: "Drift Threshold", value: "< 80% Agreement" },
      { label: "Metrics", value: "/metrics Scraper" },
    ],
  },
];

interface CapabilitiesAccordionProps {
  onExploreApi: () => void;
}

export const CapabilitiesAccordion: React.FC<CapabilitiesAccordionProps> = ({ onExploreApi }) => {
  const [openId, setOpenId] = useState<string>("01");

  const toggleAccordion = (id: string) => {
    setOpenId(openId === id ? "" : id);
  };

  return (
    <section id="capabilities" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#e5e5e5] bg-[#fcfbf9]">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16">
        {/* Left Column: Sticky Header */}
        <div className="lg:col-span-5 lg:sticky lg:top-28 self-start space-y-6">
          <span className="font-mono-tracked text-xs text-indigo-700 font-semibold block">
            [CORE SUBSYSTEMS]
          </span>

          <h2 className="font-display text-4xl sm:text-5xl text-[#171717] tracking-tight leading-[1.05]">
            Core <br />
            <span className="italic font-display font-normal text-indigo-700">Capabilities.</span>
          </h2>

          <p className="font-body text-neutral-600 text-sm md:text-base leading-relaxed">
            Every incoming email traverses a layered pipeline combining semantic transformer encoders, structural signature heuristics, explainability algorithms, and generative LLM reasoning.
          </p>

          <button
            onClick={onExploreApi}
            className="group inline-flex items-center gap-3 font-mono-tracked text-xs font-bold text-[#171717] hover:text-indigo-700 transition-colors cursor-pointer pt-2"
          >
            <span>VIEW API DOCUMENTATION</span>
            <div className="w-8 h-8 rounded-full border border-neutral-300 group-hover:border-indigo-600 flex items-center justify-center transition-colors">
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </button>
        </div>

        {/* Right Column: Interactive Vertical Accordion */}
        <div className="lg:col-span-7 divide-y divide-[#e5e5e5]">
          {ACCORDION_ITEMS.map((item) => {
            const isOpen = openId === item.id;
            return (
              <div key={item.id} className="py-6 transition-premium">
                {/* Accordion Header */}
                <button
                  onClick={() => toggleAccordion(item.id)}
                  className="w-full flex items-center justify-between text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-4">
                    <span className="font-mono-tracked text-xs text-neutral-400 font-medium">
                      {item.id}
                    </span>
                    <h3
                      className={`font-display text-2xl sm:text-3xl transition-colors ${
                        isOpen
                          ? "text-[#171717] font-bold"
                          : "text-neutral-400 group-hover:text-[#171717]"
                      }`}
                    >
                      {item.title}{" "}
                      <span className="italic font-normal text-indigo-700">
                        {item.italicWord}
                      </span>
                    </h3>
                  </div>

                  <div className="w-8 h-8 rounded-full border border-neutral-300 flex items-center justify-center text-neutral-600 group-hover:border-black group-hover:text-black transition-colors shrink-0 ml-4">
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>

                {/* Expanding Fluid Content */}
                {isOpen && (
                  <div className="pt-6 pl-8 space-y-4 transition-premium">
                    <p className="font-body text-sm text-neutral-600 leading-relaxed max-w-xl">
                      {item.description}
                    </p>

                    {/* Dynamic Monospace Bracket Tags */}
                    <div className="flex flex-wrap gap-2 pt-1">
                      {item.tags.map((tag, tagIdx) => (
                        <span
                          key={tagIdx}
                          className="font-mono-tracked text-[10px] text-indigo-800 bg-indigo-50 border border-indigo-200/60 px-2.5 py-1 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Specs Grid */}
                    <div className="grid grid-cols-3 gap-4 pt-3 border-t border-[#f0f0f0]">
                      {item.specs.map((spec, specIdx) => (
                        <div key={specIdx}>
                          <span className="font-mono-tracked text-[9px] text-neutral-400 block">
                            {spec.label}
                          </span>
                          <span className="font-mono text-xs text-neutral-800 font-bold">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
