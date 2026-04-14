-- Add onboarding email tracking to stores
ALTER TABLE adwyse_stores
ADD COLUMN IF NOT EXISTS onboarding_emails_sent INTEGER DEFAULT 0;

-- Index for cron query efficiency
CREATE INDEX IF NOT EXISTS idx_stores_onboarding
ON adwyse_stores (onboarding_emails_sent)
WHERE onboarding_emails_sent < 5;
