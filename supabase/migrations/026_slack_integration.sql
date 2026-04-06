-- Slack Integration Settings
-- Run this in Supabase SQL Editor

-- Add Slack columns to store_settings
ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS slack_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS slack_webhook_url TEXT,
  ADD COLUMN IF NOT EXISTS slack_daily_summary BOOLEAN DEFAULT false;

-- Index for finding stores with Slack enabled
CREATE INDEX IF NOT EXISTS idx_store_settings_slack_enabled
  ON store_settings(slack_enabled) WHERE slack_enabled = true;

-- Add slack_sent column to alerts table for tracking
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS slack_sent BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS slack_sent_at TIMESTAMPTZ;
