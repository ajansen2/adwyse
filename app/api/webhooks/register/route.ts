import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    // Get the store ID from the request
    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID required' }, { status: 400 });
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

    const { data: store, error: storeError } = await supabase
      .from('stores')
      .select('*')
      .eq('id', storeId)
      .single();

    if (storeError || !store) {
      return NextResponse.json({ error: 'Store not found' }, { status: 404 });
    }

    // Extract shop domain from store URL
    const shop = store.shopify_domain;
    const ordersWebhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/orders`;

    console.log('🔧 Registering webhooks for', shop);
    console.log('📍 Orders Webhook URL:', ordersWebhookUrl);

    // Register orders/create webhook (for attribution tracking)
    const ordersCreateWebhook = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'orders/create',
          address: ordersWebhookUrl,
          format: 'json',
        },
      }),
    });

    if (!ordersCreateWebhook.ok) {
      const errorText = await ordersCreateWebhook.text();
      console.error('❌ Failed to register orders/create webhook:', errorText);
      return NextResponse.json({
        error: 'Failed to register webhook',
        details: errorText
      }, { status: ordersCreateWebhook.status });
    }

    const ordersCreateResult = await ordersCreateWebhook.json();
    console.log('✅ orders/create webhook registered:', ordersCreateResult);

    // Register app/uninstalled webhook
    const uninstallWebhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/shopify/uninstall`;
    const uninstallWebhook = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
      method: 'POST',
      headers: {
        'X-Shopify-Access-Token': store.access_token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        webhook: {
          topic: 'app/uninstalled',
          address: uninstallWebhookUrl,
          format: 'json',
        },
      }),
    });

    const uninstallResult = uninstallWebhook.ok ? await uninstallWebhook.json() : null;
    console.log('✅ app/uninstalled webhook registered:', uninstallResult);

    return NextResponse.json({
      success: true,
      webhooks: {
        orders_create: ordersCreateResult,
        app_uninstalled: uninstallResult,
      },
    });
  } catch (error) {
    console.error('❌ Webhook registration error:', error);
    return NextResponse.json({ error: 'Failed to register webhooks' }, { status: 500 });
  }
}
