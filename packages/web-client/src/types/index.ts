export type ThreatType = "ham" | "marketing_spam" | "phishing" | "malware_dropper";
export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface ShapToken {
  token: string;
  score: number;
}

export interface StructuralFeatures {
  url_count: number;
  has_shortened_urls: boolean;
  shortened_url_count: number;
  urgency_score: number;
  phishing_score?: number;
  malware_score?: number;
  marketing_score?: number;
  caps_ratio: number;
  exclamation_count: number;
  question_mark_count: number;
  dollar_sign_count: number;
  has_html_tags: boolean;
  suspicious_attachment_mentioned: boolean;
  word_count: number;
  avg_word_length: number;
  contains_phone_number: boolean;
  contains_currency: boolean;
}

export interface ClassificationResult {
  id: string;
  label: "spam" | "ham";
  confidence: number;
  threatType: ThreatType;
  riskScore: number;
  riskLevel: RiskLevel;
  probabilities: Record<string, number>;
  shapTokens: ShapToken[];
  features: StructuralFeatures;
  explanation: string | null;
  modelVersion: string;
  inferenceTimeMs: number;
  cached: boolean;
  timestamp: string;
}

export interface BatchItemResult {
  id: string;
  textExcerpt: string;
  label: string;
  confidence: number;
  threatType: string;
  riskScore: number;
  riskLevel: string;
  inferenceTimeMs?: number;
  error?: string;
}

export interface BatchJobSummary {
  total: number;
  spamCount: number;
  hamCount: number;
  threatBreakdown: Record<string, number>;
  riskLevelBreakdown: Record<string, number>;
  avgConfidence: number;
  avgLatencyMs: number;
  totalDurationMs?: number;
  highRiskFlagged: Array<{
    id: string;
    threatType: string;
    riskScore: number;
    textExcerpt: string;
  }>;
}

export interface BatchJob {
  id: string;
  status: "pending" | "processing" | "completed" | "failed";
  total: number;
  processed: number;
  progress: number;
  summary: BatchJobSummary;
  results: BatchItemResult[];
  error?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

export interface DriftReport {
  totalFeedbackSamples: number;
  agreementCount?: number;
  disagreementCount?: number;
  agreementRate: number;
  driftScore: number;
  driftStatus: "HEALTHY" | "MONITOR" | "RETRAINING_RECOMMENDED";
  uncertaintySamplesCount: number;
  evaluatedAt?: string;
  message?: string;
}

export interface HealthCheckResponse {
  status: "ok" | "degraded" | "error";
  version: string;
  uptimeSeconds: number;
  checks: {
    mlService: {
      status: string;
      modelLoaded: boolean;
      modelVersion: string;
      latencyMs: number;
    };
    database: { status: string };
    cache: { status: string };
  };
}
