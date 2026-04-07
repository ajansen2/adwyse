-- Goals and Targets Migration
-- Allows users to set performance goals and track progress

-- =====================================================
-- STORE GOALS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS store_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,

  -- Goal Type
  goal_type TEXT NOT NULL, -- 'revenue', 'orders', 'roas', 'spend_limit', 'aov'

  -- Target Value
  target_value DECIMAL(12,2) NOT NULL,

  -- Period
  period TEXT NOT NULL DEFAULT 'monthly', -- 'daily', 'weekly', 'monthly', 'quarterly'

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per store/type/period
  UNIQUE(store_id, goal_type, period)
);

-- =====================================================
-- GOAL PROGRESS SNAPSHOTS (for historical tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS goal_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES store_goals(id) ON DELETE CASCADE,

  -- Progress Data
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value DECIMAL(12,2) NOT NULL,
  actual_value DECIMAL(12,2) NOT NULL,
  progress_percent DECIMAL(5,2) NOT NULL,
  goal_met BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint per goal/period
  UNIQUE(goal_id, period_start)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_store_goals_store ON store_goals(store_id);
CREATE INDEX IF NOT EXISTS idx_store_goals_active ON store_goals(store_id, is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_goal_progress_store ON goal_progress(store_id);
CREATE INDEX IF NOT EXISTS idx_goal_progress_period ON goal_progress(period_start DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE store_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE goal_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on store_goals" ON store_goals
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on goal_progress" ON goal_progress
  FOR ALL USING (true) WITH CHECK (true);

-- Comments
COMMENT ON TABLE store_goals IS 'User-defined performance goals and targets';
COMMENT ON TABLE goal_progress IS 'Historical tracking of goal progress by period';
