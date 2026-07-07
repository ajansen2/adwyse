import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify Shopify webhook HMAC signature
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  return crypto.timingSafeEqual(
    Buffer.from(generatedHash),
    Buffer.from(hmacHeader)
  );
}

// GDPR: Shop Redact (Delete All Shop Data)
// Shopify sends this 48 hours after a merchant uninstalls the app
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';

    // Verify HMAC signature
    if (SHOPIFY_API_SECRET && hmacHeader) {
      const isValid = verifyShopifyWebhook(body, hmacHeader);
      if (!isValid) {
        console.error('Invalid webhook signature for shop/redact');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }
    }

    const data = JSON.parse(body);
    console.log('Shop redact webhook received:', {
      shop_id: data.shop_id,
      shop_domain: data.shop_domain,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try both old and new table naming conventions to ensure complete cleanup
    // Look up store in adwyse_stores first (current schema), fallback to stores (legacy)
    let storeId: string | null = null;

    const { data: adwyseStore } = await supabase
      .from('adwyse_stores')
      .select('id')
      .eq('shop_domain', data.shop_domain)
      .single();

    if (adwyseStore) {
      storeId = adwyseStore.id;
    } else {
      const { data: legacyStore } = await supabase
        .from('stores')
        .select('id')
        .eq('shop_domain', data.shop_domain)
        .single();

      if (legacyStore) {
        storeId = legacyStore.id;
      }
    }

    if (storeId) {
      // Delete all data from current (adwyse_*) tables
      await supabase.from('adwyse_campaigns').delete().eq('store_id', storeId);
      await supabase.from('adwyse_orders').delete().eq('store_id', storeId);
      await supabase.from('alerts').delete().eq('store_id', storeId);
      await supabase.from('store_settings').delete().eq('store_id', storeId);
      await supabase.from('store_goals').delete().eq('store_id', storeId);
      await supabase.from('ad_accounts').delete().eq('store_id', storeId);
      await supabase.from('competitor_ads_cache').delete().eq('store_id', storeId);
      await supabase.from('competitor_tracking').delete().eq('store_id', storeId);
      await supabase.from('touchpoints').delete().eq('store_id', storeId);
      await supabase.from('campaign_daily_stats').delete().eq('store_id', storeId);
      await supabase.from('meta_capi_events_log').delete().eq('store_id', storeId);

      // Delete from legacy tables (if they exist)
      await supabase.from('campaigns').delete().eq('store_id', storeId);
      await supabase.from('orders').delete().eq('store_id', storeId);

      // Delete store records
      await supabase.from('adwyse_stores').delete().eq('id', storeId);
      await supabase.from('stores').delete().eq('id', storeId);

      console.log('All shop data deleted for:', data.shop_domain);
    } else {
      console.log('No store found for shop domain:', data.shop_domain);
    }

    return NextResponse.json({
      success: true,
      message: 'Shop data deleted'
    });
  } catch (error) {
    console.error('Error processing shop redact webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
