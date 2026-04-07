import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('store_id');
    const days = parseInt(searchParams.get('days') || '0'); // 0 = all time

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

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

    // Calculate date range (0 = all time)
    const startDate = days > 0 ? new Date() : new Date('2020-01-01');
    if (days > 0) {
      startDate.setDate(startDate.getDate() - days);
    }

    // Get pixel events for funnel
    const { data: events, error: eventsError } = await supabase
      .from('pixel_events')
      .select('event_type')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString());

    if (eventsError) {
      console.error('Error fetching pixel events:', eventsError);
    }

    // Count events by type
    const eventCounts: Record<string, number> = {
      page_view: 0,
      add_to_cart: 0,
      begin_checkout: 0,
      purchase: 0
    };

    events?.forEach(event => {
      if (eventCounts[event.event_type] !== undefined) {
        eventCounts[event.event_type]++;
      }
    });

    // Get orders for purchase count (more accurate than pixel)
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString());

    if (!ordersError && orders) {
      // Use actual order count for purchases
      eventCounts.purchase = orders.length;
    }

    // Get abandoned carts for checkout count
    const { data: carts, error: cartsError } = await supabase
      .from('abandoned_carts')
      .select('id')
      .eq('store_id', storeId)
      .gte('created_at', startDate.toISOString());

    if (!cartsError && carts) {
      // Add to checkout count (completed + abandoned)
      eventCounts.begin_checkout = Math.max(
        eventCounts.begin_checkout,
        carts.length + eventCounts.purchase
      );
    }

    // Build funnel data
    const funnel = [
      { name: 'Sessions', value: eventCounts.page_view || 0 },
      { name: 'Add to Cart', value: eventCounts.add_to_cart || 0 },
      { name: 'Checkout', value: eventCounts.begin_checkout || 0 },
      { name: 'Purchase', value: eventCounts.purchase || 0 }
    ];

    // If no pixel data, estimate from orders
    if (funnel[0].value === 0 && funnel[3].value > 0) {
      // Estimate based on typical conversion rates
      funnel[0].value = Math.round(funnel[3].value / 0.02); // ~2% conversion
      funnel[1].value = Math.round(funnel[0].value * 0.15); // ~15% add to cart
      funnel[2].value = Math.round(funnel[1].value * 0.5);  // ~50% checkout
    }

    return NextResponse.json({
      funnel,
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
        days
      }
    }, { status: 200 });
  } catch (error) {
    console.error('Funnel API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
