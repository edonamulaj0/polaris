// worker/src/lib/ensureCuratedArticle.ts
// Auto-provision article rows in D1 when comments are accessed

import type { D1Database } from '@cloudflare/workers-types';
import { CURATED_SEEDS } from '../data/curatedSeeds';

export function isCuratedDebateId(id: string): boolean {
  return /^curated-\d{2}$/.test(id);
}

/** Insert curated article if missing. Returns true when the debate id is known. */
export async function ensureCuratedArticle(db: D1Database, id: string): Promise<boolean> {
  const seed = CURATED_SEEDS[id];
  if (!seed) return false;

  await db
    .prepare(
      `INSERT OR IGNORE INTO articles (
        id, title, category, image_url,
        lede, background, perspectives, evidence, counterpoint, implications, conclusion,
        source_urls, civility, stance_for, stance_against, stance_neutral,
        published_at, verified, hidden, source_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'curated')`,
    )
    .bind(
      seed.id,
      seed.title,
      seed.category,
      seed.imageUrl,
      seed.lede,
      seed.background,
      seed.perspectives,
      seed.evidence,
      seed.counterpoint,
      seed.implications,
      seed.conclusion,
      seed.sourceUrls,
      seed.civility,
      seed.stanceFor,
      seed.stanceAgainst,
      seed.stanceNeutral,
      seed.publishedAt,
    )
    .run();

  return true;
}

/** Minimal stub so feed / ingest debate ids can receive comments. */
async function ensureStubArticle(db: D1Database, debateId: string): Promise<boolean> {
  const title = debateId.replace(/[-_]/g, ' ').slice(0, 120) || 'Discussion';
  const now = Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT OR IGNORE INTO articles (
        id, title, category, image_url,
        lede, background, perspectives, evidence, counterpoint, implications, conclusion,
        source_urls, civility, stance_for, stance_against, stance_neutral,
        published_at, verified, hidden, source_type
      ) VALUES (?, ?, 'Technology', NULL, ?, ?, ?, ?, ?, ?, ?, '[]', 75, 33, 33, 34, ?, 1, 0, 'ingest')`,
    )
    .bind(
      debateId,
      title,
      'Discussion opened for community comments.',
      '',
      '',
      '',
      '',
      '',
      '',
      now,
    )
    .run();

  return Boolean(
    await db.prepare(`SELECT id FROM articles WHERE id = ?`).bind(debateId).first(),
  );
}

export async function ensureDebateExists(db: D1Database, debateId: string): Promise<boolean> {
  const existing = await db
    .prepare(`SELECT id FROM articles WHERE id = ?`)
    .bind(debateId)
    .first<{ id: string }>();

  if (existing) return true;

  if (isCuratedDebateId(debateId)) {
    await ensureCuratedArticle(db, debateId);
    return Boolean(
      await db.prepare(`SELECT id FROM articles WHERE id = ?`).bind(debateId).first(),
    );
  }

  return ensureStubArticle(db, debateId);
}
