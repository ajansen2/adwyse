-- Migration: Meta Conversions API (CAPI) credentials
-- Adds columns to store_settings for server-side Meta event tracking

ALTER TABLE store_settings
  ADD COLUMN IF NOT EXISTS meta_pixel_id TEXT,
  ADD COLUMN IF NOT EXISTS meta_capi_token TEXT,
  ADD COLUMN IF NOT EXISTS meta_capi_test_code TEXT,
  ADD COLUMN IF NOT EXISTS meta_capi_enabled BOOLEAN DEFAULT FALSE;

-- Track CAPI events sent for debugging / observability
CREATE TABLE IF NOT EXISTS meta_capi_events_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_id TEXT,
  order_id TEXT,
  value NUMERIC,
  success BOOLEAN NOT NULL,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meta_capi_log_store
  ON meta_capi_events_log(store_id, created_at DESC);

ALTER TABLE meta_capi_events_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages meta_capi_events_log"
  ON meta_capi_events_log FOR ALL USING (true) WITH CHECK (true);
