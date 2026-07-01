-- User saved debates (hearts), activity feed — keyed by Google account (users.id)

CREATE TABLE IF NOT EXISTS user_saved_debates (
  user_id     TEXT NOT NULL REFERENCES users(id),
  article_id  TEXT NOT NULL,
  saved_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_user_saved_user ON user_saved_debates(user_id, saved_at DESC);

CREATE TABLE IF NOT EXISTS user_activity (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id),
  activity_type TEXT NOT NULL,
  title         TEXT,
  detail        TEXT,
  discussion_id TEXT,
  created_at    INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id, created_at DESC);
