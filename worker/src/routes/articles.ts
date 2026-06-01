// worker/src/routes/articles.ts
// [WRK-3] Articles API — paginated list and single article

import { Hono } from 'hono';
import type { Env, ArticleRow } from '../types';
import { rowToPublic, VALID_CATEGORIES, parseLimit } from '../lib/articleHelpers';
import { verifyGoogleToken, extractBearerToken } from '../lib/auth';
import { votesRouter } from './votes';

export const articlesRouter = new Hono<{ Bindings: Env }>(); // [WRK-3]

articlesRouter.get('/', async (c) => {
  const category = c.req.query('category'); // [WRK-3]
  const cursorRaw = c.req.query('cursor'); // [WRK-3]
  const limit = parseLimit(c.req.query('limit')); // [WRK-3]

  if (category && !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
    return c.json({ error: 'invalid_category' }, 400); // [WRK-3]
  }

  let query = `SELECT * FROM articles WHERE hidden = 0 AND verified = 1`; // [WRK-6]
  const params: (string | number)[] = []; // [WRK-3]

  if (category) {
    query += ` AND category = ?`; // [WRK-3]
    params.push(category); // [WRK-3]
  }

  if (cursorRaw) {
    const cursor = parseInt(cursorRaw, 10); // [WRK-3]
    if (!Number.isNaN(cursor)) {
      query += ` AND published_at < ?`; // [WRK-3]
      params.push(cursor); // [WRK-3]
    }
  }

  query += ` ORDER BY published_at DESC LIMIT ?`; // [WRK-3]
  params.push(limit + 1); // [WRK-3]

  const stmt = c.env.DB.prepare(query); // [WRK-3]
  const { results } = await stmt.bind(...params).all<ArticleRow>(); // [WRK-3]

  const hasMore = results.length > limit; // [WRK-3]
  const slice = results.slice(0, limit); // [WRK-3]
  const articles = slice.map((row) => rowToPublic(row)); // [WRK-3]

  const nextCursor =
    hasMore && articles.length > 0 ? articles[articles.length - 1].publishedAt : null; // [WRK-3]

  return c.json({ articles, nextCursor }); // [WRK-3]
});

articlesRouter.route('/', votesRouter); // [WRK-4] mount before /:id to avoid route shadowing

articlesRouter.get('/:id', async (c) => {
  const id = c.req.param('id'); // [WRK-3]
  const preview = c.req.query('preview') === '1';

  const row = await c.env.DB.prepare(`SELECT * FROM articles WHERE id = ?`).bind(id).first<ArticleRow>(); // [WRK-3]

  if (!row) {
    return c.json({ error: 'not_found' }, 404); // [WRK-3]
  }

  if (row.hidden === 1) {
    return c.json({ error: 'not_found' }, 404);
  }

  if (row.verified === 0) {
    if (!preview) {
      return c.json({ error: 'not_found' }, 404);
    }

    const token = extractBearerToken(c.req.header('Authorization'));
    if (!token) {
      return c.json({ error: 'unauthorized' }, 401);
    }

    let googleUser;
    try {
      googleUser = await verifyGoogleToken(token, c.env);
    } catch {
      return c.json({ error: 'invalid_token' }, 401);
    }

    if (row.submitted_by !== googleUser.sub) {
      return c.json({ error: 'not_found' }, 404);
    }

    return c.json(rowToPublic(row, { viewerSub: googleUser.sub }));
  }

  return c.json(rowToPublic(row)); // [WRK-3]
});
