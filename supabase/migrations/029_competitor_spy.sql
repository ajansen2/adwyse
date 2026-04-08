-- Migration: Competitor Spy Feature
-- Tracks competitors and their ad activity

-- Competitor pages/brands to track
CREATE TABLE IF NOT EXISTS competitor_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  competitor_name TEXT NOT NULL,
  facebook_page_url TEXT,
  facebook_page_id TEXT,
  website_url TEXT,
  industry TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  last_checked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(store_id, competitor_name)
);

-- Saved competitor ads (for future API integration)
CREATE TABLE IF NOT EXISTS competitor_saved_ads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitor_tracking(id) ON DELETE CASCADE,
  ad_library_id TEXT,
  ad_title TEXT,
  ad_body TEXT,
  ad_caption TEXT,
  snapshot_url TEXT,
  platform TEXT DEFAULT 'facebook',
  impression_range TEXT,
  spend_range TEXT,
  first_seen_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  tags TEXT[],
  notes TEXT,
  saved_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor insights/notes
CREATE TABLE IF NOT EXISTS competitor_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  competitor_id UUID REFERENCES competitor_tracking(id) ON DELETE CASCADE,
  insight_type TEXT NOT NULL, -- 'creative', 'messaging', 'offer', 'targeting', 'trend'
  title TEXT NOT NULL,
  content TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_competitor_tracking_store
  ON competitor_tracking(store_id, is_active);
CREATE INDEX IF NOT EXISTS idx_competitor_saved_ads_store
  ON competitor_saved_ads(store_id, saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_competitor_insights_store
  ON competitor_insights(store_id, created_at DESC);

-- RLS
ALTER TABLE competitor_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_saved_ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE competitor_insights ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their competitors"
  ON competitor_tracking FOR ALL
  USING (store_id IN (SELECT id FROM adwyse_stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their saved ads"
  ON competitor_saved_ads FOR ALL
  USING (store_id IN (SELECT id FROM adwyse_stores WHERE user_id = auth.uid()));

CREATE POLICY "Users can manage their insights"
  ON competitor_insights FOR ALL
  USING (store_id IN (SELECT id FROM adwyse_stores WHERE user_id = auth.uid()));

-- Service role policies
CREATE POLICY "Service role manages competitor_tracking"
  ON competitor_tracking FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages competitor_saved_ads"
  ON competitor_saved_ads FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Service role manages competitor_insights"
  ON competitor_insights FOR ALL USING (true) WITH CHECK (true);
