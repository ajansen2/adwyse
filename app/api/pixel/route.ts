import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Pixel Configuration API
 * Manages pixel settings and provides installation info
 */

// GET - Get pixel config and installation code
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get pixel config
    const { data: config } = await supabase
      .from('pixel_config')
      .select('*')
      .eq('store_id', storeId)
      .single();

    // Get recent events count
    const twentyFourHoursAgo = new Date();
    twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

    const { count: recentEventsCount } = await supabase
      .from('pixel_events')
      .select('*', { count: 'exact', head: true })
      .eq('store_id', storeId)
      .gte('created_at', twentyFourHoursAgo.toISOString());

    // Get event breakdown
    const { data: eventBreakdown } = await supabase
      .from('pixel_events')
      .select('event_type')
      .eq('store_id', storeId)
      .gte('created_at', twentyFourHoursAgo.toISOString());

    const eventCounts: Record<string, number> = {};
    if (eventBreakdown) {
      for (const event of eventBreakdown) {
        eventCounts[event.event_type] = (eventCounts[event.event_type] || 0) + 1;
      }
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://app.adwyse.io';

    // Generate installation snippet
    const installationCode = `<!-- AdWyse Tracking Pixel -->
<script async src="${baseUrl}/api/pixel/script/${storeId}"></script>`;

    // Shopify theme.liquid snippet
    const shopifySnippet = `{% comment %}
  AdWyse Tracking Pixel - Add this before </head> in theme.liquid
{% endcomment %}
<script async src="${baseUrl}/api/pixel/script/${storeId}"></script>

{% comment %}
  Add this to your thank you page / order confirmation to track purchases:
{% endcomment %}
{% if first_time_accessed %}
<script>
  if (window.adwyse) {
    adwyse.identify('{{ customer.email }}');
    adwyse.trackPurchase({
      order_id: '{{ order.id }}',
      order_number: '{{ order.name }}',
      total: {{ order.total_price | divided_by: 100.0 }},
      currency: '{{ order.currency }}'
    });
  }
</script>
{% endif %}`;

    return NextResponse.json({
      success: true,
      config: config || {
        is_enabled: true,
        track_page_views: true,
        track_add_to_cart: true,
        track_checkout: true,
        track_purchase: true
      },
      stats: {
        isVerified: config?.is_verified || false,
        lastEventAt: config?.last_event_at,
        recentEventsCount: recentEventsCount || 0,
        eventBreakdown: eventCounts
      },
      installation: {
        scriptUrl: `${baseUrl}/api/pixel/script/${storeId}`,
        htmlSnippet: installationCode,
        shopifySnippet
      }
    });

  } catch (error) {
    console.error('Pixel config GET error:', error);
    return NextResponse.json({
      error: 'Failed to get pixel config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// POST - Update pixel config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      storeId,
      isEnabled,
      trackPageViews,
      trackAddToCart,
      trackCheckout,
      trackPurchase,
      eventRetentionDays
    } = body;

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabase
      .from('pixel_config')
      .upsert({
        store_id: storeId,
        is_enabled: isEnabled ?? true,
        track_page_views: trackPageViews ?? true,
        track_add_to_cart: trackAddToCart ?? true,
        track_checkout: trackCheckout ?? true,
        track_purchase: trackPurchase ?? true,
        event_retention_days: eventRetentionDays ?? 90,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'store_id'
      });

    if (error) {
      console.error('Error updating pixel config:', error);
      return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Pixel config POST error:', error);
    return NextResponse.json({
      error: 'Failed to update pixel config',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
