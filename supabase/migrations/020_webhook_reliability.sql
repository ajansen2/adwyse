-- Webhook Reliability Migration
-- Adds webhook_metrics table for monitoring webhook health

-- =====================================================
-- WEBHOOK METRICS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS webhook_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_domain TEXT NOT NULL,
  webhook_topic TEXT NOT NULL,

  -- Error tracking
  error_type TEXT, -- 'signature_invalid', 'store_not_found', 'cart_insert_error', etc.
  error_message TEXT,

  -- Performance tracking
  processing_time_ms INTEGER,

  -- Status
  success BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_webhook_metrics_shop ON webhook_metrics(shop_domain);
CREATE INDEX IF NOT EXISTS idx_webhook_metrics_topic ON webhook_metrics(webhook_topic);
CREATE INDEX IF NOT EXISTS idx_webhook_metrics_created ON webhook_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_webhook_metrics_errors ON webhook_metrics(shop_domain, success)
  WHERE success = false;

-- Enable RLS
ALTER TABLE webhook_metrics ENABLE ROW LEVEL SECURITY;

-- Policy for service role access (webhooks use service role)
CREATE POLICY "Service role full access webhook_metrics" ON webhook_metrics
  FOR ALL USING (true) WITH CHECK (true);

-- Add comment
COMMENT ON TABLE webhook_metrics IS 'Tracks webhook processing for reliability monitoring';

-- =====================================================
-- CLEANUP FUNCTION (optional - to prevent table bloat)
-- =====================================================
-- This function can be called periodically to clean up old metrics
CREATE OR REPLACE FUNCTION cleanup_old_webhook_metrics(days_to_keep INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM webhook_metrics
  WHERE created_at < NOW() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_webhook_metrics IS 'Removes webhook metrics older than specified days (default 30)';
