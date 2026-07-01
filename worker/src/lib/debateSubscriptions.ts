import { createNotification } from './notifications';
import { ensureDebateExists } from './ensureCuratedArticle';
import { ensureUserRow } from './ensureUser';

function truncate(text: string, max: number): string {
  const t = text.trim();
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

export async function notifyDebateSubscribers(
  db: D1Database,
  debateId: string,
  excludeUserId: string,
  articleTitle: string,
  commenterName: string,
): Promise<void> {
  const { results } = await db
    .prepare(
      `SELECT user_id FROM debate_subscriptions
       WHERE article_id = ? AND user_id != ?`,
    )
    .bind(debateId, excludeUserId)
    .all<{ user_id: string }>();

  const title = truncate(articleTitle || 'Discussion', 72);
  const body = `${commenterName.trim() || 'Someone'} posted a new comment.`;

  for (const row of results ?? []) {
    await createNotification(db, row.user_id, {
      type: 'comments',
      title: `New comment on “${title}”`,
      body,
      discussionId: debateId,
    });
  }
}

export async function subscribeToDebate(
  db: D1Database,
  user: { sub: string; email: string; name: string },
  articleId: string,
): Promise<boolean> {
  const exists = await ensureDebateExists(db, articleId);
  if (!exists) return false;

  await ensureUserRow(db, user);

  await db
    .prepare(
      `INSERT OR IGNORE INTO debate_subscriptions (user_id, article_id) VALUES (?, ?)`,
    )
    .bind(user.sub, articleId)
    .run();
  return true;
}

export async function unsubscribeFromDebate(
  db: D1Database,
  userId: string,
  articleId: string,
): Promise<void> {
  await db
    .prepare(`DELETE FROM debate_subscriptions WHERE user_id = ? AND article_id = ?`)
    .bind(userId, articleId)
    .run();
}

export async function getSubscribedDebateIds(
  db: D1Database,
  userId: string,
): Promise<string[]> {
  const { results } = await db
    .prepare(
      `SELECT article_id as articleId FROM debate_subscriptions
       WHERE user_id = ?
       ORDER BY subscribed_at DESC`,
    )
    .bind(userId)
    .all<{ articleId: string }>();
  return (results ?? []).map((r) => r.articleId);
}
