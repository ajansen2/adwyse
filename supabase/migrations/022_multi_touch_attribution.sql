-- Multi-Touch Attribution Migration
-- Adds touchpoint tracking and attribution model support

-- =====================================================
-- ATTRIBUTION TOUCHPOINTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS attribution_touchpoints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,

  -- Customer identification (hashed email, cookie ID, etc.)
  customer_identifier TEXT NOT NULL,
  identifier_type TEXT DEFAULT 'email', -- 'email', 'cookie', 'customer_id'

  -- Touchpoint data
  touchpoint_type TEXT NOT NULL, -- 'ad_click', 'organic_visit', 'email_click', 'direct'

  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Click IDs
  fbclid TEXT,
  gclid TEXT,
  ttclid TEXT,

  -- Additional context
  landing_page TEXT,
  referrer TEXT,

  -- Session data
  session_id TEXT,
  device_type TEXT, -- 'desktop', 'mobile', 'tablet'

  -- Timing
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ATTRIBUTION RESULTS TABLE (stores calculated attribution)
-- =====================================================
CREATE TABLE IF NOT EXISTS attribution_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES adwyse_orders(id) ON DELETE CASCADE,
  touchpoint_id UUID REFERENCES attribution_touchpoints(id) ON DELETE CASCADE,

  -- Attribution model used
  attribution_model TEXT NOT NULL, -- 'last_click', 'first_click', 'linear', 'time_decay', 'position_based'

  -- Attribution credit (0.0 to 1.0)
  credit DECIMAL(5,4) NOT NULL,

  -- Revenue attributed
  attributed_revenue DECIMAL(10,2) NOT NULL,

  -- Position info
  touchpoint_position INTEGER, -- 1 = first, n = last
  total_touchpoints INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ADD ATTRIBUTION MODEL TO STORE SETTINGS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'attribution_model'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN attribution_model TEXT DEFAULT 'last_click';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'attribution_window_days'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN attribution_window_days INTEGER DEFAULT 30;
  END IF;
END $$;

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_touchpoints_store ON attribution_touchpoints(store_id);
CREATE INDEX IF NOT EXISTS idx_touchpoints_customer ON attribution_touchpoints(customer_identifier);
CREATE INDEX IF NOT EXISTS idx_touchpoints_occurred ON attribution_touchpoints(occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_touchpoints_store_customer ON attribution_touchpoints(store_id, customer_identifier);
CREATE INDEX IF NOT EXISTS idx_attribution_results_order ON attribution_results(order_id);
CREATE INDEX IF NOT EXISTS idx_attribution_results_model ON attribution_results(attribution_model);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE attribution_touchpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE attribution_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on touchpoints" ON attribution_touchpoints
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on attribution_results" ON attribution_results
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get customer touchpoints within attribution window
CREATE OR REPLACE FUNCTION get_customer_touchpoints(
  p_store_id UUID,
  p_customer_identifier TEXT,
  p_conversion_time TIMESTAMPTZ,
  p_window_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  id UUID,
  touchpoint_type TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  fbclid TEXT,
  gclid TEXT,
  ttclid TEXT,
  occurred_at TIMESTAMPTZ,
  position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.touchpoint_type,
    t.utm_source,
    t.utm_medium,
    t.utm_campaign,
    t.fbclid,
    t.gclid,
    t.ttclid,
    t.occurred_at,
    ROW_NUMBER() OVER (ORDER BY t.occurred_at ASC)::INTEGER as position
  FROM attribution_touchpoints t
  WHERE t.store_id = p_store_id
    AND t.customer_identifier = p_customer_identifier
    AND t.occurred_at <= p_conversion_time
    AND t.occurred_at >= p_conversion_time - (p_window_days || ' days')::INTERVAL
  ORDER BY t.occurred_at ASC;
END;
$$ LANGUAGE plpgsql;

-- Get attribution summary by channel
CREATE OR REPLACE FUNCTION get_channel_attribution(
  p_store_id UUID,
  p_attribution_model TEXT DEFAULT 'last_click',
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
  channel TEXT,
  total_credit DECIMAL,
  attributed_revenue DECIMAL,
  order_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(t.utm_source, t.touchpoint_type, 'direct') as channel,
    SUM(ar.credit) as total_credit,
    SUM(ar.attributed_revenue) as attributed_revenue,
    COUNT(DISTINCT ar.order_id) as order_count
  FROM attribution_results ar
  JOIN attribution_touchpoints t ON ar.touchpoint_id = t.id
  JOIN adwyse_orders o ON ar.order_id = o.id
  WHERE t.store_id = p_store_id
    AND ar.attribution_model = p_attribution_model
    AND (p_start_date IS NULL OR o.order_created_at >= p_start_date)
    AND (p_end_date IS NULL OR o.order_created_at <= p_end_date + INTERVAL '1 day')
  GROUP BY COALESCE(t.utm_source, t.touchpoint_type, 'direct')
  ORDER BY SUM(ar.attributed_revenue) DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE attribution_touchpoints IS 'Customer touchpoints for multi-touch attribution';
COMMENT ON TABLE attribution_results IS 'Calculated attribution credit per touchpoint and order';
COMMENT ON FUNCTION get_customer_touchpoints IS 'Get all touchpoints for a customer within attribution window';
COMMENT ON FUNCTION get_channel_attribution IS 'Get attribution summary grouped by channel';
