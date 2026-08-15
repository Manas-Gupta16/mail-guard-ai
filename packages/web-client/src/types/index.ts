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
