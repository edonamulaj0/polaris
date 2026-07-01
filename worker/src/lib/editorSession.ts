import type { Env } from '../types';
import { sessionSecret } from './pinHash';

const SESSION_TTL_SEC = 8 * 60 * 60;

interface SessionPayload {
  sub: string;
  name: string;
  exp: number;
}

function b64urlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  const padded = str.replace(/-/g, '+').replace(/_/g, '/');
  const pad = padded.length % 4 === 0 ? padded : padded + '='.repeat(4 - (padded.length % 4));
  const binary = atob(pad);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function sign(data: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return b64urlEncode(new Uint8Array(sig));
}

async function verifySignature(data: string, signature: string, secret: string): Promise<boolean> {
  const expected = await sign(data, secret);
  return expected === signature;
}

export async function createEditorSession(
  env: Env,
  sub: string,
  name: string,
): Promise<{ token: string; expiresAt: number }> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_TTL_SEC;
  const payload: SessionPayload = { sub, name, exp };
  const payloadJson = JSON.stringify(payload);
  const payloadB64 = b64urlEncode(new TextEncoder().encode(payloadJson));
  const signature = await sign(payloadB64, sessionSecret(env));
  return { token: `${payloadB64}.${signature}`, expiresAt: exp };
}

export async function verifyEditorSession(
  token: string,
  env: Env,
): Promise<SessionPayload | null> {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, signature] = parts;
  if (!(await verifySignature(payloadB64, signature, sessionSecret(env)))) return null;

  try {
    const json = new TextDecoder().decode(b64urlDecode(payloadB64));
    const payload = JSON.parse(json) as SessionPayload;
    if (!payload.sub || !payload.exp) return null;
    if (payload.exp <= Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
