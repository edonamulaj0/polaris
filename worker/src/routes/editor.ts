// worker/src/routes/editor.ts
// Editor panel — server-authenticated (Google token + editor session)

import { Hono } from 'hono';
import type { ArticleRow } from '../types';
import type { CommentFlagRow, CommentRow } from '../types/moderation';
import { rowToPublic } from '../lib/articleHelpers';
import { createNotification } from '../lib/notifications';
import {
  generateId,
  getUserModerationState,
  issueStrike,
  recalculateModerationState,
} from '../lib/moderationHelpers';
import { requireEditorMiddleware, type EditorContext } from '../lib/requireEditor';

const FLAG_LABELS: Record<string, string> = {
  offensive: 'Offensive content',
  sarcasm: 'Potential sarcasm / personal attack',
  irony: 'Potential irony / sarcasm',
  borderline: 'Borderline language',
  masking_bypass: 'Bypassed filter via masking/asterisks',
  false_positive: 'False positive',
};

function flagLabel(type: string): string {
  return FLAG_LABELS[type] ?? type;
}

export const editorRouter = new Hono<EditorContext>();

editorRouter.use('*', requireEditorMiddleware);

editorRouter.get('/articles', async (c) => {
  const filter = c.req.query('filter') || 'pending';
  let query = `SELECT * FROM articles WHERE 1=1`;
  const params: string[] = [];

  if (filter === 'pending') {
    query += ` AND verified = 0 AND hidden = 0`;
  } else if (filter === 'verified') {
    query += ` AND verified = 1 AND hidden = 0`;
  } else if (filter === 'all') {
    query += ` AND hidden = 0`;
  }

  query += ` ORDER BY published_at DESC LIMIT 100`;

  const { results } = await c.env.DB.prepare(query).bind(...params).all<ArticleRow>();
  const articles = results.map((row) => rowToPublic(row, { includeEditorFields: true }));

  const pendingRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM articles WHERE verified = 0 AND hidden = 0`,
  ).first<{ n: number }>();
  const pendingCount = pendingRow?.n ?? 0;

  return c.json({ articles, pendingCount, filter });
});

editorRouter.patch('/articles/:id', async (c) => {
  const id = c.req.param('id');
  const row = await c.env.DB.prepare(`SELECT * FROM articles WHERE id = ?`).bind(id).first<ArticleRow>();

  if (!row) {
    return c.json({ error: 'not_found' }, 404);
  }

  let body: {
    verified?: boolean;
    hidden?: boolean;
    verifiedBy?: string;
    bothSides?: { for?: string[]; against?: string[] };
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const sets: string[] = [];
  const params: (string | number)[] = [];

  if (body.verified === true) {
    sets.push('verified = 1');
    sets.push('verified_by = ?');
    params.push(body.verifiedBy?.trim() || 'Editor');
    sets.push('verified_at = ?');
    params.push(Math.floor(Date.now() / 1000));
  } else if (body.verified === false) {
    sets.push('verified = 0');
  }

  if (body.hidden === true) {
    sets.push('hidden = 1');
  } else if (body.hidden === false) {
    sets.push('hidden = 0');
  }

  if (body.bothSides) {
    const forText = (body.bothSides.for || []).filter(Boolean).join(' ');
    const againstText = (body.bothSides.against || []).filter(Boolean).join(' ');
    if (forText) {
      sets.push('perspectives = ?');
      params.push(forText);
    }
    if (againstText) {
      sets.push('counterpoint = ?');
      params.push(againstText);
    }
  }

  if (sets.length === 0) {
    return c.json({ error: 'no_changes' }, 400);
  }

  params.push(id);
  await c.env.DB.prepare(`UPDATE articles SET ${sets.join(', ')} WHERE id = ?`)
    .bind(...params)
    .run();

  const updated = await c.env.DB.prepare(`SELECT * FROM articles WHERE id = ?`)
    .bind(id)
    .first<ArticleRow>();

  if (updated?.submitted_by) {
    if (body.verified === true) {
      await createNotification(c.env.DB, updated.submitted_by, {
        type: 'topic',
        title: 'Your topic was approved',
        body: `"${updated.title}" is now live in the public feed.`,
        discussionId: id,
      });
    } else if (body.hidden === true) {
      await createNotification(c.env.DB, updated.submitted_by, {
        type: 'topic',
        title: 'Your topic was not published',
        body: `"${updated.title}" was hidden by an editor and will not appear in the feed.`,
        discussionId: id,
      });
    }
  }

  return c.json(rowToPublic(updated!, { includeEditorFields: true }));
});

editorRouter.get('/comments/flagged', async (c) => {
  const cursor = c.req.query('cursor');
  const limitRaw = parseInt(c.req.query('limit') || '20', 10);
  const limit = Math.min(Math.max(Number.isNaN(limitRaw) ? 20 : limitRaw, 1), 50);

  let query = `
    SELECT c.*, u.name as username, a.title as debate_title
    FROM comments c
    JOIN users u ON u.id = c.user_id
    JOIN articles a ON a.id = c.debate_id
    WHERE c.moderation_status = 'flagged' AND c.deleted_at IS NULL
  `;
  const params: (string | number)[] = [];

  if (cursor) {
    const cursorRow = await c.env.DB.prepare(`SELECT created_at FROM comments WHERE id = ?`)
      .bind(cursor)
      .first<{ created_at: number }>();
    if (cursorRow) {
      query += ` AND c.created_at < ?`;
      params.push(cursorRow.created_at);
    }
  }

  query += ` ORDER BY c.created_at DESC LIMIT ?`;
  params.push(limit + 1);

  const { results } = await c.env.DB.prepare(query)
    .bind(...params)
    .all<CommentRow & { username: string; debate_title: string }>();

  const hasMore = results.length > limit;
  const slice = results.slice(0, limit);

  const items = await Promise.all(
    slice.map(async (row) => {
      const { results: flagRows } = await c.env.DB.prepare(
        `SELECT * FROM comment_flags WHERE comment_id = ? AND resolved_at IS NULL ORDER BY created_at ASC`,
      )
        .bind(row.id)
        .all<CommentFlagRow>();

      const userState = await getUserModerationState(c.env.DB, row.user_id);

      return {
        comment: {
          id: row.id,
          body: row.body,
          userId: row.user_id,
          username: row.username,
          debateId: row.debate_id,
          debateTitle: row.debate_title,
          parentId: row.parent_id,
          createdAt: row.created_at,
          moderationStatus: row.moderation_status,
        },
        flags: flagRows.map((f) => ({
          id: f.id,
          type: f.flag_type,
          label: flagLabel(f.flag_type),
          confidence: f.confidence ?? 0,
          reasoning: f.reasoning ?? '',
          flaggedBy: f.flagged_by,
          createdAt: f.created_at,
        })),
        userState: {
          userId: row.user_id,
          strikeCount: userState.strikeCount,
          commentBlocked: userState.commentBlocked,
          banned: userState.banned,
          socialBanned: userState.socialBanned,
          warningCount: userState.warningCount,
          timeoutCount: userState.timeoutCount,
          timeoutUntil: userState.timeoutUntil,
        },
      };
    }),
  );

  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM comments WHERE moderation_status = 'flagged' AND deleted_at IS NULL`,
  ).first<{ n: number }>();

  const nextCursor = hasMore && slice.length > 0 ? slice[slice.length - 1].id : null;

  return c.json({
    items,
    nextCursor,
    flaggedCount: countRow?.n ?? 0,
  });
});

