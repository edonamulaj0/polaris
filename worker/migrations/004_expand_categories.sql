-- Expand article categories beyond Technology / Science / Nature
-- SQLite cannot ALTER CHECK constraints — rebuild articles table

PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS articles_v2 (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  category      TEXT NOT NULL,
  image_url     TEXT,
  lede          TEXT NOT NULL,
  background    TEXT NOT NULL,
  perspectives  TEXT NOT NULL,
  evidence      TEXT NOT NULL,
  counterpoint  TEXT NOT NULL,
  implications  TEXT NOT NULL,
  conclusion    TEXT NOT NULL,
  source_urls   TEXT NOT NULL DEFAULT '[]',
  civility      INTEGER NOT NULL DEFAULT 75,
  stance_for    INTEGER NOT NULL DEFAULT 33,
  stance_against INTEGER NOT NULL DEFAULT 33,
  stance_neutral INTEGER NOT NULL DEFAULT 34,
  published_at  INTEGER NOT NULL DEFAULT (unixepoch()),
  verified      INTEGER NOT NULL DEFAULT 0,
  hidden        INTEGER NOT NULL DEFAULT 0,
  source_type   TEXT NOT NULL DEFAULT 'ingest',
  submitted_by  TEXT REFERENCES users(id),
  submitter_stance TEXT,
  submission_description TEXT,
  verified_by   TEXT,
  verified_at   INTEGER
);

INSERT INTO articles_v2 SELECT * FROM articles;
DROP TABLE articles;
ALTER TABLE articles_v2 RENAME TO articles;

CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_published ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_submitted_by ON articles(submitted_by);
CREATE INDEX IF NOT EXISTS idx_articles_verified ON articles(verified, hidden, published_at DESC);

PRAGMA foreign_keys=ON;
