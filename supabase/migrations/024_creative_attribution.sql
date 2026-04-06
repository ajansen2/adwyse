-- Creative-Level Attribution Migration
-- Adds tracking at the ad creative level, not just campaign level

-- =====================================================
-- AD CREATIVES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS ad_creatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  ad_account_id UUID REFERENCES adwyse_ad_accounts(id) ON DELETE CASCADE,

  -- Platform identifiers
  platform TEXT NOT NULL, -- 'facebook', 'google', 'tiktok'
  platform_ad_id TEXT NOT NULL,
  platform_adset_id TEXT, -- Ad set/ad group
  platform_campaign_id TEXT,

  -- Creative info
  ad_name TEXT,
  adset_name TEXT,
  campaign_name TEXT,

  -- Creative content (for display)
  creative_type TEXT, -- 'image', 'video', 'carousel', 'text'
  headline TEXT,
  body_text TEXT,
  thumbnail_url TEXT,
  media_url TEXT,

  -- Status
  status TEXT DEFAULT 'active', -- 'active', 'paused', 'deleted'

  -- Metrics (aggregated)
  date DATE NOT NULL,
  spend DECIMAL(10,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,

  -- Attribution (calculated)
  attributed_revenue DECIMAL(10,2) DEFAULT 0,
  attributed_orders INTEGER DEFAULT 0,
  roas DECIMAL(10,2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(ad_account_id, platform_ad_id, date)
);

-- =====================================================
-- ADD CREATIVE COLUMNS TO ORDERS
-- =====================================================
DO $$
BEGIN
  -- Add ad_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adwyse_orders' AND column_name = 'fb_ad_id'
  ) THEN
    ALTER TABLE adwyse_orders ADD COLUMN fb_ad_id TEXT;
  END IF;

  -- Add adset_id column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adwyse_orders' AND column_name = 'fb_adset_id'
  ) THEN
    ALTER TABLE adwyse_orders ADD COLUMN fb_adset_id TEXT;
  END IF;

  -- Add Google creative columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adwyse_orders' AND column_name = 'google_creative_id'
  ) THEN
    ALTER TABLE adwyse_orders ADD COLUMN google_creative_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adwyse_orders' AND column_name = 'google_adgroup_id'
  ) THEN
    ALTER TABLE adwyse_orders ADD COLUMN google_adgroup_id TEXT;
  END IF;

  -- Add TikTok creative columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adwyse_orders' AND column_name = 'tt_ad_id'
  ) THEN
    ALTER TABLE adwyse_orders ADD COLUMN tt_ad_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adwyse_orders' AND column_name = 'tt_adgroup_id'
  ) THEN
    ALTER TABLE adwyse_orders ADD COLUMN tt_adgroup_id TEXT;
  END IF;
END $$;

