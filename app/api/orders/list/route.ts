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

    // Check subscription tier to apply limits
    const subscription = await checkSubscription(merchantId);
    const dataRetentionDays = subscription.limits.dataRetentionDays;
    const orderLimit = subscription.limits.ordersPerMonth;

    // Calculate date cutoff based on tier
    const dateCutoff = new Date();
    dateCutoff.setDate(dateCutoff.getDate() - dataRetentionDays);

    // In AdWyse schema, merchant_id IS the store_id (each store is its own merchant)
    // Get orders for this store with tier-based limits
    let query = supabase
      .from('orders')
      .select('*')
      .eq('store_id', merchantId)
      .gte('created_at', dateCutoff.toISOString())
      .order('created_at', { ascending: false })
      .limit(Math.min(orderLimit, 1000)); // Cap at tier limit

    const { data: orders, error: ordersError } = await query;

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({
      orders: orders || [],
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
