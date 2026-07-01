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

const DEFAULT_ORIGINS = [
  'https://polaris-a4m.pages.dev',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
];

function allowedOrigins(env: Env): string[] {
  const extra = env.ALLOWED_ORIGINS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  return [...new Set([...DEFAULT_ORIGINS, ...extra])];
}

app.use('*', async (c, next) => {
  const origins = allowedOrigins(c.env);
  const middleware = cors({
    origin: (origin) => {
      if (!origin) return origins[0];
      return origins.includes(origin) ? origin : null;
    },
    allowMethods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'X-Editor-Session'],
  });
  return middleware(c, next);
});

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
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runIngest(env));
  },
};
