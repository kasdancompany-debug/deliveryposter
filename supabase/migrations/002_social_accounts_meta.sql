-- Meta (Facebook Page + Instagram Business) connection storage

ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_check;

-- Migrate legacy columns into Meta-focused shape
ALTER TABLE social_accounts
  ADD COLUMN IF NOT EXISTS page_name TEXT,
  ADD COLUMN IF NOT EXISTS instagram_business_account_id TEXT,
  ADD COLUMN IF NOT EXISTS instagram_username TEXT,
  ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMPTZ;

-- Backfill page_name from legacy account_name
UPDATE social_accounts
SET page_name = account_name
WHERE page_name IS NULL AND account_name IS NOT NULL;

ALTER TABLE social_accounts DROP COLUMN IF EXISTS account_name;
ALTER TABLE social_accounts DROP COLUMN IF EXISTS is_connected;
ALTER TABLE social_accounts DROP COLUMN IF EXISTS metadata;

ALTER TABLE social_accounts
  ALTER COLUMN platform SET DEFAULT 'meta';

ALTER TABLE social_accounts DROP CONSTRAINT IF EXISTS social_accounts_platform_page_id_key;

ALTER TABLE social_accounts
  ADD CONSTRAINT social_accounts_platform_check
  CHECK (platform IN ('meta', 'facebook', 'instagram'));

-- One Meta bundle per dealership install
CREATE UNIQUE INDEX IF NOT EXISTS social_accounts_meta_singleton
  ON social_accounts (platform)
  WHERE platform = 'meta';

COMMENT ON TABLE social_accounts IS 'OAuth tokens for Meta Graph (Facebook Page + linked Instagram Business).';
COMMENT ON COLUMN social_accounts.access_token_encrypted IS 'Encrypt at app layer before insert; never expose to client.';
