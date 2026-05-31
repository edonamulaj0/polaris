// worker/src/index.ts
// Hono API + static asset fallback for unified Pages deploy

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import type { Env } from './types';
import { usersRouter } from './routes/users';
import { articlesRouter } from './routes/articles';
import { runIngest } from './jobs/ingest';

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors({ origin: '*', allowMethods: ['GET', 'POST', 'OPTIONS'] }));

app.get('/api/health', (c) => {
  return c.json({ ok: true, environment: c.env.ENVIRONMENT });
});

app.route('/api/users', usersRouter);
app.route('/api/articles', articlesRouter);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api')) {
      return app.fetch(request, env, ctx);
    }

    if (env.STATIC) {
      const assetResponse = await env.STATIC.fetch(request);
      if (assetResponse.status !== 404) {
        return assetResponse;
      }
      // SPA fallback — client-side routes
      return env.STATIC.fetch(new Request(new URL('/index.html', request.url), request));
    }

    return new Response('Not found', { status: 404 });
  },

  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runIngest(env));
  },
};
