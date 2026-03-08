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

    // Extract shop domain from store (AdWyse uses shop_domain column)
    const shop = store.shop_domain;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL;

    console.log('🔧 Registering webhooks for', shop);

    // Helper function to register a webhook
    async function registerWebhook(topic: string, endpoint: string) {
      const url = `${baseUrl}${endpoint}`;
      console.log(`📍 Registering ${topic} webhook:`, url);

      const response = await fetch(`https://${shop}/admin/api/2025-01/webhooks.json`, {
        method: 'POST',
        headers: {
          'X-Shopify-Access-Token': store.access_token,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          webhook: {
            topic,
            address: url,
            format: 'json',
          },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        // Check if webhook already exists (409 conflict)
        if (response.status === 409 || errorText.includes('already exists')) {
          console.log(`⚠️ ${topic} webhook already exists`);
          return { exists: true };
        }
        console.error(`❌ Failed to register ${topic} webhook:`, errorText);
        return { error: errorText };
      }

      const result = await response.json();
      console.log(`✅ ${topic} webhook registered`);
      return result;
    }

    // Register all required webhooks for Built for Shopify
    const webhookResults: Record<string, any> = {};

    // Orders webhook (core functionality)
    webhookResults.orders_create = await registerWebhook('orders/create', '/api/webhooks/shopify/orders');

    // App lifecycle
    webhookResults.app_uninstalled = await registerWebhook('app/uninstalled', '/api/webhooks/shopify/uninstall');

    // Customer events (required for Built for Shopify - Ads & Analytics category)
    webhookResults.customers_create = await registerWebhook('customers/create', '/api/webhooks/shopify/customers');
    webhookResults.customers_update = await registerWebhook('customers/update', '/api/webhooks/shopify/customers');
    webhookResults.customers_delete = await registerWebhook('customers/delete', '/api/webhooks/shopify/customers');

    // Compliance webhooks (required)
    webhookResults.customers_data_request = await registerWebhook('customers/data_request', '/api/webhooks/shopify/compliance');
    webhookResults.customers_redact = await registerWebhook('customers/redact', '/api/webhooks/shopify/compliance');
    webhookResults.shop_redact = await registerWebhook('shop/redact', '/api/webhooks/shopify/compliance');

    return NextResponse.json({
      success: true,
      webhooks: webhookResults,
    });
  } catch (error) {
    console.error('❌ Webhook registration error:', error);
    return NextResponse.json({ error: 'Failed to register webhooks' }, { status: 500 });
  }
}
