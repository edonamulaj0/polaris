// worker/src/routes/users.ts
// [WRK-2] User API — upsert on sign-in, birthday write-once

import { Hono } from 'hono';
import type { Env, UserRow } from '../types';
import { validateBirthDate } from '../lib/birthdayHelpers';

export const usersRouter = new Hono<{ Bindings: Env }>(); // [WRK-2]

usersRouter.post('/', async (c) => {
  const body = await c.req.json<{ sub: string; email: string; name: string }>(); // [WRK-2]

  if (!body.sub || !body.email || !body.name) {
    return c.json({ error: 'missing_fields' }, 400); // [WRK-2]
  }

  await c.env.DB.prepare(
    `INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)`,
  )
    .bind(body.sub, body.email, body.name)
    .run(); // [WRK-2]

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(body.sub)
    .first<UserRow>(); // [WRK-2]

  if (!user) {
    return c.json({ error: 'user_not_found' }, 500); // [WRK-2]
  }

  return c.json({
    id: user.id, // [WRK-2]
    email: user.email, // [WRK-2]
    name: user.name, // [WRK-2]
    birthDateSet: user.birth_locked === 1, // [WRK-2]
  });
});

usersRouter.get('/:sub/birthday', async (c) => {
  const sub = c.req.param('sub'); // [WRK-2]

  const user = await c.env.DB.prepare(
    `SELECT birth_locked, birth_date FROM users WHERE id = ?`,
  )
    .bind(sub)
    .first<{ birth_locked: number; birth_date: string | null }>(); // [WRK-2]

  if (!user) {
    return c.json({ set: false }); // [WRK-2]
  }

  return c.json({
    set: user.birth_locked === 1, // [WRK-2]
    birthDate: user.birth_date ?? undefined, // [WRK-2]
  });
});

usersRouter.post('/:sub/birthday', async (c) => {
  const sub = c.req.param('sub'); // [WRK-2]
  const body = await c.req.json<{ birthDate: string }>(); // [WRK-2]

  if (!body.birthDate) {
    return c.json({ error: 'missing_birth_date' }, 400); // [WRK-2]
  }

  const user = await c.env.DB.prepare(`SELECT * FROM users WHERE id = ?`)
    .bind(sub)
    .first<UserRow>(); // [WRK-2]

  if (!user) {
    return c.json({ error: 'user_not_found' }, 404); // [WRK-2]
  }

  if (user.birth_locked === 1) {
    return c.json({ error: 'birthday_already_set' }, 409); // [WRK-2]
  }

  const validationError = validateBirthDate(body.birthDate); // [WRK-2]
  if (validationError) {
    return c.json({ error: validationError }, 400); // [WRK-2]
  }

  await c.env.DB.prepare(
    `UPDATE users SET birth_date = ?, birth_locked = 1 WHERE id = ?`,
  )
    .bind(body.birthDate, sub)
    .run(); // [WRK-2]

  return c.json({ success: true }); // [WRK-2]
});
