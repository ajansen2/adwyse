-- Fix get_top_creatives to return the id column from ad_creatives.
-- The creative score route needs c.id for deduplication, but the
-- original function only returned platform_ad_id (no id).
-- We pick MIN(ac.id) as the representative row id per grouped creative.
-- Must DROP first because return type changed (added id UUID column).

DROP FUNCTION IF EXISTS get_top_creatives(uuid, date, date, integer);

CREATE OR REPLACE FUNCTION get_top_creatives(
  p_store_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  platform_ad_id TEXT,
  ad_name TEXT,
  campaign_name TEXT,
  creative_type TEXT,
  thumbnail_url TEXT,
  total_spend DECIMAL,
  total_revenue DECIMAL,
  total_orders BIGINT,
  roas DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (MIN(ac.id::text))::uuid as id,
    ac.platform_ad_id,
    ac.ad_name,
    ac.campaign_name,
    ac.creative_type,
    ac.thumbnail_url,
    SUM(ac.spend) as total_spend,
    SUM(ac.attributed_revenue) as total_revenue,
    SUM(ac.attributed_orders)::BIGINT as total_orders,
    CASE WHEN SUM(ac.spend) > 0 THEN SUM(ac.attributed_revenue) / SUM(ac.spend) ELSE 0 END as roas
  FROM ad_creatives ac
  WHERE ac.store_id = p_store_id
    AND (p_start_date IS NULL OR ac.date >= p_start_date)
    AND (p_end_date IS NULL OR ac.date <= p_end_date)
  GROUP BY ac.platform_ad_id, ac.ad_name, ac.campaign_name, ac.creative_type, ac.thumbnail_url
  ORDER BY SUM(ac.attributed_revenue) DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_top_creatives IS 'Get best performing ad creatives (includes id for deduplication)';
