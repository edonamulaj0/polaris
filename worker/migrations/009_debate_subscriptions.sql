-- Per-debate comment notification subscriptions
CREATE TABLE IF NOT EXISTS debate_subscriptions (
  user_id     TEXT NOT NULL REFERENCES users(id),
  article_id  TEXT NOT NULL,
  subscribed_at INTEGER NOT NULL DEFAULT (unixepoch()),
  PRIMARY KEY (user_id, article_id)
);

CREATE INDEX IF NOT EXISTS idx_debate_subscriptions_article ON debate_subscriptions(article_id);
