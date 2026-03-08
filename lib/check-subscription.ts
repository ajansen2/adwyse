import { createClient } from '@supabase/supabase-js';
import { getStoreTier, type SubscriptionTier, type TierLimits, TIER_LIMITS } from './subscription-tiers';

export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled' | 'past_due' | 'free';

export interface SubscriptionCheck {
  valid: boolean;
  status: SubscriptionStatus;
  tier: SubscriptionTier;
  limits: TierLimits;
  daysRemaining?: number;
  message?: string;
}

export async function checkSubscription(storeId: string): Promise<SubscriptionCheck> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: store, error } = await supabase
    .from('adwyse_stores')
    .select('subscription_status, trial_ends_at')
    .eq('id', storeId)
    .single();

  if (error || !store) {
    return { valid: false, status: 'cancelled', tier: 'free', limits: TIER_LIMITS.free, message: 'Store not found' };
  }

  if (store.subscription_status === 'active') {
    return { valid: true, status: 'active', tier: 'pro', limits: TIER_LIMITS.pro };
  }

  if (store.subscription_status === 'trial' || !store.subscription_status) {
    const trialEndsAt = store.trial_ends_at ? new Date(store.trial_ends_at) : null;
    const now = new Date();

    if (trialEndsAt && trialEndsAt > now) {
      const daysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return { valid: true, status: 'trial', tier: 'trial', limits: TIER_LIMITS.trial, daysRemaining };
    }

    // Trial expired - downgrade to free tier (still valid, but limited)
    return {
      valid: true,
      status: 'free',
      tier: 'free',
      limits: TIER_LIMITS.free,
      message: 'Your trial has ended. You\'re on the free plan with limited features.'
    };
  }

  if (store.subscription_status === 'cancelled') {
    // Cancelled users get free tier
    return { valid: true, status: 'free', tier: 'free', limits: TIER_LIMITS.free, message: 'You\'re on the free plan.' };
  }

  // Default to free tier
  return { valid: true, status: 'free', tier: 'free', limits: TIER_LIMITS.free };
}

export async function requireActiveSubscription(storeId: string): Promise<{ error: Response } | { subscription: SubscriptionCheck }> {
  const subscription = await checkSubscription(storeId);

  if (!subscription.valid) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Subscription required', message: subscription.message, status: subscription.status }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  return { subscription };
}

// Require Pro tier for premium features (AI insights, email reports, custom alerts)
export async function requireProTier(storeId: string, feature: string): Promise<{ error: Response } | { subscription: SubscriptionCheck }> {
  const subscription = await checkSubscription(storeId);

  if (!subscription.valid) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Subscription required', message: subscription.message, status: subscription.status }),
        { status: 402, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  // Check if feature is available on current tier
  const featureMap: Record<string, keyof TierLimits> = {
    'ai_insights': 'aiInsights',
    'email_reports': 'emailReports',
    'custom_alerts': 'customAlerts',
  };

  const limitKey = featureMap[feature];
  if (limitKey && !subscription.limits[limitKey]) {
    return {
      error: new Response(
        JSON.stringify({
          error: 'Pro feature required',
          message: `${feature.replace('_', ' ')} is a Pro feature. Upgrade to unlock.`,
          status: 'upgrade_required',
          currentTier: subscription.tier
        }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    };
  }

  return { subscription };
}
