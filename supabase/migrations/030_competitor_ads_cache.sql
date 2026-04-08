-- Migration: Cache for Apify Facebook Ad Library scraper results
-- Avoids re-running expensive scrapes for the same query within TTL

CREATE TABLE IF NOT EXISTS competitor_ads_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  query_key TEXT NOT NULL UNIQUE,
  query_value TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'apify',
  results JSONB NOT NULL,
  result_count INTEGER NOT NULL DEFAULT 0,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_competitor_ads_cache_key
  ON competitor_ads_cache(query_key);
CREATE INDEX IF NOT EXISTS idx_competitor_ads_cache_expires
  ON competitor_ads_cache(expires_at);

ALTER TABLE competitor_ads_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages competitor_ads_cache"
  ON competitor_ads_cache FOR ALL USING (true) WITH CHECK (true);
