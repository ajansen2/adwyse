import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const hmac = request.headers.get('x-shopify-hmac-sha256');
    const shop = request.headers.get('x-shopify-shop-domain');
    const topic = request.headers.get('x-shopify-topic');

    console.log('📥 Subscription webhook received:', { shop, topic });

    // Verify HMAC - try multiple secrets
    const secrets = [
      process.env.SHOPIFY_API_SECRET,
      process.env.SHOPIFY_API_SECRET_PRODUCTION,
      process.env.SHOPIFY_API_SECRET_DEV,
      process.env.SHOPIFY_WEBHOOK_SIGNING_SECRET,
    ].filter(Boolean);

    let hmacValid = false;
    if (hmac && secrets.length > 0) {
      for (const secret of secrets) {
        const generatedHmac = crypto
          .createHmac('sha256', secret!)
          .update(body, 'utf8')
          .digest('base64');

        if (generatedHmac === hmac) {
          hmacValid = true;
          break;
        }
      }

      if (!hmacValid) {
        console.error('❌ Invalid HMAC signature for subscription webhook');
        // Still return 200 to prevent Shopify from marking webhook as failing
        return NextResponse.json({ received: true, warning: 'signature_mismatch' }, { status: 200 });
      }
    }

    const data = JSON.parse(body);
    console.log('📦 Subscription data:', JSON.stringify(data, null, 2));

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Find the store by shop domain
    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('id')
      .eq('shop_domain', shop)
      .single();

    if (storeError || !store) {
      console.error('⚠️ Store not found for subscription webhook:', shop);
      // Return 200 anyway - store may not be fully set up yet
      return NextResponse.json({ received: true, warning: 'store_not_found' }, { status: 200 });
    }

    // Update subscription status based on the webhook data
    const status = data.app_subscription?.status?.toLowerCase();
    let subscriptionStatus = 'trial';

    if (status === 'active') {
      subscriptionStatus = 'active';
    } else if (status === 'cancelled' || status === 'expired' || status === 'frozen') {
      subscriptionStatus = 'cancelled';
    } else if (status === 'pending') {
      subscriptionStatus = 'trial';
    }

    console.log('💰 Updating store subscription status to:', subscriptionStatus);

    const { error: updateError } = await supabase
      .from('stores')
      .update({
        subscription_status: subscriptionStatus,
        billing_charge_id: data.app_subscription?.admin_graphql_api_id || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', store.id);

    if (updateError) {
      console.error('⚠️ Failed to update store subscription (non-critical):', updateError);
      // Return 200 anyway - don't let DB errors cause webhook failures
    } else {
      console.log('✅ Store subscription updated successfully');
    }

    return NextResponse.json({ success: true }, { status: 200 });

  } catch (error) {
    console.error('⚠️ Subscription webhook processing error:', error);
    // Always return 200 to prevent Shopify from marking webhook as failing
    return NextResponse.json({ received: true, error: 'processing_error' }, { status: 200 });
  }
}
