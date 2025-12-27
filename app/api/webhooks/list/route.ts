import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop') || 'argora-test.myshopify.com';

    // Get store from database
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: store } = await supabase
      .from('stores')
      .select('*')
      .eq('shop_domain', shop)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (!store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // List all webhooks for this store
    const response = await fetch(`https://${shop}/admin/api/2024-01/webhooks.json`, {
      headers: {
        'X-Shopify-Access-Token': store.access_token,
      },
    });

    const data = await response.json();

    return NextResponse.json({
      shop,
      webhooks: data.webhooks || [],
      count: data.webhooks?.length || 0,
    }, { status: 200 });
  } catch (error) {
    console.error('Error listing webhooks:', error);
    return NextResponse.json({ error: 'Failed to list webhooks' }, { status: 500 });
  }
}
