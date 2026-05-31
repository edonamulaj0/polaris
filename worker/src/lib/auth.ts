// worker/src/lib/auth.ts
// [WRK-2] Google ID token verification via tokeninfo endpoint

import type { Env } from '../types';

export interface GoogleUser {
  sub: string;
  email: string;
  name: string;
}

interface TokenInfoResponse {
  aud: string;
  exp: string;
  sub: string;
  email: string;
  name: string;
  error_description?: string;
}

export async function verifyGoogleToken(token: string, env: Env): Promise<GoogleUser> {
  const res = await fetch(
    `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${encodeURIComponent(token)}`,
  ); // [WRK-2]

  if (!res.ok) {
    throw new Error('invalid_token'); // [WRK-2]
  }

  const data = (await res.json()) as TokenInfoResponse; // [WRK-2]

  if (data.error_description) {
    throw new Error('invalid_token'); // [WRK-2]
  }

  if (data.aud !== env.GOOGLE_CLIENT_ID) {
    throw new Error('invalid_audience'); // [WRK-2]
  }

  const now = Math.floor(Date.now() / 1000); // [WRK-2]
  if (parseInt(data.exp, 10) <= now) {
    throw new Error('token_expired'); // [WRK-2]
  }

  return {
    sub: data.sub, // [WRK-2]
    email: data.email, // [WRK-2]
    name: data.name || data.email, // [WRK-2]
  };
}
