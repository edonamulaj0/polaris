// worker/src/routes/users.ts
// [WRK-2] User API — upsert on sign-in, birthday write-once

import { Hono } from 'hono';
import type { Env, UserRow } from '../types';
import { validateBirthDate } from '../lib/birthdayHelpers';
import { extractBearerToken, verifyGoogleToken } from '../lib/auth';
import { createEditorSession } from '../lib/editorSession';
import { hashEditorPin, verifyEditorPin } from '../lib/pinHash';
import { requireGoogleUser } from '../lib/requireGoogleUser';
import { getUserModerationState } from '../lib/moderationHelpers';
import { userActivityRouter } from './userActivity';
import { createNotification, rowToNotification, type NotificationRow } from '../lib/notifications';

export const usersRouter = new Hono<{ Bindings: Env }>();

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
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);

  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)`,
  )
    .bind(googleUser.sub, googleUser.email, googleUser.name)
    .run();

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(googleUser.sub)
    .first<UserRow>();

  if (!user) {
    return c.json({ error: 'user_not_found' }, 500);
  }

  return c.json({
    id: user.id,
    email: user.email,
    name: user.name,
    birthDateSet: user.birth_locked === 1,
    isEditor: user.is_editor === 1,
  });
});

usersRouter.get('/me/birthday', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  const user = await c.env.DB.prepare(
    `SELECT birth_locked, birth_date FROM users WHERE id = ?`,
  )
    .bind(auth.user.sub)
    .first<{ birth_locked: number; birth_date: string | null }>();

  if (!user) {
    return c.json({ set: false });
  }

  return c.json({
    set: user.birth_locked === 1,
    birthDate: user.birth_date ?? undefined,
  });
});

usersRouter.post('/me/birthday', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  let body: { birthDate?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  if (!body.birthDate) {
    return c.json({ error: 'missing_birth_date' }, 400);
  }

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(auth.user.sub)
    .first<UserRow>();

  if (!user) {
    return c.json({ error: 'user_not_found' }, 404);
  }

  if (user.birth_locked === 1) {
    return c.json({ error: 'birthday_already_set' }, 409);
  }

  const validationError = validateBirthDate(body.birthDate);
  if (validationError) {
    return c.json({ error: validationError }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE users SET birth_date = ?, birth_locked = 1 WHERE id = ?`,
  )
    .bind(body.birthDate, auth.user.sub)
    .run();

  return c.json({ success: true });
});

usersRouter.get('/me/editor-status', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  const user = await c.env.DB.prepare(
    `SELECT is_editor FROM users WHERE id = ?`,
  )
    .bind(auth.user.sub)
    .first<{ is_editor: number }>();

  return c.json({ isEditor: user?.is_editor === 1 });
});

