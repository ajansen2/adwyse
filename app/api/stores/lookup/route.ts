import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuthenticatedShop } from '@/lib/verify-session';

// API endpoint to look up merchant by shop URL (bypasses RLS)
// Auth: Shopify session token required — validates caller is the shop owner
export async function GET(request: NextRequest) {
  try {
    const authenticatedShop = getAuthenticatedShop(request);
    if (!authenticatedShop) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const shop = request.nextUrl.searchParams.get('shop');

    if (!shop) {
      return NextResponse.json({ error: 'Missing shop parameter' }, { status: 400 });
    }

    // Ensure the authenticated shop matches the requested shop
    if (authenticatedShop !== shop) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
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
    // Map subscription_status to subscription_tier for display
    let subscriptionTier = 'trial'; // Default to trial for new users
    if (storeData.subscription_status === 'active') {
      subscriptionTier = 'pro';
    } else if (storeData.subscription_status === 'cancelled' || storeData.subscription_status === 'past_due') {
      subscriptionTier = 'free';
    }
    // 'trial' status or null/undefined defaults to 'trial'

    const merchantData = {
      id: storeData.id,
      email: storeData.email || '',
      full_name: storeData.store_name || '',
      company: storeData.store_name || '',
      subscription_tier: subscriptionTier
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
