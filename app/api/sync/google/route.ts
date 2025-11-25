import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchGoogleAdsCampaigns } from '@/lib/google-ads';

/**
 * Sync Google Ads campaign data to database
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [SYNC] Google Ads sync started');

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

    // Get all active Google ad accounts for this store
    const { data: adAccounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('store_id', storeId)
      .eq('platform', 'google')
      .eq('is_connected', true);

    if (accountsError) {
      console.error('Error fetching ad accounts:', accountsError);
      throw accountsError;
    }

    if (!adAccounts || adAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Google Ads accounts connected',
        campaignsSynced: 0,
        totalSpend: 0,
      });
    }

    console.log(`📊 [SYNC] Found ${adAccounts.length} Google Ads account(s)`);

    let totalCampaignsSynced = 0;
    let totalSpendSynced = 0;

    for (const account of adAccounts) {
      try {
        console.log(`🔄 [SYNC] Processing account: ${account.account_name}`);

        const campaigns = await fetchGoogleAdsCampaigns(
          account.access_token,
          account.account_id,
          account.refresh_token
        );

        console.log(`📊 [SYNC] Found ${campaigns.length} campaigns`);

        for (const campaign of campaigns) {
          // Check if campaign exists
          const { data: existingCampaigns } = await supabase
            .from('campaigns')
            .select('*')
            .eq('store_id', storeId)
            .eq('source', 'google')
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

    return NextResponse.json({
      success: true,
      message: `Synced ${totalCampaignsSynced} campaigns with $${totalSpendSynced.toFixed(2)} total spend`,
      campaignsSynced: totalCampaignsSynced,
      totalSpend: totalSpendSynced,
    });

  } catch (error) {
    console.error('Google sync error:', error);
    return NextResponse.json({ error: 'Failed to sync Google Ads data' }, { status: 500 });
  }
}
