// worker/src/lib/userActivityHelpers.ts
// Server-side user activity — saved debates, stances (votes), activity feed

import type { D1Database } from '@cloudflare/workers-types';
import { ensureDebateExists } from './ensureCuratedArticle';
import { getSubscribedDebateIds } from './debateSubscriptions';

const VALID_STANCES = ['For', 'Against', 'Neutral'] as const;
const ACTIVITY_LIMIT = 200;

export type ClientActivityEntry = {
  id?: string;
  type: string;
  title?: string;
  detail?: string;
  discussionId?: string;
  at?: number;
};

export type ClientSyncPayload = {
  savedDebateIds?: string[];
  stances?: { discussionId: string; stance: string; category?: string }[];
  activity?: ClientActivityEntry[];
};

export async function getUserActivityData(db: D1Database, userId: string) {
  const { results: savedRows } = await db
    .prepare(
      `SELECT article_id as articleId, saved_at as savedAt
       FROM user_saved_debates
       WHERE user_id = ?
       ORDER BY saved_at DESC`,
    )
    .bind(userId)
    .all<{ articleId: string; savedAt: number }>();

  const { results: voteRows } = await db
    .prepare(
      `SELECT v.article_id as discussionId, v.stance, v.voted_at as votedAt,
              a.title, a.category
       FROM votes v
       LEFT JOIN articles a ON a.id = v.article_id
       WHERE v.user_id = ?
       ORDER BY v.voted_at DESC
       LIMIT 400`,
    )
    .bind(userId)
    .all<{
      discussionId: string;
      stance: string;
      votedAt: number;
      title: string | null;
      category: string | null;
    }>();

  const { results: commentRows } = await db
    .prepare(
      `SELECT c.debate_id as discussionId, c.body, c.created_at as createdAt,
              a.title, a.category
       FROM comments c
       LEFT JOIN articles a ON a.id = c.debate_id
       WHERE c.user_id = ?
         AND c.moderation_status IN ('visible', 'flagged')
         AND c.deleted_at IS NULL
       ORDER BY c.created_at DESC
       LIMIT 200`,
    )
    .bind(userId)
    .all<{
      discussionId: string;
      body: string;
      createdAt: number;
      title: string | null;
      category: string | null;
    }>();

  const { results: activityRows } = await db
    .prepare(
      `SELECT id, activity_type as type, title, detail,
              discussion_id as discussionId, created_at as createdAt
       FROM user_activity
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT ?`,
    )
    .bind(userId, ACTIVITY_LIMIT)
    .all<{
      id: string;
      type: string;
      title: string | null;
      detail: string | null;
      discussionId: string | null;
      createdAt: number;
    }>();

  const topicCount = await db
    .prepare(`SELECT COUNT(*) as n FROM articles WHERE submitted_by = ?`)
    .bind(userId)
    .first<{ n: number }>();

  const upvoteCount = await db
    .prepare(
      `SELECT COUNT(*) as n FROM user_activity
       WHERE user_id = ? AND activity_type = 'vote' AND title LIKE 'Upvoted%'`,
    )
    .bind(userId)
    .first<{ n: number }>();

  const downvoteCount = await db
    .prepare(
      `SELECT COUNT(*) as n FROM user_activity
       WHERE user_id = ? AND activity_type = 'vote' AND title LIKE 'Downvoted%'`,
    )
    .bind(userId)
    .first<{ n: number }>();

  const savedDebateIds = (savedRows ?? []).map((r) => r.articleId);
  const subscribedDebateIds = await getSubscribedDebateIds(db, userId);

  const stanceHistory = (voteRows ?? []).map((r) => ({
    discussionId: r.discussionId,
    stance: r.stance,
    category: r.category ?? 'Politics',
    title: r.title ?? undefined,
    at: r.votedAt * 1000,
  }));

  const commentHistory = (commentRows ?? []).map((r) => ({
    discussionId: r.discussionId,
    title: r.title ?? 'Discussion',
    category: r.category ?? 'Politics',
    body: r.body,
    at: r.createdAt * 1000,
  }));

  const activityFeed = (activityRows ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    title: r.title ?? undefined,
    detail: r.detail ?? undefined,
    discussionId: r.discussionId ?? undefined,
    at: r.createdAt * 1000,
  }));

  const joinedSet = new Set<string>();
  for (const id of savedDebateIds) joinedSet.add(id);
  for (const r of voteRows ?? []) joinedSet.add(r.discussionId);
  for (const r of commentRows ?? []) joinedSet.add(r.discussionId);

  return {
    savedDebateIds,
    subscribedDebateIds,
    stanceHistory,
    commentHistory,
    activityFeed,
    joinedDiscussionIds: [...joinedSet],
    stats: {
      postsCreated: topicCount?.n ?? 0,
      likesGiven: savedDebateIds.length,
      upvotesGiven: upvoteCount?.n ?? 0,
      downvotesGiven: downvoteCount?.n ?? 0,
    },
  };
}

