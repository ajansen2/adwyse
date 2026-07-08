-- 037: Add onboarding_completed flag to adwyse_stores
ALTER TABLE adwyse_stores
  ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;