-- =====================================================
-- ADD CREATIVE COLUMNS TO TOUCHPOINTS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attribution_touchpoints' AND column_name = 'fb_ad_id'
  ) THEN
    ALTER TABLE attribution_touchpoints ADD COLUMN fb_ad_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attribution_touchpoints' AND column_name = 'fb_adset_id'
  ) THEN
    ALTER TABLE attribution_touchpoints ADD COLUMN fb_adset_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attribution_touchpoints' AND column_name = 'google_creative_id'
  ) THEN
    ALTER TABLE attribution_touchpoints ADD COLUMN google_creative_id TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'attribution_touchpoints' AND column_name = 'google_adgroup_id'
  ) THEN
    ALTER TABLE attribution_touchpoints ADD COLUMN google_adgroup_id TEXT;
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_ad_creatives_store ON ad_creatives(store_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_platform_ad ON ad_creatives(platform_ad_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_campaign ON ad_creatives(platform_campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_creatives_date ON ad_creatives(store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_fb_ad ON adwyse_orders(fb_ad_id) WHERE fb_ad_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_google_creative ON adwyse_orders(google_creative_id) WHERE google_creative_id IS NOT NULL;

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE ad_creatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on ad_creatives" ON ad_creatives
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get top performing creatives
CREATE OR REPLACE FUNCTION get_top_creatives(
  p_store_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  platform_ad_id TEXT,
  ad_name TEXT,
  campaign_name TEXT,
  creative_type TEXT,
  thumbnail_url TEXT,
  total_spend DECIMAL,
  total_revenue DECIMAL,
  total_orders BIGINT,
  roas DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ac.platform_ad_id,
    ac.ad_name,
    ac.campaign_name,
    ac.creative_type,
    ac.thumbnail_url,
    SUM(ac.spend) as total_spend,
    SUM(ac.attributed_revenue) as total_revenue,
    SUM(ac.attributed_orders)::BIGINT as total_orders,
    CASE WHEN SUM(ac.spend) > 0 THEN SUM(ac.attributed_revenue) / SUM(ac.spend) ELSE 0 END as roas
  FROM ad_creatives ac
  WHERE ac.store_id = p_store_id
    AND (p_start_date IS NULL OR ac.date >= p_start_date)
    AND (p_end_date IS NULL OR ac.date <= p_end_date)
  GROUP BY ac.platform_ad_id, ac.ad_name, ac.campaign_name, ac.creative_type, ac.thumbnail_url
  ORDER BY SUM(ac.attributed_revenue) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Get creative fatigue indicators
CREATE OR REPLACE FUNCTION detect_creative_fatigue(
  p_store_id UUID,
  p_lookback_days INTEGER DEFAULT 14
)
RETURNS TABLE (
  platform_ad_id TEXT,
  ad_name TEXT,
  start_ctr DECIMAL,
  current_ctr DECIMAL,
  ctr_decline_pct DECIMAL,
  start_roas DECIMAL,
  current_roas DECIMAL,
  roas_decline_pct DECIMAL,
  is_fatigued BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  WITH creative_periods AS (
    SELECT
      ac.platform_ad_id,
      ac.ad_name,
      ac.date,
      CASE WHEN ac.impressions > 0 THEN (ac.clicks::DECIMAL / ac.impressions * 100) ELSE 0 END as ctr,
      CASE WHEN ac.spend > 0 THEN (ac.attributed_revenue / ac.spend) ELSE 0 END as roas,
      ROW_NUMBER() OVER (PARTITION BY ac.platform_ad_id ORDER BY ac.date ASC) as day_rank,
      COUNT(*) OVER (PARTITION BY ac.platform_ad_id) as total_days
    FROM ad_creatives ac
    WHERE ac.store_id = p_store_id
      AND ac.date >= CURRENT_DATE - p_lookback_days
  ),
  creative_comparison AS (
    SELECT
      cp.platform_ad_id,
      cp.ad_name,
      AVG(CASE WHEN cp.day_rank <= 3 THEN cp.ctr END) as start_ctr,
      AVG(CASE WHEN cp.day_rank > cp.total_days - 3 THEN cp.ctr END) as current_ctr,
      AVG(CASE WHEN cp.day_rank <= 3 THEN cp.roas END) as start_roas,
      AVG(CASE WHEN cp.day_rank > cp.total_days - 3 THEN cp.roas END) as current_roas
    FROM creative_periods cp
    WHERE cp.total_days >= 7 -- Need at least 7 days of data
    GROUP BY cp.platform_ad_id, cp.ad_name
  )
  SELECT
    cc.platform_ad_id,
    cc.ad_name,
    cc.start_ctr,
    cc.current_ctr,
    CASE WHEN cc.start_ctr > 0 THEN ((cc.start_ctr - cc.current_ctr) / cc.start_ctr * 100) ELSE 0 END as ctr_decline_pct,
    cc.start_roas,
    cc.current_roas,
    CASE WHEN cc.start_roas > 0 THEN ((cc.start_roas - cc.current_roas) / cc.start_roas * 100) ELSE 0 END as roas_decline_pct,
    -- Consider fatigued if CTR or ROAS declined by more than 20%
    (cc.start_ctr > cc.current_ctr * 1.2 OR cc.start_roas > cc.current_roas * 1.2) as is_fatigued
  FROM creative_comparison cc
  WHERE cc.start_ctr > 0 OR cc.start_roas > 0
  ORDER BY
    CASE WHEN cc.start_ctr > 0 THEN ((cc.start_ctr - cc.current_ctr) / cc.start_ctr * 100) ELSE 0 END DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE ad_creatives IS 'Individual ad creative performance data';
COMMENT ON FUNCTION get_top_creatives IS 'Get best performing ad creatives';
COMMENT ON FUNCTION detect_creative_fatigue IS 'Detect creatives showing declining performance';
