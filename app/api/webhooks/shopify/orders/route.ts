import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const hmac = request.headers.get('X-Shopify-Hmac-Sha256');
    const topic = request.headers.get('X-Shopify-Topic');
    const shop = request.headers.get('X-Shopify-Shop-Domain');

    console.log('💰 Order webhook received:', { topic, shop });

    // Verify webhook signature
    if (!hmac || !verifyWebhook(rawBody, hmac)) {
      console.error('❌ Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const orderData = JSON.parse(rawBody);

    // Get checkout token from order (this links it to the abandoned cart)
    const checkoutToken = orderData.checkout_token || orderData.checkout_id;

    if (!checkoutToken) {
      console.log('⚠️  Order has no checkout_token, cannot track recovery');
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Use service role to bypass RLS
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

    // Find the abandoned cart by checkout ID
    const { data: cart, error: findError } = await supabase
      .from('abandoned_carts')
      .select('*')
      .eq('shopify_checkout_id', checkoutToken)
      .single();

    if (findError || !cart) {
      console.log('⚠️  No matching abandoned cart found for checkout:', checkoutToken);
      return NextResponse.json({ success: true }, { status: 200 });
    }

    // Mark cart as recovered
    const { error: updateError } = await supabase
      .from('abandoned_carts')
      .update({
        status: 'recovered',
        recovered_at: new Date().toISOString(),
        recovery_attribution: 'email', // Assume email recovery if cart exists
      })
      .eq('id', cart.id);

    if (updateError) {
      console.error('❌ Error marking cart as recovered:', updateError);
      return NextResponse.json({ error: 'Failed to update cart' }, { status: 500 });
    }

    console.log('✅ Cart marked as recovered:', cart.id, 'Value:', cart.cart_value);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('❌ Orders webhook error:', error);
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
