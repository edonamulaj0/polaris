// worker/src/routes/users.ts
// [WRK-2] User API — upsert on sign-in, birthday write-once

import { Hono } from 'hono';
import type { Env, UserRow } from '../types';
import { validateBirthDate } from '../lib/birthdayHelpers';
import { extractBearerToken, verifyGoogleToken } from '../lib/auth';
import { getUserModerationState } from '../lib/moderationHelpers';
import { userActivityRouter } from './userActivity';

export const usersRouter = new Hono<{ Bindings: Env }>(); // [WRK-2]

usersRouter.route('/me', userActivityRouter);

usersRouter.get('/me/moderation-state', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  try {
    const user = await verifyGoogleToken(token, c.env);
    const state = await getUserModerationState(c.env.DB, user.sub);
    return c.json({
      userId: user.sub,
      strikeCount: state.strikeCount,
      commentBlocked: state.commentBlocked,
      banned: state.banned,
      socialBanned: state.socialBanned,
      warningCount: state.warningCount,
      timeoutCount: state.timeoutCount,
      timeoutUntil: state.timeoutUntil,
      canComment: state.canComment,
      canPostTopics: state.canPostTopics,
      canVote: state.canVote,
    });
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }
});

usersRouter.get('/me/profile', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const userRow = await c.env.DB.prepare(`SELECT id, email, name, created_at FROM users WHERE id = ?`)
    .bind(googleUser.sub)
    .first<{ id: string; email: string; name: string; created_at: number }>();

  const commentStats = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM comments
     WHERE user_id = ? AND moderation_status IN ('visible', 'flagged') AND deleted_at IS NULL`,
  )
    .bind(googleUser.sub)
    .first<{ n: number }>();

  const voteStats = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM votes WHERE user_id = ?`,
  )
    .bind(googleUser.sub)
    .first<{ n: number }>();

  const topicStats = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM articles WHERE submitted_by = ?`,
  )
    .bind(googleUser.sub)
    .first<{ n: number }>();

  const { results: recentComments } = await c.env.DB.prepare(
    `SELECT c.id, c.debate_id as debateId, c.body, c.created_at as createdAt,
            a.title as debateTitle, a.category
     FROM comments c
     JOIN articles a ON a.id = c.debate_id
     WHERE c.user_id = ?
       AND c.moderation_status IN ('visible', 'flagged')
       AND c.deleted_at IS NULL
     ORDER BY c.created_at DESC
     LIMIT 25`,
  )
    .bind(googleUser.sub)
    .all<{
      id: string;
      debateId: string;
      body: string;
      createdAt: number;
      debateTitle: string;
      category: string;
    }>();

  const { results: recentVotes } = await c.env.DB.prepare(
    `SELECT v.article_id as articleId, v.stance, v.voted_at as votedAt,
            a.title, a.category
     FROM votes v
     JOIN articles a ON a.id = v.article_id
     WHERE v.user_id = ?
     ORDER BY v.voted_at DESC
     LIMIT 25`,
  )
    .bind(googleUser.sub)
    .all<{
      articleId: string;
      stance: string;
      votedAt: number;
      title: string;
      category: string;
    }>();

  const { results: recentTopics } = await c.env.DB.prepare(
    `SELECT id, title, category, verified, published_at as publishedAt
     FROM articles
     WHERE submitted_by = ?
     ORDER BY published_at DESC
     LIMIT 25`,
  )
    .bind(googleUser.sub)
    .all<{
      id: string;
      title: string;
      category: string;
      verified: number;
      publishedAt: number;
    }>();

  return c.json({
    user: {
      id: userRow?.id ?? googleUser.sub,
      email: userRow?.email ?? googleUser.email,
      name: userRow?.name ?? googleUser.name,
      memberSince: userRow?.created_at ?? null,
    },
    stats: {
      comments: commentStats?.n ?? 0,
      votes: voteStats?.n ?? 0,
      topicsSubmitted: topicStats?.n ?? 0,
    },
    recentComments: recentComments ?? [],
    recentVotes: recentVotes ?? [],
    recentTopics: (recentTopics ?? []).map((t) => ({
      ...t,
      verified: t.verified === 1,
    })),
  });
});

usersRouter.post('/', async (c) => {
  const body = await c.req.json<{ sub: string; email: string; name: string }>(); // [WRK-2]

  if (!body.sub || !body.email || !body.name) {
    return c.json({ error: 'missing_fields' }, 400); // [WRK-2]
  }

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)`,
  )
    .bind(body.sub, body.email, body.name)
    .run(); // [WRK-2]

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(body.sub)
    .first<UserRow>(); // [WRK-2]

  if (!user) {
    return c.json({ error: 'user_not_found' }, 500); // [WRK-2]
  }

  return c.json({
    id: user.id, // [WRK-2]
    email: user.email, // [WRK-2]
    name: user.name, // [WRK-2]
    birthDateSet: user.birth_locked === 1, // [WRK-2]
  });
});

usersRouter.get('/:sub/birthday', async (c) => {
  const sub = c.req.param('sub'); // [WRK-2]

  const user = await c.env.DB.prepare(
    `SELECT birth_locked, birth_date FROM users WHERE id = ?`,
  )
    .bind(sub)
    .first<{ birth_locked: number; birth_date: string | null }>(); // [WRK-2]

  if (!user) {
    return c.json({ set: false }); // [WRK-2]
  }

  return c.json({
    set: user.birth_locked === 1, // [WRK-2]
    birthDate: user.birth_date ?? undefined, // [WRK-2]
  });
});

usersRouter.post('/:sub/birthday', async (c) => {
  const sub = c.req.param('sub'); // [WRK-2]
  const body = await c.req.json<{ birthDate: string }>(); // [WRK-2]

  if (!body.birthDate) {
    return c.json({ error: 'missing_birth_date' }, 400); // [WRK-2]
  }

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(sub)
    .first<UserRow>(); // [WRK-2]

  if (!user) {
    return c.json({ error: 'user_not_found' }, 404); // [WRK-2]
  }

  if (user.birth_locked === 1) {
    return c.json({ error: 'birthday_already_set' }, 409); // [WRK-2]
  }

  const validationError = validateBirthDate(body.birthDate); // [WRK-2]
  if (validationError) {
    return c.json({ error: validationError }, 400); // [WRK-2]
  }

  await c.env.DB.prepare(
    `UPDATE users SET birth_date = ?, birth_locked = 1 WHERE id = ?`,
  )
    .bind(body.birthDate, sub)
    .run(); // [WRK-2]

  return c.json({ success: true }); // [WRK-2]
});
