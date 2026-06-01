// worker/src/routes/editor.ts
// [WRK-6] Editor panel — server-side verification queue (EDITOR_SECRET auth)

import { Hono, type Context } from 'hono';
import type { Env, ArticleRow } from '../types';
import { extractBearerToken, verifyEditorSecret } from '../lib/auth';
import { rowToPublic } from '../lib/articleHelpers';

export const editorRouter = new Hono<{ Bindings: Env }>();

function requireEditor(c: Context<{ Bindings: Env }>) {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!verifyEditorSecret(token, c.env)) {
    return { error: c.json({ error: 'unauthorized' }, 401) as Response };
  }
  return { ok: true as const };
}

editorRouter.get('/articles', async (c) => {
  const auth = requireEditor(c);
  if ('error' in auth && auth.error) return auth.error;

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
  const auth = requireEditor(c);
  if ('error' in auth && auth.error) return auth.error;

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

  return c.json(rowToPublic(updated!, { includeEditorFields: true }));
});
