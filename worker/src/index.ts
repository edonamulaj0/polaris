// worker/src/index.ts
// Hono API — deployed as polaris-worker (separate from Pages)

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { usersRouter } from './routes/users';
import { articlesRouter } from './routes/articles';
import { topicsRouter } from './routes/topics';
import { editorRouter } from './routes/editor';
import { debatesRouter, commentDeleteRouter } from './routes/comments';
import { runIngest } from './jobs/ingest';

const app = new Hono<{ Bindings: Env }>();

app.use(
  '*',
  cors({ origin: '*', allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'] }),
);

app.get('/api/health', (c) => {
  return c.json({ ok: true, environment: c.env.ENVIRONMENT });
});

app.route('/api/users', usersRouter);
app.route('/api/articles', articlesRouter);
app.route('/api/topics', topicsRouter);
app.route('/api/editor', editorRouter);
app.route('/api/debates', debatesRouter);
app.route('/api/comments', commentDeleteRouter);

export default {
  fetch: app.fetch,
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runIngest(env));
  },
};
