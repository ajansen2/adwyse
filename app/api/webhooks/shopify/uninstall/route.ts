import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const shop = request.headers.get('X-Shopify-Shop-Domain');

    console.log('🗑️  App uninstall webhook received:', { shop });

    // Verify webhook signature
    if (!hmac || !verifyWebhook(rawBody, hmac)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Get store from database
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

    // Get all stores for this shop (AdWyse uses shop_domain column)
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop);

    if (!stores || stores.length === 0) {
      console.log('⚠️  No stores found for:', shop);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    const storeIds = stores.map(s => s.id);

    // Mark all stores as uninstalled with 30-day retention window
    const purgeAfter = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const { error: updateError } = await supabase
      .from('stores')
      .update({
        subscription_status: 'cancelled',
        access_token: 'revoked',
        is_active: false,
        purge_after: purgeAfter,
        updated_at: new Date().toISOString()
      })
      .in('id', storeIds);

    if (updateError) {
      console.error('❌ Error updating store status:', updateError);
      return NextResponse.json({ error: 'Failed to update store' }, { status: 500 });
    }

    console.log(`[WEBHOOK] topic=app/uninstalled shop=${shop} outcome=cancelled purge_after=${purgeAfter}`);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Uninstall webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify Shopify webhook signature
function verifyWebhook(data: string, hmac: string): boolean {
  const secrets = [
    process.env.SHOPIFY_API_SECRET,
    process.env.SHOPIFY_API_SECRET_PRODUCTION,
    process.env.SHOPIFY_API_SECRET_DEV,
  ].filter(Boolean);

  if (secrets.length === 0) {
    console.error('❌ No Shopify API secrets configured');
    return false;
  }

  // Try each secret until one validates
  for (const secret of secrets) {
    const hash = crypto
      .createHmac('sha256', secret!)
      .update(data, 'utf8')
      .digest('base64');

    if (hash === hmac) {
      return true;
    }
  }

  return false;
}
