import React from "react";
import { ArrowUpRight, ShieldAlert, ShieldCheck, Mail } from "lucide-react";

interface CategoryCardData {
  id: string;
  title: string;
  category: string;
  badge: string;
  badgeColor: string;
  bgColor: string;
  orbColor: string;
  description: string;
  metrics: string;
  sampleText: string;
  subject: string;
  sender: string;
  threatDetails: {
    flags: string[];
    riskScore: number;
    riskTier: string;
    riskColor: string;
    keySignal: string;
  };
}

const CATEGORIES: CategoryCardData[] = [
  {
    id: "phishing",
    title: "Credential Phishing",
    category: "THREAT TAXONOMY 01",
    badge: "[SOCIAL ENGINEERING]",
    badgeColor: "bg-rose-100 text-rose-800 border-rose-200",
    bgColor: "#fef2f2",
    orbColor: "radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(244, 63, 94, 0.05) 70%)",
    description: "Urgent account suspension alerts, spoofed banking domains, and obfuscated link redirects designed to harvest credentials.",
    metrics: "99.1% RECALL • 12MS ONNX",
    sampleText: "FINAL WARNING: Your PayPal account will be suspended within 24 hours due to suspicious activity. Verify your identity immediately at http://bit.ly/paypal-security-update or your funds will be permanently frozen!",
    subject: "URGENT: Your account has been restricted",
    sender: "security@paypal-auth-verify.com",
    threatDetails: {
      flags: ["Shortened URL (bit.ly)", "Urgency Keyword", "Suspended Threat"],
      riskScore: 89.5,
      riskTier: "CRITICAL",
      riskColor: "text-rose-600",
      keySignal: "Obfuscated Redirect Destination",
    },
  },
  {
    id: "malware",
    title: "Malicious Payloads",
    category: "THREAT TAXONOMY 02",
    badge: "[ATTACHMENT DROPPER]",
    badgeColor: "bg-purple-100 text-purple-800 border-purple-200",
    bgColor: "#faf5ff",
    orbColor: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(139, 92, 246, 0.05) 70%)",
    description: "Executable attachments, macro-embedded documents, and compressed ZIP archives containing payload downloaders.",
    metrics: "99.4% PRECISION • SHAP VERIFIED",
    sampleText: "Please find attached the overdue payment invoice #INV-92842. Download payment_receipt_928.zip executable and enable macros to review wire transfer instructions.",
    subject: "Invoice #INV-9482 Overdue Payment",
    sender: "billing@acme-invoicing-service.net",
    threatDetails: {
      flags: ["Macro Executable", "Compressed ZIP Archive", "Wire Transfer Trigger"],
      riskScore: 95.0,
      riskTier: "CRITICAL",
      riskColor: "text-purple-600",
      keySignal: "Embedded Macro Dropper Script",
    },
  },
  {
    id: "marketing",
    title: "Unsolicited Marketing",
    category: "THREAT TAXONOMY 03",
    badge: "[COMMERCIAL BULK]",
    badgeColor: "bg-amber-100 text-amber-800 border-amber-200",
    bgColor: "#fffbeb",
    orbColor: "radial-gradient(circle, rgba(245, 158, 11, 0.25) 0%, rgba(251, 191, 36, 0.05) 70%)",
    description: "High-volume promotional newsletters, fake discount coupons, and commercial sweepstakes lacking verified opt-in headers.",
    metrics: "98.2% ACCURACY • ZERO-FALSE-HAM",
    sampleText: "SPECIAL PROMO: Save up to 80% on designer footwear with coupon code SAVE80. Click here to claim your reward. To opt out, click unsubscribe.",
    subject: "Flash Sale: Up to 80% OFF Luxury Items",
    sender: "promo@discount-deals-daily.xyz",
    threatDetails: {
      flags: ["Commercial Keywords", "Discount Triggers", "Unverified Bulk Header"],
      riskScore: 68.0,
      riskTier: "MEDIUM",
      riskColor: "text-amber-600",
      keySignal: "High-Frequency Promotional Patterns",
    },
  },
  {
    id: "legitimate",
    title: "Legitimate Correspondence",
    category: "THREAT TAXONOMY 04",
    badge: "[BENIGN ENTERPRISE]",
    badgeColor: "bg-emerald-100 text-emerald-800 border-emerald-200",
    bgColor: "#f0fdf4",
    orbColor: "radial-gradient(circle, rgba(168, 85, 247, 0.25) 0%, rgba(52, 211, 153, 0.05) 70%)",
    description: "Authentic personal correspondence, organizational memos, and verified enterprise business communications.",
    metrics: "0.01% FALSE POSITIVE RATE",
    sampleText: "Hi Manas, thanks for sending over the quarterly architecture report. The engineering team reviewed the microservices diagram and we are ready to merge.",
    subject: "Quarterly Architecture & Deployment Review",
    sender: "alex.morris@enterprise-corp.com",
    threatDetails: {
      flags: ["SPF: PASS", "DKIM: VALID", "TLS 1.3 Verified"],
      riskScore: 4.2,
      riskTier: "LOW",
      riskColor: "text-emerald-600",
      keySignal: "Authentic Enterprise Communication",
    },
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
          Our four-class deep learning taxonomy inspects structural signatures, NLP token embeddings, and authentication headers simultaneously.
        </p>
      </div>

      {/* 2-Column Staggered Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {CATEGORIES.map((card, idx) => (
          <div
            key={card.title}
            className={`flex flex-col ${idx % 2 === 1 ? "md:mt-16" : ""}`}
          >
            {/* 4:3 Aspect Ratio Card with Rich Meaningful Threat Inspection Simulation */}
            <div
              onClick={() => onSelectSample(card.sampleText)}
              className="card-hover-container relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#e5e5e5] cursor-pointer group shadow-sm flex flex-col justify-between p-6 transition-all"
              style={{ backgroundColor: card.bgColor }}
            >
              {/* Inner Scaling Background Orb */}
              <div className="card-inner-scale absolute inset-0 flex items-center justify-center pointer-events-none">
                <div
                  className="w-56 h-56 rounded-full filter blur-[50px] opacity-75"
                  style={{ background: card.orbColor }}
                />
              </div>

              {/* Card Top: Taxonomy Badge & Arrow */}
              <div className="relative z-10 flex items-center justify-between">
                <span className={`font-mono-tracked text-[10px] font-bold px-3 py-1 rounded-full border ${card.badgeColor}`}>
                  {card.badge}
                </span>
                <div className="w-8 h-8 rounded-full bg-white/90 shadow-2xs border border-black/5 flex items-center justify-center text-neutral-800 group-hover:bg-[#171717] group-hover:text-white transition-premium">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>

              {/* Card Center: Meaningful Email Header & Signal Simulation */}
              <div className="relative z-10 bg-white/90 backdrop-blur-md rounded-xl p-4 border border-black/5 shadow-2xs space-y-2.5">
                {/* Subject & Sender */}
                <div className="flex items-start justify-between gap-2 border-b border-neutral-100 pb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-[11px] font-bold text-neutral-900 truncate">
                      <Mail className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                      <span className="truncate">{card.subject}</span>
                    </div>
                    <div className="text-[10px] text-neutral-500 font-mono truncate mt-0.5">
                      From: {card.sender}
                    </div>
                  </div>
                  <span className={`font-mono font-bold text-xs shrink-0 ${card.threatDetails.riskColor}`}>
                    {card.threatDetails.riskScore} <span className="text-[9px] font-normal text-neutral-400">/ 100</span>
                  </span>
                </div>

                {/* Extracted Flags Badges */}
                <div className="flex flex-wrap gap-1.5">
                  {card.threatDetails.flags.map((flag, fIdx) => (
                    <span
                      key={fIdx}
                      className="text-[9px] font-mono px-2 py-0.5 rounded bg-neutral-100 text-neutral-700 font-medium"
                    >
                      {flag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card Bottom: Threat Signal Indicator */}
              <div className="relative z-10 flex items-center justify-between text-[11px] font-mono text-neutral-600">
                <span className="flex items-center gap-1.5">
                  {card.id === "legitimate" ? (
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  ) : (
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                  )}
                  <span>{card.threatDetails.keySignal}</span>
                </span>
                <span className="font-bold text-indigo-700 group-hover:underline">
                  CLICK TO SCAN →
                </span>
              </div>

              {/* Action Pill (Center Hover Reveal) */}
              <div className="absolute inset-0 z-20 flex items-center justify-center p-6 pointer-events-none">
                <div className="action-pill-reveal bg-[#171717] text-white px-6 py-3 rounded-full font-mono-tracked text-xs font-bold shadow-2xl flex items-center gap-2 border border-white/20">
                  <span>LOAD THIS SCENARIO</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-indigo-400" />
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