export async function syncClientActivity(
  db: D1Database,
  userId: string,
  payload: ClientSyncPayload,
): Promise<void> {
  for (const articleId of payload.savedDebateIds ?? []) {
    if (!articleId?.trim()) continue;
    const exists = await ensureDebateExists(db, articleId);
    if (!exists) continue;
    await db
      .prepare(
        `INSERT OR IGNORE INTO user_saved_debates (user_id, article_id) VALUES (?, ?)`,
      )
      .bind(userId, articleId)
      .run();
  }

  for (const s of payload.stances ?? []) {
    if (!s.discussionId?.trim() || !VALID_STANCES.includes(s.stance as (typeof VALID_STANCES)[number])) {
      continue;
    }
    const exists = await ensureDebateExists(db, s.discussionId);
    if (!exists) continue;
    await db
      .prepare(
        `INSERT INTO votes (user_id, article_id, stance) VALUES (?, ?, ?)
         ON CONFLICT(user_id, article_id) DO NOTHING`,
      )
      .bind(userId, s.discussionId, s.stance)
      .run();
  }

  for (const entry of payload.activity ?? []) {
    if (!entry.type?.trim()) continue;
    const id = entry.id?.trim() || `srv-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const createdAt = entry.at ? Math.floor(entry.at / 1000) : Math.floor(Date.now() / 1000);
    await db
      .prepare(
        `INSERT OR IGNORE INTO user_activity
         (id, user_id, activity_type, title, detail, discussion_id, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      )
      .bind(
        id,
        userId,
        entry.type,
        entry.title ?? null,
        entry.detail ?? null,
        entry.discussionId ?? null,
        createdAt,
      )
      .run();
  }
}

export async function saveDebateForUser(
  db: D1Database,
  userId: string,
  articleId: string,
): Promise<boolean> {
  const exists = await ensureDebateExists(db, articleId);
  if (!exists) return false;

  await db
    .prepare(
      `INSERT OR IGNORE INTO user_saved_debates (user_id, article_id) VALUES (?, ?)`,
    )
    .bind(userId, articleId)
    .run();

  return true;
}

export async function unsaveDebateForUser(
  db: D1Database,
  userId: string,
  articleId: string,
): Promise<void> {
  await db
    .prepare(`DELETE FROM user_saved_debates WHERE user_id = ? AND article_id = ?`)
    .bind(userId, articleId)
    .run();
}

export async function appendUserActivity(
  db: D1Database,
  userId: string,
  entry: ClientActivityEntry,
): Promise<{ id: string }> {
  const id = entry.id?.trim() || `act-${userId}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = entry.at ? Math.floor(entry.at / 1000) : Math.floor(Date.now() / 1000);

  await db
    .prepare(
      `INSERT OR IGNORE INTO user_activity
       (id, user_id, activity_type, title, detail, discussion_id, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .bind(
      id,
      userId,
      entry.type,
      entry.title ?? null,
      entry.detail ?? null,
      entry.discussionId ?? null,
      createdAt,
    )
    .run();

  // Trim old rows beyond limit (best-effort)
  await db
    .prepare(
      `DELETE FROM user_activity
       WHERE user_id = ? AND id NOT IN (
         SELECT id FROM user_activity
         WHERE user_id = ?
         ORDER BY created_at DESC
         LIMIT ?
       )`,
    )
    .bind(userId, userId, ACTIVITY_LIMIT)
    .run();

  return { id };
}
