-- Create the alerts table
-- This table was referenced by migrations 025 and 026 (which ALTER it)
-- and by lib/alerts.ts, cron jobs, and the alerts API, but was never created.

CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES adwyse_stores(id) ON DELETE CASCADE,

  -- Alert classification
  type TEXT NOT NULL,           -- roas_low, spend_high, budget_pacing, creative_fatigue, conversion_drop, cpc_spike, impression_drop
  message TEXT NOT NULL,

  -- Thresholds
  value NUMERIC,
  threshold NUMERIC,

  -- Campaign context
  campaign_name TEXT,
  campaign_id TEXT,

  -- Status
  is_read BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Columns added by migration 025 (DO NOT duplicate):
--   severity TEXT DEFAULT 'medium'
--   email_sent BOOLEAN DEFAULT false
--   email_sent_at TIMESTAMPTZ
--   metadata JSONB DEFAULT '{}'

-- Columns added by migration 026 (DO NOT duplicate):
--   slack_sent BOOLEAN DEFAULT false
--   slack_sent_at TIMESTAMPTZ

-- Indexes (025 also creates some; these are for the base table)
CREATE INDEX IF NOT EXISTS idx_alerts_store_id ON alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type ON alerts(type);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);

-- RLS
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations on alerts" ON alerts
  FOR ALL USING (true) WITH CHECK (true);