editorRouter.post('/comments/:commentId/action', async (c) => {
  const commentId = c.req.param('commentId');
  let body: { action?: string; editorId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const action = body.action;
  const normalizedAction =
    action === 'approve' ? 'clear' : action === 'permanently_delete' ? 'delete' : action;

  if (!normalizedAction || !['delete', 'clear', 'false_positive'].includes(normalizedAction)) {
    return c.json({ error: 'invalid_action' }, 400);
  }

  const row = await c.env.DB.prepare(`SELECT * FROM comments WHERE id = ?`)
    .bind(commentId)
    .first<CommentRow>();

  if (!row) {
    return c.json({ error: 'not_found' }, 404);
  }

  const editorId = body.editorId?.trim() || 'editor';
  const now = Math.floor(Date.now() / 1000);
  let newStatus = row.moderation_status;

  if (normalizedAction === 'delete') {
    newStatus = 'editor_deleted';
    await c.env.DB.batch([
      c.env.DB.prepare(
        `UPDATE comments SET moderation_status = 'editor_deleted', deleted_at = ?, deleted_by = 'editor', body = '[deleted]' WHERE id = ?`,
      ).bind(now, commentId),
      c.env.DB.prepare(
        `UPDATE comment_flags SET resolved_by = ?, resolved_action = 'deleted', resolved_at = ? WHERE comment_id = ? AND resolved_at IS NULL`,
      ).bind(editorId, now, commentId),
    ]);
    await issueStrike(
      c.env.DB,
      row.user_id,
      commentId,
      'Comment deleted by editor.',
      'editor',
    );
    await createNotification(c.env.DB, row.user_id, {
      type: 'moderation',
      title: 'Comment removed by an editor',
      body: 'Your comment was deleted after review. A strike may have been applied to your account.',
      discussionId: row.debate_id,
    });
  } else if (normalizedAction === 'clear') {
    newStatus = 'visible';
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE comments SET moderation_status = 'visible' WHERE id = ?`).bind(
        commentId,
      ),
      c.env.DB.prepare(
        `UPDATE comment_flags SET resolved_by = ?, resolved_action = 'cleared', resolved_at = ? WHERE comment_id = ? AND resolved_at IS NULL`,
      ).bind(editorId, now, commentId),
    ]);
    await createNotification(c.env.DB, row.user_id, {
      type: 'moderation',
      title: 'Comment approved',
      body: 'Your flagged comment was reviewed and is visible again.',
      discussionId: row.debate_id,
    });
  } else if (normalizedAction === 'false_positive') {
    newStatus = 'visible';
    await c.env.DB.batch([
      c.env.DB.prepare(`UPDATE comments SET moderation_status = 'visible' WHERE id = ?`).bind(
        commentId,
      ),
      c.env.DB.prepare(
        `UPDATE comment_flags SET resolved_by = ?, resolved_action = 'false_positive', resolved_at = ? WHERE comment_id = ? AND resolved_at IS NULL`,
      ).bind(editorId, now, commentId),
    ]);
    await createNotification(c.env.DB, row.user_id, {
      type: 'moderation',
      title: 'Comment cleared',
      body: 'An editor marked your comment as a false positive — it is visible again.',
      discussionId: row.debate_id,
    });
  }

  return c.json({ success: true, newStatus });
});

editorRouter.get('/users/:userId/violations', async (c) => {
  const userId = c.req.param('userId');
  const { results } = await c.env.DB.prepare(
    `SELECT v.*, c.body as comment_body, a.title as debate_title
     FROM moderation_violations v
     LEFT JOIN comments c ON c.id = v.comment_id
     LEFT JOIN articles a ON a.id = c.debate_id
     WHERE v.user_id = ?
     ORDER BY v.created_at DESC
     LIMIT 50`,
  )
    .bind(userId)
    .all<{
      id: string;
      violation_type: string;
      trigger_reason: string;
      severity: string | null;
      penalty_applied: string | null;
      created_at: number;
      comment_body: string | null;
      debate_title: string | null;
    }>();

  const userState = await getUserModerationState(c.env.DB, userId);

  return c.json({
    userId,
    userState: {
      userId,
      strikeCount: userState.strikeCount,
      commentBlocked: userState.commentBlocked,
      banned: userState.banned,
      socialBanned: userState.socialBanned,
      warningCount: userState.warningCount,
      timeoutCount: userState.timeoutCount,
      timeoutUntil: userState.timeoutUntil,
    },
    violations: results.map((v) => ({
      id: v.id,
      type: v.violation_type,
      triggerReason: v.trigger_reason,
      severity: v.severity,
      penaltyApplied: v.penalty_applied,
      createdAt: v.created_at,
      commentBody: v.comment_body,
      debateTitle: v.debate_title,
    })),
  });
});

editorRouter.get('/users/:userId/strikes', async (c) => {
  const userId = c.req.param('userId');
  const { results } = await c.env.DB.prepare(
    `SELECT s.*, c.body as comment_body, c.debate_id, a.title as debate_title
     FROM user_strikes s
     JOIN comments c ON c.id = s.comment_id
     JOIN articles a ON a.id = c.debate_id
     WHERE s.user_id = ?
     ORDER BY s.issued_at DESC`,
  )
    .bind(userId)
    .all<{
      id: string;
      user_id: string;
      comment_id: string;
      reason: string;
      issued_at: number;
      issued_by: string;
      comment_body: string;
      debate_id: string;
      debate_title: string;
    }>();

  const userState = await getUserModerationState(c.env.DB, userId);

  return c.json({
    userId,
    userState: {
      userId,
      strikeCount: userState.strikeCount,
      commentBlocked: userState.commentBlocked,
      banned: userState.banned,
      socialBanned: userState.socialBanned,
      warningCount: userState.warningCount,
      timeoutCount: userState.timeoutCount,
      timeoutUntil: userState.timeoutUntil,
    },
    strikes: results.map((s) => ({
      id: s.id,
      commentId: s.comment_id,
      commentBody: s.comment_body,
      debateId: s.debate_id,
      debateTitle: s.debate_title,
      reason: s.reason,
      issuedBy: s.issued_by,
      issuedAt: s.issued_at,
    })),
  });
});

editorRouter.post('/users/:userId/pardon', async (c) => {
  const userId = c.req.param('userId');
  let body: { editorId?: string; reason?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const state = await getUserModerationState(c.env.DB, userId);
  if (state.strikeCount <= 0) {
    return c.json({ error: 'no_strikes' }, 400);
  }

  const pardonId = await generateId('pdn');
  const editorId = body.editorId?.trim() || 'editor';
  const now = Math.floor(Date.now() / 1000);

  const countRow = await c.env.DB.prepare(
    `SELECT COUNT(*) as n FROM user_strikes WHERE user_id = ?`,
  )
    .bind(userId)
    .first<{ n: number }>();

  const newCount = Math.max((countRow?.n ?? 1) - 1, 0);
  const commentBlocked = newCount >= 3 ? 1 : 0;
  const banned = newCount >= 5 ? 1 : 0;

  await c.env.DB.batch([
    c.env.DB.prepare(
      `DELETE FROM user_strikes WHERE id = (
        SELECT id FROM user_strikes WHERE user_id = ? ORDER BY issued_at DESC LIMIT 1
      )`,
    ).bind(userId),
    c.env.DB.prepare(
      `INSERT INTO user_pardons (id, user_id, editor_id, reason, issued_at) VALUES (?, ?, ?, ?, ?)`,
    ).bind(pardonId, userId, editorId, body.reason?.trim() || null, now),
    c.env.DB.prepare(
      `INSERT INTO user_moderation_state (user_id, strike_count, comment_blocked, banned, updated_at)
       VALUES (?, ?, ?, ?, ?)
       ON CONFLICT(user_id) DO UPDATE SET
         strike_count = excluded.strike_count,
         comment_blocked = excluded.comment_blocked,
         banned = excluded.banned,
         updated_at = excluded.updated_at`,
    ).bind(userId, newCount, commentBlocked, banned, now),
  ]);

  return c.json({
    success: true,
    strikeCount: newCount,
    commentBlocked: commentBlocked === 1,
    banned: banned === 1,
  });
});

editorRouter.get('/comments/:commentId/context', async (c) => {
  const commentId = c.req.param('commentId');
  const row = await c.env.DB.prepare(
    `SELECT c.*, u.name as username, a.title as debate_title
     FROM comments c
     JOIN users u ON u.id = c.user_id
     JOIN articles a ON a.id = c.debate_id
     WHERE c.id = ?`,
  )
    .bind(commentId)
    .first<CommentRow & { username: string; debate_title: string }>();

  if (!row) {
    return c.json({ error: 'not_found' }, 404);
  }

  const { results: thread } = await c.env.DB.prepare(
    `SELECT c.*, u.name as username
     FROM comments c
     JOIN users u ON u.id = c.user_id
     WHERE c.debate_id = ?
       AND c.moderation_status IN ('visible', 'flagged', 'editor_deleted', 'auto_deleted')
     ORDER BY c.created_at ASC`,
  )
    .bind(row.debate_id)
    .all<CommentRow & { username: string }>();

  const { results: flagRows } = await c.env.DB.prepare(
    `SELECT * FROM comment_flags WHERE comment_id = ? ORDER BY created_at ASC`,
  )
    .bind(commentId)
    .all<CommentFlagRow>();

  const userState = await getUserModerationState(c.env.DB, row.user_id);

  const { results: priorStrikes } = await c.env.DB.prepare(
    `SELECT s.*, c.body as comment_body FROM user_strikes s
     JOIN comments c ON c.id = s.comment_id
     WHERE s.user_id = ? ORDER BY s.issued_at DESC LIMIT 10`,
  )
    .bind(row.user_id)
    .all<{
      id: string;
      reason: string;
      issued_at: number;
      issued_by: string;
      comment_body: string;
    }>();

  return c.json({
    comment: {
      id: row.id,
      body: row.body,
      userId: row.user_id,
      username: row.username,
      debateId: row.debate_id,
      debateTitle: row.debate_title,
      parentId: row.parent_id,
      createdAt: row.created_at,
      moderationStatus: row.moderation_status,
    },
    thread: thread.map((t) => ({
      id: t.id,
      body:
        t.deleted_at || t.moderation_status === 'editor_deleted'
          ? '[deleted]'
          : t.body,
      userId: t.user_id,
      username: t.username,
      parentId: t.parent_id,
      createdAt: t.created_at,
      highlighted: t.id === commentId,
    })),
    flags: flagRows.map((f) => ({
      id: f.id,
      type: f.flag_type,
      label: flagLabel(f.flag_type),
      confidence: f.confidence ?? 0,
      reasoning: f.reasoning ?? '',
      flaggedBy: f.flagged_by,
      createdAt: f.created_at,
      resolvedAction: f.resolved_action,
    })),
    userState: {
      userId: row.user_id,
      strikeCount: userState.strikeCount,
      commentBlocked: userState.commentBlocked,
      banned: userState.banned,
      socialBanned: userState.socialBanned,
      warningCount: userState.warningCount,
      timeoutCount: userState.timeoutCount,
      timeoutUntil: userState.timeoutUntil,
    },
    priorStrikes: priorStrikes.map((s) => ({
      id: s.id,
      reason: s.reason,
      issuedBy: s.issued_by,
      issuedAt: s.issued_at,
      commentBody: s.comment_body,
    })),
  });
});
