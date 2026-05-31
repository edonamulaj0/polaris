// worker/src/routes/votes.ts
// [WRK-4] Votes API — record vote, get distribution

import { Hono } from 'hono';
import type { Env } from '../types';
import { verifyGoogleToken } from '../lib/auth';
import { getVoteDistribution, syncArticleStanceCounts } from '../lib/voteHelpers';

export const votesRouter = new Hono<{ Bindings: Env }>(); // [WRK-4]

const VALID_STANCES = ['For', 'Against', 'Neutral'] as const; // [WRK-4]

votesRouter.post('/:id/vote', async (c) => {
  const authHeader = c.req.header('Authorization'); // [WRK-4]
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : null; // [WRK-4]

  if (!token) {
    return c.json({ error: 'unauthorized' }, 401); // [WRK-4]
  }

  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env); // [WRK-4]
  } catch {
    return c.json({ error: 'invalid_token' }, 401); // [WRK-4]
  }

  const articleId = c.req.param('id'); // [WRK-4]
  const body = await c.req.json<{ stance: string }>(); // [WRK-4]

  if (!VALID_STANCES.includes(body.stance as (typeof VALID_STANCES)[number])) {
    return c.json({ error: 'invalid_stance' }, 400); // [WRK-4]
  }

  const article = await c.env.DB.prepare(`SELECT id FROM articles WHERE id = ?`)
    .bind(articleId)
    .first(); // [WRK-4]

  if (!article) {
    return c.json({ error: 'article_not_found' }, 404); // [WRK-4]
  }

  await c.env.DB.prepare(
    `INSERT INTO votes (user_id, article_id, stance) VALUES (?, ?, ?)
     ON CONFLICT(user_id, article_id) DO UPDATE SET
       stance = excluded.stance,
       voted_at = unixepoch()`,
  )
    .bind(googleUser.sub, articleId, body.stance)
    .run(); // [WRK-4]

  const distribution = await syncArticleStanceCounts(c.env.DB, articleId); // [WRK-4]

  return c.json({
    stance: body.stance, // [WRK-4]
    distribution, // [WRK-4]
  });
});

votesRouter.get('/:id/votes', async (c) => {
  const articleId = c.req.param('id'); // [WRK-4]

  const article = await c.env.DB.prepare(
    `SELECT stance_for, stance_against, stance_neutral FROM articles WHERE id = ?`,
  )
    .bind(articleId)
    .first<{ stance_for: number; stance_against: number; stance_neutral: number }>(); // [WRK-4]

  if (!article) {
    return c.json({ error: 'article_not_found' }, 404); // [WRK-4]
  }

  const voteCounts = await getVoteDistribution(c.env.DB, articleId); // [WRK-4]

  if (voteCounts.total > 0) {
    return c.json({
      distribution: {
        for: voteCounts.for, // [WRK-4]
        against: voteCounts.against, // [WRK-4]
        neutral: voteCounts.neutral, // [WRK-4]
      },
      total: voteCounts.total, // [WRK-4]
    });
  }

  return c.json({
    distribution: {
      for: article.stance_for, // [WRK-4]
      against: article.stance_against, // [WRK-4]
      neutral: article.stance_neutral, // [WRK-4]
    },
    total: 0, // [WRK-4]
  });
});
