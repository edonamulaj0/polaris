import type { GoogleUser } from './auth';

/** Upsert Google account row — required before FK inserts (votes, saves, comments). */
export async function ensureUserRow(
  db: D1Database,
  user: Pick<GoogleUser, 'sub' | 'email' | 'name'>,
): Promise<void> {
  const existing = await db
    .prepare(`SELECT id FROM users WHERE id = ?`)
    .bind(user.sub)
    .first<{ id: string }>();

  if (existing) {
    await db
      .prepare(`UPDATE users SET name = ? WHERE id = ?`)
      .bind(user.name, user.sub)
      .run();
    return;
  }

  try {
    await db
      .prepare(`INSERT INTO users (id, email, name) VALUES (?, ?, ?)`)
      .bind(user.sub, user.email, user.name)
      .run();
  } catch (err) {
    console.error('ensureUserRow insert failed:', err);
    throw err;
  }
}
