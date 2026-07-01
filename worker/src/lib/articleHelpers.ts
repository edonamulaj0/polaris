// worker/src/lib/articleHelpers.ts
// [WRK-3] Convert D1 ArticleRow to public API shape

import type { ArticlePublic, ArticleRow } from '../types';

export interface RowToPublicOptions {
  /** Include editor-only fields (submitter metadata, verification audit) */
  includeEditorFields?: boolean;
  /** Google sub of the authenticated viewer — enables owner preview fields */
  viewerSub?: string;
}

export function rowToPublic(row: ArticleRow, opts?: RowToPublicOptions): ArticlePublic {
  let sources: { title: string; url: string; domain: string }[] = []; // [WRK-3]
  try {
    sources = JSON.parse(row.source_urls); // [WRK-3]
  } catch {
    sources = []; // [WRK-3]
  }

  const isOwner = Boolean(opts?.viewerSub && row.submitted_by === opts.viewerSub);
  const verified = row.verified === 1;
  const sourceType = (row.source_type === 'user_submission'
    ? 'user_submission'
    : 'ingest') as ArticlePublic['sourceType'];

  const base: ArticlePublic = {
    id: row.id, // [WRK-3]
    title: row.title, // [WRK-3]
    category: row.category, // [WRK-3]
    imageUrl: row.image_url, // [WRK-3]
    article: {
      lede: row.lede, // [WRK-3]
      background: row.background, // [WRK-3]
      perspectives: row.perspectives, // [WRK-3]
      evidence: row.evidence, // [WRK-3]
      counterpoint: row.counterpoint, // [WRK-3]
      implications: row.implications, // [WRK-3]
      conclusion: row.conclusion, // [WRK-3]
    },
    sources, // [WRK-3]
    civility: row.civility, // [WRK-3]
    stanceDistribution: {
      for: row.stance_for, // [WRK-3]
      against: row.stance_against, // [WRK-3]
      neutral: row.stance_neutral, // [WRK-3]
    },
    publishedAt: row.published_at, // [WRK-3]
    verified, // [WRK-3]
    status: verified ? 'published' : 'pending',
    sourceType,
  };

  if (opts?.includeEditorFields) {
    base.submittedBy = row.submitted_by;
    base.submitterStance = row.submitter_stance;
    base.submissionDescription = row.submission_description;
    base.verifiedBy = row.verified_by;
    base.verifiedAt = row.verified_at;
  } else if (isOwner) {
    base.submittedBy = row.submitted_by;
    base.submitterStance = row.submitter_stance;
    base.submissionDescription = row.submission_description;
  }

  return base;
}

export const VALID_CATEGORIES = [
  'Technology',
  'Science',
  'Nature',
  'Climate & Environment',
  'Human Rights',
  'Immigration & Society',
  'Politics & Governance',
  'Religion & Ethics',
  'Education',
  'Health & Society',
] as const;

export const VALID_STANCES = ['For', 'Against', 'Neutral'] as const;

export function parseLimit(raw: string | undefined): number {
  const n = parseInt(raw || '20', 10); // [WRK-3]
  if (Number.isNaN(n) || n < 1) return 20; // [WRK-3]
  return Math.min(n, 50); // [WRK-3]
}
