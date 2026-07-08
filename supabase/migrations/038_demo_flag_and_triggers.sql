-- 038: Add is_demo flag and updated_at triggers
-- Paste this into the Supabase SQL Editor

-- 1. Add is_demo column to adwyse_ad_accounts
ALTER TABLE adwyse_ad_accounts
  ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;

-- 2. Create shared trigger function for updated_at
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Attach trigger to all tables with an updated_at column
CREATE TRIGGER set_updated_at_ad_accounts
  BEFORE UPDATE ON adwyse_ad_accounts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_stores
  BEFORE UPDATE ON adwyse_stores
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_campaigns
  BEFORE UPDATE ON adwyse_campaigns
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_store_settings
  BEFORE UPDATE ON store_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER set_updated_at_product_costs
  BEFORE UPDATE ON product_costs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- 4. Mark existing demo accounts
UPDATE adwyse_ad_accounts SET is_demo = true WHERE account_name LIKE 'Demo %';

-- 5. Rebuild ad_accounts view to include is_demo
DROP VIEW IF EXISTS ad_accounts CASCADE;
CREATE VIEW ad_accounts AS SELECT * FROM adwyse_ad_accounts;
GRANT ALL ON ad_accounts TO authenticated;
ALTER VIEW ad_accounts SET (security_invoker = on);
