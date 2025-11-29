import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify Shopify webhook HMAC signature
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  if (!SHOPIFY_API_SECRET || !hmacHeader) {
    console.log('❌ [HMAC] Missing secret or header');
    return false;
  }

  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  console.log('🔐 [HMAC] Generated hash:', generatedHash);
  console.log('🔐 [HMAC] Received hash:', hmacHeader);
  console.log('🔐 [HMAC] Match:', generatedHash === hmacHeader);

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHash),
      Buffer.from(hmacHeader)
    );
  } catch (e) {
    console.error('❌ [HMAC] timingSafeEqual error:', e);
    return false;
  }
}

// App uninstall webhook
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
    const shopDomain = request.headers.get('x-shopify-shop-domain') || '';

    // Verify HMAC signature
    console.log('🔐 [Webhook] Verifying uninstall webhook signature...');
    console.log('🔐 [Webhook] SHOPIFY_API_SECRET present:', !!SHOPIFY_API_SECRET);
    console.log('🔐 [Webhook] HMAC header present:', !!hmacHeader);

    if (!verifyShopifyWebhook(body, hmacHeader)) {
      console.error('❌ [Webhook] Invalid webhook signature for uninstall webhook');
      console.error('❌ [Webhook] Secret length:', SHOPIFY_API_SECRET?.length || 0);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    console.log('✅ [Webhook] Signature verified successfully');

    const data = JSON.parse(body);
    console.log('App uninstall webhook received:', {
      shop_domain: shopDomain || data.domain,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const domain = shopDomain || data.domain || data.myshopify_domain;

    // Mark the store as uninstalled (don't delete yet - GDPR shop/redact will handle that)
    const { error } = await supabase
      .from('stores')
      .update({
        is_active: false,
        uninstalled_at: new Date().toISOString(),
      })
      .eq('shop_domain', domain);

    if (error) {
      console.error('Error marking store as uninstalled:', error);
    } else {
      console.log('Store marked as uninstalled:', domain);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing uninstall webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
