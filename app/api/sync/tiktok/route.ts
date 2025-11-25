import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchTikTokCampaigns } from '@/lib/tiktok-ads';

/**
 * Sync TikTok Ads campaign data to database
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [SYNC] TikTok Ads sync started');

  try {
    const body = await request.json();
    const { storeId } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Get all active TikTok ad accounts for this store
    const { data: adAccounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('store_id', storeId)
      .eq('platform', 'tiktok')
      .eq('is_connected', true);

    if (accountsError) {
      console.error('Error fetching ad accounts:', accountsError);
      throw accountsError;
    }

    if (!adAccounts || adAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No TikTok Ads accounts connected',
        campaignsSynced: 0,
        totalSpend: 0,
      });
    }

    console.log(`📊 [SYNC] Found ${adAccounts.length} TikTok Ads account(s)`);

    let totalCampaignsSynced = 0;
    let totalSpendSynced = 0;

    for (const account of adAccounts) {
      try {
        console.log(`🔄 [SYNC] Processing account: ${account.account_name}`);

        const campaigns = await fetchTikTokCampaigns(
          account.access_token,
          account.account_id
        );

        console.log(`📊 [SYNC] Found ${campaigns.length} campaigns`);

        for (const campaign of campaigns) {
          // Check if campaign exists
          const { data: existingCampaigns } = await supabase
            .from('campaigns')
            .select('*')
            .eq('store_id', storeId)
            .eq('source', 'tiktok')
            .ilike('campaign_name', campaign.name);

          if (existingCampaigns && existingCampaigns.length > 0) {
            // Update existing
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
            // Create new
            await supabase
              .from('campaigns')
              .insert({
                store_id: storeId,
                source: 'tiktok',
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

    return NextResponse.json({
      success: true,
      message: `Synced ${totalCampaignsSynced} campaigns with $${totalSpendSynced.toFixed(2)} total spend`,
      campaignsSynced: totalCampaignsSynced,
      totalSpend: totalSpendSynced,
    });

  } catch (error) {
    console.error('TikTok sync error:', error);
    return NextResponse.json({ error: 'Failed to sync TikTok Ads data' }, { status: 500 });
  }
}
