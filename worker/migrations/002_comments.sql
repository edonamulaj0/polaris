-- [DB-2] Comments, moderation flags, strikes, and user moderation state

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  debate_id TEXT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES comments(id),
  body TEXT NOT NULL,
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  deleted_at INTEGER,
  deleted_by TEXT CHECK(deleted_by IN ('bot', 'editor', 'user')),
  moderation_status TEXT NOT NULL DEFAULT 'visible'
    CHECK(moderation_status IN ('visible', 'auto_deleted', 'flagged', 'editor_deleted', 'cleared'))
);

CREATE TABLE IF NOT EXISTS comment_flags (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  flagged_by TEXT NOT NULL CHECK(flagged_by IN ('bot', 'editor')),
  flag_type TEXT NOT NULL CHECK(flag_type IN ('offensive', 'sarcasm', 'irony', 'borderline', 'false_positive')),
  confidence REAL,
  reasoning TEXT,
  resolved_by TEXT,
  resolved_action TEXT CHECK(resolved_action IN ('deleted', 'cleared', 'false_positive')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  resolved_at INTEGER
);

CREATE TABLE IF NOT EXISTS user_strikes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT NOT NULL REFERENCES comments(id),
  reason TEXT NOT NULL,
  issued_at INTEGER NOT NULL DEFAULT (unixepoch()),
  issued_by TEXT NOT NULL CHECK(issued_by IN ('bot', 'editor'))
);

CREATE TABLE IF NOT EXISTS user_moderation_state (
  user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  strike_count INTEGER NOT NULL DEFAULT 0,
  comment_blocked INTEGER NOT NULL DEFAULT 0,
  banned INTEGER NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS user_pardons (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  editor_id TEXT NOT NULL,
  reason TEXT,
  issued_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_comments_debate ON comments(debate_id, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_user ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_flags_comment ON comment_flags(comment_id);
CREATE INDEX IF NOT EXISTS idx_flags_unresolved ON comment_flags(resolved_at) WHERE resolved_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_strikes_user ON user_strikes(user_id);
