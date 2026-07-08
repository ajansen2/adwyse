-- Add data retention columns for uninstall handling
ALTER TABLE adwyse_stores
  ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS purge_after TIMESTAMPTZ;

-- Rebuild the stores view to include new columns
DROP VIEW IF EXISTS stores CASCADE;
CREATE VIEW stores AS SELECT * FROM adwyse_stores;
GRANT ALL ON stores TO authenticated, anon;
ALTER VIEW stores SET (security_invoker = on);
