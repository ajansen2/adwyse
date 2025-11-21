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

    // Get all stores for this merchant
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .eq('merchant_id', merchantId);

    if (storesError || !stores || stores.length === 0) {
      return NextResponse.json({ orders: [] }, { status: 200 });
    }

    const storeIds = stores.map(store => store.id);

    // Get orders for these stores
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('*')
      .in('store_id', storeIds)
      .order('created_at', { ascending: false })
      .limit(100);

    if (ordersError) {
      console.error('❌ Error fetching orders:', ordersError);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json({ orders: orders || [] }, { status: 200 });
  } catch (error) {
    console.error('❌ Orders list error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
