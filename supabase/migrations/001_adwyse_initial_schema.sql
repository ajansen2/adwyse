-- AdWyse Database Schema
-- Ad Attribution & Analytics for Shopify Merchants

-- =====================================================
-- STORES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS adwyse_stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT UNIQUE NOT NULL,
  shopify_store_id TEXT,
  store_name TEXT,
  email TEXT,

  -- Shopify OAuth
  access_token TEXT NOT NULL,

  -- Subscription
  subscription_status TEXT DEFAULT 'trial', -- trial, active, cancelled, past_due
  trial_ends_at TIMESTAMPTZ,
  subscription_started_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sync_at TIMESTAMPTZ
);

-- =====================================================
-- AD ACCOUNTS TABLE (Facebook, Google, TikTok, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS adwyse_ad_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,

  -- Platform info
  platform TEXT NOT NULL, -- 'facebook', 'google', 'tiktok', 'pinterest'
  account_id TEXT NOT NULL,
  account_name TEXT,

  -- OAuth tokens (encrypted in production)
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,

  -- Status
  is_connected BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, platform, account_id)
);

-- =====================================================
-- CAMPAIGNS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS adwyse_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ad_account_id UUID REFERENCES adwyse_ad_accounts(id) ON DELETE CASCADE,
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,

  -- Campaign identifiers
  platform_campaign_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,

  -- Campaign data
  status TEXT, -- active, paused, deleted

  -- Daily metrics (we'll aggregate these)
  date DATE NOT NULL,
  spend DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  -- Attribution (calculated by us)
  attributed_revenue DECIMAL(10,2) DEFAULT 0,
  attributed_orders INTEGER DEFAULT 0,
  roas DECIMAL(10,2), -- Return on Ad Spend (revenue / spend)

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ad_account_id, platform_campaign_id, date)
);

-- =====================================================
-- ORDERS TABLE (Shopify orders with attribution)
-- =====================================================
CREATE TABLE IF NOT EXISTS adwyse_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,

  -- Shopify order info
  shopify_order_id TEXT NOT NULL,
  order_number TEXT,
  total_price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Customer info
  customer_email TEXT,
  customer_id TEXT,

  -- Attribution data (extracted from landing_site_ref)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Click IDs for platform attribution
  fbclid TEXT, -- Facebook Click ID
  gclid TEXT,  -- Google Click ID
  ttclid TEXT, -- TikTok Click ID

  -- Attribution (we determine this)
  attributed_platform TEXT, -- 'facebook', 'google', 'tiktok', 'organic', 'direct'
  attributed_campaign_id UUID REFERENCES adwyse_campaigns(id),
  attribution_confidence DECIMAL(3,2), -- 0.00 to 1.00 (how confident we are)

  -- Timestamps
  order_created_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id, shopify_order_id)
);

-- =====================================================
-- AI INSIGHTS TABLE (Claude-generated recommendations)
-- =====================================================
CREATE TABLE IF NOT EXISTS adwyse_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES adwyse_campaigns(id) ON DELETE CASCADE,

  -- Insight details
  insight_type TEXT NOT NULL, -- 'opportunity', 'warning', 'recommendation'
  title TEXT NOT NULL,
  description TEXT NOT NULL,

  -- AI metadata
  ai_model TEXT DEFAULT 'claude-3-5-haiku-20241022',
  confidence_score DECIMAL(3,2),

  -- Action items
  suggested_action TEXT,
  estimated_impact TEXT, -- e.g., "Could save $500/month"

  -- Status
  status TEXT DEFAULT 'active', -- active, dismissed, actioned
  dismissed_at TIMESTAMPTZ,
  actioned_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- insights can expire if no longer relevant
);

-- =====================================================
-- INDEXES for Performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_adwyse_orders_store_id ON adwyse_orders(store_id);
CREATE INDEX IF NOT EXISTS idx_adwyse_orders_created_at ON adwyse_orders(order_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_adwyse_orders_attributed_platform ON adwyse_orders(attributed_platform);
CREATE INDEX IF NOT EXISTS idx_adwyse_campaigns_store_date ON adwyse_campaigns(store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_adwyse_campaigns_account ON adwyse_campaigns(ad_account_id);
CREATE INDEX IF NOT EXISTS idx_adwyse_insights_store ON adwyse_insights(store_id, status);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE adwyse_stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE adwyse_ad_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE adwyse_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE adwyse_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE adwyse_insights ENABLE ROW LEVEL SECURITY;

-- Policies (for now, allow all - we'll tighten this later)
CREATE POLICY "Allow all operations on stores" ON adwyse_stores FOR ALL USING (true);
CREATE POLICY "Allow all operations on ad_accounts" ON adwyse_ad_accounts FOR ALL USING (true);
CREATE POLICY "Allow all operations on campaigns" ON adwyse_campaigns FOR ALL USING (true);
CREATE POLICY "Allow all operations on orders" ON adwyse_orders FOR ALL USING (true);
CREATE POLICY "Allow all operations on insights" ON adwyse_insights FOR ALL USING (true);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to calculate ROAS for a campaign
CREATE OR REPLACE FUNCTION calculate_campaign_roas(campaign_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_spend DECIMAL;
  total_revenue DECIMAL;
BEGIN
  SELECT
    SUM(spend),
    SUM(attributed_revenue)
  INTO total_spend, total_revenue
  FROM adwyse_campaigns
  WHERE id = campaign_uuid;

  IF total_spend > 0 THEN
    RETURN total_revenue / total_spend;
  ELSE
    RETURN 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get store performance summary
CREATE OR REPLACE FUNCTION get_store_performance(store_uuid UUID, days INTEGER DEFAULT 30)
RETURNS TABLE(
  total_spend DECIMAL,
  total_revenue DECIMAL,
  total_orders BIGINT,
  avg_roas DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    SUM(c.spend) as total_spend,
    SUM(o.total_price) as total_revenue,
    COUNT(DISTINCT o.id) as total_orders,
    CASE
      WHEN SUM(c.spend) > 0 THEN SUM(o.total_price) / SUM(c.spend)
      ELSE 0
    END as avg_roas
  FROM adwyse_campaigns c
  LEFT JOIN adwyse_orders o ON o.attributed_campaign_id = c.id
  WHERE c.store_id = store_uuid
    AND c.date >= CURRENT_DATE - days;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE adwyse_stores IS 'Shopify stores using AdWyse';
COMMENT ON TABLE adwyse_ad_accounts IS 'Connected ad accounts (Facebook, Google, etc.)';
COMMENT ON TABLE adwyse_campaigns IS 'Ad campaigns with daily metrics';
COMMENT ON TABLE adwyse_orders IS 'Shopify orders with attribution data';
COMMENT ON TABLE adwyse_insights IS 'AI-generated insights and recommendations';
