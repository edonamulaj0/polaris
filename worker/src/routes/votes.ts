// worker/src/routes/votes.ts
// [WRK-4] Votes API — record vote, get distribution

import { Hono } from 'hono';
import type { Env } from '../types';
import { extractBearerToken, verifyGoogleToken } from '../lib/auth';
import { getVoteDistribution, syncArticleStanceCounts } from '../lib/voteHelpers';
import { getUserModerationState } from '../lib/moderationHelpers';
import { ensureDebateExists } from '../lib/ensureCuratedArticle';
import { ensureUserRow } from '../lib/ensureUser';

export const votesRouter = new Hono<{ Bindings: Env }>(); // [WRK-4]

const VALID_STANCES = ['For', 'Against', 'Neutral'] as const; // [WRK-4]

votesRouter.post('/:id/vote', async (c) => {
  try {
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

  const modState = await getUserModerationState(c.env.DB, googleUser.sub);
  if (!modState.canVote) {
    return c.json({
      error: 'social_banned',
      message: 'Your account cannot vote due to a community guidelines violation.',
    }, 403);
  }

  const articleId = c.req.param('id'); // [WRK-4]
  const body = await c.req.json<{ stance: string }>(); // [WRK-4]

  if (!VALID_STANCES.includes(body.stance as (typeof VALID_STANCES)[number])) {
    return c.json({ error: 'invalid_stance' }, 400); // [WRK-4]
  }

  const exists = await ensureDebateExists(c.env.DB, articleId); // [WRK-4]
  if (!exists) {
    return c.json({ error: 'article_not_found' }, 404); // [WRK-4]
  }

  await ensureUserRow(c.env.DB, googleUser);

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
  } catch (err) {
    console.error('POST vote failed:', err);
    return c.json({ error: 'internal_error', message: 'Could not save your vote.' }, 500);
  }
});

votesRouter.get('/:id/votes', async (c) => {
  const articleId = c.req.param('id'); // [WRK-4]

  await ensureDebateExists(c.env.DB, articleId);

  const article = await c.env.DB.prepare(
    `SELECT stance_for, stance_against, stance_neutral FROM articles WHERE id = ?`,
  )
    .bind(articleId)
    .first<{ stance_for: number; stance_against: number; stance_neutral: number }>(); // [WRK-4]

  if (!article) {
    return c.json({ error: 'article_not_found' }, 404); // [WRK-4]
  }

  const voteCounts = await getVoteDistribution(c.env.DB, articleId); // [WRK-4]

  let userStance: string | null = null;
  const token = extractBearerToken(c.req.header('Authorization'));
  if (token) {
    try {
      const googleUser = await verifyGoogleToken(token, c.env);
      const voteRow = await c.env.DB.prepare(
        `SELECT stance FROM votes WHERE user_id = ? AND article_id = ?`,
      )
        .bind(googleUser.sub, articleId)
        .first<{ stance: string }>();
      userStance = voteRow?.stance ?? null;
    } catch {
      /* optional auth */
    }
  }

  if (voteCounts.total > 0) {
    return c.json({
      distribution: {
        for: voteCounts.for, // [WRK-4]
        against: voteCounts.against, // [WRK-4]
        neutral: voteCounts.neutral, // [WRK-4]
      },
      total: voteCounts.total, // [WRK-4]
      userStance,
    });
  }

  return c.json({
    distribution: {
      for: article.stance_for, // [WRK-4]
      against: article.stance_against, // [WRK-4]
      neutral: article.stance_neutral, // [WRK-4]
    },
    total: 0, // [WRK-4]
    userStance,
  });
});
