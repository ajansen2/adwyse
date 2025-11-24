import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// API endpoint to look up merchant by shop URL (bypasses RLS)
export async function GET(request: NextRequest) {
  try {
    const shop = request.nextUrl.searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Use service role key to bypass RLS
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

    // Look up store by shop domain (AdWyse schema: each store is its own merchant)
    const { data: storeData, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('shop_domain', shop)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (storeError || !storeData) {
      console.error('Store lookup error:', storeError);
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // In AdWyse, the store IS the merchant - create a merchant object from store data
    const merchantData = {
      id: storeData.id,
      email: storeData.email || '',
      full_name: storeData.store_name || '',
      company: storeData.store_name || '',
      subscription_tier: storeData.subscription_status === 'active' ? 'pro' : storeData.subscription_status === 'trial' ? 'trial' : 'free'
    };

    return NextResponse.json({
      merchant: merchantData,
      store: {
        id: storeData.id,
        store_name: storeData.store_name || shop.replace('.myshopify.com', ''),
        shop_domain: shop,
        email: storeData.email || '',
        subscription_status: storeData.subscription_status || 'inactive',
        trial_ends_at: storeData.trial_ends_at || null,
        store_url: `https://${shop}`,
        shopify_domain: shop,
        status: 'active'
      }
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
