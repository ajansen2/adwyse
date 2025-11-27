import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const merchantId = searchParams.get('merchant_id');

    if (!merchantId) {
      return NextResponse.json({ error: 'Merchant ID required' }, { status: 400 });
    }

    // Use service role to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // In AdWyse schema, merchant_id IS the store_id (each store is its own merchant)
    // Get campaigns for this store (don't filter by status - show all synced campaigns)
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('store_id', merchantId)
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.error('❌ Error fetching campaigns:', campaignsError);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    // Map fields and calculate metrics for each campaign
    const campaignsWithMetrics = campaigns?.map(campaign => {
      // Map database fields to expected API fields
      const totalSpend = campaign.total_spend || campaign.ad_spend || 0;
      const totalRevenue = campaign.total_revenue || campaign.revenue || 0;
      const totalOrders = campaign.total_orders || campaign.orders || 0;
      const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;

      return {
        id: campaign.id,
        name: campaign.campaign_name || campaign.name,
        platform: campaign.source || campaign.platform || 'unknown',
        status: campaign.status || 'active',
        total_spend: totalSpend,
        total_revenue: totalRevenue,
        total_orders: totalOrders,
        impressions: campaign.impressions || 0,
        clicks: campaign.clicks || 0,
        created_at: campaign.created_at,
        roas
      };
    }) || [];

    return NextResponse.json({ campaigns: campaignsWithMetrics }, { status: 200 });
  } catch (error) {
    console.error('❌ Campaigns list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
