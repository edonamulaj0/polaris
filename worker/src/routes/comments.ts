// Comments API — threaded comments with inline AI moderation

import { Hono, type Context } from 'hono';
import type { Env } from '../types';
import type { CommentRow } from '../types/moderation';
import { verifyGoogleToken, extractBearerToken } from '../lib/auth';
import { moderateContent } from '../lib/moderationBot';
import {
  applyModerationPenalty,
  checkRateLimit,
  formatTimeoutMessage,
  generateId,
  getUserModerationState,
  insertCommentFlags,
  issueStrike,
} from '../lib/moderationHelpers';
import { ensureDebateExists } from '../lib/ensureCuratedArticle';
import { ensureUserRow } from '../lib/ensureUser';
import { createNotification } from '../lib/notifications';
import { notifyDebateSubscribers } from '../lib/debateSubscriptions';

async function processCommentModeration(
  env: Env,
  opts: {
    commentId: string;
    debateId: string;
    userSub: string;
    userName: string;
    text: string;
    parentId: string | null;
  },
): Promise<void> {
  const { commentId, debateId, userSub, userName, text } = opts;
  try {
    const moderation = await moderateContent(text, env);

    if (moderation.action === 'allow') {
      const article = await env.DB.prepare(`SELECT title FROM articles WHERE id = ?`)
        .bind(debateId)
        .first<{ title: string }>();
      try {
        await notifyDebateSubscribers(
          env.DB,
          debateId,
          userSub,
          article?.title ?? 'Discussion',
          userName,
        );
      } catch (notifyErr) {
        console.error('notifyDebateSubscribers failed:', notifyErr);
      }
      return;
    }

    if (moderation.action === 'flag') {
      await env.DB.prepare(`UPDATE comments SET moderation_status = 'flagged' WHERE id = ?`)
        .bind(commentId)
        .run();
      await insertCommentFlags(env.DB, commentId, moderation, 'bot');
      const penalty = await applyModerationPenalty(env.DB, env, userSub, commentId, moderation);
      try {
        await createNotification(env.DB, userSub, {
          type: 'moderation',
          title: 'Comment flagged for review',
          body: penalty.message ?? 'Your comment is hidden until an editor reviews it.',
          discussionId: debateId,
        });
      } catch (notifyErr) {
        console.error('moderation notification failed:', notifyErr);
      }
      return;
    }

    const nowDel = Math.floor(Date.now() / 1000);
    await env.DB.prepare(
      `UPDATE comments SET moderation_status = 'auto_deleted', deleted_at = ?, deleted_by = 'bot' WHERE id = ?`,
    )
      .bind(nowDel, commentId)
      .run();
    await insertCommentFlags(env.DB, commentId, moderation, 'bot');
    await issueStrike(
      env.DB,
      userSub,
      commentId,
      moderation.primaryReason ?? 'Comment removed by moderation bot.',
      'bot',
    );
    const penalty = await applyModerationPenalty(env.DB, env, userSub, commentId, moderation);
    try {
      await createNotification(env.DB, userSub, {
        type: 'moderation',
        title: 'Comment removed by moderation',
        body: penalty.message ?? 'Your comment was removed for violating community guidelines.',
        discussionId: debateId,
      });
    } catch (notifyErr) {
      console.error('moderation notification failed:', notifyErr);
    }
  } catch (err) {
    console.error('Background comment moderation failed:', err);
  }
}

export const commentsRouter = new Hono<{ Bindings: Env }>();

async function requireGoogleUser(c: Context<{ Bindings: Env }>) {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return { error: c.json({ error: 'unauthorized' }, 401) as Response };
  try {
    const user = await verifyGoogleToken(token, c.env);
    return { user };
  } catch {
    return { error: c.json({ error: 'invalid_token' }, 401) as Response };
  }
}

async function ensureUserExists(
  c: Context<{ Bindings: Env }>,
  sub: string,
  email: string,
  name: string,
) {
  await ensureUserRow(c.env.DB, { sub, email, name });
}

function rowToPublic(
  row: CommentRow & { username?: string; reply_count?: number },
  viewerId?: string,
) {
  const isDeleted =
    row.deleted_at != null ||
    row.moderation_status === 'editor_deleted' ||
    row.moderation_status === 'auto_deleted';

  if (row.moderation_status === 'flagged') {
    if (viewerId && row.user_id === viewerId) {
      return {
        id: row.id,
        body: '[Your comment is pending moderator review.]',
        userId: row.user_id,
        username: row.username ?? 'User',
        parentId: row.parent_id,
        createdAt: row.created_at,
        replyCount: row.reply_count ?? 0,
        pendingReview: true,
      };
    }
    return null;
  }

  if (row.moderation_status === 'auto_deleted') {
    if (viewerId && row.user_id === viewerId) {
      return {
        id: row.id,
        body: '[Your comment was removed by the moderation system.]',
        userId: row.user_id,
        username: row.username ?? 'User',
        parentId: row.parent_id,
        createdAt: row.created_at,
        replyCount: row.reply_count ?? 0,
        removed: true,
        removedByBot: true,
      };
    }
    return null;
  }

  if (isDeleted) {
    return {
      id: row.id,
      body: '[This comment was removed]',
      userId: null,
      username: null,
      parentId: row.parent_id,
      createdAt: row.created_at,
      replyCount: row.reply_count ?? 0,
      removed: true,
    };
  }

  return {
    id: row.id,
    body: row.body,
    userId: row.user_id,
    username: row.username ?? 'User',
    parentId: row.parent_id,
    createdAt: row.created_at,
    replyCount: row.reply_count ?? 0,
  };
}

