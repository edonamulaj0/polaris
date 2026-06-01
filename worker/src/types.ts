// worker/src/types.ts
// [WRK-1] Shared types for Worker bindings and data shapes

export interface Env {
  DB: D1Database;
  AI: Ai;
  GUARDIAN_API_KEY: string;
  GOOGLE_CLIENT_ID: string;
  GEMINI_API_KEY?: string; // [ART-2] optional fallback for synthesis
  EDITOR_SECRET?: string; // [WRK-6] server-side editor auth
  ENVIRONMENT: string;
}

export interface UserRow {
  id: string;
  email: string;
  name: string;
  birth_date: string | null;
  birth_locked: number;
  created_at: number;
}

export interface ArticleRow {
  id: string;
  title: string;
  category: 'Technology' | 'Science' | 'Nature';
  image_url: string | null;
  lede: string;
  background: string;
  perspectives: string;
  evidence: string;
  counterpoint: string;
  implications: string;
  conclusion: string;
  source_urls: string; // JSON string
  civility: number;
  stance_for: number;
  stance_against: number;
  stance_neutral: number;
  published_at: number;
  verified: number;
  hidden: number;
  source_type: string;
  submitted_by: string | null;
  submitter_stance: string | null;
  submission_description: string | null;
  verified_by: string | null;
  verified_at: number | null;
}

export interface ArticlePublic {
  id: string;
  title: string;
  category: string;
  imageUrl: string | null;
  article: {
    lede: string;
    background: string;
    perspectives: string;
    evidence: string;
    counterpoint: string;
    implications: string;
    conclusion: string;
  };
  sources: { title: string; url: string; domain: string }[];
  civility: number;
  stanceDistribution: { for: number; against: number; neutral: number };
  publishedAt: number;
  verified: boolean;
  status: 'published' | 'pending';
  sourceType: 'ingest' | 'user_submission';
  submittedBy?: string | null;
  submitterStance?: string | null;
  submissionDescription?: string | null;
  verifiedBy?: string | null;
  verifiedAt?: number | null;
}

export interface VoteRow {
  user_id: string;
  article_id: string;
  stance: 'For' | 'Against' | 'Neutral';
  voted_at: number;
}
