-- [DB-1] Users table — one row per Google account
CREATE TABLE IF NOT EXISTS users (
  id          TEXT PRIMARY KEY,        -- Google subject (googleSub)
  email       TEXT NOT NULL UNIQUE,
  name        TEXT NOT NULL,
  birth_date  TEXT,                    -- YYYY-MM-DD, NULL until set
  birth_locked INTEGER NOT NULL DEFAULT 0, -- 1 once birthday is saved (write-once)
  created_at  INTEGER NOT NULL DEFAULT (unixepoch())
);

-- [DB-1] Articles table — synthesised news articles
CREATE TABLE IF NOT EXISTS articles (
  id            TEXT PRIMARY KEY,      -- e.g. 'art-{hash}'
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  image_url     TEXT,
  lede          TEXT NOT NULL,         -- opening paragraph
  background    TEXT NOT NULL,         -- context/history paragraph
  perspectives  TEXT NOT NULL,         -- prose: multiple viewpoints
  evidence      TEXT NOT NULL,         -- data, studies, expert quotes
  counterpoint  TEXT NOT NULL,         -- strongest opposing view
  implications  TEXT NOT NULL,         -- outlook/consequences
  conclusion    TEXT NOT NULL,         -- closing paragraph
  source_urls   TEXT NOT NULL DEFAULT '[]',  -- JSON array of {title,url,domain}
  civility      INTEGER NOT NULL DEFAULT 75,
  stance_for    INTEGER NOT NULL DEFAULT 33,
  stance_against INTEGER NOT NULL DEFAULT 33,
  stance_neutral INTEGER NOT NULL DEFAULT 34,
  published_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  verified      INTEGER NOT NULL DEFAULT 0,
  hidden        INTEGER NOT NULL DEFAULT 0,
  source_type   TEXT NOT NULL DEFAULT 'ingest',  -- 'ingest' | 'user_submission'
  submitted_by  TEXT REFERENCES users(id),        -- NULL for ingest pipeline
  submitter_stance TEXT,                          -- 'For' | 'Against' | 'Neutral'
  submission_description TEXT,
  verified_by   TEXT,
  verified_at   INTEGER
);

-- [DB-1] Votes table — one vote per user per article
CREATE TABLE IF NOT EXISTS votes (
  user_id     TEXT NOT NULL REFERENCES users(id),
  article_id  TEXT NOT NULL REFERENCES articles(id),
  stance      TEXT NOT NULL CHECK(stance IN ('For','Against','Neutral')),
  voted_at    INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, article_id)
);

-- [DB-1] Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_submitted_by ON articles(submitted_by);
CREATE INDEX IF NOT EXISTS idx_articles_verified ON articles(verified, hidden, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_article ON votes(article_id);

-- Saved debates (hearts) and activity feed per Google account
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
