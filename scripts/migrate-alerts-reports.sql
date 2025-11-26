-- Migration: Add email reports and alerts features
-- Run this in your Supabase SQL Editor

-- Add email report frequency column to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS email_report_frequency TEXT DEFAULT 'none';

-- Add alert settings columns to stores table
ALTER TABLE stores
ADD COLUMN IF NOT EXISTS roas_alert_enabled BOOLEAN DEFAULT false;

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS roas_threshold NUMERIC DEFAULT 1.5;

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS spend_alert_enabled BOOLEAN DEFAULT false;

ALTER TABLE stores
ADD COLUMN IF NOT EXISTS spend_threshold NUMERIC DEFAULT 100;

-- Create alerts table for storing alert history
CREATE TABLE IF NOT EXISTS alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('roas_low', 'spend_high')),
  message TEXT NOT NULL,
  value NUMERIC NOT NULL,
  threshold NUMERIC NOT NULL,
  campaign_name TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster alert queries
CREATE INDEX IF NOT EXISTS idx_alerts_store_id ON alerts(store_id);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON alerts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_alerts_is_read ON alerts(is_read) WHERE is_read = false;

-- Enable RLS on alerts table
ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;

-- Create policy for alerts (service role can access all)
CREATE POLICY "Service role can manage alerts" ON alerts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Verify the migration
SELECT
  'stores columns' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'stores'
  AND column_name IN ('email_report_frequency', 'roas_alert_enabled', 'roas_threshold', 'spend_alert_enabled', 'spend_threshold');

SELECT
  'alerts table' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'alerts';
