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

    // Get all stores for this merchant
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .eq('merchant_id', merchantId);

    if (storesError || !stores || stores.length === 0) {
      return NextResponse.json({ campaigns: [] }, { status: 200 });
    }

    const storeIds = stores.map(store => store.id);

    // Get campaigns for these stores
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .in('store_id', storeIds)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (campaignsError) {
      console.error('❌ Error fetching campaigns:', campaignsError);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    // Calculate metrics for each campaign
    const campaignsWithMetrics = campaigns?.map(campaign => {
      const roas = campaign.total_spend > 0 ? campaign.total_revenue / campaign.total_spend : 0;
      return {
        ...campaign,
        roas
      };
    }) || [];

    return NextResponse.json({ campaigns: campaignsWithMetrics }, { status: 200 });
  } catch (error) {
    console.error('❌ Campaigns list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
