-- Create views to alias adwyse_* tables to their shorter names
-- This allows the code to reference 'stores' instead of 'adwyse_stores'

-- Drop existing views if they exist
DROP VIEW IF EXISTS stores CASCADE;
DROP VIEW IF EXISTS ad_accounts CASCADE;
DROP VIEW IF EXISTS campaigns CASCADE;
DROP VIEW IF EXISTS orders CASCADE;
DROP VIEW IF EXISTS insights CASCADE;

-- Create view aliases
CREATE VIEW stores AS SELECT * FROM adwyse_stores;
CREATE VIEW ad_accounts AS SELECT * FROM adwyse_ad_accounts;
CREATE VIEW campaigns AS SELECT * FROM adwyse_campaigns;
CREATE VIEW orders AS SELECT * FROM adwyse_orders;
CREATE VIEW insights AS SELECT * FROM adwyse_insights;

-- Grant permissions on views
GRANT ALL ON stores TO authenticated, anon;
GRANT ALL ON ad_accounts TO authenticated, anon;
GRANT ALL ON campaigns TO authenticated, anon;
GRANT ALL ON orders TO authenticated, anon;
GRANT ALL ON insights TO authenticated, anon;

-- Enable RLS on views (inherits from base tables)
ALTER VIEW stores SET (security_invoker = on);
ALTER VIEW ad_accounts SET (security_invoker = on);
ALTER VIEW campaigns SET (security_invoker = on);
ALTER VIEW orders SET (security_invoker = on);
ALTER VIEW insights SET (security_invoker = on);
