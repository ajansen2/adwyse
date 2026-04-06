-- Enhanced Alerts Migration
-- Adds new alert types and notification tracking

-- =====================================================
-- ALERTS TABLE (update if exists)
-- =====================================================
-- Add new columns to alerts table
DO $$
BEGIN
  -- Add severity column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alerts' AND column_name = 'severity'
  ) THEN
    ALTER TABLE alerts ADD COLUMN severity TEXT DEFAULT 'medium';
  END IF;

  -- Add email_sent flag
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alerts' AND column_name = 'email_sent'
  ) THEN
    ALTER TABLE alerts ADD COLUMN email_sent BOOLEAN DEFAULT false;
  END IF;

  -- Add email_sent_at timestamp
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alerts' AND column_name = 'email_sent_at'
  ) THEN
    ALTER TABLE alerts ADD COLUMN email_sent_at TIMESTAMPTZ;
  END IF;

  -- Add metadata JSON column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'alerts' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE alerts ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- =====================================================
-- NOTIFICATION PREFERENCES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE UNIQUE,

  -- Email notifications
  email_enabled BOOLEAN DEFAULT true,
  email_address TEXT, -- Override for notifications (defaults to store email)

  -- Alert types to notify
  notify_roas_low BOOLEAN DEFAULT true,
  notify_spend_high BOOLEAN DEFAULT true,
  notify_budget_pacing BOOLEAN DEFAULT true,
  notify_creative_fatigue BOOLEAN DEFAULT true,
  notify_conversion_drop BOOLEAN DEFAULT true,

  -- Severity threshold
  min_severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'

  -- Digest preferences
  instant_alerts BOOLEAN DEFAULT true, -- Send immediately for critical
  daily_digest BOOLEAN DEFAULT false,
  weekly_digest BOOLEAN DEFAULT true,
  digest_day TEXT DEFAULT 'monday', -- For weekly digest
  digest_hour INTEGER DEFAULT 9, -- Hour to send digest (UTC)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- NOTIFICATION LOG TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES adwyse_stores(id) ON DELETE CASCADE,
  alert_id UUID REFERENCES alerts(id) ON DELETE SET NULL,

  -- Notification details
  notification_type TEXT NOT NULL, -- 'email', 'in_app', 'webhook'
  recipient TEXT NOT NULL,
  subject TEXT,
  body TEXT,

  -- Status
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT,

  -- External IDs
  external_id TEXT, -- e.g., Resend message ID

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_alerts_store_unread ON alerts(store_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_email_sent ON alerts(email_sent) WHERE email_sent = false;
CREATE INDEX IF NOT EXISTS idx_notification_log_store ON notification_log(store_id);
CREATE INDEX IF NOT EXISTS idx_notification_log_created ON notification_log(created_at DESC);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations on notification_preferences" ON notification_preferences
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on notification_log" ON notification_log
  FOR ALL USING (true) WITH CHECK (true);

-- =====================================================
-- ADD EMAIL SETTINGS TO STORE_SETTINGS
-- =====================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'store_settings' AND column_name = 'notification_email'
  ) THEN
    ALTER TABLE store_settings ADD COLUMN notification_email TEXT;
  END IF;
END $$;

-- Comments
COMMENT ON TABLE notification_preferences IS 'User preferences for alert notifications';
COMMENT ON TABLE notification_log IS 'Log of all sent notifications';
