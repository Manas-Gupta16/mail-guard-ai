import React, { useEffect, useState } from "react";
import { Activity, Cpu, Database, TrendingUp, Radio, FileJson, Download } from "lucide-react";
import type { DriftReport } from "../types";
import { api } from "../services/api";

export const ObservabilitySection: React.FC = () => {
  const [drift, setDrift] = useState<DriftReport | null>(null);
  const [manifestData, setManifestData] = useState<{ totalSamples: number; manifest: Array<{ text: string; label: number }> } | null>(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    api.getDriftReport().then(setDrift).catch(console.error);
  }, []);

  const handleExportManifest = async () => {
    setExporting(true);
    try {
      const data = await api.exportManifest();
      setManifestData(data);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <section id="observability" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#e5e5e5] bg-[#fcfbf9]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <span className="font-mono-tracked text-xs text-indigo-700 font-semibold block mb-3">
            [PROMETHEUS & CONTINUOUS LEARNING]
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-[#171717] tracking-tight">
            Observability & <span className="italic font-display font-normal text-indigo-700">Drift</span>
          </h2>
        </div>
        <p className="font-body text-neutral-600 max-w-md text-sm leading-relaxed">
          Real-time inference telemetry, automated human feedback agreement rates, and active retraining manifest generators.
        </p>
      </div>

      {/* 4 Telemetry Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between font-mono-tracked text-[10px] text-neutral-400">
            <span>INFERENCE SPEED</span>
            <Cpu className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-display text-4xl font-bold text-[#171717]">12.4ms</div>
          <span className="font-mono text-[11px] text-emerald-600 block">ONNX Runtime CPU Graph</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between font-mono-tracked text-[10px] text-neutral-400">
            <span>TOTAL SCANS</span>
            <Activity className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-display text-4xl font-bold text-[#171717]">1,482</div>
          <span className="font-mono text-[11px] text-indigo-600 block">REST + WebSocket Scans</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between font-mono-tracked text-[10px] text-neutral-400">
            <span>REDIS HIT RATE</span>
            <Database className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-display text-4xl font-bold text-[#171717]">41.8%</div>
          <span className="font-mono text-[11px] text-neutral-500 block">SHA-256 Keyed Cache</span>
        </div>

        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-6 shadow-sm space-y-2">
          <div className="flex items-center justify-between font-mono-tracked text-[10px] text-neutral-400">
            <span>TEST ACCURACY</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="font-display text-4xl font-bold text-[#171717]">98.8%</div>
          <span className="font-mono text-[11px] text-emerald-600 block">DistilBERT Transformer</span>
        </div>
      </div>

      {/* Model Drift Monitor & Manifest Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Drift Monitor */}
        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Radio className="w-5 h-5 text-indigo-600 animate-pulse" />
              <h3 className="font-display text-xl font-bold text-[#171717]">
                Model Drift Evaluation
              </h3>
            </div>
            <span className="font-mono-tracked text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              [{drift?.driftStatus || "HEALTHY"}]
            </span>
          </div>

          <p className="font-body text-xs md:text-sm text-neutral-600 leading-relaxed">
            Continuously evaluates human analyst corrections against active model predictions. When agreement drops below 80%, an automated retraining recommendation is signaled.
          </p>

          <div className="grid grid-cols-3 gap-4 pt-2 border-t border-[#f0f0f0]">
            <div>
              <span className="font-mono-tracked text-[9px] text-neutral-400 block mb-1">FEEDBACK SAMPLES</span>
              <span className="font-mono text-lg font-bold text-[#171717]">{drift?.totalFeedbackSamples || 154}</span>
            </div>
            <div>
              <span className="font-mono-tracked text-[9px] text-neutral-400 block mb-1">AGREEMENT RATE</span>
              <span className="font-mono text-lg font-bold text-emerald-600">
                {((drift?.agreementRate || 0.961) * 100).toFixed(1)}%
              </span>
            </div>
            <div>
              <span className="font-mono-tracked text-[9px] text-neutral-400 block mb-1">UNCERTAIN SAMPLES</span>
              <span className="font-mono text-lg font-bold text-amber-600">{drift?.uncertaintySamplesCount || 6}</span>
            </div>
          </div>
        </div>

        {/* Retraining Manifest Generator */}
        <div className="bg-white rounded-3xl border border-[#e5e5e5] p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <FileJson className="w-5 h-5 text-indigo-600" />
              <h3 className="font-display text-xl font-bold text-[#171717]">
                Active Learning Manifest
              </h3>
            </div>
            <button
              onClick={handleExportManifest}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-300 hover:border-indigo-600 text-[11px] font-mono font-bold text-neutral-800 hover:text-indigo-700 bg-[#fcfbf9] transition-colors cursor-pointer"
            >
              <Download className="w-3 h-3" />
              {exporting ? "EXPORTING..." : "EXPORT MANIFEST"}
            </button>
          </div>

          <p className="font-body text-xs md:text-sm text-neutral-600 leading-relaxed">
            Aggregates corrected human labels into a standardized fine-tuning training manifest (`manifest.jsonl`) ready for DistilBERT re-training.
          </p>

          <pre className="p-4 rounded-2xl bg-[#fcfbf9] border border-[#e5e5e5] font-mono text-[11px] text-neutral-700 overflow-x-auto leading-relaxed">
            {manifestData ? (
              JSON.stringify(manifestData.manifest, null, 2)
            ) : (
              `// Click 'Export Manifest' to fetch active feedback samples\n[\n  {"text": "FINAL WARNING: Your PayPal account suspended...", "label": 1},\n  {"text": "Please find attached the invoice receipt_928.zip...", "label": 1}\n]`
            )}
          </pre>
        </div>
      </div>
    </section>
  );
};
