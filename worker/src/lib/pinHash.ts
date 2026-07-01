import type { Env } from '../types';

function sessionSecret(env: Env): string {
  const secret = env.EDITOR_SESSION_SECRET?.trim();
  if (secret) return secret;
  if (env.ENVIRONMENT === 'production') {
    throw new Error('EDITOR_SESSION_SECRET is not configured');
  }
  return `dev-editor-secret:${env.GOOGLE_CLIENT_ID}`;
}

export async function hashEditorPin(env: Env, userId: string, pin: string): Promise<string> {
  const data = new TextEncoder().encode(`${sessionSecret(env)}:${userId}:${pin}`);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function verifyEditorPin(
  env: Env,
  userId: string,
  pin: string,
  storedHash: string | null | undefined,
): Promise<boolean> {
  if (!storedHash?.trim()) return false;
  const digest = await hashEditorPin(env, userId, pin);
  return digest === storedHash;
}

export { sessionSecret };
