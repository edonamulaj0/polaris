// worker/src/index.ts
// [WRK-1] Hono app with full API routes and scheduled ingest

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { usersRouter } from './routes/users';
import { articlesRouter } from './routes/articles';
import { runIngest } from './jobs/ingest';

const app = new Hono<{ Bindings: Env }>(); // [WRK-1]

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] })); // [WRK-1]

app.get('/api/health', (c) => {
  return c.json({ ok: true, environment: c.env.ENVIRONMENT }); // [WRK-1]
});

app.route('/api/users', usersRouter); // [WRK-2]
app.route('/api/articles', articlesRouter); // [WRK-3]

export default {
  fetch: app.fetch, // [WRK-1]
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runIngest(env)); // [WRK-5]
  },
};
