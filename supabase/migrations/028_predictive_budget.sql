-- Migration: Predictive Budget Allocation
-- Adds tables for campaign daily stats and predictive analytics

-- Campaign daily statistics for trend analysis
CREATE TABLE IF NOT EXISTS campaign_daily_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES adwyse_campaigns(id) ON DELETE CASCADE,
  platform_campaign_id TEXT,
  date DATE NOT NULL,
  spend DECIMAL(12,2) DEFAULT 0,
  revenue DECIMAL(12,2) DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  conversions INTEGER DEFAULT 0,
  ctr DECIMAL(8,4) GENERATED ALWAYS AS (
    CASE WHEN impressions > 0 THEN (clicks::DECIMAL / impressions) * 100 ELSE 0 END
  ) STORED,
  cvr DECIMAL(8,4) GENERATED ALWAYS AS (
    CASE WHEN clicks > 0 THEN (conversions::DECIMAL / clicks) * 100 ELSE 0 END
  ) STORED,
  cpc DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN clicks > 0 THEN spend / clicks ELSE 0 END
  ) STORED,
  cpa DECIMAL(10,2) GENERATED ALWAYS AS (
    CASE WHEN conversions > 0 THEN spend / conversions ELSE 0 END
  ) STORED,
  roas DECIMAL(8,2) GENERATED ALWAYS AS (
    CASE WHEN spend > 0 THEN revenue / spend ELSE 0 END
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(campaign_id, date)
);

-- Index for efficient date-range queries
CREATE INDEX IF NOT EXISTS idx_campaign_daily_stats_date
  ON campaign_daily_stats(store_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_campaign_daily_stats_campaign
  ON campaign_daily_stats(campaign_id, date DESC);

-- Budget forecasts cache
CREATE TABLE IF NOT EXISTS budget_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  forecast_date DATE NOT NULL,
  forecast_type TEXT NOT NULL DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  predicted_spend DECIMAL(12,2),
  predicted_revenue DECIMAL(12,2),
  predicted_roas DECIMAL(8,2),
  confidence_low DECIMAL(8,2),
  confidence_high DECIMAL(8,2),
  actual_spend DECIMAL(12,2),
  actual_revenue DECIMAL(12,2),
  actual_roas DECIMAL(8,2),
  accuracy_score DECIMAL(5,2), -- How accurate was the prediction (0-100)
  model_version TEXT DEFAULT 'v1',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, forecast_date, forecast_type)
);

-- Budget pacing settings
CREATE TABLE IF NOT EXISTS budget_pacing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES adwyse_campaigns(id) ON DELETE CASCADE,
  monthly_budget DECIMAL(12,2),
  daily_budget_min DECIMAL(12,2),
  daily_budget_max DECIMAL(12,2),
  pacing_strategy TEXT DEFAULT 'even', -- 'even', 'front_loaded', 'back_loaded', 'performance_based'
  auto_adjust BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, campaign_id)
);

-- Function to aggregate daily stats from campaign syncs
CREATE OR REPLACE FUNCTION aggregate_campaign_daily_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Upsert daily stats when campaign is updated
  INSERT INTO campaign_daily_stats (
    store_id,
    campaign_id,
    platform_campaign_id,
    date,
    spend,
    revenue,
    impressions,
    clicks,
    conversions
  ) VALUES (
    NEW.store_id,
    NEW.id,
    NEW.platform_campaign_id,
    CURRENT_DATE,
    COALESCE(NEW.spend, 0),
    COALESCE(NEW.attributed_revenue, 0),
    COALESCE(NEW.impressions, 0),
    COALESCE(NEW.clicks, 0),
    COALESCE(NEW.attributed_orders, 0)
  )
  ON CONFLICT (campaign_id, date) DO UPDATE SET
    spend = EXCLUDED.spend,
    revenue = EXCLUDED.revenue,
    impressions = EXCLUDED.impressions,
    clicks = EXCLUDED.clicks,
    conversions = EXCLUDED.conversions,
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-populate daily stats on campaign sync
DROP TRIGGER IF EXISTS trigger_aggregate_daily_stats ON adwyse_campaigns;
CREATE TRIGGER trigger_aggregate_daily_stats
  AFTER INSERT OR UPDATE ON adwyse_campaigns
  FOR EACH ROW
  EXECUTE FUNCTION aggregate_campaign_daily_stats();

-- Add columns to store_settings for budget preferences
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS monthly_ad_budget DECIMAL(12,2),
  ADD COLUMN IF NOT EXISTS budget_alert_threshold INTEGER DEFAULT 90,
  ADD COLUMN IF NOT EXISTS auto_budget_optimization BOOLEAN DEFAULT FALSE;

-- RLS policies
ALTER TABLE campaign_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_forecasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_pacing ENABLE ROW LEVEL SECURITY;

-- RLS for campaign_daily_stats
CREATE POLICY "Users can view their own campaign stats"
  ON campaign_daily_stats FOR SELECT
  USING (store_id IN (
    SELECT id FROM adwyse_stores WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage campaign stats"
  ON campaign_daily_stats FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS for budget_forecasts
CREATE POLICY "Users can view their own forecasts"
  ON budget_forecasts FOR SELECT
  USING (store_id IN (
    SELECT id FROM adwyse_stores WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage forecasts"
  ON budget_forecasts FOR ALL
  USING (true)
  WITH CHECK (true);

-- RLS for budget_pacing
CREATE POLICY "Users can manage their own pacing"
  ON budget_pacing FOR ALL
  USING (store_id IN (
    SELECT id FROM adwyse_stores WHERE user_id = auth.uid()
  ));

CREATE POLICY "Service role can manage pacing"
  ON budget_pacing FOR ALL
  USING (true)
  WITH CHECK (true);
