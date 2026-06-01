-- [DB-2] Topic submissions + verification metadata (run once on existing D1)
ALTER TABLE articles ADD COLUMN source_type TEXT NOT NULL DEFAULT 'ingest';
ALTER TABLE articles ADD COLUMN submitted_by TEXT REFERENCES users(id);
ALTER TABLE articles ADD COLUMN submitter_stance TEXT;
ALTER TABLE articles ADD COLUMN submission_description TEXT;
ALTER TABLE articles ADD COLUMN verified_by TEXT;
ALTER TABLE articles ADD COLUMN verified_at INTEGER;

-- Existing ingested articles should appear in the public verified feed
UPDATE articles SET verified = 1 WHERE verified = 0 AND (source_type = 'ingest' OR source_type IS NULL);

CREATE INDEX IF NOT EXISTS idx_articles_submitted_by ON articles(submitted_by);
CREATE INDEX IF NOT EXISTS idx_articles_verified ON articles(verified, hidden, published_at DESC);
