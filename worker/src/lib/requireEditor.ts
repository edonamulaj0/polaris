import type { Context, Next } from 'hono';
import type { Env } from '../types';
import type { GoogleUser } from './auth';
import { verifyEditorSession } from './editorSession';
import { requireGoogleUser } from './requireGoogleUser';

export type EditorContext = {
  Bindings: Env;
  Variables: {
    editorUser: GoogleUser;
  };
};

export async function requireEditorMiddleware(c: Context<EditorContext>, next: Next) {
  const auth = await requireGoogleUser(c as unknown as Context<{ Bindings: Env }>);
  if ('error' in auth) return auth.error;

  const sessionToken = c.req.header('X-Editor-Session')?.trim();
  if (!sessionToken) {
    return c.json({ error: 'editor_session_required', message: 'Unlock the editor panel with your PIN.' }, 401);
  }

  const session = await verifyEditorSession(sessionToken, c.env);
  if (!session || session.sub !== auth.user.sub) {
    return c.json({ error: 'invalid_editor_session', message: 'Editor session expired — enter your PIN again.' }, 401);
  }

  const row = await c.env.DB.prepare(
    `SELECT is_editor FROM users WHERE id = ?`,
  )
    .bind(auth.user.sub)
    .first<{ is_editor: number }>();

  if (!row || row.is_editor !== 1) {
    return c.json({ error: 'not_editor', message: 'Register as an editor from your profile first.' }, 403);
  }

  c.set('editorUser', auth.user);
  await next();
}
