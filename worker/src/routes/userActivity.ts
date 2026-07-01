// worker/src/routes/userActivity.ts
// Saved debates, activity feed, and client→server sync for Google accounts

import { Hono } from 'hono';
import type { Env } from '../types';
import { extractBearerToken, verifyGoogleToken } from '../lib/auth';
import {
  appendUserActivity,
  getUserActivityData,
  saveDebateForUser,
  syncClientActivity,
  unsaveDebateForUser,
  type ClientActivityEntry,
  type ClientSyncPayload,
} from '../lib/userActivityHelpers';
import {
  subscribeToDebate,
  unsubscribeFromDebate,
} from '../lib/debateSubscriptions';

export const userActivityRouter = new Hono<{ Bindings: Env }>();

userActivityRouter.get('/activity-data', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const data = await getUserActivityData(c.env.DB, googleUser.sub);
  return c.json(data);
});

userActivityRouter.post('/sync', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const body = await c.req.json<ClientSyncPayload>().catch(() => ({} as ClientSyncPayload));
  await syncClientActivity(c.env.DB, googleUser.sub, body);
  const data = await getUserActivityData(c.env.DB, googleUser.sub);
  return c.json(data);
});

userActivityRouter.post('/saved/:articleId', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const articleId = c.req.param('articleId');
  const ok = await saveDebateForUser(c.env.DB, googleUser, articleId);
  if (!ok) return c.json({ error: 'article_not_found' }, 404);

  return c.json({ saved: true, articleId });
});

userActivityRouter.delete('/saved/:articleId', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const articleId = c.req.param('articleId');
  await unsaveDebateForUser(c.env.DB, googleUser.sub, articleId);
  return c.json({ saved: false, articleId });
});

userActivityRouter.post('/subscriptions/:articleId', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const articleId = c.req.param('articleId');
  const ok = await subscribeToDebate(c.env.DB, googleUser, articleId);
  if (!ok) return c.json({ error: 'article_not_found' }, 404);

  return c.json({ subscribed: true, articleId });
});

userActivityRouter.delete('/subscriptions/:articleId', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const articleId = c.req.param('articleId');
  await unsubscribeFromDebate(c.env.DB, googleUser.sub, articleId);
  return c.json({ subscribed: false, articleId });
});

userActivityRouter.post('/activity', async (c) => {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return c.json({ error: 'unauthorized' }, 401);
  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token, c.env);
  } catch {
    return c.json({ error: 'invalid_token' }, 401);
  }

  const body = await c.req.json<ClientActivityEntry>();
  if (!body?.type?.trim()) return c.json({ error: 'missing_type' }, 400);

  const { id } = await appendUserActivity(c.env.DB, googleUser.sub, body);
  return c.json({ id });
});
