// worker/src/routes/topics.ts
// [WRK-6] User topic submissions — authenticated POST, owner listing

import { Hono, type Context } from 'hono';
import type { Env, ArticleRow } from '../types';
import { verifyGoogleToken, extractBearerToken } from '../lib/auth';
import { rowToPublic, VALID_CATEGORIES, VALID_STANCES } from '../lib/articleHelpers';

export const topicsRouter = new Hono<{ Bindings: Env }>();

async function hashSubmissionId(sub: string, title: string): Promise<string> {
  const payload = `${sub}:${title}:${Date.now()}:${crypto.randomUUID()}`;
  const data = new TextEncoder().encode(payload);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashHex = Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `art-${hashHex.slice(0, 12)}`;
}

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

topicsRouter.post('/', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth && auth.error) return auth.error;
  const googleUser = auth.user!;

  let body: { title?: string; category?: string; stance?: string; description?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const title = body.title?.trim();
  if (!title || title.length < 5) {
    return c.json({ error: 'invalid_title' }, 400);
  }

  if (
    !body.category ||
    !VALID_CATEGORIES.includes(body.category as (typeof VALID_CATEGORIES)[number])
  ) {
    return c.json({ error: 'invalid_category' }, 400);
  }

  if (!body.stance || !VALID_STANCES.includes(body.stance as (typeof VALID_STANCES)[number])) {
    return c.json({ error: 'invalid_stance' }, 400);
  }

  const description = body.description?.trim() || '';
  const id = await hashSubmissionId(googleUser.sub, title);

  // Ensure user row exists for FK
  await c.env.DB.prepare(
    `INSERT INTO users (id, email, name) VALUES (?, ?, ?) ON CONFLICT(id) DO NOTHING`,
  )
    .bind(googleUser.sub, googleUser.email, googleUser.name)
    .run();

  const lede = description.slice(0, 600) || title;
  const perspectives = `Submitter stance: ${body.stance}. ${description}`.trim();
  const placeholder =
    'This topic was submitted by a community member and is pending editor review.';

  await c.env.DB.prepare(
    `INSERT INTO articles (
      id, title, category, image_url,
      lede, background, perspectives, evidence, counterpoint, implications, conclusion,
      source_urls, civility, stance_for, stance_against, stance_neutral,
      verified, hidden, source_type, submitted_by, submitter_stance, submission_description
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'user_submission', ?, ?, ?)`,
  )
    .bind(
      id,
      title,
      body.category,
      null,
      lede,
      placeholder,
      perspectives,
      'Pending verification.',
      'Opposing viewpoints will be expanded upon editor approval.',
      '',
      '',
      '[]',
      78,
      body.stance === 'For' ? 50 : 25,
      body.stance === 'Against' ? 50 : 25,
      body.stance === 'Neutral' ? 50 : 25,
      googleUser.sub,
      body.stance,
      description || null,
    )
    .run();

  return c.json({ id, status: 'pending' as const }, 201);
});

topicsRouter.get('/mine', async (c) => {
  const auth = await requireGoogleUser(c);
  if ('error' in auth && auth.error) return auth.error;
  const googleUser = auth.user!;

  const { results } = await c.env.DB.prepare(
    `SELECT * FROM articles WHERE submitted_by = ? AND hidden = 0 ORDER BY published_at DESC LIMIT 50`,
  )
    .bind(googleUser.sub)
    .all<ArticleRow>();

  const articles = results.map((row) => rowToPublic(row, { viewerSub: googleUser.sub }));
  return c.json({ articles });
});
