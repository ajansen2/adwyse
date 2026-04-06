import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

// Handle GET requests for webhook verification
export async function GET() {
  return NextResponse.json({
    message: 'Shopify webhook endpoint is active',
    timestamp: new Date().toISOString()
  }, { status: 200 });
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const topic = request.headers.get('X-Shopify-Topic');
    const shop = request.headers.get('X-Shopify-Shop-Domain');

    console.log('📨 Webhook received:', { topic, shop });

    // Verify webhook signature for security
    if (!hmac || !verifyWebhook(rawBody, hmac)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData = JSON.parse(rawBody);

    // Only process cart and checkout webhooks
    const validTopics = ['carts/create', 'carts/update', 'checkouts/create', 'checkouts/update'];
    if (!validTopics.includes(topic!)) {
      return NextResponse.json({ message: 'Not a cart/checkout webhook' }, { status: 200 });
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

    // Get the most recent active store for this shop domain (AdWyse uses shop_domain)
    // (handles duplicate stores by using the latest one)
    const { data: stores } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop)
      .order('created_at', { ascending: false })
      .limit(1);

    if (!stores || stores.length === 0) {
      console.error('❌ Store not found:', shop);
      console.log('⚠️  Store not yet configured for:', shop);
      return NextResponse.json({ message: 'Store not configured - webhook acknowledged' }, { status: 200 });
    }

    const store = stores[0];

    // Extract email from various possible locations in the webhook payload
    // Checkouts use customer.email, carts use email directly, some use billing_address.email
    const email = webhookData.email ||
                  webhookData.customer?.email ||
                  webhookData.billing_address?.email;

    // Check if cart has customer email (required for cart recovery)
    if (!email) {
      console.log('⏭️  Skipping cart/checkout without email');
      return NextResponse.json({ message: 'No email provided' }, { status: 200 });
    }

    // Check if cart is actually abandoned (no completed_at date for carts)
    if (webhookData.completed_at) {
      console.log('⏭️  Skipping completed cart');
      return NextResponse.json({ message: 'Cart completed' }, { status: 200 });
    }

    // Calculate cart value
    const cartValue = parseFloat(webhookData.total_price || '0');

    // Cart ID - use token for carts, id for checkouts
    const cartId = webhookData.token || webhookData.id?.toString();

    // Prepare cart items
    const cartItems = webhookData.line_items?.map((item: { product_id?: number; variant_id?: number; title?: string; quantity?: number; price?: string }) => ({
      product_id: item.product_id?.toString(),
      variant_id: item.variant_id?.toString(),
      title: item.title,
      quantity: item.quantity,
      price: parseFloat(item.price || '0'),
    })) || [];

    // Check if cart already exists (to avoid duplicates)
    const { data: existingCart } = await supabase
      .from('abandoned_carts')
      .select('id')
      .eq('shopify_checkout_id', cartId)
      .single();

    if (existingCart) {
      // Update existing cart - non-critical, don't fail webhook on error
      try {
        await supabase
          .from('abandoned_carts')
          .update({
            cart_value: cartValue,
            line_items: cartItems,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingCart.id);

        console.log('✅ Updated existing cart:', existingCart.id);
      } catch (updateError) {
        console.error('⚠️ Non-critical: Failed to update cart:', updateError);
        // Don't fail the webhook - Shopify will retry and cause duplicate issues
      }
    } else {
      // Create new abandoned cart
      try {
        const { data: newCart, error: cartError} = await supabase
          .from('abandoned_carts')
          .insert({
            store_id: store.id,
            checkout_id: cartId,
            shopify_checkout_id: cartId,
            customer_email: email,
            customer_first_name: webhookData.customer?.first_name || null,
            customer_last_name: webhookData.customer?.last_name || null,
            cart_value: cartValue,
            line_items: cartItems,
            abandoned_checkout_url: webhookData.abandoned_checkout_url || null,
            status: 'abandoned',
            abandoned_at: webhookData.updated_at || new Date().toISOString(),
          })
          .select()
          .single();

        if (cartError) {
          // Log but don't fail - returning 500 causes Shopify to mark webhook as failing
          console.error('⚠️ Error saving cart (non-critical):', cartError);
          await logWebhookError(supabase, topic!, shop!, 'cart_insert_error', cartError.message);
        } else {
          console.log('✅ New abandoned cart saved:', newCart.id);
        }
      } catch (insertError) {
        console.error('⚠️ Non-critical: Failed to insert cart:', insertError);
        await logWebhookError(supabase, topic!, shop!, 'cart_insert_exception', String(insertError));
      }
    }

    // Always return 200 to acknowledge receipt - Shopify will mark webhook as failing on 500
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    // Still return 200 to prevent Shopify from marking webhook as failing
    // Critical errors should be monitored via logging/metrics
    return NextResponse.json({
      received: true,
      error: 'Processing error logged'
    }, { status: 200 });
  }
}

// Log webhook errors to database for monitoring
async function logWebhookError(
  supabase: any,
  topic: string,
  shop: string,
  errorType: string,
  errorMessage: string
) {
  try {
    await supabase
      .from('webhook_metrics')
      .insert({
        shop_domain: shop,
        webhook_topic: topic,
        error_type: errorType,
        error_message: errorMessage.substring(0, 1000), // Truncate long messages
        created_at: new Date().toISOString()
      });
  } catch (logError) {
    // Silently fail - don't let logging errors affect webhook
    console.error('Failed to log webhook error:', logError);
  }
}

// Verify Shopify webhook signature
// Supports both DEV and PRODUCTION app secrets + manual webhook signing secret
function verifyWebhook(data: string, hmac: string): boolean {
  const secrets = [
    process.env.SHOPIFY_API_SECRET,              // Primary secret
    process.env.SHOPIFY_API_SECRET_PRODUCTION,   // Production app secret
    process.env.SHOPIFY_API_SECRET_DEV,          // Dev app secret
    process.env.SHOPIFY_WEBHOOK_SIGNING_SECRET,  // Manual webhook signing secret
  ].filter(Boolean); // Remove undefined values

  console.log('🔍 Debug - Secrets available:', secrets.length);
  console.log('🔍 Debug - HMAC from Shopify:', hmac);
  console.log('🔍 Debug - Body length:', data.length);

  if (secrets.length === 0) {
    console.error('❌ No Shopify API secrets configured');
    return false;
  }

  // Try each secret until one validates
  for (let i = 0; i < secrets.length; i++) {
    const secret = secrets[i];
    const hash = crypto
      .createHmac('sha256', secret!)
      .update(data, 'utf8')
      .digest('base64');

    console.log(`🔍 Debug - Secret ${i + 1} calculated hash:`, hash);
    console.log(`🔍 Debug - Match:`, hash === hmac);

    if (hash === hmac) {
      console.log(`✅ Webhook verified with secret ${i + 1}`);
      return true;
    }
  }

  console.error('❌ No secrets matched. Tried', secrets.length, 'secrets');
  return false;
}
