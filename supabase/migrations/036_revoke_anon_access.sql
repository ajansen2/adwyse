-- 036: SECURITY FIX — Revoke anon key access to all tables
-- The anon key is public (embedded in frontend JS bundle).
-- All data access must go through server-side API routes using the service role key.
-- Previously, every table was readable by the anon key due to GRANT ALL TO anon
-- on views and permissive RLS policies.

-- Revoke on views
REVOKE ALL ON ad_accounts FROM anon;
REVOKE ALL ON stores FROM anon;
REVOKE ALL ON orders FROM anon;
REVOKE ALL ON campaigns FROM anon;
REVOKE ALL ON insights FROM anon;

-- Revoke on base tables
REVOKE ALL ON adwyse_stores FROM anon;
REVOKE ALL ON adwyse_ad_accounts FROM anon;
REVOKE ALL ON adwyse_orders FROM anon;
REVOKE ALL ON adwyse_campaigns FROM anon;
REVOKE ALL ON adwyse_insights FROM anon;
REVOKE ALL ON alerts FROM anon;
REVOKE ALL ON pixel_events FROM anon;
REVOKE ALL ON pixel_config FROM anon;
REVOKE ALL ON store_settings FROM anon;
REVOKE ALL ON store_goals FROM anon;
REVOKE ALL ON goal_progress FROM anon;
REVOKE ALL ON product_costs FROM anon;
REVOKE ALL ON adwyse_order_line_items FROM anon;
REVOKE ALL ON ad_creatives FROM anon;
REVOKE ALL ON attribution_touchpoints FROM anon;
REVOKE ALL ON attribution_results FROM anon;
REVOKE ALL ON competitor_tracking FROM anon;
REVOKE ALL ON competitor_saved_ads FROM anon;
REVOKE ALL ON competitor_ads_cache FROM anon;
REVOKE ALL ON campaign_daily_stats FROM anon;
REVOKE ALL ON meta_capi_events_log FROM anon;
REVOKE ALL ON notification_preferences FROM anon;
REVOKE ALL ON notification_log FROM anon;
REVOKE ALL ON webhook_metrics FROM anon;
