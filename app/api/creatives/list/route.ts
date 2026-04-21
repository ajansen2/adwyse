import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const limit = parseInt(searchParams.get('limit') || '50');

    if (!storeId) {
      return NextResponse.json({ error: 'Missing store_id' }, { status: 400 });
    }

    // Get top creatives using the helper function
    const { data: topCreatives, error: creativesError } = await supabase.rpc('get_top_creatives', {
      p_store_id: storeId,
      p_start_date: startDate || null,
      p_end_date: endDate || null,
      p_limit: limit
    });

    if (creativesError) {
      console.error('Error fetching top creatives:', creativesError);
      // Fallback to direct query if function doesn't exist
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('ad_creatives')
        .select('*')
        .eq('store_id', storeId)
        .order('attributed_revenue', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        return NextResponse.json({ error: 'Failed to fetch creatives' }, { status: 500 });
      }

      return NextResponse.json({ creatives: fallbackData || [], fatigue: [] });
    }

    // Get creative fatigue indicators
    const { data: fatigueData, error: fatigueError } = await supabase.rpc('detect_creative_fatigue', {
      p_store_id: storeId,
      p_lookback_days: 14
    });

    // Calculate summary stats
    const totalSpend = topCreatives?.reduce((sum: number, c: any) => sum + (c.total_spend || 0), 0) || 0;
    const totalRevenue = topCreatives?.reduce((sum: number, c: any) => sum + (c.total_revenue || 0), 0) || 0;
    const totalOrders = topCreatives?.reduce((sum: number, c: any) => sum + (c.total_orders || 0), 0) || 0;
    const overallROAS = totalSpend > 0 ? totalRevenue / totalSpend : 0;

    return NextResponse.json({
      creatives: topCreatives || [],
      fatigue: fatigueData?.filter((f: any) => f.is_fatigued) || [],
      summary: {
        totalCreatives: topCreatives?.length || 0,
        totalSpend,
        totalRevenue,
        totalOrders,
        overallROAS,
        fatiguedCreatives: fatigueData?.filter((f: any) => f.is_fatigued).length || 0
      }
    });
  } catch (error) {
    console.error('Error in creatives endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