usersRouter.post('/me/editor/register', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  let body: { pin?: string; confirmPin?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const pin = (body.pin ?? '').trim();
  const confirmPin = (body.confirmPin ?? '').trim();

  if (!/^\d{4}$/.test(pin)) {
    return c.json({ error: 'invalid_pin', message: 'PIN must be exactly 4 digits.' }, 400);
  }
  if (pin !== confirmPin) {
    return c.json({ error: 'pin_mismatch', message: 'PINs do not match.' }, 400);
  }

  const existing = await c.env.DB.prepare(
    `SELECT is_editor FROM users WHERE id = ?`,
  )
    .bind(auth.user.sub)
    .first<{ is_editor: number }>();

  if (existing?.is_editor === 1) {
    return c.json({ error: 'already_editor', message: 'You are already registered as an editor.' }, 409);
  }

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)`,
  )
    .bind(auth.user.sub, auth.user.email, auth.user.name)
    .run();

  const pinHash = await hashEditorPin(c.env, auth.user.sub, pin);

  await c.env.DB.prepare(
    `UPDATE users SET is_editor = 1, editor_pin_hash = ? WHERE id = ?`,
  )
    .bind(pinHash, auth.user.sub)
    .run();

  const session = await createEditorSession(c.env, auth.user.sub, auth.user.name);
  return c.json({
    isEditor: true,
    sessionToken: session.token,
    expiresAt: session.expiresAt,
  });
});

usersRouter.post('/me/editor/unlock', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  let body: { pin?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const pin = (body.pin ?? '').trim();
  if (!/^\d{4}$/.test(pin)) {
    return c.json({ error: 'invalid_pin', message: 'PIN must be exactly 4 digits.' }, 400);
  }

  const user = await c.env.DB.prepare(
    `SELECT is_editor, editor_pin_hash FROM users WHERE id = ?`,
  )
    .bind(auth.user.sub)
    .first<{ is_editor: number; editor_pin_hash: string | null }>();

  if (!user || user.is_editor !== 1) {
    return c.json({ error: 'not_editor', message: 'Register as an editor from your profile first.' }, 403);
  }

  const ok = await verifyEditorPin(c.env, auth.user.sub, pin, user.editor_pin_hash);
  if (!ok) {
    return c.json({ error: 'invalid_pin', message: 'Incorrect PIN.' }, 401);
  }

  const session = await createEditorSession(c.env, auth.user.sub, auth.user.name);
  return c.json({
    sessionToken: session.token,
    expiresAt: session.expiresAt,
  });
});

usersRouter.post('/me/editor/reset-pin', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  let body: { pin?: string; confirmPin?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const pin = (body.pin ?? '').trim();
  const confirmPin = (body.confirmPin ?? '').trim();

  if (!/^\d{4}$/.test(pin)) {
    return c.json({ error: 'invalid_pin', message: 'PIN must be exactly 4 digits.' }, 400);
  }
  if (pin !== confirmPin) {
    return c.json({ error: 'pin_mismatch', message: 'PINs do not match.' }, 400);
  }

  const user = await c.env.DB.prepare(
    `SELECT is_editor FROM users WHERE id = ?`,
  )
    .bind(auth.user.sub)
    .first<{ is_editor: number }>();

  if (!user || user.is_editor !== 1) {
    return c.json({ error: 'not_editor', message: 'Register as an editor from your profile first.' }, 403);
  }

  const pinHash = await hashEditorPin(c.env, auth.user.sub, pin);
  await c.env.DB.prepare(
    `UPDATE users SET editor_pin_hash = ? WHERE id = ?`,
  )
    .bind(pinHash, auth.user.sub)
    .run();

  const session = await createEditorSession(c.env, auth.user.sub, auth.user.name);
  return c.json({
    sessionToken: session.token,
    expiresAt: session.expiresAt,
    message: 'Editor PIN updated.',
  });
});

usersRouter.get('/me/notifications', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`,
  )
    .bind(auth.user.sub)
    .all<NotificationRow>();

  const items = (results ?? []).map(rowToNotification);
  const unreadCount = items.filter((i) => !i.read).length;
  return c.json({ items, unreadCount });
});

usersRouter.post('/me/notifications/read-all', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    `UPDATE notifications SET read_at = ? WHERE user_id = ? AND read_at IS NULL`,
  )
    .bind(now, auth.user.sub)
    .run();

  return c.json({ success: true });
});

usersRouter.post('/me/notifications/:id/read', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;

  const id = c.req.param('id');
  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    `UPDATE notifications SET read_at = ? WHERE id = ? AND user_id = ?`,
  )
    .bind(now, id, auth.user.sub)
    .run();

  return c.json({ success: true });
});

usersRouter.get('/:sub/birthday', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;
  if (auth.user.sub !== c.req.param('sub')) {
    return c.json({ error: 'forbidden' }, 403);
  }

  const user = await c.env.DB.prepare(
    `SELECT birth_locked, birth_date FROM users WHERE id = ?`,
  )
    .bind(auth.user.sub)
    .first<{ birth_locked: number; birth_date: string | null }>();

  if (!user) {
    return c.json({ set: false });
  }

  return c.json({
    set: user.birth_locked === 1,
    birthDate: user.birth_date ?? undefined,
  });
});

usersRouter.post('/:sub/birthday', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth) return auth.error;
  if (auth.user.sub !== c.req.param('sub')) {
    return c.json({ error: 'forbidden' }, 403);
  }

  let body: { birthDate?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  if (!body.birthDate) {
    return c.json({ error: 'missing_birth_date' }, 400);
  }

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(auth.user.sub)
    .first<UserRow>();

  if (!user) {
    return c.json({ error: 'user_not_found' }, 404);
  }

  if (user.birth_locked === 1) {
    return c.json({ error: 'birthday_already_set', birthDate: user.birth_date ?? undefined }, 409);
  }

  const validationError = validateBirthDate(body.birthDate);
  if (validationError) {
    return c.json({ error: validationError }, 400);
  }

  await c.env.DB.prepare(
    `UPDATE users SET birth_date = ?, birth_locked = 1 WHERE id = ?`,
  )
    .bind(body.birthDate, auth.user.sub)
    .run();

  return c.json({ success: true });
});
