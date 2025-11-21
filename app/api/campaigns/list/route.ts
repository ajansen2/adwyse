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
    // Get campaigns for this store
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .eq('store_id', merchantId)
      .eq('status', 'active')
      .order('created_at', { ascending: false});

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
