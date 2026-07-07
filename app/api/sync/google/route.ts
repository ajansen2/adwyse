import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchGoogleAdsCampaigns, refreshGoogleToken } from '@/lib/google-ads';

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/**
 * Cron handler — syncs all stores with connected Google Ads accounts
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabase();

    // Get all stores with connected Google accounts
    const { data: accounts } = await supabase
      .from('ad_accounts')
      .select('store_id')
      .eq('platform', 'google')
      .eq('is_connected', true);

    if (!accounts || accounts.length === 0) {
      return NextResponse.json({ message: 'No stores to sync' });
    }

    const storeIds = [...new Set(accounts.map(a => a.store_id))];
    let totalSynced = 0;

    for (const storeId of storeIds) {
      try {
        const result = await syncGoogleForStore(supabase, storeId);
        if (result.success) totalSynced++;
        console.log(`✅ [CRON] Google sync for store ${storeId}: ${result.campaignsSynced} campaigns`);
      } catch (error) {
        console.error(`❌ [CRON] Error syncing store ${storeId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced}/${storeIds.length} stores`,
    });
  } catch (error) {
    console.error('❌ Google cron sync error:', error);
    return NextResponse.json({ error: 'Failed to run cron sync' }, { status: 500 });
  }
}

/**
 * Sync Google Ads campaign data for a single store
 */
async function syncGoogleForStore(supabase: ReturnType<typeof getSupabase>, storeId: string) {
  const { data: adAccounts, error: accountsError } = await supabase
    .from('ad_accounts')
    .select('*')
    .eq('store_id', storeId)
    .eq('platform', 'google')
    .eq('is_connected', true);

  if (accountsError) throw accountsError;

  if (!adAccounts || adAccounts.length === 0) {
    return { success: true, campaignsSynced: 0, totalSpend: 0 };
  }

  console.log(`📊 [SYNC] Found ${adAccounts.length} Google Ads account(s) for store ${storeId}`);

  let totalCampaignsSynced = 0;
  let totalSpendSynced = 0;

  for (const account of adAccounts) {
    try {
      console.log(`🔄 [SYNC] Processing account: ${account.account_name}`);

      // Proactively refresh token if it's expired or about to expire
      let accessToken = account.access_token;
      const tokenExpiry = account.token_expires_at ? new Date(account.token_expires_at) : null;
      const isExpired = !tokenExpiry || tokenExpiry < new Date(Date.now() + 5 * 60 * 1000);

      if (isExpired && account.refresh_token) {
        console.log(`🔑 [SYNC] Token expired for ${account.account_name}, refreshing...`);
        try {
          const newTokens = await refreshGoogleToken(account.refresh_token);
          accessToken = newTokens.accessToken;

          // Persist the new token to DB
          await supabase
            .from('ad_accounts')
            .update({
              access_token: newTokens.accessToken,
              token_expires_at: new Date(Date.now() + newTokens.expiresIn * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', account.id);

          console.log(`✅ [SYNC] Token refreshed for ${account.account_name}`);
        } catch (refreshError) {
          console.error(`❌ [SYNC] Token refresh failed for ${account.account_name}:`, refreshError);
          continue;
        }
      }

      const campaigns = await fetchGoogleAdsCampaigns(
        accessToken,
        account.account_id,
        account.refresh_token
      );

      console.log(`📊 [SYNC] Found ${campaigns.length} campaigns`);

      for (const campaign of campaigns) {
        const { data: existingCampaigns } = await supabase
          .from('campaigns')
          .select('*')
          .eq('store_id', storeId)
          .eq('source', 'google')
          .ilike('campaign_name', campaign.name);

        if (existingCampaigns && existingCampaigns.length > 0) {
          await supabase
            .from('campaigns')
            .update({
              ad_spend: campaign.spend,
              impressions: campaign.impressions,
              clicks: campaign.clicks,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existingCampaigns[0].id);

          console.log(`✅ Updated campaign: ${campaign.name} ($${campaign.spend})`);
        } else {
          await supabase
            .from('campaigns')
            .insert({
              store_id: storeId,
              source: 'google',
              campaign_name: campaign.name,
              ad_spend: campaign.spend,
              impressions: campaign.impressions,
              clicks: campaign.clicks,
              orders: 0,
              revenue: 0,
            });

          console.log(`➕ Created campaign: ${campaign.name} ($${campaign.spend})`);
        }

        totalCampaignsSynced++;
        totalSpendSynced += campaign.spend;
      }
    } catch (accountError) {
      console.error(`Error syncing account ${account.account_name}:`, accountError);
    }
  }

  return { success: true, campaignsSynced: totalCampaignsSynced, totalSpend: totalSpendSynced };
}

/**
 * Sync Google Ads campaign data to database (manual trigger)
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [SYNC] Google Ads sync started');

  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = getSupabase();
    const result = await syncGoogleForStore(supabase, storeId);

    return NextResponse.json({
      success: true,
      message: `Synced ${result.campaignsSynced} campaigns with $${result.totalSpend.toFixed(2)} total spend`,
      campaignsSynced: result.campaignsSynced,
      totalSpend: result.totalSpend,
    });
  } catch (error) {
    console.error('Google sync error:', error);
    return NextResponse.json({ error: 'Failed to sync Google Ads data' }, { status: 500 });
  }
}
