-- Create views to alias adwyse_* tables to their shorter names
-- This version handles both tables and views

-- Drop existing objects (tables or views)
DROP TABLE IF EXISTS stores CASCADE;
DROP TABLE IF EXISTS ad_accounts CASCADE;
DROP TABLE IF EXISTS campaigns CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS insights CASCADE;

-- Create view aliases
CREATE VIEW stores AS SELECT * FROM adwyse_stores;
CREATE VIEW ad_accounts AS SELECT * FROM adwyse_ad_accounts;
CREATE VIEW campaigns AS SELECT * FROM adwyse_campaigns;
CREATE VIEW orders AS SELECT * FROM adwyse_orders;
CREATE VIEW insights AS SELECT * FROM adwyse_insights;

-- Grant permissions on views
GRANT ALL ON stores TO authenticated, anon, service_role;
GRANT ALL ON ad_accounts TO authenticated, anon, service_role;
GRANT ALL ON campaigns TO authenticated, anon, service_role;
GRANT ALL ON orders TO authenticated, anon, service_role;
GRANT ALL ON insights TO authenticated, anon, service_role;
