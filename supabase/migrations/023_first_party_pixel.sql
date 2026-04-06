-- First-Party Pixel Migration
-- Stores client-side events from the tracking pixel

-- =====================================================
-- PIXEL EVENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pixel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,

  -- Event info
  event_type TEXT NOT NULL, -- 'page_view', 'add_to_cart', 'checkout_started', 'purchase'
  event_data JSONB DEFAULT '{}',

  -- Visitor identification
  visitor_id TEXT NOT NULL, -- First-party cookie ID
  session_id TEXT,
  customer_email TEXT, -- If known (checkout, purchase)

  -- Attribution params (captured on landing)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  fbclid TEXT,
  gclid TEXT,
  ttclid TEXT,

  -- Page context
  page_url TEXT,
  page_title TEXT,
  referrer TEXT,

  -- Device info
  user_agent TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'
  browser TEXT,
  os TEXT,

  -- Location (if available)
  country TEXT,
  region TEXT,
  city TEXT,

  -- Timestamps
  client_timestamp TIMESTAMPTZ, -- When event occurred on client
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- PIXEL CONFIGURATION TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS pixel_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE UNIQUE,

  -- Pixel settings
  is_enabled BOOLEAN DEFAULT true,
  track_page_views BOOLEAN DEFAULT true,
  track_add_to_cart BOOLEAN DEFAULT true,
  track_checkout BOOLEAN DEFAULT true,
  track_purchase BOOLEAN DEFAULT true,

  -- Event deduplication window (minutes)
  dedup_window_minutes INTEGER DEFAULT 5,

  -- Data retention
  event_retention_days INTEGER DEFAULT 90,

  -- Verification
  is_verified BOOLEAN DEFAULT false,
  last_event_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_pixel_events_store ON pixel_events(store_id);
CREATE INDEX IF NOT EXISTS idx_pixel_events_visitor ON pixel_events(visitor_id);
CREATE INDEX IF NOT EXISTS idx_pixel_events_type ON pixel_events(event_type);
CREATE INDEX IF NOT EXISTS idx_pixel_events_created ON pixel_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pixel_events_customer ON pixel_events(customer_email)
  WHERE customer_email IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_pixel_events_store_type_created ON pixel_events(store_id, event_type, created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE pixel_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE pixel_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on pixel_events" ON pixel_events
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on pixel_config" ON pixel_config
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get event funnel for a visitor
CREATE OR REPLACE FUNCTION get_visitor_funnel(
  p_store_id UUID,
  p_visitor_id TEXT
)
RETURNS TABLE (
  event_type TEXT,
  event_count BIGINT,
  first_event TIMESTAMPTZ,
  last_event TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.event_type,
    COUNT(*) as event_count,
    MIN(pe.created_at) as first_event,
    MAX(pe.created_at) as last_event
  FROM pixel_events pe
  WHERE pe.store_id = p_store_id
    AND pe.visitor_id = p_visitor_id
  GROUP BY pe.event_type
  ORDER BY MIN(pe.created_at);
END;
$$ LANGUAGE plpgsql;

-- Get funnel conversion rates
CREATE OR REPLACE FUNCTION get_funnel_stats(
  p_store_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  event_type TEXT,
  unique_visitors BIGINT,
  total_events BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pe.event_type,
    COUNT(DISTINCT pe.visitor_id) as unique_visitors,
    COUNT(*) as total_events
  FROM pixel_events pe
  WHERE pe.store_id = p_store_id
    AND (p_start_date IS NULL OR pe.created_at >= p_start_date)
    AND (p_end_date IS NULL OR pe.created_at < p_end_date + INTERVAL '1 day')
  GROUP BY pe.event_type
  ORDER BY
    CASE pe.event_type
      WHEN 'page_view' THEN 1
      WHEN 'add_to_cart' THEN 2
      WHEN 'checkout_started' THEN 3
      WHEN 'purchase' THEN 4
      ELSE 5
    END;
END;
$$ LANGUAGE plpgsql;

-- Cleanup old events
CREATE OR REPLACE FUNCTION cleanup_old_pixel_events(p_store_id UUID DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  config RECORD;
BEGIN
  FOR config IN
    SELECT pc.store_id, pc.event_retention_days
    FROM pixel_config pc
    WHERE p_store_id IS NULL OR pc.store_id = p_store_id
  LOOP
    DELETE FROM pixel_events
    WHERE store_id = config.store_id
      AND created_at < NOW() - (config.event_retention_days || ' days')::INTERVAL;

    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
  END LOOP;

  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE pixel_events IS 'Client-side events captured by first-party tracking pixel';
COMMENT ON TABLE pixel_config IS 'Configuration for first-party tracking pixel per store';
COMMENT ON FUNCTION get_visitor_funnel IS 'Get event history for a specific visitor';
COMMENT ON FUNCTION get_funnel_stats IS 'Get funnel conversion statistics';
