import React from "react";
import { ArrowUpRight } from "lucide-react";

interface CategoryCardData {
  title: string;
  category: string;
  badge: string;
  bgColor: string;
  orbColor: string;
  description: string;
  metrics: string;
  sampleText: string;
}

const CATEGORIES: CategoryCardData[] = [
  {
    title: "Credential Phishing",
    category: "THREAT TAXONOMY 01",
    badge: "[SOCIAL ENGINEERING]",
    bgColor: "#fee2e2",
    orbColor: "radial-gradient(circle, rgba(239, 68, 68, 0.45) 0%, rgba(244, 63, 94, 0.1) 70%)",
    description: "Urgent account suspension alerts, spoofed banking domains, and obfuscated link redirects designed to harvest credentials.",
    metrics: "99.1% RECALL • 12MS ONNX",
    sampleText: "URGENT: Your account has been temporarily restricted. Verify your identity now at http://bit.ly/bank-security-auth",
  },
  {
    title: "Malicious Payloads",
    category: "THREAT TAXONOMY 02",
    badge: "[ATTACHMENT DROPPER]",
    bgColor: "#f3e8ff",
    orbColor: "radial-gradient(circle, rgba(168, 85, 247, 0.45) 0%, rgba(139, 92, 246, 0.1) 70%)",
    description: "Executable attachments, macro-embedded documents, and compressed ZIP archives containing payload downloaders.",
    metrics: "99.4% PRECISION • SHAP VERIFIED",
    sampleText: "Please find attached the payment invoice receipt_9482.zip. Enable macros to review wire transfer details.",
  },
  {
    title: "Unsolicited Marketing",
    category: "THREAT TAXONOMY 03",
    badge: "[COMMERCIAL BULK]",
    bgColor: "#fef3c7",
    orbColor: "radial-gradient(circle, rgba(245, 158, 11, 0.45) 0%, rgba(251, 191, 36, 0.1) 70%)",
    description: "High-volume promotional newsletters, fake discount coupons, and commercial sweepstakes lacking verified opt-in headers.",
    metrics: "98.2% ACCURACY • ZERO-FALSE-HAM",
    sampleText: "SPECIAL PROMO: Save up to 80% on designer footwear with coupon code SAVE80. Click here to claim your reward.",
  },
  {
    title: "Legitimate Correspondence",
    category: "THREAT TAXONOMY 04",
    badge: "[BENIGN ENTERPRISE]",
    bgColor: "#dcfce7",
    orbColor: "radial-gradient(circle, rgba(16, 185, 129, 0.45) 0%, rgba(52, 211, 153, 0.1) 70%)",
    description: "Authentic personal correspondence, organizational memos, and verified enterprise business communications.",
    metrics: "0.01% FALSE POSITIVE RATE",
    sampleText: "Hi Manas, the deployment pipeline passed all integration tests. We are ready to merge the feature branch.",
  },
];

interface CategoriesGridProps {
  onSelectSample: (text: string) => void;
}

export const CategoriesGrid: React.FC<CategoriesGridProps> = ({ onSelectSample }) => {
  return (
    <section id="categories" className="py-24 px-6 md:px-12 max-w-7xl mx-auto bg-[#fcfbf9]">
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
        <div>
          <span className="font-mono-tracked text-xs text-indigo-700 font-semibold block mb-3">
            [TAXONOMY ARCHITECTURE]
          </span>
          <h2 className="font-display text-4xl sm:text-5xl md:text-6xl text-[#171717] tracking-tight">
            Threat <span className="italic font-display font-normal text-indigo-700">Classification</span>
          </h2>
        </div>
        <p className="font-body text-neutral-600 max-w-md text-sm md:text-base leading-relaxed">
          Our four-class deep learning taxonomy evaluates semantic and structural features simultaneously for enterprise precision.
        </p>
      </div>

      {/* 2-Column Staggered Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {CATEGORIES.map((card, idx) => (
          <div
            key={card.title}
            className={`flex flex-col ${idx % 2 === 1 ? "md:mt-16" : ""}`}
          >
            {/* 4:3 Aspect Ratio Card with Intelligent Hover */}
            <div
              onClick={() => onSelectSample(card.sampleText)}
              className="card-hover-container relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#e5e5e5] cursor-pointer group shadow-xs"
              style={{ backgroundColor: card.bgColor }}
            >
              {/* Inner Scaling Background Div with Blurred Center Orb */}
              <div className="card-inner-scale absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-48 h-48 sm:w-64 sm:h-64 rounded-full filter blur-[40px] opacity-75"
                  style={{ background: card.orbColor }}
                />
              </div>

              {/* Card Header Content */}
              <div className="relative z-10 p-6 flex items-start justify-between">
                <span className="font-mono-tracked text-[10px] text-neutral-800 font-bold bg-white/70 backdrop-blur-md px-3 py-1 rounded-full border border-black/5">
                  {card.badge}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/80 backdrop-blur-md flex items-center justify-center text-neutral-800 shadow-xs group-hover:bg-[#171717] group-hover:text-white transition-premium">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Action Pill (Center-Bottom Hover Reveal) */}
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none">
                <div className="action-pill-reveal bg-white text-[#171717] px-6 py-3 rounded-full font-mono-tracked text-xs font-bold shadow-xl border border-black/5 flex items-center gap-2">
                  <span>TEST THIS SCENARIO</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </div>
              </div>
            </div>

            {/* Metadata Below Card */}
            <div className="mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-display text-2xl font-bold text-[#171717]">
                  {card.title}
                </h3>
                <span className="font-mono-tracked text-[11px] text-indigo-700 font-semibold">
                  {card.metrics}
                </span>
              </div>

              <div className="line-draw" />

              <div className="flex items-center justify-between pt-1">
                <span className="font-mono-tracked text-[10px] text-neutral-400">
                  {card.category}
                </span>
                <p className="text-xs text-neutral-600 max-w-xs text-right font-body leading-tight">
                  {card.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
