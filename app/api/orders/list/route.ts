import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkSubscription } from '@/lib/check-subscription';
import { getAuthenticatedShop } from '@/lib/verify-session';

export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

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

    // Check subscription tier to apply limits
    const subscription = await checkSubscription(merchantId);
    const dataRetentionDays = subscription.limits.dataRetentionDays;
    const orderLimit = subscription.limits.ordersPerMonth;

    // Calculate date cutoff based on tier
    const dateCutoff = new Date();
    dateCutoff.setDate(dateCutoff.getDate() - dataRetentionDays);

    // For free tier, find which platform the first ad account uses
    // so we only show orders from that platform (+ organic/direct)
    let allowedPlatforms: string[] | null = null;
    if (subscription.tier === 'free') {
      const { data: firstAccount } = await supabase
        .from('adwyse_ad_accounts')
        .select('platform')
        .eq('store_id', merchantId)
        .eq('is_connected', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (firstAccount) {
        // Allow the connected platform + organic/direct (always visible)
        allowedPlatforms = [firstAccount.platform, 'organic', 'direct', ''];
      }
    }

    // In AdWyse schema, merchant_id IS the store_id (each store is its own merchant)
    // Get orders for this store with tier-based limits
    let query = supabase
      .from('orders')
      .select('*')
      .eq('store_id', merchantId)
      .gte('created_at', dateCutoff.toISOString())
      .order('created_at', { ascending: false })
      .limit(Math.min(orderLimit, 1000)); // Cap at tier limit

    if (allowedPlatforms) {
      query = query.in('attributed_platform', allowedPlatforms);
    }

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    // Sanitize orders to ensure all fields are proper types (not objects)
    // This prevents React error #310 when rendering
    const sanitizedOrders = (orders || []).map(order => ({
      ...order,
      // Ensure string fields are strings (not objects)
      customer_email: typeof order.customer_email === 'string' ? order.customer_email : null,
      order_number: typeof order.order_number === 'string' ? order.order_number : String(order.order_number || ''),
      currency: typeof order.currency === 'string' ? order.currency : 'USD',
      attributed_platform: typeof order.attributed_platform === 'string' ? order.attributed_platform : null,
      utm_source: typeof order.utm_source === 'string' ? order.utm_source : null,
      utm_medium: typeof order.utm_medium === 'string' ? order.utm_medium : null,
      utm_campaign: typeof order.utm_campaign === 'string' ? order.utm_campaign : null,
      // Ensure numbers are numbers
      total_price: Number(order.total_price) || 0,
    }));

    return NextResponse.json({
      orders: sanitizedOrders,
      tier: subscription.tier,
      limits: {
        dataRetentionDays,
        ordersPerMonth: orderLimit,
        ordersReturned: orders?.length || 0
      }
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Orders list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
