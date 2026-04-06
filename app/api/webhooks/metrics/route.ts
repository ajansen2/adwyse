import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const shopDomain = searchParams.get('shop');
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get shop domain if we have store_id
    let shop = shopDomain;
    if (storeId && !shop) {
      const { data: store } = await supabase
        .from('stores')
        .select('shop_domain')
        .eq('id', storeId)
        .single();
      shop = store?.shop_domain;
    }

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop or store_id' }, { status: 400 });
    }

    // Fetch recent webhook metrics
    const { data: metrics, error } = await supabase
      .from('webhook_metrics')
      .select('*')
      .eq('shop_domain', shop)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching webhook metrics:', error);
      return NextResponse.json({ error: 'Failed to fetch metrics' }, { status: 500 });
    }

    // Calculate summary stats
    const totalEvents = metrics?.length || 0;
    const successfulEvents = metrics?.filter(m => m.success).length || 0;
    const failedEvents = totalEvents - successfulEvents;
    const successRate = totalEvents > 0 ? (successfulEvents / totalEvents * 100).toFixed(1) : 100;

    // Get breakdown by topic
    const topicBreakdown: Record<string, { total: number; success: number; failed: number }> = {};
    metrics?.forEach(m => {
      if (!topicBreakdown[m.webhook_topic]) {
        topicBreakdown[m.webhook_topic] = { total: 0, success: 0, failed: 0 };
      }
      topicBreakdown[m.webhook_topic].total++;
      if (m.success) {
        topicBreakdown[m.webhook_topic].success++;
      } else {
        topicBreakdown[m.webhook_topic].failed++;
      }
    });

    // Get recent errors
    const recentErrors = metrics?.filter(m => !m.success).slice(0, 10) || [];

    // Calculate average processing time
    const processingTimes = metrics?.filter(m => m.processing_time_ms).map(m => m.processing_time_ms) || [];
    const avgProcessingTime = processingTimes.length > 0
      ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length)
      : 0;

    return NextResponse.json({
      summary: {
        totalEvents,
        successfulEvents,
        failedEvents,
        successRate: parseFloat(successRate as string),
        avgProcessingTime
      },
      topicBreakdown,
      recentErrors,
      events: metrics || []
    });
  } catch (error) {
    console.error('Error in webhook metrics endpoint:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
