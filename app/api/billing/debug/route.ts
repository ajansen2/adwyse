import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Debug endpoint to check what's in the database
// Visit: https://adwyse.ca/api/billing/debug?shop=argora-test.myshopify.com

export async function GET(request: NextRequest) {
  const shop = request.nextUrl.searchParams.get('shop');

  if (!shop) {
    return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Get ALL stores matching this shop domain
  const { data: stores, error } = await supabase
    .from('stores')
    .select('id, shop_domain, store_name, access_token, subscription_status, updated_at, created_at')
    .eq('shop_domain', shop);

  if (error) {
    return NextResponse.json({ error: 'Database error', details: error }, { status: 500 });
  }

  // Mask tokens for security but show enough to debug
  const maskedStores = stores?.map(s => ({
    ...s,
    access_token: s.access_token
      ? `${s.access_token.substring(0, 10)}...${s.access_token.substring(s.access_token.length - 4)}`
      : 'EMPTY',
    token_length: s.access_token?.length || 0,
  }));

  return NextResponse.json({
    shop,
    store_count: stores?.length || 0,
    stores: maskedStores,
  });
}
