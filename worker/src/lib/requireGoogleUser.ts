import type { Context } from 'hono';
import type { Env } from '../types';
import { extractBearerToken, verifyGoogleToken, type GoogleUser } from './auth';

export async function requireGoogleUser(
  c: Context<{ Bindings: Env; Variables?: Record<string, unknown> }>,
): Promise<{ user: GoogleUser } | { error: Response }> {
  const token = extractBearerToken(c.req.header('Authorization'));
  if (!token) return { error: c.json({ error: 'unauthorized' }, 401) };
  try {
    const user = await verifyGoogleToken(token, c.env);
    return { user };
  } catch {
    return { error: c.json({ error: 'invalid_token' }, 401) };
  }
}
