// worker/src/lib/articleHelpers.ts
// [WRK-3] Convert D1 ArticleRow to public API shape

import type { ArticlePublic, ArticleRow } from '../types';

export function rowToPublic(row: ArticleRow): ArticlePublic {
  let sources: { title: string; url: string; domain: string }[] = []; // [WRK-3]
  try {
    sources = JSON.parse(row.source_urls); // [WRK-3]
  } catch {
    sources = []; // [WRK-3]
  }

  return {
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
    verified: row.verified === 1, // [WRK-3]
  };
}

export const VALID_CATEGORIES = ['Technology', 'Science', 'Nature'] as const; // [WRK-3]

export function parseLimit(raw: string | undefined): number {
  const n = parseInt(raw || '20', 10); // [WRK-3]
  if (Number.isNaN(n) || n < 1) return 20; // [WRK-3]
  return Math.min(n, 50); // [WRK-3]
}
