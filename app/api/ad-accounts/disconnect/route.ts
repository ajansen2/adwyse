import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

export async function POST(request: NextRequest) {
  try {
    const shop = await getAuthenticatedShop(request);
    if (!shop) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { accountId } = await request.json();

    if (!accountId) {
      return NextResponse.json({ error: 'Account ID required' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Look up the store
    const { data: store } = await supabase
      .from('adwyse_stores')
      .select('id')
      .eq('shop_domain', shop)
      .maybeSingle();

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Delete the ad account (only if it belongs to this store)
    const { error } = await supabase
      .from('ad_accounts')
      .delete()
      .eq('id', accountId)
      .eq('store_id', store.id);

    if (error) {
      console.error('Failed to disconnect ad account:', error);
      return NextResponse.json({ error: 'Failed to disconnect' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
