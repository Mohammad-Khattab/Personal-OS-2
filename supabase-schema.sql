-- Run this entire file in: Supabase Dashboard → SQL Editor → New query → Run
-- ─────────────────────────────────────────────────────────────────────────────

-- Key-value store for all app data (mirrors localStorage keys)
CREATE TABLE IF NOT EXISTS user_data (
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  key        TEXT        NOT NULL,
  value      TEXT        NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, key)
);

-- Row-level security: users can only see/edit their own rows
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own data"
  ON user_data
  FOR ALL
  USING  (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS user_data_user_idx ON user_data (user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- DONE. After running:
--  1. Go to Authentication → Users → Add user
--  2. Create your account (email + password)
--  3. Copy your Project URL and anon key from Settings → API
--  4. Paste them into your .env file (or Vercel env vars)
-- ─────────────────────────────────────────────────────────────────────────────
