-- Tiered penalty system, violation audit log, expanded flag types

ALTER TABLE user_moderation_state ADD COLUMN warning_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_moderation_state ADD COLUMN timeout_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE user_moderation_state ADD COLUMN timeout_until INTEGER;
ALTER TABLE user_moderation_state ADD COLUMN social_banned INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS moderation_violations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  comment_id TEXT REFERENCES comments(id) ON DELETE SET NULL,
  violation_type TEXT NOT NULL CHECK(violation_type IN (
    'warning', 'timeout', 'social_ban', 'auto_delete', 'flagged_review'
  )),
  trigger_reason TEXT NOT NULL,
  severity TEXT CHECK(severity IN ('mild', 'moderate', 'extreme')),
  penalty_applied TEXT,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_violations_user ON moderation_violations(user_id, created_at DESC);

-- Expand flag_type to include masking_bypass (SQLite table rebuild)
CREATE TABLE IF NOT EXISTS comment_flags_new (
  id TEXT PRIMARY KEY,
  comment_id TEXT NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  flagged_by TEXT NOT NULL CHECK(flagged_by IN ('bot', 'editor')),
  flag_type TEXT NOT NULL CHECK(flag_type IN (
    'offensive', 'sarcasm', 'irony', 'borderline', 'false_positive', 'masking_bypass'
  )),
  confidence REAL,
  reasoning TEXT,
  resolved_by TEXT,
  resolved_action TEXT CHECK(resolved_action IN ('deleted', 'cleared', 'false_positive', 'approved')),
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  resolved_at INTEGER
);

INSERT INTO comment_flags_new
  SELECT id, comment_id, flagged_by, flag_type, confidence, reasoning,
         resolved_by, resolved_action, created_at, resolved_at
  FROM comment_flags;

DROP TABLE comment_flags;
ALTER TABLE comment_flags_new RENAME TO comment_flags;

CREATE INDEX IF NOT EXISTS idx_flags_comment ON comment_flags(comment_id);
CREATE INDEX IF NOT EXISTS idx_flags_unresolved ON comment_flags(resolved_at) WHERE resolved_at IS NULL;
