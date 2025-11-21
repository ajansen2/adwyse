-- Create views to alias adwyse_* tables to their shorter names
-- Run this in Supabase SQL Editor

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
GRANT ALL ON stores TO authenticated, anon, service_role;
GRANT ALL ON ad_accounts TO authenticated, anon, service_role;
GRANT ALL ON campaigns TO authenticated, anon, service_role;
GRANT ALL ON orders TO authenticated, anon, service_role;
GRANT ALL ON insights TO authenticated, anon, service_role;
