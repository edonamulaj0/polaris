-- Server-side editor registration and PIN verification
ALTER TABLE users ADD COLUMN is_editor INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN editor_pin_hash TEXT;
