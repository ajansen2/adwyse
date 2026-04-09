import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { scoreCreatives, type CreativeMetrics } from '@/lib/creative-score';
import { requireProFeature } from '@/lib/subscription-tiers';

const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

function generateDemoScored() {
  const demoCreatives = [
    { id: 'c1', name: 'Lifestyle UGC - Beach', spend: 1240, impressions: 145000, clicks: 4350, conversions: 87, revenue: 5220 },
    { id: 'c2', name: 'Product Demo Video', spend: 890, impressions: 98000, clicks: 2450, conversions: 49, revenue: 2940 },
    { id: 'c3', name: 'Founder Story', spend: 670, impressions: 78000, clicks: 1950, conversions: 39, revenue: 2730 },
    { id: 'c4', name: 'Carousel - Best Sellers', spend: 540, impressions: 62000, clicks: 1240, conversions: 24, revenue: 1680 },
    { id: 'c5', name: 'Static - Sale Banner', spend: 430, impressions: 51000, clicks: 765, conversions: 12, revenue: 720 },
    { id: 'c6', name: 'Reel - Quick Tutorial', spend: 380, impressions: 92000, clicks: 1840, conversions: 28, revenue: 1960 },
    { id: 'c7', name: 'Testimonial Compilation', spend: 290, impressions: 45000, clicks: 1125, conversions: 18, revenue: 1080 },
    { id: 'c8', name: 'Cold Audience - Generic', spend: 920, impressions: 110000, clicks: 880, conversions: 6, revenue: 360 },
    { id: 'c9', name: 'Influencer Collab', spend: 750, impressions: 85000, clicks: 2125, conversions: 51, revenue: 3570 },
    { id: 'c10', name: 'Animated Logo Intro', spend: 180, impressions: 38000, clicks: 304, conversions: 3, revenue: 180 },
  ];
  const scored = scoreCreatives(demoCreatives);
  return { isDemo: true, scored };
}

export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');
    if (!storeId) {
      return NextResponse.json({ error: 'store_id required' }, { status: 400 });
    }

    const gate = await requireProFeature(storeId, 'creativeScore');
    if (gate) return gate;

    if (storeId === DEMO_STORE_ID) {
      return NextResponse.json(generateDemoScored());
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Try the helper function first
    const { data: topCreatives } = await supabase.rpc('get_top_creatives', {
      p_store_id: storeId,
      p_start_date: null,
      p_end_date: null,
      p_limit: 100,
    });

    let creatives: any[] = topCreatives || [];

    if (creatives.length === 0) {
      // Fallback: query ad_creatives directly
      const { data: fallback } = await supabase
        .from('ad_creatives')
        .select('*')
        .eq('store_id', storeId)
        .limit(100);
      creatives = fallback || [];
    }

    // Normalize fields (RPC and table use different column names)
    const normalized: (CreativeMetrics & {
      id: string;
      name: string;
      platform?: string;
      thumbnail_url?: string;
    })[] = creatives.map((c: any) => ({
      id: c.id || c.creative_id || '',
      name: c.creative_name || c.name || c.title || 'Untitled',
      platform: c.platform || 'unknown',
      thumbnail_url: c.thumbnail_url || c.image_url,
      spend: parseFloat(c.total_spend || c.spend || 0),
      impressions: parseInt(c.total_impressions || c.impressions || 0, 10),
      clicks: parseInt(c.total_clicks || c.clicks || 0, 10),
      conversions: parseInt(c.total_orders || c.conversions || 0, 10),
      revenue: parseFloat(c.total_revenue || c.attributed_revenue || c.revenue || 0),
    }));

    const scored = scoreCreatives(normalized);

    return NextResponse.json({ isDemo: false, scored });
  } catch (err: any) {
    console.error('Creative score error:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to score creatives' },
      { status: 500 }
    );
  }
}
