import { createClient } from '@supabase/supabase-js';

export type SubscriptionTier = 'free' | 'trial' | 'pro';

export interface TierLimits {
  adAccounts: number;        // Max connected ad accounts
  ordersPerMonth: number;    // Max orders tracked per month
  dataRetentionDays: number; // Days of historical data
  aiInsights: boolean;       // Access to AI insights
  emailReports: boolean;     // Weekly/monthly email reports
  customAlerts: boolean;     // Custom threshold alerts
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    adAccounts: 1,
    ordersPerMonth: 100,
    dataRetentionDays: 30,
    aiInsights: false,
    emailReports: false,
    customAlerts: false,
  },
  trial: {
    adAccounts: 3,
    ordersPerMonth: 500,
    dataRetentionDays: 90,
    aiInsights: true,
    emailReports: true,
    customAlerts: true,
  },
  pro: {
    adAccounts: 999,  // Effectively unlimited
    ordersPerMonth: 999999,
    dataRetentionDays: 365,
    aiInsights: true,
    emailReports: true,
    customAlerts: true,
  },
};

export interface TierCheck {
  tier: SubscriptionTier;
  limits: TierLimits;
  usage?: {
    adAccounts: number;
    ordersThisMonth: number;
  };
  upgradeRequired?: string;
}

export async function getStoreTier(storeId: string): Promise<TierCheck> {
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
    return { tier: 'free', limits: TIER_LIMITS.free };
  }

  // Determine tier based on subscription status
  let tier: SubscriptionTier = 'free';

  if (store.subscription_status === 'active') {
    tier = 'pro';
  } else if (store.subscription_status === 'trial') {
    const trialEndsAt = store.trial_ends_at ? new Date(store.trial_ends_at) : null;
    const now = new Date();

    if (trialEndsAt && trialEndsAt > now) {
      tier = 'trial';
    } else {
      tier = 'free'; // Trial expired, downgrade to free
    }
  }

  return { tier, limits: TIER_LIMITS[tier] };
}

export async function checkAdAccountLimit(storeId: string): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const tierCheck = await getStoreTier(storeId);

  const { count } = await supabase
    .from('adwyse_ad_accounts')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .eq('is_connected', true);

  const currentCount = count || 0;
  const limit = tierCheck.limits.adAccounts;

  if (currentCount >= limit) {
    return {
      allowed: false,
      current: currentCount,
      limit,
      message: tierCheck.tier === 'free'
        ? 'Free plan allows 1 ad account. Upgrade to Pro for unlimited accounts.'
        : `You've reached your limit of ${limit} ad accounts.`
    };
  }

  return { allowed: true, current: currentCount, limit };
}

export async function checkOrderLimit(storeId: string): Promise<{ allowed: boolean; current: number; limit: number; message?: string }> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const tierCheck = await getStoreTier(storeId);

  // Count orders this month
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('adwyse_orders')
    .select('*', { count: 'exact', head: true })
    .eq('store_id', storeId)
    .gte('created_at', startOfMonth.toISOString());

  const currentCount = count || 0;
  const limit = tierCheck.limits.ordersPerMonth;

  if (currentCount >= limit) {
    return {
      allowed: false,
      current: currentCount,
      limit,
      message: tierCheck.tier === 'free'
        ? 'Free plan tracks up to 100 orders/month. Upgrade to Pro for unlimited tracking.'
        : `You've reached your limit of ${limit} orders this month.`
    };
  }

  return { allowed: true, current: currentCount, limit };
}

export async function requireProFeature(storeId: string, feature: keyof TierLimits): Promise<{ allowed: boolean; tier: SubscriptionTier; message?: string }> {
  const tierCheck = await getStoreTier(storeId);

  const featureAllowed = tierCheck.limits[feature];

  if (!featureAllowed) {
    const featureNames: Record<string, string> = {
      aiInsights: 'AI Insights',
      emailReports: 'Email Reports',
      customAlerts: 'Custom Alerts',
    };

    return {
      allowed: false,
      tier: tierCheck.tier,
      message: `${featureNames[feature] || feature} is a Pro feature. Upgrade to unlock.`
    };
  }

  return { allowed: true, tier: tierCheck.tier };
}