commentsRouter.get('/:debateId/comments', async (c) => {
  try {
  const debateId = c.req.param('debateId');
  const cursor = c.req.query('cursor');
  const limitRaw = parseInt(c.req.query('limit') || '20', 10);
  const limit = Math.min(Math.max(Number.isNaN(limitRaw) ? 20 : limitRaw, 1), 50);

  let viewerId: string | undefined;
  const token = extractBearerToken(c.req.header('Authorization'));
  if (token) {
    try {
      const user = await verifyGoogleToken(token, c.env);
      viewerId = user.sub;
    } catch {
      // optional auth for viewer-specific messaging
    }
  }

  const article = await c.env.DB.prepare(`SELECT id FROM articles WHERE id = ?`)
    .bind(debateId)
    .first();
  if (!article) {
    const ensured = await ensureDebateExists(c.env.DB, debateId);
    if (!ensured) {
      return c.json({ error: 'not_found' }, 404);
    }
  }

  let topLevelQuery = `
    SELECT c.*, u.name as username,
      (SELECT COUNT(*) FROM comments r WHERE r.parent_id = c.id
        AND r.moderation_status IN ('visible', 'flagged', 'editor_deleted', 'auto_deleted')
        AND (r.deleted_at IS NULL OR r.moderation_status = 'editor_deleted' OR r.moderation_status = 'auto_deleted')
      ) as reply_count
    FROM comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.debate_id = ? AND c.parent_id IS NULL
      AND c.moderation_status IN ('visible', 'flagged', 'editor_deleted', 'auto_deleted')
  `;
  const params: (string | number)[] = [debateId];

  if (cursor) {
    const cursorRow = await c.env.DB.prepare(`SELECT created_at FROM comments WHERE id = ?`)
      .bind(cursor)
      .first<{ created_at: number }>();
    if (cursorRow) {
      topLevelQuery += ` AND c.created_at < ?`;
      params.push(cursorRow.created_at);
    }
  }

  topLevelQuery += ` ORDER BY c.created_at DESC LIMIT ?`;
  params.push(limit + 1);

  const { results: topLevel } = await c.env.DB.prepare(topLevelQuery)
    .bind(...params)
    .all<CommentRow & { username: string; reply_count: number }>();

  const hasMore = topLevel.length > limit;
  const topSlice = topLevel.slice(0, limit);
  const topIds = topSlice.map((r) => r.id);

  let replies: (CommentRow & { username: string; reply_count: number })[] = [];
  if (topIds.length > 0) {
    const placeholders = topIds.map(() => '?').join(',');
    const { results } = await c.env.DB.prepare(
      `SELECT c.*, u.name as username, 0 as reply_count
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.parent_id IN (${placeholders})
         AND c.moderation_status IN ('visible', 'flagged', 'editor_deleted', 'auto_deleted')
       ORDER BY c.created_at ASC`,
    )
      .bind(...topIds)
      .all<CommentRow & { username: string; reply_count: number }>();
    replies = results;
  }

  const allRows = [...topSlice, ...replies];
  const comments = allRows
    .map((row) => rowToPublic(row, viewerId))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const nextCursor =
    hasMore && topSlice.length > 0 ? topSlice[topSlice.length - 1].id : null;

  return c.json({ comments, nextCursor });
  } catch (err) {
    console.error('GET comments failed:', err);
    return c.json({ error: 'internal_error', message: 'Could not load comments.' }, 500);
  }
});

