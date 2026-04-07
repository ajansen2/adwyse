import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Demo store ID for Adam's store
const DEMO_STORE_ID = '987c61dd-7696-47ca-bf05-37876953b0ca';

interface FunnelStage {
  name: string;
  value: number;
}

/**
 * Generate demo funnel data for Adam's store
 */
function generateDemoFunnelData(): FunnelStage[] {
  return [
    { name: 'Page Views', value: 12847 },
    { name: 'Add to Cart', value: 2156 },
    { name: 'Checkout', value: 987 },
    { name: 'Purchase', value: 412 },
  ];
}

/**
 * Get conversion funnel data from pixel events
 */
export async function GET(request: NextRequest) {
  try {
    const storeId = request.nextUrl.searchParams.get('store_id');
    const days = parseInt(request.nextUrl.searchParams.get('days') || '30');

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
    }

    // Return demo data for Adam's store
    if (storeId === DEMO_STORE_ID) {
      const funnel = generateDemoFunnelData();
      return NextResponse.json({
        funnel,
        conversionRate: (funnel[3].value / funnel[0].value) * 100,
        cartToCheckoutRate: (funnel[2].value / funnel[1].value) * 100,
        checkoutToPurchaseRate: (funnel[3].value / funnel[2].value) * 100,
      });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Calculate date range (0 = all time)
    let query = supabase
      .from('pixel_events')
      .select('event_type, visitor_id')
      .eq('store_id', storeId);

    if (days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      query = query.gte('created_at', startDate.toISOString());
    }

    const { data: events, error } = await query;

    if (error) {
      console.error('Error fetching pixel events:', error);
      return NextResponse.json({ error: 'Failed to fetch funnel data' }, { status: 500 });
    }

    // Count unique visitors for each event type
    const eventCounts: Record<string, Set<string>> = {
      page_view: new Set(),
      add_to_cart: new Set(),
      checkout_started: new Set(),
      purchase: new Set(),
    };

    for (const event of events || []) {
      const type = event.event_type;
      if (eventCounts[type]) {
        eventCounts[type].add(event.visitor_id);
      }
    }

    const pageViews = eventCounts.page_view.size;
    const addToCarts = eventCounts.add_to_cart.size;
    const checkouts = eventCounts.checkout_started.size;
    const purchases = eventCounts.purchase.size;

    // If no pixel events, return empty funnel (other stores will need real data)
    // Demo data is only for Adam's store (handled above)

    // Build funnel array in format dashboard expects
    const funnel: FunnelStage[] = [
      { name: 'Page Views', value: pageViews },
      { name: 'Add to Cart', value: addToCarts },
      { name: 'Checkout', value: checkouts },
      { name: 'Purchase', value: purchases },
    ];

    return NextResponse.json({
      funnel,
      conversionRate: pageViews > 0 ? (purchases / pageViews) * 100 : 0,
      cartToCheckoutRate: addToCarts > 0 ? (checkouts / addToCarts) * 100 : 0,
      checkoutToPurchaseRate: checkouts > 0 ? (purchases / checkouts) * 100 : 0,
    });
  } catch (error) {
    console.error('Error calculating funnel:', error);
    return NextResponse.json(
      { error: 'Failed to calculate funnel data' },
      { status: 500 }
    );
  }
}
