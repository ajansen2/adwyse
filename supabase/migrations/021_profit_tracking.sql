-- Profit Tracking Migration
-- Adds COGS (Cost of Goods Sold) tracking for profit calculation

-- =====================================================
-- PRODUCT COSTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS product_costs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,

  -- Product identifiers
  shopify_product_id TEXT NOT NULL,
  shopify_variant_id TEXT, -- NULL means applies to all variants
  sku TEXT,
  product_title TEXT,
  variant_title TEXT,

  -- Cost data
  cost_per_unit DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',

  -- Source of cost data
  source TEXT DEFAULT 'manual', -- 'manual', 'csv_import', 'shopify_sync'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per store/product/variant
  UNIQUE(store_id, shopify_product_id, COALESCE(shopify_variant_id, ''))
);

-- =====================================================
-- ALTER ORDERS TABLE TO ADD COGS
-- =====================================================
-- Add COGS column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adwyse_orders' AND column_name = 'cogs'
  ) THEN
    ALTER TABLE adwyse_orders ADD COLUMN cogs DECIMAL(10,2) DEFAULT 0;
  END IF;
END $$;

-- Add gross_profit as a generated column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'adwyse_orders' AND column_name = 'gross_profit'
  ) THEN
    ALTER TABLE adwyse_orders
    ADD COLUMN gross_profit DECIMAL(10,2) GENERATED ALWAYS AS (total_price - cogs) STORED;
  END IF;
END $$;

-- =====================================================
-- ORDER LINE ITEMS TABLE (for COGS calculation)
-- =====================================================
CREATE TABLE IF NOT EXISTS adwyse_order_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES adwyse_orders(id) ON DELETE CASCADE,
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,

  -- Product info
  shopify_product_id TEXT NOT NULL,
  shopify_variant_id TEXT,
  sku TEXT,
  title TEXT,
  variant_title TEXT,

  -- Quantity and pricing
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  unit_cost DECIMAL(10,2), -- Looked up from product_costs at order time
  line_total DECIMAL(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  line_cogs DECIMAL(10,2) GENERATED ALWAYS AS (quantity * COALESCE(unit_cost, 0)) STORED,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_product_costs_store ON product_costs(store_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_product ON product_costs(shopify_product_id);
CREATE INDEX IF NOT EXISTS idx_product_costs_sku ON product_costs(sku) WHERE sku IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_order_line_items_order ON adwyse_order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_line_items_product ON adwyse_order_line_items(shopify_product_id);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE product_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE adwyse_order_line_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on product_costs" ON product_costs
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on order_line_items" ON adwyse_order_line_items
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get product cost for a specific product/variant
CREATE OR REPLACE FUNCTION get_product_cost(
  p_store_id UUID,
  p_product_id TEXT,
  p_variant_id TEXT DEFAULT NULL
)
RETURNS DECIMAL AS $$
DECLARE
  v_cost DECIMAL;
BEGIN
  -- Try to find variant-specific cost first
  IF p_variant_id IS NOT NULL THEN
    SELECT cost_per_unit INTO v_cost
    FROM product_costs
    WHERE store_id = p_store_id
      AND shopify_product_id = p_product_id
      AND shopify_variant_id = p_variant_id;

    IF v_cost IS NOT NULL THEN
      RETURN v_cost;
    END IF;
  END IF;

  -- Fall back to product-level cost
  SELECT cost_per_unit INTO v_cost
  FROM product_costs
  WHERE store_id = p_store_id
    AND shopify_product_id = p_product_id
    AND shopify_variant_id IS NULL;

  RETURN COALESCE(v_cost, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to recalculate COGS for an order
CREATE OR REPLACE FUNCTION recalculate_order_cogs(p_order_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  v_total_cogs DECIMAL;
BEGIN
  SELECT COALESCE(SUM(line_cogs), 0) INTO v_total_cogs
  FROM adwyse_order_line_items
  WHERE order_id = p_order_id;

  UPDATE adwyse_orders
  SET cogs = v_total_cogs
  WHERE id = p_order_id;

  RETURN v_total_cogs;
END;
$$ LANGUAGE plpgsql;

-- Function to get profit summary for a store
CREATE OR REPLACE FUNCTION get_profit_summary(
  p_store_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL
)
RETURNS TABLE(
  total_revenue DECIMAL,
  total_cogs DECIMAL,
  gross_profit DECIMAL,
  total_ad_spend DECIMAL,
  net_profit DECIMAL,
  gross_margin_pct DECIMAL,
  true_roas DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  WITH order_data AS (
    SELECT
      COALESCE(SUM(o.total_price), 0) as revenue,
      COALESCE(SUM(o.cogs), 0) as cogs
    FROM adwyse_orders o
    WHERE o.store_id = p_store_id
      AND (p_start_date IS NULL OR o.order_created_at >= p_start_date)
      AND (p_end_date IS NULL OR o.order_created_at <= p_end_date + INTERVAL '1 day')
  ),
  campaign_data AS (
    SELECT COALESCE(SUM(c.spend), 0) as ad_spend
    FROM adwyse_campaigns c
    WHERE c.store_id = p_store_id
      AND (p_start_date IS NULL OR c.date >= p_start_date)
      AND (p_end_date IS NULL OR c.date <= p_end_date)
  )
  SELECT
    od.revenue as total_revenue,
    od.cogs as total_cogs,
    (od.revenue - od.cogs) as gross_profit,
    cd.ad_spend as total_ad_spend,
    (od.revenue - od.cogs - cd.ad_spend) as net_profit,
    CASE WHEN od.revenue > 0 THEN ((od.revenue - od.cogs) / od.revenue * 100) ELSE 0 END as gross_margin_pct,
    CASE WHEN cd.ad_spend > 0 THEN ((od.revenue - od.cogs - cd.ad_spend) / cd.ad_spend) ELSE 0 END as true_roas
  FROM order_data od, campaign_data cd;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON TABLE product_costs IS 'Cost of goods sold per product/variant for profit calculation';
COMMENT ON TABLE adwyse_order_line_items IS 'Line items from orders with COGS data';
COMMENT ON FUNCTION get_product_cost IS 'Get the cost per unit for a product, falling back to product-level if no variant cost';
COMMENT ON FUNCTION get_profit_summary IS 'Get profit metrics for a store over a date range';
