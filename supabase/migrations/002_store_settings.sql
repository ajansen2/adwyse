-- Store Settings Table for Email Reports and Performance Alerts
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS store_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE UNIQUE,

  -- Email Report Settings
  email_report_frequency TEXT DEFAULT 'none', -- 'none', 'weekly', 'monthly'

  -- Performance Alert Settings
  roas_alert_enabled BOOLEAN DEFAULT false,
  roas_threshold DECIMAL(10,2) DEFAULT 1.5,
  spend_alert_enabled BOOLEAN DEFAULT false,
  spend_threshold DECIMAL(10,2) DEFAULT 100,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_store_settings_store_id ON store_settings(store_id);

-- Enable RLS
ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

-- Policy for service role access
CREATE POLICY "Service role full access store_settings" ON store_settings
  FOR ALL USING (true) WITH CHECK (true);
