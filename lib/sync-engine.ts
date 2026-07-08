/**
 * Shared sync engine — reused by cron, on-connect, and manual trigger.
 * Each platform function syncs campaigns for a single store and updates
 * sync_status / last_synced_at / last_sync_error on every ad_account it touches.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchGoogleAdsCampaigns, refreshGoogleToken } from '@/lib/google-ads';
import { fetchFacebookCampaigns } from '@/lib/facebook-ads';
import { fetchTikTokCampaigns, refreshTikTokToken } from '@/lib/tiktok-ads';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Supabase = SupabaseClient<any, any, any>;

export function getServiceSupabase(): Supabase {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

// ── helpers ──────────────────────────────────────────────────────────

async function markSyncRunning(supabase: Supabase, accountId: string) {
  await supabase
    .from('ad_accounts')
    .update({ sync_status: 'running' })
    .eq('id', accountId);
}

async function markSyncDone(supabase: Supabase, accountId: string) {
  await supabase
    .from('ad_accounts')
    .update({
      sync_status: 'done',
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    })
    .eq('id', accountId);
}

async function markSyncFailed(supabase: Supabase, accountId: string, error: string) {
  await supabase
    .from('ad_accounts')
    .update({
      sync_status: 'failed',
      last_sync_error: error.slice(0, 500),
    })
    .eq('id', accountId);
}

// ── upsert campaign row ─────────────────────────────────────────────

async function upsertCampaign(
  supabase: Supabase,
  storeId: string,
  adAccountId: string,
  campaign: { id?: string; name: string; spend: number; impressions: number; clicks: number; conversions?: number; status?: string }
) {
  const today = new Date().toISOString().split('T')[0];
  const platformCampaignId = campaign.id || campaign.name;

  const { data: existing } = await supabase
    .from('adwyse_campaigns')
    .select('id')
    .eq('store_id', storeId)
    .eq('platform_campaign_id', platformCampaignId)
    .eq('date', today)
    .maybeSingle();

  if (existing) {
    await supabase
      .from('adwyse_campaigns')
      .update({
        spend: campaign.spend,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions ?? 0,
        status: campaign.status?.toLowerCase() || 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id);
  } else {
    await supabase
      .from('adwyse_campaigns')
      .insert({
        store_id: storeId,
        ad_account_id: adAccountId,
        campaign_name: campaign.name,
        platform_campaign_id: platformCampaignId,
        status: campaign.status?.toLowerCase() || 'active',
        date: today,
        spend: campaign.spend,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        conversions: campaign.conversions ?? 0,
        attributed_revenue: 0,
        attributed_orders: 0,
      });
  }
}

// ── Stale sync rescue ──────────────────────────────────────────────

async function rescueStaleRunning(supabase: Supabase, storeId: string, platform: string) {
  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  await supabase
    .from('ad_accounts')
    .update({
      sync_status: 'failed',
      last_sync_error: 'Sync timed out — will retry on next sync cycle',
    })
    .eq('store_id', storeId)
    .eq('platform', platform)
    .eq('sync_status', 'running')
    .lt('updated_at', tenMinutesAgo);
}

// ── Google ───────────────────────────────────────────────────────────

export async function syncGoogleForStore(
  supabase: Supabase,
  storeId: string
): Promise<{ success: boolean; campaignsSynced: number; totalSpend: number; errors: string[] }> {
  const syncStart = Date.now();
  await rescueStaleRunning(supabase, storeId, 'google');

  const { data: storeRow } = await supabase
    .from('stores')
    .select('shop_domain')
    .eq('id', storeId)
    .single();
  const shopDomain = storeRow?.shop_domain || storeId;

  const { data: adAccounts, error: accountsError } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('store_id', storeId)
    .eq('platform', 'google')
    .eq('is_connected', true)
    .not('is_demo', 'is', true);

  if (accountsError) throw accountsError;
  if (!adAccounts || adAccounts.length === 0) {
    return { success: true, campaignsSynced: 0, totalSpend: 0, errors: [] };
  }

  let totalCampaignsSynced = 0;
  let totalSpendSynced = 0;
  const errors: string[] = [];

  for (const account of adAccounts) {
    await markSyncRunning(supabase, account.id);
    try {
      let accessToken = account.access_token;
      const tokenExpiry = account.token_expires_at ? new Date(account.token_expires_at) : null;
      const isExpired = !tokenExpiry || tokenExpiry < new Date(Date.now() + 5 * 60 * 1000);

      if (isExpired && account.refresh_token) {
        const newTokens = await refreshGoogleToken(account.refresh_token);
        accessToken = newTokens.accessToken;
        await supabase
          .from('ad_accounts')
          .update({
            access_token: newTokens.accessToken,
            token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);
      }

      const campaigns = await fetchGoogleAdsCampaigns(accessToken, account.account_id, account.refresh_token);

      for (const campaign of campaigns) {
        await upsertCampaign(supabase, storeId, account.id, campaign);
        totalCampaignsSynced++;
        totalSpendSynced += campaign.spend;
      }

      await markSyncDone(supabase, account.id);
    } catch (err: any) {
      const msg = err?.message || 'Unknown error during Google sync';
      console.error(`[SYNC] Google account ${account.account_name} failed:`, msg);
      await markSyncFailed(supabase, account.id, msg);
      errors.push(`${account.account_name}: ${msg}`);
    }
  }

  const duration = ((Date.now() - syncStart) / 1000).toFixed(1);
  console.log(`[SYNC] platform=google shop=${shopDomain} accounts=${adAccounts.length} campaigns_synced=${totalCampaignsSynced} spend=$${totalSpendSynced.toFixed(2)} duration=${duration}s errors=${errors.length}`);

  return { success: errors.length === 0, campaignsSynced: totalCampaignsSynced, totalSpend: totalSpendSynced, errors };
}

// ── Facebook ────────────────────────────────────────────────────────

export async function syncFacebookForStore(
  supabase: Supabase,
  storeId: string
): Promise<{ success: boolean; campaignsSynced: number; totalSpend: number; errors: string[] }> {
  const syncStart = Date.now();
  await rescueStaleRunning(supabase, storeId, 'facebook');

  const { data: storeRow } = await supabase
    .from('stores')
    .select('shop_domain')
    .eq('id', storeId)
    .single();
  const shopDomain = storeRow?.shop_domain || storeId;

  const { data: adAccounts, error: accountsError } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('store_id', storeId)
    .eq('platform', 'facebook')
    .eq('is_connected', true)
    .not('is_demo', 'is', true);

  if (accountsError) throw accountsError;
  if (!adAccounts || adAccounts.length === 0) {
    return { success: true, campaignsSynced: 0, totalSpend: 0, errors: [] };
  }

  let totalCampaignsSynced = 0;
  let totalSpendSynced = 0;
  const errors: string[] = [];

  for (const account of adAccounts) {
    await markSyncRunning(supabase, account.id);
    try {
      const fbCampaigns = await fetchFacebookCampaigns(
        account.access_token,
        account.account_id,
        'last_30d'
      );

      for (const campaign of fbCampaigns) {
        await upsertCampaign(supabase, storeId, account.id, {
          id: campaign.id,
          name: campaign.name,
          spend: campaign.spend,
          impressions: campaign.impressions,
          clicks: campaign.clicks,
          conversions: campaign.conversions || 0,
          status: campaign.status,
        });
        totalCampaignsSynced++;
        totalSpendSynced += campaign.spend;
      }

      await markSyncDone(supabase, account.id);
    } catch (err: any) {
      const msg = err?.message || 'Unknown error during Facebook sync';
      console.error(`[SYNC] Facebook account ${account.account_name} failed:`, msg);
      await markSyncFailed(supabase, account.id, msg);
      errors.push(`${account.account_name}: ${msg}`);
    }
  }

  const duration = ((Date.now() - syncStart) / 1000).toFixed(1);
  console.log(`[SYNC] platform=facebook shop=${shopDomain} accounts=${adAccounts.length} campaigns_synced=${totalCampaignsSynced} spend=$${totalSpendSynced.toFixed(2)} duration=${duration}s errors=${errors.length}`);

  return { success: errors.length === 0, campaignsSynced: totalCampaignsSynced, totalSpend: totalSpendSynced, errors };
}

// ── TikTok ──────────────────────────────────────────────────────────

export async function syncTikTokForStore(
  supabase: Supabase,
  storeId: string
): Promise<{ success: boolean; campaignsSynced: number; totalSpend: number; errors: string[] }> {
  const syncStart = Date.now();
  await rescueStaleRunning(supabase, storeId, 'tiktok');

  const { data: storeRow } = await supabase
    .from('stores')
    .select('shop_domain')
    .eq('id', storeId)
    .single();
  const shopDomain = storeRow?.shop_domain || storeId;

  const { data: adAccounts, error: accountsError } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('store_id', storeId)
    .eq('platform', 'tiktok')
    .eq('is_connected', true)
    .not('is_demo', 'is', true);

  if (accountsError) throw accountsError;
  if (!adAccounts || adAccounts.length === 0) {
    return { success: true, campaignsSynced: 0, totalSpend: 0, errors: [] };
  }

  let totalCampaignsSynced = 0;
  let totalSpendSynced = 0;
  const errors: string[] = [];

  for (const account of adAccounts) {
    await markSyncRunning(supabase, account.id);
    try {
      let accessToken = account.access_token;
      const tokenExpiry = account.token_expires_at ? new Date(account.token_expires_at) : null;
      const isExpired = !tokenExpiry || tokenExpiry < new Date(Date.now() + 5 * 60 * 1000);

      if (isExpired && account.refresh_token) {
        const newTokens = await refreshTikTokToken(account.refresh_token);
        accessToken = newTokens.accessToken;
        await supabase
          .from('ad_accounts')
          .update({
            access_token: newTokens.accessToken,
            refresh_token: newTokens.refreshToken,
            token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', account.id);
      }

      const campaigns = await fetchTikTokCampaigns(accessToken, account.account_id);

      for (const campaign of campaigns) {
        await upsertCampaign(supabase, storeId, account.id, campaign);
        totalCampaignsSynced++;
        totalSpendSynced += campaign.spend;
      }

      await markSyncDone(supabase, account.id);
    } catch (err: any) {
      const msg = err?.message || 'Unknown error during TikTok sync';
      console.error(`[SYNC] TikTok account ${account.account_name} failed:`, msg);
      await markSyncFailed(supabase, account.id, msg);
      errors.push(`${account.account_name}: ${msg}`);
    }
  }

  const duration = ((Date.now() - syncStart) / 1000).toFixed(1);
  console.log(`[SYNC] platform=tiktok shop=${shopDomain} accounts=${adAccounts.length} campaigns_synced=${totalCampaignsSynced} spend=$${totalSpendSynced.toFixed(2)} duration=${duration}s errors=${errors.length}`);

  return { success: errors.length === 0, campaignsSynced: totalCampaignsSynced, totalSpend: totalSpendSynced, errors };
}

// ── Dispatch by platform ────────────────────────────────────────────

export async function syncForStoreByPlatform(
  supabase: Supabase,
  storeId: string,
  platform: string
): Promise<{ success: boolean; campaignsSynced: number; totalSpend: number }> {
  switch (platform) {
    case 'google':
      return syncGoogleForStore(supabase, storeId);
    case 'facebook':
      return syncFacebookForStore(supabase, storeId);
    case 'tiktok':
      return syncTikTokForStore(supabase, storeId);
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}