commentsRouter.post('/:debateId/comments', async (c) => {
  try {
  const auth = await requireGoogleUser(c);
  if ('error' in auth && auth.error) return auth.error;
  const { user } = auth;

  const debateId = c.req.param('debateId');

  let body: { body?: string; parentId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const text = (body.body ?? '').trim();
  if (text.length < 2) {
    return c.json({ error: 'body_too_short' }, 400);
  }
  if (text.length > 2000) {
    return c.json({ error: 'body_too_long' }, 400);
  }

  const allowed = await checkRateLimit(c.env.RATE_LIMIT_KV, user.sub);
  if (!allowed) {
    return c.json({ error: 'rate_limited', message: 'Please wait a few seconds before commenting again.' }, 429);
  }

  try {
    await ensureUserExists(c, user.sub, user.email, user.name);
  } catch (userErr) {
    console.error('ensureUserExists failed:', userErr);
    const row = await c.env.DB.prepare(`SELECT id FROM users WHERE id = ?`)
      .bind(user.sub)
      .first<{ id: string }>();
    if (!row) {
      return c.json(
        {
          error: 'user_setup_failed',
          message: 'Could not prepare your account. Sign out, sign in again, then retry.',
        },
        503,
      );
    }
  }

  const modState = await getUserModerationState(c.env.DB, user.sub);
  if (modState.socialBanned) {
    return c.json({
      error: 'social_banned',
      message:
        'Your account has been permanently banned from participating. You can still read content, but cannot comment.',
    }, 403);
  }
  if (!modState.canComment) {
    const message = modState.timeoutUntil
      ? formatTimeoutMessage(modState.timeoutUntil)
      : 'Your commenting privileges are suspended.';
    return c.json({ error: 'comment_suspended', message, timeoutUntil: modState.timeoutUntil }, 403);
  }

  const article = await c.env.DB.prepare(`SELECT id FROM articles WHERE id = ?`)
    .bind(debateId)
    .first();
  if (!article) {
    const ensured = await ensureDebateExists(c.env.DB, debateId);
    if (!ensured) {
      return c.json({ error: 'not_found' }, 404);
    }
  }

  let parentId: string | null = body.parentId?.trim() || null;
  if (parentId) {
    const parent = await c.env.DB.prepare(
      `SELECT id, parent_id, debate_id FROM comments WHERE id = ?`,
    )
      .bind(parentId)
      .first<{ id: string; parent_id: string | null; debate_id: string }>();

    if (!parent || parent.debate_id !== debateId) {
      return c.json({ error: 'invalid_parent' }, 400);
    }

    if (parent.parent_id) {
      parentId = parent.parent_id;
    }
  }

  const commentId = await generateId('cmt');
  const now = Math.floor(Date.now() / 1000);

  await c.env.DB.prepare(
    `INSERT INTO comments (id, debate_id, user_id, parent_id, body, created_at, moderation_status)
     VALUES (?, ?, ?, ?, ?, ?, 'visible')`,
  )
    .bind(commentId, debateId, user.sub, parentId, text, now)
    .run();

  if (parentId) {
    const parent = await c.env.DB.prepare(
      `SELECT user_id FROM comments WHERE id = ? AND deleted_at IS NULL`,
    )
      .bind(parentId)
      .first<{ user_id: string }>();
    if (parent && parent.user_id !== user.sub) {
      try {
        await createNotification(c.env.DB, parent.user_id, {
          type: 'reply',
          title: 'New reply to your comment',
          body: `${user.name} replied in a discussion you joined.`,
          discussionId: debateId,
        });
      } catch (notifyErr) {
        console.error('reply notification failed:', notifyErr);
      }
    }
  }

  c.executionCtx.waitUntil(
    processCommentModeration(c.env, {
      commentId,
      debateId,
      userSub: user.sub,
      userName: user.name,
      text,
      parentId,
    }),
  );

  return c.json({
    id: commentId,
    body: text,
    userId: user.sub,
    username: user.name,
    parentId,
    createdAt: now,
    replyCount: 0,
    status: 'visible',
  });
  } catch (err) {
    console.error('POST comment failed:', err instanceof Error ? err.message : err, err);
    return c.json({ error: 'internal_error', message: 'Could not post comment. Try again shortly.' }, 500);
  }
});

export const commentDeleteRouter = new Hono<{ Bindings: Env }>();

commentDeleteRouter.delete('/:commentId', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth && auth.error) return auth.error;
  const { user } = auth;

  const modState = await getUserModerationState(c.env.DB, user.sub);
  if (modState.socialBanned) {
    return c.json({ error: 'social_banned' }, 403);
  }

  const commentId = c.req.param('commentId');
  const row = await c.env.DB.prepare(`SELECT * FROM comments WHERE id = ?`)
    .bind(commentId)
    .first<CommentRow>();

  if (!row) {
    return c.json({ error: 'not_found' }, 404);
  }
  if (row.user_id !== user.sub) {
    return c.json({ error: 'forbidden' }, 403);
  }

  const now = Math.floor(Date.now() / 1000);
  await c.env.DB.prepare(
    `UPDATE comments SET deleted_at = ?, deleted_by = 'user', moderation_status = 'editor_deleted', body = '[deleted]' WHERE id = ?`,
  )
    .bind(now, commentId)
    .run();

  return c.json({
    id: commentId,
    body: '[deleted]',
    removed: true,
  });
});

export const debatesRouter = commentsRouter;
