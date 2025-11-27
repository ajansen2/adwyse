import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchFacebookCampaigns } from '@/lib/facebook-ads';

/**
 * Sync Facebook campaign data to database
 * This endpoint fetches campaign spend from Facebook and updates our campaigns table
 */
export async function POST(request: NextRequest) {
  console.log('🚀 [SYNC] Facebook sync started');

  try {
    console.log('🔍 [SYNC] Parsing request body...');
    const body = await request.json();
    const { storeId } = body;
    console.log('🔍 [SYNC] Store ID:', storeId);

    if (!storeId) {
      console.log('❌ [SYNC] No store ID provided');
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    console.log('🔍 [SYNC] Creating Supabase client...');
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

    // Get all active Facebook ad accounts for this store
    console.log('🔍 [SYNC] Fetching ad accounts from database...');
    const { data: adAccounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('store_id', storeId)
      .eq('platform', 'facebook')
      .eq('is_connected', true);

    console.log('🔍 [SYNC] Ad accounts query complete. Found:', adAccounts?.length || 0);

    if (accountsError) {
      console.error('❌ [SYNC] Error fetching ad accounts:', accountsError);
      throw accountsError;
    }

    if (!adAccounts || adAccounts.length === 0) {
      console.log('ℹ️ [SYNC] No Facebook ad accounts found, returning early');
      return NextResponse.json({
        success: true,
        message: 'No Facebook ad accounts connected',
        campaignsSynced: 0,
        totalSpend: 0
      });
    }

    console.log('✅ [SYNC] Found ad accounts:', adAccounts.map(a => ({ id: a.id, name: a.account_name, account_id: a.account_id })));

    let totalCampaignsSynced = 0;
    let totalSpendSynced = 0;

    // Sync campaigns from each ad account
    console.log('🔄 [SYNC] Starting to sync each ad account...');

    for (const account of adAccounts) {
      try {
        console.log(`🔄 [SYNC] Processing account: ${account.account_name || account.account_id}`);
        console.log(`🔄 [SYNC] Account ID: ${account.account_id}`);

        // Fetch campaigns from Facebook (last 30 days)
        let fbCampaigns: any[] = [];
        try {
          console.log(`🔄 [SYNC] Calling Facebook API for campaigns...`);
          fbCampaigns = await fetchFacebookCampaigns(
            account.access_token,
            account.account_id,
            'last_30d'
          );
          console.log(`🔄 [SYNC] Facebook API call complete`);
        } catch (fbError) {
          console.error(`❌ [SYNC] Error fetching campaigns from Facebook:`, fbError);
          // Continue with other accounts
          continue;
        }

        console.log(`📊 [SYNC] Found ${fbCampaigns.length} campaigns on Facebook`);

        // If no campaigns, continue to next account
        if (fbCampaigns.length === 0) {
          console.log(`ℹ️ [SYNC] No campaigns found for account ${account.account_name || account.account_id}`);
          continue;
        }

        // Match campaigns by platform_campaign_id and update spend
        for (const fbCampaign of fbCampaigns) {
          const today = new Date().toISOString().split('T')[0];

          // Find matching campaign in our database by platform_campaign_id and today's date
          const { data: existingCampaigns } = await supabase
            .from('adwyse_campaigns')
            .select('*')
            .eq('store_id', storeId)
            .eq('platform_campaign_id', fbCampaign.id)
            .eq('date', today);

          if (existingCampaigns && existingCampaigns.length > 0) {
            // Update existing campaign for today
            const campaign = existingCampaigns[0];

            await supabase
              .from('adwyse_campaigns')
              .update({
                spend: fbCampaign.spend,
                impressions: fbCampaign.impressions,
                clicks: fbCampaign.clicks,
                conversions: fbCampaign.conversions || 0,
                status: fbCampaign.status?.toLowerCase() || campaign.status,
                updated_at: new Date().toISOString(),
              })
              .eq('id', campaign.id);

            console.log(`✅ Updated campaign: ${fbCampaign.name} ($${fbCampaign.spend})`);
            totalCampaignsSynced++;
            totalSpendSynced += fbCampaign.spend;
          } else {
            // Create new campaign if it doesn't exist
            console.log(`➕ [SYNC] Inserting new campaign: ${fbCampaign.name}`);
            const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
            const { data: newCampaign, error: insertError } = await supabase
              .from('adwyse_campaigns')
              .insert({
                store_id: storeId,
                ad_account_id: account.id,
                platform_campaign_id: fbCampaign.id,
                campaign_name: fbCampaign.name,
                status: fbCampaign.status?.toLowerCase() || 'active',
                date: today,
                spend: fbCampaign.spend,
                impressions: fbCampaign.impressions,
                clicks: fbCampaign.clicks,
                conversions: fbCampaign.conversions || 0,
                attributed_revenue: 0,
                attributed_orders: 0,
              })
              .select()
              .single();

            if (insertError) {
              console.error(`❌ [SYNC] Error inserting campaign ${fbCampaign.name}:`, insertError);
            } else if (newCampaign) {
              console.log(`✅ [SYNC] Created new campaign: ${fbCampaign.name} ($${fbCampaign.spend})`);
              totalCampaignsSynced++;
              totalSpendSynced += fbCampaign.spend;
            } else {
              console.log(`⚠️ [SYNC] Insert returned no data for campaign: ${fbCampaign.name}`);
            }
          }
        }
      } catch (accountError) {
        console.error(`❌ Error syncing account ${account.account_name}:`, accountError);
        // Continue with other accounts even if one fails
      }
    }

    // Recalculate ROAS for all campaigns
    const { data: campaigns } = await supabase
      .from('campaigns')
      .select('id, ad_spend')
      .eq('store_id', storeId);

    if (campaigns) {
      for (const campaign of campaigns) {
        // Count orders attributed to this campaign
        const { data: orders } = await supabase
          .from('orders')
          .select('total_price')
          .eq('store_id', storeId)
          .eq('utm_campaign', campaign.id);

        if (orders) {
          const revenue = orders.reduce((sum, order) => sum + parseFloat(order.total_price), 0);
          const orderCount = orders.length;
          const roas = campaign.ad_spend > 0 ? revenue / campaign.ad_spend : 0;

          await supabase
            .from('campaigns')
            .update({
              revenue,
              orders: orderCount,
              roas,
            })
            .eq('id', campaign.id);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalCampaignsSynced} campaigns with $${totalSpendSynced.toFixed(2)} total spend`,
      campaignsSynced: totalCampaignsSynced,
      totalSpend: totalSpendSynced,
    });
  } catch (error) {
    console.error('❌ Facebook sync error:', error);
    return NextResponse.json({ error: 'Failed to sync Facebook data' }, { status: 500 });
  }
}

/**
 * Trigger sync for all stores (for cron job)
 */
export async function GET(request: NextRequest) {
  try {
    // Verify cron secret to prevent unauthorized access
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
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

    // Get all stores with active Facebook accounts
    const { data: stores } = await supabase
      .from('ad_accounts')
      .select('store_id')
      .eq('platform', 'facebook')
      .eq('status', 'active');

    if (!stores || stores.length === 0) {
      return NextResponse.json({ message: 'No stores to sync' });
    }

    // Get unique store IDs
    const storeIds = [...new Set(stores.map(s => s.store_id))];

    let totalSynced = 0;

    // Sync each store
    for (const storeId of storeIds) {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/sync/facebook`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storeId }),
        });

        if (response.ok) {
          totalSynced++;
        }
      } catch (error) {
        console.error(`❌ Error syncing store ${storeId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced ${totalSynced}/${storeIds.length} stores`,
    });
  } catch (error) {
    console.error('❌ Cron sync error:', error);
    return NextResponse.json({ error: 'Failed to run cron sync' }, { status: 500 });
  }
}
