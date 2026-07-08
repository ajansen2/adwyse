-- 035: Add sync status tracking columns to adwyse_ad_accounts
ALTER TABLE adwyse_ad_accounts
  ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'idle',
  ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_sync_error TEXT;

-- Recreate the ad_accounts view to include the new columns
DROP VIEW IF EXISTS ad_accounts CASCADE;
CREATE VIEW ad_accounts AS SELECT * FROM adwyse_ad_accounts;
GRANT ALL ON ad_accounts TO authenticated, anon;
ALTER VIEW ad_accounts SET (security_invoker = on);
