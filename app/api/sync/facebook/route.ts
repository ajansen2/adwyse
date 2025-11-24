import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { fetchFacebookCampaigns } from '@/lib/facebook-ads';

/**
 * Sync Facebook campaign data to database
 * This endpoint fetches campaign spend from Facebook and updates our campaigns table
 */
export async function POST(request: NextRequest) {
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

    // Get all active Facebook ad accounts for this store
    const { data: adAccounts, error: accountsError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('store_id', storeId)
      .eq('platform', 'facebook')
      .eq('is_connected', true);

    if (accountsError) {
      console.error('❌ Error fetching ad accounts:', accountsError);
      throw accountsError;
    }

    if (!adAccounts || adAccounts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No Facebook ad accounts connected',
        campaignsSynced: 0,
        totalSpend: 0
      });
    }

    let totalCampaignsSynced = 0;
    let totalSpendSynced = 0;

    // Sync campaigns from each ad account
    for (const account of adAccounts) {
      try {
        console.log(`🔄 Syncing Facebook account: ${account.account_name || account.account_id}`);

        // Fetch campaigns from Facebook (last 30 days)
        let fbCampaigns = [];
        try {
          fbCampaigns = await fetchFacebookCampaigns(
            account.access_token,
            account.account_id,
            'last_30d'
          );
        } catch (fbError) {
          console.error(`❌ Error fetching campaigns from Facebook:`, fbError);
          // Continue with other accounts
          continue;
        }

        console.log(`📊 Found ${fbCampaigns.length} campaigns on Facebook`);

        // If no campaigns, continue to next account
        if (fbCampaigns.length === 0) {
          console.log(`ℹ️ No campaigns found for account ${account.account_name || account.account_id}`);
          continue;
        }

        // Match campaigns by name and update spend
        for (const fbCampaign of fbCampaigns) {
          // Find matching campaign in our database by name
          const { data: existingCampaigns } = await supabase
            .from('campaigns')
            .select('*')
            .eq('store_id', storeId)
            .eq('source', 'facebook')
            .ilike('campaign_name', fbCampaign.name);

          if (existingCampaigns && existingCampaigns.length > 0) {
            // Update existing campaign
            const campaign = existingCampaigns[0];

            await supabase
              .from('campaigns')
              .update({
                ad_spend: fbCampaign.spend,
                impressions: fbCampaign.impressions,
                clicks: fbCampaign.clicks,
                updated_at: new Date().toISOString(),
              })
              .eq('id', campaign.id);

            console.log(`✅ Updated campaign: ${fbCampaign.name} ($${fbCampaign.spend})`);
            totalCampaignsSynced++;
            totalSpendSynced += fbCampaign.spend;
          } else {
            // Create new campaign if it doesn't exist
            const { data: newCampaign } = await supabase
              .from('campaigns')
              .insert({
                store_id: storeId,
                source: 'facebook',
                campaign_name: fbCampaign.name,
                ad_spend: fbCampaign.spend,
                impressions: fbCampaign.impressions,
                clicks: fbCampaign.clicks,
                orders: 0, // Will be calculated from attributed orders
                revenue: 0, // Will be calculated from attributed orders
              })
              .select()
              .single();

            if (newCampaign) {
              console.log(`➕ Created new campaign: ${fbCampaign.name} ($${fbCampaign.spend})`);
              totalCampaignsSynced++;
              totalSpendSynced += fbCampaign.spend;
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
