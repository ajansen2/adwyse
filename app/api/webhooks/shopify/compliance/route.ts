import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Disable body parsing to get raw body for HMAC verification
export const runtime = 'nodejs';

// GDPR/Privacy compliance webhooks required by Shopify
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const topic = request.headers.get('X-Shopify-Topic');
    const shop = request.headers.get('X-Shopify-Shop-Domain');

    console.log('🔒 Compliance webhook received:', { topic, shop });

    // Verify webhook signature
    if (!hmac || !verifyWebhook(rawBody, hmac)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const payload = JSON.parse(rawBody);

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

    // Handle different compliance webhook topics
    switch (topic) {
      case 'customers/data_request':
        // Customer requested their data - store the request
        console.log('📋 Customer data request:', payload.customer?.id);
        // In a production app, you would:
        // 1. Gather all data for this customer
        // 2. Send it to the merchant
        // 3. Log the request for compliance
        break;

      case 'customers/redact':
        // Customer requested data deletion
        console.log('🗑️  Customer data redaction:', payload.customer?.id);

        // Delete all abandoned carts for this customer email
        if (payload.customer?.email) {
          const { error } = await supabase
            .from('abandoned_carts')
            .delete()
            .eq('customer_email', payload.customer.email);

          if (error) {
            console.error('❌ Error deleting customer data:', error);
          } else {
            console.log('✅ Customer data deleted:', payload.customer.email);
          }
        }
        break;

      case 'shop/redact':
        // Store uninstalled - delete all store data (48 hours after uninstall)
        console.log('🗑️  Shop data redaction:', payload.shop_domain);

        // Get all stores for this shop (AdWyse uses shop_domain)
        const { data: stores } = await supabase
          .from('stores')
          .select('id')
          .eq('shop_domain', payload.shop_domain);

        if (stores && stores.length > 0) {
          const storeIds = stores.map(s => s.id);

          // Delete all abandoned carts
          await supabase
            .from('abandoned_carts')
            .delete()
            .in('store_id', storeIds);

          // Delete all stores
          await supabase
            .from('stores')
            .delete()
            .in('id', storeIds);

          console.log('✅ Shop data deleted:', payload.shop_domain);
        }
        break;

      default:
        console.log('⚠️  Unknown compliance topic:', topic);
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Compliance webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Verify Shopify webhook signature
function verifyWebhook(data: string, hmac: string): boolean {
  const secrets = [
    process.env.SHOPIFY_API_SECRET_PRODUCTION,
    process.env.SHOPIFY_API_SECRET_DEV,
  ].filter(Boolean);

  if (secrets.length === 0) {
    console.error('❌ No Shopify API secrets configured');
    return false;
  }

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
