import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedShop } from '@/lib/verify-session';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const shop = getAuthenticatedShop(request);
  if (!shop) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const storeId = request.nextUrl.searchParams.get('store_id');
  if (!storeId) return NextResponse.json({ error: 'store_id required' }, { status: 400 });

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Verify store belongs to this shop
  const { data: store } = await supabase
    .from('adwyse_stores')
    .select('shop_domain')
    .eq('id', storeId)
    .maybeSingle();

  if (!store || store.shop_domain !== shop) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  // Return ad accounts WITHOUT sensitive token fields
  const { data: accounts, error } = await supabase
    .from('adwyse_ad_accounts')
    .select('id, store_id, platform, account_id, account_name, is_connected, sync_status, last_synced_at, last_sync_error, created_at, updated_at')
    .eq('store_id', storeId);

  if (error) {
    return NextResponse.json({ error: 'Failed to load accounts' }, { status: 500 });
  }

  return NextResponse.json({ accounts: accounts || [] });
}
