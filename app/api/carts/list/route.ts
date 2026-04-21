import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const merchantId = request.nextUrl.searchParams.get('merchant_id');

    if (!merchantId) {
      return NextResponse.json({ error: 'Missing merchant_id' }, { status: 400 });
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

    // Get active stores for this merchant
    const { data: stores, error: storesError } = await supabase
      .from('stores')
      .select('id')
      .eq('merchant_id', merchantId)
      .eq('status', 'active');

    if (storesError) {
      console.error('Error fetching stores:', storesError);
      return NextResponse.json({ error: 'Failed to fetch stores' }, { status: 500 });
    }

    if (!stores || stores.length === 0) {
      return NextResponse.json({ carts: [] }, { status: 200 });
    }

    // Get abandoned carts for all merchant's stores
    const storeIds = stores.map(store => store.id);
    const { data: carts, error: cartsError } = await supabase
      .from('abandoned_carts')
      .select('*')
      .in('store_id', storeIds)
      .order('abandoned_at', { ascending: false });

    if (cartsError) {
      console.error('Error fetching carts:', cartsError);
      return NextResponse.json({ error: 'Failed to fetch carts' }, { status: 500 });
    }

    return NextResponse.json({ carts: carts || [] }, { status: 200 });
  } catch (error) {
    console.error('Error in /api/carts/list:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
