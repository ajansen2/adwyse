import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

const SHOPIFY_API_SECRET = process.env.SHOPIFY_API_SECRET || '';
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Verify Shopify webhook HMAC signature
function verifyShopifyWebhook(body: string, hmacHeader: string): boolean {
  if (!SHOPIFY_API_SECRET || !hmacHeader) {
    return false;
  }

  const generatedHash = crypto
    .createHmac('sha256', SHOPIFY_API_SECRET)
    .update(body, 'utf8')
    .digest('base64');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(generatedHash),
      Buffer.from(hmacHeader)
    );
  } catch {
    return false;
  }
}

// Unified GDPR Compliance Webhook Handler
// Handles: customers/data_request, customers/redact, shop/redact
export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmacHeader = request.headers.get('x-shopify-hmac-sha256') || '';
    const topic = request.headers.get('x-shopify-topic') || '';

    // Verify HMAC signature
    console.log('🔐 [Webhook] Verifying compliance webhook signature...');
    console.log('🔐 [Webhook] SHOPIFY_API_SECRET present:', !!SHOPIFY_API_SECRET);
    console.log('🔐 [Webhook] HMAC header present:', !!hmacHeader);
    console.log('🔐 [Webhook] Topic:', topic);

    if (!verifyShopifyWebhook(body, hmacHeader)) {
      console.error('❌ [Webhook] Invalid webhook signature for compliance webhook');
      console.error('❌ [Webhook] Secret length:', SHOPIFY_API_SECRET?.length || 0);
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }
    console.log('✅ [Webhook] Signature verified successfully');

    const data = JSON.parse(body);
    console.log(`Compliance webhook received - Topic: ${topic}`, {
      shop_domain: data.shop_domain,
    });

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    switch (topic) {
      case 'customers/data_request': {
        // Customer requests their data
        console.log('Customer data request:', {
          shop_domain: data.shop_domain,
          customer_id: data.customer?.id,
          customer_email: data.customer?.email,
        });
        // AdWyse stores minimal data - acknowledge the request
        // Merchants can export data from the dashboard if needed
        break;
      }

      case 'customers/redact': {
        // Customer requests data deletion
        console.log('Customer redact request:', {
          shop_domain: data.shop_domain,
          customer_id: data.customer?.id,
          customer_email: data.customer?.email,
        });

        if (data.customer?.email) {
          // Anonymize customer email in orders
          const { error } = await supabase
            .from('adwyse_orders')
            .update({
              customer_email: 'redacted@privacy.local',
            })
            .eq('customer_email', data.customer.email);

          if (error) {
            console.error('Error redacting customer data:', error);
          } else {
            console.log('Customer data redacted for:', data.customer.email);
          }
        }
        break;
      }

      case 'shop/redact': {
        // Shop uninstalled - delete all data
        console.log('Shop redact request:', {
          shop_id: data.shop_id,
          shop_domain: data.shop_domain,
        });

        // Find the store
        const { data: store } = await supabase
          .from('adwyse_stores')
          .select('id')
          .eq('shop_domain', data.shop_domain)
          .single();

        if (store) {
          // Delete all associated data (use correct table names)
          await supabase.from('adwyse_insights').delete().eq('store_id', store.id);
          await supabase.from('adwyse_campaigns').delete().eq('store_id', store.id);
          await supabase.from('adwyse_orders').delete().eq('store_id', store.id);
          await supabase.from('adwyse_ad_accounts').delete().eq('store_id', store.id);
          await supabase.from('adwyse_stores').delete().eq('id', store.id);

          console.log('All shop data deleted for:', data.shop_domain);
        }
        break;
      }

      default:
        console.log('Unknown compliance topic:', topic);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error processing compliance webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
