import { createClient } from '@supabase/supabase-js';

export type SubscriptionTier = 'free' | 'trial' | 'pro';

export interface TierLimits {
  adAccounts: number;        // Max connected ad accounts
  ordersPerMonth: number;    // Max orders tracked per month
  dataRetentionDays: number; // Days of historical data
  aiInsights: boolean;       // Static AI insights cards (existing)
  aiChat: boolean;           // Conversational AI assistant
  competitorSpy: boolean;    // Live Meta Ad Library scraping
  cohortRetention: boolean;  // Cohort analysis page
  ncRoas: boolean;           // New vs Repeat ROAS
  creativeScore: boolean;    // AI creative scoring
  predictiveBudget: boolean; // Predictive Budget Optimizer
  multiTouchAttribution: boolean;
  conversionsApi: boolean;   // Server-side Meta CAPI
  slackIntegration: boolean; // Slack daily digest + alerts
  emailReports: boolean;     // Weekly/monthly email reports
  customAlerts: boolean;     // Custom threshold alerts
}

export const TIER_LIMITS: Record<SubscriptionTier, TierLimits> = {
  free: {
    adAccounts: 1,
    ordersPerMonth: 100,
    dataRetentionDays: 30,
    aiInsights: false,
    aiChat: false,
    competitorSpy: false,
    cohortRetention: false,
    ncRoas: false,
    creativeScore: false,
    predictiveBudget: false,
    multiTouchAttribution: false,
    conversionsApi: false,
    slackIntegration: false,
    emailReports: false,
    customAlerts: false,
  },
  trial: {
    adAccounts: 3,
    ordersPerMonth: 500,
    dataRetentionDays: 90,
    aiInsights: true,
    aiChat: true,
    competitorSpy: true,
    cohortRetention: true,
    ncRoas: true,
    creativeScore: true,
    predictiveBudget: true,
    multiTouchAttribution: true,
    conversionsApi: true,
    slackIntegration: true,
    emailReports: true,
    customAlerts: true,
  },
  pro: {
    adAccounts: 999,  // Effectively unlimited
    ordersPerMonth: 999999,
    dataRetentionDays: 365,
    aiInsights: true,
    aiChat: true,
    competitorSpy: true,
    cohortRetention: true,
    ncRoas: true,
    creativeScore: true,
    predictiveBudget: true,
    multiTouchAttribution: true,
    conversionsApi: true,
    slackIntegration: true,
    emailReports: true,
    customAlerts: true,
  },
};

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

/**
 * Generic Pro feature gate. Returns null if allowed, or a 403 Response if not.
 * Demo store always allowed so the marketing demo + Adam's test store work.
 *
 * Usage:
 *   const gate = await requireProFeature(storeId, 'aiChat');
 *   if (gate) return gate;
 */
export async function requireProFeature(
  storeId: string | null | undefined,
  feature: keyof TierLimits
): Promise<Response | null> {
  if (!storeId || storeId === DEMO_STORE_ID) return null;

  const tierCheck = await getStoreTier(storeId);
  const allowed = tierCheck.limits[feature];

  if (allowed === true) return null;
  if (typeof allowed === 'number' && allowed > 0) return null;

  const featureNames: Partial<Record<keyof TierLimits, string>> = {
    aiChat: 'the AI Assistant',
    competitorSpy: 'Competitor Spy',
    cohortRetention: 'Cohort Retention',
    ncRoas: 'New vs Repeat ROAS',
    creativeScore: 'Creative Score',
    predictiveBudget: 'the Predictive Budget Optimizer',
    multiTouchAttribution: 'Multi-touch Attribution',
    conversionsApi: 'the Server-side Conversions API',
    slackIntegration: 'Slack integration',
    emailReports: 'Email reports',
    aiInsights: 'AI insights',
  };

  return new Response(
    JSON.stringify({
      error: 'Pro feature required',
      feature,
      currentTier: tierCheck.tier,
      message: `This feature requires AdWyse Pro. Upgrade to unlock ${featureNames[feature] || String(feature)}.`,
      upgradeUrl: '/pricing',
    }),
    { status: 403, headers: { 'Content-Type': 'application/json' } }
  );
}

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

