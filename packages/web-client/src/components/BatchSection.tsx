import React, { useState } from "react";
import { Layers, Download, RefreshCw, FileSpreadsheet, ShieldAlert } from "lucide-react";
import type { BatchJob } from "../types";
import { api } from "../services/api";

const SAMPLE_BATCH = [
  "FINAL WARNING: Your PayPal account will be suspended within 24 hours. Verify now at http://bit.ly/paypal-sec",
  "Hi team, let's meet at 2:00 PM for the sprint planning session.",
  "Please find attached the payment invoice #9482. Download payment_9482.zip and enable macros.",
  "Exclusive deal: 70% off luxury shoes. Click here to claim your coupon code now.",
  "Your Google Cloud bill for July is ready for review in the console.",
  "URGENT: Immediate action required to claim your unclaimed Bitcoin lottery reward at http://tinyurl.com/btc-claim",
  "Quarterly OKR review presentation is shared on Google Drive.",
  "Attention: Unusual sign-in attempt from Russia. Confirm password reset immediately at http://bit.ly/pass-auth",
];

export const BatchSection: React.FC = () => {
  const [batchInput, setBatchInput] = useState(SAMPLE_BATCH.join("\n\n"));
  const [loading, setLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<BatchJob | null>(null);

  const handleStartBatch = async () => {
    const rawItems = batchInput
      .split("\n\n")
      .map((s) => s.trim())
      .filter(Boolean);

    if (rawItems.length === 0) return;

    setLoading(true);
    try {
      const { jobId } = await api.submitBatch(rawItems);

      const pollInterval = setInterval(async () => {
        const job = await api.getBatchJob(jobId);
        setActiveJob(job);

        if (job.status === "completed" || job.status === "failed") {
          clearInterval(pollInterval);
          setLoading(false);
        }
      }, 500);
    } catch (err) {
      console.error("Batch error:", err);
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!activeJob) return;
    const blob = new Blob([JSON.stringify(activeJob, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `mailguard-scan-report-${activeJob.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="batch" className="py-24 px-6 md:px-12 max-w-7xl mx-auto border-t border-[#e5e5e5] bg-[#fcfbf9]">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
        <div>
          <span className="font-mono-tracked text-xs text-indigo-700 font-semibold block mb-3">
            [ASYNC PIPELINE WORKER]
          </span>
          <h2 className="font-display text-4xl sm:text-5xl text-[#171717] tracking-tight">
            Batch <span className="italic font-display font-normal text-indigo-700">Ingestion</span>
          </h2>
        </div>
        <p className="font-body text-neutral-600 max-w-md text-sm leading-relaxed">
          Queue 10 to 1,000+ emails for non-blocking asynchronous classification with aggregated risk telemetry and downloadable JSON reports.
        </p>
      </div>

      {/* Input Card */}
      <div className="bg-white rounded-3xl border border-[#e5e5e5] p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <label className="font-mono-tracked text-xs text-neutral-700 font-bold flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-indigo-600" />
            [BULK EMAIL PAYLOAD • SEPARATE EMAILS WITH DOUBLE LINEBREAK]
          </label>
          <span className="font-mono text-xs text-neutral-500">
            {batchInput.split("\n\n").filter(Boolean).length} EMAILS QUEUED
          </span>
        </div>

        <textarea
          rows={5}
          value={batchInput}
          onChange={(e) => setBatchInput(e.target.value)}
          placeholder="Paste bulk emails separated by an empty line..."
          className="w-full bg-[#fcfbf9] border border-[#e5e5e5] rounded-2xl p-4 text-xs font-mono text-[#171717] placeholder:text-neutral-400 focus:outline-none focus:border-indigo-400 leading-relaxed resize-y"
        />

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-[#f0f0f0]">
          <button
            onClick={() => setBatchInput(SAMPLE_BATCH.join("\n\n"))}
            className="text-xs font-mono text-neutral-500 hover:text-indigo-700 cursor-pointer"
          >
            ← RELOAD 8 MIXED TEST EMAILS
          </button>

          <button
            onClick={handleStartBatch}
            disabled={loading || !batchInput.trim()}
            className="bg-[#4338ca] hover:bg-indigo-800 text-white px-6 py-3 rounded-full font-mono-tracked text-xs font-bold shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                PROCESSING BATCH...
              </>
            ) : (
              <>
                <Layers className="w-3.5 h-3.5" />
                START ASYNC BATCH SCAN
              </>
            )}
          </button>
        </div>
      </div>

      {/* Real-time Progress & Results Display */}
      {activeJob && (
        <div className="mt-8 space-y-6">
          <div className="bg-white rounded-3xl border border-[#e5e5e5] p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#f0f0f0] pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-indigo-700 font-bold">{activeJob.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full font-mono-tracked text-[10px] font-bold ${
                    activeJob.status === "completed" ? "bg-emerald-100 text-emerald-800" : "bg-indigo-100 text-indigo-800"
                  }`}>
                    [{activeJob.status.toUpperCase()}]
                  </span>
                </div>
                <h3 className="font-display text-xl font-bold text-[#171717] mt-1">
                  Batch Execution Progress ({activeJob.processed} / {activeJob.total} Scanned)
                </h3>
              </div>

              {activeJob.status === "completed" && (
                <button
                  onClick={handleDownloadReport}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neutral-300 hover:border-indigo-600 text-xs font-mono text-[#171717] hover:text-indigo-700 bg-white shadow-2xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  DOWNLOAD JSON REPORT
                </button>
              )}
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex justify-between font-mono text-xs text-neutral-500 mb-2">
                <span>QUEUE PROCESSING</span>
                <span>{activeJob.progress}%</span>
              </div>
              <div className="w-full bg-neutral-100 h-2.5 rounded-full overflow-hidden border border-neutral-200">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${activeJob.progress}%` }}
                />
              </div>
            </div>

            {/* Telemetry Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-2xl bg-[#fcfbf9] border border-[#e5e5e5]">
                <span className="font-mono-tracked text-[10px] text-neutral-400 block mb-1">TOTAL SCANNED</span>
                <span className="font-display text-2xl font-bold text-[#171717]">{activeJob.summary.total}</span>
              </div>
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/60">
                <span className="font-mono-tracked text-[10px] text-rose-600 block mb-1">THREATS FLAGGED</span>
                <span className="font-display text-2xl font-bold text-rose-600">{activeJob.summary.spamCount}</span>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60">
                <span className="font-mono-tracked text-[10px] text-emerald-600 block mb-1">CLEAN / BENIGN</span>
                <span className="font-display text-2xl font-bold text-emerald-600">{activeJob.summary.hamCount}</span>
              </div>
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/60">
                <span className="font-mono-tracked text-[10px] text-indigo-600 block mb-1">AVG CPU SPEED</span>
                <span className="font-display text-2xl font-bold text-indigo-700">{activeJob.summary.avgLatencyMs}ms</span>
              </div>
            </div>
          </div>

          {/* High-Risk Flagged Items */}
          {activeJob.summary.highRiskFlagged.length > 0 && (
            <div className="bg-white rounded-3xl border border-rose-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-600" />
                <h4 className="font-display text-lg font-bold text-neutral-900">
                  Critical Threats Detected in Batch
                </h4>
              </div>

              <div className="space-y-3">
                {activeJob.summary.highRiskFlagged.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-rose-50/40 border border-rose-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-neutral-400 font-bold">{item.id}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono-tracked font-bold uppercase bg-rose-100 text-rose-800">
                          [{item.threatType.replace("_", " ")}]
                        </span>
                      </div>
                      <p className="text-xs text-neutral-700 font-mono leading-relaxed">{item.textExcerpt}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-mono text-neutral-400 block">RISK SCORE</span>
                      <span className="font-mono text-base font-bold text-rose-600">{item.riskScore} / 100</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
