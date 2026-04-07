import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkSubscription } from '@/lib/check-subscription';

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

    // Check subscription tier to apply data retention limits
    const subscription = await checkSubscription(merchantId);
    const dataRetentionDays = subscription.limits.dataRetentionDays;

    // Calculate date cutoff based on tier
    const dateCutoff = new Date();
    dateCutoff.setDate(dateCutoff.getDate() - dataRetentionDays);

    // Get campaigns for this store, aggregated by campaign name
    // Since campaigns table stores daily data, we need to aggregate
    // Apply tier-based date filter
    const { data: campaigns, error: campaignsError } = await supabase
      .from('adwyse_campaigns')
      .select('*')
      .eq('store_id', merchantId)
      .gte('date', dateCutoff.toISOString().split('T')[0])
      .order('date', { ascending: false });

    if (campaignsError) {
      console.error('❌ Error fetching campaigns:', campaignsError);
      return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
    }

    // Aggregate campaigns by platform_campaign_id (sum up daily data)
    const campaignMap = new Map<string, any>();

    campaigns?.forEach(campaign => {
      const key = campaign.platform_campaign_id;
      if (campaignMap.has(key)) {
        const existing = campaignMap.get(key);
        existing.spend += parseFloat(campaign.spend || 0);
        existing.impressions += campaign.impressions || 0;
        existing.clicks += campaign.clicks || 0;
        existing.conversions += campaign.conversions || 0;
        existing.attributed_revenue += parseFloat(campaign.attributed_revenue || 0);
        existing.attributed_orders += campaign.attributed_orders || 0;
      } else {
        campaignMap.set(key, {
          id: campaign.id,
          platform_campaign_id: campaign.platform_campaign_id,
          campaign_name: campaign.campaign_name,
          status: campaign.status,
          spend: parseFloat(campaign.spend || 0),
          impressions: campaign.impressions || 0,
          clicks: campaign.clicks || 0,
          conversions: campaign.conversions || 0,
          attributed_revenue: parseFloat(campaign.attributed_revenue || 0),
          attributed_orders: campaign.attributed_orders || 0,
          created_at: campaign.created_at,
        });
      }
    });

    // Map to expected format and sanitize all fields to prevent React error #310
    const campaignsWithMetrics = Array.from(campaignMap.values()).map(campaign => {
      const roas = campaign.spend > 0 ? campaign.attributed_revenue / campaign.spend : 0;

      return {
        id: typeof campaign.id === 'string' ? campaign.id : String(campaign.id || ''),
        name: typeof campaign.campaign_name === 'string' ? campaign.campaign_name : String(campaign.campaign_name || 'Unknown'),
        platform: 'facebook', // TODO: store platform in campaigns table
        status: typeof campaign.status === 'string' ? campaign.status : 'active',
        total_spend: Number(campaign.spend) || 0,
        total_revenue: Number(campaign.attributed_revenue) || 0,
        total_orders: Number(campaign.attributed_orders) || 0,
        impressions: Number(campaign.impressions) || 0,
        clicks: Number(campaign.clicks) || 0,
        conversions: Number(campaign.conversions) || 0,
        created_at: typeof campaign.created_at === 'string' ? campaign.created_at : null,
        roas: Number(roas) || 0
      };
    });

    return NextResponse.json({ campaigns: campaignsWithMetrics }, { status: 200 });
  } catch (error) {
    console.error('❌ Campaigns list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
