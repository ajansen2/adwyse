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

    // Find the store by shop domain
    const { data: store } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', data.shop_domain)
      .single();

    if (store) {
      // Delete all data associated with this store
      // Order matters due to foreign key constraints

      // 1. Delete alerts
      await supabase
        .from('alerts')
        .delete()
        .eq('store_id', store.id);

      // 2. Delete store settings
      await supabase
        .from('store_settings')
        .delete()
        .eq('store_id', store.id);

      // 3. Delete campaigns
      await supabase
        .from('campaigns')
        .delete()
        .eq('store_id', store.id);

      // 4. Delete orders
      await supabase
        .from('orders')
        .delete()
        .eq('store_id', store.id);

      // 5. Delete ad accounts
      await supabase
        .from('ad_accounts')
        .delete()
        .eq('store_id', store.id);

      // 6. Delete the store itself
      await supabase
        .from('stores')
        .delete()
        .eq('id', store.id);

      console.log('All shop data deleted for:', data.shop_domain);
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
